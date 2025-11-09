import * as React from "react";
import Link from "next/link";
import { useAuth } from "context/AuthContext";
import { useRouter } from "next/router";
import { classNames } from "lib/classNames";
import { CitizenDropdown } from "./dropdowns/citizen-dropdown";
import { OfficerDropdown } from "./dropdowns/officer-dropdown";
import { EmsFdDropdown } from "./dropdowns/ems-fd-dropdown";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { TowDropdown } from "./dropdowns/tow-dropdown";
import { DispatchDropdown } from "./dropdowns/dispatch-dropdown";
import { useTranslations } from "next-intl";
import { useImageUrl } from "hooks/useImageUrl";
import { useViewport } from "@casperiv/useful/hooks/useViewport";
import { AccountDropdown } from "./dropdowns/account-dropdown";
import Head from "next/head";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { ImageWrapper } from "components/shared/image-wrapper";
import { AdminLink } from "./dropdowns/admin-link";

interface Props {
  maxWidth?: string;
  isAccountPending?: boolean;
}

export function Nav({ maxWidth, isAccountPending }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const { user, cad } = useAuth();
  const { TOW, COURTHOUSE } = useFeatureEnabled();
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { hasPermissions } = usePermission();

  const { makeImageUrl } = useImageUrl();
  const url = cad && makeImageUrl("cad", cad.logoId);
  const viewport = useViewport();

  React.useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  React.useEffect(() => {
    if (viewport > 900) {
      setMenuOpen(false);
    }
  }, [viewport]);

  return (
    <nav className="sticky top-0 z-30 border-b border-cyan-400/20 bg-[#0b1727]/95 shadow-[0_20px_40px_-35px_rgba(0,0,0,0.95)] backdrop-blur supports-[backdrop-filter]:bg-[#0b1727]/80">
      <div style={{ maxWidth: maxWidth ?? "100rem" }} className="mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex flex-col nav:hidden w-7"
            aria-label="Toggle menu"
          >
            <span className="my-0.5 h-0.5 w-full rounded-md bg-cyan-300/80" />
            <span className="my-0.5 h-0.5 w-full rounded-md bg-cyan-300/80" />
            <span className="my-0.5 h-0.5 w-full rounded-md bg-cyan-300/80" />
          </button>

          <div className="relative flex items-center nav:space-x-7">
            <h1 className="text-2xl hidden nav:block">
              <a
                href="/citizen"
                className="flex items-center gap-2 py-3 font-semibold text-slate-100"
              >
                {url ? (
                  <>
                    <Head>
                      <link rel="shortcut icon" href={url} />
                      <meta name="og:image" content={url} />
                    </Head>
                    <ImageWrapper
                      quality={80}
                      alt={cad?.name || "SnailyCAD"}
                      width={30}
                      height={30}
                      className="max-h-[30px] min-w-[30px]"
                      src={url}
                      loading="lazy"
                    />
                  </>
                ) : null}
                {cad?.name || "SnailyCAD"}
              </a>
            </h1>

            {isAccountPending ? null : (
              <div
                role="list"
                className={classNames(
                  "nav:flex text-slate-200/80",
                  menuOpen
                    ? "fixed top-[3.6rem] left-0 grid w-screen place-content-center space-y-2 border-y border-cyan-400/10 bg-[#0b1727] py-3 animate-enter"
                    : "hidden nav:flex-row items-center space-x-2",
                )}
              >
                <CitizenDropdown />

                {hasPermissions([Permissions.ViewTowCalls, Permissions.ManageTowCalls]) && TOW ? (
                  <TowDropdown />
                ) : null}

                {hasPermissions(defaultPermissions.defaultLeoPermissions) ? (
                  <OfficerDropdown />
                ) : null}

                {hasPermissions([Permissions.EmsFd]) ? <EmsFdDropdown /> : null}

                {hasPermissions([Permissions.LiveMap, Permissions.Dispatch]) ? (
                  <DispatchDropdown />
                ) : null}

                {user && COURTHOUSE ? (
                  <Link
                    role="listitem"
                    href="/courthouse"
                    className={classNames(
                      "p-1 nav:px-2 text-slate-200/80 transition duration-300 hover:text-cyan-200",
                      isActive("/courthouse") && "font-semibold text-cyan-200",
                    )}
                  >
                    {t("courthouse")}
                  </Link>
                ) : null}

                {hasPermissions([
                  ...defaultPermissions.allDefaultAdminPermissions,
                  ...defaultPermissions.defaultCourthousePermissions,
                  Permissions.ManageAwardsAndQualifications,
                ]) ? (
                  <AdminLink />
                ) : null}
              </div>
            )}
          </div>

          <div>
            <AccountDropdown isAccountPending={isAccountPending} />
          </div>
        </div>
      </div>
    </nav>
  );
}
