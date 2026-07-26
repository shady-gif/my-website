import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TemplateRequestDialog } from "@/components/template-request-dialog";
import { getTemplateBySlug, templates } from "@/data/templates";

type TemplatePageProps = {
  params: Promise<{ templateSlug: string }>;
};

export function generateStaticParams() {
  return templates.map((template) => ({
    templateSlug: template.slug,
  }));
}

export async function generateMetadata({
  params,
}: TemplatePageProps): Promise<Metadata> {
  const { templateSlug } = await params;
  const template = getTemplateBySlug(templateSlug);

  if (!template) {
    return {
      title: "Template Preview",
    };
  }

  return {
    title: `${template.title} Template`,
    description: `Preview ${template.title} on Shadyy.`,
  };
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { templateSlug } = await params;
  const template = getTemplateBySlug(templateSlug);

  if (!template) {
    notFound();
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#111] text-white">
      <header className="flex min-h-14 items-center justify-between gap-4 border-b border-white/10 bg-black/90 px-4">
        <Link
          href="/templates"
          className="text-sm text-white/70 transition hover:text-white"
        >
          Back to Templates
        </Link>
        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-white/45">
            Shadyy Preview
          </p>
          <h1 className="truncate text-sm font-medium">{template.title}</h1>
        </div>
        <TemplateRequestDialog templateTitle={template.title} />
      </header>
      <iframe
        src={template.previewUrl}
        title={`${template.title} template preview`}
        className="min-h-0 flex-1 border-0 bg-white"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </main>
  );
}
