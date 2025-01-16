"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getToolData } from "@/lib/server";
import { usePreventUnload } from "@/hooks/use-prevent-unload";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "motion/react";
import CheckoutButtons from "@/components/checkout-buttons";
import useFirstMount from "@/hooks/use-first-mount";
import CreditCheckoutWindow from "@/components/credit-checkout-window";
import LoadingWindow from "@/components/loading-window";
import PurchaseSuccessWindow from "@/components/purchase-success-window";
import { containerVariants } from "@/lib/utils";
import StripeCheckoutWindow from "@/components/stripe-checkout-window";
import { useFileInputContext } from "@/components/file-input-provider";
import FileInput from "@/components/file-input";
import { useRouter, useSearchParams } from "next/navigation";

export default function ImagesToPdf() {
  const { user } = useUser();
  const { previews, setPreviews } = useFileInputContext();

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [title, setTitle] = useState("");

  const params = useSearchParams();
  const router = useRouter();
  const checkoutStateFromUrl = params.get("checkout_state");

  const [downloadLink, setDownloadLink] = useState("");
  const [downloadCode, setDownloadCode] = useState("");

  usePreventUnload({
    enabled:
      checkoutStateFromUrl === "LOADING" || checkoutStateFromUrl === "SUCCESS",
    message: "Please wait until the conversion is complete before leaving.",
  });
  const { hasLoaded } = useFirstMount();
  const { toast } = useToast();

  const toolQuery = useQuery({
    queryKey: ["tool", "audio-to-transcript"],
    queryFn: async () => {
      const response = await getToolData("audio-to-transcript");
      if (!response.success) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        console.error(response.error);
        return;
      }

      return response.result;
    },
    enabled: true,
  });

  console.log(toolQuery.data);

  async function onPaymentSuccess(clientSecret: string) {
    router.push(`?checkout_state=LOADING`, { scroll: false });

    const payload = {
      clientSecret,
      options: {
        type: "audio-to-transcript",
        saveToProfile: user ? saveToProfile : false,
        title,
      },
    };

    const response = await fetch("/api/tool", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      router.push(`?checkout_state=INPUT`, { scroll: false });
      const error = await response.json();
      toast({
        title: "Error",
        description: error.error,
        variant: "destructive",
      });
      console.error(error.error);
      return;
    }

    const { link, downloadCode } = await response.json();
    setDownloadLink(link);
    setDownloadCode(downloadCode);

    setPreviews([]);
    setTitle("");
    router.push(`?checkout_state=SUCCESS`, { scroll: false });
  }

  useEffect(() => {
    router.push(`?checkout_state=INPUT`, { scroll: false });
  }, []);

  return (
    <main className="flex w-full flex-col-reverse items-center">
      <div className="w-full max-w-3xl p-4">
        <div className="relative w-full overflow-y-scroll rounded-md bg-zinc-100 px-4 py-1"></div>
      </div>

      <div className="flex h-max w-full max-w-xl flex-col gap-6 overflow-x-clip p-4 md:max-w-3xl">
        <AnimatePresence mode="wait">
          {!checkoutStateFromUrl || checkoutStateFromUrl === "INPUT" ? (
            <motion.div
              key="input"
              variants={containerVariants}
              initial={hasLoaded ? "enter" : "center"}
              animate="center"
              exit="exit"
              className="mt-auto flex h-full flex-col gap-4"
            >
              <h1 className="mb-auto text-center text-xl font-semibold text-blue-600">
                Audio to Transcript
              </h1>
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-none active:outline-none"
                placeholder="Enter a title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div
                className={`${!user ? "cursor-not-allowed text-zinc-400" : "text-zinc-700"} flex w-full items-center justify-between rounded-lg border border-zinc-200 p-2 text-sm`}
              >
                <p>Save to profile after conversion</p>
                {user === undefined ? (
                  <Skeleton className="/> h-5 w-9 rounded-full bg-zinc-200" />
                ) : (
                  <Switch
                    checked={saveToProfile}
                    disabled={!user}
                    onCheckedChange={(checked) => {
                      setSaveToProfile(checked);
                    }}
                  />
                )}
              </div>

              <div className="flex w-full flex-col justify-between gap-6">
                <FileInput
                  numberOfFiles={1}
                  maxSizeBytes={2 * 1024 * 1024 * 1024}
                  allowedTypes={[
                    "audio/mpeg",
                    "audio/mp3",
                    "audio/wav",
                    "video/mp4",
                    "video/webm",
                    "video/x-matroska",
                  ]}
                  splitAudio={true}
                />

                <CheckoutButtons
                  copy={"Convert"}
                  enabled={previews.length > 0}
                />
              </div>
            </motion.div>
          ) : null}
          {checkoutStateFromUrl === "CREDIT_CHECKOUT" && toolQuery.data && (
            <CreditCheckoutWindow
              onPaymentSuccess={onPaymentSuccess}
              toolQuery={toolQuery}
            />
          )}
          {checkoutStateFromUrl === "STRIPE_CHECKOUT" && toolQuery.data && (
            <StripeCheckoutWindow
              onPaymentSuccess={onPaymentSuccess}
              toolQuery={toolQuery}
            />
          )}
          {checkoutStateFromUrl === "LOADING" && <LoadingWindow />}
          {checkoutStateFromUrl === "SUCCESS" && (
            <PurchaseSuccessWindow
              downloadLink={downloadLink}
              downloadCode={downloadCode}
            />
          )}
        </AnimatePresence>
      </div>

      <Toaster />
    </main>
  );
}
