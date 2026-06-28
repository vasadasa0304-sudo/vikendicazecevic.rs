const CONTENT = window.SITE_CONTENT;

const AMENITY_ICONS = {
  beds: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>',
  terrace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>',
  heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"></path></svg>',
  ac: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><path d="m20 16-4-4 4-4"></path><path d="m4 8 4 4-4 4"></path><path d="m16 4-4 4-4-4"></path><path d="m8 20 4-4 4 4"></path></svg>',
  linen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M4 8h16"></path><path d="M9 3v5"></path></svg>',
  kitchen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2"></path><path d="M6 2v20"></path><path d="M18 2a3 3 0 0 0-3 3v7h3"></path><path d="M18 2v20"></path></svg>',
  park: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.03a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z"></path><path d="M12 19v3"></path></svg>',
  parking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M9 17V8h4a2.5 2.5 0 0 1 0 5H9"></path></svg>',
  bbq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
  playground: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21L8 4M21 21L16 4M5 8h14"></path><path d="M10 8v6M14 8v6M10 14h4"></path></svg>',
};

const INQUIRY_ICONS = {
  response:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.11 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"></path></svg>',
  price:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>',
  beds: AMENITY_ICONS.beds,
  phone:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.18 4.18 2 2 0 0 1 4.16 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
  email:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>',
  telegram:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.14 13.405l-2.97-.924c-.645-.204-.658-.645.136-.953l11.57-4.461c.537-.194 1.006.131.686.181z"></path></svg>',
};

const GALLERY_OVERLAY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>';

const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add("visible"), index * 60);
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      )
    : null;

const nav = document.getElementById("main-nav");
const navLinks = document.getElementById("nav-links");
const hamburger = document.getElementById("hamburger");
const lb = document.getElementById("lightbox");
const lbContent = document.getElementById("lb-content");
const mapFrame = document.getElementById("location-map");

// Default to the page's own baked language (/ = sr, /en/ = en) so a server-rendered
// English page doesn't flip back to Serbian on load; an explicit saved choice still wins.
const PAGE_LANG = document.documentElement.lang === "en" ? "en" : "sr";
let currentLang = localStorage.getItem("lang") || PAGE_LANG;
let currentIdx = 0;
let lastFocusedElement = null;

if (!CONTENT || !CONTENT.localized) {
  throw new Error("SITE_CONTENT is missing.");
}

if (!window.SITE_CONFIG) {
  throw new Error("SITE_CONFIG is missing.");
}

if (!CONTENT.localized[currentLang]) {
  currentLang = "sr";
}

document.documentElement.classList.add("reveal-ready");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLocale(lang = currentLang) {
  return CONTENT.localized[lang] || CONTENT.localized.sr;
}

function getPrimaryContact() {
  return CONTENT.shared.contactDetails[0] || { label: "", value: "" };
}

function getDisplayCabinName(lang = currentLang) {
  if (lang === "en" && CONTENT.shared.englishName) {
    return CONTENT.shared.englishName;
  }

  return CONTENT.shared.cabinName;
}

function getHeaderCabinName(lang = currentLang) {
  const isSmallScreen = window.matchMedia("(max-width: 560px)").matches;

  if (!isSmallScreen) {
    return getDisplayCabinName(lang);
  }

  if (lang === "en" && CONTENT.shared.englishShortName) {
    return CONTENT.shared.englishShortName;
  }

  return CONTENT.shared.shortName || CONTENT.shared.cabinName;
}

function applyTokens(value) {
  if (typeof value !== "string") return value;

  const primaryContact = getPrimaryContact();
  const tokens = {
    cabinName: getDisplayCabinName(),
    primaryContactLabel: primaryContact.label,
    primaryContactValue: primaryContact.value,
  };

  return value.replace(/\{\{(\w+)\}\}/g, (_, token) => tokens[token] ?? "");
}

function flattenStrings(source, prefix = "", output = {}) {
  if (!source || typeof source !== "object") {
    return output;
  }

  Object.entries(source).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      output[nextKey] = applyTokens(value);
      return;
    }

    if (value && typeof value === "object") {
      flattenStrings(value, nextKey, output);
    }
  });

  return output;
}

function getStaticStrings(lang = currentLang) {
  return flattenStrings(getLocale(lang));
}

