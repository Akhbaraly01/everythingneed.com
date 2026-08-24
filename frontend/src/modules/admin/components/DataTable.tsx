import { type ReactNode, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@shared/ui/table";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import { Skeleton } from "@shared/ui/skeleton";
import {
  ChevronUp, ChevronDown, ChevronsUpDown, Search, Download,
  FileText, ChevronLeft, ChevronRight, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface BulkAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (ids: string[]) => void;
  variant?: "default" | "destructive";
}

interface PaginationConfig {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface ExportOptions {
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  onSort?: (key: string, dir: "asc" | "desc") => void;
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  bulkActions?: BulkAction<T>[];
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterSlot?: ReactNode;
  emptyState?: ReactNode;
  exportOptions?: ExportOptions;
  rowKey?: string;
  className?: string;
}

const SKELETON_ROWS = 6;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  onSort,
  pagination,
  onRowClick,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  bulkActions = [],
  searchValue,
  onSearchChange,
  filterSlot,
  emptyState,
  exportOptions,
  rowKey = "id",
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && !allSelected;

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.perPage)
    : 1;

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 text-violet-400" />
      : <ChevronDown className="w-3.5 h-3.5 text-violet-400" />;
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-sm bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500"
            />
          </div>
        )}
        {filterSlot}
        <div className="ml-auto flex items-center gap-2">
          {exportOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                {exportOptions.onExportCsv && (
                  <DropdownMenuItem onClick={exportOptions.onExportCsv} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100 text-xs">
                    <FileText className="w-3.5 h-3.5 mr-2" /> Export CSV
                  </DropdownMenuItem>
                )}
                {exportOptions.onExportPdf && (
                  <DropdownMenuItem onClick={exportOptions.onExportPdf} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100 text-xs">
                    <FileText className="w-3.5 h-3.5 mr-2" /> Export PDF
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedRows.length > 0 && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/25 rounded-xl text-sm">
          <span className="text-violet-400 font-medium">{selectedRows.length} selected</span>
          <div className="ml-auto flex gap-2">
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant={action.variant === "destructive" ? "destructive" : "outline"}
                onClick={() => action.onClick(selectedRows)}
                className={cn("h-7 text-xs", action.variant !== "destructive" && "border-slate-600 text-slate-300 hover:bg-slate-700")}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-700/60 overflow-hidden bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700/60 hover:bg-transparent">
              {onSelectRow && (
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all rows"
                    className="border-slate-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "text-slate-400 text-xs font-semibold uppercase tracking-wider",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.sortable && "cursor-pointer select-none hover:text-slate-200"
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                >
                  <div className={cn("flex items-center gap-1", col.align === "center" && "justify-center", col.align === "right" && "justify-end")}>
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="border-slate-700/40">
                  {onSelectRow && (
                    <TableCell className="pl-4"><Skeleton className="h-4 w-4 bg-slate-700/50" /></TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full max-w-[120px] bg-slate-700/50" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="border-slate-700/40 hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (onSelectRow ? 1 : 0)}
                  className="h-48 text-center"
                >
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <MoreHorizontal className="w-8 h-8" />
                      <p className="text-sm font-medium">No records found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => {
                const id = String(row[rowKey] ?? i);
                const isSelected = selectedRows.includes(id);
                return (
                  <TableRow
                    key={id}
                    className={cn(
                      "border-slate-700/40 transition-colors",
                      isSelected && "bg-violet-500/5",
                      onRowClick && "cursor-pointer hover:bg-slate-800/40"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectRow && (
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onSelectRow(id)}
                          aria-label={`Select row ${id}`}
                          className="border-slate-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "text-slate-300 text-sm py-3",
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right"
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : String(row[col.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing {((pagination.page - 1) * pagination.perPage) + 1}–
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of{" "}
            {pagination.total.toLocaleString()} results
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if (pagination.page <= 3) page = i + 1;
                else if (pagination.page >= totalPages - 2) page = totalPages - 4 + i;
                else page = pagination.page - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "w-7 h-7 text-xs",
                    pagination.page === page
                      ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                      : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                  onClick={() => pagination.onPageChange(page)}
                  aria-label={`Page ${page}`}
                  aria-current={pagination.page === page ? "page" : undefined}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="w-7 h-7 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
