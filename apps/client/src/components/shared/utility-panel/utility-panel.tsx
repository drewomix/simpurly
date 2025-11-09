import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useTime } from "hooks/shared/useTime";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Grid1x2Fill, Wifi } from "react-bootstrap-icons";
import dynamic from "next/dynamic";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { EditDashboardLayoutModal } from "./edit-dashboard-layout-modal";

const DispatchAreaOfPlay = dynamic(async () => {
  return (await import("components/dispatch/dispatch-area-of-play")).DispatchAreaOfPlay;
});

interface Props {
  children: React.ReactNode;
  isDispatch?: boolean;
}

export function UtilityPanel({ children, isDispatch }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const timeRef = useTime();
  const t = useTranslations("Leo");
  const { activeDispatchersCount, hasActiveDispatchers } = useActiveDispatchers();
  const { ACTIVE_DISPATCHERS } = useFeatureEnabled();
  const modalState = useModal();

  return (
    <section className="dashboard-card overflow-hidden">
      <header className="dashboard-card__title-bar">
        <h1>
          {t("utilityPanel")}
          {showAop ? isDispatch ? <DispatchAreaOfPlay /> : <span> - AOP: {areaOfPlay}</span> : null}
        </h1>

        <div className="flex items-center gap-3">
          {ACTIVE_DISPATCHERS ? (
            <span
              title={
                hasActiveDispatchers ? `${activeDispatchersCount} Active Dispatcher(s)` : undefined
              }
            >
              <Wifi
                width={20}
                height={20}
                className={classNames(
                  "fill-current transition-colors text-slate-500 dark:text-slate-400",
                  hasActiveDispatchers && "text-green-400 dark:text-green-400",
                )}
              />
            </span>
          ) : null}
          <span ref={timeRef} />
        </div>
      </header>

      <div className="dashboard-card__body">
        <div className="flex flex-col gap-3">{children}</div>
      </div>

      <footer className="dashboard-card__footer status-buttons-grid">
        <Button
          className="flex items-center gap-2"
          size="xs"
          onPress={() => modalState.openModal(ModalIds.EditDashboardLayout)}
        >
          <Grid1x2Fill />
          Edit Dashboard Layout
        </Button>

        <EditDashboardLayoutModal />
      </footer>
    </section>
  );
}
