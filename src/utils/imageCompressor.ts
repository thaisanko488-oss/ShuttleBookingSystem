/**
 * Image compressor and attachment utilities for Thai Sanko News & Announcements.
 * Efficiently compresses large screenshots and camera photos using HTML5 Canvas
 * so that document payloads remain lightweight and well within Firestore limits.
 */

export interface ProcessedAttachmentResult {
  dataUrl: string;
  sizeStr: string;
  thumbnailDataUrl?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Compresses an image file to JPEG with max 1280px dimension and 0.75 quality.
 * Reduces 1-5MB screenshots down to 40-90 KB while preserving crisp text readability.
 */
export async function compressImageFile(file: File): Promise<ProcessedAttachmentResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();

      img.onload = () => {
        try {
          const MAX_DIM = 1280;
          let { width, height } = img;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          // Main compressed image canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({
              dataUrl: rawDataUrl,
              sizeStr: formatFileSize(file.size)
            });
            return;
          }

          // Fill white background to prevent transparent PNGs from turning black
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with 0.75 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

          // Calculate approximate byte size of compressed base64
          const base64Content = compressedDataUrl.split(',')[1] || '';
          const compressedBytes = Math.round((base64Content.length * 3) / 4);

          // Generate lightweight thumbnail (max 320px) for super-fast card rendering
          let thumbnailDataUrl: string | undefined;
          try {
            const thumbMax = 320;
            let tw = width;
            let th = height;
            if (tw > thumbMax || th > thumbMax) {
              if (tw > th) {
                th = Math.round((th * thumbMax) / tw);
                tw = thumbMax;
              } else {
                tw = Math.round((tw * thumbMax) / th);
                th = thumbMax;
              }
            }
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = Math.max(1, tw);
            thumbCanvas.height = Math.max(1, th);
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
              thumbCtx.fillStyle = '#ffffff';
              thumbCtx.fillRect(0, 0, tw, th);
              thumbCtx.drawImage(img, 0, 0, tw, th);
              thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.65);
            }
          } catch {
            thumbnailDataUrl = compressedDataUrl;
          }

          resolve({
            dataUrl: compressedDataUrl,
            sizeStr: formatFileSize(compressedBytes),
            thumbnailDataUrl
          });
        } catch {
          // Fallback to original if canvas processing encounters any error
          resolve({
            dataUrl: rawDataUrl,
            sizeStr: formatFileSize(file.size)
          });
        }
      };

      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          sizeStr: formatFileSize(file.size)
        });
      };

      img.src = rawDataUrl;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a non-image file (e.g. PDF) as a Data URL.
 */
export async function readFileAsDataUrl(file: File): Promise<ProcessedAttachmentResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '';
      resolve({
        dataUrl,
        sizeStr: formatFileSize(file.size)
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
