<template>
  <div class="error-container">
    <v-alert type="error" class="ma-8" border="start" prominent>
      <h2 class="text-h6 mb-2">{{ title }}</h2>
      <div>{{ message }}</div>
    </v-alert>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string, message: string }>()
</script>

<style scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
</style> 
