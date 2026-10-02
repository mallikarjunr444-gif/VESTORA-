/**
 * VESTORA — Try-On Button Component
 * Injects non-destructive "Try with VESTORA" overlays on candidate product images (PRD Section 12).
 */

import type { Product } from "../../shared/types/index.js";
import { extractBestImageUrl } from "./page-adapter.js";
import { extractProductFromElement } from "./product-extractor.js";

const processedElements = new WeakSet<HTMLElement>();

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
