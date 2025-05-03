<template>
  <v-container>
    <h1 class="text-h4 mb-4">Interactive Map</h1>
    
    <!-- Example with custom image -->
    <v-card class="pa-4 mb-4">
      <h2 class="text-h6 mb-2">Map with custom image</h2>
      <MapViewer
        :image-url="imageUrl"
        :image-bounds="imageBounds"
        :markers="markers"
      />
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
// Example with custom image
const imageUrl = '/images/map-background.jpg' // Replace with your image URL
const imageBounds: [[number, number], [number, number]] = [
  [0, 0],    // Northwest point
  [1000, 1000] // Southeast point (adjust according to your image size)
]

const markers = [
  {
    position: [500, 500] as [number, number],
    popup: 'Center point'
  }
]
</script> 
