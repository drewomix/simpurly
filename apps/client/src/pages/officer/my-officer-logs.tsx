import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { Officer, OfficerLog } from "@snailycad/types";
import { makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Title } from "components/shared/Title";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { Permissions } from "@snailycad/permissions";
import type { GetMyOfficersLogsData } from "@snailycad/types/api";
import { useAsyncTable } from "components/shared/Table";
import { useUserOfficers } from "hooks/leo/use-get-user-officers";
import { SelectField } from "@snailycad/ui";
import { Mark43OfficerLayout } from "components/mark43/mark43-officer-layout";

export interface OfficerLogWithOfficer extends Omit<OfficerLog, "officer" | "emsFdDeputy"> {
  officer: Officer;
}

interface Props {
  logs: GetMyOfficersLogsData;
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const asyncTable = useAsyncTable({
    fetchOptions: {
      pageSize: 25,
      onResponse: (json: GetMyOfficersLogsData) => ({
        data: json.logs,
        totalCount: json.totalCount,
      }),
      path: "/leo/logs",
    },
    totalCount: data.totalCount,
    initialData: data.logs,
  });

  const { userOfficers, isLoading } = useUserOfficers();

  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const officerNames = userOfficers.reduce(
    (ac, cv) => ({
      ...ac,
      [cv.id]: `${generateCallsign(cv)} ${makeUnitName(cv)}`,
    }),
    {} as Record<string, string>,
  );

  return (
    <Layout permissions={{ permissions: [Permissions.Leo] }} className="mark43-cad-layout">
      <Title renderLayoutTitle={false}>{t("myOfficerLogs")}</Title>

      <Mark43OfficerLayout
        label={t("officer")}
        title={t("myOfficerLogs")}
        toolbar={
          <div className="mark43-cad__toolbar-row">
            <SelectField
              isDisabled={isLoading}
              isLoading={isLoading}
              onSelectionChange={(value) => {
                asyncTable.setFilters((prev) => ({
                  ...prev,
                  officerId: value,
                }));
              }}
              selectedKey={asyncTable.filters?.officerId ?? null}
              isClearable
              label={t("groupByOfficer")}
              options={Object.entries(officerNames).map(([id, name]) => ({
                label: name,
                value: id,
              }))}
              className="min-w-[16rem]"
            />
          </div>
        }
      >
        {data.totalCount <= 0 ? (
          <p className="mark43-cad__empty">{t("noOfficers")}</p>
        ) : (
          <OfficerLogsTable unit={null} asyncTable={asyncTable} />
        )}
      </Mark43OfficerLayout>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [logs] = await requestAll(req, [["/leo/logs", { logs: [], totalCount: 0 }]]);

  return {
    props: {
      session: user,
      logs,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
