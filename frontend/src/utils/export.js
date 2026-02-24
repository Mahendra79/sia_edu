function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function downloadCsv({ filename, headers, rows }) {
  const headerRow = headers.map((header) => escapeCsv(header.label)).join(",");
  const dataRows = rows.map((row) => headers.map((header) => escapeCsv(row[header.key])).join(","));
  const csvContent = [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function fetchAllPaginated(fetchPage) {
  const pageSize = 100;
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetchPage({ page, page_size: pageSize });
    const payload = response.data;

    if (Array.isArray(payload)) {
      allItems.push(...payload);
      break;
    }

    const pageItems = payload?.results || [];
    const count = Number(payload?.count || pageItems.length);
    allItems.push(...pageItems);

    totalPages = Math.max(1, Math.ceil(count / pageSize));
    if (pageItems.length === 0) {
      break;
    }
    page += 1;
  }

  return allItems;
}