function getGalleryEntries(lang = currentLang) {
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
      label: applyTokens(text.label || fallbackLabel),
      caption: applyTokens(text.caption || ""),
      alt: applyTokens(text.alt || fallbackLabel),
      openLabel: applyTokens(locale.gallery.openImage || (lang === "sr" ? "Otvori fotografiju" : "Open photo")),
    };
  }).filter((entry) => entry.source || entry.fallbackSource);
}

function getGalleryItemCount() {
  return getGalleryEntries(currentLang).length;
}

function observeRevealElements(scope = document) {
  if (!revealObserver) {
    scope.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
    return;
  }

  scope.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}

function setNavMenuOpen(isOpen) {
  navLinks.classList.toggle("open", isOpen);
  hamburger.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("nav-menu-open", isOpen);
}

function closeNavMenu() {
  setNavMenuOpen(false);
}

function setMapFallbackVisible(isVisible) {
  if (!mapFrame) return;

  const fallback = mapFrame.nextElementSibling;
  if (!fallback) return;

  mapFrame.style.display = isVisible ? "none" : "block";
  fallback.classList.toggle("map-fallback-hidden", !isVisible);
}

function initMapFallback() {
  if (!mapFrame) return;

  if (!mapFrame.getAttribute("src")) {
    setMapFallbackVisible(true);
    return;
  }

  mapFrame.addEventListener("error", () => setMapFallbackVisible(true));
  mapFrame.addEventListener("load", () => setMapFallbackVisible(false));
}

function initVideoTour() {
  const trigger = document.getElementById("tour-trigger");
  if (!trigger) return;

  trigger.addEventListener("click", () => {
    const player = trigger.closest(".tour-player");
    const src = trigger.getAttribute("data-video");
    if (!player || !src) return;

    const video = document.createElement("video");
    video.className = "tour-video";
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";

    const poster = player.querySelector(".tour-poster");
    if (poster) poster.setAttribute("aria-hidden", "true");

    player.classList.add("tour-player--active");
    player.appendChild(video);
    trigger.remove();
    video.focus();
    video.play().catch(() => {});
  });
}

function getFocusableElements(scope) {
  return Array.from(
    scope.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("hidden"));
}

function trapLightboxFocus(event) {
  if (event.key !== "Tab" || !lb.classList.contains("open")) return;

  const focusableElements = getFocusableElements(lb);
  if (!focusableElements.length) return;

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(value || "").trim());
}

function isLikelyPhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .length >= 6;
}

function toDateInputValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getTodayInputValue() {
  return toDateInputValue(new Date());
}

