"use server";
import { turso } from "@/lib/db";
import Stripe from "stripe";
import { z } from "zod";
import { toolSchema, userOperationsSchema } from "@/lib/schemas";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { deleteS3File, getSignedS3DownloadUrl } from "@/lib/s3";
import { ResultSet } from "@libsql/client/web";

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
): Promise<ApiResponse<string>> {
  const uniqueMetadataId = crypto.randomUUID();

  try {
    await stripe.checkout.sessions.update(clientSecret.split("_secret_")[0], {
      metadata: {
        fufilled: "true",
        uniqueMetadataId: uniqueMetadataId,
      },
    });

    return {
      success: true,
      result: uniqueMetadataId,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to update session",
    };
  }
}

export async function storeUserOperation(
  userId: string,
  name: string,
  tool: string,
  createdAt: string,
): Promise<ApiResponse<ResultSet>> {
  try {
    const result = await turso.execute({
      sql: "INSERT INTO user_operations (user_id, name, tool, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, name, tool, createdAt],
    });

    return {
      success: true,
      result: result,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to store user operation",
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
          error: "Failed to get tools",
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
      error: "Failed to get tool data",
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
      error: "Failed to get user operations",
    };
  }
}

export async function getS3FileUrl(
  name: string,
  tool: string,
): Promise<ApiResponse<string>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await getSignedS3DownloadUrl(`${tool}/${userId}/${name}`);

    return { success: true, result: result };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to get file URL",
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
      error: "Failed to delete file",
    };
  }
}
