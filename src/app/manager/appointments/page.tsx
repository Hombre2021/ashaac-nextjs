"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type AppointmentHistoryRecord = {
  requestId: string;
  submittedAt: string;
  serviceType: string;
  city: string;
  preferredDate: string;
  preferredTimeWindow: string;
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressCity: string;
  addressZip: string;
  notes: string;
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
  mediaUrls: string[];
  managerStatus: "submitted" | "failed" | "not-configured";
  managerId: string;
  managerDetail: string;
  notificationSummary: string;
};

function valueOrDash(value: string) {
  const trimmed = String(value || "").trim();
  return trimmed.length > 0 ? trimmed : "-";
}

function formatSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return valueOrDash(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ManagerAppointmentsPage() {
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<AppointmentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const summary = useMemo(() => {
    return {
      total: records.length,
      submitted: records.filter((record) => record.managerStatus === "submitted").length,
      failed: records.filter((record) => record.managerStatus === "failed").length,
    };
  }, [records]);

  async function loadRecords() {
    setError(null);
    setLoading(true);
    setLoaded(false);

    try {
      const response = await fetch(`/api/manager/appointments?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | { records?: AppointmentHistoryRecord[]; error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error || "Could not load appointment history.");
        setRecords([]);
        setLoading(false);
        setLoaded(true);
        return;
      }

      setRecords(Array.isArray(payload?.records) ? payload.records : []);
      setLoading(false);
      setLoaded(true);
    } catch {
      setError("Could not load appointment history.");
      setRecords([]);
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <header className={styles.headerCard}>
          <p className={styles.eyebrow}>Owner / Manager</p>
          <h1>Appointment History</h1>
          <p>
            This screen shows the exact values submitted from the website booking form for each customer request.
          </p>

          <div className={styles.navRow}>
            <a href="/manager/assistant" className={styles.navLink}>Open AI assistant operations dashboard</a>
          </div>

          <div className={styles.authRow}>
            <label className={styles.field}>
              <span>Manager view token</span>
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Enter BOOKING_MANAGER_VIEW_TOKEN"
              />
            </label>

            <button
              type="button"
              className={styles.loadButton}
              onClick={loadRecords}
              disabled={loading || token.trim().length === 0}
            >
              {loading ? "Loading..." : "Load appointment records"}
            </button>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}
          {loaded && !error ? (
            <p className={styles.metaLine}>
              Total: {summary.total} | Manager submitted: {summary.submitted} | Manager failed: {summary.failed}
            </p>
          ) : null}
        </header>

        {loaded && !error && records.length === 0 ? (
          <p className={styles.empty}>No appointment history found yet.</p>
        ) : null}

        <div className={styles.recordList}>
          {records.map((record) => (
            <article key={record.requestId} className={styles.recordCard}>
              <div className={styles.recordHeader}>
                <h2>Request {record.requestId}</h2>
                <span>{formatSubmittedAt(record.submittedAt)}</span>
              </div>

              <div className={styles.grid}>
                <label className={styles.readField}><span>Service type</span><input value={valueOrDash(record.serviceType)} readOnly /></label>
                <label className={styles.readField}><span>Service area</span><input value={valueOrDash(record.city)} readOnly /></label>
                <label className={styles.readField}><span>Preferred date</span><input value={valueOrDash(record.preferredDate)} readOnly /></label>
                <label className={styles.readField}><span>Preferred window</span><input value={valueOrDash(record.preferredTimeWindow)} readOnly /></label>
                <label className={styles.readField}><span>Your name</span><input value={valueOrDash(record.name)} readOnly /></label>
                <label className={styles.readField}><span>Phone</span><input value={valueOrDash(record.phone)} readOnly /></label>
                <label className={styles.readField}><span>Email</span><input value={valueOrDash(record.email)} readOnly /></label>
                <label className={`${styles.readField} ${styles.fullWidth}`}><span>Street address</span><input value={valueOrDash(record.addressLine1)} readOnly /></label>
                <label className={styles.readField}><span>City</span><input value={valueOrDash(record.addressCity)} readOnly /></label>
                <label className={styles.readField}><span>Zip code</span><input value={valueOrDash(record.addressZip)} readOnly /></label>
                <label className={`${styles.readField} ${styles.fullWidth}`}>
                  <span>Project details</span>
                  <textarea value={valueOrDash(record.notes)} readOnly rows={4} />
                </label>

                <div className={`${styles.readField} ${styles.fullWidth}`}>
                  <span>Photos or videos</span>
                  {record.mediaUrls.length > 0 ? (
                    <ul className={styles.mediaList}>
                      {record.mediaUrls.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noreferrer">{url}</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <input value="-" readOnly />
                  )}
                </div>
              </div>

              <details className={styles.metaDetails}>
                <summary>Tracking and delivery metadata</summary>
                <div className={styles.metaGrid}>
                  <label className={styles.readField}><span>Source page</span><input value={valueOrDash(record.sourcePage)} readOnly /></label>
                  <label className={styles.readField}><span>utm_source</span><input value={valueOrDash(record.utm_source)} readOnly /></label>
                  <label className={styles.readField}><span>utm_medium</span><input value={valueOrDash(record.utm_medium)} readOnly /></label>
                  <label className={styles.readField}><span>utm_campaign</span><input value={valueOrDash(record.utm_campaign)} readOnly /></label>
                  <label className={styles.readField}><span>utm_term</span><input value={valueOrDash(record.utm_term)} readOnly /></label>
                  <label className={styles.readField}><span>utm_content</span><input value={valueOrDash(record.utm_content)} readOnly /></label>
                  <label className={styles.readField}><span>gclid</span><input value={valueOrDash(record.gclid)} readOnly /></label>
                  <label className={styles.readField}><span>gbraid</span><input value={valueOrDash(record.gbraid)} readOnly /></label>
                  <label className={styles.readField}><span>wbraid</span><input value={valueOrDash(record.wbraid)} readOnly /></label>
                  <label className={styles.readField}><span>fbclid</span><input value={valueOrDash(record.fbclid)} readOnly /></label>
                  <label className={styles.readField}><span>msclkid</span><input value={valueOrDash(record.msclkid)} readOnly /></label>
                  <label className={styles.readField}><span>Manager status</span><input value={valueOrDash(record.managerStatus)} readOnly /></label>
                  <label className={styles.readField}><span>Manager ID</span><input value={valueOrDash(record.managerId)} readOnly /></label>
                  <label className={`${styles.readField} ${styles.fullWidth}`}><span>Manager detail</span><input value={valueOrDash(record.managerDetail)} readOnly /></label>
                  <label className={`${styles.readField} ${styles.fullWidth}`}><span>Notification summary</span><input value={valueOrDash(record.notificationSummary)} readOnly /></label>
                </div>
              </details>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}