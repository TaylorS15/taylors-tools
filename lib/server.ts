"use server";
import { turso } from "@/lib/db";
import Stripe from "stripe";
import { z } from "zod";
import { toolSchema, userOperationsSchema, userSchema } from "@/lib/schemas";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { deleteS3File, getSignedS3DownloadUrl } from "@/lib/s3";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type ApiResponse<T> =
  | {
      success: true;
      result: T;
    }
  | {
      success: false;
      error: string;
    };

export async function verifyStripePayment(
  clientSecret: string,
): Promise<ApiResponse<void>> {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      clientSecret.split("_secret_")[0],
    );

    if (session.metadata?.fufilled === "true") {
      return { success: false, error: "Order already fulfilled" };
    }

    if (session.payment_status !== "paid") {
      return {
        success: false,
        error: "Payment not recieved",
      };
    }

    return { success: true, result: undefined };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to verify payment",
    };
  }
}

export async function updateFulfilledSession(
  clientSecret: string,
  uniqueMetadataId: string,
): Promise<ApiResponse<undefined>> {
  try {
    await stripe.checkout.sessions.update(clientSecret.split("_secret_")[0], {
      metadata: {
        fufilled: "true",
        uniqueMetadataId: uniqueMetadataId,
      },
    });

    return {
      success: true,
      result: undefined,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to update session. Please contact support.",
    };
  }
}

export async function storeUserOperation(
  userId: string,
  name: string,
  tool: string,
  createdAt: string,
  isTemporary: boolean,
): Promise<ApiResponse<string>> {
  try {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const downloadCode = Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");

    await turso.execute({
      sql: "INSERT INTO user_operations (user_id, name, tool, created_at, download_code, temporary) VALUES (?, ?, ?, ?, ?, ?)",
      args: [userId, name, tool, createdAt, downloadCode, isTemporary ? 1 : 0],
    });

    return {
      success: true,
      result: downloadCode,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to store operation. Please contact support.",
    };
  }
}

export const getTools: () => Promise<
  ApiResponse<z.infer<typeof toolSchema>[]>
> = cache(
  unstable_cache(
    async () => {
      try {
        const response = await turso.execute("SELECT * FROM tools");
        const validatedTools = response.rows.map((row) =>
          toolSchema.parse(row),
        );

        return {
          success: true,
          result: validatedTools,
        };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          error: "Failed to get available tools. Please try again.",
        };
      }
    },
    ["tools"],
    { revalidate: 3600, tags: ["tools"] },
  ),
);

export async function getToolData(
  toolName: string,
): Promise<ApiResponse<z.infer<typeof toolSchema>>> {
  try {
    const response = await turso.execute({
      sql: "SELECT * FROM tools WHERE url = ?",
      args: [toolName],
    });

    const validatedTool = toolSchema.parse(response.rows[0]);

    return {
      success: true,
      result: validatedTool,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get tool data. Please try again.",
    };
  }
}

export async function getUserToolOperations(
  userId: string,
  tool: string,
): Promise<ApiResponse<z.infer<typeof userOperationsSchema>[]>> {
  try {
    const response = await turso.execute({
      sql: "SELECT * FROM user_operations WHERE user_id = ? AND tool = ?",
      args: [userId, tool],
    });
    const validatedOperations = response.rows.map((row) =>
      userOperationsSchema.parse(row),
    );

    return {
      success: true,
      result: validatedOperations,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get user operations. Please try again.",
    };
  }
}

export async function getS3FileUrl(
  name: string,
  tool: string,
  isTemporary: number,
): Promise<ApiResponse<string>> {
  try {
    const { userId } = await auth();
    if (userId) {
      if (isTemporary) {
        const result = await getSignedS3DownloadUrl(`temp/${name}`);
        return { success: true, result: result };
      }

      const result = await getSignedS3DownloadUrl(`${tool}/${userId}/${name}`);
      return { success: true, result: result };
    }

    if (!userId) {
      const result = await getSignedS3DownloadUrl(`temp/${name}`);
      return { success: true, result: result };
    }

    return {
      success: false,
      error: "Error getting file. Please try again or contact support.",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get file URL. Please try again.",
    };
  }
}

export async function deleteFile(
  name: string,
  tool: string,
): Promise<ApiResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await deleteS3File(`${tool}/${userId}/${name}`);
    await turso.execute({
      sql: "DELETE FROM user_operations WHERE name = ? AND tool = ?",
      args: [name, tool],
    });

    return {
      success: true,
      result: undefined,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to delete file. Please try again or contact support.",
    };
  }
}

export async function getUserData(): Promise<
  ApiResponse<z.infer<typeof userSchema>>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const response = await turso.execute({
      sql: "SELECT * FROM users WHERE user_id = ?",
      args: [userId],
    });

    const validatedUser = userSchema.parse(response.rows[0]);

    return {
      success: true,
      result: validatedUser,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get user data. Please try again.",
    };
  }
}

export async function getUserCredits(
  userId: string,
): Promise<ApiResponse<number>> {
  try {
    const result = await turso.execute({
      sql: "SELECT credits FROM users WHERE user_id = ?",
      args: [userId],
    });

    return {
      success: true,
      result: result.rows[0].credits as number,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get user credits. Please try again or contact support.",
    };
  }
}

export async function updateUserCredits(
  userId: string,
  credits: number,
): Promise<ApiResponse<void>> {
  try {
    await turso.execute({
      sql: "UPDATE users SET credits = ? WHERE user_id = ?",
      args: [credits, userId],
    });

    return {
      success: true,
      result: undefined,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to update user credits. Please try again.",
    };
  }
}

export async function getUserOperationLink(
  downloadCode: string,
): Promise<ApiResponse<string>> {
  try {
    const response = await turso.execute({
      sql: "SELECT * FROM user_operations WHERE download_code = ?",
      args: [downloadCode],
    });

    const validatedOperation = userOperationsSchema.parse(response.rows[0]);

    const url = await getS3FileUrl(
      validatedOperation.name,
      validatedOperation.tool,
      validatedOperation.temporary,
    );
    if (!url.success) {
      return {
        success: false,
        error: url.error,
      };
    }

    return {
      success: true,
      result: url.result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get operation link. Please try again.",
    };
  }
}
