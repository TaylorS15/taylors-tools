"use client";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useEffect, useState } from "react";
import { useCheckout } from "@/components/checkout-provider";
import Stripe from "stripe";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_API_KEY!);

export default function StripeCheckout({
  stripePriceId,
  onPaymentSuccess,
}: {
  stripePriceId: string;
  onPaymentSuccess: (clientSecret: string) => void;
}) {
  // const { stripePriceId, setShowStripeCheckout, onPaymentSuccess } =
  //   useCheckout();

  const [clientSecret, setClientSecret] = useState("");
  const [hasCompleted, setHasCompleted] = useState(false);

  const fetchClientSecret = useCallback(() => {
    return fetch(`/api/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stripePriceId }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch client secret");
        }
        return res.json();
      })
      .then(async (data) => {
        setClientSecret(data.clientSecret);
        return data.clientSecret;
      });
  }, [stripePriceId]);

  const options = {
    fetchClientSecret,
    onComplete: () => setHasCompleted(true),
  };

  useEffect(() => {
    if (hasCompleted) {
      // setShowStripeCheckout(false);
      if (clientSecret) {
        onPaymentSuccess(clientSecret);
        setClientSecret("");
      }
    }
  }, [hasCompleted]);

  return (
    <div className="w-full max-w-lg rounded-lg">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
