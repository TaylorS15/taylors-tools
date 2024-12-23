export default function CheckoutButtons({
  enabled,
  setCheckoutState,
}: {
  enabled: boolean;
  setCheckoutState: React.Dispatch<
    React.SetStateAction<"INPUT" | "CHECKOUT" | "LOADING" | "SUCCESS">
  >;
}) {
  return (
    <div className="flex h-12 w-full justify-between gap-6">
      <button
        onClick={() => setCheckoutState("CHECKOUT")}
        className="flex h-full w-full items-center justify-center rounded-md bg-indigo-500 font-medium text-white transition-all hover:bg-indigo-400 disabled:bg-indigo-300/50"
        disabled={!enabled}
      >
        Convert with
        <img src="/stripe-white.svg" alt="Stripe" className="h-7" />
      </button>
      <button
        className="h-full w-full rounded-md bg-green-500 font-medium text-white transition-all hover:bg-green-400 disabled:bg-green-300/50"
        disabled={!enabled}
      >
        Convert with Credits
      </button>
    </div>
  );
}
