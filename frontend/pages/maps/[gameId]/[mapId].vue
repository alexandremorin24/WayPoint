<template>
  <MapViewer v-if="map" :map="map" :add-poi-mode="false" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import MapViewer from '@/components/MapViewer.vue'
import type { MapData } from '@/types/map'

definePageMeta({
  layout: 'map-editor'
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { t } = useI18n()
const map = ref<MapData | null>(null)

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
      throw new Error(t('map.error.message'))
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
