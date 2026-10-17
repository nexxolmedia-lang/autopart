import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "اتوپارت — توزیع قطعات خودرو",
    template: "%s · اتوپارت",
  },
  description:
    "اتوپارت قطعات موتور، ترمز، جلوبندی، خنک‌کاری و برق خودرو را با موجودی لحظه‌ای و اپلیکیشن سفارش‌گیری ویزیتورها در اختیار تعمیرگاه‌ها و ناوگان‌ها قرار می‌دهد.",
  applicationName: "اتوپارت",
  appleWebApp: { capable: true, title: "اتوپارت", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: { type: "website", siteName: "اتوپارت", locale: "fa_IR" },
};

export const viewport: Viewport = {
  themeColor: "#0c0d0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa-IR" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
