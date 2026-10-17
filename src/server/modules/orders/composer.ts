import "server-only";
import { businessToday, parseIsoDate, toIsoDate } from "@/lib/format";
import type { Actor } from "@/server/auth/actor";
import { searchOrderableProducts } from "../products/queries";

/** Date bounds for the composer's delivery-date picker (business time zone). */
export function composerDateBounds(now = new Date()) {
  const today = businessToday(now);
  const max = toIsoDate(new Date(parseIsoDate(today)!.getTime() + 180 * 86_400_000));
  return { today, maxDate: max };
}

/** Fresh orderable product data (current price + availability) for a set of ids. */
export async function loadComposerProducts(actor: Actor, ids: string[]) {
  if (ids.length === 0) return new Map();
  const { items } = await searchOrderableProducts(actor, { ids });
  return new Map(items.map((p) => [p.id, { id: p.id, sku: p.sku, name: p.name, brand: p.brand, category: p.category, illustration: p.illustration, image: p.image, price: p.price, availability: p.availability }]));
}
