import { stripeClientSecretOptionsSchema } from "@/lib/schemas";
import { getToolPrice, getToolType } from "@/lib/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { stripePriceId, options } = await req.json();

    if (!stripePriceId) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }

    const validatedOptions = stripeClientSecretOptionsSchema.parse(options);
    if (!validatedOptions) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }

    const { userId } = await auth();

    const toolTypeResult = await getToolType(stripePriceId);
    if (!toolTypeResult.success) {
      return NextResponse.json(
        { error: toolTypeResult.error },
        {
          status: 400,
        },
      );
    }

    const toolPriceResult = await getToolPrice(
      toolTypeResult.result,
      validatedOptions.fileDurationMinutes,
    );
    if (!toolPriceResult.success) {
      return NextResponse.json(
        { error: toolPriceResult.error },
        {
          status: 400,
        },
      );
    }

    console.log(toolPriceResult.result);

    // Using client provided info to determine pricing, verified on tool usage to match paid price.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: stripePriceId,
          quantity:
            validatedOptions && validatedOptions.fileDurationMinutes
              ? toolPriceResult.result.pricingSingle
              : 1,
        },
      ],
      mode: "payment",
      ui_mode: "embedded",
      redirect_on_completion: "never",
      payment_intent_data: {
        metadata: {
          userId: userId ? userId : "",
          priceId: stripePriceId,
        },
      },
      metadata: {
        userId: userId ? userId : "",
        priceId: stripePriceId,
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
