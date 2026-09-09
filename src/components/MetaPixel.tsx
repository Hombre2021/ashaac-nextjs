"use client";

import { useEffect } from "react";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

type MetaPixelQueue = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: MetaPixelQueue;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelQueue;
    _fbq?: MetaPixelQueue;
  }
}

export default function MetaPixel() {
  useEffect(() => {
    if (!pixelId) return;

    if (!window.fbq) {
      const fbq: MetaPixelQueue = (...args: unknown[]) => {
        if (fbq.callMethod) {
          fbq.callMethod(...args);
        } else {
          fbq.queue.push(args);
        }
      };
      fbq.queue = [] as unknown[][];
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      window.fbq = fbq;
      window._fbq = fbq;
      fbq("init", pixelId);
      fbq("track", "PageView");

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }

    const trackConversionClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || typeof window.fbq !== "function") return;

      const destination = anchor.href;
      const url = new URL(destination, window.location.href);
      let eventName = "";

      if (url.protocol === "tel:") {
        eventName = "click_phone";
      } else if (url.origin === window.location.origin && url.pathname === "/book") {
        eventName = "click_hvac_pro_booking";
      } else if (
        (url.origin === window.location.origin && url.pathname === "/financing") ||
        (url.hostname === "wisetack.us" && url.hash.includes("prequalify"))
      ) {
        eventName = "click_financing_prequal";
      }

      if (eventName) {
        window.fbq("trackCustom", eventName, {
          destination,
          page_path: `${window.location.pathname}${window.location.search}`,
        });
      }
    };

    document.addEventListener("click", trackConversionClick);
    return () => document.removeEventListener("click", trackConversionClick);
  }, []);

  return null;
}
