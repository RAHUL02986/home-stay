// lib/uploads/cloudinary.ts
import { type UploadApiOptions, v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  fileBuffer: Buffer,
  filename: string,
  folder = 'homestay/properties'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: UploadApiOptions = {
      folder,
      public_id: filename.replace(/\.[^/.]+$/, ''),
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
    };
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error);
        else if (!result?.secure_url) reject(new Error('Cloudinary returned no image URL'));
        else resolve(result.secure_url);
      })
      .end(fileBuffer);
  });
}

export async function deleteImage(publicId: string): Promise<{ result?: string }> {
  return cloudinary.uploader.destroy(publicId);
}

function getImagePublicId(imageUrl: string, folder: 'properties' | 'rooms', roomId?: string): string | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return null;

  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'res.cloudinary.com' ||
    url.pathname.split('/')[1] !== cloudName
  ) {
    return null;
  }

  const pathSegments = url.pathname.split('/').filter(Boolean);
  const folderIndex = pathSegments.indexOf('homestay');
  if (
    folderIndex < 0 ||
    pathSegments[folderIndex + 1] !== folder ||
    (folder === 'rooms' && pathSegments[folderIndex + 2] !== roomId)
  ) {
    return null;
  }

  const publicIdSegments = pathSegments.slice(folderIndex);
  const lastIndex = publicIdSegments.length - 1;
  publicIdSegments[lastIndex] = publicIdSegments[lastIndex].replace(/\.[^.]+$/, '');
  return publicIdSegments.join('/');
}

export function getPropertyImagePublicId(imageUrl: string): string | null {
  return getImagePublicId(imageUrl, 'properties');
}

export function getRoomImagePublicId(imageUrl: string, roomId: string): string | null {
  return getImagePublicId(imageUrl, 'rooms', roomId);
}

export default cloudinary;