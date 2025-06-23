import axios from 'axios'
import type { POIData } from '@/types/poi'

// Utility function to get authentication headers
function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export const poiService = {
    // Get all POIs for a map
    async getPois(mapId: string) {
        const { data } = await axios.get(`/api/backend/pois/map/${mapId}`, {
            headers: getAuthHeaders()
        })
        return data
    },

    // Create a new POI
    async createPoi(mapId: string, poiData: POIData) {
        const { data } = await axios.post(`/api/backend/pois/map/${mapId}`, poiData, {
            headers: getAuthHeaders()
        })
        return data
    },

    // Update a POI
    async updatePoi(poiId: string, poiData: Partial<POIData>) {
        const { data } = await axios.put(`/api/backend/pois/${poiId}`, poiData, {
            headers: getAuthHeaders()
        })
        return data
    },

    // Delete a POI
    async deletePoi(poiId: string) {
        await axios.delete(`/api/backend/pois/${poiId}`, {
            headers: getAuthHeaders()
        })
    },

    // Upload image for a POI
    async uploadImage(mapId: string, imageFile: File) {
        const formData = new FormData()
        formData.append('image', imageFile)
        const { data } = await axios.post(`/api/backend/pois/map/${mapId}/image`, formData, {
            headers: getAuthHeaders()
        })
        return data
    },

    // Check user permissions
    async checkPermissions(mapId: string) {
        try {
            const { data } = await axios.get(`/api/backend/maps/${mapId}/role`, {
                headers: getAuthHeaders()
            })
            return data
        } catch (error) {
            console.error('Error checking permissions:', error)
            return null
        }
    }
} 
