/** Shared class strings (kept out of "use client" modules so Server Components can import them). */
export const inputClasses =
  "block w-full rounded-xs border border-line bg-white px-3 text-[15px] text-ink placeholder:text-steel-400 shadow-[inset_0_1px_0_rgba(12,13,15,0.03)] transition-colors duration-150 hover:border-steel-300 focus:border-ink focus:outline-none focus:ring-0 disabled:bg-bone disabled:text-steel-500 aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-50/40";

export const selectClasses =
  "h-11 appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4.5l4 4 4-4' fill='none' stroke='%230c0d0f' stroke-width='1.5'/%3E%3C/svg%3E\")]";

export const tableClasses = {
  wrap: "overflow-x-auto rounded-xs border border-line bg-white",
  table: "w-full min-w-[640px] border-collapse text-left text-sm",
  thead: "border-b border-line bg-bone/60",
  th: "type-eyebrow whitespace-nowrap px-4 py-3 font-medium text-steel-600",
  tr: "border-b border-line/70 last:border-0 transition-colors hover:bg-bone/40",
  td: "px-4 py-3 align-middle",
};

export const panelClasses = "rounded-xs border border-line bg-white";
