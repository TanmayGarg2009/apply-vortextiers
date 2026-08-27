"use client";

import React, { useState, useRef } from "react";
import { UploadData } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import {
  UploadCloud,
  FileText,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface UploadingFileState {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  serverRecord?: UploadData;
}

interface EvidenceUploaderProps {
  applicationId: string;
  questionId?: string | null;
  uploadedFiles: UploadData[];
  onUploadSuccess: (fileRecord: UploadData) => void;
  onFileRemove: (fileId: string) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  allowedTypes?: string[];
  label?: string;
  description?: string;
}

export function EvidenceUploader({
  applicationId,
  questionId,
  uploadedFiles,
  onUploadSuccess,
  onFileRemove,
  maxFiles = 5,
  maxFileSizeMb = 150,
  allowedTypes = ["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm", "application/pdf"],
  label = "Upload Evidence & Media",
  description = "Attach screenshots, clips, or vouches to support your staff application.",
}: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQueue, setUploadingQueue] = useState<UploadingFileState[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const totalCurrentFiles = uploadedFiles.length + uploadingQueue.filter((q) => q.status !== "error").length;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (totalCurrentFiles + files.length > maxFiles) {
      setGlobalError(`You can upload a maximum of ${maxFiles} file(s).`);
      return;
    }

    for (const file of files) {
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        setGlobalError(`"${file.name}" is larger than the ${maxFileSizeMb}MB limit.`);
        continue;
      }

      await startChunkedUpload(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startChunkedUpload = async (file: File) => {
    const queueId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: UploadingFileState = {
      id: queueId,
      file,
      progress: 0,
      status: "uploading",
    };

    setUploadingQueue((prev) => [...prev, newEntry]);

    try {
      // 1. Request Resumable Upload Session
      const sessionRes = await fetch("/api/applications/upload/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          applicationId,
          questionId,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json();
        throw new Error(err.error || "Failed to create upload session.");
      }

      const session = await sessionRes.json();
      const { uploadSessionToken, chunkSize = 2 * 1024 * 1024 } = session;

      // 2. Stream File in Chunks
      const totalBytes = file.size;
      let startByte = 0;

      while (startByte < totalBytes) {
        const endByte = Math.min(startByte + chunkSize, totalBytes);
        const chunkBlob = file.slice(startByte, endByte);

        const chunkRes = await fetch("/api/applications/upload/chunk", {
          method: "PUT",
          headers: {
            "x-upload-session-token": uploadSessionToken,
            "content-range": `bytes ${startByte}-${endByte - 1}/${totalBytes}`,
          },
          credentials: "include",
          body: chunkBlob,
        });

        if (!chunkRes.ok) {
          const err = await chunkRes.json();
          throw new Error(err.error || "Chunk upload failed.");
        }

        const chunkData = await chunkRes.json();
        startByte = endByte;

        const currentProgress = Math.round((startByte / totalBytes) * 100);
        setUploadingQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, progress: currentProgress } : item))
        );

        if (chunkData.status === "COMPLETED") {
          setUploadingQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? { ...item, status: "completed", progress: 100, serverRecord: chunkData.file }
                : item
            )
          );
          if (chunkData.file) {
            onUploadSuccess(chunkData.file);
          }
          break;
        }
      }
    } catch (err: any) {
      setUploadingQueue((prev) =>
        prev.map((item) =>
          item.id === queueId ? { ...item, status: "error", error: err.message || "Upload failed." } : item
        )
      );
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-emerald-400" />;
    if (mimeType.startsWith("video/")) return <Film className="h-5 w-5 text-purple-400" />;
    return <FileText className="h-5 w-5 text-amber-400" />;
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5">
      <div>
        <h4 className="text-sm font-bold text-foreground">{label}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      {/* Dropzone Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-secondary/20 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
      >
        <UploadCloud className="h-10 w-10 text-primary/80 mb-2" />
        <p className="text-sm font-semibold text-foreground">
          Click to browse or drag and drop files
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          PNG, JPEG, WEBP, MP4, WebM, PDF (Max {maxFileSizeMb}MB per file)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {globalError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Uploading Queue List */}
      {uploadingQueue.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 rounded-lg border border-border/70 bg-secondary/30 p-3 text-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {getFileIcon(item.file.type)}
              <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                {item.file.name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ({formatBytes(item.file.size)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {item.status === "uploading" && (
                <span className="text-xs font-mono font-bold text-primary">
                  {item.progress}%
                </span>
              )}
              {item.status === "completed" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              )}
              {item.status === "error" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startChunkedUpload(item.file)}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Retry
                </Button>
              )}
            </div>
          </div>

          {item.status === "uploading" && (
            <Progress value={item.progress} className="h-1.5" />
          )}

          {item.status === "error" && (
            <p className="text-xs text-destructive">{item.error}</p>
          )}
        </div>
      ))}

      {/* Persisted Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 pt-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Attached Evidence ({uploadedFiles.length} / {maxFiles})
          </h5>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/40 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.mimeType)}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {file.filename}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatBytes(file.sizeBytes)} • {file.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onFileRemove(file.id)}
                    className="h-8 text-xs text-destructive hover:bg-destructive/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
