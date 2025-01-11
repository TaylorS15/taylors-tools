"use client";
import { useEffect, useState, useRef, ChangeEvent, DragEvent } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion, Variants } from "motion/react";
import CheckoutButtons from "@/components/checkout-buttons";
import useFirstMount from "@/hooks/use-first-mount";
import { useQuery } from "@tanstack/react-query";
import { getToolData } from "@/lib/server";
import { Allura } from "next/font/google";
import PurchaseSuccessWindow from "@/components/purchase-success-window";
import LoadingWindow from "@/components/loading-window";
import CreditCheckoutWindow from "@/components/credit-checkout-window";
import StripeCheckoutWindow from "@/components/stripe-checkout-window";

const AlluraFont = Allura({ subsets: ["latin"], weight: "400" });

interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
}

export default function PdfSigning() {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [signature, setSignature] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [downloadCode, setDownloadCode] = useState("");
  const [title, setTitle] = useState("");
  const { hasLoaded } = useFirstMount();
  const { toast } = useToast();
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

  function validateFile(file: File): boolean {
    const maxSizeBytes = 5 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      toast({
        title: "Error",
        description: `File exceeds ${20}MB limit`,
        variant: "destructive",
      });
      return false;
    }

    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Only PDF files are allowed",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  function handleFiles(files: FileList) {
    if (files.length > 1) {
      toast({
        title: "Error",
        description: "Only one PDF file can be processed at a time",
        variant: "destructive",
      });
      return;
    }

    const file = files[0];
    if (!validateFile(file)) return;

    if (preview?.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
    }

    try {
      const previewUrl = URL.createObjectURL(file);
      setPreview({
        id: (Math.random() * 1000).toFixed(0),
        file,
        previewUrl,
      });
    } catch (error) {
      console.error("Error creating preview:", error);
      toast({
        title: "Error",
        description: "Failed to create file preview",
        variant: "destructive",
      });
    }
  }

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

    setPreview(null);
    setTitle("");
    setCheckoutState("SUCCESS");
  }

  // Likely necessary to prevent memory leaks when leaving the page.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.previewUrl);
    };
  }, []);

  return (
    <main className="flex w-full flex-col-reverse items-center">
      <div className="aspect-video w-full max-w-xl p-4 lg:max-w-3xl">
        <div className="relative h-full w-full max-w-xl overflow-y-scroll rounded-md bg-zinc-100 px-4 py-1 lg:max-w-3xl">
          {preview && (
            <div className="group relative my-3">
              <div className="aspect-[1/1.4] overflow-hidden rounded-lg bg-gray-100">
                <iframe src={preview.previewUrl} className="h-full w-full" />
              </div>
              <button
                onClick={() => setPreview(null)}
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-gray-600 hover:bg-white hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
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
                className={`${AlluraFont.className} h-28 w-full rounded-lg border border-zinc-200 p-2 text-center text-4xl focus:outline-none active:outline-none md:text-5xl lg:text-6xl`}
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
                <div
                  className={`${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"} relative w-full rounded-lg border-2 border-dashed p-4 transition-colors`}
                  onDragOver={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e: DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files) {
                        handleFiles(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />

                  <div className="flex flex-col items-center">
                    <p className="mb-2 text-sm text-gray-600">
                      Drop PDF here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximum file size: {20}MB
                    </p>
                  </div>
                </div>

                <CheckoutButtons
                  copy={"Sign"}
                  enabled={preview !== null}
                  setCheckoutState={setCheckoutState}
                />
              </div>
            </motion.div>
          )}
          {checkoutState === "CREDIT_CHECKOUT" && (
            <CreditCheckoutWindow
              setCheckoutState={setCheckoutState}
              onPaymentSuccess={onPaymentSuccess}
              toolQuery={toolQuery}
            />
          )}
          {checkoutState === "STRIPE_CHECKOUT" && (
            <StripeCheckoutWindow
              setCheckoutState={setCheckoutState}
              onPaymentSuccess={onPaymentSuccess}
              toolQuery={toolQuery}
            />
          )}
          {checkoutState === "LOADING" && <LoadingWindow />}
          {checkoutState === "SUCCESS" && (
            <PurchaseSuccessWindow
              setCheckoutState={setCheckoutState}
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
