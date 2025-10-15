import Link from "next/link";
import { useTranslations } from "next-intl";

export function TransparentFooter() {
  const t = useTranslations();

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-50 w-full flex items-center justify-center py-3 h-16 pointer-events-none">
      <div className="flex flex-col items-center pointer-events-auto">
        <Link
          target="_blank"
          className="flex items-center gap-1 text-white/80 hover:text-primary transition-colors"
          href="https://www.yipai360.com"
          title={t("footer.kyanHomepage")}
        >
          <p className="text-primary text-xs sm:text-sm font-medium cursor-pointer hover:text-primary/80">一拍即传</p>
        </Link>
      </div>
    </footer>
  );
}
