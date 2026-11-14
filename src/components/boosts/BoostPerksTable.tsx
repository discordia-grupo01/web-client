import {
  BOOST_LEVELS,
  BOOST_TABLE_HINT,
  BOOST_TABLE_INCLUDED,
  BOOST_TABLE_NOT_INCLUDED,
  BOOST_TABLE_NOTE,
  BOOST_TABLE_PERK_HEADER,
  BOOST_TABLE_ROW_LABELS,
  BOOST_TABLE_ROWS,
  BOOST_TABLE_TITLE,
  type BoostLevel,
  boostLevelColumnDetail,
  boostLevelLabel,
  boostLevelShortLabel,
  type BoostTableCell,
} from "@discordia/client-shared";
import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

import { BoostLevelIcon } from "./BoostLevelIcon";

const CURRENT_COLUMN = "bg-accent/35";

interface BoostPerksTableProps {
  level: BoostLevel;
}

export function BoostPerksTable({ level }: BoostPerksTableProps) {
  return (
    <section aria-labelledby="boost-table-title" className="space-y-2.5">
      <div>
        <h3
          id="boost-table-title"
          className="font-display text-content text-base font-bold"
        >
          {BOOST_TABLE_TITLE}
        </h3>
        <p className="text-content-muted mt-0.5 text-xs">{BOOST_TABLE_HINT}</p>
      </div>

      <div className="border-line-strong overflow-hidden rounded-2xl border">
        <table className="w-full table-fixed border-collapse text-left text-xs">
          <thead>
            <tr className="bg-surface-sunken">
              <th
                scope="col"
                className="text-content-subtle w-[34%] px-3 py-3 text-[10px] font-bold tracking-wider uppercase sm:px-4"
              >
                {BOOST_TABLE_PERK_HEADER}
              </th>
              {BOOST_LEVELS.map((column) => {
                const isCurrent = column === level;
                return (
                  <th
                    key={column}
                    scope="col"
                    className={cn(
                      "px-1 pt-3 pb-2.5 text-center",
                      isCurrent &&
                        `${CURRENT_COLUMN} shadow-[inset_0_3px_0_var(--boost-yellow)]`,
                    )}
                  >
                    <BoostLevelIcon
                      level={column}
                      size={20}
                      className="mx-auto"
                    />
                    <span
                      className={cn(
                        "font-display mt-1.5 block text-[13px] font-bold",
                        isCurrent ? "text-content" : "text-content-muted",
                      )}
                    >
                      <span className="sm:hidden">
                        {boostLevelShortLabel(column)}
                      </span>
                      <span className="hidden sm:inline">
                        {boostLevelLabel(column)}
                      </span>
                    </span>
                    <span className="text-content-muted mt-px hidden text-[10px] font-medium sm:block">
                      {boostLevelColumnDetail(column, isCurrent)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {BOOST_TABLE_ROWS.map((row) => (
              <tr
                key={row.perk}
                className="border-line bg-surface-raised border-t"
              >
                <th
                  scope="row"
                  className="text-content-muted px-3 py-3 font-medium sm:px-4"
                >
                  <span className="sm:hidden">
                    {BOOST_TABLE_ROW_LABELS[row.perk].shortLabel}
                  </span>
                  <span className="hidden sm:inline">
                    {BOOST_TABLE_ROW_LABELS[row.perk].label}
                  </span>
                </th>
                {row.cells.map((cell, index) => {
                  const column = BOOST_LEVELS[index] ?? 0;
                  return (
                    <td
                      key={column}
                      className={cn(
                        "px-1 py-3 text-center",
                        column === level && CURRENT_COLUMN,
                      )}
                    >
                      <TableCell cell={cell} unlocked={column <= level} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-content-muted text-[11px]">{BOOST_TABLE_NOTE}</p>
    </section>
  );
}

function TableCell({
  cell,
  unlocked,
}: {
  cell: BoostTableCell;
  unlocked: boolean;
}) {
  if (cell.kind === "amount") {
    return (
      <span
        className={cn(
          "tabular-nums",
          unlocked
            ? "text-content font-bold"
            : "text-content-muted font-semibold",
        )}
      >
        {cell.value}
      </span>
    );
  }
  if (!cell.included) {
    return (
      <span className="text-content-subtle">
        <span aria-hidden="true">—</span>
        <span className="sr-only">{BOOST_TABLE_NOT_INCLUDED}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex size-5.5 items-center justify-center rounded-full",
        unlocked
          ? "bg-info text-boost-paper"
          : "bg-surface-input text-content-subtle",
      )}
    >
      <Check size={12} strokeWidth={3} aria-hidden="true" />
      <span className="sr-only">{BOOST_TABLE_INCLUDED}</span>
    </span>
  );
}
