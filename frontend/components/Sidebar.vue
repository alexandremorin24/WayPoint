<template>
  <ClientOnly>
    <v-navigation-drawer
      color="deep-purple accent-4"
      dark
      app
      permanent
      :model-value="drawer"
      @update:model-value="emit('update:drawer', $event)"
    >
      <v-list nav density="compact">
        <v-list-item>
          <v-list-item-title class="text-h6 text-white">{{ $t('sidebar.menu') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />

        <v-list-item>
          <v-btn icon color="white" @click="emit('update:drawer', !drawer)">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </ClientOnly>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppSidebar' })

const _props = defineProps<{
  drawer: boolean
}>()

const emit = defineEmits<{
  (event: 'update:drawer', value: boolean): void
}>()
</script>
