"use client";

function safeCellValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "object") {
    const label = value.title || value.name || value.label || value.message || value.tip;
    return label ? String(label) : "-";
  }
  return String(value);
}

export default function DataTable({ columns, rows, emptyText = "No data available.", rowKey = "id" }) {
  return (
    <div className="overflow-hidden rounded-[1.15rem] border border-[#e5e7eb] bg-white p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f8fafc]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border-b border-[#e5e7eb] px-4 py-3 text-left text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#6b7280] ${
                    column.className || ""
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm font-semibold text-[#6b7280]"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row[rowKey] ?? index}
                  className="transition hover:bg-[#f8fafc]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`border-b border-[#eef0f4] px-4 py-3 align-top text-sm text-[#111827] ${
                        column.cellClassName || ""
                      }`}
                    >
                      {column.render ? column.render(row) : safeCellValue(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
