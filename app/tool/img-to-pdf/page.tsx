"use client";
import {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  DragEvent,
  useCallback,
  useMemo,
} from "react";
import { ArrowLeft, Copy, LoaderCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getToolData } from "@/lib/server";
import { usePreventUnload } from "@/hooks/use-prevent-unload";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion, Variants } from "motion/react";
import CheckoutButtons from "@/components/checkout-buttons";
import StripeCheckout from "@/components/stripe-checkout";
import useFirstMount from "@/hooks/use-first-mount";
import CreditCheckout from "@/components/credit-checkout";

interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImagesToPdf() {
  const { user } = useUser();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [title, setTitle] = useState("");
  const [selectedImageFit, setSelectedImageFit] = useState<
    "FIT" | "STRETCH" | "FILL"
  >("FIT");

  const [checkoutState, setCheckoutState] = useState<
    "INPUT" | "CREDIT_CHECKOUT" | "STRIPE_CHECKOUT" | "LOADING" | "SUCCESS"
  >("INPUT");
  const [downloadLink, setDownloadLink] = useState("");
  const [downloadCode, setDownloadCode] = useState("");

  usePreventUnload({
    enabled: checkoutState === "LOADING" || checkoutState === "SUCCESS",
    message: "Please wait until the conversion is complete before leaving.",
  });
  const { hasLoaded } = useFirstMount();
  const { toast } = useToast();

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

  const allowedTypes = useMemo(
    () => new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
    [],
  );

  function validateFiles(files: File[]): boolean {
    if (previews.length + files.length > 20) {
      toast({
        title: "Error",
        description: "Maximum 20 files allowed",
        variant: "destructive",
      });
      return false;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    const invalidFile = files.find(
      (file) => !allowedTypes.has(file.type) || file.size > maxSizeBytes,
    );

    if (invalidFile) {
      toast({
        title: "Error",
        description: !allowedTypes.has(invalidFile.type)
          ? `${invalidFile.name} is not a valid image file`
          : `${invalidFile.name} exceeds ${5}MB limit`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  function handleFiles(files: FileList) {
    const newFiles = Array.from(files);
    if (!validateFiles(newFiles)) return;

    const newPreviews = newFiles.map((file, index) => ({
      id: index.toString() + (Math.random() * 1000).toFixed(0),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    const combinedFiles = newPreviews.concat(previews);

    combinedFiles.sort((a, b) => a.file.name.localeCompare(b.file.name));

    setPreviews(combinedFiles);
  }

  const formatSize = useCallback((bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  async function onPaymentSuccess(clientSecret: string) {
    setCheckoutState("LOADING");
    const images = previews.map((preview) => preview.file);

    const encodedImages = await Promise.all(
      images.map((image) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      }),
    );

    const payload = {
      clientSecret,
      images: encodedImages,
      saveToProfile: user ? saveToProfile : false,
      title,
      selectedImageFit,
    };

    const response = await fetch("/api/tool/img-to-pdf", {
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

  // Likely necessary to prevent memory leaks when leaving the page.
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.previewUrl);
      });
    };
  }, []);

  return (
    <main className="flex w-full flex-col-reverse items-center md:flex-row md:items-start">
      <div className="h-[calc(100dvh-14rem)] w-full max-w-xl p-4 md:w-2/5">
        <div className="relative h-full w-full max-w-xl overflow-y-scroll rounded-md bg-zinc-100 px-4 py-1">
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
                <p className="text-xs text-gray-500">
                  {formatSize(preview.file.size)}
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
            className={`${checkoutState === "LOADING" ? "absolute inset-0" : "hidden"} bg-white/50 backdrop-blur-sm`}
          />
        </div>
      </div>

      <div className="flex h-max w-full max-w-xl flex-col gap-6 overflow-x-clip p-4 md:h-[calc(100dvh-14rem)] md:w-3/5 md:max-w-none">
        <AnimatePresence mode="wait">
          {checkoutState === "INPUT" && (
            <motion.div
              key="input"
              variants={containerVariants}
              initial={hasLoaded ? "enter" : "center"}
              animate="center"
              exit="exit"
              className="mt-auto flex h-full flex-col gap-4"
            >
              <h1 className="mb-auto text-center text-xl font-semibold text-blue-600">
                Image(s) to PDF
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
                <div
                  className={`${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  } relative w-full rounded-lg
            border-2 border-dashed p-4
        transition-colors`}
                  onDragOver={() => {
                    setIsDragging(true);
                  }}
                  onDragLeave={() => {
                    setIsDragging(false);
                  }}
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
                    multiple
                    accept={[...allowedTypes].join(",")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files) {
                        handleFiles(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />

                  <div className="flex flex-col items-center">
                    <p className="mb-2 text-sm text-gray-600">
                      Drop images here or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximum file size: {5}MB
                    </p>
                    <p className="text-xs text-gray-500">Maximum 20 images</p>
                  </div>
                </div>

                <CheckoutButtons
                  enabled={previews.length > 0}
                  setCheckoutState={setCheckoutState}
                />
              </div>
            </motion.div>
          )}

          {checkoutState === "CREDIT_CHECKOUT" && (
            <motion.div
              key="credit"
              variants={containerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex h-full flex-col gap-4"
            >
              <button
                onClick={() => setCheckoutState("INPUT")}
                className="flex items-center gap-2 text-blue-600 hover:underline"
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
          )}

          {checkoutState === "STRIPE_CHECKOUT" && (
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
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <StripeCheckout
                onPaymentSuccess={onPaymentSuccess}
                stripePriceId={toolQuery.data!.stripe_price_id!}
              />
            </motion.div>
          )}

          {checkoutState === "LOADING" && (
            <motion.div
              key="loading"
              variants={containerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="my-auto flex flex-col items-center justify-center gap-4"
            >
              <>
                <p className="text-xl font-semibold text-blue-600">
                  Loading...
                </p>
                <p className="max-w-52 text-center text-sm text-zinc-700">
                  Please do not close this window or refresh the page.
                </p>
                <LoaderCircle className="h-12 w-12 animate-spin text-zinc-700" />
              </>
            </motion.div>
          )}

          {checkoutState === "SUCCESS" && (
            <motion.div
              key="success"
              variants={containerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex h-full flex-col justify-between"
            >
              <button
                onClick={() => setCheckoutState("INPUT")}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="my-auto flex w-full flex-col items-center justify-center gap-4">
                <p className="text-xl font-semibold text-blue-600">Success!</p>
                <p className="text-center text-sm text-zinc-700">
                  This link will expire in 1 hour, but you can access it later
                  by saving your download code or viewing it from your profile
                  (if signed in).
                  <br></br>
                  <br></br> If you aren't signed in, or unselected "Save to
                  profile", you must save your download code to access the file.
                  Temporary files are permanently inaccessable after 24 hours.
                </p>
                <p className="max-w-52 text-center text-sm text-zinc-700">
                  <a
                    href={downloadLink}
                    rel="noreferrer"
                    target="_blank"
                    className="text-lg text-blue-600 hover:underline"
                  >
                    Click here to open
                  </a>
                </p>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-zinc-700">Download code</p>
                  <div className="flex items-center gap-6 rounded-lg border border-zinc-200 bg-white p-2 text-lg text-zinc-700">
                    <p className="">{downloadCode}</p>
                    <Copy
                      className="h-8 w-8 cursor-pointer rounded-lg p-1 hover:bg-zinc-100"
                      onClick={() => {
                        navigator.clipboard.writeText(downloadCode);
                        toast({
                          title: "Copied to clipboard!",
                        });
                      }}
                    />
                  </div>
                </div>

                <p className="max-w-96 text-center text-sm font-bold text-zinc-700">
                  Warning: Leaving this page without saving your code can cause
                  you to lose access to your file.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toaster />
    </main>
  );
}

const containerVariants: Variants = {
  enter: {
    x: "100%",
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  center: {
    x: 0,
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  exit: {
    x: "-100%",
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};
