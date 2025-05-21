<template>
  <div class="map-container">
    <div ref="mapContainer" class="map"/>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import type { Map as LeafletMap, ImageOverlay } from 'leaflet'
import type { MapData } from '@/types/map'

const props = defineProps<{
  map: MapData
}>()

const mapContainer = ref<HTMLElement | null>(null)
let L: typeof import('leaflet')
let leafletMap: LeafletMap | null = null
let _imageOverlay: ImageOverlay | null = null

onMounted(async () => {
  console.log('MapViewer mounted ✅')
  console.log('🔍 props.map =', props.map)

  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  const bounds: [[number, number], [number, number]] = [
    [0, 0],
    [props.map.height, props.map.width]
  ]

  if (!mapContainer.value) return

  leafletMap = L.map(mapContainer.value, {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
  })

  leafletMap.zoomControl.setPosition('topright')
  leafletMap.attributionControl.remove()

  if (!props.map.imageUrl) {
    console.warn('missing imageUrl', props.map)
    return
  }

  _imageOverlay = L.imageOverlay(props.map.imageUrl, bounds).addTo(leafletMap)


  // Display image in real size or adjusted
  leafletMap.fitBounds(bounds, { padding: [10, 10] })
  // Prevent going out of map bounds
  leafletMap.setMaxBounds(bounds)
  // Fix display if container is mounted late
  await nextTick()
  setTimeout(() => leafletMap?.invalidateSize(), 100)
})

onUnmounted(() => {
  leafletMap?.remove()
  leafletMap = null
  _imageOverlay = null
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
  background-color: #000814; 
}
</style>
