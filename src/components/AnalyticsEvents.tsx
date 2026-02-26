"use client";

import { useEffect } from "react";
import {
  trackBookEstimateClick,
  trackCallClick,
  trackFinancingClick,
  trackFormSubmit,
} from "@/lib/analytics";

function getAnchorFromTarget(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest("a");
}

export default function AnalyticsEvents() {
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const anchor = getAnchorFromTarget(event.target);
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href") || "";
      const source = anchor.getAttribute("data-label") || anchor.getAttribute("aria-label") || "site_link";

      if (href.startsWith("tel:")) {
        trackCallClick(source, href.replace("tel:", ""));
      }

      if (href.includes("calendly.com")) {
        trackBookEstimateClick(source);
      }

      if (href === "/financing" || href.startsWith("/financing?") || href.includes("/financing")) {
        trackFinancingClick(source);
      }
    };

    const handleFormSubmit = (event: Event) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) {
        return;
      }

      const formName = form.getAttribute("name") || form.getAttribute("data-label") || undefined;
      trackFormSubmit(window.location.pathname, formName);
    };

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("submit", handleFormSubmit, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("submit", handleFormSubmit, true);
    };
  }, []);

  return null;
}
