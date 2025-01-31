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
        onMouseDown={() => router.push(`?checkout_state=stripe_checkout`)}
        className="flex h-full w-full items-center justify-center rounded-lg border border-indigo-500 bg-white font-medium text-indigo-500 transition-all hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white"
        disabled={!enabled}
      >
        {copy} with
        <img src="/stripe-purple.svg" alt="Stripe" className="h-7" />
      </button>
      <button
        onMouseDown={() => router.push(`?checkout_state=credit_checkout`)}
        className="h-full w-full rounded-lg border border-green-500 bg-white font-medium text-green-500 transition-all hover:bg-green-50 disabled:opacity-50 disabled:hover:bg-white"
        disabled={!enabled || user === undefined || user === null}
      >
        {copy} with Credits
      </button>
    </div>
  );
}
