export interface Category {
    id: string
    mapId: string
    name: string
    icon?: string   // optional custom icon, defaults to 'map-marker'
    color?: string  // optional color, defaults to '#3498db'
    parentCategoryId?: string | null  // reference to parent category
    createdAt?: string
    updatedAt?: string
}

export interface SubCategory {
    id: string
    name: string
    icon?: string   // optional custom icon
    color?: string  // optional color
    parentCategoryId?: string | null
    createdAt?: string
    updatedAt?: string
}
