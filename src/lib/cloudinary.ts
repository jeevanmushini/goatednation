import crypto from 'crypto';

export interface CloudinaryCredentials {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
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
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

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

  return { cloudName, apiKey, apiSecret, uploadPreset };
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryCredentials();
  const hasValidSecret = Boolean(apiSecret && !apiSecret.includes('*'));
  return Boolean(cloudName && ((apiKey && hasValidSecret) || uploadPreset));
}

/**
 * Uploads a buffer directly to Cloudinary using signed or unsigned REST API.
 * Returns the permanent global HTTPS CDN URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  category: string = 'general',
  fileName?: string
): Promise<{ url: string; publicId: string; bytes: number }> {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryCredentials();

  if (!cloudName) {
    throw new Error('Cloudinary cloudName missing.');
  }

  const base64Payload = `data:${mimeType};base64,${buffer.toString('base64')}`;
  const formData = new FormData();
  formData.append('file', base64Payload);

  const hasValidSecret = Boolean(apiKey && apiSecret && !apiSecret.includes('*'));

  if (hasValidSecret && apiKey && apiSecret) {
    // 1. Signed API Upload
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `goatednation/${category}`;

    const params: Record<string, string> = {
      folder,
      timestamp: String(timestamp),
    };

    if (fileName) {
      params.public_id_prefix = fileName.replace(/\.[^.]+$/, '');
    }

    // Sort parameters alphabetically per Cloudinary specification
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    Object.entries(params).forEach(([k, v]) => {
      formData.append(k, v);
    });
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
  } else if (uploadPreset) {
    // 2. Unsigned Preset Upload
    formData.append('upload_preset', uploadPreset);
    if (fileName) {
      formData.append('public_id_prefix', fileName.replace(/\.[^.]+$/, ''));
    }
  } else {
    throw new Error(
      'Cloudinary API secret is masked (contains **********). Please unmask the API secret or copy the full CLOUDINARY_URL from your Cloudinary dashboard.'
    );
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
