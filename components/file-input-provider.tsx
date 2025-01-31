"use client";
import { createContext, useContext, useEffect, useState } from "react";

export interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
  length?: number;
}

type FileInputContextValue = {
  previews: FilePreview[];
  setPreviews: (
    previews: FilePreview[] | ((prev: FilePreview[]) => FilePreview[]),
  ) => void;
};

const FileInputContext = createContext<FileInputContextValue | undefined>(
  undefined,
);

export const useFileInputContext = () => {
  const context = useContext(FileInputContext);
  if (!context) {
    throw new Error(
      "useFileInputContext must be used within a FileInputProvider",
    );
  }
  return context;
};

export default function FileInputProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.previewUrl);
      });
    };
  }, []);

  return (
    <FileInputContext.Provider
      value={{
        previews,
        setPreviews,
      }}
    >
      {children}
    </FileInputContext.Provider>
  );
}
