import { LoaderCircle } from "lucide-react";

export default function LoadingModal() {
  return (
    <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-black/50">
      <div className="flex h-72 w-96 flex-col items-center justify-center gap-4 rounded-lg bg-white">
        <p className="text-xl font-semibold text-blue-600">Loading...</p>
        <p className="max-w-52 text-center text-sm text-zinc-700">
          Please do not close this window or refresh the page.
        </p>
        <LoaderCircle className="h-12 w-12 animate-spin" />
      </div>
    </div>
  );
}
