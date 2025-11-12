import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Drawer,
  Empty,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Input,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import api from "../../../service/api";

type AdminJudge = {
  id: number;
  name: string;
  username: string;
  projectCount: number;
};

type JudgeProject = {
  id: number;
  description: string;
  status: string;
  final_score: number | null;
  pdf_url: string | null;
  created_at?: string;
};

const statusColors: Record<string, string> = {
  APPROVED: "green",
  ACCEPTED: "green",
  REJECTED: "red",
  PENDING: "blue",
};

function formatStatus(status: string | null | undefined, t: (key: string) => string) {
  const upper = String(status || "").toUpperCase();
  if (upper === "APPROVED" || upper === "ACCEPTED") return t("admin.status.accepted");
  if (upper === "REJECTED") return t("admin.status.rejected");
  if (upper === "PENDING") return t("admin.status.pending");
  return status || "—";
}

export default function JudgesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [judges, setJudges] = useState<AdminJudge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<AdminJudge | null>(null);
  const [projects, setProjects] = useState<JudgeProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<AdminJudge | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadJudges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AdminJudge[]>("/admin/judges");
      setJudges(res.data ?? []);
    } catch (error: unknown) {
      let errMsg =
        t("admin.judges.pages.judgesListPage.failedLoadJudges") || "Failed to load judges";
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
  }, [t]);

  useEffect(() => {
    loadJudges();
  }, [loadJudges]);

  function openDeleteModal(judge: AdminJudge) {
    setJudgeToDelete(judge);
    setDeleteInput("");
    setDeleteModalOpen(true);
  }

  const handleDeleteJudge = useCallback(async () => {
    if (!judgeToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/judges/${judgeToDelete.id}`);
      message.success(
        t("admin.judges.pages.judgesListPage.deleteSuccess", { defaultValue: "Judge removed" })
      );
      setDeleteModalOpen(false);
      setJudgeToDelete(null);
      loadJudges();
    } catch (error: unknown) {
      let errMsg =
        t("admin.judges.pages.judgesListPage.deleteFailed", {
          defaultValue: "Failed to delete judge",
        }) || "Failed to delete judge";
      if (typeof error === "object" && error !== null) {
        const maybe = error as { response?: { data?: { error?: string } } };
        if (maybe.response?.data?.error) {
          errMsg = maybe.response.data.error;
        }
      }
      message.error(errMsg);
    } finally {
      setDeleting(false);
    }
  }, [judgeToDelete, loadJudges, t]);

  const openJudgeDrawer = useCallback(async (judge: AdminJudge) => {
    setSelectedJudge(judge);
    setDrawerOpen(true);
    setProjects([]);
    setProjectsLoading(true);
    try {
      const res = await api.get<JudgeProject[]>(`/admin/judges/${judge.id}/projects`);
      setProjects(res.data ?? []);
    } catch (error: unknown) {
      let errMsg =
        t("admin.judges.pages.judgesListPage.failedLoadProjects") ||
        "Failed to load projects";
      if (typeof error === "object" && error !== null) {
        const maybe = error as { response?: { data?: { error?: string } } };
        if (maybe.response?.data?.error) {
          errMsg = maybe.response.data.error;
        }
      }
      message.error(errMsg);
    } finally {
      setProjectsLoading(false);
    }
  }, [t]);

  const columns: ColumnsType<AdminJudge> = useMemo(
    () => [
      {
        title: t("admin.judges.pages.judgesListPage.judgeName"),
        dataIndex: "name",
        key: "name",
        render: (value: string) => (
          <Typography.Text style={{ fontWeight: 500 }}>{value}</Typography.Text>
        ),
      },
      {
        title: t("admin.judges.pages.judgesListPage.username"),
        dataIndex: "username",
        key: "username",
        responsive: ["md"],
      },
      {
        title: t("admin.judges.pages.judgesListPage.assignedProjects"),
        dataIndex: "projectCount",
        key: "projectCount",
        width: 160,
        sorter: (a, b) => a.projectCount - b.projectCount,
        render: (value: number) => <Tag color={value ? "blue" : "default"}>{value}</Tag>,
      },
      {
        title: t("admin.judges.pages.judgesListPage.actions"),
        key: "actions",
        width: 220,
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => openJudgeDrawer(record)}
            >
              {t("admin.judges.pages.judgesListPage.view")}
            </Button>
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => navigate(`/panel/admin/judges/${record.id}/assign`)}
            >
              {t("admin.judges.pages.judgesListPage.assign")}
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => openDeleteModal(record)}
            >
              {t("admin.judges.pages.judgesListPage.delete", { defaultValue: "Delete" })}
            </Button>
          </Space>
        ),
      },
    ],
    [t, navigate, openJudgeDrawer]
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t("admin.judges.pages.judgesListPage.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("admin.judges.pages.judgesListPage.subtitle")}
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/panel/admin/judges/create")}
        >
          {t("admin.judges.pages.judgesListPage.createJudge")}
        </Button>
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 16, boxShadow: "0 12px 32px -12px rgba(15, 23, 42, 0.25)" }}
      >
        <Table
          dataSource={judges}
          columns={columns}
          loading={loading}
          rowKey={(row) => row.id}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          sticky
        />
      </Card>

      <Modal
        title={t("admin.judges.pages.judgesListPage.deleteTitle", { defaultValue: "Delete judge" })}
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false);
          setJudgeToDelete(null);
        }}
        okButtonProps={{
          danger: true,
          disabled:
            !judgeToDelete || deleteInput.trim() !== judgeToDelete.username,
        }}
        okText={t("admin.judges.pages.judgesListPage.deleteConfirm", { defaultValue: "Delete" })}
        cancelText={t("common.back")}
        confirmLoading={deleting}
        onOk={handleDeleteJudge}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Paragraph>
            {t("admin.judges.pages.judgesListPage.deleteDescription", {
              defaultValue: "Type the username to confirm deletion of this judge.",
            })}
          </Typography.Paragraph>
          {judgeToDelete && (
            <Typography.Text strong>
              {judgeToDelete.name} — {judgeToDelete.username}
            </Typography.Text>
          )}
          <Input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={t("admin.judges.pages.judgesListPage.deletePlaceholder", {
              defaultValue: "Enter judge username",
            })}
          />
        </Space>
      </Modal>

      <Drawer
        title={selectedJudge ? `${selectedJudge.name} • ${selectedJudge.username}` : t("admin.judges.pages.judgesListPage.drawerTitle")}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
      >
        {projectsLoading ? (
          <Typography.Paragraph>{t("admin.judges.pages.judgesListPage.loadingProjects")}</Typography.Paragraph>
        ) : projects.length === 0 ? (
          <Empty description={t("admin.judges.pages.judgesListPage.noProjectsAssigned")} />
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {projects.map((project) => {
              const status = String(project.status || "PENDING").toUpperCase();
              const color = statusColors[status] || "blue";
              return (
                <Card
                  key={project.id}
                  size="small"
                  style={{ borderRadius: 12, boxShadow: "0 10px 30px -20px rgba(15, 23, 42, 0.45)" }}
                >
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                      <Typography.Text strong>{t("admin.judges.pages.judgesListPage.project")} #{project.id}</Typography.Text>
                      <Tag color={color}>{formatStatus(project.status, t)}</Tag>
                    </Space>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      {project.description}
                    </Typography.Paragraph>
                    <Space size={12} wrap>
                      {typeof project.final_score === "number" && (
                        <Tag color="blue">{t("admin.judges.pages.judgesListPage.score")}: {project.final_score} / 100</Tag>
                      )}
                      {project.created_at && (
                        <Tag>
                          {new Date(project.created_at).toLocaleDateString()} {" "}
                          {new Date(project.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Tag>
                      )}
                    </Space>
                    {project.pdf_url && (
                      <Button
                        type="link"
                        size="small"
                        href={project.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        icon={<FileOutlined />}
                      >
                        {t("admin.judges.pages.judgesListPage.openPdf")}
                      </Button>
                    )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}


