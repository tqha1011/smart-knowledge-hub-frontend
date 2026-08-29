export interface PaginationResponse<T> {
  items: T[];
  totalPages: number;
  currentPages: number;
  pageNumber: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
