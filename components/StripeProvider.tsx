"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_API_KEY!);

export default function QueryProvider({
  stripeOptions,
  children,
}: {
  stripeOptions: StripeElementsOptions;
  children: React.ReactNode;
}) {
  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  );
}