function addDaysToInputValue(value, days) {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function clearFormInvalidState(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
}

function setFormStatus(statusElement, tone, message) {
  statusElement.className = tone ? `form-status ${tone}` : "form-status";
  statusElement.textContent = message || "";
}

function setFormSuccessStatus(statusElement, locale, isPartial = false) {
  const title = isPartial
    ? locale.form.partialTitle || locale.form.successTitle
    : locale.form.successTitle;
  const text = isPartial
    ? locale.form.partialText || locale.form.partialSuccess
    : locale.form.successText || locale.form.success;
  const fallback = locale.form.successFallback || "";

  statusElement.className = isPartial ? "form-status success partial" : "form-status success";
  statusElement.innerHTML = `
    <strong class="form-status-title">${escapeHtml(applyTokens(title || ""))}</strong>
    <span class="form-status-text">${escapeHtml(applyTokens(text || ""))}</span>
    ${fallback ? `<span class="form-status-contact">${escapeHtml(applyTokens(fallback))}</span>` : ""}
  `;
}

function validateInquiryForm(form, locale) {
  clearFormInvalidState(form);

  const invalidFields = [];
  const contactValue = form.contact.value.trim();
  const checkin = form.checkin.value;
  const checkout = form.checkout.value;
  const guests = Number(form.guests.value);
  const maxGuests = Number(CONTENT.shared.maxGuests) || 6;
  const today = getTodayInputValue();

  if (form.name.value.trim().length < 2) {
    invalidFields.push(form.name);
  }

  if (!contactValue || (!isLikelyEmail(contactValue) && !isLikelyPhone(contactValue))) {
    invalidFields.push(form.contact);
  }

  if (!checkin) {
    invalidFields.push(form.checkin);
  }

  if (!checkout || (checkin && checkout <= checkin)) {
    invalidFields.push(form.checkout);
  }

  if (checkin && checkin < today) {
    invalidFields.push(form.checkin);
  }

  if (!form.guests.value || !Number.isFinite(guests) || guests < 1 || guests > maxGuests) {
    invalidFields.push(form.guests);
  }

  if (!invalidFields.length) {
    return true;
  }

  invalidFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
  setFormStatus(
    document.getElementById("form-status"),
    "error",
    applyTokens(locale.form.invalid || locale.form.error)
  );
  invalidFields[0].focus();
  return false;
}

function syncDateInputLimits() {
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");

  if (!checkinInput || !checkoutInput) {
    return;
  }

  const today = getTodayInputValue();
  const tomorrow = addDaysToInputValue(today, 1);
  const checkoutMin = checkinInput.value ? addDaysToInputValue(checkinInput.value, 1) : tomorrow;

  checkinInput.min = today;
  checkoutInput.min = checkoutMin || tomorrow;

  if (checkinInput.value && checkinInput.value < today) {
    checkinInput.value = "";
    checkoutInput.min = tomorrow;
  }

  if (checkoutInput.value && checkoutInput.value < checkoutInput.min) {
    checkoutInput.value = "";
  }

  if (checkinInput.value && checkoutInput.value && checkoutInput.value <= checkinInput.value) {
    checkoutInput.value = "";
  }
}

function initDateInputLimits() {
  const checkinInput = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");

  if (!checkinInput || !checkoutInput) {
    return;
  }

  syncDateInputLimits();
  checkinInput.addEventListener("change", syncDateInputLimits);
  checkinInput.addEventListener("input", syncDateInputLimits);
  checkoutInput.addEventListener("change", syncDateInputLimits);
}

function applySharedContent(lang = currentLang) {
  document.querySelectorAll('[data-shared="cabinName"]').forEach((element) => {
    element.textContent = element.classList.contains("nav-logo")
      ? getHeaderCabinName(lang)
      : getDisplayCabinName(lang);
  });

  if (mapFrame && mapFrame.getAttribute("src") !== window.SITE_CONFIG.mapEmbedUrl) {
    mapFrame.src = window.SITE_CONFIG.mapEmbedUrl;
  }
}

function applyLocalizedMeta(lang) {
  const { seo } = getLocale(lang);
  const ogLocale = lang === "sr" ? "sr_RS" : "en_US";

  document.title = applyTokens(seo.title);
  document.getElementById("meta-description").setAttribute("content", applyTokens(seo.description));
  document.getElementById("meta-og-title").setAttribute("content", applyTokens(seo.ogTitle));
  document.getElementById("meta-og-description").setAttribute("content", applyTokens(seo.ogDescription));
  document.getElementById("meta-og-site-name").setAttribute("content", CONTENT.shared.cabinName);
  document.getElementById("meta-og-locale").setAttribute("content", ogLocale);
  document.getElementById("meta-twitter-title").setAttribute("content", applyTokens(seo.ogTitle));
  document.getElementById("meta-twitter-description").setAttribute("content", applyTokens(seo.ogDescription));

  const canonicalUrl = document.getElementById("canonical-url");
  const ogUrl = document.getElementById("meta-og-url");
  if (seo.url && canonicalUrl) canonicalUrl.setAttribute("href", seo.url);
  if (seo.url && ogUrl) ogUrl.setAttribute("content", seo.url);
}

function applyLocalizedText(lang) {
  const strings = getStaticStrings(lang);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = strings[element.dataset.i18n];
    if (value !== undefined) {
      element.innerHTML = value;
    }
  });

  document.querySelectorAll("[data-i18n-ph]").forEach((element) => {
    const value = strings[element.dataset.i18nPh];
    if (value !== undefined) {
      element.placeholder = value;
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const value = strings[element.dataset.i18nAria];
    const attr = element.dataset.i18nAttr || "aria-label";
    if (value !== undefined) {
      element.setAttribute(attr, value);
    }
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    const value = strings[element.dataset.i18nAlt];
    if (value !== undefined) {
      element.setAttribute("alt", value);
    }
  });

  document.querySelectorAll(".lang-btn").forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (mapFrame) {
    mapFrame.title = applyTokens(getLocale(lang).location.mapTitle || "Location map");
  }
}

