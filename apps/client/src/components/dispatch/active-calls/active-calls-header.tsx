import * as React from "react";
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
import { WhitelistStatus } from "@snailycad/types";

const CallsFilters = dynamic(async () => (await import("./call-filters")).CallsFilters);

interface Props {
  calls: Full911Call[];
  asyncTable: ReturnType<typeof useAsyncTable<Full911Call>>;
}

export function ActiveCallsHeader({ calls, asyncTable }: Props) {
  const { setShowFilters, showFilters, status, setStatus } = useCallsFilters((state) => ({
    setShowFilters: state.setShowFilters,
    showFilters: state.showFilters,
    status: state.status,
    setStatus: state.setStatus,
  }));

  const router = useRouter();
  const isDispatchRoute = router.pathname === "/dispatch";
  const { hasActiveDispatchers } = useActiveDispatchers();
  const modalState = useModal();
  const t = useTranslations("Calls");
  const statusesT = useTranslations("Statuses");

  const counts = React.useMemo(() => {
    return calls.reduce(
      (acc, call) => {
        switch (call.status) {
          case WhitelistStatus.PENDING: {
            acc.pending += 1;
            break;
          }
          case WhitelistStatus.ACCEPTED: {
            acc.accepted += 1;
            break;
          }
          case WhitelistStatus.DECLINED: {
            acc.declined += 1;
            break;
          }
          default:
            break;
        }

        return acc;
      },
      { pending: 0, accepted: 0, declined: 0 },
    );
  }, [calls]);

  const totalCount = asyncTable.pagination.totalDataCount ?? calls.length;

  const tabs = [
    {
      key: "all" as const,
      label: t("active911Calls"),
      count: totalCount,
    },
    {
      key: "pending" as const,
      label: statusesT(WhitelistStatus.PENDING),
      count: counts.pending,
    },
    {
      key: "accepted" as const,
      label: statusesT(WhitelistStatus.ACCEPTED),
      count: counts.accepted,
    },
    {
      key: "declined" as const,
      label: statusesT(WhitelistStatus.DECLINED),
      count: counts.declined,
    },
  ];

  function handleCreateIncident() {
    modalState.openModal(ModalIds.Manage911Call);
  }

  return (
    <>
      <header className="mark43-events__header">
        <div className="mark43-events__heading">
          <div>
            <p className="mark43-events__title">{t("active911Calls")}</p>
            <span className="mark43-events__count">{totalCount}</span>
          </div>

          <div className="mark43-events__tabs" role="tablist" aria-label="Call status filters">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={classNames(
                  "mark43-events__tab",
                  status === tab.key && "mark43-events__tab--active",
                )}
                onClick={() => setStatus(tab.key)}
                role="tab"
                aria-selected={status === tab.key}
              >
                <span>{tab.label}</span>
                <span className="mark43-events__tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mark43-events__header-actions">
          <Button
            variant="transparent"
            className={classNames(
              "mark43-events__icon-button",
              showFilters && "mark43-events__icon-button--active",
            )}
            onPress={() => setShowFilters(!showFilters)}
            title={t("callFilters")}
            disabled={calls.length <= 0}
          >
            <Filter aria-label={t("callFilters")} size={18} />
          </Button>

          <Button
            className="mark43-events__create-button"
            onPress={handleCreateIncident}
            isDisabled={isDispatchRoute ? !hasActiveDispatchers : false}
          >
            {t("create911Call")}
          </Button>
        </div>
      </header>

      {showFilters ? (
        <div className="mark43-events__filters">
          <CallsFilters asyncTable={asyncTable} calls={calls} />
        </div>
      ) : null}
    </>
  );
}
