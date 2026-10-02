/**
 * VESTORA — Try-On UI Triggers (In-Image Overlay + Floating Corner Badge)
 * 
 * Provides frictionless, unblockable triggers across ANY shopping website:
 * 1. Floating In-Image Pill ("✦ Try with VESTORA") over candidate garment images.
 * 2. Universal Drag-and-Drop unblocker (attaches HD image URLs to dataTransfer).
 * 3. Autonomous Floating Corner Badge on detected fashion PDPs.
 */

import type { Product } from "../../shared/types/index.js";
import { extractBestImageUrl } from "./page-adapter.js";
import { extractProductFromElement } from "./product-extractor.js";

const processedElements = new WeakSet<HTMLElement>();

/**
 * Injects non-destructive "✦ Try with VESTORA" hover pill on candidate fashion image elements.
 */
export function attachTryOnButton(el: HTMLElement, onTryClick: (product: Product) => void): void {
  if (processedElements.has(el)) return;
  processedElements.add(el);

  let anchor: HTMLElement | null = el.parentElement;
  if (!anchor) return;

  // Ensure anchor has positioning context without breaking layout
  const computedPos = window.getComputedStyle(anchor).position;
  if (computedPos === "static") {
    anchor.style.position = "relative";
  }

  // Ensure element and its parent container are universally draggable into VESTORA
  el.draggable = true;
  anchor.draggable = true;
  try {
    (el.style as any).webkitUserDrag = "element";
    (anchor.style as any).webkitUserDrag = "element";
  } catch {}

  const handleDragStart = (e: DragEvent) => {
    if (e.dataTransfer) {
      const imageUrl = extractBestImageUrl(el);
      if (imageUrl) {
        e.dataTransfer.setData("text/uri-list", imageUrl);
        e.dataTransfer.setData("text/plain", imageUrl);
      }
    }
  };

  el.addEventListener("dragstart", handleDragStart);
  anchor.addEventListener("dragstart", handleDragStart);

  // Prevent duplicate buttons in same container
  if (anchor.querySelector(".vestora-tryon-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "vestora-tryon-btn";
  btn.setAttribute("aria-label", "Try with VESTORA");
  btn.innerHTML = `<span class="vestora-btn-sparkle">✦</span> Try with VESTORA`;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const imageUrl = extractBestImageUrl(el);
    const product = extractProductFromElement(el, imageUrl);

    btn.classList.add("is-active");
    setTimeout(() => btn.classList.remove("is-active"), 1200);

    onTryClick(product);
  });

  btn.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  }, { passive: true });

  anchor.appendChild(btn);
}

let activeCornerBadge: HTMLElement | null = null;

/**
 * Attaches a sleek, glassmorphic floating corner badge on detected fashion PDPs.
 * Appears automatically on ANY website when an apparel item is recognized.
 */
export function attachCornerFloatingBadge(product: Product, onTryClick: (product: Product) => void): void {
  if (activeCornerBadge || document.getElementById("vestora-corner-badge")) return;
  if (!product || !product.imageUrl || !product.isFashion) return;

  const badge = document.createElement("div");
  badge.id = "vestora-corner-badge";
  badge.className = "vestora-corner-badge";
  badge.setAttribute("role", "button");
  badge.setAttribute("aria-label", "VESTORA Virtual Try-On Detected Item");

  const brandText = product.brand || "Fashion Store";
  const nameText = product.name || "Clothing Item";
  const categoryText = product.category || "Apparel";

  badge.innerHTML = `
    <img src="${product.imageUrl}" alt="${nameText}" class="vestora-badge-thumb" />
    <div class="vestora-badge-info">
      <div class="vestora-badge-title-row">
        <span class="vestora-badge-tag">${categoryText}</span>
      </div>
      <span class="vestora-badge-name" title="${nameText}">${nameText}</span>
    </div>
    <button class="vestora-badge-cta" type="button">
      <span>✦ Try On</span>
    </button>
    <button class="vestora-badge-close" type="button" aria-label="Dismiss">✕</button>
  `;

  // Click on badge or CTA launches Try-On
  badge.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest(".vestora-badge-close")) {
      e.stopPropagation();
      badge.remove();
      activeCornerBadge = null;
      return;
    }
    onTryClick(product);
  });

  document.body.appendChild(badge);
  activeCornerBadge = badge;
}
