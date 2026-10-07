import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SplashGate } from "@/components/brand/splash-gate";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Desparcele",
  description: "Controle de dividas parceladas para casais e pessoas",
  icons: {
    icon: [{ url: "/api/brand/favicon", type: "image/png" }],
    apple: [{ url: "/api/brand/logo" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable} font-sans`} suppressHydrationWarning>
        <SplashGate>{children}</SplashGate>
      </body>
    </html>
  );
}
