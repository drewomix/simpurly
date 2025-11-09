import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { StatusesArea } from "components/shared/utility-panel/statuses-area";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useLeoState } from "state/leo-state";
import {
  ActiveToneType,
  DashboardLayoutCardType,
  type Record,
  RecordType,
  ValueType,
} from "@snailycad/types";
import { ActiveCalls } from "components/dispatch/active-calls/active-calls";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { ModalButtons } from "components/leo/ModalButtons";
import { ActiveBolos } from "components/active-bolos/active-bolos";
import { makeUnitName, requestAll } from "lib/utils";
import { ActiveOfficers } from "components/dispatch/active-units/officers/active-officers";
import { ActiveDeputies } from "components/dispatch/active-units/deputies/active-deputies";
import { ActiveWarrants } from "components/leo/active-warrants/active-warrants";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { useNameSearch } from "state/search/name-search-state";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTones } from "hooks/global/use-tones";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type {
  Get911CallsData,
  GetActiveOfficerData,
  GetActiveOfficersData,
  GetBolosData,
  GetEmsFdActiveDeputies,
  GetUserData,
} from "@snailycad/types/api";
import { CreateWarrantModal } from "components/leo/modals/CreateWarrantModal";
import { useCall911State } from "state/dispatch/call-911-state";
import { usePermission } from "hooks/usePermission";
import { useAuth } from "context/AuthContext";
import { ActiveIncidents } from "components/dispatch/active-incidents/active-incidents";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { classNames } from "lib/classNames";
import { Button } from "@snailycad/ui";
import { Grid1x2Fill } from "react-bootstrap-icons";
import { EditDashboardLayoutModal } from "components/shared/utility-panel/edit-dashboard-layout-modal";

const Modals = {
  CreateWarrantModal: dynamic(
    async () => {
      return (await import("components/leo/modals/CreateWarrantModal")).CreateWarrantModal;
    },
    { ssr: false },
  ),
  CustomFieldSearch: dynamic(
    async () => {
      return (await import("components/leo/modals/CustomFieldSearch/CustomFieldSearch"))
        .CustomFieldSearch;
    },
    { ssr: false },
  ),
  NameSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/NameSearchModal/NameSearchModal"))
        .NameSearchModal;
    },
    { ssr: false },
  ),
  VehicleSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
    },
    { ssr: false },
  ),
  WeaponSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/weapon-search-modal")).WeaponSearchModal;
    },
    { ssr: false },
  ),
  BusinessSearchModal: dynamic(
    async () => {
      return (await import("components/leo/modals/business-search-modal/business-search-modal"))
        .BusinessSearchModal;
    },
    { ssr: false },
  ),
  NotepadModal: dynamic(
    async () => {
      return (await import("components/shared/NotepadModal")).NotepadModal;
    },
    { ssr: false },
  ),
  SelectOfficerModal: dynamic(
    async () => {
      return (await import("components/leo/modals/select-officer-modal")).SelectOfficerModal;
    },
    { ssr: false },
  ),
  ManageRecordModal: dynamic(
    async () => {
      return (await import("components/leo/modals/manage-record/manage-record-modal"))
        .ManageRecordModal;
    },
    { ssr: false },
  ),
  SwitchDivisionCallsignModal: dynamic(async () => {
    return (await import("components/leo/modals/SwitchDivisionCallsignModal"))
      .SwitchDivisionCallsignModal;
  }),
  DepartmentInfoModal: dynamic(async () => {
    return (await import("components/leo/modals/department-info-modal")).DepartmentInformationModal;
  }),
};

interface Props {
  activeOfficer: GetActiveOfficerData;
  activeOfficers: GetActiveOfficersData;
  calls: Get911CallsData;
  bolos: GetBolosData;
  activeDeputies: GetEmsFdActiveDeputies;
  session: GetUserData | null;
}

