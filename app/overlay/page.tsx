"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  formatAmount,
  parseOverlayPayload,
  type Challenge,
  type OverlayPayload,
} from "@/lib/roulette";

const TICKER_THRESHOLD = 7;

function OverlayItem({
  item,
  index,
  compact = false,
}: {
  item: Challenge;
  index: number;
  compact?: boolean;
}) {
  return (
    <article
      className={`border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[0_12px_34px_rgba(0,0,0,0.32)] ${
        compact ? "rounded-[14px] px-4 py-4" : "rounded-[16px] px-5 py-5 sm:px-6"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`mt-1 w-2 shrink-0 ${compact ? "h-12" : "h-16 sm:h-20"}`}
          style={{ backgroundColor: item.accent }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 text-white/55">
            <div className="text-[12px] font-semibold uppercase tracking-[0.22em]">
              #{index + 1}
            </div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.22em]">
              {formatAmount(item.amount)} вес
            </div>
          </div>

          <div
            className={`mt-3 font-black leading-[0.9] tracking-[-0.03em] text-white ${
              compact
                ? "text-[clamp(1.4rem,2.8vw,2.15rem)]"
                : "text-[clamp(2rem,4.2vw,4.35rem)]"
            }`}
            style={{ textShadow: "0 3px 22px rgba(0,0,0,0.55)" }}
          >
            {item.label}
          </div>
        </div>
      </div>
    </article>
  );
}

function OverlayChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        html {
          background: transparent !important;
        }
        body {
          background: transparent !important;
          margin: 0;
          overflow: hidden;
        }
        body::before {
          display: none !important;
        }
        @keyframes overlay-marquee {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-50%);
          }
        }
      `}</style>
      {children}
    </>
  );
}

function readOverlayPayloadFromLocation() {
  const queryData = new URLSearchParams(window.location.search).get("data");
  const hashData = window.location.hash.replace(/^#/, "");

  return parseOverlayPayload(hashData || queryData);
}

export default function OverlayPage() {
  const [payload, setPayload] = useState<OverlayPayload | null | undefined>(undefined);

  useEffect(() => {
    const readPayload = () => {
      setPayload(readOverlayPayloadFromLocation());
    };

    readPayload();
    window.addEventListener("hashchange", readPayload);
    window.addEventListener("popstate", readPayload);

    return () => {
      window.removeEventListener("hashchange", readPayload);
      window.removeEventListener("popstate", readPayload);
    };
  }, []);

  const isTicker = Boolean(payload && payload.items.length > TICKER_THRESHOLD);
  const tickerDuration = payload ? Math.max(28, payload.items.length * 4) : 28;

  return (
    <OverlayChrome>
      {payload === undefined ? (
        <main className="h-screen w-screen overflow-hidden bg-transparent" />
      ) : !payload || payload.items.length === 0 ? (
        <main className="h-screen w-screen overflow-hidden bg-transparent">
          <section className="flex h-full w-full items-end justify-start p-8">
            <div className="w-[min(600px,calc(100vw-64px))] rounded-[18px] border border-white/14 bg-[rgba(4,4,6,0.94)] p-8 text-white shadow-[0_26px_90px_rgba(0,0,0,0.52)]">
              <Badge variant="muted">Heroization</Badge>
              <div className="mt-5 text-5xl font-black leading-[0.9] tracking-tight">
                Нет активных
                <br />
                усложнений
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="h-screen w-screen overflow-hidden bg-transparent">
          <section className="flex h-full w-full items-end justify-start p-8">
            <div className="w-[min(600px,calc(100vw-64px))] rounded-[18px] border border-white/14 bg-[rgba(4,4,6,0.94)] p-6 text-white shadow-[0_32px_110px_rgba(0,0,0,0.62)] sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div className="space-y-2">
                  <Badge>Heroization</Badge>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/52">
                    Активный набор
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80">
                  {formatAmount(payload.totalAmount)} общий вес
                </div>
              </div>

              {isTicker ? (
                <div className="mt-6 h-[min(820px,calc(100vh-190px))] overflow-hidden">
                  <div
                    className="flex flex-col will-change-transform"
                    style={{
                      animation: `overlay-marquee ${tickerDuration}s linear infinite`,
                    }}
                  >
                    {[0, 1].map((copyIndex) => (
                      <div key={copyIndex} className="space-y-3 pb-3">
                        {payload.items.map((item, index) => (
                          <OverlayItem
                            key={`${copyIndex}-${item.id}`}
                            item={item}
                            index={index}
                            compact
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {payload.items.map((item, index) => (
                    <OverlayItem key={item.id} item={item} index={index} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      )}
    </OverlayChrome>
  );
}
