<template>
    <v-app>
        <v-app-bar color="primary" dark>
            <v-toolbar-title>
                <NuxtLink to="/" class="text-white text-decoration-none">WayPoint</NuxtLink>
            </v-toolbar-title>
            <v-spacer />
            <NuxtLink to="/" class="text-white mx-2">Home</NuxtLink>
            <NuxtLink to="/login" class="text-white mx-2">Login</NuxtLink>
            <NuxtLink to="/register" class="text-white mx-2">Register</NuxtLink>
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
</script>
