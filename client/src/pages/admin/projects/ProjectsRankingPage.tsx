import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Input, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { TrophyOutlined } from "@ant-design/icons";
import { getIdeaRanking, type IdeaRankingRow } from "../../../api";

function formatStatus(status: string | null | undefined, t: (key: string) => string) {
  const upper = String(status || "").toUpperCase();
  if (upper === "APPROVED" || upper === "ACCEPTED") return t("admin.status.accepted");
  if (upper === "REJECTED") return t("admin.status.rejected");
  if (upper === "PENDING") return t("admin.status.pending");
  return status || "—";
}

export default function ProjectsRankingPage() {
  const { t } = useTranslation();
  const [ranking, setRanking] = useState<IdeaRankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIdeaRanking();
      const sorted = [...(res ?? [])].sort((a, b) => {
        const scoreA = a.averageScore ?? 0;
        const scoreB = b.averageScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const completedA = a.completedCount ?? 0;
        const completedB = b.completedCount ?? 0;
        if (completedB !== completedA) return completedB - completedA;
        const timeA = a.latestActivity ? new Date(a.latestActivity).getTime() : 0;
        const timeB = b.latestActivity ? new Date(b.latestActivity).getTime() : 0;
        return timeB - timeA;
      });
      setRanking(sorted);
    } catch (error: unknown) {
      let errorMessage = t("admin.ranking.failedLoadProjects") || "Failed to load projects";
      if (typeof error === "object" && error !== null) {
        const maybe = error as { response?: { data?: { error?: string } } };
        if (maybe.response?.data?.error) {
          errorMessage = maybe.response.data.error;
        }
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Add rank to each project based on its position in the sorted list
  const projectsWithRank = useMemo(() => {
    return ranking.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [ranking]);

  const filtered = useMemo(() => {
    if (!searchValue.trim()) return projectsWithRank;
    const q = searchValue.toLowerCase();
    return projectsWithRank.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.judges.some(
          (judge) =>
            judge.judgeName?.toLowerCase().includes(q) ||
            judge.judgeUsername?.toLowerCase().includes(q)
        ) ||
        item.ideaId.toLowerCase().includes(q)
    );
  }, [projectsWithRank, searchValue]);

  const getRankBadge = (rank: number | undefined) => {
    if (rank === 1) return { emoji: "🥇", color: "#FFD700", bg: "#FFF8DC" };
    if (rank === 2) return { emoji: "🥈", color: "#C0C0C0", bg: "#F5F5F5" };
    if (rank === 3) return { emoji: "🥉", color: "#CD7F32", bg: "#FAEBD7" };
    return null;
  };

  type RankingRow = (typeof projectsWithRank)[number];

  const columns: ColumnsType<RankingRow> = useMemo(
    () => [
      {
        title: t("admin.ranking.columns.rank"),
        key: "rank",
        width: 80,
        render: (_, record) => {
          const rank = record.rank ?? 0;
          const badge = getRankBadge(rank);
          if (badge) {
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: badge.bg,
                  border: `2px solid ${badge.color}`,
                  fontSize: 24,
                }}
              >
                {badge.emoji}
              </div>
            );
          }
          return (
            <Typography.Text strong style={{ fontSize: 16, color: "#6b7280" }}>
              #{rank}
            </Typography.Text>
          );
        },
      },
      {
        title: t("admin.ranking.columns.idea"),
        dataIndex: "title",
        key: "title",
        render: (value: string, record) => {
          const rank = record.rank ?? 0;
          const badge = getRankBadge(rank);
          const submittedAt = record.submittedAt
            ? new Date(record.submittedAt).toLocaleString()
            : null;
          return (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Typography.Paragraph
                ellipsis={{ rows: 2, tooltip: value }}
                style={{
                  marginBottom: 0,
                  fontWeight: badge ? 600 : 500,
                  color: badge ? badge.color : undefined,
                }}
              >
                {value || t("admin.ranking.untitled")}
              </Typography.Paragraph>
              {record.track && (
                <Tag color="blue">{record.track}</Tag>
              )}
              {submittedAt && (
                <Typography.Text type="secondary">{submittedAt}</Typography.Text>
              )}
            </Space>
          );
        },
      },
      {
        title: t("admin.ranking.columns.judgesList"),
        key: "judges",
        render: (_, record) => {
          if (!record.judges.length) {
            return (
              <Typography.Text type="secondary">
                {t("admin.ranking.noJudgesAssigned")}
              </Typography.Text>
            );
          }
          return (
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              {record.judges.map((judge) => {
                const judgeLabel =
                  judge.judgeName ||
                  judge.judgeUsername ||
                  t("admin.ranking.unknownJudge");
                const scoreTag =
                  typeof judge.score === "number" ? (
                    <Tag color="blue">{judge.score} / 100</Tag>
                  ) : (
                    <Tag color="default">{t("admin.ranking.pending")}</Tag>
                  );
                const decisionAt = judge.decisionAt
                  ? new Date(judge.decisionAt).toLocaleString()
                  : null;
                return (
                  <Card
                    key={judge.assignmentId}
                    size="small"
                    style={{ borderRadius: 10 }}
                    bodyStyle={{
                      padding: "8px 12px",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <Typography.Text strong>{judgeLabel}</Typography.Text>
                    <Space size={8} wrap align="center">
                      {scoreTag}
                      <Tag>{formatStatus(judge.status, t)}</Tag>
                      {decisionAt && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {decisionAt}
                        </Typography.Text>
                      )}
                    </Space>
                  </Card>
                );
              })}
            </Space>
          );
        },
      },
      {
        title: t("admin.ranking.columns.averageScore"),
        dataIndex: "averageScore",
        key: "averageScore",
        width: 170,
        sorter: (a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0),
        defaultSortOrder: "descend",
        render: (score: number | null) =>
          typeof score === "number" ? (
            <Tag color="gold">{score} / 100</Tag>
          ) : (
            <Typography.Text type="secondary">
              {t("admin.ranking.pending")}
            </Typography.Text>
          ),
      },
      {
        title: t("admin.ranking.columns.completed"),
        key: "completed",
        width: 160,
        render: (_, record) => (
          <Tag color={record.completedCount === record.totalAssignments && record.totalAssignments ? "green" : "blue"}>
            {record.completedCount} / {record.totalAssignments}
          </Tag>
        ),
      },
      {
        title: t("admin.ranking.columns.lastUpdated"),
        key: "latestActivity",
        width: 200,
        render: (_, record) =>
          record.latestActivity ? (
            <Typography.Text type="secondary">
              {new Date(record.latestActivity).toLocaleString()}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
    ],
    [t]
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 12 }}>
            <TrophyOutlined style={{ color: "#FFD700" }} />
            {t("admin.ranking.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("admin.ranking.subtitle")}
          </Typography.Text>
        </div>
      </div>

      <Card
        style={{ borderRadius: 18, boxShadow: "0 16px 44px -22px rgba(15, 23, 42, 0.35)" }}
        bodyStyle={{ display: "grid", gap: 16 }}
      >
        <Input.Search
          placeholder={t("admin.ranking.searchPlaceholder")}
          allowClear
          style={{ maxWidth: 400 }}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          size="large"
        />

        <Table<ProjectRow>
        <Table<RankingRow>
          dataSource={filtered}
          columns={columns}
          loading={loading}
          rowKey={(row) => row.ideaId}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${t("admin.ranking.of", { defaultValue: "of" })} ${total} ${t("admin.ranking.projects", { defaultValue: "projects" })}`,
            pageSizeOptions: ["10", "15", "25", "50", "100"],
          }}
          scroll={{ x: true }}
          rowClassName={(record) => {
            const rank = record.rank ?? 0;
            const badge = getRankBadge(rank);
            if (badge) {
              return "ranking-top-row";
            }
            return "";
          }}
        />
      </Card>

      <style>{`
        .ranking-top-row {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%);
        }
        .ranking-top-row:hover {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%) !important;
        }
      `}</style>
    </Space>
  );
}

