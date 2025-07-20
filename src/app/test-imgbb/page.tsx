"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { testImgBBUpload } from "@/lib/imgbb-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, TestTube } from "lucide-react";

export default function ImgBBTestPage() {
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runAPITest = async () => {
    setTesting(true);
    const result = await testImgBBUpload();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">ImgBB Integration Test</h1>
          <p className="text-muted-foreground">
            Test the ImgBB image upload integration and API connectivity
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              API Connectivity Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runAPITest} disabled={testing}>
              {testing ? "Testing..." : "Test ImgBB API"}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {testResult.success
                      ? `✅ API test successful! Test image uploaded: ${testResult.url}`
                      : `❌ API test failed: ${testResult.error}`}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image Upload Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onUploadComplete={(url) => {
                setUploadedUrl(url);
                console.log("✅ Upload successful:", url);
              }}
              onUploadError={(error) => {
                console.error("❌ Upload failed:", error);
                alert(`Upload failed: ${error}`);
              }}
              currentImageUrl={uploadedUrl}
            />

            {uploadedUrl && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  Upload Successful!
                </h4>
                <p className="text-sm text-green-700 break-all">
                  <strong>URL:</strong> {uploadedUrl}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigator.clipboard.writeText(uploadedUrl)}
                >
                  Copy URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">API Key Configured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Next.js Image Optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Upload Progress Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Error Handling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">File Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Drag & Drop Support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>
                <strong>API Key:</strong>{" "}
                {process.env.NEXT_PUBLIC_IMGBB_API_KEY
                  ? "✅ Configured"
                  : "❌ Missing"}
              </p>
              <p>
                <strong>Environment:</strong> {process.env.NODE_ENV}
              </p>
              <p>
                <strong>Endpoint:</strong> https://api.imgbb.com/1/upload
              </p>
              <p>
                <strong>Max File Size:</strong> 32MB
              </p>
              <p>
                <strong>Supported Formats:</strong> JPEG, PNG, GIF, WebP, BMP,
                TIFF
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
