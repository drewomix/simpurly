import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, TextField } from "@snailycad/ui";
import { useCall911State } from "state/dispatch/call-911-state";
import { useCallsFilters } from "state/callsFiltersState";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useRouter } from "next/router";
import { useLeoState } from "state/leo-state";
import { useEmsFdState } from "state/ems-fd-state";
import useFetch from "lib/useFetch";
import type { Full911Call } from "state/dispatch/dispatch-state";
import type { Post911CallAssignUnAssign } from "@snailycad/types/api";
import { classNames } from "lib/classNames";

type ConsoleLogType = "info" | "success" | "error";

interface ConsoleLogEntry {
  id: number;
  input: string;
  output: string;
  type: ConsoleLogType;
}

const statusFilters = ["all", "pending", "accepted", "declined"] as const;

type StatusFilter = (typeof statusFilters)[number];

export function CommandConsole() {
  const [value, setValue] = React.useState("");
  const [logs, setLogs] = React.useState<ConsoleLogEntry[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const modalState = useModal();
  const router = useRouter();
  const { execute } = useFetch();
  const t = useTranslations("Calls");

  const callState = useCall911State((state) => ({
    calls: state.calls,
    setCalls: state.setCalls,
    setCurrentlySelectedCall: state.setCurrentlySelectedCall,
  }));

  const { setSearch, search, setStatus, status, setShowFilters } = useCallsFilters((state) => ({
    setSearch: state.setSearch,
    search: state.search,
    status: state.status,
    setStatus: state.setStatus,
    setShowFilters: state.setShowFilters,
  }));

  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);

  function pushLog(output: string, type: ConsoleLogType, input: string) {
    setLogs((prev) => {
      const next: ConsoleLogEntry = {
        id: Date.now(),
        input,
        output,
        type,
      };

      const updated = [...prev, next];
      return updated.slice(-25);
    });
  }

  function findCallByCase(caseNumber: string): Full911Call | null {
    const normalized = caseNumber.replace(/^#/, "").trim();
    return callState.calls.find((call) => String(call.caseNumber) === normalized) ?? null;
  }

  async function assignUnitToCall({
    call,
    type,
    unitId,
  }: {
    call: Full911Call;
    type: "assign" | "unassign";
    unitId: string | null;
  }) {
    if (!unitId) {
      pushLog(
        "Unit identifier required. Provide a unit ID or use an active unit.",
        "error",
        `${type} ${call.caseNumber}`,
      );
      return;
    }

    const { json } = await execute<Post911CallAssignUnAssign>({
      path: `/911-calls/${type}/${call.id}`,
      method: "POST",
      data: { unit: unitId },
    });

    if (!json?.id) {
      pushLog("Unable to update call.", "error", `${type} ${call.caseNumber}`);
      return;
    }

    callState.setCalls(
      callState.calls.map((existing) => {
        if (existing.id === json.id) {
          return { ...existing, ...json } as Full911Call;
        }
        return existing;
      }),
    );

    pushLog(
      type === "assign" ? "Assigned unit successfully." : "Unassigned unit successfully.",
      "success",
      `${type} ${call.caseNumber}`,
    );
  }

  function handleOpenModal(target: string) {
    const modalTarget = target.toLowerCase();

    switch (modalTarget) {
      case "notepad":
        modalState.openModal(ModalIds.Notepad);
        return pushLog("Opened notepad.", "success", `open ${target}`);
      case "name":
      case "name-search":
        modalState.openModal(ModalIds.NameSearch);
        return pushLog("Opened name search.", "success", `open ${target}`);
      case "vehicle":
        modalState.openModal(ModalIds.VehicleSearch);
        return pushLog("Opened vehicle search.", "success", `open ${target}`);
      case "weapon":
        modalState.openModal(ModalIds.WeaponSearch);
        return pushLog("Opened weapon search.", "success", `open ${target}`);
      case "address":
        modalState.openModal(ModalIds.AddressSearch);
        return pushLog("Opened address search.", "success", `open ${target}`);
      case "custom":
      case "custom-field":
        modalState.openModal(ModalIds.CustomFieldSearch);
        return pushLog("Opened custom field search.", "success", `open ${target}`);
      case "call":
        modalState.openModal(ModalIds.Manage911Call);
        return pushLog("Opened 911 call manager.", "success", `open ${target}`);
      default:
        return pushLog(`Unknown modal target: ${target}`, "error", `open ${target}`);
    }
  }

  async function handleCommand(inputValue: string) {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const tokens = trimmed.split(/\s+/);
    const command = tokens.shift()?.toLowerCase();

    if (!command) return;

    switch (command) {
      case "help": {
        pushLog(
          [
            "Commands:",
            "- help",
            "- open <notepad|name|vehicle|weapon|address|custom|call>",
            "- view call <caseNumber>",
            "- assign <caseNumber> [unitId]",
            "- unassign <caseNumber> [unitId]",
            "- search <text>",
            "- clear search",
            "- filter status <all|pending|accepted|declined>",
            "- summary",
            "- show filters",
          ].join("\n"),
          "info",
          trimmed,
        );
        break;
      }
      case "open": {
        const target = tokens.join(" ");
        if (!target) {
          pushLog("Missing target for open command.", "error", trimmed);
        } else {
          handleOpenModal(target);
        }
        break;
      }
      case "view":
      case "select":
      case "focus": {
        const subject = tokens.shift()?.toLowerCase();
        if (subject !== "call") {
          pushLog("Only call selection is supported.", "error", trimmed);
          break;
        }

        const caseNumber = tokens.shift();
        if (!caseNumber) {
          pushLog("Provide a case number to view.", "error", trimmed);
          break;
        }

        const call = findCallByCase(caseNumber);
        if (!call) {
          pushLog(`Call #${caseNumber} was not found.`, "error", trimmed);
          break;
        }

        callState.setCurrentlySelectedCall(call);
        modalState.openModal(ModalIds.Manage911Call, call);
        pushLog(`Opened call #${call.caseNumber}.`, "success", trimmed);
        break;
      }
      case "assign":
      case "unassign": {
        const caseNumber = tokens.shift();
        if (!caseNumber) {
          pushLog("Provide a case number to update.", "error", trimmed);
          break;
        }

        const call = findCallByCase(caseNumber);
        if (!call) {
          pushLog(`Call #${caseNumber} was not found.`, "error", trimmed);
          break;
        }

        const providedUnit = tokens.shift() ?? null;
        const unitId = providedUnit
          ? providedUnit
          : router.pathname.startsWith("/officer")
            ? (activeOfficer?.id ?? null)
            : router.pathname.startsWith("/ems-fd")
              ? (activeDeputy?.id ?? null)
              : null;

        await assignUnitToCall({ call, type: command as "assign" | "unassign", unitId });
        break;
      }
      case "search": {
        const text = tokens.join(" ");
        if (!text) {
          pushLog("Provide text to search.", "error", trimmed);
          break;
        }

        setSearch(text);
        pushLog(`Search updated to "${text}".`, "success", trimmed);
        break;
      }
      case "clear": {
        const what = tokens.shift()?.toLowerCase();
        if (what === "search") {
          setSearch("");
          pushLog("Search cleared.", "success", trimmed);
        } else {
          pushLog(`Cannot clear ${what ?? "(unknown)"}.`, "error", trimmed);
        }
        break;
      }
      case "filter": {
        const sub = tokens.shift()?.toLowerCase();
        if (sub !== "status") {
          pushLog("Only status filtering is supported.", "error", trimmed);
          break;
        }

        const nextStatus = tokens.shift()?.toLowerCase() as StatusFilter | undefined;
        if (!nextStatus || !statusFilters.includes(nextStatus)) {
          pushLog(`Status must be one of: ${statusFilters.join(", ")}.`, "error", trimmed);
          break;
        }

        setStatus(nextStatus);
        pushLog(`Status filter set to ${nextStatus}.`, "success", trimmed);
        break;
      }
      case "summary": {
        const summary = [
          `Calls loaded: ${callState.calls.length}`,
          `Search: ${search ? `"${search}"` : "(none)"}`,
          `Status filter: ${status}`,
        ].join("\n");

        pushLog(summary, "info", trimmed);
        break;
      }
      case "show": {
        const target = tokens.shift()?.toLowerCase();
        if (target === "filters") {
          setShowFilters(true);
          pushLog("Filters opened.", "success", trimmed);
        } else {
          pushLog(`Unknown show target: ${target ?? "(unknown)"}.`, "error", trimmed);
        }
        break;
      }
      default: {
        pushLog(`Unknown command: ${command}.`, "error", trimmed);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProcessing) return;

    const commandInput = value;
    setValue("");

    try {
      setIsProcessing(true);
      await handleCommand(commandInput);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="mark43-console" aria-label="Command console">
      <header className="mark43-console__header">
        <p className="mark43-console__title">{t("callFilters")} CLI</p>
        <span className="mark43-console__subtitle">Type `help` to get started.</span>
      </header>

      <div className="mark43-console__body">
        <div className="mark43-console__log" role="log" aria-live="polite">
          {logs.length <= 0 ? (
            <p className="mark43-console__empty">No console activity yet.</p>
          ) : (
            logs.map((entry) => (
              <article
                key={entry.id}
                className={classNames(
                  "mark43-console__entry",
                  `mark43-console__entry--${entry.type}`,
                )}
              >
                <header>
                  <span className="mark43-console__entry-input">{entry.input}</span>
                </header>
                <pre className="mark43-console__entry-output">{entry.output}</pre>
              </article>
            ))
          )}
        </div>

        <form className="mark43-console__form" onSubmit={handleSubmit}>
          <TextField
            label="Command"
            name="command"
            value={value}
            autoComplete="off"
            onChange={setValue}
            placeholder="Type a command..."
            disabled={isProcessing}
            className="mark43-console__input"
          />

          <Button type="submit" className="mark43-console__submit" disabled={isProcessing}>
            Run
          </Button>
        </form>
      </div>
    </section>
  );
}
