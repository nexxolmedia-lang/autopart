"use client";

import { useActionState, useTransition } from "react";
import { Archive, ArchiveRestore, ImagePlus, Star, Trash2 } from "lucide-react";
import { imageSrc } from "@/components/catalog/product-image";
import { Button, Spinner } from "@/components/ui/button";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import type { ActionState } from "@/server/action-utils";
import { primaryImageAction, removeImageAction, setArchivedAction, uploadImageAction } from "@/app/admin/products/actions";

export type ImageView = { id: string; url: string | null; assetId: string | null; alt: string };

export function ImageManager({ productId, images, illustration }: { productId: string; images: ImageView[]; illustration: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(uploadImageAction.bind(null, productId), {});
  const [pending, startTransition] = useTransition();
  const act = (fn: () => Promise<ActionState>) =>
    startTransition(async () => {
      const r = await fn();
      toast(r.ok ? (r.message ?? "انجام شد.") : (r.error ?? "خطا"), r.ok ? "success" : "error");
    });

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.id} className="group relative border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc(img, illustration)} alt={img.alt} className="aspect-square w-full bg-[#f5f3ee] object-contain p-2" />
            {i === 0 ? <span className="absolute start-1.5 top-1.5 bg-ink px-1.5 py-0.5 text-[10.5px] text-bone">تصویر اصلی</span> : null}
            <div className="flex border-t border-line">
              {i !== 0 ? (
                <button type="button" disabled={pending} onClick={() => act(() => primaryImageAction(img.id))} className="flex flex-1 items-center justify-center gap-1 py-2 text-[12px] hover:bg-bone" aria-label="انتخاب به‌عنوان تصویر اصلی">
                  <Star className="h-3.5 w-3.5" aria-hidden /> اصلی
                </button>
              ) : null}
              <button type="button" disabled={pending} onClick={() => act(() => removeImageAction(img.id))} className="flex flex-1 items-center justify-center gap-1 py-2 text-[12px] text-danger hover:bg-danger-50" aria-label="حذف تصویر">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form action={formAction} className="space-y-3 border border-dashed border-steel-300 p-4">
        <FormMessage state={state} />
        <label className="flex cursor-pointer flex-col gap-2 text-[13px]">
          <span className="flex items-center gap-2 font-medium">
            <ImagePlus className="h-4 w-4" aria-hidden /> بارگذاری عکس محصول
          </span>
          <input type="file" name="image" accept="image/png,image/jpeg,image/webp" required className="text-[12.5px] file:me-3 file:border-0 file:bg-ink file:px-3 file:py-2 file:text-bone" />
          <span className="text-[12px] text-steel-500">PNG، JPEG یا WebP؛ حداکثر ۲ مگابایت. عکس جدید به‌عنوان تصویر اصلی قرار می‌گیرد.</span>
        </label>
        <input name="alt" placeholder="متن جایگزین (اختیاری)" className="h-10 w-full rounded-xs border border-line bg-white px-3 text-[14px] focus:border-ink focus:outline-none" />
        <SubmitButton size="sm" variant="dark" pendingLabel="در حال بارگذاری…">
          بارگذاری
        </SubmitButton>
      </form>
    </div>
  );
}

export function ArchiveToggle({ productId, archived }: { productId: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={archived ? "outline" : "ghost"}
      className={archived ? undefined : "text-danger"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await setArchivedAction(productId, !archived);
          toast(r.ok ? (r.message ?? "انجام شد.") : (r.error ?? "خطا"), r.ok ? "success" : "error");
        })
      }
    >
      {pending ? <Spinner /> : archived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
      {archived ? "بازگردانی کالا" : "بایگانی کالا"}
    </Button>
  );
}
