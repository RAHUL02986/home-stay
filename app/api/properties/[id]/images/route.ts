import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import { deleteImage, getPropertyImagePublicId, uploadImage } from '@/lib/uploads/cloudinary';
import Property from '@/models/Property';

const MAX_PROPERTY_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function getCloudinaryError(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const code = 'http_code' in error && typeof error.http_code === 'number'
      ? error.http_code
      : undefined;

    return {
      code,
      userMessage: code === 401 || code === 403
        ? `Cloudinary rejected the credentials (HTTP ${code}). Replace any sample values with your actual cloud name, API key, and API secret in .env.local, then restart the server.`
        : code === 400
          ? 'Cloudinary rejected this image or upload request. Try a JPEG, PNG, or WebP image under 5 MB.'
          : code
            ? `Cloudinary could not accept the upload (HTTP ${code}). Check the server log for details.`
            : 'Could not connect to Cloudinary. Check the server log and your network connection.',
    };
  }

  return {
    code: undefined,
    userMessage: 'Could not upload to Cloudinary. Check the server log for details.',
  };
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

async function removeUploadedAssets(publicIds: string[]) {
  const results = await Promise.allSettled(publicIds.map((publicId) => deleteImage(publicId)));
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Failed to clean up an unused Cloudinary property image', result.reason);
    }
  });
}

async function getHostProperty(propertyId: string, hostId: string) {
  await dbConnect();
  return Property.findOne({ _id: propertyId, host: hostId }).select('images').exec();
}

async function authorizeHostProperty(propertyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: 'Please sign in to manage property images' }, { status: 401 }) };
  }
  if (session.user.role !== 'host') {
    return { error: NextResponse.json({ success: false, error: 'Only hosts can manage property images' }, { status: 403 }) };
  }
  if (!mongoose.isValidObjectId(propertyId)) {
    return { error: NextResponse.json({ success: false, error: 'Invalid property ID' }, { status: 400 }) };
  }

  try {
    const property = await getHostProperty(propertyId, session.user.id);
    if (!property) {
      return { error: NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 }) };
    }
    return { property, hostId: session.user.id };
  } catch (error) {
    console.error('Failed to load host property for image management', error);
    return { error: NextResponse.json({ success: false, error: 'Failed to load property images' }, { status: 500 }) };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authorized = await authorizeHostProperty(id);
  if ('error' in authorized) return authorized.error;
  const { property, hostId } = authorized;

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
  const files = entries;
  if (files.length > MAX_PROPERTY_IMAGES - property.images.length) {
    return NextResponse.json(
      { success: false, error: `A property can have at most ${MAX_PROPERTY_IMAGES} images` },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Use JPEG, PNG, or WebP images' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Each image must be 5 MB or smaller' }, { status: 400 });
    }
  }

  const uploadedImages: Array<{ url: string; publicId: string }> = [];
  try {
    for (const file of files) {
      const publicId = randomUUID();
      const url = await uploadImage(Buffer.from(await file.arrayBuffer()), publicId);
      if (!url) throw new Error('Cloudinary returned no image URL');
      uploadedImages.push({ url, publicId: `homestay/properties/${publicId}` });
    }
  } catch (error) {
    await removeUploadedAssets(uploadedImages.map((image) => image.publicId));
    const failure = getCloudinaryError(error);
    console.error(
      `Cloudinary property image upload failed${failure.code ? ` (HTTP ${failure.code})` : ''}`
    );
    return NextResponse.json({ success: false, error: failure.userMessage }, { status: 502 });
  }

  try {
    const imageUrls = uploadedImages.map((image) => image.url);
    const result = await Property.updateOne(
      { _id: id, host: hostId },
      { $push: { images: { $each: imageUrls } } }
    );
    if (result.matchedCount === 0) {
      await removeUploadedAssets(uploadedImages.map((image) => image.publicId));
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { images: imageUrls } }, { status: 201 });
  } catch (error) {
    await removeUploadedAssets(uploadedImages.map((image) => image.publicId));
    console.error('Failed to save uploaded images to the host property', error);
    return NextResponse.json({ success: false, error: 'Images uploaded but could not be saved to the listing' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authorized = await authorizeHostProperty(id);
  if ('error' in authorized) return authorized.error;
  const { property, hostId } = authorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const parsed = z.object({ imageUrl: z.string().url() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Choose a valid property image' }, { status: 400 });
  }
  if (!property.images.includes(parsed.data.imageUrl)) {
    return NextResponse.json({ success: false, error: 'Image not found on this property' }, { status: 404 });
  }

  try {
    const result = await Property.updateOne(
      { _id: id, host: hostId, images: parsed.data.imageUrl },
      { $pull: { images: parsed.data.imageUrl } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Image was already removed' }, { status: 404 });
    }

    const publicId = getPropertyImagePublicId(parsed.data.imageUrl);
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
      console.error('Image was removed from the listing but Cloudinary cleanup failed', error);
      return NextResponse.json({ success: true, data: { storageCleanup: 'failed' } });
    }
  } catch (error) {
    console.error('Failed to remove host property image', error);
    return NextResponse.json({ success: false, error: 'Failed to remove property image' }, { status: 500 });
  }
}
