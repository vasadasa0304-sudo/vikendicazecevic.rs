# Images

This project keeps gallery image paths in `content.js` under `shared.galleryMedia`.

Current production gallery filenames:

- `images/gallery/gallery-01-exterior.webp`
- `images/gallery/gallery-01-exterior-800.webp`
- `images/gallery/gallery-02-living-room.webp`
- `images/gallery/gallery-02-living-room-800.webp`
- `images/gallery/gallery-03-kitchen-dining.webp`
- `images/gallery/gallery-03-kitchen-dining-800.webp`
- `images/gallery/gallery-04-terrace-view.webp`
- `images/gallery/gallery-04-terrace-view-800.webp`
- `images/gallery/gallery-05-bedroom.webp`
- `images/gallery/gallery-05-bedroom-800.webp`
- `images/gallery/gallery-06-upstairs-bed.webp`
- `images/gallery/gallery-06-upstairs-bed-800.webp`
- `images/gallery/gallery-07-bathroom.webp`
- `images/gallery/gallery-07-bathroom-800.webp`
- `images/gallery/gallery-08-surroundings.webp`
- `images/gallery/gallery-08-surroundings-800.webp`

Hero and about images:

- `images/hero/hero-exterior.webp`
- `images/hero/hero-exterior-960.webp`
- `images/about/about-exterior.webp`
- `images/about/about-exterior-520.webp`
- `images/about/about-interior.webp`
- `images/about/about-interior-800.webp`

Replacement workflow:

1. Add optimized real photos to `images/hero/`, `images/about/`, or `images/gallery/`.
2. Create matching mobile variants, for example `gallery-01-exterior-800.webp`.
3. Update each `shared.galleryMedia[].src`, `srcset`, and `sizes` value in `content.js`.
4. Update the matching localized text in `localized.sr.gallery.items[]` and `localized.en.gallery.items[]`.
5. Update hardcoded hero/about `srcset` values in `index.html` if those images change.

Optimization guidance:

- Use WebP for gallery photos when possible.
- Target about `1600px` wide for gallery images and keep each file as small as practical.
- Keep an `800px` wide gallery variant for mobile browsers.
- Keep future hero images around `1920px` wide and compressed for web delivery.
- Avoid uploading raw phone/camera files directly; compress them with Squoosh, Sharp, or another image optimizer first.
