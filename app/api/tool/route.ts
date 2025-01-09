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
import { imgToPdfOptionsSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { clientSecret, options } = await req.json();

    let validatedOptions = undefined;

    switch (options.type) {
      case "img-to-pdf":
        validatedOptions = imgToPdfOptionsSchema.parse(options);
        break;
      default:
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let userCredits = undefined;
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

    const processToolOperation = async () => {
      switch (validatedOptions.type) {
        case "img-to-pdf":
          return await generatePdf(
            validatedOptions.images,
            validatedOptions.selectedImageFit,
          );
        default:
          return null;
      }
    };

    const toolOutput = await processToolOperation();
    if (!toolOutput) {
      return NextResponse.json(
        {
          error:
            "Failed to process tool operation. Please try again or contact support.",
        },
        { status: 500 },
      );
    }

    const uniqueMetadataId = crypto.randomUUID();
    const sqlResult = await storeUserOperation(
      userId ?? "anonymous",
      validatedOptions.title || uniqueMetadataId,
      validatedOptions.type,
      new Date().toISOString(),
      !validatedOptions.saveToProfile,
    );

    if (!sqlResult.success) {
      return NextResponse.json({ error: sqlResult.error }, { status: 400 });
    }

    const s3Result = await uploadS3File(toolOutput, {
      userId: userId ?? undefined,
      tool: options.type,
      originalName: options.title || uniqueMetadataId,
      contentType: "application/pdf",
      isTemporary: userId ? !options.saveToProfile : true,
    });
    if (!s3Result.success) {
      return NextResponse.json({ error: s3Result.error }, { status: 400 });
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
      await updateUserCredits(userId ?? "", userCredits! - 7);
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
