import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle, Panel } from "@/components/admin/page-title";
import { requirePagePermission } from "@/server/auth/session";
import { getCatalogueOptions } from "@/server/modules/products/queries";
import { createProductAction } from "../actions";

export const metadata: Metadata = { title: "کالای جدید" };

export default async function NewProductPage() {
  const actor = await requirePagePermission("products.manage", "/admin/products/new");
  const options = await getCatalogueOptions();
  return (
    <>
      <PageTitle back={{ href: "/admin/products", label: "کالاها" }} eyebrow="کاتالوگ" title="کالای جدید" />
      <Panel>
        <ProductForm
          action={createProductAction}
          mode="create"
          categories={options.categories.filter((c) => c.isActive)}
          brands={options.brands.filter((b) => b.isActive)}
          canPrice={actor.permissions.has("pricing.manage")}
          canStock={actor.permissions.has("inventory.adjust")}
        />
      </Panel>
    </>
  );
}
