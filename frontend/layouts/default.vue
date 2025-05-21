<template>
  <v-app>
    <Header v-if="showLayoutParts" class="fixed-header" @logout="logout" />
    <v-main :class="mainContentClass">
      <NuxtPage />
    </v-main>
    <Footer v-if="showLayoutParts" class="fixed-footer" />
  </v-app>
</template>

<script setup lang="ts">
import Header from '~/components/AppHeader.vue'
import Footer from '~/components/AppFooter.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const localePath = useLocalePath()

const showLayoutParts = computed(() => {
  const hidden = /^\/maps\/[^/]+$/
  return !hidden.test(route.path)
})

const mainContentClass = computed(() => {
  return showLayoutParts.value ? 'main-content' : ''
})

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
.fixed-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  z-index: 100;
}
.main-content {
  padding-top: 64px;
  padding-bottom: 32px;
}
</style>
