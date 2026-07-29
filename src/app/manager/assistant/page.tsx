"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type DashboardResponse = {
  ok: boolean;
  metrics: {
    leads: {
      total30d: number;
      total7d: number;
      byPriority: {
        P1: number;
        P2: number;
        P3: number;
      };
    };
    bookings: {
      total30d: number;
      conversionPct: number;
    };
    appointmentActions: {
      status: number;
      reschedule: number;
      cancel: number;
      successRate: number;
    };
  };
  threads: Array<{
    id: string;
    code: string;
    leadId: string;
    customerPhoneMasked: string;
    technicianPhoneMasked: string;
    openedAt: string;
    lastMessageAt: string;
    status: "active" | "closed";
    messageCount: number;
    preview: Array<{ at: string; from: "system" | "customer" | "technician"; body: string }>;
  }>;
  recentActions: Array<{
    id: string;
    createdAt: string;
    action: "status" | "reschedule" | "cancel";
    ok: boolean;
    requestId: string;
    phoneMasked: string;
    detail: string;
  }>;
  parity: {
    latest: {
      generatedAt: string;
      status: "PASS" | "WARN";
      windowDays: number;
      leadDelta: number;
      threadDelta: number;
    } | null;
    trend: Array<{
      generatedAt: string;
      status: "PASS" | "WARN";
      leadDelta: number;
      threadDelta: number;
    }>;
    retirementReadiness: {
      requiredDays: number;
      currentPassStreakDays: number;
      canRetireFallback: boolean;
      latestDailyStatus: "PASS" | "WARN";
    };
  };
  error?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ManagerAssistantPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);

  const summaryCards = useMemo(() => {
    if (!data?.metrics) return [];

    return [
      { label: "Assistant leads (30d)", value: String(data.metrics.leads.total30d) },
      { label: "Assistant leads (7d)", value: String(data.metrics.leads.total7d) },
      { label: "Bookings (30d)", value: String(data.metrics.bookings.total30d) },
      { label: "Lead to booking", value: `${data.metrics.bookings.conversionPct}%` },
      { label: "P1 leads", value: String(data.metrics.leads.byPriority.P1) },
      { label: "Appointment action success", value: `${data.metrics.appointmentActions.successRate}%` },
    ];
  }, [data]);

  const parityMaxAbs = useMemo(() => {
    if (!data?.parity?.trend?.length) return 1;
    return Math.max(
      1,
      ...data.parity.trend.map((item) => Math.max(Math.abs(item.leadDelta), Math.abs(item.threadDelta))),
    );
  }, [data]);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/manager/assistant-dashboard?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as DashboardResponse | null;
      if (!response.ok || !payload?.ok) {
        setData(null);
        setError(payload?.error || "Could not load assistant dashboard.");
        setLoading(false);
        return;
      }

      setData(payload);
      setLoading(false);
    } catch {
      setData(null);
      setError("Could not load assistant dashboard.");
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <header className={styles.headerCard}>
          <p className={styles.eyebrow}>Owner / Manager</p>
          <h1>AI Assistant Operations</h1>
          <p>Monitor lead flow, booking conversion, appointment actions, and active live text threads.</p>

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
              onClick={loadDashboard}
              disabled={loading || token.trim().length === 0}
            >
              {loading ? "Loading..." : "Load dashboard"}
            </button>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}
        </header>

        {data ? (
          <>
            <section className={styles.cardSection}>
              <h2>Parity Status</h2>

              {data.parity.latest ? (
                <div className={styles.parityHeader}>
                  <span className={data.parity.latest.status === "PASS" ? styles.badgePass : styles.badgeWarn}>
                    {data.parity.latest.status}
                  </span>
                  <p>
                    Last report: {formatDate(data.parity.latest.generatedAt)} | Window {data.parity.latest.windowDays}d
                  </p>
                  <p>
                    Lead delta: {data.parity.latest.leadDelta} | Thread delta: {data.parity.latest.threadDelta}
                  </p>
                </div>
              ) : (
                <p className={styles.empty}>No parity report found yet. Run npm run assistant:parity.</p>
              )}

              {data.parity.trend.length > 0 ? (
                <div className={styles.trendChart}>
                  {data.parity.trend.map((point) => {
                    const leadWidth = `${Math.max(6, (Math.abs(point.leadDelta) / parityMaxAbs) * 100)}%`;
                    const threadWidth = `${Math.max(6, (Math.abs(point.threadDelta) / parityMaxAbs) * 100)}%`;
                    return (
                      <article key={point.generatedAt} className={styles.trendRow}>
                        <p className={styles.trendDate}>{formatDate(point.generatedAt)}</p>
                        <div className={styles.trendBars}>
                          <div className={styles.trendBarLine}>
                            <span>Leads</span>
                            <div className={styles.barTrack}>
                              <div className={point.leadDelta === 0 ? styles.barNeutral : point.leadDelta > 0 ? styles.barPositive : styles.barNegative} style={{ width: leadWidth }} />
                            </div>
                            <strong>{point.leadDelta}</strong>
                          </div>
                          <div className={styles.trendBarLine}>
                            <span>Threads</span>
                            <div className={styles.barTrack}>
                              <div className={point.threadDelta === 0 ? styles.barNeutral : point.threadDelta > 0 ? styles.barPositive : styles.barNegative} style={{ width: threadWidth }} />
                            </div>
                            <strong>{point.threadDelta}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section className={styles.cardSection}>
              <h2>Retire Fallback Now</h2>

              <div className={data.parity.retirementReadiness.canRetireFallback ? styles.retirePanelReady : styles.retirePanelPending}>
                <p className={styles.retireTitle}>
                  {data.parity.retirementReadiness.canRetireFallback
                    ? "Ready to retire fallback writes"
                    : "Not ready yet"}
                </p>
                <p className={styles.retireMeta}>
                  PASS streak: {data.parity.retirementReadiness.currentPassStreakDays} day(s) |
                  Required: {data.parity.retirementReadiness.requiredDays} day(s)
                </p>
              </div>

              <div className={styles.checklist}>
                <label className={styles.checkItem}>
                  <input type="checkbox" checked={data.parity.retirementReadiness.latestDailyStatus === "PASS"} readOnly />
                  <span>Latest daily parity status is PASS</span>
                </label>
                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={
                      data.parity.retirementReadiness.currentPassStreakDays >= data.parity.retirementReadiness.requiredDays
                    }
                    readOnly
                  />
                  <span>
                    PASS streak is at least {data.parity.retirementReadiness.requiredDays} consecutive day(s)
                  </span>
                </label>
                <label className={styles.checkItem}>
                  <input type="checkbox" checked={data.parity.retirementReadiness.canRetireFallback} readOnly />
                  <span>Safe to stop fallback writes and keep fallback app standby-only</span>
                </label>
              </div>
            </section>

            <section className={styles.cardSection}>
              <h2>Metrics Snapshot</h2>
              <div className={styles.cardGrid}>
                {summaryCards.map((card) => (
                  <article key={card.label} className={styles.metricCard}>
                    <p>{card.label}</p>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>

              <div className={styles.inlineStats}>
                <p>Action usage (30d): Status {data.metrics.appointmentActions.status}</p>
                <p>Reschedule {data.metrics.appointmentActions.reschedule}</p>
                <p>Cancel {data.metrics.appointmentActions.cancel}</p>
              </div>
            </section>

            <section className={styles.cardSection}>
              <h2>Active Text Threads</h2>
              {data.threads.length === 0 ? <p className={styles.empty}>No threads yet.</p> : null}
              <div className={styles.threadList}>
                {data.threads.map((thread) => (
                  <article key={thread.id} className={styles.threadCard}>
                    <div className={styles.threadHeader}>
                      <h3>Thread #{thread.code}</h3>
                      <span>{thread.status}</span>
                    </div>
                    <p>Lead ID: {thread.leadId}</p>
                    <p>Customer: {thread.customerPhoneMasked}</p>
                    <p>Technician: {thread.technicianPhoneMasked}</p>
                    <p>Opened: {formatDate(thread.openedAt)}</p>
                    <p>Last activity: {formatDate(thread.lastMessageAt)}</p>
                    <p>Messages: {thread.messageCount}</p>

                    <div className={styles.previewBox}>
                      {thread.preview.map((message, index) => (
                        <p key={`${thread.id}-${index}`}>
                          <strong>{message.from}:</strong> {message.body}
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.cardSection}>
              <h2>Recent Appointment Actions</h2>
              {data.recentActions.length === 0 ? <p className={styles.empty}>No actions yet.</p> : null}
              <div className={styles.actionList}>
                {data.recentActions.map((action) => (
                  <article key={action.id} className={styles.actionCard}>
                    <div className={styles.actionRow}>
                      <strong>{action.action.toUpperCase()}</strong>
                      <span className={action.ok ? styles.ok : styles.fail}>{action.ok ? "OK" : "FAILED"}</span>
                    </div>
                    <p>When: {formatDate(action.createdAt)}</p>
                    <p>Request: {action.requestId || "-"}</p>
                    <p>Phone: {action.phoneMasked || "-"}</p>
                    <p>{action.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}
