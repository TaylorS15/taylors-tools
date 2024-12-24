"use server";
import { turso } from "@/lib/db";
import Stripe from "stripe";
import { z } from "zod";
import { toolSchema, userOperationsSchema } from "@/lib/schemas";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getSignedDownloadUrl } from "@/lib/s3";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function verifyStripePayment(clientSecret: string) {
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

    return { success: true };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      success: false,
      error: "Failed to verify payment",
    };
  }
}

export async function updateFulfilledSession(clientSecret: string) {
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
      uniqueMetadataId,
    };
  } catch (error) {
    console.error("Error updating session:", error);
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
) {
  try {
    const result = turso.execute({
      sql: "INSERT INTO user_operations (user_id, name, tool, created_at) VALUES (?, ?, ?, ?)",
      args: [userId, name, tool, createdAt],
    });

    return result;
  } catch (error) {
    console.error("Error storing user operation:", error);
    return {
      success: false,
      error: "Failed to store user operation",
    };
  }
}

export const getTools: () => Promise<z.infer<typeof toolSchema>[]> = cache(
  unstable_cache(
    async () => {
      try {
        const response = await turso.execute("SELECT * FROM tools");
        console.log(Date.now(), "getTools");
        const validatedTools = response.rows.map((row) =>
          toolSchema.parse(row),
        );
        return validatedTools;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    ["tools"],
    { revalidate: 3600, tags: ["tools"] },
  ),
);

export const getToolData = async (toolName: string) => {
  try {
    const response = await turso.execute({
      sql: "SELECT * FROM tools WHERE url = ?",
      args: [toolName],
    });
    const validatedTool = toolSchema.parse(response.rows[0]);
    return validatedTool;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getUserToolOperations = async (userId: string, tool: string) => {
  try {
    const response = await turso.execute({
      sql: "SELECT * FROM user_operations WHERE user_id = ? AND tool = ?",
      args: [userId, tool],
    });
    const validatedOperations = response.rows.map((row) =>
      userOperationsSchema.parse(row),
    );

    return validatedOperations;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export async function fetchFileUrl(name: string, tool: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const result = await getSignedDownloadUrl(`${tool}/${userId}/${name}`);
    return result;
  } catch (error) {
    console.error("Error fetching file URL:", error);
    return null;
  }
}
