"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { imgbbUploader, type UploadProgress } from "@/lib/imgbb-upload";
import {
  validateImageFile,
  formatFileSize,
  generateImageName,
} from "@/lib/imgbb-utils";
import Image from "next/image";

const Progress = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
  maxSizeText?: string;
  acceptedFormats?: string[];
  className?: string;
  currentImageUrl?: string;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  maxSizeText = "Max 32MB",
  acceptedFormats = ["JPEG", "PNG", "GIF", "WebP"],
  className = "",
  currentImageUrl,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || "");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onUploadError(validation.error || "Invalid file");
      return;
    }

    setUploading(true);
    setUploadProgress(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const imageName = generateImageName(file.name);
      const response = await imgbbUploader.uploadImage(
        file,
        imageName,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setPreviewUrl(response.data.display_url);
      onUploadComplete(response.data.display_url);
    } catch (error) {
      setPreviewUrl("");
      onUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const clearImage = () => {
    setPreviewUrl("");
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-opacity duration-200"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearImage}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading to ImgBB...</span>
                  {uploadProgress && <span>{uploadProgress.percentage}%</span>}
                </div>
                <Progress
                  value={uploadProgress?.percentage || 0}
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          } ${
            uploading ? "opacity-50" : "cursor-pointer hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!uploading ? openFileDialog : undefined}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <div className="space-y-2 w-full max-w-xs">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading to ImgBB...</span>
                    {uploadProgress && (
                      <span>{uploadProgress.percentage}%</span>
                    )}
                  </div>
                  <Progress
                    value={uploadProgress?.percentage || 0}
                    className="h-2"
                  />
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your image here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports {acceptedFormats.join(", ")} • {maxSizeText}
                  </p>
                </div>
                <Button type="button" variant="outline" className="mt-4">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
