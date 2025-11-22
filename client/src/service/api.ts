import axios from "axios";
import i18n from "../AppData/i18n/i18n";

const getAcceptLanguage = () => {
  const lang = i18n.language || "fa";
  return lang === "fa" ? "fa-IR" : "en-US";
};

const api = axios.create({
  baseURL: "/api/",
  headers: {
    "Accept-Language": getAcceptLanguage(),
  },
  withCredentials: true,
});

// Update Accept-Language header when language changes
i18n.on("languageChanged", () => {
  api.defaults.headers["Accept-Language"] = getAcceptLanguage();
});

export default api;
