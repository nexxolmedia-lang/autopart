/* eslint-disable @next/next/no-img-element -- local SVG illustrations and DB-served images are already optimised */
import { cn } from "@/lib/utils";

export type ImageSource = { url: string | null; assetId: string | null; alt: string } | null | undefined;

export function imageSrc(image: ImageSource, fallbackIllustration = "generic"): string {
  if (image?.assetId) return `/api/images/${image.assetId}`;
  if (image?.url) return image.url;
  return `/parts/${fallbackIllustration}.svg`;
}

/**
 * Product imagery. Bundled technical illustrations render on a drafting-paper
 * plate; uploaded photography fills the frame.
 */
export function ProductImage({
  image,
  illustration,
  alt,
  className,
  sizes = "md",
  priority,
  tone = "paper",
}: {
  image: ImageSource;
  illustration?: string;
  alt?: string;
  className?: string;
  sizes?: "sm" | "md" | "lg";
  priority?: boolean;
  tone?: "paper" | "bone" | "white";
}) {
  const src = imageSrc(image, illustration);
  const isIllustration = !image?.assetId;
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        tone === "paper" && "bg-[#f5f3ee]",
        tone === "bone" && "bg-bone",
        tone === "white" && "bg-white",
        isIllustration && "paper-grid",
        className,
      )}
    >
      <img
        src={src}
        alt={alt ?? image?.alt ?? ""}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={cn(
          "absolute inset-0 h-full w-full",
          isIllustration ? (sizes === "sm" ? "object-contain p-1.5" : sizes === "lg" ? "object-contain p-[9%]" : "object-contain p-[11%]") : "object-cover",
        )}
      />
    </div>
  );
}
