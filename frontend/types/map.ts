export interface MapData {
    id: string
    name: string
    description?: string
    width: number
    height: number
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
