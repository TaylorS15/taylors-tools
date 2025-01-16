import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function CheckoutButtons({
  copy,
  enabled,
}: {
  enabled: boolean;
  copy: string;
}) {
  const router = useRouter();
  const { user } = useUser();
  return (
    <div className="flex h-12 w-full justify-between gap-6">
      <button
        onClick={() => router.push(`?checkout_state=STRIPE_CHECKOUT`)}
        className="flex h-full w-full items-center justify-center rounded-md bg-indigo-500 font-medium text-white transition-all hover:bg-indigo-400 disabled:bg-indigo-300/50"
        disabled={!enabled}
      >
        {copy} with
        <img src="/stripe-white.svg" alt="Stripe" className="h-7" />
      </button>
      <button
        onClick={() => router.push(`?checkout_state=CREDIT_CHECKOUT`)}
        className="h-full w-full rounded-md bg-green-500 font-medium text-white transition-all hover:bg-green-400 disabled:bg-green-300/50"
        disabled={!enabled || user === undefined || user === null}
      >
        {copy} with Credits
      </button>
    </div>
  );
}
