'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PanelsTopLeft, Store } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';

import InteractiveBentoGallery from '@/components/blocks/interactive-bento-gallery';
import { Logos3 } from '@/components/blocks/logos3';
import ScrollExpandMedia from '@/components/blocks/scroll-expansion-hero';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { DockTabs } from '@/components/ui/dock-tabs';
import Footer1 from '@/components/ui/footer-1';
import { MagicTextReveal } from '@/components/ui/magic-text-reveal';
import { TextRotate } from '@/components/ui/text-rotate';
import { ZoomParallax } from '@/components/ui/zoom-parallax';

const parallaxImages = [
  { src: '/f.png', alt: 'Image F' },
  { src: '/b.png', alt: 'Image B' },
  { src: '/c.png', alt: 'Image C' },
  { src: '/d.png', alt: 'Image D' },
  { src: '/a.png', alt: 'Image A' },
  { src: '/e.png', alt: 'Image E' },
  { src: '/g.jpg', alt: 'Image G' },
];

const bentoItems = [
  {
    id: 1,
    type: 'video-ad',
    title: 'Rewarded Video Slot',
    desc: 'Landscape ad placement reserved for video demand.',
    url: '',
    span: 'col-span-1 sm:col-span-2 row-span-4',
    adTagUrl: process.env.NEXT_PUBLIC_VIDEO_AD_TAG_URL,
  },
  {
    id: 2,
    type: 'display-ad',
    title: 'Square Display Slot 1',
    desc: 'Responsive square display ad.',
    url: '',
    span: 'col-span-1 row-span-3',
    adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE_1,
  },
  {
    id: 3,
    type: 'display-ad',
    title: 'Square Display Slot 2',
    desc: 'Responsive square display ad.',
    url: '',
    span: 'col-span-1 row-span-3',
    adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE_2,
  },
  {
    id: 4,
    type: 'video-ad',
    title: 'Video Demand Slot',
    desc: 'Landscape ad placement reserved for video demand.',
    url: '',
    span: 'col-span-1 sm:col-span-2 row-span-4',
    adTagUrl: process.env.NEXT_PUBLIC_VIDEO_AD_TAG_URL,
  },
  {
    id: 5,
    type: 'display-ad',
    title: 'Square Display Slot 3',
    desc: 'Responsive square display ad.',
    url: '',
    span: 'col-span-1 row-span-3',
    adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE_3,
  },
  {
    id: 6,
    type: 'display-ad',
    title: 'Square Display Slot 4',
    desc: 'Responsive square display ad.',
    url: '',
    span: 'col-span-1 row-span-3',
    adSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SQUARE_4,
  },
];

function TextRotateDemo() {
  return (
    <section className="w-full bg-white py-6">
      <div className="flex w-full flex-row items-center justify-center overflow-hidden bg-white p-6 text-2xl font-light text-foreground sm:p-10 sm:text-3xl md:p-12 md:text-5xl">
        <LayoutGroup>
          <motion.div className="flex whitespace-pre" layout>
            <motion.span
              className="pt-0.5 sm:pt-1 md:pt-2"
              layout
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            >
              Free{' '}
            </motion.span>

            <TextRotate
              texts={[
                'AI Pics',
                'AI PPT',
                'Marketing Automation',
                'Forever ❤️',
              ]}
              mainClassName="justify-center overflow-hidden rounded-lg bg-[#ff5941] px-2 py-0.5 text-white sm:px-2 sm:py-1 md:px-3 md:py-2"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2200}
            />
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}

function MiniStoreCta() {
  return (
    <section className="bg-[#f7faf8] px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-lg border border-[#dce5df] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,31,0.08)] md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#173f35] text-white">
            <Store className="h-6 w-6" />
          </span>
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-normal text-[#17664a]">
              Mini Store
            </p>
            <h2 className="text-3xl font-black leading-tight tracking-normal text-[#17201f] md:text-4xl">
              Install Signals locally.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#60706b]">
              Download the local Mini Store, click Install, and open Signals on
              localhost when setup is ready.
            </p>
          </div>
        </div>

        <Link
          href="/mini-store"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#173f35] px-5 text-sm font-black text-white transition hover:bg-[#102f27]"
        >
          Mini Store
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function TemplatesCta() {
  return (
    <section className="relative overflow-hidden bg-[#e7bd66] px-6 py-14">
      <div className="pointer-events-none absolute inset-0 bg-[url('/bigsleep.jpg')] bg-cover bg-center opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,238,0.9),rgba(231,189,102,0.78))]" />

      <div className="relative mx-auto grid max-w-6xl gap-6 rounded-lg border border-[#17110b]/10 bg-[#fff8ee]/45 p-6 shadow-[0_24px_80px_rgba(73,44,18,0.16)] backdrop-blur-md md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#17110b] text-[#fff8ee]">
            <PanelsTopLeft className="h-6 w-6" />
          </span>
          <div>
            <p className="mb-2 text-sm font-black uppercase text-[#8b3a20]">
              Website previews
            </p>
            <h2 className="text-3xl font-black leading-tight text-[#17110b] md:text-4xl">
              Choose your free website.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#5b3a1f]">
              Browse 18 cinematic website references, preview the motion, and
              open the live experience.
            </p>
          </div>
        </div>

        <Link
          href="/templates"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#17110b] px-5 text-sm font-black text-[#fff8ee] transition hover:bg-[#2a1b10]"
        >
          Preview Websites
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const [showDock, setShowDock] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowDock(window.scrollY > window.innerHeight * 0.8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen">
      <ScrollExpandMedia
  mediaType="image"
  mediaSrc="/employer-hero.png"
  bgImageSrc="/bigsleep.jpg"
        title={
          <AnimatedText
            text="नमस्ते, beloved guest."
            textClassName="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F4E4C1] drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
underlineClassName="text-[#F4E4C1]"
          />
        }
        date="You've been expected."
        scrollToExpand="↓"
      >
        <Logos3 />
      </ScrollExpandMedia>

      <ZoomParallax images={parallaxImages} />

      <TextRotateDemo />

      <TemplatesCta />

      <MiniStoreCta />

      <section className="bg-white py-10">

<InteractiveBentoGallery

  title="Keep This Site Free!"

  description="A quick ad view helps support the site and keep it free for everyone. Thanks for being part of the community."

  mediaItems={bentoItems}

/>

</section>

      <section className="grid min-h-screen grid-rows-2">

  <div className="flex items-center justify-center bg-white px-6">

  <MagicTextReveal

text="Developed by सार्थक"

fontSize={72}

color="#FFA239"

className="border-0 shadow-none bg-transparent"

/>

  </div>

  <Footer1 />

</section>

      {showDock && <DockTabs />}
    </main>
  );
}
