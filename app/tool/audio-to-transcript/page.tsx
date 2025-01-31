"use client";
import { useEffect, useMemo, useState } from "react";
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
import { cn, containerVariants } from "@/lib/utils";
import StripeCheckoutWindow from "@/components/stripe-checkout-window";
import { useFileInputContext } from "@/components/file-input-provider";
import FileInput from "@/components/file-input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AudioLines, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function ToolPage() {
  const { user } = useUser();
  const { previews, setPreviews } = useFileInputContext();

  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [title, setTitle] = useState("");

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
  const { hasLoaded } = useFirstMount();
  const { toast } = useToast();

  const toolQuery = useQuery({
    queryKey: ["tool", toolUrl],
    queryFn: async () => {
      const response = await getToolData(toolUrl);
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
        language: languages.find((l) => l.label === selectedLanguage)?.value,
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

  const languages = useMemo(() => {
    return [
      { label: "English", value: "en" },
      { label: "French", value: "fr" },
      { label: "German", value: "de" },
      { label: "Spanish", value: "es" },
      { label: "Portuguese", value: "pt" },
      { label: "Russian", value: "ru" },
      { label: "Japanese", value: "ja" },
      { label: "Korean", value: "ko" },
      { label: "Chinese", value: "zh" },
    ] as const;
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
              className="mt-auto flex h-full flex-col gap-6"
            >
              <h1 className="mb-auto text-center text-xl font-semibold text-blue-600">
                {toolQuery.data?.name}
              </h1>
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm focus:outline-none active:outline-none"
                placeholder="Output title (optional)"
                maxLength={50}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white p-2 text-sm">
                <p>Audio Language</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex w-28 justify-center gap-4 rounded-lg border border-zinc-200 bg-white px-2 text-zinc-700 active:bg-blue-500 active:text-white">
                      {selectedLanguage ? selectedLanguage : "Select language"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search framework..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <CommandGroup>
                          {languages.map((language) => (
                            <CommandItem
                              value={language.label}
                              key={language.value}
                              onSelect={() => {
                                setSelectedLanguage(language.label);
                              }}
                            >
                              {language.label}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  language.value === selectedLanguage
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div
                className={`${!user ? "cursor-not-allowed text-zinc-400" : "text-zinc-700"} flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white p-2 text-sm`}
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
                    "audio/x-wav",
                    "audio/wav",
                    "video/mp4",
                    "video/webm",
                    "video/x-matroska",
                  ]}
                  splitAudio={true}
                />

                <CheckoutButtons
                  copy={"Generate"}
                  enabled={previews.length > 0}
                />
              </div>
            </motion.div>
          ) : null}
          {checkoutState === "credit_checkout" &&
            toolQuery.data &&
            previews.length > 0 && (
              <CreditCheckoutWindow
                copy={"Generate"}
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
                requestOptions={{
                  fileDurationMinutes: previews[0].length,
                }}
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
        <div className="relative mt-6 w-full overflow-y-scroll rounded-lg border border-zinc-200 bg-white px-4 py-1">
          {previews.map((preview) => {
            if (preview.file.type.startsWith("audio")) {
              return (
                <div
                  key={preview.id}
                  className="flex h-12 w-full items-center gap-6"
                >
                  <button
                    onClick={() => {
                      setPreviews((prev) => {
                        const fileToRemove = prev.find(
                          (p) =>
                            p.file.name.split(".")[0] ===
                            preview.file.name.split(".")[0],
                        );
                        if (fileToRemove) {
                          URL.revokeObjectURL(fileToRemove.previewUrl);
                        }

                        const newPreviews = prev.filter(
                          (p) =>
                            p.file.name.split(".")[0] !==
                            preview.file.name.split(".")[0],
                        );
                        return newPreviews;
                      });
                    }}
                    disabled={checkoutState !== "input"}
                    className="flex items-center justify-center rounded-lg border border-zinc-200 p-1 transition hover:bg-zinc-100 disabled:opacity-50 disabled:hover:bg-zinc-50"
                  >
                    <X className="h-6 w-6 text-zinc-700" />
                  </button>
                  <AudioLines className="h-8 w-8" />
                  <p className="text-sm text-zinc-700">{preview.file.name}</p>
                  <p className="text-sm text-zinc-700">
                    {(preview.file.size / 1024 ** 2).toFixed(2)}MB
                  </p>
                  <p className="text-sm text-zinc-700">{preview.length} min</p>
                </div>
              );
            } else return null;
          })}
        </div>
      )}
    </main>
  );
}
