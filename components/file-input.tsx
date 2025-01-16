"use client";
import { useToast } from "@/hooks/use-toast";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useFileInputContext } from "@/components/file-input-provider";
import { Toaster } from "@/components/ui/toaster";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import loadFfmpeg from "@/lib/ffmpeg";

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
  const { files, setFiles, previews, setPreviews } = useFileInputContext();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg>();

  async function handleFiles(inputFiles: FileList) {
    const newFiles = Array.from(inputFiles);
    if (!validateFiles(newFiles)) return;

    const newPreviews = newFiles.map((file, index) => ({
      id: index.toString() + (Math.random() * 1000).toFixed(0),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (splitAudio) {
      ffmpegRef.current = await loadFfmpeg();
      console.log(ffmpegRef.current);
    }

    const combinedPreviews = newPreviews.concat(previews);
    combinedPreviews.sort((a, b) => a.file.name.localeCompare(b.file.name));
    setPreviews(combinedPreviews);

    const combinedFiles = newFiles.concat(files);
    combinedFiles.sort((a, b) => a.name.localeCompare(b.name));
    setFiles(combinedFiles);
  }

  function validateFiles(inputFiles: File[]): boolean {
    if (files.length + inputFiles.length > numberOfFiles) {
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
          : "border-gray-300 hover:border-gray-400"
      } relative w-full cursor-pointer rounded-lg
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
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-500">
          Maximum file size:{" "}
          {maxSizeBytes >= 1024 ** 3
            ? `${(maxSizeBytes / 1024 ** 3).toFixed(2)}GB`
            : `${maxSizeBytes / 1024 ** 2}MB`}
        </p>
        <p className="text-xs text-gray-500">Maximum {numberOfFiles} file(s)</p>
      </div>
      <Toaster />
    </div>
  );
}
