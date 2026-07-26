"use client";

import * as React from "react";

import type { WebsiteTemplate } from "@/data/templates";

type TemplatePreviewCardProps = {
  template: WebsiteTemplate;
};

export function TemplatePreviewCard({ template }: TemplatePreviewCardProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [thumbnailFailed, setThumbnailFailed] = React.useState(false);
  const [previewReady, setPreviewReady] = React.useState(false);

  const playPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play();
  };

  const resetPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  };

  return (
    <a
      href={template.localPath}
      onMouseEnter={playPreview}
      onMouseLeave={resetPreview}
      onFocus={playPreview}
      onBlur={resetPreview}
      className="group relative block overflow-hidden rounded-lg bg-card shadow-md outline-none transition-shadow duration-300 ease-in-out hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Open ${template.title} template`}
    >
      {thumbnailFailed ? (
        <div className="aspect-[4/5] w-full bg-muted/40" aria-hidden="true" />
      ) : (
        <img
          src={template.thumbnail}
          alt={`${template.title} website thumbnail`}
          className="pointer-events-none h-auto w-full object-cover"
          loading="lazy"
          onError={() => setThumbnailFailed(true)}
        />
      )}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setPreviewReady(true)}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 ${
          previewReady ? "group-hover:opacity-100 group-focus:opacity-100" : ""
        }`}
        aria-hidden="true"
      >
        <source src={template.previewVideo} type="video/mp4" />
      </video>
    </a>
  );
}
