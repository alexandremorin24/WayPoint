<template>
  <div class="map-container">
    <div ref="mapContainer" class="map" />

    <div v-if="showClickMessage" class="click-message">
      {{ $t('map.clickToAddPoi') }}
    </div>

    <MobilePoiForm
      v-if="isMobile && showMobileForm"
      :categories="categories"
      :loading="isLoading"
      :show-mobile-form="showMobileForm"
      @cancel="cancelAddPoi"
      @save="handleMobileSave"
      @category-change="updateTempMarker"
    />

    <NotificationSystem ref="notificationSystemRef" />

    <!-- Add confirmation dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card class="delete-dialog" style="background:#002040;color:#fff;">
        <v-card-title class="text-h5" style="color:#fff;">
          {{ $t('poi.confirmDelete') }}
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="#335"
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="#FFD600"
            variant="text"
            @click="confirmDelete"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import type { Map as LeafletMap, ImageOverlay, LatLng, Popup } from 'leaflet'
import type { 
  MapData, 
  MapMarker,
  UserRoleData 
} from '@/types/map'
import type { Category } from '@/types/category'
import type { POIData, POIFormData, POIInput } from '@/types/poi'
import axios from 'axios'
import MobilePoiForm from './MobilePoiForm.vue'
import NotificationSystem from './NotificationSystem.vue'
import { poiService } from '@/services/poiService'

// Import utilities
import { 
  createMarkerIcon, 
  createTempMarker, 
  centerMobileMarker, 
  createMarkerManager,
  type MarkerManager 
} from '@/utils/markerUtils'
import {
  createPoiPopupTemplate,
  createPopup,
  createPopupManager,
  type PopupManager,
  POPUP_CONFIG
} from '@/utils/popupUtils'
import {
  preparePOIData,
  validatePOIData,
  getFormData,
  handlePoiSave
} from '@/utils/poiUtils'
import {
  handleError,
  withLoadingAction
} from '@/utils/errorUtils'
import {
  initializeMap,
  setupMapClickHandler,
  updateMapCursor
} from '@/utils/mapUtils'
import {
  cleanupMapElements,
  type CleanupOptions
} from '@/utils/cleanupUtils'

const props = defineProps<{
  map: MapData
  addPoiMode: boolean
  categories?: Category[]
  visibleCategories?: string[]
}>()

const emit = defineEmits<{
  (e: 'cancel-poi'): void
  (e: 'show-sidebar'): void
  (e: 'update:visible-categories', categories: string[]): void
}>()

interface POI extends MapMarker {
  marker?: any;
}

const pois = ref<POI[]>([])
const categories = ref<Category[]>([])

// Leaflet
const mapContainer = ref<HTMLElement | null>(null)
let L: typeof import('leaflet')
let leafletMap: LeafletMap | null = null
let _imageOverlay: ImageOverlay | null = null
let popupRef: Popup | null = null

// State
const isMobile = computed(() => useDisplay().mobile.value)
const { t, locale } = useI18n()
const isLoading = ref(false)
const showClickMessage = ref(false)
const showMobileForm = ref(false)
const selectedLatLng = ref<LatLng | null>(null)
const tempMarker = ref<any | null>(null)

// Add refs for deletion dialog
const showDeleteDialog = ref(false)
const poiToDelete = ref<string | null>(null)

// Replace global variable with a ref
const markerManager = ref<MarkerManager | null>(null)
const popupManager = ref<PopupManager | null>(null)

// Replace NotificationManager creation with a reference to NotificationSystem
const notificationSystemRef = ref<InstanceType<typeof NotificationSystem> | null>(null)

// Utility function to clean up map elements
function cleanupElements(options: CleanupOptions = { popup: true, marker: true, resetClickMessage: true }) {
  cleanupMapElements(
    {
      popupRef,
      tempMarker: tempMarker.value,
      showClickMessage
    },
    options
  )
}

function cancelAddPoi() {
  emit('cancel-poi')
  emit('show-sidebar')
  showMobileForm.value = false
  selectedLatLng.value = null
  cleanupElements()
}

// Utility functions for marker management
function handleMarkerAdd(poi: POIData) {
  if (!markerManager.value || !poi.id) {
    console.error('Cannot add marker: marker manager not initialized or POI has no ID')
    return null
  }

  // Find the category of the POI
  const category = categories.value.find(cat => cat.id === poi.categoryId)
  
  // Create and add the marker
  const marker = markerManager.value.createMarker(poi, category || null)
  if (!marker) {
    return null
  }

  const markerData = {
    latlng: marker.getLatLng(),
    marker
  }

  // Add the POI to the local list
  pois.value.push({
    id: poi.id,
    latlng: markerData.latlng,
    category: poi.categoryId,
    marker: markerData.marker
  })

  return markerData
}

