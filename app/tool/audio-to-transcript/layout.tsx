import FileInputProvider from "@/components/file-input-provider";
import { Suspense } from "react";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FileInputProvider>
      <Suspense>{children}</Suspense>
    </FileInputProvider>
  );
}
