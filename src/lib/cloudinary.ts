import crypto from 'crypto';

export interface CloudinaryCredentials {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

/**
 * Resolves Cloudinary configuration from individual env vars or CLOUDINARY_URL.
 */
export function getCloudinaryCredentials(): CloudinaryCredentials {
  let cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
    try {
      // Format: cloudinary://api_key:api_secret@cloud_name
      const url = new URL(cloudinaryUrl);
      cloudName = cloudName || url.hostname;
      apiKey = apiKey || decodeURIComponent(url.username);
      apiSecret = apiSecret || decodeURIComponent(url.password);
    } catch (err) {
      console.warn('[Cloudinary] Failed to parse CLOUDINARY_URL:', err);
    }
  }

  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  return Boolean(cloudName && apiKey && apiSecret);
}

/**
 * Uploads a buffer directly to Cloudinary using secure signed REST API.
 * Returns the permanent global HTTPS CDN URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  category: string = 'general',
  fileName?: string
): Promise<{ url: string; publicId: string; bytes: number }> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `goatednation/${category}`;

  // Signature required by Cloudinary: SHA-1 of alphabetically sorted parameters concatenated with api_secret
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const base64Payload = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const formData = new FormData();
  formData.append('file', base64Payload);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  if (fileName) {
    formData.append('public_id_prefix', fileName.replace(/\.[^.]+$/, ''));
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(
      errorJson.error?.message || `Cloudinary API returned HTTP ${res.status}`
    );
  }

  const result = (await res.json()) as {
    secure_url: string;
    public_id: string;
    bytes: number;
  };

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
  };
}
