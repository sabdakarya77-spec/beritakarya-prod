export interface Category {
  id: string
  name: string
  slug: string
  siteId?: string | null
  isGlobal?: boolean
  parentId?: string | null
  order?: number
  /**
   * @deprecated Use name-based color derivation instead.
   */
  color?: string | null
  description?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
  parent?: Category | null
  subCategories?: Category[]
}

export interface CategoryCreateInput {
  name: string
  slug: string
  siteId?: string | null
  parentId?: string | null
  order?: number
  /**
   * @deprecated Color will be derived from name
   */
  color?: string | null
  description?: string
}

export interface CategoryUpdateInput {
  name?: string
  slug?: string
  siteId?: string | null
  parentId?: string | null
  order?: number
  /**
   * @deprecated Color will be derived from name
   */
  color?: string | null
  description?: string
}