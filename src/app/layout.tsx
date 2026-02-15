import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Julian & Jacqueline | 21.02.2026",
  description: "Nuestra boda - 21 de febrero de 2026",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C9A84C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
