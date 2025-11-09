import { Button } from "@snailycad/ui";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { Permissions, usePermission } from "hooks/usePermission";
import { classNames } from "lib/classNames";
import { useRouter } from "next/router";
import { Filter } from "react-bootstrap-icons";
import { useActiveUnitsState } from "state/active-unit-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

export function ActiveDeputiesHeader() {
  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const modalState = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { activeDeputies } = useActiveDeputies();

  const { showEmsFilters, setShowFilters } = useActiveUnitsState((state) => ({
    showEmsFilters: state.showEmsFilters,
    setShowFilters: state.setShowFilters,
  }));

  const { hasPermissions } = usePermission();
  const hasDispatchPerms = hasPermissions([Permissions.Dispatch]);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;

  return (
    <header className="dashboard-card__title-bar">
      <h1>{t("Ems.activeDeputies")}</h1>

      <div className="flex items-center gap-2">
        {showCreateTemporaryUnitButton ? (
          <Button
            variant={null}
            className="dashboard-action-neutral"
            onPress={() => modalState.openModal(ModalIds.CreateTemporaryUnit, "ems-fd")}
          >
            {t("Leo.createTemporaryUnit")}
          </Button>
        ) : null}
        <Button
          variant={null}
          className={classNames(
            "dashboard-action-neutral !px-3 !py-2",
            showEmsFilters && "border-indigo-400/80 bg-indigo-500/40 text-white",
          )}
          onPress={() => setShowFilters("ems-fd", !showEmsFilters)}
          title={common("filters")}
          disabled={activeDeputies.length <= 0}
        >
          <Filter
            className={classNames(
              "text-slate-500 dark:text-slate-300",
              showEmsFilters && "text-white",
            )}
            aria-label={common("filters")}
            size={18}
          />
        </Button>
      </div>
    </header>
  );
}
