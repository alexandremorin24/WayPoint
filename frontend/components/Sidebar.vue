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

      <v-list-group v-if="canEdit" value="edit-options" :model-value="false" dense class="edit-options-group">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            :title="$t('sidebar.editOptions')"
            class="text-body-1 text-white"
            dense
            :min-height="0"
            prepend-icon="mdi-cog"
          />
        </template>

        <v-list-item
          v-for="(item, i) in editOptions"
          :key="i"
          dense
          link
          :min-height="0"
          @click="item.action"
        >
          <v-list-item-title class="text-body-2 text-white">{{ item.title }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2" />
        
      </v-list-group>
    </v-list>
  </v-navigation-drawer>

  <MapInfoSidebar
    v-if="map"
    :open="mapInfoSidebarOpenProxy"
    :map="map"
    :can-edit="map.userRole === 'owner' || map.userRole === 'editor_all'"
    @close="mapInfoSidebarOpenProxy = false"
    @update:map="onMapUpdate"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import type { MapData } from '@/types/map'
import MapInfoSidebar from './MapInfoSidebar.vue'

defineOptions({ name: 'AppSidebar' })

const props = defineProps<{
  map: MapData
  drawer: boolean
  mapInfoSidebarOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:drawer', value: boolean): void
  (e: 'add-poi' | 'manage-categories' | 'manage-collaborators'): void
  (e: 'update:map', map: MapData): void
  (e: 'close-categories'): void
  (e: 'close-map-info'): void
  (e: 'update:map-info-sidebar-open', value: boolean): void
}>()

const drawerProxy = computed({
  get: () => props.drawer,
  set: val => emit('update:drawer', val)
})

const mapInfoSidebarOpenProxy = computed({
  get: () => props.mapInfoSidebarOpen,
  set: val => emit('update:map-info-sidebar-open', val)
})

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const canEdit = computed(() => {
  return props.map?.userRole === 'owner' || 
         props.map?.userRole === 'editor_all' || 
         props.map?.userRole === 'editor_own' || 
         props.map?.userRole === 'contributor'
})

const canManageCollaborators = computed(() => {
  return props.map?.userRole === 'owner' || 
         props.map?.userRole === 'editor_all'
})

const editOptions = computed(() => {
  const options = [
    {
      title: 'Edit Map Info',
      action: onEditMapInfo
    },
    {
      title: 'Manage Categories',
      action: onManageCategories
    },
    {
      title: 'Add POI',
      action: onAddPoi
    }
  ]

  if (canManageCollaborators.value) {
    options.splice(1, 0, {
      title: 'Manage Collaborators',
      action: () => emit('manage-collaborators')
    })
  }

  return options
})

function onAddPoi() {
  mapInfoSidebarOpenProxy.value = false
  drawerProxy.value = false
  emit('add-poi')
}

function onEditMapInfo() {
  if (mapInfoSidebarOpenProxy.value) {
    mapInfoSidebarOpenProxy.value = false
  } else {
    emit('close-categories')
    mapInfoSidebarOpenProxy.value = true
  }
}

function onManageCategories() {
  emit('close-map-info')
  emit('manage-categories')
}

function onMapUpdate(updatedMap: MapData) {
  emit('update:map', updatedMap)
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
}

.toggle-arrow.mobile.closed {
  bottom: 20px;
  right: 20px;
}

.toggle-arrow.desktop.closed {
  top: 20px;
  left: 0;
}

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

:deep(.edit-options-group .v-list-group__header__append-icon) {
  font-size: 16px;
}
</style>
