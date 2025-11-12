import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
  message,
  Slider,
  Spin,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, FilePdfOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import api from "../../service/api";
import panelStyles from "../../styles/panel.module.scss";
import styles from "./judge-dashboard.module.scss";

type JudgeProject = {
  id: number;
  judge_id: number;
  description: string;
  pdf_path: string | null;
  pdf_url: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  decision_at?: string | null;
  final_score?: number | null;
  evaluation?: {
    ratings?: number[];
  } | null;
};

type JudgeInfo = {
  id: number;
  name: string;
  username?: string;
  email?: string;
};

export default function JudgeDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<JudgeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [judgeInfo, setJudgeInfo] = useState<JudgeInfo | null>(null);
  
  const QUESTIONS = useMemo(() => [
    t("admin.judge.dashboard.questions.q1"),
    t("admin.judge.dashboard.questions.q2"),
    t("admin.judge.dashboard.questions.q3"),
    t("admin.judge.dashboard.questions.q4"),
    t("admin.judge.dashboard.questions.q5"),
    t("admin.judge.dashboard.questions.q6"),
    t("admin.judge.dashboard.questions.q7"),
    t("admin.judge.dashboard.questions.q8"),
    t("admin.judge.dashboard.questions.q9"),
    t("admin.judge.dashboard.questions.q10"),
  ], [t]);
  
  const [ratings, setRatings] = useState<number[]>(() => Array(10).fill(5));
  const [submitting, setSubmitting] = useState(false);
  
  const statusStyle: Record<string, { label: string; color: string }> = useMemo(() => ({
    APPROVED: { label: t("admin.judge.dashboard.status.approved"), color: "green" },
    ACCEPTED: { label: t("admin.judge.dashboard.status.accepted"), color: "green" },
    REJECTED: { label: t("admin.judge.dashboard.status.rejected"), color: "red" },
    PENDING: { label: t("admin.judge.dashboard.status.pending"), color: "blue" },
  }), [t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.get("/judge/me");
      if (!me.data?.judge) {
        navigate("/judge/login");
        return;
      }
      setJudgeInfo(me.data.judge);
      const res = await api.get<JudgeProject[]>("/judge/projects");
      setProjects(res.data || []);
    } catch (error: unknown) {
      let errMsg =
        t("admin.judge.dashboard.failedLoadProjects") || "Failed to load projects";
      if (typeof error === "object" && error !== null) {
        const maybe = error as { response?: { data?: { error?: string } } };
        if (maybe.response?.data?.error) {
          errMsg = maybe.response.data.error;
        }
      }
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/judge/logout", {}, { withCredentials: true });
      message.success(t("admin.judge.dashboard.logoutSuccess") || "Logged out successfully");
      navigate("/judge/login");
    } catch {
      // Even if logout fails, navigate to login
      navigate("/judge/login");
    }
  }, [navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  function openEvaluation(project: JudgeProject) {
    setActiveProjectId(project.id);
    const existing = project.evaluation?.ratings;
    if (existing && existing.length === QUESTIONS.length) {
      setRatings(existing.map((value) => Number(value) || 5));
    } else {
      setRatings(Array(QUESTIONS.length).fill(5));
    }
  }

  async function submitEvaluation(projectId: number, decision: "APPROVED" | "REJECTED") {
    setSubmitting(true);
    try {
      await api.post(`/judge/projects/${projectId}/decision`, {
        decision,
        ratings,
      });
      message.success(decision === "APPROVED" ? t("admin.judge.dashboard.projectApproved") : t("admin.judge.dashboard.projectRejected"));
      setActiveProjectId(null);
      await load();
    } catch (error: unknown) {
      let errMsg =
        t("admin.judge.dashboard.failedSubmitEvaluation") ||
        "Failed to submit evaluation";
      if (typeof error === "object" && error !== null) {
        const maybe = error as { response?: { data?: { error?: string } } };
        if (maybe.response?.data?.error) {
          errMsg = maybe.response.data.error;
        }
      }
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  const totalScore = useMemo(
    () => ratings.reduce((sum, value) => sum + Number(value || 0), 0),
    [ratings]
  );

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: 4 }}>
              {t("admin.judge.dashboard.title")}
            </Typography.Title>
            <Typography.Text type="secondary">
              {t("admin.judge.dashboard.subtitle")}
            </Typography.Text>
          </div>
          <Space size="middle" align="center">
            {judgeInfo && (
              <Space size={8}>
                <UserOutlined style={{ color: "#64748b" }} />
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {judgeInfo.name || judgeInfo.username || `Judge #${judgeInfo.id}`}
                </Typography.Text>
              </Space>
            )}
            <Button
              type="default"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
            >
              {t("common.logout") || "Logout"}
            </Button>
          </Space>
        </div>

        {projects.length === 0 ? (
          <Card className={`${styles.card} ${styles.emptyCard}`}>
            <Empty description={t("admin.judge.dashboard.noProjectsAssigned")} />
          </Card>
        ) : (
          <div className={panelStyles.stack} style={{ gap: 20 }}>
            {projects.map((project) => {
              const statusKey = String(project.status || "PENDING").toUpperCase();
              const status = statusStyle[statusKey] ?? { label: t("admin.judge.dashboard.status.pending"), color: "blue" };
              const isPending = statusKey === "PENDING";
              const isActive = activeProjectId === project.id;
              const fileName = project.pdf_path ? project.pdf_path.split("/").pop() : "project.pdf";

              return (
                <Card
                  key={project.id}
                  className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
                  bodyStyle={{ display: "grid", gap: 16 }}
                  hoverable
                >
                  <Row gutter={[16, 16]} align="middle">
                    <Col flex="auto">
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                          <Typography.Title level={4} style={{ margin: 0 }}>
                            {t("admin.judge.dashboard.project")} #{project.id}
                          </Typography.Title>
                          <Tag color={status.color}>{status.label}</Tag>
                        </Space>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          {project.description}
                        </Typography.Paragraph>
                        <div className={styles.projectMeta}>
                          {typeof project.final_score === "number" && (
                            <Tag color="blue">{t("admin.judge.dashboard.finalScore")}: {project.final_score} / 100</Tag>
                          )}
                          {project.created_at && (
                            <Typography.Text type="secondary">
                              {t("admin.judge.dashboard.received")} {new Date(project.created_at).toLocaleString()}
                            </Typography.Text>
                          )}
                        </div>
                      </Space>
                    </Col>
                  </Row>

                  <div className={styles.fileList}>
                    {project.pdf_url && (
                      <Button
                        icon={<FilePdfOutlined />}
                        href={project.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {fileName}
                      </Button>
                    )}
                    {project.evaluation?.ratings && project.evaluation.ratings.length === QUESTIONS.length && (
                      <Tag color="purple">
                        {t("admin.judge.dashboard.averageScore")}: {(project.evaluation.ratings.reduce((sum, val) => sum + val, 0) / QUESTIONS.length).toFixed(1)}
                      </Tag>
                    )}
                  </div>

                  {isPending && (
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                      {isActive ? (
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                          {QUESTIONS.map((question, idx) => (
                            <div key={question} className={styles.question}>
                              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                                <Typography.Text strong>{idx + 1}. {question}</Typography.Text>
                                <Slider
                                  min={1}
                                  max={10}
                                  value={ratings[idx]}
                                  onChange={(value) => {
                                    const next = [...ratings];
                                    next[idx] = Number(value);
                                    setRatings(next);
                                  }}
                                  marks={{ 1: "1", 10: "10" }}
                                />
                              </Space>
                            </div>
                          ))}

                          <div className={styles.actions}>
                            <Typography.Text strong>{t("admin.judge.dashboard.totalScore")}: {totalScore} / 100</Typography.Text>
                            <div className={styles.actionsButtons}>
                              <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={submitting}
                                onClick={() => submitEvaluation(project.id, "APPROVED")}
                              >
                                {t("admin.judge.dashboard.approve")}
                              </Button>
                              <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                loading={submitting}
                                onClick={() => submitEvaluation(project.id, "REJECTED")}
                              >
                                {t("admin.judge.dashboard.reject")}
                              </Button>
                              <Button onClick={() => setActiveProjectId(null)} disabled={submitting}>
                                {t("admin.judge.dashboard.cancel")}
                              </Button>
                            </div>
                          </div>
                        </Space>
                      ) : (
                        <Button type="primary" onClick={() => openEvaluation(project)}>
                          {t("admin.judge.dashboard.evaluateProject")}
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



