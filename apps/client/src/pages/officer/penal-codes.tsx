import * as React from "react";
import { Layout } from "components/Layout";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { dataToSlate, Editor } from "components/editor/editor";
import { useTranslations } from "next-intl";
import type { GetServerSideProps } from "next";
import { requestAll, yesOrNoText } from "lib/utils";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useValues } from "context/ValuesContext";
import { Infofield, TextField } from "@snailycad/ui";
import {
  getPenalCodeMaxFines,
  getPenalCodeMinFines,
} from "components/leo/modals/manage-record/table-item-form";
import { Mark43OfficerLayout } from "components/mark43/mark43-officer-layout";

export default function PenalCodesPage() {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { penalCode } = useValues();

  const [search, setSearch] = React.useState("");
  const [filtered, setFiltered] = React.useState(penalCode.values);

  React.useEffect(() => {
    if (!search) {
      setFiltered(penalCode.values);
    }

    setFiltered(
      penalCode.values.filter((v) => v.title.toLowerCase().includes(search.toLowerCase())),
    );
  }, [search, penalCode.values]);

  return (
    <Layout permissions={{ permissions: [Permissions.Leo] }} className="mark43-cad-layout">
      <Title renderLayoutTitle={false}>{t("penalCodes")}</Title>

      <Mark43OfficerLayout
        label={t("officer")}
        title={t("penalCodes")}
        toolbar={
          <div className="mark43-cad__toolbar-row">
            <TextField
              label={common("search")}
              name="search"
              value={search}
              onChange={(value) => setSearch(value)}
              className="min-w-[14rem]"
            />
          </div>
        }
      >
        {penalCode.values.length <= 0 ? (
          <p className="mark43-cad__empty">{t("noPenalCodes")}</p>
        ) : (
          <ul className="mark43-cad__list">
            {filtered.map((penalCode) => {
              const description = dataToSlate(penalCode);
              const maxFine = getPenalCodeMaxFines(penalCode);
              const minFine = getPenalCodeMinFines(penalCode);
              const [minJailTime, maxJailTime] = penalCode.warningNotApplicable?.prisonTerm ?? [];
              const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

              return (
                <li className="mark43-cad__list-item" key={penalCode.id}>
                  <header className="mark43-cad__list-header">
                    <h3 className="mark43-cad__list-title">{penalCode.title}</h3>

                    <div className="mark43-cad__info-grid">
                      <Infofield label={common("type")}>
                        {penalCode.type?.toLowerCase() ?? common("none")}
                      </Infofield>
                      <Infofield label="Is Primary">{yesOrNoText(penalCode.isPrimary)}</Infofield>
                      <Infofield label={t("warningApplicable")}>
                        {String(Boolean(penalCode.warningApplicable))}
                      </Infofield>
                      <Infofield label={t("fines")}>
                        {minFine}-{maxFine}
                      </Infofield>
                      {typeof minJailTime !== "undefined" ? (
                        <Infofield label={t("jailTime")}>
                          {minJailTime}-{maxJailTime}
                        </Infofield>
                      ) : null}
                      {typeof minBail !== "undefined" ? (
                        <Infofield label={t("bail")}>
                          {minBail}-{maxBail}
                        </Infofield>
                      ) : null}
                    </div>
                  </header>

                  <Editor isReadonly value={description} />
                </li>
              );
            })}
          </ul>
        )}
      </Mark43OfficerLayout>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [values] = await requestAll(req, [["/admin/values/penal_code", []]]);

  return {
    props: {
      session: user,
      values,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
