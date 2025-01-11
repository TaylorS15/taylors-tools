import { useUser } from "@clerk/nextjs";

export default function CheckoutButtons({
  copy,
  enabled,
  setCheckoutState,
}: {
  enabled: boolean;
  copy: string;
  setCheckoutState: React.Dispatch<
    React.SetStateAction<
      "INPUT" | "CREDIT_CHECKOUT" | "STRIPE_CHECKOUT" | "LOADING" | "SUCCESS"
    >
  >;
}) {
  const { user } = useUser();
  return (
    <div className="flex h-12 w-full justify-between gap-6">
      <button
        onClick={() => setCheckoutState("STRIPE_CHECKOUT")}
        className="flex h-full w-full items-center justify-center rounded-md bg-indigo-500 font-medium text-white transition-all hover:bg-indigo-400 disabled:bg-indigo-300/50"
        disabled={!enabled}
      >
        {copy} with
        <img src="/stripe-white.svg" alt="Stripe" className="h-7" />
      </button>
      <button
        onClick={() => setCheckoutState("CREDIT_CHECKOUT")}
        className="h-full w-full rounded-md bg-green-500 font-medium text-white transition-all hover:bg-green-400 disabled:bg-green-300/50"
        disabled={!enabled || user === undefined || user === null}
      >
        {copy} with Credits
      </button>
    </div>
  );
}
