import { containerVariants } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import StripeCheckout from "./stripe-checkout";
import { UseQueryResult } from "@tanstack/react-query";
import { z } from "zod";
import { toolSchema } from "@/lib/schemas";

export default function StripeCheckoutWindow({
  setCheckoutState,
  onPaymentSuccess,
  toolQuery,
}: {
  setCheckoutState: React.Dispatch<
    React.SetStateAction<
      "INPUT" | "CREDIT_CHECKOUT" | "STRIPE_CHECKOUT" | "LOADING" | "SUCCESS"
    >
  >;
  onPaymentSuccess: (clientSecret: string) => void;
  toolQuery: UseQueryResult<z.infer<typeof toolSchema> | undefined>;
}) {
  return (
    <motion.div
      key="checkout"
      variants={containerVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="flex flex-col gap-4 overflow-y-scroll"
    >
      <button
        onClick={() => setCheckoutState("INPUT")}
        className="flex w-min items-center gap-2 text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <StripeCheckout
        onPaymentSuccess={onPaymentSuccess}
        stripePriceId={toolQuery.data!.stripe_price_id!}
      />
    </motion.div>
  );
}
