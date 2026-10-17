import { faNumber } from "@/lib/digits";
import { formatShortDate } from "@/lib/format";

/**
 * Lightweight server-rendered SVG bar chart (no client JS). The time axis runs
 * oldest → newest from left to right, the convention for charts in RTL UIs too.
 */
export function DailyBarChart({
  data,
  valueOf,
  format,
  label,
  height = 180,
}: {
  data: { date: string }[];
  valueOf: (d: { date: string }) => number;
  format: (v: number) => string;
  label: string;
  height?: number;
}) {
  const values = data.map(valueOf);
  const max = Math.max(1, ...values);
  const n = data.length;
  const width = 640;
  const gap = n > 40 ? 1 : 3;
  const barW = (width - gap * (n - 1)) / n;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-auto w-full" role="img" aria-label={label}>
        {ticks.map((t) => {
          const y = height - (t / max) * height;
          return <line key={t} x1={0} x2={width} y1={y} y2={y} stroke="var(--color-line)" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "3 4"} />;
        })}
        {data.map((d, i) => {
          const v = values[i]!;
          const h = (v / max) * height;
          const x = i * (barW + gap);
          return (
            <g key={d.date}>
              <rect x={x} y={height - h} width={Math.max(barW, 1)} height={Math.max(h, v > 0 ? 2 : 0)} fill={i === n - 1 ? "var(--color-ember)" : "var(--color-ink)"} opacity={i === n - 1 ? 1 : 0.82}>
                <title>{`${formatShortDate(`${d.date}T12:00:00Z`)}: ${format(v)}`}</title>
              </rect>
            </g>
          );
        })}
        {[0, Math.floor((n - 1) / 2), n - 1].map((i) =>
          data[i] ? (
            <text key={i} x={i * (barW + gap) + barW / 2} y={height + 18} textAnchor="middle" fontSize="11" fill="var(--color-steel-500)" fontFamily="Arial, Tahoma, sans-serif">
              {formatShortDate(`${data[i]!.date}T12:00:00Z`)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11.5px] text-steel-500">
        <span>حداکثر: {format(max)}</span>
        <span>{faNumber(n)} روز</span>
      </figcaption>
    </figure>
  );
}

/** Horizontal proportion bars for ranked lists. */
export function RankBar({ value, max, tone = "ink" }: { value: number; max: number; tone?: "ink" | "ember" }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full bg-steel-100" aria-hidden>
      <div className={tone === "ember" ? "h-full bg-ember" : "h-full bg-ink"} style={{ width: `${pct}%` }} />
    </div>
  );
}
