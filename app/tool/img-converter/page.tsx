"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImageConverter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("jpeg");

  const { toast } = useToast();

  const allowedTypes = useMemo(
    () =>
      new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
        "image/tiff",
        "image/avif",
        "image/heic",
        "image/heif",
      ]),
    [],
  );

  function validateFiles(files: File[]): boolean {
    if (previews.length + files.length > 20) {
      toast({
        title: "Error",
        description: "Maximum 20 files allowed",
        variant: "destructive",
      });
      return false;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    const invalidFile = files.find(
      (file) => !allowedTypes.has(file.type) || file.size > maxSizeBytes,
    );

    if (invalidFile) {
      toast({
        title: "Error",
        description: !allowedTypes.has(invalidFile.type)
          ? `${invalidFile.name} is not a valid image file`
          : `${invalidFile.name} exceeds ${5}MB limit`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  function handleFiles(files: FileList) {
    const newFiles = Array.from(files);
    if (!validateFiles(newFiles)) return;

    const newPreviews = newFiles.map((file, index) => ({
      id: index.toString() + (Math.random() * 1000).toFixed(0),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    const combinedFiles = newPreviews.concat(previews);

    combinedFiles.sort((a, b) => a.file.name.localeCompare(b.file.name));

    setPreviews(combinedFiles);
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

  async function handleConversion() {
    if (previews.length === 0) {
      toast({
        title: "Error",
        description: "Please add some images first",
        variant: "destructive",
      });
      return;
    }

    const convertImage = async (preview: FilePreview): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image onto canvas
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);

          // Convert to desired format
          let mimeType: string;
          let quality: number;
          switch (selectedFormat) {
            case "jpeg":
              mimeType = "image/jpeg";
              quality = 0.92;
              break;
            case "webp":
              mimeType = "image/webp";
              quality = 0.9;
              break;
            case "png":
              mimeType = "image/png";
              quality = 1;
              break;
            default:
              mimeType = "image/jpeg";
              quality = 0.92;
          }

          // Convert to blob and download
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Blob creation failed"));
                return;
              }

              // Create download link
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${preview.file.name.split(".")[0]}.${selectedFormat}`;
              document.body.appendChild(a);
              a.click();

              // Cleanup
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve();
            },
            mimeType,
            quality,
          );
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${preview.file.name}`));
        };

        img.src = preview.previewUrl;
      });
    };

    // Convert all images
    try {
      toast({
        title: "Converting",
        description: "Please wait while your images are being converted...",
      });

      await Promise.all(
        previews.map(async (preview) => {
          try {
            await convertImage(preview);
          } catch (error) {
            toast({
              title: "Error",
              description: `Failed to convert ${preview.file.name}`,
              variant: "destructive",
            });
          }
        }),
      );

      toast({
        title: "Success",
        description: "All images have been converted and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong during conversion",
        variant: "destructive",
      });
    }
  }

  // Likely necessary to prevent memory leaks when leaving the page.
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.previewUrl);
      });
    };
  }, []);

  return (
    <main className="flex w-full flex-col-reverse items-center md:flex-row md:items-start">
      <div className="h-[calc(100dvh-14rem)] w-full max-w-xl p-4 md:w-2/5">
        <div className="relative h-full w-full max-w-xl overflow-y-scroll rounded-md bg-zinc-100 px-4 py-1">
          {previews.map((preview, index) => (
            <div key={preview.id} className="group relative my-3">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
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

                    const newPreviews = prev.filter((p) => p.id !== preview.id);
                    return newPreviews;
                  });
                }}
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-gray-600 hover:bg-white hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className={`${""} bg-white/50 backdrop-blur-sm`} />
        </div>
      </div>

      <div className="flex h-max w-full max-w-xl flex-col gap-6 overflow-x-clip p-4 md:h-[calc(100dvh-14rem)] md:w-3/5 md:max-w-none">
        <div className="mt-auto flex h-full flex-col gap-4">
          <h1 className="mb-auto text-center text-xl font-semibold text-blue-600">
            Image Converter
          </h1>

          <div className="flex w-full items-center justify-between gap-6 rounded-lg border border-zinc-200 bg-white p-2">
            <p className="text-sm text-zinc-700">Convert images to:</p>
            <Select onValueChange={setSelectedFormat} defaultValue="jpeg">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col justify-between gap-6">
            <div
              className={`${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } relative w-full rounded-lg
                border-2 border-dashed p-4
                transition-colors`}
              onDragOver={() => {
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

              <div className="flex flex-col items-center">
                <p className="mb-2 text-sm text-gray-600">
                  Drop images here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Maximum file size: {5}MB
                </p>
                <p className="text-xs text-gray-500">Maximum 20 images</p>
              </div>
            </div>

            <button
              onClick={handleConversion}
              className="w-full rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
            >
              Convert
            </button>
          </div>
        </div>
      </div>

      <Toaster />
    </main>
  );
}
