import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ErrorLens Code",
  description: "Next-Generation Desktop IDE designed for maximum speed and intelligence. Experience zero-latency coding with integrated AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-text selection:bg-primary/30 antialiased`}>
        {children}
      </body>
    </html>
  );
}
