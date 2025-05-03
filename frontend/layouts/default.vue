<template>
    <v-app>
        <v-app-bar color="primary" dark>
            <NuxtLink :to="localePath('/')" class="text-white text-decoration-none">WayPoint</NuxtLink>
            <v-spacer />
            <template v-if="!isLoggedIn">
                <NuxtLink :to="localePath('login')" class="text-white mx-2">{{ $t('common.login') }}</NuxtLink>
                <NuxtLink :to="localePath('register')" class="text-white mx-2">{{ $t('common.register') }}</NuxtLink>
            </template>
            <template v-else>
                <NuxtLink :to="localePath('/maps/create')" class="text-white mx-2">{{ $t('navigation.create') }}</NuxtLink>
                <v-menu>
                    <template #activator="{ props }">
                        <v-btn v-bind="props" color="primary" class="mx-2" variant="elevated">
                            {{ user.displayName || 'Profil' }}
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item :to="localePath('/profil')">
                            <v-list-item-title>{{ $t('navigation.profile') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item :to="localePath('/my-maps')">
                            <v-list-item-title>{{ $t('navigation.map') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="logout">
                            <v-list-item-title>{{ $t('common.logout') }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
        </v-app-bar>
        <v-main>
            <v-container>
                <NuxtPage />
            </v-container>
        </v-main>
        <v-footer app>
            <span>&copy; {{ new Date().getFullYear() }} WayPoint</span>
        </v-footer>
    </v-app>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isLoggedIn = ref(false)
const user = ref({ displayName: '' })

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
