import Stripe from "stripe";

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