async function handleEditPOI(poi: POIData) {
  if (!leafletMap || !poi.id) return

  cleanupElements()
  const poiLatLng = L.latLng(poi.y, poi.x)
  handlePoiForm(poi, poiLatLng, () => updatePOI(poi.id!))
}

async function handleDeletePOI(poiId: string) {
  poiToDelete.value = poiId
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!poiToDelete.value || !notificationSystemRef.value) return

  try {
    await poiService.deletePoi(poiToDelete.value)
    removePoiMarker(poiToDelete.value)
    notificationSystemRef.value.showSuccess(t('poi.deleteSuccess'))
  } catch (error: any) {
    handleError(error, 'poi.error.delete', t, notificationSystemRef.value)
  } finally {
    showDeleteDialog.value = false
    poiToDelete.value = null
  }
}

function removePoiMarker(poiId: string) {
  const poiIndex = pois.value.findIndex(p => p.id === poiId)
  if (poiIndex !== -1 && markerManager.value) {
    const poi = pois.value[poiIndex]
    if (poi.marker) {
      markerManager.value.removeMarker(poi.marker)
      pois.value.splice(poiIndex, 1)
    }
  }
}

async function savePOI() {
  if (!popupRef || !leafletMap) return

  const latlng = popupRef.getLatLng()
  if (!latlng) return

  const form = popupRef.getElement()?.querySelector('.poi-form')
  if (!form) return

  await withLoadingAction(
    async () => {
      const formData = getFormData(form)
      const poiData = preparePOIData({
        formData,
        coordinates: { lng: latlng.lng, lat: latlng.lat },
        mapId: props.map.id
      })

      const poi = await handlePoiSave(poiData, t)
      const markerData = handleMarkerAdd(poi)
      if (!markerData) {
        return null
      }

      return markerData
    },
    {
      showSuccess: true,
      successMessage: 'poi.success.save',
      errorKey: 'poi.error.save',
      cleanup: true,
      showSidebar: true
    },
    t,
    notificationSystemRef.value,
    isLoading,
    () => cleanupElements(),
    () => emit('show-sidebar')
  )
}

async function updatePOI(poiId: string) {
  if (!popupRef || !leafletMap || !markerManager.value) return

  const latlng = popupRef.getLatLng()
  if (!latlng) return

  const form = popupRef.getElement()?.querySelector('.poi-form')
  if (!form) return

  await withLoadingAction(
    async () => {
      const formData = getFormData(form)
      const poiData = preparePOIData({
        formData,
        coordinates: { lng: latlng.lng, lat: latlng.lat },
        id: poiId,
        mapId: props.map.id
      })

      const updatedPOI = await handlePoiSave(poiData as POIData, t)

      // Find the category of the POI
      const category = categories.value.find(cat => cat.id === updatedPOI.categoryId)
      if (!category) {
        throw new Error('Category not found')
      }

      // Update the marker
      const poiIndex = pois.value.findIndex(p => p.id === poiId)
      if (poiIndex !== -1 && markerManager.value) {
        const poi = pois.value[poiIndex]
        if (poi.marker) {
          cleanupElements({ popup: true, marker: false, resetClickMessage: false })
          markerManager.value.updateMarker(poi.marker, updatedPOI, category)
        }
      }

      return updatedPOI
    },
    {
      showSuccess: true,
      successMessage: 'poi.success.save',
      errorKey: 'poi.error.update',
      cleanup: false,
      showSidebar: true
    },
    t,
    notificationSystemRef.value,
    isLoading,
    () => cleanupElements(),
    () => emit('show-sidebar')
  )
}

async function handleMobileSave(formData: any) {
  if (!selectedLatLng.value || !leafletMap) return

  await withLoadingAction(
    async () => {
      const poiData = preparePOIData({
        formData: {
          name: formData.name,
          categoryId: formData.categoryId,
          description: formData.description,
          imageFile: formData.imageFile
        },
        coordinates: { 
          lng: selectedLatLng.value!.lng, 
          lat: selectedLatLng.value!.lat 
        },
        mapId: props.map.id
      })

      const poi = await handlePoiSave(poiData, t)
      const markerData = handleMarkerAdd(poi)
      if (!markerData) {
        return null
      }

      showMobileForm.value = false
      selectedLatLng.value = null
      return markerData
    },
    {
      showSuccess: true,
      successMessage: 'poi.success.save',
      errorKey: 'poi.error.save',
      cleanup: true,
      showSidebar: true
    },
    t,
    notificationSystemRef.value,
    isLoading,
    () => cleanupElements(),
    () => emit('show-sidebar')
  )
}

