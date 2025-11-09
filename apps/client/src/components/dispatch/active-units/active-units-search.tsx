import * as Tooltip from "@radix-ui/react-tooltip";
import { Loader, TextField } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { InfoCircleFill } from "react-bootstrap-icons";
import { useActiveUnitsState } from "state/active-unit-state";

interface Props {
  type: "leo" | "ems-fd";
  isLoading: boolean;
  totalCount: number;
}

export function ActiveUnitsSearch({ totalCount, isLoading, type }: Props) {
  const t = useTranslations("Leo");
  const setSearchType = type === "leo" ? "leoSearch" : "emsSearch";
  const showFiltersType: "showLeoFilters" | "showEmsFilters" =
    type === "leo" ? "showLeoFilters" : "showEmsFilters";

  const common = useTranslations("Common");
  const {
    [showFiltersType]: showFilters,
    [setSearchType]: search,
    setSearch,
  } = useActiveUnitsState((state) => ({
    [showFiltersType]: state[showFiltersType],
    [setSearchType]: state[setSearchType],
    setSearch: state.setSearch,
  }));

  return (
    <div className="space-y-4">
      {totalCount > 0 ? (
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <InfoCircleFill />
                {t("showingOnlyLatest12Units")}
              </p>
            </Tooltip.Trigger>

            <Tooltip.Content
              align="start"
              className="z-50 max-w-lg rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-xl backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/85 dark:text-slate-200"
            >
              <p className="mb-0 leading-relaxed">{t("showingOnlyLatest12UnitsDescription")}</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      ) : null}

      {(showFilters as boolean) ? (
        <div className="relative">
          <TextField
            label={common("search")}
            className="w-full"
            name="search"
            value={search as string}
            onChange={(value) => setSearch(setSearchType, value)}
            placeholder="Name, Badge Number, Status, ..."
          >
            {isLoading ? (
              <span className="absolute right-3 top-[2.4rem]">
                <Loader />
              </span>
            ) : null}
          </TextField>
        </div>
      ) : null}
    </div>
  );
}
