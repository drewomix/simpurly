import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, Droppable, FullDate } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { Table, useTableState } from "components/shared/Table";
import { yesOrNoText } from "lib/utils";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { useActiveIncidentsTable } from "hooks/realtime/use-active-incidents-table";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import type { IncidentInvolvedUnit, LeoIncident } from "@snailycad/types";
import { InvolvedUnitsColumn } from "./columns/involved-units-column";
import { DndActions } from "types/dnd-actions";
import { classNames } from "lib/classNames";
import { useDispatchState } from "state/dispatch/dispatch-state";
import type { PostIncidentsData, PutIncidentByIdData } from "@snailycad/types/api";
import { CallDescription } from "../active-calls/CallDescription";

import dynamic from "next/dynamic";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import compareDesc from "date-fns/compareDesc";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useRouter } from "next/router";
import { useEmsFdState } from "state/ems-fd-state";
import { useLeoState } from "state/leo-state";
import { ActiveIncidentsActionsColumn } from "./columns/actions-column";

const ManageIncidentModal = dynamic(
  async () => (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal,
  { ssr: false },
);

export function ActiveIncidents() {
  /**
   * undefined = hide modal. It will otherwise open 2 modals, 1 with the incorrect data.
   */
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | "create" | "hide">("hide");

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const modalState = useModal();
  const { state, execute } = useFetch();
  const draggingUnit = useDispatchState((state) => state.draggingUnit);

  const asyncTable = useActiveIncidentsTable();
  const router = useRouter();
  const { activeIncidents } = useActiveIncidents();
  const { hasPermissions } = usePermission();

  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const activeOfficer = useLeoState((state) => state.activeOfficer);

  const hasDispatchPermissions = hasPermissions(defaultPermissions.defaultDispatchPermissions);
  const isDispatch = router.pathname === "/dispatch" && hasDispatchPermissions;
  const activeUnitForRoute =
    router.pathname === "/officer"
      ? activeOfficer
      : router.pathname === "/ems-fd"
        ? activeDeputy
        : null;

  const tableState = useTableState({
    tableId: "active-incidents",
    pagination: asyncTable.pagination,
  });

  async function handleAssignUnassignToIncident(
    incident: LeoIncident,
    unitId: string,
    type: "assign" | "unassign",
  ) {
    const { json } = await execute<PostIncidentsData<"leo">>({
      path: `/incidents/${type}/${incident.id}`,
      method: "POST",
      data: { unit: unitId },
    });

    if (json.id) {
      asyncTable.update(json.id, json);
    }
  }

  async function handleDismissIncident() {
    if (tempIncident === "create" || tempIncident === "hide") return;

    const { json } = await execute<PutIncidentByIdData<"leo">>({
      path: `/incidents/${tempIncident.id}`,
      method: "PUT",
      data: {
        ...tempIncident,
        unitsInvolved: tempIncident.unitsInvolved.map((v) => v.id),
        isActive: false,
      },
    });

    if (json.id) {
      asyncTable.remove(json.id);

      modalState.closeModal(ModalIds.AlertDeleteIncident);
      setTempIncident("hide");
    }
  }

  function handleCreateIncident() {
    modalState.openModal(ModalIds.ManageIncident);
    setTempIncident("create");
  }

  return (
    <section className="dashboard-card">
      <header className="dashboard-card__title-bar">
        <h1>{t("activeIncidents")}</h1>

        {isDispatch ? (
          <div>
            <Button
              variant={null}
              className="dashboard-action-primary"
              onPress={handleCreateIncident}
              disabled={!hasActiveDispatchers}
            >
              {t("createIncident")}
            </Button>
          </div>
        ) : null}
      </header>

      <div className="dashboard-card__body">
        {asyncTable.noItemsAvailable ? (
          <p className="dashboard-card__empty">{t("noActiveIncidents")}</p>
        ) : (
          <Table
            isLoading={asyncTable.isInitialLoading}
            tableState={tableState}
            features={{ isWithinCardOrModal: true }}
            containerProps={{ className: "px-0" }}
            data={activeIncidents
              .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
              .map((incident) => {
                const isUnitAssigned = incident.unitsInvolved.some(
                  (v) => v.unit?.id === activeUnitForRoute?.id,
                );

                return {
                  rowProps: {
                    className: classNames(isUnitAssigned && "bg-gray-200 dark:bg-amber-900"),
                  },
                  id: incident.id,
                  caseNumber: `#${incident.caseNumber}`,
                  unitsInvolved: (
                    <InvolvedUnitsColumn
                      isDispatch={isDispatch}
                      handleAssignUnassignToIncident={handleAssignUnassignToIncident}
                      incident={incident}
                    />
                  ),
                  createdAt: <FullDate>{incident.createdAt}</FullDate>,
                  firearmsInvolved: common(yesOrNoText(incident.firearmsInvolved)),
                  injuriesOrFatalities: common(yesOrNoText(incident.injuriesOrFatalities)),
                  arrestsMade: common(yesOrNoText(incident.arrestsMade)),
                  situationCode: incident.situationCode?.value.value ?? common("none"),
                  description: <CallDescription data={incident} />,
                  actions: (
                    <ActiveIncidentsActionsColumn
                      handleAssignUnassignToIncident={handleAssignUnassignToIncident}
                      setTempIncident={setTempIncident}
                      unit={activeUnitForRoute}
                      isUnitAssigned={isUnitAssigned}
                      incident={incident}
                    />
                  ),
                };
              })}
            columns={[
              { header: t("caseNumber"), accessorKey: "caseNumber" },
              { header: t("unitsInvolved"), accessorKey: "unitsInvolved" },
              { header: t("firearmsInvolved"), accessorKey: "firearmsInvolved" },
              { header: t("injuriesOrFatalities"), accessorKey: "injuriesOrFatalities" },
              { header: t("arrestsMade"), accessorKey: "arrestsMade" },
              { header: t("situationCode"), accessorKey: "situationCode" },
              { header: common("description"), accessorKey: "description" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        )}
      </div>

      {isDispatch ? (
        <Droppable<{ incident: LeoIncident; unit: IncidentInvolvedUnit }>
          onDrop={({ incident, unit }) => {
            if (!unit.unit?.id) return;
            handleAssignUnassignToIncident(incident, unit.unit.id, "unassign");
          }}
          accepts={[DndActions.UnassignUnitFromIncident]}
        >
          <div
            className={classNames(
              "grid place-items-center z-50 border border-indigo-400/50 bg-indigo-500/20 backdrop-blur-md fixed bottom-3 left-3 right-4 h-60 shadow-lg rounded-2xl transition-opacity text-slate-900 dark:text-slate-100",
              draggingUnit === "incident"
                ? "pointer-events-all opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <p>{t("dropToUnassignFromIncident")}</p>
          </div>
        </Droppable>
      ) : null}

      {tempIncident === "hide" ? null : (
        <ManageIncidentModal
          type="leo"
          onCreate={(incident) => {
            asyncTable.prepend(incident as LeoIncident);

            if (incident.openModalAfterCreation) {
              setTempIncident(incident as LeoIncident);
              modalState.openModal(ModalIds.ManageIncident);
            } else {
              setTempIncident("hide");
            }
          }}
          onUpdate={(old, incident) => {
            if (incident.isActive) {
              asyncTable.update(old.id, incident as LeoIncident);
            } else {
              asyncTable.remove(incident.id);
            }
          }}
          onClose={() => setTempIncident("hide")}
          incident={tempIncident === "create" ? null : tempIncident}
        />
      )}

      <AlertModal
        state={state}
        title={t("endIncident")}
        description={t("alert_endIncident")}
        onDeleteClick={handleDismissIncident}
        id={ModalIds.AlertDeleteIncident}
        deleteText={t("endIncident")}
        onClose={() => setTempIncident("hide")}
      />
    </section>
  );
}
