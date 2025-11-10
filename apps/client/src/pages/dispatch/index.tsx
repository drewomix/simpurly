import * as React from "react";
import dynamic from "next/dynamic";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { ActiveCalls } from "components/dispatch/active-calls/active-calls";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { ActiveBolos } from "components/active-bolos/active-bolos";
import { DispatchModalButtons } from "components/dispatch/utility-configuration";
import { useTranslations } from "use-intl";
import { makeUnitName, requestAll } from "lib/utils";
import { useSignal100 } from "hooks/shared/useSignal100";
import { usePanicButton } from "hooks/shared/usePanicButton";
import { Title } from "components/shared/Title";
import { DashboardLayoutCardType, ValueType } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { Permissions } from "@snailycad/permissions";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { classNames } from "lib/classNames";
import type {
  Get911CallsData,
  GetActiveOfficersData,
  GetBolosData,
  GetDispatchData,
  GetEmsFdActiveDeputies,
  GetUserData,
} from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";
import { ActiveOfficers } from "components/dispatch/active-units/officers/active-officers";
import { ActiveDeputies } from "components/dispatch/active-units/deputies/active-deputies";
import { useAuth } from "context/AuthContext";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { CommandConsole } from "components/dispatch/command-console";

const ActiveIncidents = dynamic(async () => {
  return (await import("components/dispatch/active-incidents/active-incidents")).ActiveIncidents;
});

