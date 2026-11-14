/**
 * In-browser intelligent background removal utility.
 * Performs perimeter-seeded flood fill and boundary anti-aliasing to make
 * white, studio, or solid backdrops transparent while preserving internal
 * details (white text, drawstrings, logos, and graphics).
 */

export interface BackgroundRemovalOptions {
  tolerance?: number; // Color distance threshold (default: 36, range 10-90)
  feather?: number; // Border anti-aliasing radius (default: 2)
  targetColor?: { r: number; g: number; b: number }; // Optional explicit target color
}

export interface BackgroundRemovalResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  pixelsCleared: number;
}

export async function removeImageBackground(
  imageSource: string | File,
  options: BackgroundRemovalOptions = {}
): Promise<BackgroundRemovalResult> {
  const { tolerance = 36 } = options;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Background removal is only available in a browser environment.');
  }

  // 1. Load image into HTMLImageElement
  const img = await loadImage(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) {
    throw new Error('Invalid image dimensions.');
  }

  // 2. Offscreen Canvas setup
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // 3. Sample perimeter/corners to find background color if not explicitly provided
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  if (options.targetColor) {
    bgR = options.targetColor.r;
    bgG = options.targetColor.g;
    bgB = options.targetColor.b;
  } else {
    // Sample corners & perimeter to calculate dominant background color
    const samples: [number, number, number][] = [];
    const sampleCoords: [number, number][] = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
      [Math.floor(width / 2), 0],
      [Math.floor(width / 2), height - 1],
      [0, Math.floor(height / 2)],
      [width - 1, Math.floor(height / 2)],
    ];

    for (const [sx, sy] of sampleCoords) {
      const idx = (sy * width + sx) * 4;
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }

    // Average the sample colors
    const sum = samples.reduce(
      (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b],
      [0, 0, 0]
    );
    bgR = Math.round(sum[0] / samples.length);
    bgG = Math.round(sum[1] / samples.length);
    bgB = Math.round(sum[2] / samples.length);
  }

  // Color distance calculation (Perceptual weighted Euclidean distance)
  const getDistance = (r: number, g: number, b: number) => {
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
  };

  // 4. Perimeter-seeded BFS Flood Fill
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let queueHead = 0;
  let queueTail = 0;

  // Seed with all border pixels matching background color
  const checkAndSeed = (x: number, y: number) => {
    const pIdx = y * width + x;
    if (visited[pIdx] === 0) {
      const r = data[pIdx * 4];
      const g = data[pIdx * 4 + 1];
      const b = data[pIdx * 4 + 2];
      if (getDistance(r, g, b) <= tolerance) {
        visited[pIdx] = 1;
        queue[queueTail++] = pIdx;
      }
    }
  };

  // Top & bottom edges
  for (let x = 0; x < width; x++) {
    checkAndSeed(x, 0);
    checkAndSeed(x, height - 1);
  }
  // Left & right edges
  for (let y = 0; y < height; y++) {
    checkAndSeed(0, y);
    checkAndSeed(width - 1, y);
  }

  // 5. Run Breadth-First Search
  let pixelsCleared = 0;

  while (queueHead < queueTail) {
    const pIdx = queue[queueHead++];
    const x = pIdx % width;
    const y = Math.floor(pIdx / width);

    // Set pixel alpha to 0 (Fully transparent)
    data[pIdx * 4 + 3] = 0;
    pixelsCleared++;

    // 4 cardinal neighbors
    if (x + 1 < width) {
      const nIdx = pIdx + 1;
      if (visited[nIdx] === 0) {
        if (getDistance(data[nIdx * 4], data[nIdx * 4 + 1], data[nIdx * 4 + 2]) <= tolerance) {
          visited[nIdx] = 1;
          queue[queueTail++] = nIdx;
        }
      }
    }
    if (x - 1 >= 0) {
      const nIdx = pIdx - 1;
      if (visited[nIdx] === 0) {
        if (getDistance(data[nIdx * 4], data[nIdx * 4 + 1], data[nIdx * 4 + 2]) <= tolerance) {
          visited[nIdx] = 1;
          queue[queueTail++] = nIdx;
        }
      }
    }
    if (y + 1 < height) {
      const nIdx = pIdx + width;
      if (visited[nIdx] === 0) {
        if (getDistance(data[nIdx * 4], data[nIdx * 4 + 1], data[nIdx * 4 + 2]) <= tolerance) {
          visited[nIdx] = 1;
          queue[queueTail++] = nIdx;
        }
      }
    }
    if (y - 1 >= 0) {
      const nIdx = pIdx - width;
      if (visited[nIdx] === 0) {
        if (getDistance(data[nIdx * 4], data[nIdx * 4 + 1], data[nIdx * 4 + 2]) <= tolerance) {
          visited[nIdx] = 1;
          queue[queueTail++] = nIdx;
        }
      }
    }
  }

  // 6. Anti-Aliasing Feathering along the cutout boundary
  // Softens outer edges so clothing doesn't have hard pixellated white borders
  const featherRange = 16;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pIdx = y * width + x;
      // If this pixel is not cleared, but neighbors a cleared pixel:
      if (visited[pIdx] === 0) {
        const hasClearedNeighbor =
          visited[pIdx - 1] === 1 ||
          visited[pIdx + 1] === 1 ||
          visited[pIdx - width] === 1 ||
          visited[pIdx + width] === 1;

        if (hasClearedNeighbor) {
          const r = data[pIdx * 4];
          const g = data[pIdx * 4 + 1];
          const b = data[pIdx * 4 + 2];
          const dist = getDistance(r, g, b);
          if (dist > tolerance && dist < tolerance + featherRange) {
            const alphaFactor = (dist - tolerance) / featherRange;
            data[pIdx * 4 + 3] = Math.round(255 * Math.max(0.3, Math.min(1, alphaFactor)));
          }
        }
      }
    }
  }

  // 7. Write back to canvas
  ctx.putImageData(imgData, 0, 0);

  // Export as transparent PNG Data URL
  const transparentDataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create transparent image blob'));
    }, 'image/png');
  });

  return {
    dataUrl: transparentDataUrl,
    blob,
    width,
    height,
    pixelsCleared,
  };
}

function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = '';
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image for background removal: ${err}`));
    };
  });
}
