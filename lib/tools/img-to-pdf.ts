"use server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function generatePdf(
  files: File[],
  imageOptions: "FIT" | "STRETCH" | "FILL",
) {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    try {
      // Get the file's mime type
      const mimeType = file.type.toLowerCase();

      if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
        throw new Error(
          `Unsupported image format for file ${file.name}: ${mimeType}. Supported formats are: JPEG, JPG, PNG, and WebP`,
        );
      }

      const fileBuffer = await file.arrayBuffer();
      const jpgBuffer = await sharp(fileBuffer)
        .jpeg({
          quality: 100,
          chromaSubsampling: "4:2:0",
        })
        .toBuffer();

      const image = await pdfDoc.embedJpg(jpgBuffer);
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const imageAspectRatio = image.width / image.height;
      const pageAspectRatio = width / height;

      let drawWidth: number;
      let drawHeight: number;
      let x: number;
      let y: number;

      switch (imageOptions) {
        case "STRETCH":
          drawWidth = width;
          drawHeight = height;
          x = 0;
          y = 0;
          break;

        case "FILL":
          if (imageAspectRatio > pageAspectRatio) {
            drawHeight = height;
            drawWidth = height * imageAspectRatio;
          } else {
            drawWidth = width;
            drawHeight = width / imageAspectRatio;
          }
          x = (width - drawWidth) / 2;
          y = (height - drawHeight) / 2;
          break;

        case "FIT":
        default:
          if (imageAspectRatio > pageAspectRatio) {
            drawWidth = width;
            drawHeight = width / imageAspectRatio;
          } else {
            drawHeight = height;
            drawWidth = height * imageAspectRatio;
          }
          x = (width - drawWidth) / 2;
          y = (height - drawHeight) / 2;
          break;
      }

      page.drawImage(image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    } catch (error) {
      throw new Error(
        `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  const document = await pdfDoc.save();
  return {
    buffer: Buffer.from(document),
    type: "application/pdf",
  };
}
