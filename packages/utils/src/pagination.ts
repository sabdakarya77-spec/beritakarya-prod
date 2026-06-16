/**
 * Shared pagination types and utilities for consistent API responses.
 */

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Parse pagination parameters from query params.
 * Enforces minimum page=1 and maximum limit (default 100).
 */
export function parsePagination(
  params: PaginationParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
) {
  const page = Math.max(1, params.page || defaults.page || 1)
  const maxLimit = defaults.maxLimit ?? 100
  const limit = Math.min(maxLimit, Math.max(1, params.limit || defaults.limit || 20))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * Build a standardized paginated response object.
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
