import { containerVariants } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import StripeCheckout from "@/components/stripe-checkout";
import { UseQueryResult } from "@tanstack/react-query";
import { z } from "zod";
import { toolSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";

export default function StripeCheckoutWindow({
  onPaymentSuccess,
  toolQuery,
  requestOptions,
}: {
  onPaymentSuccess: (clientSecret: string) => void;
  toolQuery: UseQueryResult<z.infer<typeof toolSchema> | undefined>;
  requestOptions?: {
    addingUserCredits?: boolean;
    fileDurationMinutes?: number;
    pricingSingle?: number;
  };
}) {
  const router = useRouter();
  return (
    <motion.div
      key="checkout"
      variants={containerVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <button
        onMouseDown={() => router.push(`?checkout_state=input`)}
        className="flex w-min items-center gap-2 text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <StripeCheckout
        onPaymentSuccess={onPaymentSuccess}
        stripePriceId={toolQuery.data!.stripe_price_id!}
        requestOptions={requestOptions}
      />
    </motion.div>
  );
}
