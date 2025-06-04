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
}
