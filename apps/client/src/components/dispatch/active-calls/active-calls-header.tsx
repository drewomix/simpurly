import { Button } from "@snailycad/ui";
import type { useAsyncTable } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Filter } from "react-bootstrap-icons";
import { useCallsFilters } from "state/callsFiltersState";
import type { Full911Call } from "state/dispatch/dispatch-state";
import dynamic from "next/dynamic";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useRouter } from "next/router";

const CallsFilters = dynamic(async () => (await import("./call-filters")).CallsFilters);

interface Props {
  calls: Full911Call[];
  asyncTable: ReturnType<typeof useAsyncTable<Full911Call>>;
}

export function ActiveCallsHeader({ calls, asyncTable }: Props) {
  const { setShowFilters, showFilters } = useCallsFilters((state) => ({
    setShowFilters: state.setShowFilters,
    showFilters: state.showFilters,
  }));

  const router = useRouter();
  const isDispatchRoute = router.pathname === "/dispatch";
  const { hasActiveDispatchers } = useActiveDispatchers();
  const modalState = useModal();
  const t = useTranslations("Calls");

  function handleCreateIncident() {
    modalState.openModal(ModalIds.Manage911Call);
  }

  return (
    <>
      <header className="dashboard-card__title-bar">
        <h1>{t("active911Calls")}</h1>
        <div className="flex gap-2">
          <Button
            variant={null}
            className="dashboard-action-primary"
            onPress={handleCreateIncident}
            isDisabled={isDispatchRoute ? !hasActiveDispatchers : false}
          >
            {t("create911Call")}
          </Button>
          <Button
            variant={null}
            className={classNames(
              "dashboard-action-neutral !px-3 !py-2",
              showFilters && "border-indigo-400/80 bg-indigo-500/40 text-white",
            )}
            onPress={() => setShowFilters(!showFilters)}
            title={t("callFilters")}
            disabled={calls.length <= 0}
          >
            <Filter
              className={classNames(
                "text-slate-500 dark:text-slate-300",
                showFilters && "text-white",
              )}
              aria-label={t("callFilters")}
              size={18}
            />
          </Button>
        </div>
      </header>

      {showFilters ? (
        <div className="dashboard-card__section pt-0">
          <CallsFilters asyncTable={asyncTable} calls={calls} />
        </div>
      ) : null}
    </>
  );
}
