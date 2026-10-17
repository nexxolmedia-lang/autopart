"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button, Spinner } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { addNoteAction } from "@/app/admin/orders/actions";

export type NoteView = { id: string; body: string; author: string; when: string };

/** Internal notes — visible to staff only, never to the visitor app. */
export function NotesPanel({ orderId, notes, canAdd }: { orderId: string; notes: NoteView[]; canAdd: boolean }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {canAdd ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              setError(null);
              const r = await addNoteAction(orderId, body);
              if (r.ok) {
                setBody("");
                toast(r.message ?? "ثبت شد.");
              } else setError(r.fieldErrors?.body?.[0] ?? r.error ?? "ثبت ممکن نشد.");
            });
          }}
          className="space-y-2"
        >
          <label htmlFor="note-body" className="sr-only">
            یادداشت داخلی
          </label>
          <Textarea id="note-body" rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="یادداشت داخلی برای همکاران (برای ویزیتور نمایش داده نمی‌شود)" aria-invalid={Boolean(error)} />
          {error ? (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="sm" variant="dark" disabled={pending || !body.trim()}>
            {pending ? <Spinner /> : <Send className="h-3.5 w-3.5" aria-hidden />} افزودن یادداشت
          </Button>
        </form>
      ) : null}
      {notes.length === 0 ? (
        <p className="text-[13px] text-steel-500">یادداشتی ثبت نشده است.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="border-s-2 border-ember/60 bg-bone/50 px-3 py-2.5">
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{n.body}</p>
              <p className="mt-1 text-[11.5px] text-steel-500">
                {n.author} · {n.when}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
