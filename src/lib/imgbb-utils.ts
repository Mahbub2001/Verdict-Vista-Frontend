import { imgbbUploader } from "./imgbb-upload";

export async function testImgBBUpload() {
  try {
    const testImageBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    console.log("Testing ImgBB upload...");
    const result = await imgbbUploader.uploadBase64(
      testImageBase64,
      "test-image"
    );

    console.log("✅ ImgBB upload test successful!");
    console.log("Response:", {
      url: result.data.display_url,
      size: result.data.size,
      id: result.data.id,
    });

    return {
      success: true,
      url: result.data.display_url,
      data: result.data,
    };
  } catch (error) {
    console.error("❌ ImgBB upload test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 32MB" };
  }

  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];

  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: JPEG, PNG, GIF, WebP, BMP, TIFF`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateImageName(originalName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName ? originalName.split(".").pop() : "png";
  return `debate-image-${timestamp}-${random}.${extension}`;
}
