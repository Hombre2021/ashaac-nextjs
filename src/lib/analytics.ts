type BookingTrackingPayload = {
  serviceType: string;
  city: string;
  preferredDate: string;
  preferredTimeWindow: string;
  sourcePage: string;
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
  };

  pushDataLayer(bookingEvent);

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      event_category: "booking",
      event_label: params.serviceType,
      value: 1,
      city: params.city,
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
