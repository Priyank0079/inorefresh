/**
 * Daily ordering-window helper (PRD: orders only accepted between the open time
 * and the 8:00 PM cut-off, IST). Pure + testable: pass `now` to override time.
 */

export interface OrderWindowResult {
  open: boolean;
  message: string;
  opensAt: string; // "06:00"
  closesAt: string; // "20:00"
  enabled: boolean;
}

interface WindowSettings {
  orderCutOffEnabled?: boolean;
  orderOpenTime?: string;
  orderCutOffTime?: string;
}

const IST_OFFSET_MIN = 330; // UTC+5:30

/** Minutes-since-midnight in IST for a given instant. */
function istMinutes(now: Date): number {
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMin + IST_OFFSET_MIN) % 1440;
}

/** Parse "HH:MM" → minutes since midnight. Falls back to `def`. */
function parseHHMM(value: string | undefined, def: number): number {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return def;
  const [h, m] = value.split(":").map(Number);
  if (h > 23 || m > 59) return def;
  return h * 60 + m;
}

export function getOrderWindow(settings: WindowSettings | null | undefined, now: Date = new Date()): OrderWindowResult {
  const opensAt = settings?.orderOpenTime || "06:00";
  const closesAt = settings?.orderCutOffTime || "20:00";
  const enabled = settings?.orderCutOffEnabled !== false; // default ON

  if (!enabled) {
    return { open: true, enabled: false, opensAt, closesAt, message: "Ordering window disabled — open 24/7." };
  }

  const cur = istMinutes(now);
  const openMin = parseHHMM(opensAt, 360); // 06:00
  const closeMin = parseHHMM(closesAt, 1200); // 20:00

  const open = cur >= openMin && cur < closeMin;
  const message = open
    ? `Ordering is open (until ${closesAt}).`
    : cur < openMin
      ? `Ordering opens at ${opensAt}. Please try again later.`
      : `Ordering is closed for today (after ${closesAt}). Please place your order tomorrow after ${opensAt}.`;

  return { open, enabled: true, opensAt, closesAt, message };
}
