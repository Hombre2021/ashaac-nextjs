"use client";

import { useEffect } from "react";

type DeferredTrackingScriptsProps = {
  gtmId: string;
};

const IDLE_DELAY_MS = 1500;

function isTagAssistantDebugMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const q = window.location.search || "";
  return /[?&](gtm_debug|tagassistant_debug|gtm_preview|gtm_auth)=/i.test(q);
}

function injectGtm(gtmId: string) {
  if (typeof window === "undefined" || document.getElementById("gtm-script")) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export default function DeferredTrackingScripts({
  gtmId,
}: DeferredTrackingScriptsProps) {
  useEffect(() => {
    if (!gtmId) {
      return;
    }

    let loaded = false;
    let timerId: number | undefined;

    const loadTracking = () => {
      if (loaded) return;
      loaded = true;
      injectGtm(gtmId);
      cleanupListeners();
    };

    const interactionEvents = ["pointerdown", "touchstart", "scroll", "keydown"] as const;

    const onUserInteraction = () => {
      loadTracking();
    };

    const cleanupListeners = () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction);
      });
    };

    if (isTagAssistantDebugMode()) {
      loadTracking();
    } else {
      interactionEvents.forEach((evt) => {
        window.addEventListener(evt, onUserInteraction, { once: true, passive: true });
      });

      timerId = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(loadTracking, { timeout: 1000 });
        } else {
          loadTracking();
        }
      }, IDLE_DELAY_MS);
    }

    const trackConversionClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const destination = anchor.href;
      const url = new URL(destination, window.location.href);
      window.dataLayer = window.dataLayer || [];

      if (url.protocol === "tel:") {
        const phone = destination.replace(/^tel:/, "");
        window.dataLayer.push({
          event: "click_to_call",
          event_category: "Lead Conversion",
          event_action: "Phone Call Click",
          event_label: phone,
          phone_number: phone,
          page_path: `${window.location.pathname}${window.location.search}`,
        });
      } else if (url.origin === window.location.origin && url.pathname === "/book") {
        window.dataLayer.push({
          event: "begin_booking",
          event_category: "Lead Conversion",
          event_action: "Online Booking Click",
          page_path: `${window.location.pathname}${window.location.search}`,
        });
      } else if (
        (url.origin === window.location.origin && url.pathname === "/financing") ||
        (url.hostname === "wisetack.us" && url.hash.includes("prequalify"))
      ) {
        window.dataLayer.push({
          event: "click_financing",
          event_category: "Lead Conversion",
          event_action: "Financing Prequal Click",
          page_path: `${window.location.pathname}${window.location.search}`,
        });
      }
    };

    document.addEventListener("click", trackConversionClick, { passive: true });

    return () => {
      cleanupListeners();
      document.removeEventListener("click", trackConversionClick);
    };
  }, [gtmId]);

  return null;
}
