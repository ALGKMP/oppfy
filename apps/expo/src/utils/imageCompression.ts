import * as ImageManipulator from "expo-image-manipulator";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageManipulator.SaveFormat;
}

export interface ImageCompressionConfig {
  post: CompressionOptions;
  profilePicture: CompressionOptions;
  thumbnail: CompressionOptions;
}

// Intelligent compression settings based on use case
const COMPRESSION_CONFIG: ImageCompressionConfig = {
  post: {
    maxWidth: 1080,
    maxHeight: 1080,
    quality: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  profilePicture: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.6,
    format: ImageManipulator.SaveFormat.JPEG,
  },
};

/**
 * Compresses an image with intelligent settings based on use case and original dimensions
 */
export const compressImage = async (
  uri: string,
  type: keyof ImageCompressionConfig = "post",
  customOptions?: Partial<CompressionOptions>,
): Promise<{ uri: string; width: number; height: number; size: number }> => {
  const config = COMPRESSION_CONFIG[type];
  const options = { ...config, ...customOptions };

  // Get original image info first to make intelligent decisions
  const originalResponse = await fetch(uri);
  const originalBlob = await originalResponse.blob();
  const originalSize = originalBlob.size;

  // Get image dimensions
  const originalInfo = await ImageManipulator.manipulateAsync(uri, [], {
    format: ImageManipulator.SaveFormat.JPEG,
  });

  // Apply intelligent compression based on original image characteristics
  const intelligentOptions = getOptimalCompressionSettings(
    originalInfo.width,
    originalInfo.height,
    type,
    originalSize,
  );

  // Merge intelligent settings with custom options, prioritizing custom
  const finalOptions = { ...intelligentOptions, ...customOptions };

  // Calculate optimal resize dimensions
  const resizeActions: ImageManipulator.Action[] = [];

  if (finalOptions.maxWidth || finalOptions.maxHeight) {
    const shouldResize =
      (finalOptions.maxWidth && originalInfo.width > finalOptions.maxWidth) ||
      (finalOptions.maxHeight && originalInfo.height > finalOptions.maxHeight);

    if (shouldResize) {
      let newWidth = originalInfo.width;
      let newHeight = originalInfo.height;

      // Calculate new dimensions maintaining aspect ratio
      if (finalOptions.maxWidth && newWidth > finalOptions.maxWidth) {
        const ratio = finalOptions.maxWidth / newWidth;
        newWidth = finalOptions.maxWidth;
        newHeight = Math.round(newHeight * ratio);
      }

      if (finalOptions.maxHeight && newHeight > finalOptions.maxHeight) {
        const ratio = finalOptions.maxHeight / newHeight;
        newHeight = finalOptions.maxHeight;
        newWidth = Math.round(newWidth * ratio);
      }

      resizeActions.push({
        resize: { width: newWidth, height: newHeight },
      });
    }
  }

  // Apply compression
  const result = await ImageManipulator.manipulateAsync(uri, resizeActions, {
    compress: finalOptions.quality ?? 0.8,
    format: finalOptions.format ?? ImageManipulator.SaveFormat.JPEG,
  });

  // Get compressed file size
  const compressedResponse = await fetch(result.uri);
  const compressedBlob = await compressedResponse.blob();

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size: compressedBlob.size,
  };
};

/**
 * Get optimal compression settings based on original image characteristics
 */
export const getOptimalCompressionSettings = (
  originalWidth: number,
  originalHeight: number,
  type: keyof ImageCompressionConfig = "post",
  originalFileSize?: number,
): CompressionOptions => {
  const baseConfig = COMPRESSION_CONFIG[type];
  const imageArea = originalWidth * originalHeight;
  const megapixels = imageArea / (1024 * 1024);

  // Base quality from config
  let quality = baseConfig.quality ?? 0.8;

  // Adjust quality based on image size - larger images need more compression
  if (megapixels > 12) {
    // Very large images (>12MP) - aggressive compression
    quality = Math.max(0.5, quality - 0.3);
  } else if (megapixels > 8) {
    // Large images (8-12MP) - more compression
    quality = Math.max(0.6, quality - 0.2);
  } else if (megapixels > 4) {
    // Medium-large images (4-8MP) - moderate compression
    quality = Math.max(0.7, quality - 0.1);
  } else if (megapixels < 1) {
    // Small images - preserve more quality
    quality = Math.min(0.9, quality + 0.1);
  }

  // Also consider file size if provided
  if (originalFileSize) {
    const fileSizeMB = originalFileSize / (1024 * 1024);

    if (fileSizeMB > 10) {
      // Very large files need more compression
      quality = Math.max(0.5, quality - 0.1);
    } else if (fileSizeMB > 5) {
      // Large files need some additional compression
      quality = Math.max(0.6, quality - 0.05);
    }
  }

  // For profile pictures, be more aggressive with large images
  if (type === "profilePicture" && megapixels > 2) {
    quality = Math.max(0.6, quality - 0.1);
  }

  return {
    ...baseConfig,
    quality: Math.round(quality * 100) / 100, // Round to 2 decimal places
  };
};

/**
 * Calculate compression savings
 */
export const calculateCompressionSavings = (
  originalSize: number,
  compressedSize: number,
): { savedBytes: number; savedPercentage: number } => {
  const savedBytes = originalSize - compressedSize;
  const savedPercentage = (savedBytes / originalSize) * 100;

  return {
    savedBytes,
    savedPercentage: Math.round(savedPercentage),
  };
};

/**
 * Format file size for logging
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * Validate if compression was beneficial (sometimes very small images get larger when compressed)
 */
export const isCompressionBeneficial = (
  originalSize: number,
  compressedSize: number,
): boolean => {
  // If compressed size is more than 95% of original, compression wasn't beneficial
  return compressedSize < originalSize * 0.95;
};
