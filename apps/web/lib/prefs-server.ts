import { cookies } from "next/headers";
import { translate } from "@/lib/i18n";
import { parseUi, type UiPrefs } from "@/lib/prefs";

export async function getUi(): Promise<UiPrefs> {
  const jar = await cookies();
  return parseUi((n) => {
    const v = jar.get(n)?.value;
    return v ? decodeURIComponent(v) : undefined;
  });
}

// t() cho Server Component
export async function getT() {
  const ui = await getUi();
  return { ui, t: (s: string, vars?: Record<string, string | number>) => translate(ui.lang, s, vars) };
}
