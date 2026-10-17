"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "کپی" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable (insecure context) — ignore */
        }
      }}
      className="inline-flex h-7 items-center gap-1.5 rounded-xs px-2 text-[12px] text-steel-600 transition-colors hover:bg-ink/[0.05] hover:text-ink"
      aria-label={label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? "کپی شد" : "کپی"}</span>
    </button>
  );
}
