import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { themeAtom, actualThemeAtom, toggleThemeAtom } from "@/stores/theme";

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  const actualTheme = useAtomValue(actualThemeAtom);
  const toggleTheme = useSetAtom(toggleThemeAtom);

  return {
    theme,
    setTheme,
    actualTheme,
    toggleTheme,
  };
}
