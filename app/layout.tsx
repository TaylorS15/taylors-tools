import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import QueryProvider from "@/components/QueryProvider";
import Footer from "@/components/Footer";

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
            {children}
            <Footer />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
