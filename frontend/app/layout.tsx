import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Newsreader({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "TabuLens — Financial Table Trust Layer",
  description:
    "Reads a financial table from a document and verifies its arithmetic — catching errors extraction alone leaves behind.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
