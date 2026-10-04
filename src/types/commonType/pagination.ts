export interface PaginationResponse<T> {
  items: T[];
  totalPages: number;
  currentPages: number;
  pageNumber: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Document search uses the singular currentPage in its response contract.
export interface SearchPaginationResponse<T> extends Omit<
  PaginationResponse<T>,
  "currentPages"
> {
  currentPage: number;
}
