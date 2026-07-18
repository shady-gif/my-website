'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type MiniStoreApp = {
  slug: string;
  name: string;
  initials: string;
  category: string;
  summary: string;
  bestFor: string;
  accent: string;
  previewSide: 'left' | 'right';
  frames: string[];
};

const apps: MiniStoreApp[] = [
  {
    slug: 'mautic',
    name: 'Signals',
    initials: 'S',
    category: 'Marketing automation',
    summary: 'Capture leads, segment contacts, and run local campaigns from one private stack.',
    bestFor: 'Lead generation',
    accent: '#17734f',
    previewSide: 'right',
    frames: ['Import contacts', 'Build landing pages', 'Run campaigns'],
  },
  {
    slug: 'twenty',
    name: 'CRM',
    initials: 'C',
    category: 'CRM',
    summary: 'Track companies, contacts, deals, and followups without forcing the team into cloud lock-in.',
    bestFor: 'Sales pipeline',
    accent: '#245fca',
    previewSide: 'right',
    frames: ['Manage contacts', 'Track opportunities', 'Organize followups'],
  },
  {
    slug: 'postiz',
    name: 'Social',
    initials: 'S',
    category: 'Social scheduling',
    summary: 'Plan, draft, and schedule social content from a local-first operations hub.',
    bestFor: 'Social ops',
    accent: '#0f827a',
    previewSide: 'left',
    frames: ['Plan channels', 'Schedule posts', 'Review calendars'],
  },
  {
    slug: 'typebot',
    name: 'Leads',
    initials: 'L',
    category: 'Forms and chat',
    summary: 'Create conversational forms that qualify leads before they reach your team.',
    bestFor: 'Lead forms',
    accent: '#6b46c1',
    previewSide: 'left',
    frames: ['Ask questions', 'Qualify leads', 'Route responses'],
  },
  {
    slug: 'growthbook',
    name: 'Test',
    initials: 'T',
    category: 'Feature flags',
    summary: 'Ship experiments and feature flags with product decisions kept close to your own data.',
    bestFor: 'Experiments',
    accent: '#c43d64',
    previewSide: 'right',
    frames: ['Create flags', 'Run experiments', 'Measure impact'],
  },
];

