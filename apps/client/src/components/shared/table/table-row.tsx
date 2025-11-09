import { ErrorBoundary } from "@sentry/nextjs";
import { TableActionsAlignment } from "@snailycad/types";
import { type Cell, flexRender, type Row, type RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";

interface Props<TData extends RowData> {
  row: Row<TData>;
  idx: number;
  tableActionsAlignment: TableActionsAlignment | null;
  stickyBgColor: string;
}

export function TableRow<TData extends RowData>({
  row,
  idx,
  tableActionsAlignment,
  stickyBgColor,
}: Props<TData>) {
  const rawRowProps = (row.original as any)?.rowProps as Partial<Record<string, any>> | undefined;
  const { className: providedClassName, ...rowProps } = rawRowProps ?? {};
  const hasCustomBackground =
    providedClassName?.includes("bg-") || Boolean(rawRowProps?.style?.backgroundColor);

  return (
    <tr
      {...rowProps}
      data-row-index={idx}
      className={classNames(
        "table-row-base",
        hasCustomBackground && "table-row-base--custom",
        providedClassName,
      )}
      key={row.id}
    >
      {row.getVisibleCells().map((cell) => {
        return (
          <ErrorBoundary fallback={() => <p>ERROR!</p>} key={cell.id}>
            <TableCell
              {...{
                row,
                idx,
                tableActionsAlignment,
                cell,
                stickyBgColor,
                rowProps: rawRowProps,
              }}
            />
          </ErrorBoundary>
        );
      })}
    </tr>
  );
}

function TableCell<TData extends RowData>(
  props: Props<TData> & {
    cell: Cell<TData, any>;
    rowProps: Partial<Record<string, any>> | undefined;
  },
) {
  const isMove = props.cell.column.id === "drag-drop";
  const isActions = props.cell.column.id === "actions";
  const cellValue = ["drag-drop", "select"].includes(props.cell.column.id)
    ? props.cell.column.columnDef.cell
    : props.cell.renderValue<any>();

  const isLeft = props.tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = props.tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  const hasStyle = Boolean(props.rowProps?.style);
  const bgColor = hasStyle
    ? null
    : props.rowProps?.className?.includes("bg")
      ? props.rowProps.className
      : props.stickyBgColor;

  return (
    <td
      className={classNames(
        "m-0 text-left px-4 py-3 align-middle first:pl-5 last:pr-5",
        "text-slate-700 dark:text-slate-200",
        isActions && `w-36 sticky ${dir}`,
        isMove && "w-5",
        bgColor,
      )}
    >
      {flexRender(cellValue, props.cell.getContext())}
    </td>
  );
}
