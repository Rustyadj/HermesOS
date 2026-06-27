import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HermesOS · Mission Control",
  description: "AI-powered mission control platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
