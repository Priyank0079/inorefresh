/**
 * Image upload utility functions
 */

export interface ImagePreview {
  file: File;
  preview: string;
  name: string;
  size: number;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 40 * 1024 * 1024; // 40MB
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 40MB limit. Current size: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate document file (image or PDF)
 */
export function validateDocumentFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit. Current size: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Create preview URL for image file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Failed to create image preview"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Create preview for multiple image files
 */
export async function createImagePreviews(
  files: File[]
): Promise<ImagePreview[]> {
  const previews = await Promise.all(
    files.map(async (file) => {
      const preview = await createImagePreview(file);
      return {
        file,
        preview,
        name: file.name,
        size: file.size,
      };
    })
  );

  return previews;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf";
}

/**
 * Validate image aspect ratio.
 * targetRatio defaults to 16/9. tolerance is ±8% of that ratio.
 */
export function validateImageRatio(
  file: File,
  targetRatio: number = 16 / 9,
  tolerance: number = 0.08
): Promise<{ valid: boolean; error?: string }> {
  const isSquare = Math.abs(targetRatio - 1) < 0.01;
  const is16x9 = Math.abs(targetRatio - 16 / 9) < 0.01;
  const ratioLabel = isSquare ? "1:1 (square)" : is16x9 ? "16:9" : `${targetRatio.toFixed(2)}:1`;
  const exampleDims = isSquare ? "1080×1080 px" : is16x9 ? "1200×675 px" : "";

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.width / img.height;
      if (Math.abs(ratio - targetRatio) <= tolerance) {
        resolve({ valid: true });
      } else {
        resolve({
          valid: false,
          error: `Image must be ${ratioLabel} ratio${exampleDims ? ` (e.g. ${exampleDims})` : ""}. Your image is ${img.width}×${img.height} px (${ratio.toFixed(2)}:1). Please crop or resize it before uploading.`,
        });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: "Failed to read image dimensions." });
    };
    img.src = url;
  });
}

/**
 * Compress and center-crop image to a square — use for product main images
 * so they always display without cropping in the 1:1 UI container.
 */
export function compressToSquare(
  file: File,
  size: number = 1080,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Failed to get canvas context")); return; }
        // Center-crop: take the largest centered square from the source image
        const srcSize = Math.min(img.width, img.height);
        const srcX = (img.width - srcSize) / 2;
        const srcY = (img.height - srcSize) / 2;
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Failed to compress image")); return; }
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image before upload (optional optimization)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      resolve(file); // Return original if not an image
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
