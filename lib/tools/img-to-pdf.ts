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
  base64Images: string[],
  imageOptions: "FIT" | "STRETCH" | "FILL",
) {
  if (!base64Images || !Array.isArray(base64Images)) {
    throw new Error("No images provided");
  }
  if (base64Images.length === 0) {
    throw new Error("No valid image files provided");
  }
  if (base64Images.length > 20) {
    throw new Error("Maximum number of images 20 exceeded");
  }

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < base64Images.length; i++) {
    try {
      // Validate and extract base64 data
      const regexMatch = base64Images[i].match(/^data:([^;]+);base64,/);
      if (!regexMatch) {
        throw new Error(`Invalid base64 image data for image ${i + 1}`);
      }
      const mimeType = regexMatch[1].toLowerCase() ?? null;
      if (!mimeType || !SUPPORTED_MIME_TYPES.has(mimeType)) {
        throw new Error(
          `Unsupported image format for image ${i + 1}: ${mimeType}. Supported formats are: JPEG, JPG, PNG, and WebP`,
        );
      }
      const base64Data = base64Images[i].split(";base64,").pop();
      if (!base64Data) {
        throw new Error(`Invalid base64 image data for image ${i + 1}`);
      }

      const imageBuffer = Buffer.from(base64Data, "base64");
      const jpgBuffer = await sharp(imageBuffer)
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
        `Failed to process image ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  const document = await pdfDoc.save();
  return Buffer.from(document);
}
