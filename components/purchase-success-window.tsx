import { useToast } from "@/hooks/use-toast";
import { containerVariants } from "@/lib/utils";
import { ArrowLeft, Copy } from "lucide-react";
import { motion } from "motion/react";

export default function PurchaseSuccessWindow({
  setCheckoutState,
  downloadLink,
  downloadCode,
}: {
  setCheckoutState: React.Dispatch<
    React.SetStateAction<
      "INPUT" | "CREDIT_CHECKOUT" | "STRIPE_CHECKOUT" | "LOADING" | "SUCCESS"
    >
  >;
  downloadLink: string;
  downloadCode: string;
}) {
  const { toast } = useToast();
  return (
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
        <p className="max-w-md text-center text-sm text-zinc-700">
          This link will expire in 1 hour, but you can access it later by saving
          your download code or viewing it from your profile (if signed in).
          <br></br>
          <br></br> If you aren&apos;t signed in, or unselected &quot;Save to
          profile&quot;, you must save your download code to access the file.
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
          Warning: Leaving this page without saving your code can cause you to
          lose access to your file.
        </p>
      </div>
    </motion.div>
  );
}
