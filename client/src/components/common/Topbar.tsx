import { Switch, Tooltip } from "antd";
import { BulbOutlined, MoonOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoutButton } from "./LogoutButton";
import s from "../../styles/panel.module.scss";

export default function Topbar() {
  const { t } = useTranslation();
  const { resolved, toggle } = useTheme();

  const tooltip = resolved === "dark"
    ? t("admin.topbar.switchToLight", { defaultValue: "Switch to light mode" })
    : t("admin.topbar.switchToDark", { defaultValue: "Switch to dark mode" });

  return (
    <div className={s.topbar}>
      <strong className={s.topbarTitle}>{t("admin.topbar.title", { defaultValue: "Admin Panel" })}</strong>
      <div className={s.topbarActions}>
        <Tooltip title={tooltip}>
          <Switch
            checked={resolved === "dark"}
            onChange={() => toggle()}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<BulbOutlined />}
          />
        </Tooltip>
        <LanguageSwitcher className={s.topbarBtn} />
        <LogoutButton className={s.topbarBtn} />
      </div>
    </div>
  );
}
