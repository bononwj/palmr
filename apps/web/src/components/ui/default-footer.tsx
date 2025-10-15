import Link from "next/link";
import { useTranslations } from "next-intl";

export function DefaultFooter() {
  const t = useTranslations();

  return (
    <footer className="w-full flex items-center justify-center py-3 h-16">
      <div className="flex flex-col items-center">
        <Link
          target="_blank"
          className="flex items-center gap-1 text-current"
          href="https://www.yipai360.com"
          title={t("footer.kyanHomepage")}
        >
          <p className="text-primary text-xs sm:text-sm">一拍即传</p>
        </Link>
      </div>
    </footer>
  );
}
