"use client";

import { TemplatePreviewCard } from "@/components/template-preview-card";
import MasonryGrid from "@/components/ui/masonry-grid";
import { templates } from "@/data/templates";

export function TemplatesGallery() {
  return (
    <MasonryGrid
      items={templates}
      className="columns-1 md:columns-2"
      gap="1rem"
      renderItem={(template) => <TemplatePreviewCard template={template} />}
    />
  );
}
