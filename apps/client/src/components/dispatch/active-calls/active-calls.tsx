import * as React from "react";
import { useRouter } from "next/router";
import { type Full911Call, useDispatchState } from "state/dispatch/dispatch-state";
import { type AssignedUnit, WhitelistStatus } from "@snailycad/types";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leo-state";
import { useEmsFdState } from "state/ems-fd-state";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useCallsFilters } from "state/callsFiltersState";
import { useAsyncTable } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { Button, Droppable, FullDate, Status } from "@snailycad/ui";
import { DndActions } from "types/dnd-actions";
import { AssignedUnitsColumn } from "./columns/assigned-units-column";
import type { Get911CallsData, Post911CallAssignUnAssign } from "@snailycad/types/api";
import { useMounted } from "@casperiv/useful";
import { CallDescription } from "./CallDescription";
import { ActiveCallsHeader } from "./active-calls-header";
import { ActiveCallsActionsColumn } from "./columns/actions-column";
import { useCall911State } from "state/dispatch/call-911-state";
import { useActiveCalls } from "hooks/realtime/use-active-calls";
import { Manage911CallModal } from "./modals/manage-911-call-modal";
import { DispatchCallTowModal } from "./modals/call-tow-modal";

interface Props {
  initialData: Get911CallsData;
}

