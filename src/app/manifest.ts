import type { MetadataRoute } from "next";

/** Web app manifest for the visitor (field sales) app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/visitor",
    name: "اتوپارت — سفارش‌گیری ویزیتور",
    short_name: "اتوپارت",
    description: "ثبت سفارش با موجودی لحظه‌ای برای ویزیتورهای اتوپارت.",
    lang: "fa-IR",
    dir: "rtl",
    start_url: "/visitor",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0d0f",
    theme_color: "#0c0d0f",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "سفارش جدید", url: "/visitor/orders/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "سفارش‌های من", url: "/visitor/orders", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "مشتریان", url: "/visitor/customers", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
