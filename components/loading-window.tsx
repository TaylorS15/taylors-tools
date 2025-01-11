import { containerVariants } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { motion } from "motion/react";

export default function LoadingWindow() {
  return (
    <motion.div
      key="loading"
      variants={containerVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="my-auto flex flex-col items-center justify-center gap-4"
    >
      <>
        <p className="text-xl font-semibold text-blue-600">Loading...</p>
        <p className="max-w-52 text-center text-sm text-zinc-700">
          Please do not close this window or refresh the page.
        </p>
        <LoaderCircle className="h-12 w-12 animate-spin text-zinc-700" />
      </>
    </motion.div>
  );
}
