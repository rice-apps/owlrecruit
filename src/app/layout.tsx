import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OwlRecruit",
  description:
    "A centralized recruitment platform for organizations at Rice University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
