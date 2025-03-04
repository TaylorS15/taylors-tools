"use client";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback, useEffect, useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_API_KEY!);

export default function StripeCheckout({
  stripePriceId,
  onPaymentSuccess,
  requestOptions,
}: {
  stripePriceId: string;
  onPaymentSuccess: (clientSecret: string) => void;
  requestOptions?: {
    fileDurationMinutes?: number;
  };
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [hasCompleted, setHasCompleted] = useState(false);

  const fetchClientSecret = useCallback(() => {
    return fetch(`/api/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stripePriceId,
        options: requestOptions,
      }),
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
      if (clientSecret) {
        onPaymentSuccess(clientSecret);
        setClientSecret("");
      }
    }
  }, [hasCompleted]);

  return (
    <div className="mx-auto w-full max-w-md overflow-y-scroll">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
