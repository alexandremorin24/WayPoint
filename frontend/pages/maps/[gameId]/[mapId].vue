<template>
  <MapViewer v-if="map" :map="map" :add-poi-mode="false" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'
import axios from 'axios'
import MapViewer from '@/components/MapViewer.vue'
import type { MapData } from '@/types/map'

definePageMeta({
  layout: 'map-editor'
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const map = ref<MapData | null>(null)

const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = url
  })
}

onMounted(async () => {
  const mapId = route.params.mapId as string
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const { data } = await axios.get<MapData>(`${config.public.API_BASE}/maps/${mapId}`, { headers })
    const transformed = data

    if (!transformed.imageUrl) {
      throw new Error('imageUrl is empty or invalid')
    }

    if (!transformed.imageWidth || !transformed.imageHeight) {
      const { width, height } = await loadImageDimensions(transformed.imageUrl)
      transformed.imageWidth = width
      transformed.imageHeight = height
      transformed.width = width
      transformed.height = height
    }

    map.value = transformed
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosError = err as import('axios').AxiosError
      const status = axiosError.response?.status
      
      if (status === 401) return router.push('/login')
      if (status === 403) return router.push('/access-denied')
      if (status === 404) return router.push('/not-found')
    }

    console.error('Unexpected error while loading map', err)
  }
})
</script>

<style scoped>
/* No specific styles */
</style>
