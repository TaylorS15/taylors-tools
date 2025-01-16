import FileInputProvider from "@/components/file-input-provider";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FileInputProvider>{children}</FileInputProvider>;
}
