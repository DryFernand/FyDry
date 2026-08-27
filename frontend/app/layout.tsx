import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FyDry — Ordena tus gastos, tranquiliza tu mente",
  description: "La plataforma financiera minimalista para gestionar tus finanzas personales y empresariales sin estrés. Claridad absoluta sobre tus gastos.",
  keywords: ["control de gastos", "finanzas personales", "presupuesto", "ahorro", "tranquilidad financiera", "FyDry"],
  authors: [{ name: "FyDry Team" }],
  openGraph: {
    title: "FyDry — Ordena tus gastos, tranquiliza tu mente",
    description: "Claridad total sobre tus finanzas personales sin complicaciones.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
