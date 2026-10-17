"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { faNumber } from "@/lib/digits";
import { cn } from "@/lib/utils";

export type NotificationItem = { id: string; title: string; body: string | null; href: string | null; readAt: string | null; createdAt: string; ago: string };

export function NotificationBell({ items, unread, dark }: { items: NotificationItem[]; unread: number; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={unread ? `اعلان‌ها، ${unread} خوانده‌نشده` : "اعلان‌ها"}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xs transition-colors",
          dark ? "text-bone/80 hover:bg-bone/10 hover:text-bone" : "text-steel-700 hover:bg-ink/[0.06] hover:text-ink",
        )}
      >
        <Bell className="h-[19px] w-[19px]" />
        {unread > 0 ? (
          <span className="type-data absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-semibold text-ink">
            {unread > 9 ? "+۹" : faNumber(unread)}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-[min(360px,calc(100vw-24px))] animate-rise border border-line bg-paper text-ink shadow-[var(--shadow-float)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="type-eyebrow text-steel-600">اعلان‌ها</p>
            {unread > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => void (await markNotificationsReadAction()))}
                className="text-[12.5px] font-medium text-ink underline-offset-2 hover:underline disabled:opacity-50"
              >
                علامت‌گذاری همه به‌عنوان خوانده‌شده
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-steel-500">اعلان جدیدی ندارید.</p>
          ) : (
            <ul className="max-h-[60dvh] overflow-y-auto">
              {items.map((n) => {
                const content = (
                  <div className="flex gap-3 px-4 py-3">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-ember")} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium leading-snug">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-[12.5px] leading-snug text-steel-600">{n.body}</p> : null}
                      <p className="type-data mt-1 text-[11px] text-steel-400">{n.ago}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} className="border-b border-line/70 last:border-0">
                    {n.href ? (
                      <Link href={n.href} onClick={() => setOpen(false)} className="block transition-colors hover:bg-white">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
