<template>
  <v-footer color="primary" dark app class="justify-center">
    <v-row class="w-100 text-center">
      <v-col cols="12">
        <span>&copy; {{ new Date().getFullYear() }} WayPoint &mdash; {{ $t('footer.copyright') }}</span>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup lang="ts">
</script> 
