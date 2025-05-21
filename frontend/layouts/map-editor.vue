<template>
  <v-app>
    <Sidebar :drawer="drawer" />
    <v-main class="fill-height pa-0">
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

const drawer = ref(true)
</script>

<style scoped>
html, body, #__nuxt {
  height: 100%;
  margin: 0;
}
</style>
