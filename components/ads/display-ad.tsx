"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface DisplayAdProps {
  slot?: string;
  label: string;
}

export function DisplayAd({ slot, label }: DisplayAdProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const canLoadAd = Boolean(client && slot);

  useEffect(() => {
    if (!canLoadAd) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn("AdSense slot failed to initialize:", error);
    }
  }, [canLoadAd, slot]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-100">
      {canLoadAd ? (
        <>
          <Script
            async
            id="adsbygoogle-script"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
            crossOrigin="anonymous"
          />
          <ins
            className="adsbygoogle block h-full w-full"
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format="rectangle"
            data-full-width-responsive="false"
          />
        </>
      ) : (
        <AdPlaceholder label={label} />
      )}
    </div>
  );
}

function AdPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-4 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        Advertisement
      </span>
      <span className="mt-2 text-sm font-medium text-neutral-700">{label}</span>
      <span className="mt-1 text-xs text-neutral-500">Connect ad slot ID</span>
    </div>
  );
}
