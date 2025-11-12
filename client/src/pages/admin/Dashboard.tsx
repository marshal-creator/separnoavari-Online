import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getAdminDashboardSummary,
  listIdeas,
  listJudges,
  listAssignments,
} from "../../api";
import type {
  Idea,
  Judge,
  Assignment,
  AdminDashboardSummary,
  AdminDashboardEvent,
} from "../../api";
import s from "../../styles/panel.module.scss";

export default function Dashboard() {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [judges, setJudges] = useState<Judge[] | null>(null);
  const [assigns, setAssigns] = useState<Assignment[] | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    listIdeas().then(setIdeas).catch(()=>setIdeas([]));
    listJudges().then(setJudges).catch(()=>setJudges([]));
    listAssignments().then(setAssigns).catch(()=>setAssigns([]));
  }, []);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await getAdminDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.warn("Failed to load dashboard summary", error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = window.setInterval(fetchSummary, 30000);
    return () => window.clearInterval(interval);
  }, [fetchSummary]);

  const summaryTotals = summary?.totals;

  const totals = {
    ideas: summaryTotals?.totalIdeas ?? ideas?.length ?? 0,
    judges: judges?.length || 0,
    assignments: summaryTotals?.assignedIdeas ?? assigns?.length ?? 0,
  };

  const ideasByStatus = useMemo(() => {
    const map: Record<string, number> = { PENDING: 0, UNDER_REVIEW: 0, ACCEPTED: 0, REJECTED: 0 };
    (ideas || []).forEach(i => { map[i.status] = (map[i.status] || 0) + 1; });
    return map;
  }, [ideas]);

  const submissionsOverTime = useMemo(() => {
    // group by month YYYY-MM for a simple line
    const buckets = new Map<string, number>();
    (ideas || []).forEach(i => {
      const d = new Date(i.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    const sortedKeys = Array.from(buckets.keys()).sort();
    return sortedKeys.map(k => ({ label: k, value: buckets.get(k) || 0 }));
  }, [ideas]);

  const notificationEvents: AdminDashboardEvent[] = summary?.events ?? [];
  const lastUpdatedLabel = useMemo(() => {
    if (!summary?.lastUpdated) return null;
    try {
      return new Date(summary.lastUpdated).toLocaleString();
    } catch {
      return summary.lastUpdated;
    }
  }, [summary?.lastUpdated]);

  const notificationStats = useMemo(
    () => [
      {
        key: "totalIdeas",
        label: t("admin.dashboard.notifications.stats.totalIdeas"),
        value: summaryTotals?.totalIdeas ?? 0,
        accent: "rgba(59,130,246,0.25)",
        emoji: "📚",
      },
      {
        key: "assignedIdeas",
        label: t("admin.dashboard.notifications.stats.assignedIdeas"),
        value: summaryTotals?.assignedIdeas ?? 0,
        accent: "rgba(34,197,94,0.25)",
        emoji: "🧑‍⚖️",
      },
      {
        key: "unassignedIdeas",
        label: t("admin.dashboard.notifications.stats.unassignedIdeas"),
        value: summaryTotals?.unassignedIdeas ?? Math.max((ideas?.length || 0) - (assigns?.length || 0), 0),
        accent: "rgba(239,68,68,0.2)",
        emoji: "⚠️",
      },
      {
        key: "completedEvaluations",
        label: t("admin.dashboard.notifications.stats.completedEvaluations"),
        value: summaryTotals?.completedEvaluations ?? 0,
        accent: "rgba(14,165,233,0.25)",
        emoji: "✅",
      },
    ],
    [summaryTotals, ideas?.length, assigns?.length, t]
  );

  // Simple bar and line chart render helpers
  const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
    const max = Math.max(1, ...data.map(d => d.value));
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", alignItems: "center", gap: 8 }}>
            <div className={s.muted}>{d.label}</div>
            <div style={{ background: "#1f2937", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${(d.value/max)*100}%`, background: "var(--primary)", height: 10 }} />
            </div>
            <div style={{ textAlign: "end" }}>{d.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const LineChart = ({ points }: { points: { label: string; value: number }[] }) => {
    const max = Math.max(1, ...points.map(p => p.value));
    const width = 520; const height = 160; const padding = 24;
    const step = points.length > 1 ? (width - padding*2) / (points.length - 1) : 0;
    const xy = points.map((p, idx) => {
      const x = padding + idx * step;
      const y = height - padding - (p.value / max) * (height - padding*2);
      return { x, y };
    });
    const d = xy.map((p, i) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
    return (
      <svg width={width} height={height} style={{ width: "100%", height: "180px" }}>
        <polyline fill="none" stroke="var(--primary)" strokeWidth="2" points={xy.map(p=>`${p.x},${p.y}`).join(" ")} />
      </svg>
    );
  };

  return (
    <div className={s.stack}>
      <h1>{t("admin.dashboard.title", { defaultValue: "Dashboard" })}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>💡</span>
            <div><div className={s.muted}>{t("admin.dashboard.cards.ideas")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totals.ideas}</div></div>
          </div>
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>🧑‍⚖️</span>
            <div><div className={s.muted}>{t("admin.dashboard.cards.judges")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totals.judges}</div></div>
          </div>
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>📝</span>
            <div><div className={s.muted}>{t("admin.dashboard.cards.assignments")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totals.assignments}</div></div>
          </div>
        </div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.charts.byStatus")}</div>
          <BarChart data={[
            { label: t("admin.status.pending"), value: ideasByStatus["PENDING"] || 0 },
            { label: t("admin.status.underReview"), value: ideasByStatus["UNDER_REVIEW"] || 0 },
            { label: t("admin.status.accepted"), value: ideasByStatus["ACCEPTED"] || 0 },
            { label: t("admin.status.rejected"), value: ideasByStatus["REJECTED"] || 0 },
          ]} />
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.charts.overTime")}</div>
          <LineChart points={submissionsOverTime} />
        </div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.recent.title")}</div>
          <div className={s.stack}>
            {(ideas || []).slice(0, 6).map(i => (
              <div key={i.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>🆕</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{i.title}</div>
                  <div className={s.muted}>{t("admin.dashboard.recent.ideaSubmitted")}</div>
                </div>
                <div className={s.muted}>{new Date(i.submittedAt).toLocaleString()}</div>
              </div>
            ))}
            {(ideas || []).length === 0 && <div className={s.muted}>{t("admin.dashboard.recent.empty")}</div>}
          </div>
        </div></div>
        <div style={{ position: "relative" }}>
          <div
            className={s.card}
            style={{ position: "sticky", top: 16 }}
          >
            <div className={s.cardBody} style={{ display: "grid", gap: 16 }}>
              <div style={{ fontWeight: 700 }}>{t("admin.dashboard.notifications.title")}</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 10,
                }}
              >
                {notificationStats.map((stat) => (
                  <div
                    key={stat.key}
                    style={{
                      borderRadius: 12,
                      padding: "12px 14px",
                      background: stat.accent,
                      display: "grid",
                      gap: 6,
                      minHeight: 80,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{stat.emoji}</span>
                    <span style={{ fontSize: 13, color: "var(--panel-muted)" }}>
                      {stat.label}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>{stat.value}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--panel-border)",
                  paddingTop: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {t("admin.dashboard.notifications.feedTitle")}
                </div>
                {summaryLoading ? (
                  <div className={s.muted}>
                    {t("admin.dashboard.notifications.loading")}
                  </div>
                ) : notificationEvents.length === 0 ? (
                  <div className={s.muted}>
                    {t("admin.dashboard.notifications.empty")}
                  </div>
                ) : (
                  notificationEvents.map((event) => {
                    const icon = event.type === "evaluation_completed" ? "✅" : "🆕";
                    const judgeLabel =
                      event.judgeName ||
                      event.judgeUsername ||
                      t("admin.dashboard.notifications.events.unknownJudge");
                    const ideaLabel =
                      event.ideaTitle ||
                      t("admin.dashboard.notifications.events.untitledIdea");
                    const description =
                      event.type === "evaluation_completed"
                        ? t("admin.dashboard.notifications.events.evaluationCompleted", {
                            title: ideaLabel,
                            judge: judgeLabel,
                          })
                        : t("admin.dashboard.notifications.events.ideaSubmitted", {
                            title: ideaLabel,
                          });
                    const timestamp = event.timestamp
                      ? new Date(event.timestamp).toLocaleString()
                      : t("admin.dashboard.notifications.events.unknownTime");
                    return (
                      <div
                        key={event.id}
                        style={{
                          border: "1px solid var(--panel-border)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          display: "grid",
                          gap: 4,
                          background:
                            event.type === "evaluation_completed"
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(59,130,246,0.12)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <strong>{ideaLabel}</strong>
                        </div>
                        <div className={s.muted} style={{ fontSize: 13 }}>
                          {description}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--panel-muted)" }}>
                          {timestamp}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {lastUpdatedLabel && (
                <div className={s.muted} style={{ fontSize: 12, justifySelf: "end" }}>
                  {t("admin.dashboard.notifications.lastUpdated", {
                    time: lastUpdatedLabel,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
