import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import {
  storeUserOperation,
  updateFulfilledSession,
  verifyStripePayment,
} from "@/lib/server";
import { uploadFile } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function generatePdf(base64Images: string[]): Promise<Uint8Array> {
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
          chromaSubsampling: "4:4:4",
        })
        .toBuffer();

      const image = await pdfDoc.embedJpg(jpgBuffer);
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      const imageAspectRatio = image.width / image.height;
      const pageAspectRatio = width / height;

      let drawWidth = width;
      let drawHeight = height;

      if (imageAspectRatio > pageAspectRatio) {
        drawHeight = width / imageAspectRatio;
      } else {
        drawWidth = height * imageAspectRatio;
      }

      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

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

  return await pdfDoc.save();
}

export async function POST(req: Request) {
  try {
    const { clientSecret, images, saveToProfile, title } = await req.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 },
      );
    }

    const verificationResult = await verifyStripePayment(clientSecret);
    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error },
        {
          status: 400,
        },
      );
    }

    const pdfBuffer = await generatePdf(images);

    const updateSessionResult = await updateFulfilledSession(clientSecret);
    if (!updateSessionResult.success) {
      return NextResponse.json(
        { error: updateSessionResult.error },
        {
          status: 400,
        },
      );
    }

    const { userId } = await auth();
    if (userId) {
      await uploadFile(Buffer.from(pdfBuffer), {
        userId: userId!,
        tool: "img-to-pdf",
        originalName: title ? title : updateSessionResult.uniqueMetadataId,
        contentType: "application/pdf",
        isTemporary: !saveToProfile,
      });

      if (saveToProfile) {
        await storeUserOperation(
          userId,
          title ? title : updateSessionResult.uniqueMetadataId,
          "img-to-pdf",
          new Date().toISOString(),
        );
      }
    } else {
      await uploadFile(Buffer.from(pdfBuffer), {
        tool: "img-to-pdf",
        originalName: title ? title : updateSessionResult.uniqueMetadataId,
        contentType: "application/pdf",
        isTemporary: true,
      });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title ? title : updateSessionResult.uniqueMetadataId}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
}
