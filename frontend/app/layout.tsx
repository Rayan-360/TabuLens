import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TabuLens — Financial Table Trust Layer",
  description:
    "Extracts financial tables and validates their arithmetic — catching errors raw extraction passes silently.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plex.className}>
      <body>{children}</body>
    </html>
  );
}
