/**
 * Compresses an image File using canvas (handles HEIC, JPEG, PNG, WEBP).
 * PDFs pass through unchanged.
 *
 * On iOS, camera photos arrive as HEIC — the browser can decode them but
 * most backends cannot process them. Drawing through canvas re-encodes them
 * as standard JPEG and also shrinks large camera shots to a manageable size.
 */
export const compressImageFile = (
  file: File,
  maxWidthPx = 1920,
  quality = 0.85
): Promise<File> =>
  new Promise((resolve) => {
    const isImage =
      file.type.startsWith('image/') ||
      /\.(heic|heif)$/i.test(file.name);

    if (!isImage) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => resolve(file);

    reader.onload = (ev) => {
      const img = new Image();

      img.onerror = () => resolve(file);

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const baseName = file.name.replace(/\.[^/.]+$/, '') || 'photo';
            resolve(
              new File([blob], `${baseName}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
            );
          },
          'image/jpeg',
          quality
        );
      };

      img.src = ev.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
