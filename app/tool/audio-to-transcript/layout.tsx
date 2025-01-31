import FileInputProvider from "@/components/file-input-provider";
import NoSsrWrapper from "@/components/no-ssr-wrapper";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FileInputProvider>
      <NoSsrWrapper>{children}</NoSsrWrapper>
    </FileInputProvider>
  );
}
