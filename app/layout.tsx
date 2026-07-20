import { frFR, enUS } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Poppins, Inter } from "next/font/google";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

import { InstallPrompt } from "@/components/install-prompt";
import { ExitModal } from "@/components/modals/exit-modal";
import { HeartsModal } from "@/components/modals/hearts-modal";
import { PracticeModal } from "@/components/modals/practice-modal";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config";

import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: "#D35400",
};

export const metadata: Metadata = {
  ...siteConfig,
  title: "WoLingo",
  applicationName: "WoLingo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WoLingo",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : "fr";
  // Clerk has no Wolof pack; French is the closest fit for Wolof speakers.
  const clerkLocalization = locale === "en" ? enUS : frFR;

  return (
    <ClerkProvider
      localization={clerkLocalization}
      appearance={{
        options: {
          logoImageUrl: "/favicon.ico",
        },
        variables: {
          colorPrimary: "#D35400",
        },
      }}
      telemetry={false}
      afterSignOutUrl="/"
    >
      <html lang={locale === "en" ? "en" : locale === "wo" ? "wo" : "fr"}>
        <body className={`${poppins.variable} ${inter.variable} font-sans`}>
          <Toaster theme="light" richColors closeButton />
          <ExitModal />
          <HeartsModal />
          <PracticeModal />
          {children}
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