function renderAboutStats(lang) {
  const container = document.getElementById("about-stats");
  const stats = getLocale(lang).about.stats;

  container.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat-item">
          <div class="stat-num">${escapeHtml(stat.value)}</div>
          <div class="stat-label">${escapeHtml(applyTokens(stat.label))}</div>
        </div>
      `
    )
    .join("");
}

function bindImageFallbacks(scope = document) {
  scope.querySelectorAll("img[data-fallback]").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        const fallbackSource = image.dataset.fallback;
        if (!fallbackSource || image.dataset.fallbackApplied === "true") return;

        image.dataset.fallbackApplied = "true";
        image.closest("picture")?.querySelectorAll("source").forEach((source) => source.remove());
        if (image.getAttribute("src") !== fallbackSource) {
          image.setAttribute("src", fallbackSource);
        }
      },
      { once: true }
    );
  });
}

function bindGalleryEvents() {
  document.querySelectorAll(".gallery-card[data-index]").forEach((item) => {
    item.addEventListener("click", () => openLightbox(Number(item.dataset.index)));
  });
}

function renderGallery(lang) {
  const grid = document.getElementById("gallery-grid");
  const items = getGalleryEntries(lang);

  grid.innerHTML = items
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

  bindGalleryEvents();
  bindImageFallbacks(grid);
}

function renderLightboxPlaceholder(lang) {
  lbContent.innerHTML = `<div class="lightbox-empty">${escapeHtml(applyTokens(getLocale(lang).gallery.lightbox.placeholder))}</div>`;
  lb.removeAttribute("aria-labelledby");
  lb.removeAttribute("aria-describedby");
}

function renderLightboxContent(index, lang = currentLang) {
  const items = getGalleryEntries(lang);
  const item = items[index];

  if (!item) {
    renderLightboxPlaceholder(lang);
    return false;
  }

  lbContent.innerHTML = `
    <figure class="lightbox-figure">
      <div class="lightbox-media">
        <img
          class="lightbox-image"
          src="${escapeHtml(item.source)}"
          data-fallback="${escapeHtml(item.fallbackSource)}"
          alt="${escapeHtml(item.alt)}"
          ${item.srcset ? `srcset="${escapeHtml(item.srcset)}"` : ""}
          sizes="(max-width: 768px) 92vw, (max-width: 1200px) 85vw, 1100px"
          width="${item.width}"
          height="${item.height}"
          decoding="async"
        >
      </div>
      <figcaption class="lightbox-caption" id="lb-caption">
        <span class="lightbox-label" id="lb-caption-label">${escapeHtml(item.label)}</span>
        <span class="lightbox-text" id="lb-caption-text">${escapeHtml(item.caption)}</span>
        <span class="lightbox-count">${index + 1} / ${items.length}</span>
      </figcaption>
    </figure>
  `;

  bindImageFallbacks(lbContent);
  lb.setAttribute("aria-labelledby", "lb-caption-label");
  lb.setAttribute("aria-describedby", item.caption ? "lb-caption-text" : "lb-caption");
  return true;
}

function renderAmenities(lang) {
  const container = document.getElementById("amenities-grid");
  const amenities = getLocale(lang).amenities;
  const groups = Array.isArray(amenities.groups)
    ? amenities.groups
    : [{ title: "", items: amenities.items || [] }];

  container.innerHTML = groups
    .map((group) => {
      const items = Array.isArray(group.items) ? group.items : [];

      return `
        <section class="amenity-group reveal">
          ${group.title ? `<h3 class="amenity-group-title">${escapeHtml(applyTokens(group.title))}</h3>` : ""}
          <div class="amenity-group-grid">
            ${items
              .map(
                (item) => `
                  <div class="amenity-card">
                    <div class="amenity-icon">${AMENITY_ICONS[item.icon] || ""}</div>
                    <div>
                      <div class="amenity-name">${escapeHtml(applyTokens(item.name))}</div>
                      <div class="amenity-detail">${escapeHtml(applyTokens(item.detail))}</div>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `
    })
    .join("");
}

function renderAttractions(lang) {
  const container = document.getElementById("attractions-list");
  const items = getLocale(lang).location.attractions;

  container.innerHTML = items
    .map(
      (item) => `
        <li>
          <span class="attraction-name">${escapeHtml(applyTokens(item.name))}</span>
          <span class="attraction-dist">${escapeHtml(applyTokens(item.distance))}</span>
        </li>
      `
    )
    .join("");
}

