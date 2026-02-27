"use client";

import { FormEvent, useState } from "react";
import ContactButtons from "./ContactButtons";
import { googleReviewUrl } from "@/lib/seo";
import styles from "./ContactContent.module.css";

export default function ContactContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setSubmitSuccess("Thanks — your request was submitted. We’ll follow up shortly.");
      form.reset();
    } catch {
      setSubmitError("We couldn't submit right now. Please call or text us at 801-755-3040.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.contactSection}>
      <ContactButtons phoneAriaLabel="Text or call 801-755-3040 or 801-512-7103 from Contact page" />

      <div className={styles.formCard}>
        <h2 className={styles.mapTitle}>Request Service or Estimate</h2>
        <p className={styles.mapText}>
          Submit the form below and we’ll contact you to confirm service details.
        </p>
        <form className={styles.form} name="contact_form" onSubmit={handleSubmit}>
          <input name="name" type="text" placeholder="Your name" required />
          <input name="email" type="email" placeholder="Your email" required />
          <input name="phone" type="tel" placeholder="Your phone number" required />
          <input name="city" type="text" placeholder="City" required />
          <textarea name="message" rows={5} placeholder="How can we help?" required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit Request"}
          </button>
        </form>
        {submitSuccess ? <p className={styles.successMsg}>{submitSuccess}</p> : null}
        {submitError ? <p className={styles.errorMsg}>{submitError}</p> : null}
      </div>

      <div className={styles.mapCard}>
        <h2 className={styles.mapTitle}>Service Area Map</h2>
        <p className={styles.mapText}>
          We do not operate a public storefront. We provide mobile HVAC service throughout West Jordan and surrounding Salt Lake County cities.
        </p>
        <div className={styles.mapWrap}>
          <a href="/valley" className={styles.reviewButton}>
            View Service Area Coverage
          </a>
        </div>
      </div>

      <div className={styles.reviewCard}>
        <h3 className={styles.reviewTitle}>See What Customers Are Saying</h3>
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.reviewButton}
          aria-label="Read our Google customer reviews"
        >
          Read Google Reviews
        </a>
      </div>
    </section>
  );
}
