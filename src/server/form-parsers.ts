import "server-only";

const text = (form: FormData, key: string): string | undefined => {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
};

export function customerInputFrom(form: FormData) {
  return {
    businessName: text(form, "businessName") ?? "",
    contactName: text(form, "contactName"),
    phone: text(form, "phone"),
    email: text(form, "email"),
    addressLine1: text(form, "addressLine1") ?? "",
    addressLine2: text(form, "addressLine2"),
    city: text(form, "city") ?? "",
    region: text(form, "region"),
    postalCode: text(form, "postalCode"),
    notes: text(form, "notes"),
  };
}
