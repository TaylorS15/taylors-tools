import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import CreditCheckout from "@/components/credit-checkout";
import { UseQueryResult } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toolSchema } from "@/lib/schemas";
import { z } from "zod";
import { containerVariants } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CreditCheckoutWindow({
  onPaymentSuccess,
  toolQuery,
}: {
  onPaymentSuccess: (clientSecret: string) => void;
  toolQuery: UseQueryResult<z.infer<typeof toolSchema> | undefined>;
}) {
  const router = useRouter();
  return (
    <motion.div
      key="credit"
      variants={containerVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="flex h-full flex-col gap-4"
    >
      <button
        onClick={() => router.push(`?checkout_state=INPUT`)}
        className="flex w-min items-center gap-2 text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      {toolQuery.data ? (
        <CreditCheckout
          tool={toolQuery.data}
          onPaymentSuccess={onPaymentSuccess}
        />
      ) : (
        <Skeleton className="h-12 w-full" />
      )}
    </motion.div>
  );
}
