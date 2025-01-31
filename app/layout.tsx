import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import QueryProvider from "@/components/query-provider";
import Footer from "@/components/footer";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Taylors Tools",
  description: "Just some simple web tools for annoying tasks.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <html className={`${GeistSans.variable} antialiased`} lang="en">
          <head>
            <script
              src="https://unpkg.com/react-scan/dist/auto.global.js"
              async
            />
          </head>
          <body className="">
            <Navigation />
            <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-[112rem] px-4 pb-6 pt-24 md:px-[10vw]">
              {children}
            </div>
            <Footer />
            <Toaster />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
