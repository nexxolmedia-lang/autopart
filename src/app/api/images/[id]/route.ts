import { prisma } from "@/server/db";

/**
 * Serves uploaded product images stored in PostgreSQL. Assets are immutable
 * (a new upload gets a new id), so they can be cached aggressively.
 * Integration point: swap for object storage (S3/R2/Blob) + CDN at scale.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new Response("Not found", { status: 404 });
  const asset = await prisma.imageAsset.findUnique({ where: { id }, select: { data: true, mimeType: true, sha256: true } });
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${asset.sha256}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