export default function OfficerDashboard({
  bolos,
  calls,
  activeOfficer,
  activeOfficers,
  activeDeputies,
  session: _session,
}: Props) {
  useLoadValuesClientSide({
    valueTypes: [
      ValueType.CITIZEN_FLAG,
      ValueType.VEHICLE_FLAG,
      ValueType.CALL_TYPE,
      ValueType.LICENSE,
      ValueType.DRIVERSLICENSE_CATEGORY,
      ValueType.IMPOUND_LOT,
      ValueType.PENAL_CODE,
      ValueType.DEPARTMENT,
      ValueType.DIVISION,
      ValueType.WEAPON_FLAG,
    ],
  });

  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const dispatchState = useDispatchState((state) => ({
    setBolos: state.setBolos,
    setActiveOfficers: state.setActiveOfficers,
    setActiveDeputies: state.setActiveDeputies,
  }));
  const set911Calls = useCall911State((state) => state.setCalls);
  const t = useTranslations("Leo");
  const { ACTIVE_INCIDENTS, ACTIVE_WARRANTS, CALLS_911 } = useFeatureEnabled();
  const { user } = useAuth();
  const session = user ?? _session;

  React.useEffect(() => {
    setActiveOfficer(activeOfficer);

    set911Calls(calls.calls);
    dispatchState.setBolos(bolos.bolos);

    dispatchState.setActiveDeputies(activeDeputies);
    dispatchState.setActiveOfficers(activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolos, calls, activeOfficers, activeDeputies, activeOfficer]);

  const cards = [
    {
      type: DashboardLayoutCardType.ACTIVE_OFFICERS,
      isEnabled: true,
      children: <ActiveOfficers initialOfficers={activeOfficers} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_DEPUTIES,
      isEnabled: true,
      children: <ActiveDeputies initialDeputies={activeDeputies} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_CALLS,
      isEnabled: CALLS_911,
      children: <ActiveCalls initialData={calls} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_WARRANTS,
      isEnabled: ACTIVE_WARRANTS,
      children: <ActiveWarrants />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_BOLOS,
      isEnabled: true,
      children: <ActiveBolos initialBolos={bolos} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_INCIDENTS,
      isEnabled: ACTIVE_INCIDENTS,
      children: <ActiveIncidents />,
    },
  ];

  const layoutOrder = session?.officerLayoutOrder ?? [];
  const sortedCards = [...cards].sort((a, b) => {
    return layoutOrder.indexOf(a.type) - layoutOrder.indexOf(b.type);
  });

  const columns = {
    left: [] as typeof sortedCards,
    center: [] as typeof sortedCards,
    right: [] as typeof sortedCards,
  };

  for (const card of sortedCards) {
    if (!card.isEnabled) continue;

    switch (card.type) {
      case DashboardLayoutCardType.ACTIVE_OFFICERS:
      case DashboardLayoutCardType.ACTIVE_DEPUTIES: {
        columns.left.push(card);
        break;
      }
      case DashboardLayoutCardType.ACTIVE_BOLOS:
      case DashboardLayoutCardType.ACTIVE_WARRANTS: {
        columns.right.push(card);
        break;
      }
      default: {
        columns.center.push(card);
        break;
      }
    }
  }

  return (
    <Layout permissions={{ permissions: [Permissions.Leo] }} className="mark43-cad-layout">
      <Title renderLayoutTitle={false}>{t("officer")}</Title>

      <div className="mark43-cad mark43-cad--officer">
        <OfficerHeader activeOfficer={activeOfficer} />

        <div className="mark43-cad__shell mark43-cad__shell--officer">
          <div className="mark43-cad__column mark43-cad__column--left">
            <div className="mark43-cad__panel mark43-officer__panel">
              <OfficerSelfInitiatePanel activeOfficer={activeOfficer} />
            </div>

            {columns.left.map((card) => (
              <div key={card.type} className="mark43-cad__panel">
                {card.children}
              </div>
            ))}
          </div>

          <div className="mark43-cad__main">
            {columns.center.map((card) => (
              <div key={card.type} className="mark43-cad__panel mark43-cad__panel--primary">
                {card.children}
              </div>
            ))}
          </div>

          <div className="mark43-cad__column mark43-cad__column--right">
            {columns.right.map((card) => (
              <div key={card.type} className="mark43-cad__panel">
                {card.children}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modals.SelectOfficerModal />
      <OfficerModals />
    </Layout>
  );
}

function OfficerHeader(props: Pick<Props, "activeOfficer">) {
  const signal100 = useSignal100();
  const tones = useTones(ActiveToneType.LEO);
  const panic = usePanicButton();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();

  const { activeOfficer: activeOfficerState } = useLeoState((state) => ({
    activeOfficer: state.activeOfficer,
  }));

  const [currentTime, setCurrentTime] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const activeUnit = activeOfficerState ?? props.activeOfficer ?? null;

  const formattedTime = React.useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(currentTime);
  }, [currentTime]);

  const activeUnitDisplay = React.useMemo(() => {
    if (!activeUnit) {
      return common("none");
    }

    const callsign = generateCallsign(activeUnit);
    const name = makeUnitName(activeUnit);

    return [callsign, name].filter(Boolean).join(" ") || callsign || name || common("none");
  }, [activeUnit, common, generateCallsign]);

  const panicDisplay = React.useMemo(() => {
    if (!panic.unit) {
      return "CLEAR";
    }

    const callsign = generateCallsign(panic.unit);
    const name = makeUnitName(panic.unit);

    return [callsign, name].filter(Boolean).join(" ") || callsign || name || "ACTIVE";
  }, [generateCallsign, panic.unit]);

  const toneDisplay = React.useMemo(() => {
    if (tones.description) {
      return tones.description;
    }

    if (tones.user) {
      return typeof tones.user === "string" ? tones.user : tones.user.username;
    }

    return "CLEAR";
  }, [tones.description, tones.user]);

  const toneActive = Boolean(tones.description || tones.user);

  return (
    <>
      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />
      <tones.Component audio={tones.audio} description={tones.description} user={tones.user} />

      <header className="mark43-cad__header mark43-officer__header">
        <div className="mark43-cad__brand">
          <p className="mark43-cad__brand-label">{t("officer")}</p>
          <h1 className="mark43-cad__brand-title">Self-Initiate</h1>
        </div>

        <div className="mark43-cad__status-group mark43-officer__status-group">
          <div className="mark43-cad__status mark43-officer__status mark43-cad__status--unit">
            <span className="mark43-cad__status-label">{t("activeOfficer")}</span>
            <strong className="mark43-cad__status-value">{activeUnitDisplay}</strong>
          </div>

          <div
            className={classNames(
              "mark43-cad__status mark43-officer__status mark43-cad__status--signal",
              signal100.enabled && "mark43-cad__status--active",
            )}
          >
            <span className="mark43-cad__status-label">Signal 100</span>
            <strong className="mark43-cad__status-value">
              {signal100.enabled ? "ACTIVE" : "OFF"}
            </strong>
          </div>

          <div
            className={classNames(
              "mark43-cad__status mark43-officer__status mark43-cad__status--panic",
              panic.unit && "mark43-cad__status--active",
            )}
          >
            <span className="mark43-cad__status-label">Panic</span>
            <strong className="mark43-cad__status-value">{panicDisplay}</strong>
          </div>

          <div
            className={classNames(
              "mark43-cad__status mark43-officer__status mark43-cad__status--tone",
              toneActive && "mark43-cad__status--active",
            )}
          >
            <span className="mark43-cad__status-label">Tone</span>
            <strong className="mark43-cad__status-value">{toneDisplay}</strong>
          </div>

          <div className="mark43-cad__status mark43-officer__status">
            <span className="mark43-cad__status-label">Current Time</span>
            <strong className="mark43-cad__status-value">{formattedTime}</strong>
          </div>
        </div>
      </header>
    </>
  );
}

function OfficerSelfInitiatePanel(props: Pick<Props, "activeOfficer">) {
  const t = useTranslations("Leo");
  const modalState = useModal();
  const dispatchState = useDispatchState((state) => ({
    activeOfficers: state.activeOfficers,
    setActiveOfficers: state.setActiveOfficers,
  }));
  const leoState = useLeoState((state) => ({
    activeOfficer: state.activeOfficer,
    setActiveOfficer: state.setActiveOfficer,
  }));

  return (
    <section className="mark43-officer__self-initiate">
      <header className="mark43-officer__self-initiate-header">
        <div>
          <p className="mark43-officer__self-initiate-label">{t("utilityPanel")}</p>
          <h2 className="mark43-officer__self-initiate-title">Self-Initiate</h2>
        </div>

        <span className="mark43-officer__self-initiate-meta">Shift Metadata</span>
      </header>

      <div className="mark43-officer__self-initiate-actions">
        <ModalButtons initialActiveOfficer={props.activeOfficer} />
      </div>

      <StatusesArea
        variant="mark43"
        setUnits={dispatchState.setActiveOfficers}
        units={dispatchState.activeOfficers}
        activeUnit={leoState.activeOfficer}
        setActiveUnit={leoState.setActiveOfficer}
        initialData={props.activeOfficer}
      />

      <div className="mark43-officer__layout-controls">
        <Button
          size="xs"
          className="mark43-officer__layout-button"
          onPress={() => modalState.openModal(ModalIds.EditDashboardLayout)}
        >
          <Grid1x2Fill />
          Edit Dashboard Layout
        </Button>
        <EditDashboardLayoutModal />
      </div>
    </section>
  );
}

function OfficerModals() {
  const leoState = useLeoState();
  const modalState = useModal();
  const { LEO_TICKETS, ACTIVE_WARRANTS } = useFeatureEnabled();
  const { hasPermissions } = usePermission();
  const isAdmin = hasPermissions(defaultPermissions.allDefaultAdminPermissions);

  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));

  function handleRecordCreate(data: Record) {
    if (!currentResult || currentResult.isConfidential) return;

    setCurrentResult({
      ...currentResult,
      Record: [data, ...currentResult.Record],
    });
  }

  const showModals = isAdmin ? true : leoState.activeOfficer;
  if (!showModals) {
    return null;
  }

  return (
    <>
      <Modals.SwitchDivisionCallsignModal />
      <Modals.NotepadModal />
      <Modals.DepartmentInfoModal />

      {/* name search have their own vehicle/weapon search modal */}
      {modalState.isOpen(ModalIds.NameSearch) ? null : (
        <>
          <Modals.WeaponSearchModal />
          <Modals.VehicleSearchModal id={ModalIds.VehicleSearch} />
          <Modals.BusinessSearchModal />

          {LEO_TICKETS ? (
            <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.TICKET} />
          ) : null}
          <Modals.ManageRecordModal onCreate={handleRecordCreate} type={RecordType.ARREST_REPORT} />
          <Modals.ManageRecordModal
            onCreate={handleRecordCreate}
            type={RecordType.WRITTEN_WARNING}
          />
        </>
      )}
      <Modals.NameSearchModal />
      {!ACTIVE_WARRANTS ? <CreateWarrantModal warrant={null} /> : null}
      <Modals.CustomFieldSearch />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [activeOfficer, values, calls, bolos, activeOfficers, activeDeputies] = await requestAll(
    req,
    [
      ["/leo/active-officer", null],
      ["/admin/values/codes_10", []],
      ["/911-calls", { calls: [], totalCount: 0 }],
      ["/bolos", { bolos: [], totalCount: 0 }],
      ["/leo/active-officers", []],
      ["/ems-fd/active-deputies", []],
    ],
  );

  return {
    props: {
      session: user,
      activeOfficers,
      activeDeputies,
      activeOfficer,
      calls,
      bolos,
      values,
      messages: {
        ...(await getTranslations(
          ["citizen", "leo", "truck-logs", "ems-fd", "calls", "common", "business", "courthouse"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
