import { NextResponse } from "next/server";
import {
  getUserCredits,
  storeUserOperation,
  updateFulfilledSession,
  updateUserCredits,
  verifyStripePayment,
} from "@/lib/server";
import { uploadS3File } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { generatePdf } from "@/lib/tools/img-to-pdf";

export async function POST(req: Request) {
  try {
    const { clientSecret, images, saveToProfile, title, selectedImageFit } =
      await req.json();

    if (
      !images ||
      !Array.isArray(images) ||
      (selectedImageFit !== "FIT" &&
        selectedImageFit !== "STRETCH" &&
        selectedImageFit !== "FILL")
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let userCredits = 0;
    const { userId } = await auth();

    if (clientSecret !== "") {
      const verificationResult = await verifyStripePayment(clientSecret);
      if (!verificationResult.success) {
        return NextResponse.json(
          { error: verificationResult.error },
          {
            status: 400,
          },
        );
      }
    } else {
      if (!userId) {
        return NextResponse.json(
          { error: "User not signed in" },
          {
            status: 400,
          },
        );
      }

      const result = await getUserCredits(userId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          {
            status: 400,
          },
        );
      }

      if (result.result < 7) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          {
            status: 400,
          },
        );
      }

      userCredits = result.result;
    }

    const pdfBuffer = await generatePdf(images, selectedImageFit);

    const uniqueMetadataId = crypto.randomUUID();

    const sqlResult = await storeUserOperation(
      userId ?? "anonymous",
      title ? title : uniqueMetadataId,
      "img-to-pdf",
      new Date().toISOString(),
    );
    if (!sqlResult.success) {
      return NextResponse.json(
        { error: sqlResult.error },
        {
          status: 400,
        },
      );
    }

    const s3Result = await uploadS3File(Buffer.from(pdfBuffer), {
      userId: userId ?? undefined,
      tool: "img-to-pdf",
      originalName: title ? title : uniqueMetadataId,
      contentType: "application/pdf",
      isTemporary: userId ? !saveToProfile : true,
    });
    if (!s3Result.success) {
      return NextResponse.json(
        { error: s3Result.error },
        {
          status: 400,
        },
      );
    }

    if (clientSecret !== "") {
      const updateSessionResult = await updateFulfilledSession(
        clientSecret,
        uniqueMetadataId,
      );
      if (!updateSessionResult.success) {
        return NextResponse.json(
          { error: updateSessionResult.error },
          {
            status: 400,
          },
        );
      }
    } else {
      await updateUserCredits(userId ?? "", userCredits - 7);
    }

    return NextResponse.json({
      link: s3Result.result,
      downloadCode: sqlResult.result,
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
