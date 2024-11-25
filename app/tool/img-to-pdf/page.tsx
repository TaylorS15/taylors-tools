"use client";
import {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  DragEvent,
  useCallback,
  useMemo,
} from "react";
import { X, AlertCircle } from "lucide-react";
import StripeCheckout from "@/components/StripeCheckout";
import StripeProvider from "@/components/StripeProvider";

interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImagesToPdf() {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = useMemo(
    () => new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]),
    [],
  );

  function validateFiles(files: File[]): boolean {
    if (previews.length + files.length > 20) {
      setError(`Maximum 20 files allowed`);
      return false;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    const invalidFile = files.find(
      (file) => !allowedTypes.has(file.type) || file.size > maxSizeBytes,
    );

    if (invalidFile) {
      setError(
        !allowedTypes.has(invalidFile.type)
          ? `${invalidFile.name} is not a valid image file`
          : `${invalidFile.name} exceeds ${5}MB limit`,
      );
      return false;
    }

    return true;
  }

  function handleFiles(files: FileList) {
    const newFiles = Array.from(files);
    if (!validateFiles(newFiles)) return;

    const newPreviews = newFiles.map((file, index) => ({
      id: index.toString() + Math.random().toString(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    const combinedFiles = newPreviews.concat(previews);

    combinedFiles.sort((a, b) => a.file.name.localeCompare(b.file.name));

    setPreviews(combinedFiles);
    setError(null);
  }

  const formatSize = useCallback((bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.previewUrl);
      });
    };
  }, []);

  return (
    <main className="flex w-full flex-col-reverse items-center md:flex-row md:items-start">
      <div className="h-[calc(100dvh-18rem)] w-full max-w-xl p-4 md:w-2/5">
        <div className="h-full w-full max-w-xl overflow-y-scroll rounded-md bg-zinc-100 p-4">
          {previews.map((preview, index) => (
            <div key={preview.id} className="group relative my-3">
              <div className="aspect-[1/1.4] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={preview.previewUrl}
                  alt={preview.file.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-100"
                />
              </div>
              <div className="absolute left-0 top-0 flex h-7 w-max items-center gap-2 bg-white/60 px-2 py-1.5 text-xs text-gray-500">
                <p
                  className="truncate text-xs text-gray-900"
                  title={preview.file.name}
                >
                  {preview.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatSize(preview.file.size)}
                </p>
              </div>
              <p className="absolute bottom-0 left-0 flex h-7 w-max items-center rounded-bl-lg bg-white/60 px-2 py-1.5 text-xs text-gray-500">
                {index + 1} of {previews.length}
              </p>
              <button
                onClick={() => {
                  setPreviews((prev) => {
                    const fileToRemove = prev.find((p) => p.id === preview.id);
                    if (fileToRemove) {
                      URL.revokeObjectURL(fileToRemove.previewUrl);
                    }
                    return prev.filter((p) => p.id !== preview.id);
                  });
                }}
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-gray-600 hover:bg-white hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-max w-full flex-col justify-between p-4 md:h-[calc(100dvh-18rem)] md:w-3/5">
        <div className="mb-4 w-full text-left">
          <h1 className="mb-6 text-center text-lg font-semibold text-blue-600">
            Upload Images
          </h1>
          <div className="flex w-full flex-col gap-3">
            <p>- Crop and rotate images before uploading.</p>
            <p>- Images are sorted by name</p>
          </div>
        </div>
        <div
          className={`${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          } relative w-full rounded-lg
            border-2 border-dashed p-8
        transition-colors`}
          onDragOver={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => {
            setIsDragging(false);
          }}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={[...allowedTypes].join(",")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) {
                handleFiles(e.target.files);
              }
              e.target.value = "";
            }}
          />

          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-600">
              Drop images here or click to browse
            </p>
            <p className="text-xs text-gray-500">Maximum file size: {5}MB</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <StripeProvider
          stripeOptions={{ mode: "payment", currency: "usd", amount: 1000 }}
        >
          <StripeCheckout />
        </StripeProvider>
      </div>
    </main>
  );
}
