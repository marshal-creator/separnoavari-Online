import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Typography, Space } from "antd";
import { CheckCircleOutlined, RocketOutlined, TrophyOutlined } from "@ant-design/icons";
import DashboardHeaderControls from "../../components/layout/DashboardHeaderControls";
import s from "./submission-ended.module.scss";

const { Title, Paragraph } = Typography;

export default function SubmissionEnded() {
  const { t, i18n } = useTranslation();
  const isFa = (i18n.language || "fa").startsWith("fa");

  return (
    <div className={s.container}>
      {/* Header with theme and language switchers */}
      <div className={s.header}>
        <DashboardHeaderControls />
      </div>

      {/* Main content */}
      <div className={s.content}>
        {/* 3D-themed decorative elements */}
        <div className={s.decorativeElements}>
          <div className={s.shape1}></div>
          <div className={s.shape2}></div>
          <div className={s.shape3}></div>
        </div>

        {/* Main message card */}
        <div className={s.card}>
          <div className={s.iconWrapper}>
            <CheckCircleOutlined className={s.mainIcon} />
          </div>

          <Title level={1} className={s.title}>
            {t("submit.ended.title", {
              defaultValue: isFa
                ? "مهلت ارسال ایده به پایان رسید"
                : "Idea Submission Period Has Ended",
            })}
          </Title>

          <Paragraph className={s.description}>
            {t("submit.ended.description", {
              defaultValue: isFa
                ? "دوره ارسال ایده‌ها به پایان رسیده است. اکنون فرآیند در مرحله بررسی و داوری قرار دارد. نتایج به زودی اعلام خواهد شد."
                : "The idea submission period has ended. The process is now in the review and evaluation phase. Results will be announced soon.",
            })}
          </Paragraph>

          {/* Status indicators */}
          <div className={s.statusGrid}>
            <div className={s.statusItem}>
              <RocketOutlined className={s.statusIcon} />
              <div className={s.statusText}>
                <strong>
                  {t("submit.ended.phase.review", {
                    defaultValue: isFa ? "مرحله بررسی" : "Review Phase",
                  })}
                </strong>
                <span>
                  {t("submit.ended.phase.reviewDesc", {
                    defaultValue: isFa
                      ? "ایده‌های ارسال شده در حال بررسی هستند"
                      : "Submitted ideas are under review",
                  })}
                </span>
              </div>
            </div>

            <div className={s.statusItem}>
              <TrophyOutlined className={s.statusIcon} />
              <div className={s.statusText}>
                <strong>
                  {t("submit.ended.phase.results", {
                    defaultValue: isFa ? "اعلام نتایج" : "Results Announcement",
                  })}
                </strong>
                <span>
                  {t("submit.ended.phase.resultsDesc", {
                    defaultValue: isFa
                      ? "نتایج به زودی اعلام خواهد شد"
                      : "Results will be announced soon",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <Space size="large" className={s.actions}>
            <Link to="/">
              <Button type="primary" size="large">
                {t("submit.ended.backToHome", {
                  defaultValue: isFa ? "بازگشت به صفحه اصلی" : "Back to Home",
                })}
              </Button>
            </Link>
            <Link to="/#timeline">
              <Button size="large">
                {t("submit.ended.viewTimeline", {
                  defaultValue: isFa ? "مشاهده جدول زمانی" : "View Timeline",
                })}
              </Button>
            </Link>
          </Space>
        </div>
      </div>
    </div>
  );
}

