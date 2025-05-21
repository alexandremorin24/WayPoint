<template>
  <v-container class="py-16 text-center">
    <h1 class="text-h4 mb-4">{{ $t('access-denied.title') }}</h1>
    <p class="text-body-1 mb-6">
      {{ $t('access-denied.message') }}
    </p>
    <NuxtLink to="/">
      <v-btn color="primary" icon="mdi-home">{{ $t('access-denied.back-home') }}</v-btn>
    </NuxtLink>
  </v-container>
</template>
