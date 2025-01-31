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
  copy,
  onPaymentSuccess,
  toolQuery,
  fileDurationMinutes,
}: {
  copy: string;
  onPaymentSuccess: (clientSecret: string) => void;
  toolQuery: UseQueryResult<z.infer<typeof toolSchema> | undefined>;
  fileDurationMinutes?: number;
}) {
  const router = useRouter();
  return (
    <motion.div
      key="credit"
      variants={containerVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className=""
    >
      <button
        onMouseDown={() => router.push(`?checkout_state=input`)}
        className="flex w-min items-center gap-2 text-blue-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      {toolQuery.data ? (
        <CreditCheckout
          copy={copy}
          tool={toolQuery.data}
          onPaymentSuccess={onPaymentSuccess}
          fileDurationMinutes={fileDurationMinutes}
        />
      ) : (
        <Skeleton className="h-12 w-full" />
      )}
    </motion.div>
  );
}
