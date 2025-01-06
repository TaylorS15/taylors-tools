import { useToast } from "@/hooks/use-toast";
import { toolSchema } from "@/lib/schemas";
import { getUserData } from "@/lib/server";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export default function CreditCheckout({
  tool,
  onPaymentSuccess,
}: {
  tool: z.infer<typeof toolSchema>;
  onPaymentSuccess: (clientSecret: string) => void;
}) {
  const { user } = useUser();
  const { toast } = useToast();
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

  return (
    <div className="mx-auto flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-8 rounded-lg bg-white p-8 shadow-md">
        <p className="text-xl font-semibold text-blue-600">Credit Checkout</p>
        <div className="flex w-full flex-col rounded-lg border border-zinc-200">
          <div className="flex w-full justify-between border-b border-zinc-200 p-3">
            <p className="text-sm font-medium text-zinc-600">
              Account balance:
            </p>
            <p>{userQuery.data?.credits} credits</p>
          </div>
          <div className="flex w-full justify-between p-3">
            <p className="text-sm font-medium text-zinc-600">
              Cost of conversion:
            </p>
            <p>{tool.pricing_credits} credits</p>
          </div>
        </div>

        <button
          onClick={() => onPaymentSuccess("")}
          className="h-12 w-full rounded-md bg-green-500 font-medium text-white transition-all hover:bg-green-400 disabled:bg-green-300/50"
        >
          Convert
        </button>
      </div>
    </div>
  );
}
