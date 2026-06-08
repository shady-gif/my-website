"use client";

import { Play } from "lucide-react";

interface VideoAdProps {
  label: string;
  tagUrl?: string;
}

export function VideoAd({ label, tagUrl }: VideoAdProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,#171717,#3f3f46_52%,#111827)]" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
          <Play className="ml-0.5 h-5 w-5 fill-white" />
        </div>
        <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Video Advertisement
        </span>
        <span className="mt-2 text-base font-semibold">{label}</span>
        <span className="mt-1 max-w-xs text-xs text-white/60">
          {tagUrl ? "IMA/VAST tag configured" : "Add a VAST tag URL to enable playback"}
        </span>
      </div>
    </div>
  );
}
