import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Search, Filter, Download, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";

export function DataTable({
  columns,
  data,
  emptyDescription,
  emptyTitle,
  isLoading,
  onRowClick,
  pagination,
  rowKey,
  toolbar,
  searchable = true,
  filterable = false,
  filters = [],
  onFilterChange,
  downloadable = false,
  onDownload,
  actions = [],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter data based on search query
  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return columns.some((col) => {
      const value = row[col.key];
      return value && String(value).toLowerCase().includes(searchLower);
    });
  });

  // Apply additional filters
  const finalData = activeFilters
    ? filteredData.filter((row) => {
        return Object.entries(activeFilters).every(([key, value]) => {
          if (!value) return true;
          const rowValue = row[key];
          if (Array.isArray(value)) {
            return value.includes(rowValue);
          }
          return String(rowValue) === String(value);
        });
      })
    : filteredData;

  function handleFilterChange(key, value) {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  }

  function clearFilters() {
    setActiveFilters({});
    setSearchQuery("");
    onFilterChange?.({});
  }

  const hasActiveFilters = Object.values(activeFilters).some((v) => v && v.length > 0);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton className="h-14 w-full" key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length && !isLoading) {
    return (
      <div className="w-full">
        <EmptyState description={emptyDescription} title={emptyTitle} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca..."
              type="text"
              value={searchQuery}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {filterable && filters.length > 0 && (
            <button
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20",
                showFilters && "bg-muted"
              )}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtri
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {Object.keys(activeFilters).length}
                </span>
              )}
            </button>
          )}

          {downloadable && (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}

          {actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                  key={action.key}
                  onClick={() => action.onClick?.()}
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {filterable && showFilters && filters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-lg border bg-card shadow-sm">
          {filters.map((filter) => (
            <div className="flex flex-col gap-1.5" key={filter.key}>
              <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                value={activeFilters[filter.key] || ""}
              >
                <option value="">Tutti</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 mb-2"
                onClick={clearFilters}
              >
                Pulisci filtri
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        <span>
          {finalData.length} {finalData.length === 1 ? "risultato" : "risultati"}
          {searchQuery && ` per "${searchQuery}"`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {toolbar ? <div className="p-4 border-b">{toolbar}</div> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase">
              <tr>
                {columns.map((column) => (
                  <th className="px-4 py-3 font-medium whitespace-nowrap" key={column.key}>
                    {column.header}
                  </th>
                ))}
                {actions.length > 0 && <th className="px-4 py-3 font-medium text-right w-16">Azioni</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {finalData.map((row, rowIndex) => (
                <tr
                  className={cn(
                    "group hover:bg-muted/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  key={rowKey(row) || rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td className="px-4 py-3" key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left group/menu">
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full z-10 mt-1 hidden w-48 rounded-md border bg-card p-1 shadow-md group-hover/menu:block">
                          {actions.map((action) => (
                            <button
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                              key={action.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick?.(row);
                              }}
                            >
                              {action.icon && <action.icon className="h-4 w-4" />}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination ? <div className="p-4 border-t bg-muted/20">{pagination}</div> : null}
      </div>
    </div>
  );
}
