import type { LatLng } from 'leaflet'
import type { POIData, POIFormData } from './poi'

// User role types
export type UserRole = 'owner' | 'editor_all' | 'editor_own' | 'viewer' | 'contributor' | 'banned'

// Main interface for a map
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
    createdAt?: Date
    updatedAt?: Date
    gameName: string
    userRole?: UserRole | null
}

// Interface for map markers
export interface MapMarker {
    id: string
    latlng: LatLng
    category: string
    marker?: L.Marker
}

// Interface for user permissions
export interface UserRoleData {
    role: UserRole
    userId: string
}

// Interface for POI categories
export interface Category {
    id: string
    name: string
    icon: string
    color?: string
}

// Re-export required POI types
export type { POIData, POIFormData }
