import { Stripe } from "stripe";
import { NextResponse } from "next/server";
import { turso } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata.userId;
        if (
          !userId ||
          paymentIntent.metadata.priceId !== "price_1QbliqE2ME1QhtatZ3fAfxt7"
        ) {
          break;
        }

        // Convert amount from cents into dollars * 10 for credit units
        const amount = paymentIntent.amount / 10;

        await turso.execute({
          sql: "UPDATE users SET credits = credits + ? WHERE user_id = ?",
          args: [amount, userId],
        });

        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
