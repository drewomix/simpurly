import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, FullDate, Loader, Status, TextField } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { type LicenseExam, LicenseExamStatus } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { ManageExamModal } from "components/leo/exams/manage-license-exam-modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { usePermission } from "hooks/usePermission";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import type { GetLicenseExamsData, DeleteLicenseExamByIdData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { Mark43OfficerLayout } from "components/mark43/mark43-officer-layout";

interface Props {
  data: GetLicenseExamsData;
}

export default function CitizenLogs({ data }: Props) {
  const [search, setSearch] = React.useState("");
  const { hasPermissions } = usePermission();
  const modalState = useModal();
  const t = useTranslations();
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();

  const asyncTable = useAsyncTable({
    search,
    fetchOptions: {
      onResponse: (json: GetLicenseExamsData) => ({
        data: json.exams,
        totalCount: json.totalCount,
      }),
      path: "/leo/license-exams",
    },
    totalCount: data.totalCount,
    initialData: data.exams,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempExam, examState] = useTemporaryItem(asyncTable.items);
  const hasManagePermissions = hasPermissions([Permissions.ManageLicenseExams]);

  const PASS_FAIL_LABELS = {
    PASSED: t("Vehicles.passed"),
    FAILED: t("Vehicles.failed"),
    IN_PROGRESS: t("Vehicles.inProgress"),
  };

  async function handleDelete() {
    if (!tempExam) return;
    const { json } = await execute<DeleteLicenseExamByIdData>({
      path: `/leo/license-exams/${tempExam.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      modalState.closeModal(ModalIds.AlertDeleteExam);

      asyncTable.remove(tempExam.id);
      examState.setTempId(null);
    }
  }

  function handleDeleteClick(exam: LicenseExam) {
    examState.setTempId(exam.id);
    modalState.openModal(ModalIds.AlertDeleteExam);
  }

  function handleEditClick(exam: LicenseExam) {
    examState.setTempId(exam.id);
    modalState.openModal(ModalIds.ManageExam);
  }

  const showResultsMeta =
    search.length > 0 && asyncTable.pagination.totalDataCount !== data.totalCount;

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewLicenseExams, Permissions.ManageLicenseExams],
      }}
      className="mark43-cad-layout"
    >
      <Title renderLayoutTitle={false}>{t("licenseExams.exams")}</Title>

      <Mark43OfficerLayout
        label={leo("officer")}
        title={t("licenseExams.exams")}
        actions={
          hasManagePermissions ? (
            <Button
              className="mark43-cad__pill-button"
              onPress={() => modalState.openModal(ModalIds.ManageExam)}
            >
              {t("licenseExams.createExam")}
            </Button>
          ) : null
        }
        toolbar={
          <div className="mark43-cad__toolbar-row w-full">
            <TextField
              value={search}
              onChange={(value) => setSearch(value)}
              label={common("search")}
              className="flex-1 min-w-[16rem]"
            >
              {asyncTable.isLoading ? (
                <span className="absolute top-[2.4rem] right-2.5">
                  <Loader />
                </span>
              ) : null}
            </TextField>
          </div>
        }
      >
        {showResultsMeta ? (
          <p className="mark43-cad__results-meta">
            {common.rich("showingXResults", {
              amount: asyncTable.pagination.totalDataCount,
            })}
          </p>
        ) : null}

        {asyncTable.noItemsAvailable ? (
          <p className="mark43-cad__empty">{t("licenseExams.noExams")}</p>
        ) : (
          <Table
            tableState={tableState}
            data={asyncTable.items.map((exam) => {
              const hasPassedOrFailed = exam.status !== LicenseExamStatus.IN_PROGRESS;

              return {
                id: exam.id,
                rowProps: {
                className: hasPassedOrFailed ? "opacity-60" : undefined,
              },
              type: exam.type,
              citizen: `${exam.citizen.name} ${exam.citizen.surname}`,
              theoryExam: (
                <span className="capitalize">
                  {exam.theoryExam ? PASS_FAIL_LABELS[exam.theoryExam] : "—"}
                </span>
              ),
              practiceExam: (
                <span className="capitalize">
                  {exam.practiceExam ? PASS_FAIL_LABELS[exam.practiceExam] : "—"}
                </span>
              ),
              status: <Status>{exam.status}</Status>,
              categories: exam.categories?.map((v) => v.value.value).join(", ") || "—",
              license: exam.license.value,
              createdAt: <FullDate>{exam.createdAt}</FullDate>,
              actions: (
                <>
                  {hasPassedOrFailed ? null : (
                    <Button variant="success" size="xs" onPress={() => handleEditClick(exam)}>
                      {common("edit")}
                    </Button>
                  )}
                  <Button
                    className="ml-2"
                    variant="danger"
                    size="xs"
                    onPress={() => handleDeleteClick(exam)}
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            };
          })}
            columns={[
              { header: common("type"), accessorKey: "type" },
              { header: t("Leo.citizen"), accessorKey: "citizen" },
              { header: t("licenseExams.theoryExam"), accessorKey: "theoryExam" },
              { header: t("licenseExams.practiceExam"), accessorKey: "practiceExam" },
              { header: t("Leo.status"), accessorKey: "status" },
              { header: t("licenseExams.categories"), accessorKey: "categories" },
              { header: t("Leo.license"), accessorKey: "license" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
            ]}
          />
        )}
      </Mark43OfficerLayout>

      <AlertModal
        title={t("licenseExams.deleteExam")}
        id={ModalIds.AlertDeleteExam}
        description={t("licenseExams.alert_deleteExam")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => examState.setTempId(null)}
      />

      <ManageExamModal
        onClose={() => examState.setTempId(null)}
        onCreate={(exam) => {
          asyncTable.append(exam);
        }}
        onUpdate={(oldExam, newExam) => {
          asyncTable.update(oldExam.id, newExam);
          examState.setTempId(null);
        }}
        exam={tempExam}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [exams, values] = await requestAll(req, [
    ["/leo/license-exams", { exams: [], totalCount: 0 }],
    ["/admin/values/driverslicense_category?paths=license", []],
  ]);

  return {
    props: {
      values,
      session: user,
      data: exams,
      messages: {
        ...(await getTranslations(
          ["leo", "licenseExams", "citizen", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