function renderInquiryContact(lang) {
  const container = document.getElementById("inquiry-contact-list");
  const { highlights } = getLocale(lang).inq;
  const contactDetails = CONTENT.shared.contactDetails;

  const highlightMarkup = highlights
    .map(
      (item) => `
        <div class="contact-item">
          ${INQUIRY_ICONS[item.icon] || ""}
          <span>${escapeHtml(applyTokens(item.text))}</span>
        </div>
      `
    )
    .join("");

  const contactMarkup = contactDetails
    .map(
      (item) => {
        const label = lang === "en" && item.labelEn ? item.labelEn : item.label;

        return `
        <div class="contact-item">
          ${INQUIRY_ICONS[item.icon] || ""}
          <span>${escapeHtml(label)}: <strong class="contact-handle">${escapeHtml(item.value)}</strong></span>
        </div>
      `;
      }
    )
    .join("");

  container.innerHTML = `${highlightMarkup}${contactMarkup}`;
}

function renderGuestOptions(lang) {
  const select = document.getElementById("guests");
  const options = getLocale(lang).form.guestOptions;
  const selectedValue = select.value;

  select.innerHTML = options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}">${escapeHtml(applyTokens(option.label))}</option>`
    )
    .join("");

  if (options.some((option) => option.value === selectedValue)) {
    select.value = selectedValue;
  }
}

function renderDynamicContent(lang) {
  renderAboutStats(lang);
  renderGallery(lang);
  renderAmenities(lang);
  renderAttractions(lang);
  renderInquiryContact(lang);
  renderGuestOptions(lang);
  observeRevealElements(document);

  if (!lb.classList.contains("open")) {
    renderLightboxPlaceholder(lang);
  }
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang === "en" ? "en" : "sr";
  closeNavMenu();

  applySharedContent(lang);
  applyLocalizedMeta(lang);
  applyLocalizedText(lang);
  renderDynamicContent(lang);

  if (lb.classList.contains("open")) {
    renderLightboxContent(currentIdx, lang);
  }
}

function openLightbox(index) {
  const wasOpen = lb.classList.contains("open");
  currentIdx = index;
  if (!renderLightboxContent(index, currentLang)) return;

  if (!wasOpen) {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("lb-close").focus();
  }
}

function closeLightbox() {
  lb.classList.remove("open");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  renderLightboxPlaceholder(currentLang);

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }

  lastFocusedElement = null;
}

function stepLightbox(offset) {
  const itemCount = getGalleryItemCount();
  if (!itemCount) return;
  openLightbox((currentIdx + offset + itemCount) % itemCount);
}

document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => applyLang(button.dataset.lang));
});

const navSectionEls = ["about", "gallery", "amenities", "location", "faq", "inquiry"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function updateActiveNavLink() {
  const threshold = nav.offsetHeight + 24;
  const scrollY = window.scrollY;
  let currentId = null;

  navSectionEls.forEach((section) => {
    if (section.offsetTop - threshold <= scrollY) {
      currentId = section.id;
    }
  });

  document.querySelectorAll("#main-nav .nav-center a:not(.nav-cta)").forEach((link) => {
    link.classList.toggle("nav-active", link.getAttribute("href") === `#${currentId}`);
  });
}

function getHashTarget() {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash) return null;

  try {
    return document.getElementById(decodeURIComponent(rawHash));
  } catch {
    return document.getElementById(rawHash);
  }
}

function alignHashTarget() {
  const target = getHashTarget();
  if (!target) return;

  target.scrollIntoView({ block: "start" });
  updateActiveNavLink();
}

function scheduleHashAlignment() {
  if (!window.location.hash) return;

  requestAnimationFrame(() => {
    alignHashTarget();
    window.setTimeout(alignHashTarget, 120);
    window.setTimeout(alignHashTarget, 450);
  });
}

window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 60);
  updateActiveNavLink();
});

window.addEventListener("hashchange", scheduleHashAlignment);

hamburger.addEventListener("click", () => {
  setNavMenuOpen(!navLinks.classList.contains("open"));
});

