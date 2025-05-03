<template>
  <div class="map-container">
    <div ref="mapContainer" class="map"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    popup?: string
  }>
  imageUrl?: string
  imageBounds?: [[number, number], [number, number]] // [[north-west], [south-east]]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let imageOverlay: L.ImageOverlay | null = null

// Function to initialize the map
const initMap = () => {
  if (!mapContainer.value) return
  // Only initialize if imageUrl and imageBounds are provided
  if (!(props.imageUrl && props.imageBounds)) return

  // Initialize the map
  map = L.map(mapContainer.value, {
    crs: L.CRS.Simple, // Use a simple coordinate system for images
    minZoom: -2,
    maxBounds: props.imageBounds,
    maxBoundsViscosity: 1.0
  })

  // Move the zoom control to the top right
  map.zoomControl.setPosition('topright')
  map.attributionControl.remove()

  // Use the provided image as the background
  imageOverlay = L.imageOverlay(props.imageUrl, props.imageBounds).addTo(map)
  map.fitBounds(props.imageBounds)
  // Prevent moving out of the image
  map.setMaxBounds(props.imageBounds)
  map.setMinZoom(map.getBoundsZoom(props.imageBounds, false))

  // Add markers if present
  if (props.markers) {
    props.markers.forEach(marker => {
      const markerInstance = L.marker(marker.position).addTo(map!)
      if (marker.popup) {
        markerInstance.bindPopup(marker.popup)
      }
    })
  }
}

// Watch for changes in the image
watch(() => props.imageUrl, (newUrl) => {
  if (map && newUrl && props.imageBounds) {
    if (imageOverlay) {
      imageOverlay.remove()
    }
    imageOverlay = L.imageOverlay(newUrl, props.imageBounds).addTo(map)
    map.fitBounds(props.imageBounds)
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  if (imageOverlay) {
    imageOverlay = null
  }
})
</script>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  min-width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 0;
}
</style> 