function PreviewPanel({
  side,
  panelRef,
}: {
  side: 'left' | 'right';
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const panelApps = apps.filter((app) => app.previewSide === side);

  return (
    <aside
      ref={panelRef}
      className={`ms-preview-panel ms-preview-panel--${side}`}
      aria-hidden="true"
    >
      <div className="ms-preview-panel__images">
        {panelApps.flatMap((app) =>
          app.frames.map((frame, frameIndex) => (
            <div
              key={`${app.slug}-${frame}`}
              className="ms-preview-frame"
              data-preview-id={app.slug}
              style={
                {
                  '--app-accent': app.accent,
                  '--frame-index': frameIndex,
                } as React.CSSProperties
              }
            >
              <span>{app.initials}</span>
              <strong>{frame}</strong>
              <small>{app.name}</small>
            </div>
          )),
        )}
      </div>
      <div className="ms-preview-panel__details">
        <span className="ms-preview-title">Select an app</span>
        <span className="ms-preview-meta">Private local stack</span>
      </div>
      <div className="ms-preview-panel__inside" />
    </aside>
  );
}

export function CodropsMiniStore() {
  const rootRef = useRef<HTMLElement | null>(null);
  const leftPreviewRef = useRef<HTMLDivElement | null>(null);
  const rightPreviewRef = useRef<HTMLDivElement | null>(null);
  const activeSlugRef = useRef<string | null>(null);
  const hideTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const leftPanel = leftPreviewRef.current;
    const rightPanel = rightPreviewRef.current;

    if (!root || !leftPanel || !rightPanel) {
      return;
    }

    const cards = Array.from(root.querySelectorAll<HTMLElement>('.ms-product'));

    const panels: Record<'left' | 'right', HTMLDivElement> = {
      left: leftPanel,
      right: rightPanel,
    };

    const clearGalleryTimers = () => {
      hideTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      hideTimersRef.current = [];
    };

    const showGallery = (panel: HTMLElement, slug: string) => {
      clearGalleryTimers();

      const frames = Array.from(
        panel.querySelectorAll<HTMLElement>(`[data-preview-id="${slug}"]`),
      );
      const allFrames = Array.from(
        panel.querySelectorAll<HTMLElement>('[data-preview-id]'),
      );

      gsap.set(allFrames, { opacity: 0 });
      if (!frames.length) {
        return;
      }

      frames.forEach((frame, index) => {
        const timer = window.setTimeout(() => {
          gsap.to(frames, { opacity: 0, duration: 0.18, ease: 'power1.out' });
          gsap.to(frame, { opacity: 1, duration: 0.22, ease: 'power1.out' });
        }, index * 900);

        hideTimersRef.current.push(timer);
      });

      const restartTimer = window.setTimeout(() => showGallery(panel, slug), frames.length * 900);
      hideTimersRef.current.push(restartTimer);
    };

    const activateCard = (card: HTMLElement) => {
      const slug = card.dataset.slug;
      const side = card.dataset.previewSide as 'left' | 'right';
      const panel = panels[side];
      const appName = card.dataset.name ?? '';
      const appMeta = card.dataset.category ?? '';

      if (!slug || !panel || activeSlugRef.current === slug) {
        return;
      }

      activeSlugRef.current = slug;

      gsap.to(Object.values(panels), {
        opacity: 0,
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 0.24,
        ease: 'power2.out',
      });

      gsap.to(cards.filter((item) => item !== card), {
        opacity: 0.32,
        x: (index) => (index % 2 === 0 ? 20 : -20),
        y: (index) => (index % 2 === 0 ? 18 : -18),
        duration: 0.32,
        ease: 'power2.out',
      });

      gsap.to(card, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1.02,
        duration: 0.32,
        ease: 'power2.out',
      });

      const title = panel.querySelector<HTMLElement>('.ms-preview-title');
      const meta = panel.querySelector<HTMLElement>('.ms-preview-meta');
      if (title) title.textContent = appName;
      if (meta) meta.textContent = appMeta;

      gsap.fromTo(
        panel,
        {
          opacity: 0,
          scaleX: 0.82,
          scaleY: 0.82,
        },
        {
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          transformOrigin: 'center center',
          duration: 0.36,
          ease: 'power2.inOut',
        },
      );

      gsap.fromTo(
        panel.querySelector('.ms-preview-panel__inside'),
        {
          clipPath:
            'polygon(46% 0%, 54% 0%, 54% 46%, 100% 46%, 100% 54%, 54% 54%, 54% 100%, 46% 100%, 46% 54%, 0% 54%, 0% 46%, 46% 46%)',
        },
        {
          clipPath:
            'polygon(50% 0%, 50% 0%, 50% 50%, 100% 50%, 100% 50%, 50% 50%, 50% 100%, 50% 100%, 50% 50%, 0% 50%, 0% 50%, 50% 50%)',
          duration: 0.36,
          ease: 'power2.inOut',
        },
      );

      showGallery(panel, slug);
    };

    const clearCard = () => {
      clearGalleryTimers();
      activeSlugRef.current = null;

      gsap.to(cards, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.28,
        ease: 'power2.out',
      });
      gsap.to(Object.values(panels), {
        opacity: 0,
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 0.24,
        ease: 'power2.out',
      });
    };

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => activateCard(card));
    });

    root.addEventListener('mouseleave', clearCard);

    return () => {
      clearGalleryTimers();
      cards.forEach((card) => {
        card.replaceWith(card.cloneNode(true));
      });
      root.removeEventListener('mouseleave', clearCard);
    };
  }, []);

  return (
    <main ref={rootRef} className="ms-page">
      <header className="ms-frame">
        <Link href="/" className="ms-frame__back">
          <ArrowLeft aria-hidden="true" />
          Shadyy
        </Link>
      </header>

      <section className="ms-content" aria-label="Shadyy Mini Store applications">
        <p className="ms-desktop-note">
          Hover an app to preview. Click access to continue to the login gate.
        </p>

        <div className="ms-products">
          <ul className="ms-products__grid">
            {apps.map((app) => (
              <li
                key={app.slug}
                className="ms-product"
                data-slug={app.slug}
                data-name={app.name}
                data-category={app.category}
                data-preview-side={app.previewSide}
                style={{ '--app-accent': app.accent } as React.CSSProperties}
              >
                <div className="ms-product__cta">
                  <Link href={`/mini-store/access?app=${app.slug}`}>
                    Get access
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
                <div className="ms-product__visual">
                  <span>{app.initials}</span>
                </div>
                <div className="ms-product__copy">
                  <p>{app.category}</p>
                  <h2>{app.name}</h2>
                  <small>{app.summary}</small>
                  <strong>{app.bestFor}</strong>
                </div>
              </li>
            ))}
          </ul>

          <div className="ms-products__preview">
            <PreviewPanel side="left" panelRef={leftPreviewRef} />
            <PreviewPanel side="right" panelRef={rightPreviewRef} />
          </div>
        </div>

        <div className="ms-next-flow">
          <LockKeyhole aria-hidden="true" />
          <span>
            Access gate is the next milestone: credentials will be checked before
            the download page opens.
          </span>
        </div>
      </section>
    </main>
  );
}
