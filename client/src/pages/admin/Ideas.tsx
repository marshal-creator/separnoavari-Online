import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { listIdeas } from "../../api";
import type { Idea } from "../../api";
import { Table, Input, Typography, Space, Tag, Empty, Tooltip } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { TRACKS } from "../../AppData/tracks";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Search } = Input;

type IdeaRow = Idea & {
  // مطمئن شیم type با API هم‌خوانه
  files?: { pdf?: string | null; word?: string | null } | null;
  submittedAt: string | number | Date;
};

export default function Ideas() {
  const { t } = useTranslation();
  const [data, setData] = useState<IdeaRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState("");

  const trackLabels = useMemo(() => {
    const map = new Map<string, string>();
    TRACKS.forEach((track) => {
      map.set(track.slug, t(track.titleKey));
    });
    return map;
  }, [t]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listIdeas()
      .then((rows: IdeaRow[]) => {
        if (!mounted) return;
        setData(rows || []);
      })
      .catch(() => {
        if (!mounted) return;
        setData([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const qq = q.trim().toLowerCase();
    if (!qq) return data;
    return data.filter((i) => {
      const title = (i.title || "").toLowerCase();
      const track = (i.track || "").toLowerCase();
      const submitter = (i.submitterName || "").toLowerCase();
      const username = (i.submitterUsername || "").toLowerCase();
      const email = (i.contactEmail || "").toLowerCase();
      return (
        title.includes(qq) ||
        track.includes(qq) ||
        submitter.includes(qq) ||
        username.includes(qq) ||
        email.includes(qq)
      );
    });
  }, [data, q]);

  const columns: ColumnsType<IdeaRow> = useMemo(
    () => [
      {
        title: t("admin.common.id"),
        dataIndex: "id",
        key: "id",
        width: 100,
        sorter: (a: IdeaRow, b: IdeaRow) => String(a.id).localeCompare(String(b.id)),
        render: (v: string) => <Text code>{v}</Text>,
      },
      {
        title: t("admin.ideas.title"),
        dataIndex: "title",
        key: "title",
        ellipsis: true as const,
        render: (_: unknown, r: IdeaRow) => (
          <Link to={`/panel/admin/ideas/${r.id}`}>
            {r.title || <Text type="secondary">({t("admin.common.untitled") || "Untitled"})</Text>}
          </Link>
        ),
      },
      {
        title: t("admin.ideas.submitterName", { defaultValue: "Submitter" }),
        dataIndex: "submitterName",
        key: "submitterName",
        width: 200,
        render: (value: string | null) =>
          value ? <Text strong>{value}</Text> : <Text type="secondary">—</Text>,
      },
      {
        title: t("admin.ideas.submitterUsername", { defaultValue: "Username" }),
        dataIndex: "submitterUsername",
        key: "submitterUsername",
        width: 220,
        render: (_: unknown, record: IdeaRow) => {
          const username = record.submitterUsername || record.contactEmail;
          return username ? <Text type="secondary">{username}</Text> : <Text type="secondary">—</Text>;
        },
      },
      {
        title: t("admin.ideas.track"),
        dataIndex: "track",
        key: "track",
        width: 160,
        render: (v: string | null) =>
          v ? <Tag>{trackLabels.get(v) || v}</Tag> : <Text type="secondary">—</Text>,
        filters: Array.from(
          new Set((data || []).map((d) => d.track).filter(Boolean))
        ).map((track) => ({
          text: trackLabels.get(String(track)) || String(track),
          value: String(track),
        })),
        onFilter: (value: string, record: IdeaRow) => record.track === value,
      },
      {
        title: t("admin.ideas.date"),
        dataIndex: "submittedAt",
        key: "submittedAt",
        width: 220,
        sorter: (a: IdeaRow, b: IdeaRow) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
        render: (value: string) => (
          <Tooltip title={new Date(value).toISOString()}>
            {dayjs(value).format("YYYY-MM-DD HH:mm")}
          </Tooltip>
        ),
        defaultSortOrder: "descend" as const,
      },
      {
        title: t("admin.ideas.file"),
        key: "files",
        width: 160,
        render: (_: unknown, r: IdeaRow) => {
          const pdf = r.files?.pdf || (r as { fileUrl?: string }).fileUrl;
          const word = r.files?.word || null;

          if (!pdf && !word) return <Text type="secondary">—</Text>;

          return (
            <Space size="middle">
              {pdf && (
                <a href={pdf} target="_blank" rel="noreferrer">
                  <Space>
                    <FilePdfOutlined />
                    <span>PDF</span>
                  </Space>
                </a>
              )}
              {word && (
                <a href={word} target="_blank" rel="noreferrer">
                  <Space>
                    <FileWordOutlined />
                    <span>Word</span>
                  </Space>
                </a>
              )}
            </Space>
          );
        },
      },
    ],
    [data, t, trackLabels]
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Title level={2} style={{ margin: 0 }}>
        {t("admin.ideas.title")}
      </Title>

      <div style={{ background: "#fff", padding: 16, borderRadius: 8 }}>
        <Search
          placeholder={t("admin.ideas.searchInIdeas")}
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={(val) => setQ(val)}
          enterButton={t("admin.ideas.search") as string}
        />
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        locale={{
          emptyText: <Empty description={t("admin.ideas.empty")} />,
        }}
      />
    </div>
  );
}
