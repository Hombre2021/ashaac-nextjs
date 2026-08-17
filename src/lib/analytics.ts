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

function pushDataLayer(event: Record<string, unknown>) {
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
      window.fbq("track", "Lead", details);
    } else {
      window.fbq("trackCustom", event, details);
    }
  }
}

export function trackBookingSuccess(params: BookingTrackingPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const bookingEvent = {
    event: "booking_request_submitted",
    service_type: params.serviceType,
    city: params.city,
    preferred_date: params.preferredDate,
    preferred_time_window: params.preferredTimeWindow,
    source_page: params.sourcePage,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
    request_id: params.requestId || "",
    ...params.attribution,
  };

  pushDataLayer(bookingEvent);
  trackLeadEvent("form_submit", { form_name: "booking", service_type: params.serviceType, city: params.city });

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      event_category: "booking",
      event_label: params.serviceType,
      value: 1,
      city: params.city,
      transaction_id: params.requestId || undefined,
    });

    if (ADS_ID && ADS_BOOKING_LABEL) {
      window.gtag("event", "conversion", {
        send_to: `${ADS_ID}/${ADS_BOOKING_LABEL}`,
        value: 1,
        currency: "USD",
      });
    }

    if (GA_MEASUREMENT_ID) {
      window.gtag("event", "booking_request_submitted", bookingEvent);
    }
  }
}

export function trackCallbackRequestSuccess(params: Pick<BookingTrackingPayload, "serviceType" | "sourcePage">) {
  if (typeof window === "undefined") {
    return;
  }

  const callbackEvent = {
    event: "callback_request_submitted",
    service_type: params.serviceType,
    source_page: params.sourcePage,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  };

  pushDataLayer(callbackEvent);

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      event_category: "callback",
      event_label: params.serviceType,
      value: 1,
    });

    if (GA_MEASUREMENT_ID) {
      window.gtag("event", "callback_request_submitted", callbackEvent);
    }
  }
}

export function trackPhoneClick(sourcePage = "") {
  if (typeof window === "undefined") {
    return;
  }

  const phoneEvent = {
    event: "click_phone",
    source_page: sourcePage || `${window.location.pathname}${window.location.search}`,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
  };

  pushDataLayer(phoneEvent);

  if (typeof window.fbq === "function") {
    window.fbq("track", "Contact", { content_name: "phone_click", source_page: sourcePage });
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "click_phone", phoneEvent);
  }
}
