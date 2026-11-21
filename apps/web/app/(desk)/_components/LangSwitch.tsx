"use client";
import { useUi } from "./Ui";

export default function LangSwitch() {
  const { lang, setLang, t } = useUi();
  return (
    <div className="seg seg-xs" role="group" aria-label={t("Ngôn ngữ")}>
      <button type="button" aria-pressed={lang === "vi"} onClick={() => setLang("vi")}>
        VI
      </button>
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}
