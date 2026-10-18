type BookingTrackingPayload = {
  serviceType: string;
  city: string;
  preferredDate: string;
  preferredTimeWindow: string;
  sourcePage: string;
  requestId?: string;
  attribution?: Record<string, string>;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const ADS_BOOKING_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL || "";

export function pushDataLayer(event: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function trackLeadEvent(event: "click_hvac_pro_booking" | "click_financing_prequal" | "form_submit", details: Record<string, unknown> = {}) {
  pushDataLayer({
    event,
    page_path: typeof window === "undefined" ? "" : `${window.location.pathname}${window.location.search}`,
    page_title: typeof document === "undefined" ? "" : document.title,
    ...details,
  });

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (event === "form_submit") {
      window.fbq("trackCustom", event, details);
    }
  }
}

export function trackAssistantAction(
  action: "assistant_revenue" | "assistant_booking_redirect" | "assistant_question_answered" | "assistant_callback_started",
  details: Record<string, unknown> = {},
) {
  pushDataLayer({
    event: action,
    page_path: typeof window === "undefined" ? "" : `${window.location.pathname}${window.location.search}`,
    page_title: typeof document === "undefined" ? "" : document.title,
    ...details,
  });

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: "assistant",
      ...details,
    });
  }
}

export function trackBookingSuccess(params: BookingTrackingPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const bookingEvent = {
    event: "booking_submitted",
    service_type: params.serviceType,
    city: params.city,
    preferred_date: params.preferredDate,
    preferred_time_window: params.preferredTimeWindow,
    source_page: params.sourcePage,
    request_id: params.requestId || "",
    attribution: params.attribution || {},
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  };

  pushDataLayer(bookingEvent);
  trackLeadEvent("form_submit", { form_name: "booking", service_type: params.serviceType, city: params.city });

  if (typeof window.gtag === "function") {
    window.gtag("event", "booking_submitted", bookingEvent);

    if (ADS_ID && ADS_BOOKING_LABEL) {
      window.gtag("event", "conversion", {
        send_to: `${ADS_ID}/${ADS_BOOKING_LABEL}`,
        event_category: "lead",
        event_label: params.serviceType,
      });
    }

    if (GA_MEASUREMENT_ID) {
      window.gtag("event", "lead_generation", {
        method: "online_booking",
        service_type: params.serviceType,
        city: params.city,
      });
    }
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", {
      content_name: params.serviceType,
      content_category: "HVAC Services",
    });
  }
}

export function trackCallbackSuccess(params: { name: string; phone: string; serviceType: string; sourcePage: string; city: string; notes?: string }) {
  if (typeof window === "undefined") {
    return;
  }

  const callbackEvent = {
    event: "callback_request_submitted",
    name: params.name,
    phone: params.phone,
    service_type: params.serviceType,
    city: params.city,
    source_page: params.sourcePage,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  };

  pushDataLayer(callbackEvent);

  if (typeof window.gtag === "function") {
    window.gtag("event", "callback_request_submitted", callbackEvent);

    if (GA_MEASUREMENT_ID) {
      window.gtag("event", "callback_request_submitted", callbackEvent);
    }
  }
}

export function trackPhoneClick(sourcePage = "", phone = "") {
  if (typeof window === "undefined") {
    return;
  }

  const phoneEvent = {
    event: "click_phone",
    source_page: sourcePage || `${window.location.pathname}${window.location.search}`,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
    phone: phone || undefined,
  };

  pushDataLayer(phoneEvent);

  if (typeof window.gtag === "function") {
    window.gtag("event", "click_phone", phoneEvent);
  }
}

export function trackBookEstimateClick(source = "") {
  trackLeadEvent("click_hvac_pro_booking", { source });
}

export function trackCallClick(source = "", phone = "") {
  trackPhoneClick(source, phone);
}

export function trackFinancingClick(source = "") {
  trackLeadEvent("click_financing_prequal", { source });
}

export function trackFormSubmit(path = "", formName = "") {
  trackLeadEvent("form_submit", { path, formName });
}