document.querySelectorAll("#main-nav .nav-center a").forEach((link) => {
  link.addEventListener("click", closeNavMenu);
});

document.addEventListener("click", (event) => {
  if (window.innerWidth > 960 || !navLinks.classList.contains("open")) return;
  if (nav.contains(event.target)) return;
  closeNavMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 960 && navLinks.classList.contains("open")) {
    closeNavMenu();
  }

  applySharedContent(currentLang);
});

document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", () => stepLightbox(-1));
document.getElementById("lb-next").addEventListener("click", () => stepLightbox(1));
lb.addEventListener("click", (event) => {
  if (event.target === lb) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (lb.classList.contains("open")) {
    trapLightboxFocus(event);

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
    return;
  }

  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    closeNavMenu();
    hamburger.focus();
  }
});

document.getElementById("inquiry-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  if (this._hp && this._hp.value) return;
  if (this.website && this.website.value) return;

  const status = document.getElementById("form-status");
  const button = this.querySelector(".btn-send");
  const locale = getLocale(currentLang);
  const form = this;

  if (!validateInquiryForm(form, locale)) {
    return;
  }

  button.textContent = applyTokens(locale.form.sending);
  button.disabled = true;
  form.setAttribute("aria-busy", "true");
  setFormStatus(status, "", "");

  const guestName = form.name.value;
  const data = {
    propertyName: CONTENT.shared.cabinName,
    guestName,
    name: guestName,
    contact: form.contact.value,
    checkin: form.checkin.value,
    checkout: form.checkout.value,
    guests: form.guests.value,
    message: form.message.value,
    timestamp: new Date().toISOString(),
    sourceLabel: window.SITE_CONFIG.siteSourceLabel || "website",
    language: currentLang,
    _hp: form._hp ? form._hp.value : "",
    website: form.website ? form.website.value : "",
  };

  try {
    const response = await fetch(window.SITE_CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (response.ok) {
      const isPartial = response.status === 207 || result?.status === "partial_success";

      if (isPartial) {
        console.warn("[inquiry] Inquiry delivered partially.", {
          channels: result?.channels || result?.deliveries,
          failed: result?.failed,
        });
      }

      setFormSuccessStatus(status, locale, isPartial);
      form.reset();
      clearFormInvalidState(form);
      renderGuestOptions(currentLang);
      syncDateInputLimits();
      return;
    }

    if (response.status === 400) {
      setFormStatus(status, "error", applyTokens(locale.form.invalid || locale.form.error));
      return;
    }

    if (response.status === 429) {
      setFormStatus(status, "error", applyTokens(locale.form.rateLimited || locale.form.error));
      return;
    }

    if (result?.status === "config_error" || result?.code === "config_error") {
      setFormStatus(status, "error", applyTokens(locale.form.configError || locale.form.error));
      return;
    }

    if (result?.status === "provider_error" || result?.code === "provider_error") {
      setFormStatus(status, "error", applyTokens(locale.form.providerError || locale.form.error));
      return;
    }

    setFormStatus(status, "error", applyTokens(result?.userMessage || locale.form.error));
  } catch {
    setFormStatus(status, "error", applyTokens(locale.form.error));
  } finally {
    button.textContent = applyTokens(locale.form.send);
    button.disabled = false;
    form.removeAttribute("aria-busy");
  }
});

document
  .querySelectorAll("#inquiry-form input, #inquiry-form textarea, #inquiry-form select")
  .forEach((field) => {
    const clearFieldFeedback = () => {
      field.removeAttribute("aria-invalid");
      setFormStatus(document.getElementById("form-status"), "", "");
    };

    field.addEventListener("input", clearFieldFeedback);
    field.addEventListener("change", clearFieldFeedback);
  });

initMapFallback();
initVideoTour();
applyLang(currentLang);
initDateInputLimits();
scheduleHashAlignment();
nav.classList.toggle("scrolled", window.scrollY > 60);
updateActiveNavLink();

// Privacy-friendly analytics (Cloudflare Web Analytics) — loads only if a token
// is configured in config.js; with no token, nothing external is requested.
(function initAnalytics() {
  const token = window.SITE_CONFIG && window.SITE_CONFIG.analyticsBeaconToken;
  if (!token) return;
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.setAttribute("data-cf-beacon", JSON.stringify({ token }));
  document.head.appendChild(beacon);
})();
