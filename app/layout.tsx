import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OwlRecruit",
  description:
    "A centralized recruitment platform for organizations at Rice University.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>

            <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs py-16">
              <p className="text-muted-foreground">
                Made with{" "}
                <span role="img" aria-label="love">
                  ❤️
                </span>{" "}
                by{" "}
                <a
                  href="https://riceapps.org/"
                  target="_blank"
                  className="font-bold hover:underline text-foreground"
                  rel="noreferrer"
                >
                  RiceApps
                </a>
                .{" "}
                <span className="text-muted-foreground">
                  Last updated on February 7, 2026.
                </span>
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}