import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { useState } from "react";

export default function DataTable({
  columns,
  data,
  searchable = true,
  exportable = false,
  pageSize = 10,
  emptyMessage = "No records found",
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  let rows = [...data];

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "").toLowerCase().includes(q)
      )
    );
  }

  if (sortKey) {
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    const header = columns.map((c) => c.label).join(",");
    const body = rows
      .map((row) => columns.map((c) => `"${row[c.key] ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="data-table-wrap">
      <div className="data-table-toolbar">
        {searchable && (
          <div className="data-table-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search table"
            />
          </div>
        )}
        {exportable && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
        )}
      </div>

      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  {col.sortable !== false ? (
                    <button type="button" className="data-table-sort" onClick={() => handleSort(col.key)}>
                      {col.label}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">{emptyMessage}</td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > pageSize && (
        <div className="data-table-pagination">
          <span className="text-sm text-muted">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="data-table-pagination-btns">
            <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm">{page} / {totalPages}</span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
