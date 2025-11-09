import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { Permissions, usePermission } from "hooks/usePermission";
import { classNames } from "lib/classNames";
import { useRouter } from "next/router";
import { Filter } from "react-bootstrap-icons";
import { useActiveUnitsState } from "state/active-unit-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

export function ActiveOfficersHeader() {
  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const modalState = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { activeOfficers } = useActiveOfficers();

  const { showLeoFilters, setShowFilters } = useActiveUnitsState((state) => ({
    showLeoFilters: state.showLeoFilters,
    setShowFilters: state.setShowFilters,
  }));

  const { hasPermissions } = usePermission();
  const hasDispatchPerms = hasPermissions([Permissions.Dispatch]);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;
  const { userActiveDispatcher } = useActiveDispatchers();

  return (
    <header className="dashboard-card__title-bar">
      <h1>{t("activeOfficers")}</h1>

      <div className="flex items-center gap-2">
        {showCreateTemporaryUnitButton ? (
          <Button
            isDisabled={!userActiveDispatcher}
            variant={null}
            className="dashboard-action-neutral"
            onPress={() => modalState.openModal(ModalIds.CreateTemporaryUnit, "officer")}
          >
            {t("createTemporaryUnit")}
          </Button>
        ) : null}

        <Button
          variant={null}
          className={classNames(
            "dashboard-action-neutral !px-3 !py-2",
            showLeoFilters && "border-indigo-400/80 bg-indigo-500/40 text-white",
          )}
          onPress={() => setShowFilters("leo", !showLeoFilters)}
          title={common("filters")}
          disabled={activeOfficers.length <= 0}
        >
          <Filter
            className={classNames(
              "text-slate-500 dark:text-slate-300",
              showLeoFilters && "text-white",
            )}
            aria-label={common("filters")}
            size={18}
          />
        </Button>
      </div>
    </header>
  );
}
