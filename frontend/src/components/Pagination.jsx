const PAGE_WINDOW = 1;

function getPageItems(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({ type: "page", value: index + 1 }));
  }

  const items = [{ type: "page", value: 1 }];
  const start = Math.max(2, currentPage - PAGE_WINDOW);
  const end = Math.min(totalPages - 1, currentPage + PAGE_WINDOW);

  if (start > 2) {
    items.push({ type: "ellipsis", key: "left-ellipsis" });
  }

  for (let page = start; page <= end; page += 1) {
    items.push({ type: "page", value: page });
  }

  if (end < totalPages - 1) {
    items.push({ type: "ellipsis", key: "right-ellipsis" });
  }

  items.push({ type: "page", value: totalPages });
  return items;
}

export default function Pagination({ count, currentPage, onPageChange, pageSize = 10 }) {
  const totalPages = Math.ceil((count || 0) / pageSize);
  if (totalPages <= 1) {
    return null;
  }
  const pageItems = getPageItems(totalPages, currentPage);

  return (
    <div className="pagination">
      <button type="button" aria-label="Go to previous page" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
        Prev
      </button>
      {pageItems.map((item) =>
        item.type === "ellipsis" ? (
          <span key={item.key} className="pagination-ellipsis" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={item.value}
            type="button"
            className={item.value === currentPage ? "active" : ""}
            aria-current={item.value === currentPage ? "page" : undefined}
            aria-label={`Go to page ${item.value}`}
            onClick={() => onPageChange(item.value)}
          >
            {item.value}
          </button>
        ),
      )}
      <button type="button" aria-label="Go to next page" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
        Next
      </button>
    </div>
  );
}
