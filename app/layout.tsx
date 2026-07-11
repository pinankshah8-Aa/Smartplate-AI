import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from 'sonner';
import PWARegister from '@/components/PWARegister';
import { ThemeProvider } from '@/components/ThemeProvider';
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartPlate AI | PG Mess Food Waste Reduction",
  description: "Stop college PG food waste using predictive AI portion sizing, menu feedback, and analytics.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} font-sans h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground flex flex-col selection:bg-primary/30 overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <PWARegister />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
