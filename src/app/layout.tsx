import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";
import { ThemeProvider, ThemeScript } from "@/components/theme-provider";
import "./globals.css";

const tanMeringue = localFont({
  src: "../fonts/TanMeringue.otf",
  variable: "--font-tan-meringue",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://krowned.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Krowned — Book Braids, Locs & Textured Hair in the DMV",
    template: "%s | Krowned",
  },
  description:
    "Find and book braiders, loc techs, and textured-hair stylists in DC, Maryland, and Northern Virginia.",
  openGraph: {
    type: "website",
    siteName: "Krowned",
    locale: "en_US",
    images: [{ url: "/brand/logo-black.png" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${tanMeringue.variable} ${montserrat.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0C0B0A" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
