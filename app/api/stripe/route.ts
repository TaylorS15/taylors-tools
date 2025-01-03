import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { stripePriceId } = await req.json();

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Missing required field: stripePriceId" },
        { status: 400 },
      );
    }

    const { userId } = await auth();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded",
      redirect_on_completion: "never",
      payment_intent_data: {
        metadata: {
          userId: userId ? userId : "",
        },
      },
      metadata: {
        userId: userId ? userId : "",
        fulfilled: "false",
      },
    });

    return NextResponse.json(
      {
        clientSecret: session.client_secret,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
