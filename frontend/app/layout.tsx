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
  themeColor: "#09090b",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://fydry-dary.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FyDry — Ordena tus gastos, tranquiliza tu mente",
    template: "%s | FyDry",
  },
  description:
    "La plataforma financiera minimalista para gestionar tus finanzas personales y empresariales sin estrés. Claridad absoluta sobre tus gastos.",
  keywords: [
    "control de gastos",
    "finanzas personales",
    "presupuesto",
    "ahorro",
    "tranquilidad financiera",
    "FyDry",
    "presupuesto quincenal",
    "presupuesto semanal",
  ],
  authors: [{ name: "FyDry Team" }],
  creator: "FyDry",
  publisher: "FyDry Inc.",
  icons: {
    icon: [
      { url: "/FyDry.jpeg" },
      { url: "/FyDry.jpeg", type: "image/jpeg" },
    ],
    apple: [{ url: "/FyDry.jpeg" }],
    shortcut: [{ url: "/FyDry.jpeg" }],
  },
  openGraph: {
    title: "FyDry — Ordena tus gastos, tranquiliza tu mente",
    description: "Claridad total sobre tus finanzas personales sin complicaciones.",
    url: siteUrl,
    siteName: "FyDry",
    images: [
      {
        url: "/FyDry.jpeg",
        width: 800,
        height: 800,
        alt: "FyDry Logo",
      },
    ],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FyDry — Ordena tus gastos, tranquiliza tu mente",
    description: "Claridad total sobre tus finanzas personales sin complicaciones.",
    images: ["/FyDry.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FyDry",
    url: siteUrl,
    description: "Plataforma de gestión financiera minimalista y presupuesto inteligente.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    image: `${siteUrl}/FyDry.jpeg`,
    logo: `${siteUrl}/FyDry.jpeg`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
