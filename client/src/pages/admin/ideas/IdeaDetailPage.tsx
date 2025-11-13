import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Space,
  Spin,
  Tag,
  Typography,
  Descriptions,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getIdea, type Idea, type Assignment } from "../../../api";
import { TRACKS } from "../../../AppData/tracks";

const { Title, Text, Paragraph } = Typography;

type IdeaDetail = Idea & { assignments?: Assignment[] };

export default function IdeaDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const ideaId = params.id ?? "";

  const { data: idea, isLoading, isError, error } = useQuery<IdeaDetail>({
    queryKey: ["admin-idea-detail", ideaId],
    queryFn: async () => {
      const detail = await getIdea(ideaId);
      return detail as IdeaDetail;
    },
    enabled: Boolean(ideaId),
  });

  const trackLabel = useMemo(() => {
    if (!idea?.track) return null;
    const track = TRACKS.find((item) => item.slug === idea.track);
    if (!track) return idea.track;
    return t(track.titleKey);
  }, [idea?.track, t]);

  const statusMeta = useMemo(() => {
    const status = String(idea?.status || "PENDING").toUpperCase();
    switch (status) {
      case "ACCEPTED":
        return { color: "green", label: t("admin.status.accepted") };
      case "REJECTED":
        return { color: "red", label: t("admin.status.rejected") };
      case "UNDER_REVIEW":
        return { color: "blue", label: t("admin.status.underReview") };
      case "PENDING":
      default:
        return { color: "gold", label: t("admin.status.pending") };
    }
  }, [idea?.status, t]);

  const teamMembers = useMemo(() => {
    if (!idea?.teamMembers) return [];
    if (Array.isArray(idea.teamMembers)) {
      return idea.teamMembers.filter(Boolean).map(String);
    }
    if (typeof idea.teamMembers === "object") {
      return Object.values(idea.teamMembers)
        .filter(Boolean)
        .map((member) => String(member));
    }
    return String(idea.teamMembers)
      .split(/[,،]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [idea?.teamMembers]);

  if (isLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <Alert
        type="error"
        message={t("admin.ideas.detailLoadError", { defaultValue: "Unable to load idea" })}
        description={error instanceof Error ? error.message : undefined}
        showIcon
        action={
          <Button type="primary" onClick={() => navigate(-1)}>
            {t("common.back", { defaultValue: "Back" })}
          </Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        {t("common.back", { defaultValue: "Back" })}
      </Button>

      <Card
        style={{ borderRadius: 16, boxShadow: "0 18px 40px -24px rgba(15, 23, 42, 0.2)" }}
        bodyStyle={{ display: "grid", gap: 20 }}
      >
        <Space direction="vertical" size={12}>
          <Space wrap align="center">
            <Title level={2} style={{ margin: 0 }}>
              {idea.title || t("admin.common.untitled")}
            </Title>
            <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
            {trackLabel && <Tag color="blue">{trackLabel}</Tag>}
          </Space>
          {idea.executiveSummary && (
            <Paragraph style={{ fontSize: 16, lineHeight: 1.7 }}>
              {idea.executiveSummary}
            </Paragraph>
          )}
        </Space>

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label={t("admin.ideas.date")}>
            {dayjs(idea.submittedAt).format("YYYY-MM-DD HH:mm")}
          </Descriptions.Item>
          {idea.updatedAt && (
            <Descriptions.Item label={t("account.updatedAt")}>
              {dayjs(idea.updatedAt).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t("admin.ideas.submitterName", { defaultValue: "Submitter" })}>
            {idea.submitterName || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("admin.ideas.submitterUsername", { defaultValue: "Username" })}>
            {idea.submitterUsername || idea.contactEmail || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("account.contactEmail")}>
            {idea.contactEmail || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("account.phone")}>
            {idea.phone || "—"}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">{t("account.teamMembers")}</Divider>
        {teamMembers.length ? (
          <List
            bordered
            dataSource={teamMembers}
            renderItem={(member, index) => <List.Item>{index + 1}. {member}</List.Item>}
          />
        ) : (
          <Text type="secondary">{t("admin.ideas.noTeamMembers", { defaultValue: "No team members provided." })}</Text>
        )}

        <Divider orientation="left">{t("account.file")}</Divider>
        <Space size={12} wrap>
          {idea.files?.pdf && (
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              href={idea.files.pdf}
              target="_blank"
              rel="noreferrer"
            >
              {t("buttons.downloadPdf")}
            </Button>
          )}
          {idea.files?.word && (
            <Button
              icon={<FileWordOutlined />}
              href={idea.files.word}
              target="_blank"
              rel="noreferrer"
            >
              {t("account.viewUploadedFile")}
            </Button>
          )}
          {!idea.files?.pdf && !idea.files?.word && (
            <Text type="secondary">—</Text>
          )}
        </Space>

        <Divider orientation="left">{t("admin.ideas.assignmentsSection", { defaultValue: "Assigned Judges" })}</Divider>
        {idea.assignments && idea.assignments.length > 0 ? (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {idea.assignments.map((assignment) => (
              <Card key={assignment.id} size="small" style={{ borderRadius: 12 }}>
                <Space direction="vertical" size={6} style={{ width: "100%" }}>
                  <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                    <Text strong>{assignment.judgeName || assignment.judgeUsername || assignment.judgeId || t("admin.ideas.unknownJudge", { defaultValue: "Unknown judge" })}</Text>
                    <Tag>{assignment.status}</Tag>
                  </Space>
                  {assignment.description && (
                    <Text type="secondary">{assignment.description}</Text>
                  )}
                  <Space size={12} wrap>
                    {assignment.pdfUrl && (
                      <Button
                        size="small"
                        icon={<FilePdfOutlined />}
                        href={assignment.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("admin.ideas.openBrief", { defaultValue: "Open PDF" })}
                      </Button>
                    )}
                    {assignment.finalScore != null && (
                      <Tag color="blue">
                        {t("admin.ranking.columns.score")}: {assignment.finalScore}
                      </Tag>
                    )}
                    {assignment.createdAt && (
                      <Tag>
                        {dayjs(assignment.createdAt).format("YYYY-MM-DD HH:mm")}
                      </Tag>
                    )}
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("admin.ideas.noAssignments", { defaultValue: "No judge assignments recorded for this idea yet." })}
          />
        )}
      </Card>
    </Space>
  );
}