function updateTempMarker(category: Category) {
  if (!tempMarker.value || !leafletMap) return

  // Update the marker icon
  const icon = createMarkerIcon(L, category)

  // Update the marker with the new icon
  const latlng = tempMarker.value.getLatLng()
  tempMarker.value.remove()
  tempMarker.value = L.marker(latlng, { icon }).addTo(leafletMap)
}

function handlePoiForm(poi: POIData | null, latlng: LatLng, onSave: () => void) {
  if (!popupManager.value) return

  if (isMobile.value) {
    selectedLatLng.value = latlng
    showMobileForm.value = true

    // Create a temporary marker with the POI's category if editing
    const category = poi ? categories.value.find(cat => cat.id === poi.categoryId) : null
    tempMarker.value = createTempMarker(L, leafletMap!, latlng, category)
    if (tempMarker.value) {
      centerMobileMarker(leafletMap!, latlng)
    }
  } else {
    // Create popup content for desktop
    const popupContent = popupManager.value.createFormPopup(poi, categories.value)
    popupRef = createPopup(L, popupContent, latlng)
    
    if (leafletMap) {
      popupRef.addTo(leafletMap)
    }

    // Handle popup events
    const popupElement = popupRef.getElement()
    if (popupElement) {
      popupManager.value.setupFormEvents(popupElement, onSave, () => {
        cancelAddPoi()
      })
    }
  }
}

// Update the visibility of the markers of a category
function updateMarkersVisibility(categoryId: string, visible: boolean) {
  pois.value.forEach(poi => {
    if (poi.category === categoryId && poi.marker) {
      poi.marker.setOpacity(visible ? 1 : 0)
      const icon = poi.marker.getElement()
      if (icon) {
        icon.style.pointerEvents = visible ? 'auto' : 'none'
      }
    }
  })
}

// Update the visibility of all markers
function updateAllMarkersVisibility(visible: boolean) {
  pois.value.forEach(poi => {
    if (poi.marker) {
      poi.marker.setOpacity(visible ? 1 : 0)
      const icon = poi.marker.getElement()
      if (icon) {
        icon.style.pointerEvents = visible ? 'auto' : 'none'
      }
    }
  })
}

onMounted(async () => {
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  // Get the categories of the map
  try {
    const token = localStorage.getItem('token')
    
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const { data } = await axios.get(`/api/backend/maps/${props.map.id}/categories`, { headers })
    categories.value = data
  } catch (error: any) {
    handleError(error, 'poi.error.fetchCategories', t, notificationSystemRef.value)
    return
  }

  if (!mapContainer.value) {
    console.error('Map container not found')
    return
  }

  try {
    const { map, imageOverlay } = await initializeMap(L, mapContainer.value, props.map, isMobile.value)
    leafletMap = map
    _imageOverlay = imageOverlay

    // Initialization of managers
    markerManager.value = createMarkerManager(
      L,
      leafletMap,
      (poi: POIData) => createPoiPopupTemplate(poi, t),
      (element: HTMLElement, poi: POIData) => {
        if (popupManager.value) {
          popupManager.value.setupPoiEvents(
            element,
            poi,
            () => handleEditPOI(poi),
            () => handleDeletePOI(poi.id!),
            () => element.closest('.leaflet-popup')?.remove()
          )
        }
      }
    )
    popupManager.value = createPopupManager(t)

    // Load the existing POIs
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const { data: poisData } = await axios.get(`/api/backend/pois/map/${props.map.id}`, { headers })

      // Add each POI on the map
      poisData.forEach((poi: any) => {
        if (markerManager.value) {
          handleMarkerAdd(poi)
        }
      })
    } catch (error: any) {
      handleError(error, 'poi.error.fetchPOIs', t, notificationSystemRef.value)
    }

    // Setup map click handler
    setupMapClickHandler(leafletMap, props.addPoiMode, (e) => {
      console.log('Map clicked:', e.latlng)
      if (!props.addPoiMode || !leafletMap) {
        console.log('Not in addPoiMode or map not initialized')
        return
      }

      cleanupElements()
      handlePoiForm(null, e.latlng, () => savePOI())
    })
  } catch (error: any) {
    handleError(error, 'map.error.message', t, notificationSystemRef.value)
  }
})

onUnmounted(() => {
  leafletMap?.remove()
  leafletMap = null
  _imageOverlay = null
  cleanupElements()
})

