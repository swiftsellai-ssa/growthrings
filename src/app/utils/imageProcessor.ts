// Image scaling utility with comprehensive error handling
export const scaleImageToMaxSize = (file: File, maxSize: number = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Invalid file type. Please select an image file.'));
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB absolute limit
      return reject(new Error('File too large. Please select an image smaller than 50MB.'));
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return reject(new Error('Canvas not supported in this browser.'));
    }

    const img = new Image();
    let objectUrl: string;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = () => {
      try {
        if (img.width === 0 || img.height === 0) {
          cleanup();
          return reject(new Error('Invalid image: Image has zero dimensions.'));
        }

        if (img.width > 10000 || img.height > 10000) {
          cleanup();
          return reject(new Error('Image too large: Maximum dimensions are 10000x10000 pixels.'));
        }

        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(width, maxSize);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxSize);
          width = height * aspectRatio;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (!dataUrl || dataUrl === 'data:,') {
          cleanup();
          return reject(new Error('Failed to process image. The image may be corrupted.'));
        }

        cleanup();
        resolve(dataUrl);
      } catch (error) {
        cleanup();
        reject(new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image. The image may be corrupted or in an unsupported format.'));
    };

    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (error) {
      reject(new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};