"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { allBookingTimeWindowOptions, bookingAttributionKeys, bookingServiceOptions, supportedBookingCities } from "@/lib/booking";
import { trackBookingSuccess } from "@/lib/analytics";
import { captureAttribution, readStoredAttribution } from "@/lib/attribution";
import styles from "./BookingExperience.module.css";

type CallbackRequestInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  zip: string;
  city: string;
  serviceType: string;
  preferredDate: string;
  preferredTimeWindow: string;
  problem: string;
  sourcePage: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  msclkid: string;
};

const defaultValues: CallbackRequestInput = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  zip: "",
  city: "West Jordan",
  serviceType: "Repair diagnostic",
  preferredDate: "",
  preferredTimeWindow: "",
  problem: "",
  sourcePage: "/book",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  gclid: "",
  gbraid: "",
  wbraid: "",
  fbclid: "",
  msclkid: "",
};

export default function BookingExperience() {
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CallbackRequestInput>({ defaultValues });

  useEffect(() => {
    const attribution = captureAttribution(window.location.search);
    setValue("sourcePage", `${window.location.pathname}${window.location.search}`);

    for (const key of bookingAttributionKeys) {
      if (attribution[key]) setValue(key, attribution[key]);
    }
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitMessage(null);

    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: values.serviceType,
        city: values.city,
        preferredDate: values.preferredDate,
        preferredTimeWindow: values.preferredTimeWindow,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        addressLine1: values.address.trim(),
        addressCity: values.city,
        addressZip: values.zip.trim(),
        customServiceDescription: values.problem.trim(),
        notes: "",
        sourcePage: values.sourcePage,
        utm_source: values.utm_source,
        utm_medium: values.utm_medium,
        utm_campaign: values.utm_campaign,
        utm_term: values.utm_term,
        utm_content: values.utm_content,
        gclid: values.gclid,
        gbraid: values.gbraid,
        wbraid: values.wbraid,
        fbclid: values.fbclid,
        msclkid: values.msclkid,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string; requestId?: string } | null;
    if (!response.ok || !payload?.requestId) {
      setSubmitError(payload?.error || "Your appointment request could not be submitted. Please call 801-755-3040.");
      return;
    }

    trackBookingSuccess({
      serviceType: values.serviceType,
      city: values.city,
      preferredDate: values.preferredDate,
      preferredTimeWindow: values.preferredTimeWindow,
      sourcePage: values.sourcePage,
      requestId: payload.requestId,
      attribution: { ...readStoredAttribution(), ...Object.fromEntries(bookingAttributionKeys.map((key) => [key, values[key]])) },
    });
    setSubmitMessage(`Appointment request ${payload.requestId} received. We will contact you to confirm the time.`);
    reset({
      ...defaultValues,
      sourcePage: values.sourcePage,
      utm_source: values.utm_source,
      utm_medium: values.utm_medium,
      utm_campaign: values.utm_campaign,
      utm_term: values.utm_term,
      utm_content: values.utm_content,
      gclid: values.gclid,
      gbraid: values.gbraid,
      wbraid: values.wbraid,
      fbclid: values.fbclid,
      msclkid: values.msclkid,
    });
  });

  return (
    <section className={styles.pageSection}>
      <div className={styles.formPanel}>
        <div className={styles.formHeader}>
          <p className={styles.eyebrow}>Appointment request</p>
          <h2>Request an HVAC appointment</h2>
          <p>Choose a service, city, date, and time window. We will contact you to confirm availability.</p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>First name</span>
              <input
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                {...register("firstName", {
                  required: "Enter your first name.",
                  minLength: { value: 2, message: "Enter at least two characters." },
                })}
              />
              {errors.firstName ? <em>{errors.firstName.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>Last name</span>
              <input type="text" autoComplete="family-name" placeholder="Last name" {...register("lastName", { required: "Enter your last name." })} />
              {errors.lastName ? <em>{errors.lastName.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>Phone</span>
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="801-555-1234"
                {...register("phone", {
                  required: "Enter your phone number.",
                  validate: (value) => value.replace(/\D/g, "").length >= 10 || "Enter a valid phone number.",
                })}
              />
              {errors.phone ? <em>{errors.phone.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <input type="email" autoComplete="email" placeholder="you@example.com" {...register("email", { required: "Enter your email address.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." } })} />
              {errors.email ? <em>{errors.email.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>Service</span>
              <select {...register("serviceType", { required: "Choose a service." })}>
                {bookingServiceOptions.map((service) => <option key={service}>{service}</option>)}
              </select>
              {errors.serviceType ? <em>{errors.serviceType.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>City</span>
              <select {...register("city", { required: "Choose a service area." })}>
                {supportedBookingCities.slice(0, 3).map((city) => <option key={city}>{city}</option>)}
              </select>
              {errors.city ? <em>{errors.city.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>Appointment date</span>
              <input type="date" aria-label="Appointment date" {...register("preferredDate", { required: "Choose an appointment date." })} />
              {errors.preferredDate ? <em>{errors.preferredDate.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>Preferred time window</span>
              <select {...register("preferredTimeWindow", { required: "Choose a time window." })}>
                <option value="">Choose a time window</option>
                {allBookingTimeWindowOptions.map((window) => <option key={window}>{window}</option>)}
              </select>
              {errors.preferredTimeWindow ? <em>{errors.preferredTimeWindow.message}</em> : null}
            </label>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>Service address</span>
              <input
                type="text"
                autoComplete="street-address"
                placeholder="Street address, city, state, ZIP"
                {...register("address", {
                  required: "Enter the service address.",
                  minLength: { value: 8, message: "Enter the street address and city." },
                })}
              />
              {errors.address ? <em>{errors.address.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>ZIP code</span>
              <input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="84088" {...register("zip", { required: "Enter the service ZIP code.", minLength: { value: 5, message: "Enter a valid ZIP code." } })} />
              {errors.zip ? <em>{errors.zip.message}</em> : null}
            </label>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>What is the problem?</span>
              <textarea
                rows={4}
                placeholder="For example: AC is running but the house is not cooling."
                {...register("problem", {
                  required: "Describe the problem.",
                  minLength: { value: 5, message: "Add a little more detail so we can help." },
                  maxLength: { value: 1200, message: "Keep the description under 1200 characters." },
                })}
              />
              {errors.problem ? <em>{errors.problem.message}</em> : null}
            </label>
          </div>

          <div className={styles.submitRow}>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit appointment request"}
            </button>
            <a className={styles.callAlternative} href="tel:8017553040">Or call 801-755-3040</a>
          </div>

          {submitMessage ? <p className={styles.success}>{submitMessage}</p> : null}
          {submitError ? <p className={styles.error}>{submitError}</p> : null}
        </form>
      </div>
    </section>
  );
}