<template>
  <!-- Arrow OPENING (desktop closed) -->
  <div
    v-if="!isMobile && !drawerProxy"
    class="toggle-arrow desktop closed"
    @click="drawerProxy = true"
  >
    <v-icon>mdi-chevron-right</v-icon>
  </div>

  <!-- Arrow OPENING (mobile closed) -->
  <div
    v-if="isMobile && !drawerProxy"
    class="toggle-arrow mobile closed"
    @click="drawerProxy = true"
  >
    <v-icon>mdi-chevron-up</v-icon>
  </div>

  <!-- Drawer principal -->
  <v-navigation-drawer
    v-model="drawerProxy"
    :temporary="isMobile"
    :location="isMobile ? 'bottom' : 'left'"
    width="320"
    color="#032040"
    app
    :style="isMobile ? 'max-height: 50vh' : ''"
  >
    <!-- Arrow CLOSING (in drawer) -->
    <div
      v-if="drawerProxy"
      class="drawer-close-btn"
      :class="isMobile ? 'mobile' : 'desktop'"
      @click="drawerProxy = false"
    >
      <v-icon>
        {{ isMobile ? 'mdi-chevron-down' : 'mdi-chevron-left' }}
      </v-icon>
    </div>

    <!-- Contenu -->
    <v-list nav dense>
      <v-list-item>
        <v-list-item-title
          class="text-h4 text-white d-block w-100 text-center text-wrap"
          style="min-width: 180px; max-width: 100%; word-break: break-word; line-height: 1.1;"
        >
          {{ map?.gameName || '...' }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item>
        <v-list-item-title
          class="text-h5 text-white d-block w-100 text-center text-wrap"
          style="min-width: 180px; max-width: 100%; word-break: break-word; line-height: 1.1;"
        >
          {{ map?.name || '...' }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item>
        <v-sheet
          color="#061c36"
          class="mx-2 my-2 pa-3 rounded"
          elevation="0"
          style="border: 1px solid #fff3;"
        >
          <span class="text-white text-center d-block">
            {{ map?.description || '...' }}
          </span>
        </v-sheet>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item link @click="emit('manage-categories')">
        <v-list-item-title class="text-body-1 text-white">{{ $t('sidebar.manageCategories') }}</v-list-item-title>
      </v-list-item>

      <v-list-item link @click="onAddPoi">
        <v-list-item-title class="text-body-1 text-white">{{ $t('sidebar.addPoi') }}</v-list-item-title>
      </v-list-item>

      <v-list-item link @click="emit('manage-collaborators')">
        <v-list-item-title class="text-body-1 text-white">{{ $t('sidebar.manageCollaborators') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import type { MapData } from '@/types/map'

defineOptions({ name: 'AppSidebar' })

const props = defineProps<{
  map: MapData
  drawer: boolean
}>()

const emit = defineEmits<{
  (e: 'update:drawer', value: boolean): void
  (e: 'add-poi' | 'manage-categories' | 'manage-collaborators'): void
}>()

const drawerProxy = computed({
  get: () => props.drawer,
  set: val => emit('update:drawer', val)
})

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

function onAddPoi() {
  drawerProxy.value = false
  emit('add-poi')
}
</script>

<style scoped>
.toggle-arrow {
  position: fixed;
  z-index: 3000;
  background-color: #032040;
  color: white;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

/* 📱 Mobile: bottom right if drawer closed */
.toggle-arrow.mobile.closed {
  bottom: 20px;
  right: 20px;
}

/* 💻 Desktop: top left if drawer closed */
.toggle-arrow.desktop.closed {
  top: 20px;
  left: 0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* 💻 or 📱 : button in drawer */
.drawer-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background-color: #061c36;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
}
</style>
