import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPL Ownership Live",
  description: "Live FPL player ownership tracker — trends, breakouts, and momentum."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
