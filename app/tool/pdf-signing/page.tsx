"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "motion/react";
import CheckoutButtons from "@/components/checkout-buttons";
import useFirstMount from "@/hooks/use-first-mount";
import { useQuery } from "@tanstack/react-query";
import { getToolData } from "@/lib/server";
import { Allura } from "next/font/google";
import PurchaseSuccessWindow from "@/components/purchase-success-window";
import LoadingWindow from "@/components/loading-window";
import CreditCheckoutWindow from "@/components/credit-checkout-window";
import StripeCheckoutWindow from "@/components/stripe-checkout-window";
import { useFileInputContext } from "@/components/file-input-provider";
import FileInput from "@/components/file-input";

const AlluraFont = Allura({ subsets: ["latin"], weight: "400" });

export default function PdfSigning() {
  const { user } = useUser();
  const { toast } = useToast();
  const { hasLoaded } = useFirstMount();
  const { previews, setPreviews } = useFileInputContext();

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [title, setTitle] = useState("");
  const [signature, setSignature] = useState("");

  const [downloadLink, setDownloadLink] = useState("");
  const [downloadCode, setDownloadCode] = useState("");
  const [checkoutState, setCheckoutState] = useState<
    "INPUT" | "CREDIT_CHECKOUT" | "STRIPE_CHECKOUT" | "LOADING" | "SUCCESS"
  >("INPUT");

  const toolQuery = useQuery({
    queryKey: ["tool", "pdf-signing"],
    queryFn: async () => {
      const response = await getToolData("pdf-signing");
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
  });

  async function onPaymentSuccess(clientSecret: string) {
    setCheckoutState("LOADING");

    const payload = {
      clientSecret,
      options: {
        type: "pdf-signing",
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
      setCheckoutState("INPUT");
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
    setCheckoutState("SUCCESS");
  }

  return (
    <main className="flex w-full flex-col-reverse items-center">
      <div className="aspect-[1/1.4] w-full max-w-xl p-4 lg:max-w-3xl">
        <div className="relative h-full w-full max-w-xl overflow-y-scroll rounded-md bg-zinc-100 px-4 py-1 lg:max-w-3xl">
          <div
            className={`${checkoutState === "LOADING" ? "absolute inset-0" : "hidden"} bg-white/50 backdrop-blur-sm`}
          />
        </div>
      </div>

      <div className="flex h-max w-full max-w-xl flex-col gap-6 overflow-x-clip p-4 lg:max-w-3xl">
        <AnimatePresence mode="wait">
          {checkoutState === "INPUT" && (
            <motion.div
              key="input"
              initial={hasLoaded ? "enter" : "center"}
              animate="center"
              exit="exit"
              className="mt-auto flex h-full flex-col gap-4"
            >
              <h1 className="mb-auto text-center text-xl font-semibold text-blue-600">
                PDF Signing
              </h1>
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-none active:outline-none"
                placeholder="Enter a document title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="text"
                className={`${AlluraFont.className} h-20 w-full rounded-lg border border-zinc-200 p-2 text-center text-4xl focus:outline-none active:outline-none md:text-5xl lg:text-6xl`}
                placeholder="Jane Doe"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
              />
              <div className="flex w-full items-center justify-between rounded-lg border border-zinc-200 p-2 text-sm text-zinc-700">
                <p>Date</p>
                <input type="date" className="bg-zinc-50" />
              </div>
              <div
                className={`${!user ? "cursor-not-allowed text-zinc-400" : "text-zinc-700"} flex w-full items-center justify-between rounded-lg border border-zinc-200 p-2 text-sm`}
              >
                <p>Save to profile after signing</p>
                {user === undefined ? (
                  <Skeleton className="h-5 w-9 rounded-full bg-zinc-200" />
                ) : (
                  <Switch
                    checked={saveToProfile}
                    disabled={!user}
                    onCheckedChange={(checked) => setSaveToProfile(checked)}
                  />
                )}
              </div>

              <div className="flex w-full flex-col justify-between gap-6">
                <FileInput
                  numberOfFiles={1}
                  maxSizeBytes={20 * 1024 * 1024}
                  allowedTypes={["application/pdf"]}
                  splitAudio={false}
                />

                <CheckoutButtons copy={"Sign"} enabled={previews !== null} />
              </div>
            </motion.div>
          )}
          {checkoutState === "CREDIT_CHECKOUT" && (
            <CreditCheckoutWindow
              copy="Generate"
              onPaymentSuccess={onPaymentSuccess}
              toolQuery={toolQuery}
            />
          )}
          {checkoutState === "STRIPE_CHECKOUT" && (
            <StripeCheckoutWindow
              onPaymentSuccess={onPaymentSuccess}
              toolQuery={toolQuery}
            />
          )}
          {checkoutState === "LOADING" && <LoadingWindow />}
          {checkoutState === "SUCCESS" && (
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
