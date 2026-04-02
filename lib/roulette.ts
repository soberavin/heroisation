export type Challenge = {
  id: string;
  label: string;
  amount: number;
  accent: string;
};

export type OverlayPayload = {
  items: Challenge[];
  totalAmount: number;
};

export function createChallenge(seed: number, label = "", amount = 300): Challenge {
  const randomSuffix = Math.random().toString(16).slice(2, 8);
  const hue = Math.floor((seed * 137.5) % 360);

  return {
    id: `challenge-${seed}-${randomSuffix}`,
    label,
    amount,
    accent: `hsl(${hue}, 100%, 50%)`,
  };
}

export function sanitizeChallenges(items: Challenge[]): Challenge[] {
  return items
    .map((item) => ({
      ...item,
      label: item.label.trim(),
      amount: clampAmount(item.amount),
    }))
    .filter((item) => item.label.length > 0 && item.amount > 0);
}

export function clampAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

export function sumAmounts(items: Array<Pick<Challenge, "amount">>): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function pickWeightedChallenge(items: Challenge[]): Challenge {
  const total = sumAmounts(items);
  const threshold = Math.random() * total;
  let cursor = 0;

  for (const item of items) {
    cursor += item.amount;

    if (threshold <= cursor) {
      return item;
    }
  }

  return items[items.length - 1];
}

export function buildOverlayQuery(items: Challenge[]): string {
  const payload: OverlayPayload = {
    items,
    totalAmount: sumAmounts(items),
  };

  return `data=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function buildOverlayHash(items: Challenge[]): string {
  const payload: OverlayPayload = {
    items,
    totalAmount: sumAmounts(items),
  };

  return `data=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function parseOverlayPayload(raw: string | null): OverlayPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const normalized = raw.startsWith("data=") ? raw.slice(5) : raw;
    const decoded = safeDecodeURIComponent(normalized);
    const parsed = JSON.parse(decoded) as OverlayPayload;

    if (!Array.isArray(parsed.items)) {
      return null;
    }

    const items = sanitizeChallenges(parsed.items);

    return {
      items,
      totalAmount: sumAmounts(items),
    };
  } catch {
    return null;
  }
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export type WheelSector = Challenge & {
  start: number;
  end: number;
  mid: number;
};

export function buildSectors(items: Challenge[]): WheelSector[] {
  const total = sumAmounts(items);
  let cursor = 0;

  return items.map((item) => {
    const start = total === 0 ? 0 : (cursor / total) * 360;
    cursor += item.amount;
    const end = total === 0 ? 360 : (cursor / total) * 360;

    return {
      ...item,
      start,
      end,
      mid: start + (end - start) / 2,
    };
  });
}
