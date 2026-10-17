"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible modal built on the native <dialog> element (focus trapping,
 * Escape to close and inert background come from the browser).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-xs border border-line bg-paper p-0 text-ink shadow-[var(--shadow-float)] backdrop:bg-ink/50",
        size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl",
        "max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="type-heading text-lg">{title}</h2>
              {description ? <p className="mt-1 text-sm text-steel-600">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="-me-1 rounded-xs p-1.5 text-steel-500 hover:bg-bone hover:text-ink" aria-label="بستن پنجره">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
