"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { RouletteWheel } from "@/components/roulette-wheel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildOverlayHash,
  buildSectors,
  clampAmount,
  createChallenge,
  formatAmount,
  normalizeRotation,
  pickWeightedChallenge,
  sanitizeChallenges,
  sumAmounts,
  type Challenge,
} from "@/lib/roulette";
import { cn } from "@/lib/utils";

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "default-no-heal",
    label: "Без лечения до конца матча",
    amount: 300,
    accent: "#ff8c42",
  },
  {
    id: "default-no-minimap",
    label: "Играю без миникарты",
    amount: 200,
    accent: "#e85d75",
  },
  {
    id: "default-sidearm-only",
    label: "Только вторичное оружие",
    amount: 500,
    accent: "#4ca7ff",
  },
  {
    id: "default-no-silence",
    label: "Не молчу 3 минуты подряд",
    amount: 250,
    accent: "#ffd166",
  },
];

const WHEEL_VARIANTS = [
  { id: "arcade", label: "Arcade" },
  { id: "sunset", label: "Sunset" },
  { id: "prism", label: "Prism" },
] as const;

export default function RetroRoulettePage() {
  const [drafts, setDrafts] = useState<Challenge[]>(DEFAULT_CHALLENGES);
  const [sessionChallenges, setSessionChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [stage, setStage] = useState<"setup" | "roulette" | "overlay">("setup");
  const [spinDuration, setSpinDuration] = useState(8);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [origin, setOrigin] = useState("");
  const [wheelVariant, setWheelVariant] =
    useState<(typeof WHEEL_VARIANTS)[number]["id"]>("arcade");
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    delete document.body.dataset.route;

    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const sanitizedDrafts = useMemo(() => sanitizeChallenges(drafts), [drafts]);
  const totalDraftWeight = useMemo(() => sumAmounts(sanitizedDrafts), [sanitizedDrafts]);
  const totalActiveWeight = useMemo(() => sumAmounts(activeChallenges), [activeChallenges]);

  const availableChallenges = useMemo(() => {
    const pickedIds = new Set(activeChallenges.map((challenge) => challenge.id));
    return sessionChallenges.filter((challenge) => !pickedIds.has(challenge.id));
  }, [activeChallenges, sessionChallenges]);

  const wheelChallenges = stage === "setup" ? sanitizedDrafts : availableChallenges;
  const visibleWheelCount =
    stage === "setup" ? sanitizedDrafts.length : availableChallenges.length;
  const lastWinnerLabel =
    activeChallenges.find((challenge) => challenge.id === lastWinnerId)?.label ?? "Ждет спин";

  const overlayPath = useMemo(() => {
    if (activeChallenges.length === 0) {
      return "";
    }

    return `/overlay#${buildOverlayHash(activeChallenges)}`;
  }, [activeChallenges]);

  const overlayUrl = origin && overlayPath ? `${origin}${overlayPath}` : overlayPath;

  function addDraft() {
    setDrafts((current) => [...current, createChallenge(current.length + 1)]);
  }

  function updateDraft(id: string, field: "label" | "amount", value: string) {
    setDrafts((current) =>
      current.map((challenge) => {
        if (challenge.id !== id) {
          return challenge;
        }

        if (field === "label") {
          return { ...challenge, label: value };
        }

        return {
          ...challenge,
          amount: clampAmount(Number(value)),
        };
      }),
    );
  }

  function updateSpinDuration(value: string) {
    const next = clampAmount(Number(value));
    setSpinDuration(next === 0 ? 0 : Math.min(120, next));
  }

  function removeDraft(id: string) {
    setDrafts((current) => {
      const next = current.filter((challenge) => challenge.id !== id);
      return next.length > 0 ? next : [createChallenge(0)];
    });
  }

  function startRoulette() {
    const nextChallenges = sanitizeChallenges(drafts);

    if (nextChallenges.length < 2) {
      return;
    }

    setSessionChallenges(nextChallenges);
    setActiveChallenges([]);
    setStage("roulette");
    setWheelRotation(0);
    setLastWinnerId(null);
    setCopyState("idle");
  }

  function spinWheel() {
    if (isSpinning || availableChallenges.length === 0 || spinDuration < 1) {
      return;
    }

    const winner = pickWeightedChallenge(availableChallenges);
    const sectors = buildSectors(availableChallenges);
    const winnerSector = sectors.find((sector) => sector.id === winner.id);

    if (!winnerSector) {
      return;
    }

    setIsSpinning(true);
    setLastWinnerId(null);
    setCopyState("idle");

    const currentRotation = wheelRotation;
    const currentNormalized = normalizeRotation(currentRotation);
    const desiredNormalized = normalizeRotation(-winnerSector.mid);
    let delta = desiredNormalized - currentNormalized;

    if (delta > 0) {
      delta -= 360;
    }

    const extraTurns = Math.max(5, Math.round(spinDuration * 1.15));
    const nextRotation = currentRotation + delta - extraTurns * 360;

    setWheelRotation(nextRotation);

    spinTimeoutRef.current = window.setTimeout(() => {
      setActiveChallenges((current) => [...current, winner]);
      setLastWinnerId(winner.id);
      setIsSpinning(false);
      spinTimeoutRef.current = null;
    }, spinDuration * 1000);
  }

  function removeActiveChallenge(id: string) {
    setActiveChallenges((current) => current.filter((challenge) => challenge.id !== id));
    setLastWinnerId((current) => (current === id ? null : current));

    if (stage === "overlay") {
      setStage("roulette");
    }
  }

  async function copyOverlayUrl() {
    if (!overlayUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.14fr),minmax(440px,0.86fr)]">
          <Card className="relative overflow-hidden border-white/8 bg-card/90">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_32%)]" />
            <div className="absolute inset-x-8 top-0 h-px bg-white/10" />
            <CardContent className="relative p-4 sm:p-6 lg:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="primary">Wheel</Badge>
                <Badge>{visibleWheelCount} в колесе</Badge>
                <Badge>{activeChallenges.length} выбрано</Badge>
                <Badge>
                  {formatAmount(stage === "setup" ? totalDraftWeight : totalActiveWeight)} общий вес
                </Badge>
              </div>

              <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl space-y-2">
                  <h1 className="font-heading text-3xl uppercase tracking-[0.16em] text-white sm:text-4xl">
                    Рулетка усложнений
                  </h1>
                  <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                    Собирай набор, крути колесо и выводи готовый пул на стрим через browser
                    source.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[480px]">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Осталось
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{visibleWheelCount}</div>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Выбрано
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{activeChallenges.length}</div>
                  </div>
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Активный вес
                    </div>
                    <div className="mt-3 text-3xl font-semibold">
                      {formatAmount(stage === "setup" ? totalDraftWeight : totalActiveWeight)}
                    </div>
                  </div>
                </div>
              </div>

              <RouletteWheel
                challenges={wheelChallenges}
                rotation={wheelRotation}
                spinDuration={spinDuration}
                isSpinning={isSpinning}
                lastWinnerId={lastWinnerId}
                variant={wheelVariant}
                className="max-w-[920px]"
              />

              <div className="mt-6 rounded-[18px] border border-white/10 bg-black/20 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Стиль колеса
                    </div>
                    <div className="text-sm text-white/70">
                      Каждый пресет меняет не только палитру, но и корпус, указатель и подачу
                      сектора.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {WHEEL_VARIANTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setWheelVariant(item.id)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all",
                          wheelVariant === item.id
                            ? "border-white bg-white text-black shadow-[0_8px_28px_rgba(255,255,255,0.16)]"
                            : "border-white/12 bg-white/[0.03] text-white/72 hover:bg-white/[0.08]",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[240px,1fr]">
                <div className="space-y-2">
                  <Label htmlFor="spin-duration">Длительность вращения</Label>
                  <Input
                    id="spin-duration"
                    type="number"
                    min="1"
                    max="120"
                    value={spinDuration || ""}
                    onChange={(event) => updateSpinDuration(event.target.value)}
                    disabled={stage === "setup" || isSpinning}
                  />
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <Button
                    onClick={spinWheel}
                    disabled={
                      stage === "setup" ||
                      isSpinning ||
                      availableChallenges.length === 0 ||
                      spinDuration < 1
                    }
                    className="min-w-[220px]"
                  >
                    {isSpinning ? "Крутим..." : "Крутить рулетку"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-white/10 bg-black/25 p-4 sm:p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Последний выбор
                </div>
                <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  {lastWinnerLabel}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full border-white/10 bg-card/88">
            <CardHeader className="gap-4 border-b border-white/8 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="muted">Список</Badge>
                  <CardTitle>Усложнения</CardTitle>
                </div>
                <Button variant="secondary" onClick={addDraft}>
                  Добавить строку
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>{sanitizedDrafts.length} готово</Badge>
                <Badge>{formatAmount(totalDraftWeight)} общий вес</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 p-5 sm:p-6">
              {drafts.map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="grid gap-3 rounded-[16px] border border-white/10 bg-black/25 p-3 sm:grid-cols-[48px,minmax(0,1fr),140px,auto] sm:items-end"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-sm font-semibold text-white">
                    {index + 1}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`challenge-label-${challenge.id}`}>Текст</Label>
                    <Input
                      id={`challenge-label-${challenge.id}`}
                      type="text"
                      value={challenge.label}
                      placeholder="Новое усложнение"
                      onChange={(event) => updateDraft(challenge.id, "label", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`challenge-amount-${challenge.id}`}>Вес</Label>
                    <Input
                      id={`challenge-amount-${challenge.id}`}
                      type="number"
                      min="0"
                      step="50"
                      value={challenge.amount || ""}
                      onChange={(event) => updateDraft(challenge.id, "amount", event.target.value)}
                    />
                  </div>

                  <Button variant="outline" onClick={() => removeDraft(challenge.id)}>
                    Удалить
                  </Button>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={startRoulette}
                  disabled={sanitizedDrafts.length < 2}
                  className="min-w-[260px]"
                >
                  {stage === "setup" ? "Дальше" : "Пересобрать рулетку"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr),minmax(0,1.18fr)]">
          <Card className="border-white/10 bg-card/85">
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg sm:text-xl">Активный пул</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge>{activeChallenges.length}</Badge>
                  <Badge variant="muted">{formatAmount(totalActiveWeight)} вес</Badge>
                </div>
              </div>
              <Button
                onClick={() => setStage("overlay")}
                disabled={stage === "setup" || isSpinning || activeChallenges.length === 0}
                className="min-w-[190px]"
              >
                Поехали
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {activeChallenges.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Пока пусто
                </div>
              ) : (
                activeChallenges.map((challenge, index) => (
                  <div
                    key={challenge.id}
                    className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div
                      className="h-14 w-14 shrink-0 rounded-md border border-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${challenge.accent}, rgba(255,255,255,0.08))`,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div className="truncate text-sm font-semibold text-foreground sm:text-base">
                        {challenge.label}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatAmount(challenge.amount)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeActiveChallenge(challenge.id)}
                    >
                      Убрать
                    </Button>
                  </div>
                ))
              )}

              <div className="rounded-[16px] border border-white/10 bg-black/25 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Overlay
                </div>
                <div className="mt-2 text-sm text-white/70">
                  Когда пул собран, жми кнопку сверху и забирай готовый browser source для OBS.
                </div>
              </div>
            </CardContent>
          </Card>

          {stage === "overlay" ? (
            <Card className="border-white/10 bg-card/82">
              <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <Badge variant="muted">Browser Source</Badge>
                  <CardTitle>OBS Overlay</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setStage("roulette")}>
                    К рулетке
                  </Button>
                  <Button onClick={copyOverlayUrl}>Скопировать</Button>
                  <a
                    className={buttonVariants({ variant: "outline" })}
                    href={overlayPath}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть
                  </a>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4 xl:grid-cols-[1fr,640px]">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="overlay-url">Ссылка</Label>
                    <Input id="overlay-url" value={overlayUrl} readOnly />
                  </div>

                  {copyState !== "idle" ? (
                    <div
                      className={cn(
                        "rounded-[14px] border px-4 py-3 text-sm font-medium",
                        copyState === "done"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                          : "border-rose-400/30 bg-rose-400/10 text-rose-100",
                      )}
                    >
                      {copyState === "done"
                        ? "Ссылка скопирована"
                        : "Не удалось скопировать"}
                    </div>
                  ) : null}

                  <div className="rounded-[16px] border border-white/10 bg-black/25 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Рекомендация для OBS
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Укажи в browser source ширину 600 и высоту 1000. Если
                      усложнений больше 7, overlay сам переключится на медленный
                      вертикальный список.
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3">
                  {overlayPath ? (
                    <iframe
                      className="h-[520px] w-full rounded-[14px] border-0 bg-transparent"
                      title="Overlay preview"
                      src={overlayPath}
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <Badge variant="muted">Browser Source</Badge>
                <CardTitle>OBS Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-[16px] border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Появится после выбора усложнений
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
