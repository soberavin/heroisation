import type { Metadata } from "next";
import { Manrope, Russo_One } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

const headingFont = Russo_One({
  subsets: ["latin", "cyrillic"],
  weight: "400",
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Heroization",
  description: "Рулетка усложнений для стримеров с быстрым overlay для OBS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>{children}</body>
    </html>
  );
}
