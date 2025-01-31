"use client";
import { useToast } from "@/hooks/use-toast";
import { getUserOperationLink } from "@/lib/server";
import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

export default function DownloadCard() {
  const { toast } = useToast();
  const [downloadCode, setDownloadCode] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <div
        className={`group flex max-h-96 min-h-80 w-full flex-col justify-between gap-4 rounded-lg bg-zinc-200 p-px transition-all duration-75 sm:min-w-64 sm:max-w-96`}
      >
        <div className="flex h-full w-full flex-col gap-4 rounded-[calc(0.7rem-4px)] bg-white p-4">
          <p className="h-14 w-max rounded-md bg-zinc-100 p-2 font-medium">
            File Access
          </p>
          <div className="flex w-full items-center gap-4">
            <Download className="h-16 w-16 font-medium text-blue-600" />
            <p className="text-lg font-medium">Have a download code?</p>
          </div>
          <p className="h-full w-full max-w-96">
            If you previously saved a download code, enter it here to access
            your file with a secure link. If your file was temporary, it will be
            inaccessible after 24 hours.
          </p>
          <div className="flex w-full items-center gap-4">
            <input
              type="text"
              disabled={isLoading}
              value={downloadCode}
              onChange={(e) => setDownloadCode(e.target.value)}
              className="w-24 rounded-lg border border-zinc-200 p-2 uppercase focus:outline-none active:outline-none"
              placeholder="ABC123"
              maxLength={6}
            />
            <button
              onClick={async () => {
                setDownloadLink("");
                setIsLoading(true);
                const url = await getUserOperationLink(downloadCode);
                if (!url.success) {
                  toast({
                    title: "Error",
                    description: url.error,
                    variant: "destructive",
                  });
                  setIsLoading(false);
                  throw new Error(url.error);
                }
                setDownloadLink(url.result);
                setDownloadCode("");
                setIsLoading(false);
              }}
              disabled={isLoading || !downloadCode}
              className="h-10 rounded-md px-3 transition hover:bg-zinc-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-zinc-700"
            >
              Enter
            </button>

            {isLoading && (
              <LoaderCircle className="ml-auto h-5 w-5 animate-spin text-zinc-500" />
            )}

            <button
              disabled={!downloadLink}
              onClick={() => window.open(downloadLink, "_blank")}
              className="ml-auto h-min text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:no-underline"
            >
              View
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
