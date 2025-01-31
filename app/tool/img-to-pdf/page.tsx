"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getToolData } from "@/lib/server";
import { usePreventUnload } from "@/hooks/use-prevent-unload";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AnimatePresence, motion } from "motion/react";
import CheckoutButtons from "@/components/checkout-buttons";
import useFirstMount from "@/hooks/use-first-mount";
import CreditCheckoutWindow from "@/components/credit-checkout-window";
import LoadingWindow from "@/components/loading-window";
import PurchaseSuccessWindow from "@/components/purchase-success-window";
import { containerVariants } from "@/lib/utils";
import StripeCheckoutWindow from "@/components/stripe-checkout-window";
import FileInput from "@/components/file-input";
import { useFileInputContext } from "@/components/file-input-provider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ImagesToPdf() {
  const { user } = useUser();
  const { previews, setPreviews } = useFileInputContext();
  const { hasLoaded } = useFirstMount();
  const { toast } = useToast();

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [title, setTitle] = useState("");
  const [selectedImageFit, setSelectedImageFit] = useState<
    "FIT" | "STRETCH" | "FILL"
  >("FIT");

  const path = usePathname();
  const toolUrl = path.split("/")[2].split("?")[0];
  const params = useSearchParams();
  const router = useRouter();
  const checkoutState = params.get("checkout_state") as
    | "input"
    | "credit_checkout"
    | "stripe_checkout"
    | "loading"
    | "success";

  const [downloadLink, setDownloadLink] = useState("");
  const [downloadCode, setDownloadCode] = useState("");

  usePreventUnload({
    enabled: checkoutState === "loading" || checkoutState === "success",
    message: "Please wait until the conversion is complete before leaving.",
  });

  const toolQuery = useQuery({
    queryKey: ["tool", "img-to-pdf"],
    queryFn: async () => {
      const response = await getToolData("img-to-pdf");
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
    router.push(`?checkout_state=loading`, { scroll: false });

    const formData = new FormData();

    formData.append("clientSecret", clientSecret);
    for (const preview of previews) {
      formData.append("files", preview.file);
    }
    formData.append(
      "options",
      JSON.stringify({
        type: toolUrl,
        saveToProfile: user ? saveToProfile : false,
        title,
        selectedImageFit: selectedImageFit,
      }),
    );

    const response = await fetch("/api/tool", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      router.push(`?checkout_state=input`, { scroll: false });
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
    router.push(`?checkout_state=success`, { scroll: false });
  }

  useEffect(() => {
    router.push(`?checkout_state=input`, { scroll: false });
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl overflow-x-clip">
      <div className="flex h-max w-full flex-col gap-6">
        <AnimatePresence mode="wait">
          {!checkoutState || checkoutState === "input" ? (
            <motion.div
              key="input"
              variants={containerVariants}
              initial={hasLoaded ? "enter" : "center"}
              animate="center"
              exit="exit"
              className="mt-auto flex h-full flex-col gap-4"
            >
              <h1 className="mb-auto text-center text-xl font-semibold text-blue-600">
                {toolQuery.data?.name}
              </h1>
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm focus:outline-none active:outline-none"
                placeholder="Enter a title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex w-full items-center justify-between rounded-lg border border-zinc-200 p-2 text-sm text-zinc-700">
                <p>Image fit</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedImageFit("FIT")}
                    className={`${selectedImageFit === "FIT" ? "bg-blue-600 text-white" : "bg-zinc-50 text-zinc-700"} flex w-20 items-center justify-center rounded-lg border border-zinc-200 text-sm transition`}
                  >
                    <p className="text-sm font-medium">Fit</p>
                  </button>
                  <button
                    onClick={() => setSelectedImageFit("STRETCH")}
                    className={`${selectedImageFit === "STRETCH" ? "bg-blue-600 text-white" : "bg-zinc-50 text-zinc-700"} flex w-20 items-center justify-center rounded-lg border border-zinc-200 text-sm transition`}
                  >
                    <p className="text-sm font-medium">Stretch</p>
                  </button>
                  <button
                    onClick={() => setSelectedImageFit("FILL")}
                    className={`${selectedImageFit === "FILL" ? "bg-blue-600 text-white" : "bg-zinc-50 text-zinc-700"} flex w-20 items-center justify-center rounded-lg border border-zinc-200 text-sm transition`}
                  >
                    <p className="text-sm font-medium">Fill</p>
                  </button>
                </div>
              </div>
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
                  numberOfFiles={20}
                  maxSizeBytes={5 * 1024 * 1024}
                  allowedTypes={[
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/webp",
                  ]}
                  splitAudio={false}
                />

                <CheckoutButtons
                  copy={"Convert"}
                  enabled={previews.length > 0}
                />
              </div>
            </motion.div>
          ) : null}
          {checkoutState === "credit_checkout" &&
            toolQuery.data &&
            previews.length > 0 && (
              <CreditCheckoutWindow
                copy={"Convert"}
                onPaymentSuccess={onPaymentSuccess}
                toolQuery={toolQuery}
                fileDurationMinutes={previews[0].length}
              />
            )}
          {checkoutState === "stripe_checkout" &&
            toolQuery.data &&
            previews.length > 0 && (
              <StripeCheckoutWindow
                onPaymentSuccess={onPaymentSuccess}
                toolQuery={toolQuery}
              />
            )}
          {checkoutState === "loading" && <LoadingWindow />}
          {checkoutState === "success" && (
            <PurchaseSuccessWindow
              downloadLink={downloadLink}
              downloadCode={downloadCode}
            />
          )}
        </AnimatePresence>
      </div>

      {previews.length > 0 && (
        <div className="relative mt-6 aspect-[1/1.4] w-full overflow-y-scroll rounded-lg border border-zinc-200 bg-white px-4 py-1">
          {previews.map((preview, index) => (
            <div key={preview.id} className="group relative my-3">
              <div className="aspect-[1/1.4] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={preview.previewUrl}
                  alt={preview.file.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-100"
                />
              </div>
              <div className="absolute left-0 top-0 flex h-7 w-max items-center gap-2 bg-white/60 px-2 py-1.5 text-xs text-gray-500">
                <p
                  className="truncate text-xs text-gray-900"
                  title={preview.file.name}
                >
                  {preview.file.name}
                </p>
              </div>
              <p className="absolute bottom-0 left-0 flex h-7 w-max items-center rounded-bl-lg bg-white/60 px-2 py-1.5 text-xs text-gray-500">
                {index + 1} of {previews.length}
              </p>
              <button
                onClick={() => {
                  setPreviews((prev) => {
                    const fileToRemove = prev.find((p) => p.id === preview.id);
                    if (fileToRemove) {
                      URL.revokeObjectURL(fileToRemove.previewUrl);
                    }

                    const newPreviews = prev.filter((p) => p.id !== preview.id);
                    return newPreviews;
                  });
                }}
                className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-gray-600 hover:bg-white hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div
            className={`${checkoutState === "loading" ? "absolute inset-0" : "hidden"} bg-white/50 backdrop-blur-sm`}
          />
        </div>
      )}
    </main>
  );
}
