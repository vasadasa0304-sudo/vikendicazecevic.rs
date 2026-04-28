# Images

This project keeps gallery image paths in `content.js` under `shared.galleryMedia`.

Fallback placeholder assets live in:

- `images/gallery/placeholders/exterior.svg`
- `images/gallery/placeholders/interior.svg`
- `images/gallery/placeholders/landscape.svg`

Current production gallery filenames:

- `images/gallery/gallery-01-exterior.webp`
- `images/gallery/gallery-02-living-room.webp`
- `images/gallery/gallery-03-kitchen-dining.webp`
- `images/gallery/gallery-04-terrace-view.webp`
- `images/gallery/gallery-05-bedroom.webp`
- `images/gallery/gallery-06-upstairs-bed.webp`
- `images/gallery/gallery-07-bathroom.webp`
- `images/gallery/gallery-08-surroundings.webp`

Hero and about images:

- `images/hero/hero-exterior.webp`
- `images/about/about-exterior.webp`
- `images/about/about-interior.webp`

Replacement workflow:

1. Add optimized real photos to `images/hero/`, `images/about/`, or `images/gallery/`.
2. Update each `shared.galleryMedia[].src` value in `content.js`.
3. Keep or remove the `placeholder` value depending on whether you still want a fallback.
4. Update the matching localized text in `localized.sr.gallery.items[]` and `localized.en.gallery.items[]`.

Optimization guidance:

- Use WebP for gallery photos when possible.
- Target about `1600px` wide for gallery images and keep each file as small as practical.
- Keep future hero images around `1920px` wide and compressed for web delivery.
- Avoid uploading raw phone/camera files directly; compress them with Squoosh, Sharp, or another image optimizer first.
- After real photos are added and tested, remove unused SVG placeholders if they are no longer referenced.
