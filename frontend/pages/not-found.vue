<template>
  <v-container class="py-16 text-center">
    <h1 class="text-h4 mb-4">{{ $t('not-found.title') }}</h1>
    <p class="text-body-1 mb-6">
      {{ $t('not-found.message') }}
    </p>
    <NuxtLink to="/">
      <v-btn color="primary" icon="mdi-home">{{ $t('not-found.back-home') }}</v-btn>
    </NuxtLink>
  </v-container>
</template>
