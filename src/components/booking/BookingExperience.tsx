"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  bookingAttributionKeys,
  bookingRequestSchema,
  bookingServiceOptions,
  bookingTimeWindowOptions,
  supportedBookingCities,
  type BookingAvailabilityResponse,
  type BookingRequest,
  type BookingRequestInput,
  type BookingSubmissionResponse,
} from "@/lib/booking";
import { trackBookingSuccess } from "@/lib/analytics";
import styles from "./BookingExperience.module.css";

const defaultValues: BookingRequestInput = {
  serviceType: "Repair diagnostic",
  city: supportedBookingCities[0],
  preferredDate: "",
  preferredTimeWindow: bookingTimeWindowOptions[0],
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressCity: "",
  addressZip: "",
  notes: "",
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
  const [availability, setAvailability] = useState<BookingAvailabilityResponse["slots"]>([]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingRequestInput, undefined, BookingRequest>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues,
  });

  const selectedDate = useWatch({ control, name: "preferredDate" });

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const response = await fetch("/api/book/availability", { cache: "no-store" });
        const payload = (await response.json()) as BookingAvailabilityResponse;

        if (cancelled) {
          return;
        }

        setAvailability(payload.slots);
        if (payload.slots[0]) {
          setValue("preferredDate", payload.slots[0].date, { shouldValidate: true });
          setValue("preferredTimeWindow", payload.slots[0].windows[0], { shouldValidate: true });
        }
      } finally {
        // No loading indicator is currently shown for this value.
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [setValue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const current = new URL(window.location.href);
    setValue("sourcePage", `${window.location.pathname}${window.location.search}`);

    for (const key of bookingAttributionKeys) {
      const value = current.searchParams.get(key);
      if (value) {
        setValue(key, value);
      }
    }
  }, [setValue]);

  const activeSlot = availability.find((slot) => slot.date === selectedDate);
  const availableWindows = activeSlot?.windows || [...bookingTimeWindowOptions];

  function addFiles(incoming: File[]) {
    const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"];
    const MAX_SIZE = 50 * 1024 * 1024;
    const MAX_FILES = 4;
    const valid = incoming.filter((f) => ACCEPTED.includes(f.type) && f.size <= MAX_SIZE);
    const rejected = incoming.filter((f) => !ACCEPTED.includes(f.type) || f.size > MAX_SIZE);
    if (rejected.length > 0) {
      setMediaUploadError(`${rejected.length} file(s) skipped: unsupported format or over 50 MB.`);
    } else {
      setMediaUploadError(null);
    }
    setMediaFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES));
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitMessage(null);
    setMediaUploadError(null);

    // Upload any attached media first
    let mediaUrls: string[] = [];
    if (mediaFiles.length > 0) {
      setMediaUploading(true);
      try {
        const uploadPromises = mediaFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/book/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
          const data = (await res.json()) as { url: string };
          return data.url;
        });
        mediaUrls = await Promise.all(uploadPromises);
      } catch {
        setMediaUploadError("One or more files could not be uploaded. Please try again or remove the file.");
        setMediaUploading(false);
        return;
      }
      setMediaUploading(false);
    }

    const response = await fetch("/api/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        name: `${values.firstName} ${values.lastName}`.trim(),
        mediaUrls,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(payload?.error || "Booking request could not be submitted.");
      return;
    }

    const payload = (await response.json()) as BookingSubmissionResponse;

    trackBookingSuccess({
      serviceType: values.serviceType,
      city: values.city,
      preferredDate: values.preferredDate,
      preferredTimeWindow: values.preferredTimeWindow,
      sourcePage: values.sourcePage,
    });

    setSubmitMessage(`Request ${payload.requestId} received. ${payload.nextStep}`);
    setMediaFiles([]);
      reset({
        ...defaultValues,
        serviceType: values.serviceType,
        city: values.city,
        preferredDate: values.preferredDate,
        preferredTimeWindow: values.preferredTimeWindow,
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
            <p className={styles.eyebrow}>Step 1</p>
            <h2>Tell us what you need</h2>
            <p>Fill out the booking form completely so the office can confirm the visit. First name, last name, full address, phone number, and email are required.</p>
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Service type</span>
                <select {...register("serviceType")}>
                  {bookingServiceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.serviceType ? <em>{errors.serviceType.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Service area</span>
                <select {...register("city")}>
                  {supportedBookingCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city ? <em>{errors.city.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Preferred date</span>
                <select {...register("preferredDate")}>
                  {availability.map((slot) => (
                    <option key={slot.date} value={slot.date}>{slot.label}</option>
                  ))}
                </select>
                {errors.preferredDate ? <em>{errors.preferredDate.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Preferred window</span>
                <select {...register("preferredTimeWindow")}>
                  {availableWindows.map((windowOption) => (
                    <option key={windowOption} value={windowOption}>{windowOption}</option>
                  ))}
                </select>
                {errors.preferredTimeWindow ? <em>{errors.preferredTimeWindow.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>First name</span>
                <input type="text" placeholder="First name" {...register("firstName")} />
                {errors.firstName ? <em>{errors.firstName.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Last name</span>
                <input type="text" placeholder="Last name" {...register("lastName")} />
                {errors.lastName ? <em>{errors.lastName.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Phone</span>
                <input type="tel" placeholder="801-555-1234" {...register("phone")} />
                {errors.phone ? <em>{errors.phone.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email ? <em>{errors.email.message}</em> : null}
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>Street address</span>
                <input type="text" placeholder="House number and street name" {...register("addressLine1")} />
                {errors.addressLine1 ? <em>{errors.addressLine1.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>City</span>
                <input type="text" placeholder="City" {...register("addressCity")} />
                {errors.addressCity ? <em>{errors.addressCity.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Zip code</span>
                <input type="text" placeholder="84088" inputMode="numeric" {...register("addressZip")} />
                {errors.addressZip ? <em>{errors.addressZip.message}</em> : null}
              </label>

              <label className={`${styles.field} ${styles.fullWidth}`}>
                <span>Project details</span>
                <textarea rows={5} placeholder="What system, issue, or project should we prepare for?" {...register("notes")} />
                {errors.notes ? <em>{errors.notes.message}</em> : null}
              </label>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <span className={styles.fieldLabel}>
                  Photos or videos <span className={styles.fieldOptional}>(optional)</span>
                </span>
                <p className={styles.fieldHint}>Help the technician prepare by sharing a photo or short video of the issue. Max 4 files, 50 MB each. Accepted: JPG, PNG, GIF, WEBP, MP4, MOV.</p>
                <div
                  className={styles.uploadZone}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = Array.from(e.dataTransfer.files);
                    addFiles(dropped);
                  }}
                >
                  <span className={styles.uploadIcon}>📎</span>
                  <span>Drag &amp; drop files here, or <strong>click to browse</strong></span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => addFiles(Array.from(e.target.files || []))}
                />
                {mediaUploadError ? <em className={styles.uploadError}>{mediaUploadError}</em> : null}
                {mediaFiles.length > 0 ? (
                  <ul className={styles.fileList}>
                    {mediaFiles.map((f, i) => (
                      <li key={i} className={styles.fileItem}>
                        <span className={styles.fileName}>{f.name}</span>
                        <span className={styles.fileSize}>({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                        <button
                          type="button"
                          className={styles.removeFile}
                          onClick={() => setMediaFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={`Remove ${f.name}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className={styles.submitRow}>
              <button type="submit" className={styles.submitButton} disabled={isSubmitting || mediaUploading}>
                {mediaUploading ? "Uploading files..." : isSubmitting ? "Submitting..." : "Request appointment"}
              </button>
            </div>

            {submitMessage ? <p className={styles.success}>{submitMessage}</p> : null}
            {submitError ? <p className={styles.error}>{submitError}</p> : null}
          </form>
        </div>
    </section>
  );
}
