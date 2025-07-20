export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ImgBBUploader {
  private apiKey: string;
  private baseUrl = "https://api.imgbb.com/1/upload";

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error("ImgBB API key not found in environment variables");
    }
    this.apiKey = apiKey;
  }

  async uploadImage(
    file: File,
    name?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImgBBResponse> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("File must be an image"));
        return;
      }

      const maxSize = 32 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error("File size must be less than 32MB"));
        return;
      }

      const formData = new FormData();
      formData.append("key", this.apiKey);
      formData.append("image", file);

      if (name) {
        formData.append("name", name);
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress: UploadProgress = {
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response: ImgBBResponse = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error("Upload failed: " + xhr.responseText));
            }
          } catch (error) {
            reject(new Error("Invalid response from ImgBB"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout"));
      });

      xhr.open("POST", this.baseUrl);
      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });
  }

  async uploadBase64(
    base64: string,
    name?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImgBBResponse> {
    return new Promise((resolve, reject) => {
      const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");

      const formData = new FormData();
      formData.append("key", this.apiKey);
      formData.append("image", cleanBase64);

      if (name) {
        formData.append("name", name);
      }

      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress: UploadProgress = {
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            };
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response: ImgBBResponse = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error("Upload failed: " + xhr.responseText));
            }
          } catch (error) {
            reject(new Error("Invalid response from ImgBB"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout"));
      });

      xhr.open("POST", this.baseUrl);
      xhr.timeout = 60000;
      xhr.send(formData);
    });
  }
}

export const imgbbUploader = new ImgBBUploader();
