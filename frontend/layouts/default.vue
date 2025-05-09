<template>
    <v-app>
        <Header class="fixed-header" />
        <v-main class="main-content">
            <NuxtPage />
        </v-main>
        <Footer class="fixed-footer" />
    </v-app>
</template>

<script setup lang="ts">
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'
const localePath = useLocalePath()
const { t } = useI18n()
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'

const isLoggedIn = ref(false)
const user = ref({ displayName: '' })

const route = useRoute()
const isHome = computed(() => route.path === '/' || route.path === '/en' || route.path === '/fr')

function updateUserFromStorage() {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    isLoggedIn.value = !!token
    if (userData) {
        try {
            user.value = JSON.parse(userData)
        } catch {
            user.value = { displayName: '' }
        }
    } else {
        user.value = { displayName: '' }
    }
}

onMounted(() => {
    updateUserFromStorage()
    window.addEventListener('storage', updateUserFromStorage)
})

onBeforeUnmount(() => {
    window.removeEventListener('storage', updateUserFromStorage)
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
  padding-top: 64px; /* hauteur du header */
  padding-bottom: 32px; /* hauteur du footer */
}
</style>
