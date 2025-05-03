<template>
    <div class="text-center py-12">
        <h1 class="text-h3 mb-4">{{ $t('home.welcome') }}</h1>
        <p class="text-body-1 mb-6">
            {{ $t('home.description') }}
        </p>
        <NuxtLink :to="localePath('login')">
            <v-btn color="primary" class="mx-2">{{ $t('common.login') }}</v-btn>
        </NuxtLink>
        <NuxtLink :to="localePath('register')">
            <v-btn color="secondary" class="mx-2">{{ $t('common.register') }}</v-btn>
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>
