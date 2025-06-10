<template>
  <transition name="slide-panel">
    <div v-if="open && canEdit" class="map-info-panel-fixed">
      <!-- Main map info panel -->
      <v-card class="map-info-sidebar-card" style="overflow-y: auto; min-width: 300px; width: 100%; background: #032040; color: #fff; border-radius: 0 8px 8px 0; border: 1px solid #fff3; border-left: none;">
        <v-card-title class="d-flex align-center justify-space-between text-white font-weight-bold">
          <span>{{ t('sidebar.editMapInfo') }}</span>
          <v-btn icon size="small" @click="closePanel" color="info"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text style="padding-top: 0;">
          <div class="edit-map-form">
            <v-text-field
              v-model="editingMap.name"
              :label="t('sidebar.mapName')"
              dense
              hide-details
              class="mb-2 text-white"
              style="background:#061c36;border-radius:4px;color:#fff;"
            />
            <v-textarea
              v-model="editingMap.description"
              :label="t('sidebar.mapDescription')"
              dense
              hide-details
              class="mb-2 text-white"
              style="background:#061c36;border-radius:4px;color:#fff;"
            />
            <v-switch
              v-model="editingMap.isPublic"
              :label="t('sidebar.isPublic')"
              color="info"
              hide-details
              class="mb-4"
            />
            <!-- Action buttons -->
            <div class="d-flex justify-end mt-4">
              <v-btn class="mr-2" variant="outlined" color="grey" @click="cancelEdit">{{ t('sidebar.cancel') }}</v-btn>
              <v-btn color="secondary" @click="saveMap" :loading="loading">{{ t('sidebar.save') }}</v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </transition>
  <NotificationPopup
    v-model="showNotification"
    :message="notificationMessage"
    :type="notificationType"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MapData } from '@/types/map'
import axios from 'axios'
import NotificationPopup from './NotificationPopup.vue'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  map: MapData
  canEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:map', map: MapData): void
}>()

const loading = ref(false)
const editingMap = ref<MapData>({ ...props.map })

const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'error' | 'success' | 'info'>('error')

function showError(message: string) {
  notificationMessage.value = message
  notificationType.value = 'error'
  showNotification.value = true
}

function showSuccess(message: string) {
  notificationMessage.value = message
  notificationType.value = 'success'
  showNotification.value = true
}

function closePanel() {
  emit('close')
}

function cancelEdit() {
  editingMap.value = { ...props.map }
  closePanel()
}

async function saveMap() {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    // Validate required fields
    if (!editingMap.value.name) {
      showError(t('errors.required'))
      return
    }

    // Validate field lengths
    if (editingMap.value.name.length < 3 || editingMap.value.name.length > 100) {
      showError(t('errors.mapNameLength'))
      return
    }

    if (editingMap.value.description && editingMap.value.description.length > 500) {
      showError(t('errors.descriptionLength'))
      return
    }

    // Ensure isPublic is a boolean
    const dataToSend = {
      ...editingMap.value,
      isPublic: Boolean(editingMap.value.isPublic)
    }

    const { data: updatedMap } = await axios.put(`/api/backend/maps/${props.map.id}`, dataToSend, { headers })
    emit('update:map', updatedMap)
    showSuccess(t('sidebar.mapUpdated'))
    closePanel()
  } catch (error: any) {
    console.error('Error updating map:', error)
    const errorMessage = error.response?.data?.error || t('errors.unknown')
    showError(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Fixed position panel */
.map-info-panel-fixed {
  position: fixed;
  top: 50%;
  left: 320px;
  transform: translateY(-50%);
  z-index: 999;
}

/* Slide panel animation */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
}
.slide-panel-enter-from {
  transform: translateY(-50%) translateX(-100vw);
}
.slide-panel-enter-to {
  transform: translateY(-50%) translateX(0);
}
.slide-panel-leave-from {
  transform: translateY(-50%) translateX(0);
}
.slide-panel-leave-to {
  transform: translateY(-50%) translateX(-100vw);
}

/* Mobile responsive styles */
@media (max-width: 600px) {
  .map-info-panel-fixed {
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    transform: none !important;
    border-radius: 0 !important;
    border-left: none !important;
    z-index: 4000 !important;
  }
  .map-info-panel-fixed .v-card {
    width: 100vw !important;
    border-radius: 0 !important;
    height: 100vh !important;
    min-height: 100vh !important;
    max-height: 100vh !important;
  }
}

@media (min-width: 600px) {
  .map-info-sidebar-card {
    max-width: 300px;
  }
}
</style> 
