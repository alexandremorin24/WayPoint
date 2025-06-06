export interface MapData {
    id: string
    name: string
    description?: string
    imageWidth: number
    imageHeight: number
    imageUrl: string
    thumbnailUrl?: string

    gameId: string
    ownerId: string

    isPublic: boolean
    createdAt: string
    updatedAt?: string
    gameName: string
    userRole?: 'owner' | 'viewer' | 'editor_all' | 'editor_own' | 'contributor' | 'banned' | null
}

export interface POIData {
    name: string
    description?: string
    x: number
    y: number
    categoryId: string
    mapId: string
    imageUrl?: string
    thumbnailUrl?: string
}

export interface Category {
    id: string
    name: string
    icon?: string
    color?: string
}
