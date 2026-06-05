import api from "./config";

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadResponse {
  success: boolean;
  data: UploadResult | UploadResult[];
  message?: string;
}

/**
 * Upload a single image to Cloudinary via backend
 */
export async function uploadImage(
  file: File,
  folder?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("image", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await api.post<UploadResponse>("/upload/image", formData, {
    // Do NOT set Content-Type manually — the browser/XHR sets it with the correct
    // multipart boundary when it detects a FormData body. Overriding it without
    // the boundary causes multer to fail parsing the request.
    timeout: 120000, // 2 min — override global 15 s; Cloudinary uploads on VPS can be slow
  });

  if (response.data.success && response.data.data) {
    return Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;
  }

  throw new Error(response.data.message || "Failed to upload image");
}

/**
 * Upload multiple images to Cloudinary via backend
 */
export async function uploadImages(
  files: File[],
  folder?: string
): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await api.post<UploadResponse>("/upload/images", formData, {
    timeout: 120000, // 2 min — override global 15 s
  });

  if (response.data.success && response.data.data) {
    return Array.isArray(response.data.data)
      ? response.data.data
      : [response.data.data];
  }

  throw new Error(response.data.message || "Failed to upload images");
}

/**
 * Upload a document (image or PDF) to Cloudinary via backend
 */
export async function uploadDocument(
  file: File,
  folder?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("document", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await api.post<UploadResponse>(
    "/upload/document",
    formData,
    {
      timeout: 120000, // 2 min — override global 15 s
    }
  );

  if (response.data.success && response.data.data) {
    return Array.isArray(response.data.data)
      ? response.data.data[0]
      : response.data.data;
  }

  throw new Error(response.data.message || "Failed to upload document");
}

/**
 * Upload multiple documents to Cloudinary via backend
 */
export async function uploadDocuments(
  files: File[],
  folder?: string
): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("documents", file);
  });
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await api.post<UploadResponse>(
    "/upload/documents",
    formData,
    {
      timeout: 120000, // 2 min — override global 15 s
    }
  );

  if (response.data.success && response.data.data) {
    return Array.isArray(response.data.data)
      ? response.data.data
      : [response.data.data];
  }

  throw new Error(response.data.message || "Failed to upload documents");
}

/**
 * Delete an image from Cloudinary by public_id
 */
export async function deleteImage(publicId: string): Promise<void> {
  const response = await api.delete<{ success: boolean; message?: string }>(
    `/upload/${publicId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to delete image");
  }
}
