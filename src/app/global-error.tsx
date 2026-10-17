"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body style={{ fontFamily: "Arial, Tahoma, sans-serif", background: "#0c0d0f", color: "#f2f0eb", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ maxWidth: 440, padding: 24 }}>
          <p style={{ color: "#ff5b1a", letterSpacing: "0.14em", fontSize: 11, textTransform: "uppercase" }}>اتوپارت · خطای برنامه</p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>خطایی رخ داد.</h1>
          <p style={{ opacity: 0.7, lineHeight: 1.8 }}>خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.</p>
          <button onClick={reset} style={{ marginTop: 20, background: "#ff5b1a", color: "#0c0d0f", border: 0, padding: "12px 20px", fontWeight: 600, cursor: "pointer" }}>
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
