import { buildSectors, formatAmount, type Challenge } from "@/lib/roulette";
import { cn } from "@/lib/utils";

type RouletteWheelProps = {
  challenges: Challenge[];
  rotation: number;
  spinDuration: number;
  isSpinning: boolean;
  lastWinnerId: string | null;
  variant?: "sunset" | "arcade" | "prism";
  className?: string;
};

const VARIANT_STYLES = {
  sunset: {
    shellGlow: "bg-[radial-gradient(circle,_rgba(255,152,96,0.34),_transparent_62%)]",
    outerFrame:
      "absolute inset-[2.5%] rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_36%,rgba(0,0,0,0.22)_72%)] shadow-[0_32px_90px_rgba(0,0,0,0.48)]",
    panel:
      "absolute inset-[8.2%] rounded-full border bg-[radial-gradient(circle_at_50%_35%,rgba(255,244,224,0.15),rgba(20,14,12,0.92)_58%,rgba(9,7,7,1)_100%)] shadow-[inset_0_0_90px_rgba(0,0,0,0.82)]",
    panelBorder: "#72767f",
    outerRing: "#d8dde4",
    innerRing: "#676d77",
    pointer: "#ffcb8d",
    pointerGlow: "drop-shadow-[0_10px_18px_rgba(255,177,113,0.45)]",
    label: "rgba(27,15,8,0.92)",
    winner: "#fff8e8",
    labelRadius: 27,
    labelSize: 2.55,
    amountSize: 2.15,
    labelFont: "var(--font-body), sans-serif",
    amountFont: "var(--font-body), sans-serif",
    centerOuter: "#30333a",
    centerInner: "#17100b",
  },
  arcade: {
    shellGlow: "bg-[radial-gradient(circle,_rgba(255,61,153,0.28),_transparent_62%)]",
    outerFrame:
      "absolute inset-[3.5%] rounded-[30%] border border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_28px_90px_rgba(0,0,0,0.52)] rotate-45",
    panel:
      "absolute inset-[8.5%] rounded-full border bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),rgba(18,9,18,0.96)_58%,rgba(10,4,10,1)_100%)] shadow-[inset_0_0_100px_rgba(0,0,0,0.82)]",
    panelBorder: "#a93b6d",
    outerRing: "#ff67b9",
    innerRing: "#6c2948",
    pointer: "#ff4da6",
    pointerGlow: "drop-shadow-[0_10px_18px_rgba(255,77,166,0.4)]",
    label: "rgba(255,245,253,0.96)",
    winner: "#ffffff",
    labelRadius: 28.5,
    labelSize: 2.35,
    amountSize: 1.95,
    labelFont: "var(--font-heading), sans-serif",
    amountFont: "var(--font-heading), sans-serif",
    centerOuter: "#5f1738",
    centerInner: "#1c0711",
  },
  prism: {
    shellGlow: "bg-[radial-gradient(circle,_rgba(103,175,255,0.28),_transparent_62%)]",
    outerFrame:
      "absolute inset-[2.5%] rounded-full border border-sky-100/14 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.14),rgba(132,192,255,0.08),rgba(255,255,255,0.16),rgba(84,131,214,0.1),rgba(255,255,255,0.14))] shadow-[0_30px_90px_rgba(0,0,0,0.52)]",
    panel:
      "absolute inset-[8.2%] rounded-full border bg-[radial-gradient(circle_at_50%_35%,rgba(220,238,255,0.14),rgba(10,18,28,0.96)_58%,rgba(7,10,15,1)_100%)] shadow-[inset_0_0_110px_rgba(0,0,0,0.84)]",
    panelBorder: "#5d7ba8",
    outerRing: "#9fccff",
    innerRing: "#355071",
    pointer: "#8ed0ff",
    pointerGlow: "drop-shadow-[0_12px_18px_rgba(142,208,255,0.38)]",
    label: "rgba(8,15,24,0.96)",
    winner: "#ffffff",
    labelRadius: 26,
    labelSize: 2.25,
    amountSize: 2,
    labelFont: "var(--font-body), sans-serif",
    amountFont: "var(--font-body), sans-serif",
    centerOuter: "#29425c",
    centerInner: "#091521",
  },
} as const;

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeSectorPath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(50, 50, 46, endAngle);
  const end = polarToCartesian(50, 50, 46, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    "M 50 50",
    `L ${start.x} ${start.y}`,
    `A 46 46 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function truncateLabel(label: string, variant: RouletteWheelProps["variant"]) {
  const limit = variant === "arcade" ? 14 : 18;
  return label.length > limit ? `${label.slice(0, limit - 2)}...` : label;
}

function renderPointer(variant: NonNullable<RouletteWheelProps["variant"]>, pointerColor: string) {
  if (variant === "arcade") {
    return (
      <div className="absolute left-1/2 top-[2%] z-20 -translate-x-1/2">
        <div
          className="h-12 w-12 rotate-45 rounded-[0.9rem] border border-white/30 bg-black/70"
          style={{ boxShadow: `0 0 0 1px ${pointerColor}55 inset, 0 10px 24px rgba(0,0,0,0.4)` }}
        />
        <div
          className="absolute inset-[22%] rotate-0 rounded-[0.55rem]"
          style={{ backgroundColor: pointerColor }}
        />
      </div>
    );
  }

  if (variant === "prism") {
    return (
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
        <div
          className="h-0 w-0 border-l-[15px] border-r-[15px] border-t-[40px] border-l-transparent border-r-transparent"
          style={{ borderTopColor: pointerColor }}
        />
        <div className="absolute left-1/2 top-1 h-10 w-[3px] -translate-x-1/2 rounded-full bg-white/70" />
      </div>
    );
  }

  return (
    <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
      <div
        className="h-0 w-0 border-l-[16px] border-r-[16px] border-t-[36px] border-l-transparent border-r-transparent sm:border-l-[20px] sm:border-r-[20px] sm:border-t-[42px]"
        style={{ borderTopColor: pointerColor }}
      />
    </div>
  );
}

export function RouletteWheel({
  challenges,
  rotation,
  spinDuration,
  isSpinning,
  lastWinnerId,
  variant = "sunset",
  className,
}: RouletteWheelProps) {
  const sectors = buildSectors(challenges);
  const style = VARIANT_STYLES[variant];

  return (
    <div className={cn("relative mx-auto aspect-square w-full max-w-[720px]", className)}>
      <div className={cn("absolute inset-10 rounded-full blur-3xl", style.shellGlow)} />
      <div className={cn(style.outerFrame)} />
      <div className={cn(style.panel)} style={{ borderColor: `${style.panelBorder}88` }} />
      <div className={cn(style.pointerGlow)}>{renderPointer(variant, style.pointer)}</div>

      {variant === "arcade" ? (
        <>
          <div className="absolute inset-[10%] rounded-full border border-fuchsia-200/20" />
          <div className="absolute inset-[6.8%] rounded-full border border-dashed border-fuchsia-200/20" />
        </>
      ) : null}

      {variant === "prism" ? (
        <>
          <div className="absolute inset-[7.6%] rounded-full border border-sky-100/14" />
          <div className="absolute inset-[11.5%] rounded-full border border-sky-100/10" />
        </>
      ) : null}

      {sectors.length === 0 ? (
        <div className="absolute inset-[10%] z-10 grid place-items-center rounded-full border border-dashed border-white/10 bg-black/30 text-center text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Нет секторов
        </div>
      ) : (
        <svg
          className="relative z-10 h-full w-full drop-shadow-[0_24px_50px_rgba(0,0,0,0.42)]"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Рулетка усложнений"
        >
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "50% 50%",
              transition: isSpinning
                ? `transform ${spinDuration}s cubic-bezier(0.12, 0.82, 0.18, 1)`
                : "none",
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="47.2"
              fill="none"
              stroke={style.outerRing}
              strokeOpacity={variant === "arcade" ? 0.65 : 0.5}
              strokeWidth={variant === "prism" ? 1.3 : 1.1}
              strokeDasharray={variant === "arcade" ? "1.25 1.1" : undefined}
            />

            {sectors.map((sector) => {
              const isSingleSector = sectors.length === 1;
              const labelPoint = isSingleSector
                ? { x: 50, y: 29 }
                : polarToCartesian(50, 50, style.labelRadius, sector.mid);
              const isWinner = lastWinnerId === sector.id;
              const textRotation = isSingleSector
                ? 0
                : sector.mid > 180
                  ? sector.mid + 90
                  : sector.mid - 90;

              return (
                <g key={sector.id}>
                  {isSingleSector ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill={sector.accent}
                      opacity={variant === "prism" ? 0.94 : 0.97}
                      stroke={variant === "arcade" ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.26)"}
                      strokeWidth={variant === "arcade" ? "0.7" : "0.5"}
                      style={{
                        filter: isWinner ? `drop-shadow(0 0 16px ${style.pointer}66)` : "none",
                      }}
                    />
                  ) : (
                    <path
                      d={describeSectorPath(sector.start, sector.end)}
                      fill={sector.accent}
                      opacity={variant === "prism" ? 0.94 : 0.97}
                      stroke={variant === "arcade" ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.26)"}
                      strokeWidth={variant === "arcade" ? "0.7" : "0.5"}
                      style={{
                        filter: isWinner ? `drop-shadow(0 0 16px ${style.pointer}66)` : "none",
                      }}
                    />
                  )}

                  {variant === "prism" && !isSingleSector ? (
                    <path
                      d={describeSectorPath(sector.start + 1.4, sector.end - 1.4)}
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="0.34"
                    />
                  ) : null}

                  <g transform={`rotate(${textRotation}, ${labelPoint.x}, ${labelPoint.y})`}>
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y - 1.6}
                      fill={isWinner ? style.winner : style.label}
                      fontSize={style.labelSize}
                      fontFamily={style.labelFont}
                      fontWeight={variant === "arcade" ? "700" : "800"}
                      letterSpacing={variant === "arcade" ? "0.08em" : "0"}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {truncateLabel(sector.label, variant)}
                    </text>
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y + 3.6}
                      fill={isWinner ? style.winner : style.label}
                      fontSize={style.amountSize}
                      fontFamily={style.amountFont}
                      fontWeight="700"
                      letterSpacing={variant === "arcade" ? "0.06em" : "0"}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {formatAmount(sector.amount)}
                    </text>
                  </g>
                </g>
              );
            })}

            <circle cx="50" cy="50" r="11" fill={style.centerOuter} stroke="#fff" strokeWidth="1.1" />
            <circle
              cx="50"
              cy="50"
              r="8"
              fill={style.centerInner}
              stroke="rgba(255,255,255,0.24)"
              strokeWidth="0.8"
            />
            <circle cx="50" cy="50" r="3.3" fill="#fff" />
          </g>
        </svg>
      )}
    </div>
  );
}
