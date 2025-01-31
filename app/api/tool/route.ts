import { NextRequest, NextResponse } from "next/server";
import {
  getFileDuration,
  getToolPrice,
  getUserCredits,
  storeUserOperation,
  updateFulfilledSession,
  updateUserCredits,
  updateUserTotalOperations,
  verifyStripePayment,
} from "@/lib/server";
import { uploadS3File } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { generatePdf } from "@/lib/tools/img-to-pdf";
import { generateTranscript } from "@/lib/tools/audio-to-transcript";
import {
  audioToTranscriptRequestSchema,
  imgToPdfRequestSchema,
} from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const clientSecret = formData.get("clientSecret");
    const files = formData.getAll("files");
    const options = JSON.parse(formData.get("options") as string);

    let validatedRequest = undefined;

    switch (options.type) {
      case "img-to-pdf":
        validatedRequest = imgToPdfRequestSchema.parse({
          clientSecret: clientSecret,
          files: files,
          options: options,
        });
        break;

      case "audio-to-transcript":
        validatedRequest = audioToTranscriptRequestSchema.parse({
          clientSecret: clientSecret,
          files: files,
          options: options,
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let userCredits: number | undefined;
    let fileDurationMinutes: number | undefined;

    const { userId } = await auth();

    switch (validatedRequest.options.type) {
      case "audio-to-transcript":
        const audioDurationResult = await getFileDuration(
          validatedRequest.files[0] as File,
        );
        if (!audioDurationResult.success) {
          return NextResponse.json(
            { error: audioDurationResult.error },
            {
              status: 400,
            },
          );
        }
        fileDurationMinutes = audioDurationResult.result;
        break;
      case "img-to-pdf":
        break;
      default:
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const toolPriceResult = await getToolPrice(
      validatedRequest.options.type,
      fileDurationMinutes,
    );
    if (!toolPriceResult.success) {
      return NextResponse.json(
        { error: toolPriceResult.error },
        {
          status: 400,
        },
      );
    }

    if (validatedRequest.clientSecret) {
      const verificationResult = await verifyStripePayment(
        validatedRequest.clientSecret,
        toolPriceResult.result.pricingSingle,
      );
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

      const userCreditsResult = await getUserCredits(userId);
      if (!userCreditsResult.success) {
        return NextResponse.json(
          { error: userCreditsResult.error },
          {
            status: 400,
          },
        );
      }

      if (userCreditsResult.result < toolPriceResult.result.pricingCredits) {
        return NextResponse.json(
          { error: "Insufficient credits" },
          {
            status: 400,
          },
        );
      }

      userCredits = userCreditsResult.result;
    }

    const processToolOperation = async () => {
      switch (validatedRequest.options.type) {
        case "img-to-pdf":
          return await generatePdf(
            validatedRequest.files as string[],
            validatedRequest.options.selectedImageFit,
          );
        case "audio-to-transcript":
          return await generateTranscript(
            validatedRequest.files[0] as File,
            validatedRequest.options.language,
          );
        default:
          return null;
      }
    };

    const toolOutput = await processToolOperation();
    if (!toolOutput || !toolOutput.buffer || !toolOutput.type) {
      return NextResponse.json(
        {
          error:
            "Failed to process tool operation. Please try again or contact support.",
        },
        { status: 500 },
      );
    }

    const uniqueMetadataId = crypto.randomUUID();

    const [sqlResult, s3Result, updateTotalOperationsResult] =
      await Promise.all([
        storeUserOperation(
          userId ?? "anonymous",
          validatedRequest.options.title || uniqueMetadataId,
          validatedRequest.options.type,
          new Date().toISOString(),
          !validatedRequest.options.saveToProfile,
        ),
        uploadS3File(toolOutput.buffer, {
          userId: userId ?? undefined,
          tool: options.type,
          originalName: options.title || uniqueMetadataId,
          contentType: toolOutput.type,
          isTemporary: userId ? !options.saveToProfile : true,
        }),
        updateUserTotalOperations(),
      ]);
    if (!sqlResult.success) {
      return NextResponse.json({ error: sqlResult.error }, { status: 400 });
    }
    if (!s3Result.success) {
      return NextResponse.json({ error: s3Result.error }, { status: 400 });
    }
    if (!updateTotalOperationsResult.success) {
      return NextResponse.json(
        { error: updateTotalOperationsResult.error },
        { status: 400 },
      );
    }

    if (validatedRequest.clientSecret) {
      const updateSessionResult = await updateFulfilledSession(
        validatedRequest.clientSecret,
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
      const updateCreditsResult = await updateUserCredits(
        userId ?? "",
        userCredits! - toolPriceResult.result.pricingCredits,
      );
      if (!updateCreditsResult.success) {
        return NextResponse.json(
          { error: updateCreditsResult.error },
          {
            status: 400,
          },
        );
      }
    }

    return NextResponse.json({
      link: s3Result.result,
      downloadCode: sqlResult.result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error. Please try again or contact support.",
      },
      { status: 500 },
    );
  }
}
