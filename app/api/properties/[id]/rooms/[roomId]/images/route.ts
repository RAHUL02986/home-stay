import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { deleteImage, getRoomImagePublicId, uploadImage } from '@/lib/uploads/cloudinary';
import Property from '@/models/Property';
import Room from '@/models/Room';

const MAX_ROOM_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

async function authorizeRoom(propertyId: string, roomId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: 'Please sign in to manage room images' }, { status: 401 }) };
  }
  if (session.user.role !== 'host') {
    return { error: NextResponse.json({ success: false, error: 'Only hosts can manage room images' }, { status: 403 }) };
  }
  if (!mongoose.isValidObjectId(propertyId) || !mongoose.isValidObjectId(roomId)) {
    return { error: NextResponse.json({ success: false, error: 'Invalid property or room ID' }, { status: 400 }) };
  }

  try {
    await dbConnect();
    const property = await Property.findOne({ _id: propertyId, host: session.user.id }).select('_id').lean();
    if (!property) {
      return { error: NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 }) };
    }

    const room = await Room.findOne({ _id: roomId, property: property._id }).select('_id images').lean();
    if (!room) {
      return { error: NextResponse.json({ success: false, error: 'Room not found on this property' }, { status: 404 }) };
    }
    return { room, hostId: session.user.id };
  } catch (error) {
    console.error('Failed to authorize host room image management', error);
    return { error: NextResponse.json({ success: false, error: 'Failed to load room images' }, { status: 500 }) };
  }
}

async function removeUploadedAssets(publicIds: string[]) {
  const results = await Promise.allSettled(publicIds.map((publicId) => deleteImage(publicId)));
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Failed to clean up an unused Cloudinary room image', result.reason);
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { id, roomId } = await params;
  const authorized = await authorizeRoom(id, roomId);
  if ('error' in authorized) return authorized.error;
  const { room } = authorized;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Image uploads are not configured. Add the Cloudinary credentials to .env.local and restart the server.' },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Choose image files to upload' }, { status: 400 });
  }
  const entries = formData.getAll('images');
  if (entries.length === 0 || !entries.every((entry): entry is File => entry instanceof File)) {
    return NextResponse.json({ success: false, error: 'Choose valid image files to upload' }, { status: 400 });
  }
  if (entries.length > MAX_ROOM_IMAGES - (room.images?.length || 0)) {
    return NextResponse.json(
      { success: false, error: `A room type can have at most ${MAX_ROOM_IMAGES} images` },
      { status: 400 }
    );
  }
  for (const file of entries) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Use JPEG, PNG, or WebP images' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Each image must be 5 MB or smaller' }, { status: 400 });
    }
  }

  const uploadedImages: Array<{ url: string; publicId: string }> = [];
  try {
    for (const file of entries) {
      const filename = randomUUID();
      const url = await uploadImage(
        Buffer.from(await file.arrayBuffer()),
        filename,
        `homestay/rooms/${roomId}`
      );
      uploadedImages.push({ url, publicId: `homestay/rooms/${roomId}/${filename}` });
    }
  } catch (error) {
    await removeUploadedAssets(uploadedImages.map((image) => image.publicId));
    console.error('Cloudinary room image upload failed', error);
    return NextResponse.json({ success: false, error: 'Could not upload room images. Check the server log and try again.' }, { status: 502 });
  }

  try {
    const imageUrls = uploadedImages.map((image) => image.url);
    const result = await Room.updateOne(
      { _id: roomId, property: id },
      { $push: { images: { $each: imageUrls } } }
    );
    if (result.matchedCount === 0) {
      await removeUploadedAssets(uploadedImages.map((image) => image.publicId));
      return NextResponse.json({ success: false, error: 'Room not found on this property' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { images: imageUrls } }, { status: 201 });
  } catch (error) {
    await removeUploadedAssets(uploadedImages.map((image) => image.publicId));
    console.error('Failed to save uploaded images to the room', error);
    return NextResponse.json({ success: false, error: 'Images uploaded but could not be saved to the room' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { id, roomId } = await params;
  const authorized = await authorizeRoom(id, roomId);
  if ('error' in authorized) return authorized.error;
  const { room } = authorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = z.object({ imageUrl: z.string().url() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Choose a valid room image' }, { status: 400 });
  }
  if (!room.images?.includes(parsed.data.imageUrl)) {
    return NextResponse.json({ success: false, error: 'Image not found on this room' }, { status: 404 });
  }

  try {
    const result = await Room.updateOne(
      { _id: roomId, property: id, images: parsed.data.imageUrl },
      { $pull: { images: parsed.data.imageUrl } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Image was already removed' }, { status: 404 });
    }

    const publicId = getRoomImagePublicId(parsed.data.imageUrl, roomId);
    if (!publicId) {
      return NextResponse.json({ success: true, data: { storageCleanup: 'not_applicable' } });
    }
    try {
      const deletion = await deleteImage(publicId);
      return NextResponse.json({
        success: true,
        data: { storageCleanup: deletion.result === 'ok' || deletion.result === 'not found' ? 'deleted' : 'failed' },
      });
    } catch (error) {
      console.error('Room image was removed from the listing but Cloudinary cleanup failed', error);
      return NextResponse.json({ success: true, data: { storageCleanup: 'failed' } });
    }
  } catch (error) {
    console.error('Failed to remove host room image', error);
    return NextResponse.json({ success: false, error: 'Failed to remove room image' }, { status: 500 });
  }
}