function Active911Calls({ initialData }: Props) {
  const { hasPermissions } = usePermission();
  const draggingUnit = useDispatchState((state) => state.draggingUnit);
  const call911State = useCall911State((state) => ({
    calls: state.calls,
    setCalls: state.setCalls,
    currentlySelectedCall: state.currentlySelectedCall,
    setCurrentlySelectedCall: state.setCurrentlySelectedCall,
  }));

  const isMounted = useMounted();
  const calls = isMounted ? call911State.calls : initialData.calls;
  const hasCalls = isMounted ? call911State.calls.length >= 1 : initialData.totalCount >= 1;

  const t = useTranslations("Calls");
  const common = useTranslations("Common");
  const router = useRouter();

  const { CALLS_911 } = useFeatureEnabled();
  const { execute } = useFetch();
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const { search, status } = useCallsFilters((state) => ({
    search: state.search,
    status: state.status,
  }));

  const asyncTable = useAsyncTable({
    search,
    disabled: !CALLS_911,
    fetchOptions: {
      pageSize: 12,
      requireFilterText: true,
      path: "/911-calls",
      onResponse: (json: Get911CallsData) => ({
        data: json.calls,
        totalCount: json.totalCount,
      }),
    },
    initialData: initialData.calls,
    totalCount: initialData.totalCount,
    scrollToTopOnDataChange: false,
  });

  React.useEffect(() => {
    call911State.setCalls(asyncTable.items);
  }, [asyncTable.items]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasDispatchPermissions = hasPermissions(defaultPermissions.defaultDispatchPermissions);
  const isDispatch = router.pathname === "/dispatch" && hasDispatchPermissions;
  const unit =
    router.pathname === "/officer"
      ? activeOfficer
      : router.pathname === "/ems-fd"
        ? activeDeputy
        : null;

  const { audio } = useActiveCalls({ calls, unit });
  const isUnitAssignedToCall = (call: Full911Call) =>
    call.assignedUnits.some((v) => v.unit?.id === unit?.id);

  async function handleAssignUnassignToCall(
    call: Full911Call,
    type: "assign" | "unassign",
    unitId = unit?.id,
  ) {
    const { json } = await execute<Post911CallAssignUnAssign>({
      path: `/911-calls/${type}/${call.id}`,
      method: "POST",
      data: { unit: unitId },
    });

    if (json.id) {
      const callsMapped = calls.map((call) => {
        if (call.id === json.id) {
          return { ...call, ...json };
        }

        return call;
      });

      call911State.setCalls(callsMapped);
    }
  }

  function handleUnassign({ unit, call }: { unit: AssignedUnit; call: Full911Call }) {
    handleAssignUnassignToCall(call, "unassign", unit.unit?.id);
  }

  const _calls = React.useMemo(() => {
    const baseCalls = isDispatch
      ? calls
      : calls.filter((call) => call.status === WhitelistStatus.ACCEPTED);

    if (status === "all") {
      return baseCalls;
    }

    return baseCalls.filter((call) => {
      if (status === "pending") return call.status === WhitelistStatus.PENDING;
      if (status === "accepted") return call.status === WhitelistStatus.ACCEPTED;
      if (status === "declined") return call.status === WhitelistStatus.DECLINED;
      return true;
    });
  }, [calls, isDispatch, status]);

  if (!CALLS_911) {
    return null;
  }

  const totalPages = React.useMemo(() => {
    const totalCount = asyncTable.pagination.totalDataCount || 0;
    return Math.max(1, Math.ceil(totalCount / asyncTable.pagination.pageSize));
  }, [asyncTable.pagination.totalDataCount, asyncTable.pagination.pageSize]);

  function handleNextPage() {
    asyncTable.pagination.setPagination((prev) => ({
      ...prev,
      pageIndex: Math.min(prev.pageIndex + 1, totalPages - 1),
    }));
  }

  function handlePreviousPage() {
    asyncTable.pagination.setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(prev.pageIndex - 1, 0),
    }));
  }

  function renderCallPriority(call: Full911Call) {
    const priority = call.type?.priority;

    if (!priority) {
      return (
        <span className="mark43-event__badge mark43-event__badge--neutral">{common("none")}</span>
      );
    }

    const normalized =
      typeof priority === "string"
        ? priority
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : String(priority);
    const label = typeof priority === "number" ? `P${priority}` : priority;

    return (
      <span
        className={classNames(
          "mark43-event__badge",
          "mark43-event__badge--priority",
          `mark43-event__badge--priority-${normalized}`,
        )}
      >
        {label}
      </span>
    );
  }

  function renderCall(call: Full911Call) {
    const isUnitAssigned = isMounted && isUnitAssignedToCall(call);
    const isSignal = Boolean(call.isSignal100);
    const notifyAssignedUnits = Boolean((call as any).notifyAssignedUnits);

    return (
      <article
        key={call.id}
        className={classNames(
          "mark43-event",
          isSignal && "mark43-event--signal",
          isUnitAssigned && "mark43-event--assigned",
          notifyAssignedUnits && "mark43-event--updated",
        )}
      >
        <div className="mark43-event__details">
          <div className="mark43-event__meta">
            {renderCallPriority(call)}
            <span className="mark43-event__meta-id">#{call.caseNumber}</span>
            <span className="mark43-event__status-chip">
              <Status fallback="—">{call.status}</Status>
            </span>
            <span className="mark43-event__meta-updated">
              <FullDate>{call.updatedAt}</FullDate>
            </span>
          </div>

          <div className="mark43-event__primary">
            <h3 className="mark43-event__location">
              {call.location}
              {call.postal ? <span className="mark43-event__postal">({call.postal})</span> : null}
            </h3>
            <p className="mark43-event__type">{call.type?.value.value ?? common("none")}</p>
            <div className="mark43-event__description">
              <CallDescription data={call} nonCard />
            </div>
          </div>
        </div>

        <div className="mark43-event__sidebar">
          <div className="mark43-event__assigned">
            <AssignedUnitsColumn
              handleAssignToCall={(call, unitId) =>
                handleAssignUnassignToCall(call, "assign", unitId)
              }
              isDispatch={isDispatch}
              call={call}
            />
          </div>

          <div className="mark43-event__actions">
            <ActiveCallsActionsColumn
              handleAssignUnassignToCall={handleAssignUnassignToCall}
              isUnitAssigned={isUnitAssigned}
              unit={unit}
              call={call}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <section className="mark43-events">
      {audio.addedToCallAudio}
      {audio.incomingCallAudio}
      <ActiveCallsHeader asyncTable={asyncTable} calls={calls} />

      <div className="mark43-events__body">
        {!hasCalls ? (
          <p className="mark43-events__empty">{t("no911Calls")}</p>
        ) : (
          <div className="mark43-events__list">{_calls.map((call) => renderCall(call))}</div>
        )}
      </div>

      {hasCalls ? (
        <footer className="mark43-events__footer">
          <div className="mark43-events__pagination">
            <Button
              className="mark43-events__pagination-button"
              variant="transparent"
              onPress={handlePreviousPage}
              disabled={asyncTable.pagination.pageIndex <= 0}
            >
              Previous
            </Button>
            <span className="mark43-events__pagination-status">
              {asyncTable.pagination.pageIndex + 1} / {totalPages}
            </span>
            <Button
              className="mark43-events__pagination-button"
              variant="transparent"
              onPress={handleNextPage}
              disabled={asyncTable.pagination.pageIndex + 1 >= totalPages}
            >
              Next
            </Button>
          </div>
        </footer>
      ) : null}

      {isDispatch ? (
        <Droppable onDrop={handleUnassign} accepts={[DndActions.UnassignUnitFrom911Call]}>
          <div
            className={classNames(
              "grid place-items-center z-50 border border-indigo-400/50 bg-indigo-500/20 backdrop-blur-md fixed bottom-3 left-3 right-4 h-60 shadow-lg rounded-2xl transition-opacity text-slate-900 dark:text-slate-100",
              draggingUnit === "call"
                ? "pointer-events-all opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <p>{t("dropToUnassign")}</p>
          </div>
        </Droppable>
      ) : null}

      <DispatchCallTowModal call={call911State.currentlySelectedCall} />
      <Manage911CallModal
        setCall={call911State.setCurrentlySelectedCall}
        onClose={() => call911State.setCurrentlySelectedCall(null)}
        call={call911State.currentlySelectedCall}
      />
    </section>
  );
}

export const ActiveCalls = React.memo(Active911Calls);
