"use client";

import { useEffect } from "react";

type DeferredTrackingScriptsProps = {
  gtmId: string;
};

const DELAY_MS = 10000;

function isTagAssistantDebugMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const q = window.location.search || "";
  return /[?&](gtm_debug|tagassistant_debug|gtm_preview|gtm_auth)=/i.test(q);
}

function injectScript(src?: string, inlineCode?: string, id?: string) {
  const script = document.createElement("script");

  if (id) {
    script.id = id;
  }

  script.async = true;

  if (src) {
    script.src = src;
  }

  if (inlineCode) {
    script.text = inlineCode;
  }

  document.head.appendChild(script);
}

export default function DeferredTrackingScripts({
  gtmId,
}: DeferredTrackingScriptsProps) {
  useEffect(() => {
    if (!gtmId) {
      return;
    }

    let timerId: number | undefined;
    let idleId: number | undefined;
    let cancelled = false;

    const loadTracking = () => {
      if (cancelled) {
        return;
      }

      if (gtmId) {
        injectScript(
          undefined,
          `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          "gtm-script"
        );
      }

    };

    const schedule = () => {
      const delayMs = isTagAssistantDebugMode() ? 0 : DELAY_MS;
      timerId = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") {
          idleId = window.requestIdleCallback(loadTracking, { timeout: 2000 });
        } else {
          loadTracking();
        }
      }, delayMs);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [gtmId]);

  return null;
}
