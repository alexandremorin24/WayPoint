<template>
  <v-app>
    <Sidebar
      v-if="map"
      v-model:drawer="drawer"
      :map="map"
      @add-poi="handleAddPoi"
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
import axios from 'axios'
import { transformMap } from '@/utils/transform'
import type { MapData } from '@/types/map'

const route = useRoute()
const router = useRouter()
const map = ref<MapData | null>(null)
const addPoiMode = ref(false)
const drawer = ref(true)

onMounted(async () => {
  const mapId = route.params.mapId as string
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const { data } = await axios.get(`/api/backend/maps/${mapId}`, { headers })
    map.value = transformMap(data)
  } catch (err) {
    console.error('Error fetching map data:', err)
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
