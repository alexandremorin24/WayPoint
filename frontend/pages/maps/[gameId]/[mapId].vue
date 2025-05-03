<template>
  <client-only>
    <div v-if="error">
      <MapError :title="error.title" :message="error.message" />
    </div>
    <div v-else-if="map && map.image_url && imageBounds">
      <h1 class="text-h5 mb-2">Map: {{ map.name }}</h1>
      <p>Description: {{ map.description }}</p>
      <MapViewer
        :image-url="backendBase + map.image_url"
        :image-bounds="imageBounds"
        :markers="[]"
      />
    </div>
    <div v-else>Loading...</div>
  </client-only>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import MapError from '~/components/MapError.vue'
const config = useRuntimeConfig()

definePageMeta({ layout: 'map' })

const route = useRoute()
const map = ref<MapData | null>(null)
const imageBounds = ref<[[number, number], [number, number]] | undefined>(undefined)
const backendBase = config.public.API_BASE.replace(/\/api\/backend$/, '')
const error = ref<{ title: string, message: string } | null>(null)

interface MapData {
  id: number;
  name: string;
  description: string;
  image_url: string;
  is_public: boolean;
  owner_id: number;
  game_id: number;
}

onMounted(async () => {
  const mapId = route.params.mapId as string
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${config.public.API_BASE}/maps/${mapId}`, { headers })
  if (!res.ok) {
    if (res.status === 404) {
      error.value = {
        title: 'Map Not Found',
        message: 'The requested map does not exist.'
      }
    } else if (res.status === 403) {
      error.value = {
        title: 'Access Denied',
        message: 'You do not have permission to view this map.'
      }
    } else {
      error.value = {
        title: 'Error',
        message: 'An unexpected error occurred while loading the map.'
      }
    }
    return
  }
  const mapData = await res.json()
  map.value = mapData
  if (!mapData || !mapData.image_url) {
    error.value = {
      title: 'No Image Available',
      message: 'This map does not have a background image.'
    }
    return
  }
  const img = new window.Image()
  img.onload = () => {
    imageBounds.value = [
      [0, 0],
      [img.height, img.width]
    ]
  }
  img.onerror = () => {
    error.value = {
      title: 'Image Not Found',
      message: 'The background image for this map could not be loaded.'
    }
  }
  img.src = `${backendBase}${mapData.image_url}`
})
</script> 
