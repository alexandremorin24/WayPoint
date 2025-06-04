<template>
  <v-app>
    <Header class="fixed-header" @logout="logout" />
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import Header from '~/components/AppHeader.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const localePath = useLocalePath()

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = localePath('login')
}
</script>

<style scoped>
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 100;
}
</style> 
