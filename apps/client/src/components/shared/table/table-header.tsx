import { TableActionsAlignment } from "@snailycad/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@snailycad/ui";
import { type Column, flexRender, type Header, type RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";
import { ArrowDownSquareFill, Check, ThreeDots } from "react-bootstrap-icons";

interface Props<TData extends RowData> {
  header: Header<TData, unknown>;
  tableActionsAlignment: TableActionsAlignment | null;
  tableLeafs: Column<TData>[];
  tableId?: string;
}

export function TableHeader<TData extends RowData>({
  header,
  tableActionsAlignment,
  tableLeafs,
  tableId,
}: Props<TData>) {
  const isActions = header.id === "actions";
  const canSort = isActions ? false : header.column.getCanSort();
  const sortDirection = header.column.getIsSorted();

  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  return (
    <th
      className={classNames(
        "sticky top-0 z-10 px-4 py-3 text-left uppercase tracking-[0.22em]",
        "text-[0.7rem] font-semibold text-slate-200/80 transition-colors duration-150",
        "bg-[#13243c]/95 backdrop-blur border-b border-cyan-400/20 shadow-[inset_0_-1px_0_rgba(8,47,73,0.55)]",
        "first:rounded-tl-2xl last:rounded-tr-2xl",
        isActions ? `${dir} w-[110px]` : "sticky",
        canSort && "cursor-pointer hover:text-cyan-200",
      )}
      key={header.id}
      colSpan={header.colSpan}
      data-column-index={header.index}
      onClick={(event) => {
        if (!canSort) return;
        header.column.getToggleSortingHandler()?.(event);
      }}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header as any, header.getContext())}
      {sortDirection ? (
        <span>
          <ArrowDownSquareFill
            className="ml-2 inline-block h-3.5 w-3.5 text-cyan-300 transition-transform duration-75"
            style={{ transform: sortDirection === "desc" ? "" : "rotate(-180deg)" }}
            width={15}
            height={15}
          />
        </span>
      ) : null}
      {isActions && tableId ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="xs"
              className="ml-2 inline-grid h-7 w-7 place-content-center border border-cyan-400/30 bg-[#1b2d46] text-slate-200 hover:bg-[#23456a]"
            >
              <ThreeDots />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent alignOffset={0} side="left">
            {tableLeafs.map((leaf) => {
              const columnName = (leaf.columnDef.header ?? leaf.id).toString();

              return (
                <DropdownMenuItem
                  closeOnClick={false}
                  key={leaf.id}
                  className={classNames(
                    "flex items-center justify-between",
                    leaf.getIsVisible() && "dark:bg-secondary bg-gray-400",
                  )}
                  onClick={() => leaf.toggleVisibility()}
                >
                  {columnName}

                  {leaf.getIsVisible() ? (
                    <span className="ml-2 text-green-500">
                      <Check aria-label={`Selected ${leaf.id}`} className="dark:text-gray-400" />
                    </span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </th>
  );
}
