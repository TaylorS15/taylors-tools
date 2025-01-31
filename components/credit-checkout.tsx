import { useToast } from "@/hooks/use-toast";
import { toolSchema } from "@/lib/schemas";
import { getUserData } from "@/lib/server";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { z } from "zod";
import StripeCheckout from "@/components/stripe-checkout";
import { useState } from "react";
import { X } from "lucide-react";

export default function CreditCheckout({
  copy,
  tool,
  onPaymentSuccess,
  fileDurationMinutes,
}: {
  copy: string;
  tool: z.infer<typeof toolSchema>;
  onPaymentSuccess: (clientSecret: string) => void;
  fileDurationMinutes?: number;
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const userQuery = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      const response = await getUserData();
      if (!response.success) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        throw new Error(response.error);
      }

      return response.result;
    },
  });

  const creditPrice = fileDurationMinutes
    ? tool.pricing_credits * fileDurationMinutes < 5
      ? 5
      : tool.pricing_credits * fileDurationMinutes
    : tool.pricing_credits;

  const userHasSufficientBalance = userQuery.data
    ? userQuery.data.credits > creditPrice
    : false;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
      <p className="text-xl font-semibold text-blue-600">Credit Checkout</p>
      <div className="flex w-full flex-col rounded-lg border border-zinc-200 bg-white">
        <div className="flex w-full items-center justify-between  border-b border-zinc-200 p-2">
          <p className="text-sm font-medium text-zinc-600">Account balance:</p>
          <p>{userQuery.data?.credits} credits</p>
        </div>
        <div className="flex w-full items-center justify-between p-2">
          <p className="text-sm font-medium text-zinc-600">
            Cost of conversion:
          </p>
          {fileDurationMinutes ? (
            <p>
              {tool.pricing_credits * fileDurationMinutes < 5
                ? 5
                : tool.pricing_credits * fileDurationMinutes}{" "}
              credits
            </p>
          ) : (
            <p>{tool.pricing_credits} credits</p>
          )}
        </div>
      </div>

      <div className="flex w-full gap-3">
        <button
          onClick={() => onPaymentSuccess("")}
          disabled={!userHasSufficientBalance}
          className="h-12 w-full rounded-md border border-green-500 bg-white font-medium text-green-500 transition-all hover:bg-green-50 disabled:opacity-50 disabled:hover:bg-white"
        >
          {copy}
        </button>

        {!userHasSufficientBalance && (
          <button
            onClick={() => setIsAddCreditsModalOpen(true)}
            className="h-12 w-full rounded-lg border border-green-500 bg-white font-medium text-green-500 transition-all hover:bg-green-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Add credits
          </button>
        )}
      </div>

      {isAddCreditsModalOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAddCreditsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.1 }}
              className="flex max-h-[90dvh] w-full max-w-lg overflow-y-scroll rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-lg"
            >
              <StripeCheckout
                stripePriceId="price_1QbliqE2ME1QhtatZ3fAfxt7"
                onPaymentSuccess={() => {
                  userQuery.refetch();
                  setIsAddCreditsModalOpen(false);
                }}
                requestOptions={{ addingUserCredits: true }}
              />
              <button
                className="absolute right-2 top-2 rounded-lg bg-zinc-50 p-1.5 hover:bg-zinc-100"
                onClick={() => setIsAddCreditsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
