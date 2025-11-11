import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../AppData/i18n";

import styles from "./header/header.module.scss";

import Brand from "./header/Brand";
import Actions from "./header/Actions";
import MobileMenu from "./header/MobileMenu";
import DashboardHeaderControls from "../layout/DashboardHeaderControls";

import type { HeaderProps, Lang, NavItem } from "./header/types";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeContext";

const HEADER_OFFSET = 80; // adjust to your fixed header height
const SECTION_IDS = ["timeline", "supports", "contact"] as const;

function applyLangAndDir(lang: Lang) {
  const html = document.documentElement;
  html.dir = lang === "fa" ? "rtl" : "ltr";
  html.lang = lang;
}

export default function Header({
  onLoginClick,
  onSubmitIdea,
  currentLang = "fa",
  onLanguageChange,
  navItems,
  logoSrc = "/images/logo.png",
  ctaLabelFa = "ثبت ایده",
  ctaLabelEn = "Submit Idea",
  loginHref = "/login",
  signupHref = "/signup",
  accountHref = "/account",
}: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const { mode: theme } = useTheme();

  const [lang, setLang] = useState<Lang>(currentLang);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // language / dir
  useEffect(() => {
    applyLangAndDir(lang);
    void i18n.changeLanguage(lang);
    onLanguageChange?.(lang);
  }, [lang, onLanguageChange]);

  // header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // items
  const items: NavItem[] = useMemo(
    () =>
      navItems ?? [
        { id: "tracks", label: t("header.tracks"), href: "/tracks" },
        { id: "committee", label: t("header.committee"), href: "/committee" },
        { id: "calendar", label: t("header.timeline"), href: "/#timeline" },
        { id: "prize", label: t("header.prize"), href: "/#supports" },
        { id: "contact", label: t("header.contact"), href: "/#contact" },
      ],
    [navItems, t, lang]
  );

  // router-aware navigate
  const navigateTo = useCallback(
    (href: string, e?: React.MouseEvent) => {
      if (href.startsWith("#")) return; // same-page anchor: let browser handle
      const [path, hash] = href.split("#");
      if (path && path !== location.pathname) {
        e?.preventDefault();
        navigate(hash ? `${path}#${hash}` : path);
        return;
      }
      if (!hash) {
        e?.preventDefault();
        navigate(path);
      }
    },
    [navigate, location.pathname]
  );

  // smooth scroll after route change (when a hash is present)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }, 0);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  // scroll-spy (which section is in view)
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }
    const handler = () => {
      let current = "";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const line = HEADER_OFFSET + 10; // line just below header
        if (rect.top <= line && rect.bottom > line) {
          current = id;
          break;
        }
      }
      setActiveSection(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [location.pathname]);

  // *** FIXED *** active logic
  const isActive = useCallback(
    (href: string) => {
      // pure hash on current page
      if (href.startsWith("#")) {
        const id = href.slice(1);
        return location.pathname === "/" && activeSection === id;
      }

      // route + hash (e.g., "/#timeline")
      if (href.includes("#")) {
        const [path, hash] = href.split("#");
        if (location.pathname !== path) return false; // not on the page
        // on "/", highlight only the section in view
        return activeSection === hash;
      }

      // plain route (e.g., "/tracks")
      const clean = (p: string) => (p === "/" ? "/" : p.replace(/\/+$/, ""));
      const hrefPath = clean(href);
      const current = clean(location.pathname);
      return current === hrefPath || current.startsWith(hrefPath + "/");
    },
    [location.pathname, activeSection]
  );

  // mobile
  const toggleMenu = () => setOpen((v) => !v);
  const closeMenu = () => setOpen(false);
  useEffect(() => {
    if (open) closeMenu();
  }, [location.pathname, location.hash]);

  const ctaLabel = lang === "fa" ? ctaLabelFa : ctaLabelEn;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.burger}
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={toggleMenu}
          >
            <span></span><span></span><span></span>
          </button>

          <Brand
            logoSrc={logoSrc}
            title={t("nav.brandTitle")}
            onHomeNavigate={() => navigate("/")}
            lang={lang}
          />
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          <ul className={styles.menu}>
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={it.href}
                  className={`${styles.menuItem} ${isActive(it.href) ? styles.isActive : ""}`}
                  onClick={(e) => navigateTo(it.href, e)}
                  aria-current={isActive(it.href) ? "page" : undefined}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.right}>
          <DashboardHeaderControls />
          <Actions
            isAuthenticated={!!user}
            ctaLabel={ctaLabel}
            onSubmitIdea={onSubmitIdea}
            onLoginClick={onLoginClick}
            lang={lang}
            loginHref={loginHref}
            signupHref={signupHref}
            accountHref={accountHref}
            authUser={user}
          />
        </div>
      </div>

      <MobileMenu
        id="mobile-menu"
        open={open}
        onClose={closeMenu}
        lang={lang}
        theme={theme}
        onLangChange={setLang}
        navItems={items}
        onNavigate={navigateTo}
        onSubmitIdea={onSubmitIdea}
        isAuthenticated={!!user}
        ctaLabel={ctaLabel}
        loginHref={loginHref}
        signupHref={signupHref}
        accountHref={accountHref}
      />
    </header>
  );
}
