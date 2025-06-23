// Base interface for a POI
export interface BasePOI {
    id?: string
    mapId: string
    name: string
    description?: string
    x: number
    y: number
    categoryId: string
    imageUrl?: string
    thumbnailUrl?: string
    createdAt?: string | Date
    updatedAt?: string | Date
}

// Interface for POIs with user information
export interface POIData extends BasePOI {
    creatorId?: string
    updaterId?: string
    creator?: {
        username: string
    }
    updater?: {
        username: string
    }
    imageFile?: File
}

// Interface for POI forms
export interface POIFormData {
    name: string
    categoryId: string
    description?: string
    imageFile?: File
}

// Type for sending data to the backend
export type POIInput = Omit<POIData, 'imageUrl' | 'thumbnailUrl' | 'id'> & {
    id?: string
}
