"use client";

import { useSyncExternalStore } from "react";
import { canSaveProgress, storageStatusEvent } from "@/lib/local-progress.ts";

function subscribe(onChange: () => void) {
  window.addEventListener(storageStatusEvent, onChange);
  return () => window.removeEventListener(storageStatusEvent, onChange);
}

export function ProgressBadge({ label = "Progress saved locally" }: { label?: string }) {
  const available = useSyncExternalStore(subscribe, canSaveProgress, () => true);
  return <span className={`local-badge ${available ? "" : "storage-unavailable"}`} role="status" title={available ? "Saved in this browser" : "Browser storage is unavailable. Progress lasts until this page is reloaded."}><i />{available ? label : "Progress for this session only"}</span>;
}
