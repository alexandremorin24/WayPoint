<template>
    <div class="text-center py-12">
        <h1 class="text-h3 mb-4">Welcome to WayPoint</h1>
        <p class="text-body-1 mb-6">
            Your personal journey tracking companion. Start exploring and sharing your adventures today!
        </p>
        <NuxtLink to="/login">
            <v-btn color="primary" class="mx-2">Login</v-btn>
        </NuxtLink>
        <NuxtLink to="/register">
            <v-btn color="secondary" class="mx-2">Register</v-btn>
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
</script>
