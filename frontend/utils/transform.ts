import type { MapData, POI, User, Category } from '@/types'

// 🗺️ ---------- MAP ----------

export type RawMapData = {
    id: string
    name: string
    description?: string
    image_url: string
    thumbnail_url?: string
    width: number
    height: number
    game_id: string
    owner_id: string
    created_at: string
    updated_at?: string
    is_public: boolean
}

export function transformMap(raw: RawMapData): MapData {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        imageUrl: raw.image_url,
        thumbnailUrl: raw.thumbnail_url,
        width: raw.width,
        height: raw.height,
        gameId: raw.game_id,
        ownerId: raw.owner_id,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        isPublic: raw.is_public
    }
}

// 📍 ---------- POI ----------

export type RawPOI = {
    id: string
    map_id: string
    name: string
    description?: string
    x: number
    y: number
    category_id: string
    image_url?: string
    created_at: string
    updated_at?: string
}

export function transformPOI(raw: RawPOI): POI {
    return {
        id: raw.id,
        mapId: raw.map_id,
        name: raw.name,
        description: raw.description,
        x: raw.x,
        y: raw.y,
        categoryId: raw.category_id,
        imageUrl: raw.image_url,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at
    }
}

// 👤 ---------- USER ----------

export type RawUser = {
    id: string
    email: string
    display_name: string
    photo_url?: string
    created_at: string
    updated_at?: string
}

export function transformUser(raw: RawUser): User {
    return {
        id: raw.id,
        email: raw.email,
        displayName: raw.display_name,
        photoUrl: raw.photo_url,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at
    }
}

// 🏷️ ---------- CATEGORY (optionnel) ----------

export type RawCategory = {
    id: string
    name: string
    color?: string
    icon?: string
}

export function transformCategory(raw: RawCategory): Category {
    return {
        id: raw.id,
        name: raw.name,
        color: raw.color,
        icon: raw.icon
    }
}
