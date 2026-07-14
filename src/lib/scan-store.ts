import type { ScanResult } from "./scan-types";

const KEY = "acc.currentScan";

export function saveScan(scan: ScanResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(scan));
}

export function loadScan(): ScanResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScanResult;
  } catch {
    return null;
  }
}

export function clearScan() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
