/*
 * prebake.js — static prerender (no dependencies).
 *
 * Why: script.js renders the amenities, gallery, attractions, about-stats,
 * guest options and contact list into EMPTY containers at runtime. Crawlers
 * that don't execute JavaScript (GPTBot, ClaudeBot, PerplexityBot,
 * OAI-SearchBot, Google-Extended …) therefore saw empty sections and no
 * English. This bakes the Serbian content into index.html and emits a fully
 * crawlable English page at /en/index.html, plus a richer sitemap.
 *
 * It mirrors the markup script.js emits, so client hydration overwrites
 * identical DOM (no flash). The amenity/inquiry icon sets are read straight
 * out of script.js, so they can never drift from the live renderer.
 *
 * Idempotent: content is written between <!--PB:key--> … <!--/PB:key-->
 * sentinels and replaced in place on every run. Wired as the Netlify build
 * command; also runnable with `npm run build`.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const SCRIPT = path.join(ROOT, "script.js");
const CONTENT_JS = path.join(ROOT, "content.js");
const EN_DIR = path.join(ROOT, "en");
const EN_INDEX = path.join(EN_DIR, "index.html");
const SITEMAP = path.join(ROOT, "sitemap.xml");
const ORIGIN = "https://vikendicazecevic.rs";

// ── load content.js (it assigns window.SITE_CONTENT) ──
const win = {};
new Function("window", fs.readFileSync(CONTENT_JS, "utf8"))(win);
const CONTENT = win.SITE_CONTENT;
if (!CONTENT || !CONTENT.localized) {
  throw new Error("prebake: content.js did not define window.SITE_CONTENT");
}

// ── pull the icon sets out of script.js (single source of truth) ──
const scriptText = fs.readFileSync(SCRIPT, "utf8");
function extractLiteral(name) {
  const m = scriptText.match(new RegExp(`const ${name} =\\s*(\\{[\\s\\S]*?\\n\\});`));
  if (!m) throw new Error(`prebake: could not extract ${name} from script.js`);
  return m[1];
}
const AMENITY_ICONS = new Function(`return (${extractLiteral("AMENITY_ICONS")});`)();
const INQUIRY_ICONS = new Function(
  "AMENITY_ICONS",
  `return (${extractLiteral("INQUIRY_ICONS")});`
)(AMENITY_ICONS);
const overlayMatch = scriptText.match(/const GALLERY_OVERLAY_ICON =\s*('[\s\S]*?');/);
const GALLERY_OVERLAY_ICON = overlayMatch ? new Function(`return (${overlayMatch[1]});`)() : "";

// ── helpers mirrored from script.js ──
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getLocale(lang) {
  return CONTENT.localized[lang] || CONTENT.localized.sr;
}
function getPrimaryContact() {
  return CONTENT.shared.contactDetails[0] || { label: "", value: "" };
}
function getDisplayCabinName(lang) {
  if (lang === "en" && CONTENT.shared.englishName) return CONTENT.shared.englishName;
  return CONTENT.shared.cabinName;
}
function applyTokens(value, lang) {
  if (typeof value !== "string") return value;
  const primaryContact = getPrimaryContact();
  const tokens = {
    cabinName: getDisplayCabinName(lang),
    primaryContactLabel: primaryContact.label,
    primaryContactValue: primaryContact.value,
  };
  return value.replace(/\{\{(\w+)\}\}/g, (_, token) => tokens[token] ?? "");
}
function flattenStrings(source, prefix, lang, output) {
  output = output || {};
  if (!source || typeof source !== "object") return output;
  for (const [key, value] of Object.entries(source)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") output[nextKey] = applyTokens(value, lang);
    else if (value && typeof value === "object") flattenStrings(value, nextKey, lang, output);
  }
  return output;
}
function getGalleryEntries(lang) {
  const locale = getLocale(lang);
  const mediaItems = Array.isArray(CONTENT.shared.galleryMedia) ? CONTENT.shared.galleryMedia : [];
  const textItems = Array.isArray(locale.gallery.items) ? locale.gallery.items : [];
  const itemCount = Math.max(mediaItems.length, textItems.length);
  return Array.from({ length: itemCount }, (_, index) => {
    const media = mediaItems[index] || {};
    const text = textItems[index] || {};
    const fallbackLabel = lang === "sr" ? `Fotografija ${index + 1}` : `Photo ${index + 1}`;
    return {
      index,
      layout: media.layout || "standard",
      source: media.src || "",
      fallbackSource: media.src || "",
      srcset: media.srcset || "",
      sizes: media.sizes || "",
      width: Number(media.width) || 1600,
      height: Number(media.height) || 1200,
      label: applyTokens(text.label || fallbackLabel, lang),
      caption: applyTokens(text.caption || "", lang),
      alt: applyTokens(text.alt || fallbackLabel, lang),
      openLabel: applyTokens(
        locale.gallery.openImage || (lang === "sr" ? "Otvori fotografiju" : "Open photo"),
        lang
      ),
    };
  }).filter((entry) => entry.source || entry.fallbackSource);
}

// ── markup builders (mirror script.js render*) ──
function buildAboutStats(lang) {
  return getLocale(lang)
    .about.stats.map(
      (stat) => `
        <div class="stat-item">
          <div class="stat-num">${escapeHtml(stat.value)}</div>
          <div class="stat-label">${escapeHtml(applyTokens(stat.label, lang))}</div>
        </div>
      `
    )
    .join("");
}
function buildGallery(lang) {
  return getGalleryEntries(lang)
    .map(
      (item) => `
        <figure
          class="gallery-item gallery-item--${escapeHtml(item.layout)} reveal"
        >
          <button
            class="gallery-card"
            type="button"
            data-index="${item.index}"
            aria-haspopup="dialog"
            aria-controls="lightbox"
            aria-describedby="gallery-caption-${item.index}"
            aria-label="${escapeHtml(`${item.openLabel}: ${[item.label, item.caption].filter(Boolean).join(" — ")}`)}"
          >
            <span class="gallery-media">
              <img
                class="gallery-image"
                src="${escapeHtml(item.source)}"
                data-fallback="${escapeHtml(item.fallbackSource)}"
                alt="${escapeHtml(item.alt)}"
                ${item.srcset ? `srcset="${escapeHtml(item.srcset)}"` : ""}
                ${item.sizes ? `sizes="${escapeHtml(item.sizes)}"` : ""}
                loading="lazy"
                decoding="async"
                width="${item.width}"
                height="${item.height}"
              >
              <span class="gallery-overlay" aria-hidden="true">${GALLERY_OVERLAY_ICON}</span>
            </span>
          </button>
          <figcaption class="gallery-caption" id="gallery-caption-${item.index}">
            <span class="gallery-label">${escapeHtml(item.label)}</span>
            <span class="gallery-text">${escapeHtml(item.caption)}</span>
          </figcaption>
        </figure>
      `
    )
    .join("");
}
function buildAmenities(lang) {
  const amenities = getLocale(lang).amenities;
  const groups = Array.isArray(amenities.groups)
    ? amenities.groups
    : [{ title: "", items: amenities.items || [] }];
  return groups
    .map((group) => {
      const items = Array.isArray(group.items) ? group.items : [];
      return `
        <section class="amenity-group reveal">
          ${group.title ? `<h3 class="amenity-group-title">${escapeHtml(applyTokens(group.title, lang))}</h3>` : ""}
          <div class="amenity-group-grid">
            ${items
              .map(
                (item) => `
                  <div class="amenity-card">
                    <div class="amenity-icon">${AMENITY_ICONS[item.icon] || ""}</div>
                    <div>
                      <div class="amenity-name">${escapeHtml(applyTokens(item.name, lang))}</div>
                      <div class="amenity-detail">${escapeHtml(applyTokens(item.detail, lang))}</div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}
function buildAttractions(lang) {
  return getLocale(lang)
    .location.attractions.map(
      (item) => `
        <li>
          <span class="attraction-name">${escapeHtml(applyTokens(item.name, lang))}</span>
          <span class="attraction-dist">${escapeHtml(applyTokens(item.distance, lang))}</span>
        </li>
      `
    )
    .join("");
}
function buildInquiryContact(lang) {
  const { highlights } = getLocale(lang).inq;
  const contactDetails = CONTENT.shared.contactDetails;
  const highlightMarkup = highlights
    .map(
      (item) => `
        <div class="contact-item">
          ${INQUIRY_ICONS[item.icon] || ""}
          <span>${escapeHtml(applyTokens(item.text, lang))}</span>
        </div>
      `
    )
    .join("");
  const contactMarkup = contactDetails
    .map((item) => {
      const label = lang === "en" && item.labelEn ? item.labelEn : item.label;
      const handle = item.href
        ? `<a class="contact-handle" href="${escapeHtml(item.href)}">${escapeHtml(item.value)}</a>`
        : `<strong class="contact-handle">${escapeHtml(item.value)}</strong>`;
      return `
        <div class="contact-item">
          ${INQUIRY_ICONS[item.icon] || ""}
          <span>${escapeHtml(label)}: ${handle}</span>
        </div>
      `;
    })
    .join("");
  return `${highlightMarkup}${contactMarkup}`;
}
function buildGuests(lang) {
  return getLocale(lang)
    .form.guestOptions.map(
      (option) =>
        `<option value="${escapeHtml(option.value)}">${escapeHtml(applyTokens(option.label, lang))}</option>`
    )
    .join("");
}
function buildFaqJsonLd(lang) {
  const faq = getLocale(lang).faq;
  if (!faq || !Array.isArray(faq.items) || !faq.items.length) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: applyTokens(item.q, lang),
      acceptedAnswer: { "@type": "Answer", text: applyTokens(item.a, lang) },
    })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

// ── sentinel fill ──
function fillSentinel(html, key, inner) {
  const open = `<!--PB:${key}-->`;
  const close = `<!--/PB:${key}-->`;
  const re = new RegExp(`${escapeRegExp(open)}[\\s\\S]*?${escapeRegExp(close)}`);
  if (!re.test(html)) throw new Error(`prebake: sentinel "${key}" not found in template`);
  return html.replace(re, `${open}${inner}${close}`);
}
function bakeContainers(html, lang) {
  html = fillSentinel(html, "aboutStats", buildAboutStats(lang));
  html = fillSentinel(html, "gallery", buildGallery(lang));
  html = fillSentinel(html, "amenities", buildAmenities(lang));
  html = fillSentinel(html, "attractions", buildAttractions(lang));
  html = fillSentinel(html, "inquiryContact", buildInquiryContact(lang));
  html = fillSentinel(html, "guests", buildGuests(lang));
  html = fillSentinel(html, "faqJsonLd", buildFaqJsonLd(lang));
  return html;
}

// ── English page from the baked Serbian page ──
function generateEnglish(srHtml) {
  const srSeo = getLocale("sr").seo;
  const enSeo = getLocale("en").seo;
  const enStrings = flattenStrings(getLocale("en"), "", "en");
  let html = bakeContainers(srHtml, "en");

  // data-i18n text (leaf elements) → English
  for (const [key, value] of Object.entries(enStrings)) {
    const re = new RegExp(`(data-i18n="${escapeRegExp(key)}"[^>]*>)([\\s\\S]*?)(</)`, "g");
    html = html.replace(re, (_m, open, _inner, close) => `${open}${value}${close}`);
  }
  // translated attributes: alt / placeholder / aria-label
  html = html.replace(/<img\b[^>]*\bdata-i18n-alt="([^"]+)"[^>]*>/g, (tag, key) => {
    const v = enStrings[key];
    return v == null ? tag : tag.replace(/\balt="[^"]*"/, `alt="${escapeAttr(v)}"`);
  });
  html = html.replace(/<(?:input|textarea)\b[^>]*\bdata-i18n-ph="([^"]+)"[^>]*>/g, (tag, key) => {
    const v = enStrings[key];
    return v == null ? tag : tag.replace(/\bplaceholder="[^"]*"/, `placeholder="${escapeAttr(v)}"`);
  });
  html = html.replace(/<(?:button|a)\b[^>]*\bdata-i18n-aria="([^"]+)"[^>]*>/g, (tag, key) => {
    const v = enStrings[key];
    return v == null ? tag : tag.replace(/\baria-label="[^"]*"/, `aria-label="${escapeAttr(v)}"`);
  });

  // head: title / description (shared across title, og, twitter, JSON-LD)
  html = html.split(srSeo.title).join(enSeo.title);
  html = html.split(srSeo.description).join(enSeo.description);
  // lang + per-page locale/canonical
  html = html.replace('<html lang="sr">', '<html lang="en">');
  html = html.replace('"inLanguage": "sr"', '"inLanguage": "en"');
  html = html.replace(
    /(<link id="canonical-url" rel="canonical" href=")[^"]*(")/,
    `$1${ORIGIN}/en/$2`
  );
  html = html.replace(
    /(<meta id="meta-og-url" property="og:url" content=")[^"]*(")/,
    `$1${ORIGIN}/en/$2`
  );
  html = html.replace(
    /(<meta id="meta-og-locale" property="og:locale" content=")[^"]*(")/,
    "$1en_US$2"
  );
  html = html.replace(
    /(<meta id="meta-og-locale-alt" property="og:locale:alternate" content=")[^"]*(")/,
    "$1sr_RS$2"
  );
  // English share/social card
  html = html.replace(
    /(<meta id="meta-og-image" property="og:image" content=")[^"]*(")/,
    `$1${ORIGIN}/images/og/og-en.jpg$2`
  );
  html = html.replace(
    /(<meta id="meta-twitter-image" name="twitter:image" content=")[^"]*(")/,
    `$1${ORIGIN}/images/og/og-en.jpg$2`
  );
  return html;
}

// ── tour video facts (single source of truth for the sitemap + on-page VideoObject) ──
const VIDEO = {
  contentLoc: `${ORIGIN}/video/vikendica-tour.mp4`,
  thumbnailLoc: `${ORIGIN}/video/tour-poster.jpg`,
  duration: 108,
  publicationDate: "2026-06-29",
};

// localized <video:video> block for a page that embeds the tour
function buildVideoXml(lang) {
  const tour = getLocale(lang).tour;
  const title = `${CONTENT.shared.englishName} — ${lang === "sr" ? "video tura" : "video tour"}`;
  const description = applyTokens(tour.intro, lang);
  return `
    <video:video>
      <video:thumbnail_loc>${escapeXml(VIDEO.thumbnailLoc)}</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(description)}</video:description>
      <video:content_loc>${escapeXml(VIDEO.contentLoc)}</video:content_loc>
      <video:duration>${VIDEO.duration}</video:duration>
      <video:publication_date>${VIDEO.publicationDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`;
}

// ── sitemap with image + video entries + /en/ alternate + lastmod ──
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const gallery = getGalleryEntries("sr");
  const images = [
    { loc: `${ORIGIN}/images/hero/hero-exterior.webp`, title: getDisplayCabinName("sr") },
    ...gallery.map((g) => ({
      loc: `${ORIGIN}${g.source}`,
      title: [g.label, g.caption].filter(Boolean).join(" — "),
    })),
  ];
  const imagesXml = images
    .map(
      (img) => `
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`
    )
    .join("");
  const alternates = `
    <xhtml:link rel="alternate" hreflang="sr-RS" href="${ORIGIN}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${ORIGIN}/</loc>${alternates}
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>${imagesXml}${buildVideoXml("sr")}
  </url>
  <url>
    <loc>${ORIGIN}/en/</loc>${alternates}
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>${buildVideoXml("en")}
  </url>
</urlset>
`;
}

// ── run ──
const template = fs.readFileSync(INDEX, "utf8");
const srHtml = bakeContainers(template, "sr");
fs.writeFileSync(INDEX, srHtml);

const enHtml = generateEnglish(srHtml);
fs.mkdirSync(EN_DIR, { recursive: true });
fs.writeFileSync(EN_INDEX, enHtml);

fs.writeFileSync(SITEMAP, buildSitemap());

// ── sanity assertions (fail the build loudly rather than ship empty) ──
const checks = [
  [srHtml.includes("amenity-card"), "SR amenities not baked"],
  [srHtml.includes("gallery-card"), "SR gallery not baked"],
  [srHtml.includes("attraction-name"), "SR attractions not baked"],
  [srHtml.includes('"@type": "FAQPage"'), "SR FAQ JSON-LD not baked"],
  [!srHtml.includes("<!--PB:") === false, null], // sentinels intentionally remain as comments
  [enHtml.includes("amenity-card"), "EN amenities not baked"],
  [enHtml.includes('<html lang="en">'), "EN lang not set"],
  [enHtml.includes(getLocale("en").amenities.groups[0].items[1].name), "EN amenity text not swapped"],
  [enHtml.includes(`${ORIGIN}/en/`), "EN canonical not set"],
  [enHtml.includes('"@type": "FAQPage"'), "EN FAQ JSON-LD not baked"],
  [enHtml.includes(getLocale("en").faq.items[0].q), "EN FAQ text not swapped (missing en.faq in content.js?)"],
  [!enHtml.includes(getLocale("sr").faq.items[0].q), "EN page still shows Serbian FAQ text"],
];
for (const [ok, msg] of checks) {
  if (msg && !ok) throw new Error(`prebake: assertion failed — ${msg}`);
}

console.log(
  `prebake ✓  index.html (SR baked), en/index.html (EN), sitemap.xml — ${getGalleryEntries("sr").length} gallery images, ${getLocale("sr").faq.items.length} FAQ entries`
);
