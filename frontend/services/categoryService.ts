import axios from 'axios'
import type { Category } from '@/types/category'

const API_BASE = '/api/backend'

export const categoryService = {
    /**
     * Get all categories for a map
     */
    async getCategoriesByMapId(mapId: string): Promise<Category[]> {
        const token = localStorage.getItem('token')
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const { data } = await axios.get(`${API_BASE}/maps/${mapId}/categories`, { headers })
        return data
    },

    /**
     * Create a new category
     */
    async createCategory(mapId: string, category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
        const token = localStorage.getItem('token')
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const { data } = await axios.post(`${API_BASE}/maps/${mapId}/categories`, category, { headers })
        return data
    },

    /**
     * Update a category
     */
    async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
        const token = localStorage.getItem('token')
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const { data } = await axios.put(`${API_BASE}/categories/${id}`, category, { headers })
        return data
    },

    /**
     * Delete a category
     */
    async deleteCategory(id: string): Promise<void> {
        const token = localStorage.getItem('token')
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        await axios.delete(`${API_BASE}/categories/${id}`, { headers })
    }
} 
