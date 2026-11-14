/**
 * Utility for automatic client-side image compression and resizing.
 * Reduces raw 5-10MB phone/camera photos down to compact, crisp WebP/JPEG assets (~40KB - 90KB)
 * using HTML5 Canvas before uploading or persisting in browser storage.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.82)
}

export interface CompressionResult {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
  } = options;

  // If server-side or if SVG, do not run raster canvas compression
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    file.type === 'image/svg+xml'
  ) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      file,
      dataUrl,
      width: 0,
      height: 0,
      sizeBytes: file.size,
      originalSizeBytes: file.size,
    };
  }

  try {
    // Load image element
    const img = await loadImageFromFile(file);

    // Compute scaled dimensions preserving aspect ratio
    let targetWidth = img.naturalWidth || img.width || 800;
    let targetHeight = img.naturalHeight || img.height || 800;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    // Offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const dataUrl = await readFileAsDataUrl(file);
      return {
        file,
        dataUrl,
        width: targetWidth,
        height: targetHeight,
        sizeBytes: file.size,
        originalSizeBytes: file.size,
      };
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Prefer webp, fallback to jpeg
    let exportMime = 'image/webp';
    let blob: Blob | null = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), exportMime, quality);
    });

    if (!blob || blob.size === 0) {
      exportMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), exportMime, quality);
      });
    }

    if (!blob) {
      const dataUrl = await readFileAsDataUrl(file);
      return {
        file,
        dataUrl,
        width: targetWidth,
        height: targetHeight,
        sizeBytes: file.size,
        originalSizeBytes: file.size,
      };
    }

    // Pick compressed if it's smaller, otherwise keep original
    const shouldUseCompressed = blob.size < file.size;
    const finalBlob = shouldUseCompressed ? blob : file;
    const finalMime = shouldUseCompressed ? exportMime : file.type;
    const ext = finalMime === 'image/webp' ? '.webp' : finalMime === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const newName = `${baseName}${ext}`;

    const compressedFile = new File([finalBlob], newName, {
      type: finalMime,
      lastModified: Date.now(),
    });

    const dataUrl = canvas.toDataURL(finalMime, quality);

    return {
      file: compressedFile,
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      sizeBytes: compressedFile.size,
      originalSizeBytes: file.size,
    };
  } catch (err) {
    console.warn('[ImageCompressor] Fallback to raw file due to canvas error:', err);
    const dataUrl = await readFileAsDataUrl(file);
    return {
      file,
      dataUrl,
      width: 0,
      height: 0,
      sizeBytes: file.size,
      originalSizeBytes: file.size,
    };
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      const blobTarget = file as Blob;
      if (typeof blobTarget?.arrayBuffer === 'function') {
        blobTarget
          .arrayBuffer()
          .then((buf: ArrayBuffer) => {
            const b64 = Buffer.from(buf).toString('base64');
            resolve(`data:${file.type || 'image/jpeg'};base64,${b64}`);
          })
          .catch(() => resolve(''));
        return;
      }
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file as data URL'));
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}
