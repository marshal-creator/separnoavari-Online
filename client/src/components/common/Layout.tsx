import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import s from "../../styles/panel.module.scss";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className={s.layout}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={s.main}>
        <Topbar />
        <div className={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