const Modals = {
  CustomFieldSearch: dynamic(async () => {
    return (await import("components/leo/modals/CustomFieldSearch/CustomFieldSearch"))
      .CustomFieldSearch;
  }),
  NameSearchModal: dynamic(async () => {
    return (await import("components/leo/modals/NameSearchModal/NameSearchModal")).NameSearchModal;
  }),
  VehicleSearchModal: dynamic(async () => {
    return (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal;
  }),
  WeaponSearchModal: dynamic(async () => {
    return (await import("components/leo/modals/weapon-search-modal")).WeaponSearchModal;
  }),
  NotepadModal: dynamic(async () => {
    return (await import("components/shared/NotepadModal")).NotepadModal;
  }),
  AddressSearchModal: dynamic(async () => {
    return (await import("components/dispatch/modals/address-search-modal")).AddressSearchModal;
  }),
};

export interface DispatchPageProps extends GetDispatchData {
  activeDeputies: GetEmsFdActiveDeputies;
  activeOfficers: GetActiveOfficersData;
  calls: Get911CallsData;
  bolos: GetBolosData;
  session: GetUserData | null;
}

export default function DispatchDashboard(props: DispatchPageProps) {
  useLoadValuesClientSide({
    valueTypes: [
      ValueType.CALL_TYPE,
      ValueType.CITIZEN_FLAG,
      ValueType.DRIVERSLICENSE_CATEGORY,
      ValueType.IMPOUND_LOT,
      ValueType.LICENSE,
      ValueType.PENAL_CODE,
      ValueType.VEHICLE_FLAG,
      ValueType.DEPARTMENT,
      ValueType.DIVISION,
      ValueType.ADDRESS_FLAG,
      ValueType.WEAPON_FLAG,
    ],
  });

  const setUserActiveDispatcher = useActiveDispatcherState(
    (state) => state.setUserActiveDispatcher,
  );
  const state = useDispatchState();
  const set911Calls = useCall911State((state) => state.setCalls);
  const t = useTranslations("Leo");
  const { CALLS_911, ACTIVE_INCIDENTS } = useFeatureEnabled();
  const { user } = useAuth();
  const session = user ?? props.session;

  React.useEffect(() => {
    set911Calls(props.calls.calls);
    state.setBolos(props.bolos.bolos);

    setUserActiveDispatcher(props.userActiveDispatcher, props.activeDispatchersCount);

    state.setActiveDeputies(props.activeDeputies);
    state.setActiveOfficers(props.activeOfficers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const cards = [
    {
      type: DashboardLayoutCardType.ACTIVE_OFFICERS,
      isEnabled: true,
      children: <ActiveOfficers initialOfficers={props.activeOfficers} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_DEPUTIES,
      isEnabled: true,
      children: <ActiveDeputies initialDeputies={props.activeDeputies} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_CALLS,
      isEnabled: CALLS_911,
      children: <ActiveCalls initialData={props.calls} />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_INCIDENTS,
      isEnabled: ACTIVE_INCIDENTS,
      children: <ActiveIncidents />,
    },
    {
      type: DashboardLayoutCardType.ACTIVE_BOLOS,
      isEnabled: true,
      children: <ActiveBolos initialBolos={props.bolos} />,
    },
  ];

  const layoutOrder = session?.dispatchLayoutOrder ?? [];
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
      case DashboardLayoutCardType.ACTIVE_BOLOS: {
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
    <Layout className="mark43-cad-layout" permissions={{ permissions: [Permissions.Dispatch] }}>
      <Title renderLayoutTitle={false}>{t("dispatch")}</Title>

      <div className="mark43-cad">
        <DispatchHeader userActiveDispatcher={props.userActiveDispatcher} />

        <div className="mark43-cad__shell">
          <div className="mark43-cad__column mark43-cad__column--left">
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

        <CommandConsole />
      </div>

      <DispatchModals />
    </Layout>
  );
}

function DispatchHeader(props: Pick<DispatchPageProps, "userActiveDispatcher">) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const userActiveDispatcher = useActiveDispatcherState((state) => state.userActiveDispatcher);
  const signal100 = useSignal100();
  const panic = usePanicButton();
  const [currentTime, setCurrentTime] = React.useState(() => new Date());
  const { generateCallsign } = useGenerateCallsign();

  const activeDepartment =
    userActiveDispatcher?.department ?? props.userActiveDispatcher?.department;

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedTime = React.useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(currentTime);
  }, [currentTime]);

  const panicDisplay = React.useMemo(() => {
    if (!panic.unit) {
      return "CLEAR";
    }

    const callsign = generateCallsign(panic.unit);
    const name = makeUnitName(panic.unit);
    return [callsign, name].filter(Boolean).join(" ") || callsign || name || "ACTIVE";
  }, [generateCallsign, panic.unit]);

  return (
    <>
      <signal100.Component enabled={signal100.enabled} audio={signal100.audio} />
      <panic.Component audio={panic.audio} unit={panic.unit} />

      <header className="mark43-cad__header">
        <div className="mark43-cad__brand">
          <p className="mark43-cad__brand-label">MARK43 CAD</p>
          <h1 className="mark43-cad__brand-title">{t("dispatch")}</h1>
        </div>

        <div className="mark43-cad__status-group">
          <div className="mark43-cad__status">
            <span className="mark43-cad__status-label">{t("activeDepartment")}</span>
            <strong className="mark43-cad__status-value">
              {activeDepartment ? activeDepartment.value.value : common("none")}
            </strong>
          </div>

          <div
            className={classNames(
              "mark43-cad__status mark43-cad__status--signal",
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
              "mark43-cad__status mark43-cad__status--panic",
              panic.unit && "mark43-cad__status--active",
            )}
          >
            <span className="mark43-cad__status-label">Panic</span>
            <strong className="mark43-cad__status-value">{panicDisplay}</strong>
          </div>

          <div className="mark43-cad__status">
            <span className="mark43-cad__status-label">Current Time</span>
            <strong className="mark43-cad__status-value">{formattedTime}</strong>
          </div>
        </div>
      </header>

      <div className="mark43-cad__toolbar">
        <DispatchModalButtons />
      </div>
    </>
  );
}

function DispatchModals() {
  const modalState = useModal();

  return (
    <>
      <Modals.NotepadModal />
      {/* name search have their own vehicle/weapon search modal */}
      {modalState.isOpen(ModalIds.NameSearch) ? null : (
        <>
          <Modals.WeaponSearchModal id={ModalIds.WeaponSearch} />
          <Modals.VehicleSearchModal id={ModalIds.VehicleSearch} />
        </>
      )}
      <Modals.AddressSearchModal />
      <Modals.NameSearchModal />
      <Modals.CustomFieldSearch />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values, calls, bolos, activeDispatcherData, activeOfficers, activeDeputies] =
    await requestAll(req, [
      ["/admin/values/codes_10", []],
      ["/911-calls", { calls: [], totalCount: 0 }],
      ["/bolos", { bolos: [], totalCount: 0 }],
      ["/dispatch", { activeDispatchersCount: 0, userActiveDispatcher: null }],
      ["/leo/active-officers", []],
      ["/ems-fd/active-deputies", []],
    ]);

  return {
    props: {
      session: user,
      calls,
      bolos,
      values,
      activeOfficers,
      activeDeputies,

      userActiveDispatcher: activeDispatcherData.userActiveDispatcher ?? null,
      activeDispatchersCount: activeDispatcherData.activeDispatchersCount ?? 0,

      messages: {
        ...(await getTranslations(
          ["citizen", "truck-logs", "ems-fd", "leo", "calls", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
