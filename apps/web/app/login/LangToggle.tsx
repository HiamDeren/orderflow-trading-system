"use client";
import { UI_COOKIES, writeCookie, type Lang } from "@/lib/prefs";

export default function LangToggle({ lang }: { lang: Lang }) {
  const set = (l: Lang) => {
    writeCookie(UI_COOKIES.lang, l);
    location.reload();
  };
  return (
    <div className="seg seg-xs" role="group" aria-label="Language">
      <button aria-pressed={lang === "vi"} onClick={() => set("vi")}>VI</button>
      <button aria-pressed={lang === "en"} onClick={() => set("en")}>EN</button>
    </div>
  );
}
