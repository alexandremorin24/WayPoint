<template>
  <client-only>
    <div v-if="error">
      <MapError :title="error.title" :message="error.message" />
    </div>
    <div v-else-if="map && map.image_url && imageBounds">
      <h1 class="text-h5 mb-2">{{ $t('mapDetails.title') }} {{ map.name }}</h1>
      <p>{{ $t('mapDetails.description') }} {{ map.description }}</p>
      <MapViewer
        :image-url="backendBase + map.image_url"
        :image-bounds="imageBounds"
        :markers="[]"
      />
    </div>
    <div v-else>{{ $t('mapDetails.loading') }}</div>
  </client-only>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import MapError from '~/components/MapError.vue'
const config = useRuntimeConfig()
const { t } = useI18n()

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
        title: t('mapDetails.notFoundTitle'),
        message: t('mapDetails.notFoundMsg')
      }
    } else if (res.status === 403) {
      error.value = {
        title: t('mapDetails.accessDeniedTitle'),
        message: t('mapDetails.accessDeniedMsg')
      }
    } else {
      error.value = {
        title: t('mapDetails.errorTitle'),
        message: t('mapDetails.errorMsg')
      }
    }
    return
  }
  const mapData = await res.json()
  map.value = mapData
  if (!mapData || !mapData.image_url) {
    error.value = {
      title: t('mapDetails.noImageTitle'),
      message: t('mapDetails.noImageMsg')
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
      title: t('mapDetails.imageNotFoundTitle'),
      message: t('mapDetails.imageNotFoundMsg')
    }
  }
  img.src = `${backendBase}${mapData.image_url}`
})
</script> 
