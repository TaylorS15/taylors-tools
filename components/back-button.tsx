import { ArrowLeft } from "lucide-react";

export default function BackButton({
  setCheckoutState,
}: {
  setCheckoutState: React.Dispatch<
    React.SetStateAction<"INPUT" | "CHECKOUT" | "LOADING" | "SUCCESS">
  >;
}) {
  return (
    <button
      onClick={() => setCheckoutState("INPUT")}
      className="flex items-center gap-2 text-blue-600 hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
