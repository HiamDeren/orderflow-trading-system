"use client";
// Ngữ cảnh giao diện cho Client Component: ngôn ngữ, múi giờ, chế độ sidebar.
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { translate } from "@/lib/i18n";
import { UI_COOKIES, writeCookie, type Lang, type SideMode, type UiPrefs } from "@/lib/prefs";

type Ctx = UiPrefs & {
  t: (s: string, vars?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void;
  setTz: (tz: string) => void;
  setSide: (s: SideMode) => void;
};

const UiCtx = createContext<Ctx | null>(null);

export function UiProvider({ prefs, children }: { prefs: UiPrefs; children: React.ReactNode }) {
  const router = useRouter();
  const [ui, setUi] = useState(prefs);
  const t = useCallback((s: string, vars?: Record<string, string | number>) => translate(ui.lang, s, vars), [ui.lang]);
  const value = useMemo<Ctx>(
    () => ({
      ...ui,
      t,
      setLang: (lang) => {
        writeCookie(UI_COOKIES.lang, lang);
        setUi((u) => ({ ...u, lang }));
        router.refresh();
      },
      setTz: (tz) => {
        writeCookie(UI_COOKIES.tz, tz);
        setUi((u) => ({ ...u, tz }));
        router.refresh();
      },
      setSide: (side) => {
        writeCookie(UI_COOKIES.side, side);
        setUi((u) => ({ ...u, side }));
      },
    }),
    [ui, t, router],
  );
  return <UiCtx.Provider value={value}>{children}</UiCtx.Provider>;
}

export function useUi() {
  const v = useContext(UiCtx);
  if (!v) throw new Error("useUi ngoài UiProvider");
  return v;
}
