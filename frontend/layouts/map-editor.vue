<template>
  <v-app>
    <CategorySidebar
      v-if="map?.id"
      :open="categorySidebarOpen"
      :categories="categories"
      :map-id="map.id"
      :can-edit="map.userRole === 'owner' || map.userRole === 'editor_all' || map.userRole === 'editor_own'"
      @close="categorySidebarOpen = false"
      @update:categories="categories = $event"
    />

    <Sidebar
      v-if="map"
      v-model:drawer="drawer"
      :map="map"
      v-model:map-info-sidebar-open="mapInfoSidebarOpen"
      @add-poi="handleAddPoi"
      @manage-categories="openCategorySidebar"
      @update:map="updateMap"
      @close-categories="categorySidebarOpen = false"
      @close-map-info="mapInfoSidebarOpen = false"
    />

    <v-main class="pa-0">
      <div class="map-container">
        <MapViewer
          v-if="map"
          :map="map"
          :add-poi-mode="addPoiMode"
          :categories="categories"
          :can-edit="map.userRole === 'owner' || map.userRole === 'editor_all' || map.userRole === 'editor_own'"
          @cancel-poi="exitAddPoiMode"
        />
        <NuxtPage v-else />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '~/components/Sidebar.vue'
import MapViewer from '@/components/MapViewer.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
import axios from 'axios'
import type { MapData } from '@/types/map'
import type { Category } from '@/types/category'

const route = useRoute()
const router = useRouter()
const map = ref<MapData | null>(null)
const addPoiMode = ref(false)
const drawer = ref(true)
const categorySidebarOpen = ref(false)
const mapInfoSidebarOpen = ref(false)
const categories = ref<Category[]>([])

function canAccessMap(mapData: MapData, token: string | null): boolean {
  // If user is banned, access denied (regardless of map being public or private)
  if (mapData.userRole === 'banned') {
    return false
  }

  // If map is public, access granted
  if (mapData.isPublic) {
    return true
  }

  // If map is private, check token and roles
  if (!token) {
    return false
  }

  // Check valid roles for private maps
  const validRoles = ['owner', 'viewer', 'editor_all', 'editor_own', 'contributor']
  return mapData.userRole ? validRoles.includes(mapData.userRole) : false
}

onMounted(async () => {
  const mapId = route.params.mapId as string
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const { data } = await axios.get(`/api/backend/maps/${mapId}`, { headers })
    
    if (!canAccessMap(data, token)) {
      router.push('/access-denied')
      return
    }

    map.value = data
    // Get categories associated with the map
    const { data: catData } = await axios.get(`/api/backend/maps/${mapId}/categories`, { headers })
    categories.value = catData
  } catch (err) {
    console.error('Error fetching map or categories:', err)
    router.push('/access-denied')
  }
})

function handleAddPoi() {
  drawer.value = false
  categorySidebarOpen.value = false
  addPoiMode.value = true
}

function exitAddPoiMode() {
  addPoiMode.value = false
  drawer.value = true
}

function openCategorySidebar() {
  categorySidebarOpen.value = true
}

function updateMap(updatedMap: MapData) {
  map.value = updatedMap
}

watch(drawer, (opened) => {
  if (opened) addPoiMode.value = false
  else categorySidebarOpen.value = false
})
</script>

<style scoped>
html, body, #__nuxt {
  height: 100%;
  margin: 0;
}

.map-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}
</style>