watch(() => props.addPoiMode, (active) => {
  if (leafletMap && leafletMap.getContainer()) {
    updateMapCursor(leafletMap.getContainer(), active)
    // Reconfigure the click handler
    setupMapClickHandler(leafletMap, active, (e) => {
      console.log('Map clicked:', e.latlng)
      if (!leafletMap) {
        console.log('Map not initialized')
        return
      }

      cleanupElements()
      handlePoiForm(null, e.latlng, () => savePOI())
    })
  }
  showClickMessage.value = active
  
  // If we disable the addPoi mode, we hide the popup
  if (!active) {
    cleanupElements({ popup: true, marker: false, resetClickMessage: false })
  }
}, { immediate: true })

// Watch for category changes
watch(() => props.categories, (newCategories) => {
  if (newCategories) {
    categories.value = newCategories
  }
}, { deep: true })

// Add the watch for the visibility of the categories
watch(() => props.visibleCategories, (newVisibleCategories) => {
  if (!newVisibleCategories) return
  
  // Update the visibility of all markers
  pois.value.forEach(poi => {
    if (poi.marker) {
      const isVisible = newVisibleCategories.includes(poi.category)
      poi.marker.setOpacity(isVisible ? 1 : 0)
      const icon = poi.marker.getElement()
      if (icon) {
        icon.style.pointerEvents = isVisible ? 'auto' : 'none'
      }
    }
  })
}, { deep: true })
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
  background-color: #000814;
}

.instruction-banner {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 32, 64, 0.85);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 1rem;
  z-index: 1500;
}

.leaflet-container.add-poi-cursor {
  cursor: crosshair !important;
}

:deep(.poi-popup) {
  .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 0 !important;
    overflow: hidden;
  }

  .leaflet-popup-content {
    margin: 0;
    width: 400px !important;
  }

  .poi-form {
    padding: 16px;
    border-radius: 0 !important;

    .v-field__input {
      width: 100%;
      padding: 8px;
      border-radius: 0 !important;
      font-size: 14px;
      background-color: rgb(var(--v-theme-surface));
      color: rgb(var(--v-theme-on-surface));
      border: thin solid rgb(var(--v-theme-outline));
    }

    textarea.v-field__input {
      min-height: 80px;
      resize: vertical;
    }

    .image-upload {
      position: relative;
      border: 2px dashed rgb(var(--v-theme-outline));
      border-radius: 0 !important;
      cursor: pointer;

      &:hover {
        border-color: rgb(var(--v-theme-primary));
      }

      .file-input {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        opacity: 0;
        cursor: pointer;
      }

      .image-preview {
        position: relative;
        width: 100%;
        height: 150px;
        overflow: hidden;
        border-radius: 0 !important;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
}

.click-message {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 32, 64, 0.85);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 1rem;
  z-index: 1500;
  pointer-events: none;
}

:deep(.leaflet-popup-content-wrapper) {
  background: #002040 !important;
  border-radius: 0 !important;
  box-shadow: 0 2px 16px rgba(0,0,0,0.4);
}
:deep(.leaflet-popup-tip) {
  background: #002040 !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.leaflet-control-zoom) {
  border: 2px solid #000 !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  overflow: hidden !important;
}

:deep(.leaflet-control-zoom a) {
  background-color: #fff !important;
  color: #000 !important;
  border: none !important;
  width: 40px !important;
  height: 40px !important;
  line-height: 40px !important;
  font-size: 20px !important;
  font-weight: bold !important;
  transition: background-color 0.2s ease !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #f0f0f0 !important;
}

:deep(.leaflet-control-zoom-in) {
  border-radius: 0 !important;
}

:deep(.leaflet-control-zoom-out) {
  border-radius: 0 !important;
}

/* Styles for the mode mobile */
@media (max-width: 600px) {
  .map-container {
    height: 100vh;
  }

  :deep(.leaflet-container) {
    height: 100vh !important;
  }

  :deep(.leaflet-popup) {
    display: none !important;
  }
}

/* Ajout des styles pour le dialogue de suppression */
:deep(.delete-dialog) {
  .v-card-title {
    padding: 16px;
    font-size: 1.25rem;
    font-weight: 500;
  }

  .v-card-actions {
    padding: 8px 16px 16px;
  }

  .v-btn {
    text-transform: none;
    font-weight: 500;
  }
}

/* Add styles for information popups */
:deep(.poi-info-popup) {
  .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 0 !important;
    overflow: hidden;
  }

  .leaflet-popup-content {
    margin: 0;
    width: 400px !important;
  }
}
</style>

<style>
.custom-marker div {
  position: relative;
  z-index: 1;
}
.custom-marker div::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 24px solid var(--marker-color, #0099ff);
  z-index: 0;
}
.custom-marker div > i {
  position: relative;
  z-index: 2;
}
</style>
