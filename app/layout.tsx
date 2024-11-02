import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import QueryProvider from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
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
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
