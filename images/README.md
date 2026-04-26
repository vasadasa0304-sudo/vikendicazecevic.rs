# Images

This project keeps gallery image paths in `content.js` under `shared.galleryMedia`.

Current gallery placeholder assets live in:

- `images/gallery/placeholders/exterior.svg`
- `images/gallery/placeholders/interior.svg`
- `images/gallery/placeholders/landscape.svg`

Recommended future real gallery filenames:

- `images/gallery/gallery-01-exterior.webp`
- `images/gallery/gallery-02-living-room.webp`
- `images/gallery/gallery-03-fireplace.webp`
- `images/gallery/gallery-04-terrace-view.webp`
- `images/gallery/gallery-05-bedroom.webp`
- `images/gallery/gallery-06-kitchen.webp`
- `images/gallery/gallery-07-forest-path.webp`
- `images/gallery/gallery-08-winter.webp`

Replacement workflow:

1. Add optimized real photos to `images/gallery/`.
2. Update each `shared.galleryMedia[].src` value in `content.js`.
3. Keep or remove the `placeholder` value depending on whether you still want a fallback.
4. Update the matching localized text in `localized.sr.gallery.items[]` and `localized.en.gallery.items[]`.

Optimization guidance:

- Use WebP for gallery photos when possible.
- Target about `1600x1200` for gallery images and keep each file under `200KB`.
- Keep the future hero image under `150KB` if possible.
- Avoid uploading raw phone/camera files directly; compress them with Squoosh, Sharp, or another image optimizer first.
- After real photos are added and tested, remove unused SVG placeholders if they are no longer referenced.
