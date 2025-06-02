<template>
  <v-app>
    <CategorySidebar
      :open="categorySidebarOpen"
      :categories="categories"
      @close="categorySidebarOpen = false"
      @add-category="handleAddCategory"
    />

    <Sidebar
      v-if="map"
      v-model:drawer="drawer"
      :map="map"
      @add-poi="handleAddPoi"
      @manage-categories="openCategorySidebar"
    />

    <div class="map-container">
      <MapViewer
        v-if="map"
        :map="map"
        :add-poi-mode="addPoiMode"
        @cancel-poi="exitAddPoiMode"
      />
      <NuxtPage v-else />
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from '~/components/Sidebar.vue'
import MapViewer from '@/components/MapViewer.vue'
import CategorySidebar from '@/components/CategorySidebar.vue'
import axios from 'axios'
import { transformMap, transformCategory } from '@/utils/transform'
import type { MapData } from '@/types/map'
import type { Category } from '@/types/category'

const route = useRoute()
const router = useRouter()
const map = ref<MapData | null>(null)
const addPoiMode = ref(false)
const drawer = ref(true)
const categorySidebarOpen = ref(false)
const categories = ref<Category[]>([])

onMounted(async () => {
  const mapId = route.params.mapId as string
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const { data } = await axios.get(`/api/backend/maps/${mapId}`, { headers })
    map.value = transformMap(data)
    // Récupération des catégories associées à la map
    const { data: catData } = await axios.get(`/api/backend/maps/${mapId}/categories`, { headers })
    categories.value = catData.map(transformCategory)
  } catch (err) {
    console.error('Error fetching map or categories:', err)
    router.push('/access-denied')
  }
})

function handleAddPoi() {
  drawer.value = false
  addPoiMode.value = true
}

function exitAddPoiMode() {
  addPoiMode.value = false
  drawer.value = true
}

function openCategorySidebar() {
  categorySidebarOpen.value = true
}

function handleAddCategory() {
  // À compléter : logique d'ajout de catégorie
  // Par exemple, ouvrir un dialog ou ajouter une catégorie par défaut
  alert('Ajouter une catégorie (à implémenter)')
}
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
