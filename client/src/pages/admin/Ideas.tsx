import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listIdeas } from "../../api";
import type { Idea } from "../../api";
import { Table, Input, Typography, Space, Tag, Empty, Tooltip } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text, Link } = Typography;
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
      return title.includes(qq) || track.includes(qq);
    });
  }, [data, q]);

  const columns = [
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
      render: (_: any, r: IdeaRow) => (
        <Link href={`/ideas/${r.id}`}>
          {r.title || <Text type="secondary">({t("admin.common.untitled") || "Untitled"})</Text>}
        </Link>
      ),
    },
    {
      title: t("admin.ideas.track"),
      dataIndex: "track",
      key: "track",
      width: 160,
      render: (v: string | null) =>
        v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
      filters: Array.from(
        new Set((data || []).map((d) => d.track).filter(Boolean))
      ).map((track) => ({ text: String(track), value: String(track) })),
      onFilter: (value: string, record: IdeaRow) => record.track === value,
    },
    {
      title: t("admin.ideas.date"),
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 220,
      sorter: (a: IdeaRow, b: IdeaRow) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      render: (v: any) => (
        <Tooltip title={new Date(v).toISOString()}>
          {dayjs(v).format("YYYY-MM-DD HH:mm")}
        </Tooltip>
      ),
      defaultSortOrder: "descend" as const,
    },
    {
      title: t("admin.ideas.file"),
      key: "files",
      width: 160,
      render: (_: any, r: IdeaRow) => {
        const pdf = r.files?.pdf || (r as any).fileUrl /* سازگاری قدیمی */;
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
  ];

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
        columns={columns as any}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        locale={{
          emptyText: <Empty description={t("admin.ideas.empty")} />,
        }}
      />
    </div>
  );
}
