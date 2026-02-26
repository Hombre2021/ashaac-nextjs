type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...cleanedParams });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, cleanedParams);
  }
}

export function trackCallClick(source: string, phone: string) {
  trackEvent("call_click", { source, phone });
}

export function trackFormSubmit(source: string, formName?: string) {
  trackEvent("form_submit", { source, form_name: formName || "unknown" });
}

export function trackFinancingClick(source: string) {
  trackEvent("financing_click", { source });
}

export function trackBookEstimateClick(source: string) {
  trackEvent("book_estimate_click", { source });
}
