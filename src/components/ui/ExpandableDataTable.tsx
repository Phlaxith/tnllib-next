"use client";

import { useState, useMemo, Fragment } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";

interface ExpandableDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  isRowExpandable?: (row: Row<T>) => boolean;
  renderExpandedRow?: (row: Row<T>) => React.ReactNode;
}

export default function ExpandableDataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  isRowExpandable,
  renderExpandedRow,
}: ExpandableDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Ajouter une colonne de chevron si des lignes sont expandables
  const enhancedColumns = useMemo(() => {
    if (!isRowExpandable || !renderExpandedRow) return columns;

    const chevronColumn: ColumnDef<T, unknown> = {
      id: "expand",
      header: "",
      size: 32,
      enableSorting: false,
      cell: ({ row }) => {
        const canExpand = isRowExpandable(row);
        if (!canExpand) return null;

        const isExpanded = expandedRows.has(row.id);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRow(row.id);
            }}
            className="p-1 hover:bg-opacity-10 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} style={{ color: "var(--accent)" }} />
            ) : (
              <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
            )}
          </button>
        );
      },
    };

    return [chevronColumn, ...columns];
  }, [columns, isRowExpandable, renderExpandedRow, expandedRows]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-full rounded-lg border px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      />

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "var(--bg-header)" }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--text-muted)",
                        width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1 ${
                            header.column.getCanSort() ? "cursor-pointer select-none hover:text-white" : ""
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <ArrowUpDown size={12} style={{ opacity: header.column.getIsSorted() ? 1 : 0.3 }} />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => {
                const isExpanded = expandedRows.has(row.id);
                const canExpand = isRowExpandable ? isRowExpandable(row) : false;

                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`border-t transition-colors ${
                        canExpand ? "cursor-pointer hover:bg-opacity-5 hover:bg-white" : ""
                      }`}
                      style={{
                        borderColor: "var(--border)",
                        background: idx % 2 === 0 ? "var(--bg-row-even)" : "var(--bg-row-odd)",
                      }}
                      onClick={() => {
                        if (canExpand) toggleRow(row.id);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {/* Expanded row */}
                    {isExpanded && renderExpandedRow && (
                      <tr
                        style={{
                          borderColor: "var(--border)",
                          background: idx % 2 === 0 ? "var(--bg-row-even)" : "var(--bg-row-odd)",
                        }}
                      >
                        <td colSpan={row.getVisibleCells().length} className="border-t" style={{ borderColor: "var(--border)" }}>
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
        {table.getFilteredRowModel().rows.length} result{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}



