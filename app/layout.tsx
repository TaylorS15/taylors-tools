import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import QueryProvider from "@/components/QueryProvider";
import Footer from "@/components/Footer";
import "@uploadthing/react/styles.css";
import "./globals.css";

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
          <body>
            <Navigation />
            <div className="min-h-[calc(100dvh-4rem)] px-4 pb-24 pt-28 md:px-[10vw]">
              {children}
            </div>
            <Footer />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
