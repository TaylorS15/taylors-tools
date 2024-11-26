import {
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";

export default function StripeCheckout() {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string>();

  const onConfirm = async () => {
    if (!stripe || !elements) {
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError && submitError.message) {
      setErrorMessage(submitError.message);
      return;
    }

    const res = await fetch("/create-intent", {
      method: "POST",
    });
    const { client_secret: clientSecret } = await res.json();

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: "https://example.com/return",
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      // The payment UI automatically closes with a success animation.
      // Your customer is redirected to your `return_url`.
    }
  };
  const onClick = ({ resolve }: { resolve: (value: any) => void }) => {
    const options = {
      emailRequired: true,
    };
    resolve(options);
  };

  return (
    <div className="flex h-12 w-full gap-4 bg-zinc-200">
      <ExpressCheckoutElement
        onConfirm={onConfirm}
        onClick={onClick}
        options={{
          buttonType: {
            googlePay: "checkout",
            applePay: "check-out",
          },
          buttonTheme: {
            applePay: "white-outline",
          },
          buttonHeight: 55,
        }}
      />
      <p className="text-sm text-gray-500">{errorMessage}</p>
    </div>
  );
}
