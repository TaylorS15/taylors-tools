"use client";
import { useToast } from "@/hooks/use-toast";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  FilePreview,
  useFileInputContext,
} from "@/components/file-input-provider";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { Loader2 } from "lucide-react";

export default function FileInput({
  numberOfFiles,
  maxSizeBytes,
  allowedTypes,
  splitAudio,
}: {
  numberOfFiles: number;
  maxSizeBytes: number;
  allowedTypes: string[];
  splitAudio: boolean;
}) {
  const { toast } = useToast();
  const { previews, setPreviews } = useFileInputContext();

  const [uploadingStatus, setUploadingStatus] = useState<"LOADING" | "IDLE">(
    "IDLE",
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

  async function handleFiles(inputFiles: FileList) {
    setUploadingStatus("LOADING");
    const newFiles = Array.from(inputFiles);
    if (!validateFiles(newFiles)) {
      setUploadingStatus("IDLE");
      return;
    }

    let newPreviews: FilePreview[] = [];

    if (!splitAudio) {
      newPreviews = newFiles.map((file, index) => ({
        id: index.toString() + (Math.random() * 1000).toFixed(0),
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
    }

    if (splitAudio) {
      const ffmpeg = ffmpegRef.current;
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg?.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });

      for (const file of newFiles) {
        if (file.type.startsWith("video")) {
          const fileData = new Uint8Array(await file.arrayBuffer());
          await ffmpeg.writeFile(file.name, fileData);
          await ffmpeg.exec([
            "-i",
            file.name,
            "-vn",
            "-acodec",
            "libmp3lame",
            `${file.name}.mp3`,
          ]);
          const audioData = await ffmpeg.readFile(`${file.name}.mp3`);
          const audioBlob = new Blob([audioData], { type: "audio/mp3" });
          const audioFile = new File([audioBlob], `${file.name}.mp3`, {
            type: "audio/mp3",
          });

          const audioDuration: number = await new Promise((resolve) => {
            const audio = new Audio();
            audio.addEventListener("loadedmetadata", () => {
              resolve(audio.duration);
            });
            audio.src = URL.createObjectURL(audioFile);
          });

          newPreviews.push({
            id:
              newPreviews.length.toString() + (Math.random() * 1000).toFixed(0),
            file: audioFile,
            previewUrl: URL.createObjectURL(audioFile),
            length: parseFloat((audioDuration / 60).toFixed(2)),
          });
        } else {
          const audioDuration: number = await new Promise((resolve) => {
            const audio = new Audio();
            audio.addEventListener("loadedmetadata", () => {
              resolve(audio.duration);
            });
            audio.src = URL.createObjectURL(file);
          });

          newPreviews.push({
            id:
              newPreviews.length.toString() + (Math.random() * 1000).toFixed(0),
            file: file,
            previewUrl: URL.createObjectURL(file),
            length: parseFloat((audioDuration / 60).toFixed(2)),
          });
        }
      }
    }

    const combinedPreviews = newPreviews.concat(previews);
    combinedPreviews.sort((a, b) => a.file.name.localeCompare(b.file.name));
    setPreviews(combinedPreviews);
    setUploadingStatus("IDLE");
  }

  function validateFiles(inputFiles: File[]): boolean {
    if (previews.length + inputFiles.length > numberOfFiles) {
      toast({
        title: "Error",
        description: `Maximum ${numberOfFiles} files allowed`,
        variant: "destructive",
      });
      return false;
    }

    const invalidFile = inputFiles.find(
      (file) => !allowedTypes.includes(file.type) || file.size > maxSizeBytes,
    );

    if (invalidFile) {
      toast({
        title: "Error",
        description: !allowedTypes.includes(invalidFile.type)
          ? `${invalidFile.name} is not a valid file type`
          : `${invalidFile.name} exceeds ${maxSizeBytes / 1024 / 1024}MB limit`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  return (
    <div
      className={`${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-zinc-200 hover:border-zinc-300"
      } ${uploadingStatus === "LOADING" ? "border-zinc-200 hover:border-zinc-200" : "cursor-pointer hover:border-zinc-400"} relative h-20 w-full cursor-not-allowed rounded-lg border bg-white
            p-4 transition-colors
        `}
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
        disabled={uploadingStatus !== "IDLE"}
      />

      <div className="flex h-full w-full flex-col items-center justify-center">
        {uploadingStatus === "LOADING" && (
          <>
            <Loader2 className="h-18 w-18 animate-spin text-zinc-500" />
            <p className="mb-2 text-sm text-zinc-500">
              Processing file(s). This may take some time.
            </p>
          </>
        )}
        {uploadingStatus === "IDLE" && (
          <>
            <p className="mb-2 text-sm text-zinc-600">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-zinc-500">
              Maximum file size:{" "}
              {maxSizeBytes >= 1024 ** 3
                ? `${(maxSizeBytes / 1024 ** 3).toFixed(2)}GB`
                : `${maxSizeBytes / 1024 ** 2}MB`}
            </p>
            <p className="text-xs text-zinc-500">
              Maximum {numberOfFiles} file(s)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
