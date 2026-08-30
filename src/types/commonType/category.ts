export interface CategoryDto {
  publicId: string;
  name: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface CategoryItemDto {
  publicId: string;
  name: string;
}
