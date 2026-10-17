"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { toLatinDigits } from "@/lib/digits";
import { parseAmount } from "@/lib/money";
import { formBool, formText, runAction, type ActionState } from "@/server/action-utils";
import { requireActor } from "@/server/auth/session";
import { ValidationError } from "@/server/errors";
import { addProductImage, createProduct, makePrimaryImage, removeProductImage, saveBrand, saveCategory, setProductArchived, updateProduct } from "@/server/modules/products/service";
import type { ProductInput } from "@/server/modules/products/schemas";

/** Jalali model years are entered in the UI; the database stores Gregorian years. */
const JALALI_OFFSET = 621;

function parseJsonArray<T>(value: string | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function productInputFrom(form: FormData): ProductInput {
  const priceText = formText(form, "price") ?? "";
  const price = parseAmount(priceText);
  if (price === null) throw new ValidationError("قیمت را بررسی کنید.", { price: ["مبلغ را به ریال و فقط با رقم وارد کنید."] });
  const year = (v: unknown) => {
    const n = Number(toLatinDigits(String(v ?? "")).trim());
    if (!n) return undefined;
    return n < 1700 ? n + JALALI_OFFSET : n;
  };
  return {
    sku: formText(form, "sku") ?? "",
    name: formText(form, "name") ?? "",
    slug: formText(form, "slug"),
    shortDescription: formText(form, "shortDescription"),
    description: formText(form, "description") ?? "",
    categoryId: formText(form, "categoryId") ?? "",
    brandId: formText(form, "brandId") ?? "",
    price,
    oeReferences: (formText(form, "oeReferences") ?? "")
      .split(/[,،\n]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    specs: parseJsonArray<{ label: string; value: string }>(formText(form, "specs")).filter((s) => s.label?.trim() || s.value?.trim()),
    fitments: parseJsonArray<{ make: string; model: string; yearFrom: string; yearTo: string; engine: string }>(formText(form, "fitments"))
      .filter((f) => f.make?.trim() || f.model?.trim())
      .map((f) => ({ make: f.make, model: f.model, yearFrom: year(f.yearFrom) ?? 0, yearTo: year(f.yearTo), engine: f.engine })),
    weightGrams: toLatinDigits(formText(form, "weightGrams") ?? "").trim() || undefined,
    lowStockThreshold: toLatinDigits(formText(form, "lowStockThreshold") ?? "5"),
    isFeatured: formBool(form, "isFeatured"),
  };
}

export async function createProductAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let id: string | null = null;
  const result = await runAction(async () => {
    const product = await createProduct(await requireActor(), productInputFrom(form), {
      initialStock: Number(toLatinDigits(formText(form, "initialStock") ?? "0")) || 0,
      binLocation: formText(form, "binLocation"),
    });
    id = product.id;
  });
  if (result.ok && id) redirect(`/admin/products/${id}?created=1`);
  return result;
}

export async function updateProductAction(productId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    await updateProduct(await requireActor(), productId, productInputFrom(form));
    refresh();
  }, "تغییرات کالا ذخیره شد.");
}

export async function setArchivedAction(productId: string, archived: boolean): Promise<ActionState> {
  return runAction(async () => {
    await setProductArchived(await requireActor(), productId, archived);
    refresh();
  }, archived ? "کالا بایگانی شد و دیگر در کاتالوگ نمایش داده نمی‌شود." : "کالا بازگردانی شد.");
}

export async function uploadImageAction(productId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) throw new ValidationError("تصویری انتخاب کنید.", { image: ["فایلی انتخاب نشده است."] });
    const bytes = new Uint8Array(await file.arrayBuffer());
    await addProductImage(await requireActor(), productId, { bytes, alt: formText(form, "alt") });
    refresh();
  }, "تصویر بارگذاری شد.");
}

export async function removeImageAction(imageId: string): Promise<ActionState> {
  return runAction(async () => {
    await removeProductImage(await requireActor(), imageId);
    refresh();
  }, "تصویر حذف شد.");
}

export async function primaryImageAction(imageId: string): Promise<ActionState> {
  return runAction(async () => {
    await makePrimaryImage(await requireActor(), imageId);
    refresh();
  }, "تصویر اصلی تغییر کرد.");
}

export async function saveCategoryAction(categoryId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(
    async () => {
      await saveCategory(
        await requireActor(),
        {
          name: formText(form, "name") ?? "",
          slug: formText(form, "slug"),
          description: formText(form, "description"),
          illustration: formText(form, "illustration") || "generic",
          sortOrder: toLatinDigits(formText(form, "sortOrder") ?? "0"),
          isActive: formBool(form, "isActive"),
        },
        categoryId ?? undefined,
      );
      refresh();
    },
    categoryId ? "دسته‌بندی ذخیره شد." : "دسته‌بندی ایجاد شد.",
  );
}

export async function saveBrandAction(brandId: string | null, _prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(
    async () => {
      await saveBrand(
        await requireActor(),
        {
          name: formText(form, "name") ?? "",
          slug: formText(form, "slug"),
          country: formText(form, "country"),
          description: formText(form, "description"),
          isActive: formBool(form, "isActive"),
        },
        brandId ?? undefined,
      );
      refresh();
    },
    brandId ? "برند ذخیره شد." : "برند ایجاد شد.",
  );
}
