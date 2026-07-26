# Template Assets

Place the 18 template thumbnails and hover preview videos in this folder.

Each template uses one thumbnail image and one short preview video. The file
names must match the paths in `data/templates.ts`.

## Expected Files

| Template | Thumbnail | Hover preview |
| --- | --- | --- |
| One Element Scroll | `one-element-scroll-thumb.png` | `one-element-scroll-preview.mp4` |
| Scroll Based Layout Animations | `scroll-based-layout-animations-thumb.png` | `scroll-based-layout-animations-preview.mp4` |
| SVG Mask Scroll Transition | `svg-mask-scroll-transition-thumb.png` | `svg-mask-scroll-transition-preview.mp4` |
| Wavy Cubes | `wavy-cubes-thumb.png` | `wavy-cubes-preview.mp4` |
| On Scroll Layout Formations | `on-scroll-layout-formations-thumb.png` | `on-scroll-layout-formations-preview.mp4` |
| Readymag | `readymag-thumb.png` | `readymag-preview.mp4` |
| Kononenko Group | `kononenko-group-thumb.png` | `kononenko-group-preview.mp4` |
| Cheese & Pixels | `cheese-and-pixels-thumb.png` | `cheese-and-pixels-preview.mp4` |
| Program Studio | `program-studio-thumb.png` | `program-studio-preview.mp4` |
| Grand Hotel Lviv | `grand-hotel-lviv-thumb.png` | `grand-hotel-lviv-preview.mp4` |
| Diamond Rose Sanctuary | `diamond-rose-sanctuary-thumb.png` | `diamond-rose-sanctuary-preview.mp4` |
| Fame Estate | `fame-estate-thumb.png` | `fame-estate-preview.mp4` |
| DirectOut ACE | `directout-ace-thumb.png` | `directout-ace-preview.mp4` |
| Don't Board Me | `dont-board-me-thumb.png` | `dont-board-me-preview.mp4` |
| Hypefluency | `hypefluency-thumb.png` | `hypefluency-preview.mp4` |
| Fifth & Dune | `fifth-and-dune-thumb.png` | `fifth-and-dune-preview.mp4` |
| Keytom | `keytom-thumb.png` | `keytom-preview.mp4` |
| Aventura Dental Arts | `aventura-dental-arts-thumb.png` | `aventura-dental-arts-preview.mp4` |

## Asset Guidelines

- Use `.png` screenshots for captured thumbnails, or replace them with
  optimized `.jpg` files later and update `data/templates.ts`.
- Use short muted `.mp4` previews, ideally 3-6 seconds each.
- Keep preview videos compressed for Vercel. If the videos become too large,
  move them to Vercel Blob or another hosted media source and update
  `previewVideo` in `data/templates.ts`.
- Use your own screenshots and preview clips for any templates you plan to
  distribute or present as Shadyy-owned work.
