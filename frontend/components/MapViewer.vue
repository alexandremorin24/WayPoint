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

    <v-snackbar
      v-model="showError"
      color="error"
      timeout="3000"
    >
      {{ errorMessage }}
    </v-snackbar>

    <!-- Ajout du dialogue de confirmation -->
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
import type { MapData, POIData } from '@/types/map'
import type { Category } from '@/types/category'
import axios from 'axios'
import MobilePoiForm from './MobilePoiForm.vue'

const props = defineProps<{
  map: MapData
  addPoiMode: boolean
  categories?: Category[]
}>()

const emit = defineEmits<{
  (e: 'cancel-poi'): void
  (e: 'show-sidebar'): void
}>()

interface POI {
  id: string
  latlng: LatLng
  category: string
  marker?: L.Marker
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
const showError = ref(false)
const errorMessage = ref('')

const showClickMessage = ref(false)
const showMobileForm = ref(false)
const selectedLatLng = ref<LatLng | null>(null)
const tempMarker = ref<L.Marker | null>(null)

// Ajout des refs pour le dialogue de suppression
const showDeleteDialog = ref(false)
const poiToDelete = ref<string | null>(null)

function cancelAddPoi() {
  emit('cancel-poi')
  emit('show-sidebar')
  showClickMessage.value = false
  showMobileForm.value = false
  selectedLatLng.value = null
  if (tempMarker.value) {
    tempMarker.value.remove()
    tempMarker.value = null
  }
  if (popupRef) {
    popupRef.remove()
    popupRef = null
  }
}

function validatePOIData(data: any) {
  if (!data.name || data.name.length < 1 || data.name.length > 100) {
    throw new Error(t('poi.error.validation.name'))
  }
  if (!data.categoryId) {
    throw new Error(t('poi.error.validation.category'))
  }
  return true
}

async function savePOI() {
  if (!popupRef || !leafletMap || isLoading.value) return

  const latlng = popupRef.getLatLng()
  if (!latlng) return

  isLoading.value = true
  showError.value = false

  try {
    // Get the form from the popup
    const form = popupRef.getElement()?.querySelector('.poi-form')
    if (!form) return

    const name = (form.querySelector('#poi-name') as HTMLInputElement)?.value
    const categoryId = (form.querySelector('#poi-category') as HTMLSelectElement)?.value
    const description = (form.querySelector('#poi-description') as HTMLTextAreaElement)?.value
    const imageFile = (form.querySelector('#poi-image') as HTMLInputElement)?.files?.[0]

    // Prepare the POI data
    const poiData: POIData = {
      name,
      description,
      x: latlng.lng,
      y: latlng.lat,
      categoryId,
      mapId: props.map.id
    }

    // Validate the data
    validatePOIData(poiData)

    // Get the token
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // If an image is selected, upload it first
    if (imageFile) {
      const formData = new FormData()
      formData.append('image', imageFile)
      const { data: imageData } = await axios.post(`/api/backend/pois/map/${props.map.id}/image`, formData, { headers })
      poiData.imageUrl = imageData.url
      poiData.thumbnailUrl = imageData.thumbnailUrl
    }

    // Create the POI
    const { data: poi } = await axios.post(`/api/backend/pois/map/${props.map.id}`, poiData, { headers })

    // Find the category of the POI
    const category = categories.value.find(cat => cat.id === poi.categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    // Create the marker icon
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="background-color: ${category.color || '#0099ff'}; --marker-color: ${category.color || '#0099ff'}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
          <i class="mdi ${category.icon || 'mdi-map-marker'}" style="color: white; font-size: 25px; z-index:2;"></i>
        </div>
      `,
      iconSize: [40, 64],
      iconAnchor: [20, 48]
    })

    // Create the marker with the coordinates x,y
    const markerLatLng = L.latLng(poi.y, poi.x)
    const marker = L.marker(markerLatLng, { icon })
    if (leafletMap) {
      marker.addTo(leafletMap)
    }

    // Add the popup content
    const popupContent = `
      <div style="background:#002040;color:#fff;border-radius:0;padding:0;width:400px;">
        ${poi.imageUrl ? `
          <div style="position:relative;">
            <img src="${poi.imageUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:0;cursor:pointer;" onclick="window.open('${poi.imageUrl}', '_blank')">
            <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
              <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-pencil"></i>
              </button>
              <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-delete"></i>
              </button>
              <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-close"></i>
              </button>
            </div>
          </div>
        ` : `
          <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
            <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="mdi mdi-pencil"></i>
            </button>
            <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="mdi mdi-delete"></i>
            </button>
            <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        `}
        <div style="padding:16px;">
          <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${poi.name}</h3>
          ${poi.description ? `<p style="margin:0;font-size:0.9rem;color:#ccc;max-height:125px;overflow:auto;">${poi.description}</p>` : ''}
          <div class="poi-metadata" style="display:none;margin-top:12px;font-size:0.8rem;color:#888;text-align:right;">
            <div>${t('poi.created')} ${new Date(poi.createdAt).toLocaleString('fr-FR', { 
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} ${t('poi.by')} ${poi.creator?.username || poi.creatorName || t('common.unknown')}</div>
            ${poi.updatedAt !== poi.createdAt ? `<div>${t('poi.updated')} ${new Date(poi.updatedAt).toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} ${t('poi.by')} ${poi.updater?.username || poi.updaterName || t('common.unknown')}</div>` : ''}
          </div>
        </div>
      </div>
    `
    marker.bindPopup(popupContent, {
      offset: [0, 12],
      className: 'poi-info-popup',
      closeButton: false
    })

    // Add the POI to the local list
    pois.value.push({
      id: poi.id,
      latlng: markerLatLng,
      category: poi.categoryId,
      marker
    })

    // Add event listeners for edit and delete buttons
    marker.on('popupopen', async () => {
      const popupElement = marker.getPopup()?.getElement()
      if (!popupElement) return

      const actionsDiv = popupElement.querySelector('.poi-actions') as HTMLElement
      const metadataDiv = popupElement.querySelector('.poi-metadata') as HTMLElement
      if (!actionsDiv || !metadataDiv) return

      // Check user's role
      try {
        const token = localStorage.getItem('token')
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const { data: roleData } = await axios.get(`/api/backend/maps/${props.map.id}/role`, { headers })
        
        // Show actions and metadata if user is owner or editor
        if (roleData.role === 'owner' || roleData.role === 'editor_all' || 
            (roleData.role === 'editor_own' && poi.creatorId === roleData.userId)) {
          actionsDiv.style.display = 'flex'
          metadataDiv.style.display = 'block'
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      }

      // Add event listeners
      const editBtn = popupElement.querySelector('.edit-btn')
      const deleteBtn = popupElement.querySelector('.delete-btn')
      const closeBtn = popupElement.querySelector('.close-btn')

      editBtn?.addEventListener('click', () => {
        handleEditPOI(poi)
      })

      deleteBtn?.addEventListener('click', () => {
        handleDeletePOI(poi.id)
      })

      closeBtn?.addEventListener('click', () => {
        marker.closePopup()
      })
    })

    showClickMessage.value = false
    emit('show-sidebar')
    if (popupRef) {
      popupRef.remove()
      popupRef = null
    }
  } catch (error: any) {
    console.error('Error saving POI:', error)
    errorMessage.value = error.response?.data?.error || error.message || t('poi.error.save')
    showError.value = true
  } finally {
    isLoading.value = false
  }
}

async function handleMobileSave(formData: any) {
  if (!selectedLatLng.value || !leafletMap || isLoading.value) return

  isLoading.value = true
  showError.value = false

  try {
    // Prepare the POI data
    const poiData: POIData = {
      name: formData.name,
      description: formData.description,
      x: selectedLatLng.value.lng,
      y: selectedLatLng.value.lat,
      categoryId: formData.categoryId,
      mapId: props.map.id
    }

    // Validate the data
    validatePOIData(poiData)

    // Get the token
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // If an image is selected, upload it first
    if (formData.imageFile) {
      const formDataImage = new FormData()
      formDataImage.append('image', formData.imageFile)
      const { data: imageData } = await axios.post(`/api/backend/pois/map/${props.map.id}/image`, formDataImage, { headers })
      poiData.imageUrl = imageData.url
      poiData.thumbnailUrl = imageData.thumbnailUrl
    }

    // Create the POI
    const { data: poi } = await axios.post(`/api/backend/pois/map/${props.map.id}`, poiData, { headers })

    // Find the category of the POI
    const category = categories.value.find(cat => cat.id === poi.categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    // Create the marker icon
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="background-color: ${category.color || '#0099ff'}; --marker-color: ${category.color || '#0099ff'}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
          <i class="mdi ${category.icon || 'mdi-map-marker'}" style="color: white; font-size: 25px; z-index:2;"></i>
        </div>
      `,
      iconSize: [40, 64],
      iconAnchor: [20, 48]
    })

    // Create the marker with the coordinates x,y
    const markerLatLng = L.latLng(poi.y, poi.x)
    const marker = L.marker(markerLatLng, { icon })
    if (leafletMap) {
      marker.addTo(leafletMap)
    }

    // Add the popup content
    const popupContent = `
      <div style="background:#002040;color:#fff;border-radius:0;padding:0;width:400px;">
        ${poi.imageUrl ? `
          <div style="position:relative;">
            <img src="${poi.imageUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:0;cursor:pointer;" onclick="window.open('${poi.imageUrl}', '_blank')">
            <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
              <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-pencil"></i>
              </button>
              <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-delete"></i>
              </button>
              <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-close"></i>
              </button>
            </div>
          </div>
        ` : `
          <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
            <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="mdi mdi-pencil"></i>
            </button>
            <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="mdi mdi-delete"></i>
            </button>
            <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        `}
        <div style="padding:16px;">
          <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${poi.name}</h3>
          ${poi.description ? `<p style="margin:0;font-size:0.9rem;color:#ccc;max-height:125px;overflow:auto;">${poi.description}</p>` : ''}
          <div class="poi-metadata" style="display:none;margin-top:12px;font-size:0.8rem;color:#888;text-align:right;">
            <div>${t('poi.created')} ${new Date(poi.createdAt).toLocaleString('fr-FR', { 
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} ${t('poi.by')} ${poi.creator?.username || poi.creatorName || t('common.unknown')}</div>
            ${poi.updatedAt !== poi.createdAt ? `<div>${t('poi.updated')} ${new Date(poi.updatedAt).toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} ${t('poi.by')} ${poi.updater?.username || poi.updaterName || t('common.unknown')}</div>` : ''}
          </div>
        </div>
      </div>
    `
    marker.bindPopup(popupContent, {
      offset: [0, 12],
      className: 'poi-info-popup',
      closeButton: false
    })

    // Add the POI to the local list
    pois.value.push({
      id: poi.id,
      latlng: markerLatLng,
      category: poi.categoryId,
      marker
    })

    showClickMessage.value = false
    showMobileForm.value = false
    selectedLatLng.value = null
    emit('show-sidebar')

    // Remove the temporary marker
    if (tempMarker.value) {
      tempMarker.value.remove()
      tempMarker.value = null
    }
  } catch (error: any) {
    console.error('Error saving POI:', error)
    errorMessage.value = error.response?.data?.error || error.message || t('poi.error.save')
    showError.value = true
  } finally {
    isLoading.value = false
  }
}

function updateTempMarker(category: Category) {
  if (!tempMarker.value || !leafletMap) return

  // Update the marker icon
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="background-color: ${category.color || '#0099ff'}; --marker-color: ${category.color || '#0099ff'}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
        <i class="mdi ${category.icon || 'mdi-map-marker'}" style="color: white; font-size: 25px; z-index:2;"></i>
      </div>
    `,
    iconSize: [40, 64],
    iconAnchor: [20, 48]
  })

  // Update the marker with the new icon
  const latlng = tempMarker.value.getLatLng()
  tempMarker.value.remove()
  tempMarker.value = L.marker(latlng, { icon }).addTo(leafletMap)
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
    console.error('Error fetching categories:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    errorMessage.value = t('poi.error.fetchCategories')
    showError.value = true
  }

  const bounds: [[number, number], [number, number]] = [
    [0, 0],
    [props.map.imageHeight, props.map.imageWidth]
  ]

  // Allow the image to go out a bit (30% on desktop, 50% on mobile)
  const extendedBounds: [[number, number], [number, number]] = [
    [-props.map.imageHeight * (isMobile.value ? 0.5 : 0.3), -props.map.imageWidth * (isMobile.value ? 0.5 : 0.3)],
    [props.map.imageHeight * (isMobile.value ? 1.5 : 1.3), props.map.imageWidth * (isMobile.value ? 1.5 : 1.3)]
  ]

  if (!mapContainer.value) {
    console.error('Map container not found')
    return
  }

  leafletMap = L.map(mapContainer.value, {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxZoom: 5,
    maxBounds: extendedBounds,
    maxBoundsViscosity: 1.0,
    zoomControl: true,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    wheelDebounceTime: 40,
    wheelPxPerZoomLevel: 60,
    doubleClickZoom: true,
    touchZoom: true,
    scrollWheelZoom: true,
    keyboard: true,
    keyboardPanDelta: 80
  })

  // Position the zoom control in the top right
  leafletMap.zoomControl.setPosition('topright')
  leafletMap.attributionControl.remove()

  if (!props.map.imageUrl) {
    console.error('Missing imageUrl in map data:', props.map)
    errorMessage.value = t('map.error.message')
    showError.value = true
    return
  }

  try {
    // Build the complete image URL
    const imageUrl = props.map.imageUrl.startsWith('http') 
      ? props.map.imageUrl 
      : `${window.location.origin}${props.map.imageUrl}`

    _imageOverlay = L.imageOverlay(imageUrl, bounds).addTo(leafletMap)

    leafletMap.fitBounds(bounds)
    await nextTick()
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
        // Create the marker icon
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="background-color: ${poi.color || '#0099ff'}; --marker-color: ${poi.color || '#0099ff'}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
              <i class="mdi ${poi.icon || 'mdi-map-marker'}" style="color: white; font-size: 25px; z-index:2;"></i>
            </div>
          `,
          iconSize: [40, 64],
          iconAnchor: [20, 48]
        })

        // Create the marker with the coordinates x,y
        const markerLatLng = L.latLng(poi.y, poi.x)
        const marker = L.marker(markerLatLng, { icon })
        if (leafletMap) {
          marker.addTo(leafletMap)
        }

        // Add the popup content
        const popupContent = `
          <div style="background:#002040;color:#fff;border-radius:0;padding:0;width:400px;">
            ${poi.imageUrl ? `
              <div style="position:relative;">
                <img src="${poi.imageUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:0;cursor:pointer;" onclick="window.open('${poi.imageUrl}', '_blank')">
                <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
                  <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                    <i class="mdi mdi-pencil"></i>
                  </button>
                  <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                    <i class="mdi mdi-delete"></i>
                  </button>
                  <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                    <i class="mdi mdi-close"></i>
                  </button>
                </div>
              </div>
            ` : `
              <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
                <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <i class="mdi mdi-pencil"></i>
                </button>
                <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <i class="mdi mdi-delete"></i>
                </button>
                <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>
            `}
            <div style="padding:16px;">
              <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${poi.name}</h3>
              ${poi.description ? `<p style="margin:0;font-size:0.9rem;color:#ccc;max-height:125px;overflow:auto;">${poi.description}</p>` : ''}
              <div class="poi-metadata" style="display:none;margin-top:12px;font-size:0.8rem;color:#888;text-align:right;">
                <div>${t('poi.created')} ${new Date(poi.createdAt).toLocaleString('fr-FR', { 
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} ${t('poi.by')} ${poi.creator?.username || poi.creatorName || t('common.unknown')}</div>
                ${poi.updatedAt !== poi.createdAt ? `<div>${t('poi.updated')} ${new Date(poi.updatedAt).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} ${t('poi.by')} ${poi.updater?.username || poi.updaterName || t('common.unknown')}</div>` : ''}
              </div>
            </div>
          </div>
        `
        marker.bindPopup(popupContent, {
          offset: [0, 12],
          className: 'poi-info-popup',
          closeButton: false
        })

        // Add the POI to the local list
        pois.value.push({
          id: poi.id,
          latlng: markerLatLng,
          category: poi.categoryId,
          marker
        })

        // Add event listeners for edit and delete buttons
        marker.on('popupopen', async () => {
          const popupElement = marker.getPopup()?.getElement()
          if (!popupElement) return

          const actionsDiv = popupElement.querySelector('.poi-actions') as HTMLElement
          const metadataDiv = popupElement.querySelector('.poi-metadata') as HTMLElement
          if (!actionsDiv || !metadataDiv) return

          // Check user's role
          try {
            const token = localStorage.getItem('token')
            const headers: Record<string, string> = {}
            if (token) {
              headers['Authorization'] = `Bearer ${token}`
            }
            const { data: roleData } = await axios.get(`/api/backend/maps/${props.map.id}/role`, { headers })
            
            // Show actions and metadata if user is owner or editor
            if (roleData.role === 'owner' || roleData.role === 'editor_all' || 
                (roleData.role === 'editor_own' && poi.creatorId === roleData.userId)) {
              actionsDiv.style.display = 'flex'
              metadataDiv.style.display = 'block'
            }
          } catch (error) {
            console.error('Error checking user role:', error)
          }

          // Add event listeners
          const editBtn = popupElement.querySelector('.edit-btn')
          const deleteBtn = popupElement.querySelector('.delete-btn')
          const closeBtn = popupElement.querySelector('.close-btn')

          editBtn?.addEventListener('click', () => {
            handleEditPOI(poi)
          })

          deleteBtn?.addEventListener('click', () => {
            handleDeletePOI(poi.id)
          })

          closeBtn?.addEventListener('click', () => {
            marker.closePopup()
          })
        })
      })
    } catch (error: any) {
      console.error('Error fetching POIs:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      errorMessage.value = t('poi.error.fetchPOIs')
      showError.value = true
    }
  } catch (error: any) {
    console.error('Error loading map image:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    errorMessage.value = t('map.error.message')
    showError.value = true
  }

  // Handle POI markers only if in addPoiMode
  leafletMap.on('click', (e: { latlng: LatLng }) => {
    console.log('Map clicked:', e.latlng)
    if (!props.addPoiMode || !leafletMap) {
      console.log('Not in addPoiMode or map not initialized')
      return
    }

    // Remove existing popup and temp marker
    if (popupRef) {
      popupRef.remove()
    }
    if (tempMarker.value) {
      tempMarker.value.remove()
    }

    // Hide click message when popup is created
    showClickMessage.value = false

    if (isMobile.value) {
      selectedLatLng.value = e.latlng
      showMobileForm.value = true

      // Create a temporary marker
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="background-color: #0099ff; --marker-color: #0099ff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
            <i class="mdi mdi-map-marker" style="color: white; font-size: 25px; z-index:2;"></i>
          </div>
        `,
        iconSize: [40, 64],
        iconAnchor: [20, 48]
      })

      tempMarker.value = L.marker(e.latlng, { icon }).addTo(leafletMap)

      // Calculate the position to place the marker at 25% from the top
      const mapHeight = leafletMap.getSize().y
      const targetY = mapHeight * 0.25
      const currentY = leafletMap.latLngToContainerPoint(e.latlng).y
      const offsetY = targetY - currentY

      // Calculate the new center that will place the marker at 25% from the top
      const center = leafletMap.getCenter()
      const newCenter = leafletMap.containerPointToLatLng([
        leafletMap.latLngToContainerPoint(center).x,
        leafletMap.latLngToContainerPoint(center).y + offsetY
      ])

      // Move the view
      leafletMap.setView(newCenter, leafletMap.getZoom(), {
        animate: true,
        duration: 0.3
      })
    } else {
      // Create popup content for desktop
      const categoriesOptions = categories.value.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
      ).join('')

      const popupContent = `
        <form class="poi-form" style="background:#002040;color:#fff;border-radius:0;padding:20px;">
          <div class="d-flex flex-column">
            <div class="d-flex flex-row align-center mb-2">
              <span style="font-weight:bold;font-size:1.2rem;">${t('poi.form.title')}</span>
            </div>
            <div class="mb-3"><hr style="border:0;border-top:1px solid #335;"></hr></div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-name" style="width:90px;min-width:90px;">${t('poi.form.name')}</label>
              <input id="poi-name" class="flex-grow-1 ml-2" type="text" placeholder="${t('poi.form.name')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;" />
            </div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-category" style="width:90px;min-width:90px;">${t('poi.form.category')}</label>
              <select id="poi-category" class="flex-grow-1 ml-2" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;">
                <option value="">${t('poi.form.chooseCategory')}</option>
                ${categoriesOptions}
              </select>
            </div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-image" style="width:90px;min-width:90px;">${t('poi.form.image')}</label>
              <div class="image-upload flex-grow-1 ml-2" style="position:relative;border:2px dashed #335;border-radius:0;background:#001428;min-height:80px;text-align:center;cursor:pointer;">
                <input id="poi-image" type="file" accept="image/*" class="file-input" style="position:absolute;width:100%;height:100%;top:0;left:0;opacity:0;cursor:pointer;z-index:2;" />
                <div class="upload-placeholder d-flex flex-column align-center justify-center pa-4" style="padding:16px;">
                  <span style="color:#ccc;">${t('poi.form.uploadPlaceholder')}</span>
                  <small style="color:#888;">${t('poi.form.uploadHint')}</small>
                </div>
                <div class="image-preview" style="display: none;">
                  <img src="" alt="Preview" id="image-preview" style="width:100%;height:150px;object-fit:cover;border-radius:0;" />
                  <button type="button" class="remove-image" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:0;background:rgba(0,0,0,0.5);color:#fff;border:none;cursor:pointer;font-size:16px;">×</button>
                </div>
              </div>
            </div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-description" style="width:90px;min-width:90px;">${t('poi.form.description')}</label>
              <textarea id="poi-description" class="flex-grow-1 ml-2" rows="2" placeholder="${t('poi.form.description')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;"></textarea>
            </div>

            <div class="d-flex flex-row justify-end gap-2 mt-4">
              <button type="button" class="cancel-btn" style="background:#335;color:#fff;border:none;border-radius:0;padding:8px 16px;cursor:pointer;">${t('common.cancel')}</button>
              <button type="button" class="save-btn" style="background:#FFD600;color:#002040;font-weight:bold;border:none;border-radius:0;padding:8px 16px;cursor:pointer;">${t('common.save')}</button>
            </div>
          </div>
        </form>
      `

      // Create popup
      popupRef = L.popup({
        closeButton: false,
        className: 'poi-popup',
        offset: [0, 5]
      })
        .setContent(popupContent)
        .setLatLng(e.latlng)
        .addTo(leafletMap)

      // Handle popup events
      const popupElement = popupRef.getElement()
      if (popupElement) {
        // Handle image upload
        const fileInput = popupElement.querySelector('.file-input') as HTMLInputElement
        const imagePreview = popupElement.querySelector('#image-preview') as HTMLImageElement
        const previewContainer = popupElement.querySelector('.image-preview') as HTMLElement
        const uploadPlaceholder = popupElement.querySelector('.upload-placeholder') as HTMLElement

        fileInput?.addEventListener('change', (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              if (imagePreview && previewContainer && uploadPlaceholder) {
                imagePreview.src = e.target?.result as string
                previewContainer.style.display = 'block'
                uploadPlaceholder.style.display = 'none'
              }
            }
            reader.readAsDataURL(file)
          }
        })

        // Handle buttons
        popupElement.querySelector('.cancel-btn')?.addEventListener('click', () => {
          cancelAddPoi()
        })

        popupElement.querySelector('.save-btn')?.addEventListener('click', () => {
          savePOI()
        })
      }
    }
  })
})

onUnmounted(() => {
  leafletMap?.remove()
  leafletMap = null
  _imageOverlay = null
  popupRef?.remove()
  popupRef = null
  if (tempMarker.value) {
    tempMarker.value.remove()
    tempMarker.value = null
  }
})

watch(() => props.addPoiMode, (active) => {
  if (leafletMap && leafletMap.getContainer()) {
    leafletMap.getContainer().classList.toggle('add-poi-cursor', active)
  }
  showClickMessage.value = active
  
  // If we disable the addPoi mode, we hide the popup
  if (!active && popupRef) {
    popupRef.remove()
    popupRef = null
  }
}, { immediate: true })

// Watch for category changes
watch(() => props.categories, (newCategories) => {
  if (newCategories) {
    categories.value = newCategories
  }
}, { deep: true })

async function handleEditPOI(poi: any) {
  if (!leafletMap) return

  // Remove existing popup and temp marker
  if (popupRef) {
    popupRef.remove()
  }
  if (tempMarker.value) {
    tempMarker.value.remove()
  }

  // Hide click message when popup is created
  showClickMessage.value = false

  if (isMobile.value) {
    selectedLatLng.value = L.latLng(poi.y, poi.x)
    showMobileForm.value = true

    // Create a temporary marker
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="background-color: ${poi.color || '#0099ff'}; --marker-color: ${poi.color || '#0099ff'}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
          <i class="mdi ${poi.icon || 'mdi-map-marker'}" style="color: white; font-size: 25px; z-index:2;"></i>
        </div>
      `,
      iconSize: [40, 64],
      iconAnchor: [20, 48]
    })

    tempMarker.value = L.marker(selectedLatLng.value, { icon }).addTo(leafletMap)

    // Calculate the position to place the marker at 25% from the top
    const mapHeight = leafletMap.getSize().y
    const targetY = mapHeight * 0.25
    const currentY = leafletMap.latLngToContainerPoint(selectedLatLng.value).y
    const offsetY = targetY - currentY

    // Calculate the new center that will place the marker at 25% from the top
    const center = leafletMap.getCenter()
    const newCenter = leafletMap.containerPointToLatLng([
      leafletMap.latLngToContainerPoint(center).x,
      leafletMap.latLngToContainerPoint(center).y + offsetY
    ])

    // Move the view
    leafletMap.setView(newCenter, leafletMap.getZoom(), {
      animate: true,
      duration: 0.3
    })
  } else {
    // Create popup content for desktop
    const categoriesOptions = categories.value.map(cat => 
      `<option value="${cat.id}" ${cat.id === poi.categoryId ? 'selected' : ''}>${cat.name}</option>`
    ).join('')

    const popupContent = `
      <form class="poi-form" style="background:#002040;color:#fff;border-radius:0;padding:20px;">
        <div class="d-flex flex-column">
          <div class="d-flex flex-row align-center mb-2">
            <span style="font-weight:bold;font-size:1.2rem;">${t('poi.form.editTitle')}</span>
          </div>
          <div class="mb-3"><hr style="border:0;border-top:1px solid #335;"></hr></div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-name" style="width:90px;min-width:90px;">${t('poi.form.name')}</label>
            <input id="poi-name" class="flex-grow-1 ml-2" type="text" value="${poi.name}" placeholder="${t('poi.form.name')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;" />
          </div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-category" style="width:90px;min-width:90px;">${t('poi.form.category')}</label>
            <select id="poi-category" class="flex-grow-1 ml-2" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;">
              <option value="">${t('poi.form.chooseCategory')}</option>
              ${categoriesOptions}
            </select>
          </div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-image" style="width:90px;min-width:90px;">${t('poi.form.image')}</label>
            <div class="image-upload flex-grow-1 ml-2" style="position:relative;border:2px dashed #335;border-radius:0;background:#001428;min-height:80px;text-align:center;cursor:pointer;">
              <input id="poi-image" type="file" accept="image/*" class="file-input" style="position:absolute;width:100%;height:100%;top:0;left:0;opacity:0;cursor:pointer;z-index:2;" />
              <div class="upload-placeholder d-flex flex-column align-center justify-center pa-4" style="padding:16px;">
                <span style="color:#ccc;">${t('poi.form.uploadPlaceholder')}</span>
                <small style="color:#888;">${t('poi.form.uploadHint')}</small>
              </div>
              <div class="image-preview" style="display: ${poi.imageUrl ? 'block' : 'none'};">
                <img src="${poi.imageUrl || ''}" alt="Preview" id="image-preview" style="width:100%;height:150px;object-fit:cover;border-radius:0;" />
                <button type="button" class="remove-image" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:0;background:rgba(0,0,0,0.5);color:#fff;border:none;cursor:pointer;font-size:16px;">×</button>
              </div>
            </div>
          </div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-description" style="width:90px;min-width:90px;">${t('poi.form.description')}</label>
            <textarea id="poi-description" class="flex-grow-1 ml-2" rows="2" placeholder="${t('poi.form.description')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;">${poi.description || ''}</textarea>
          </div>

          <div class="d-flex flex-row justify-end gap-2 mt-4">
            <button type="button" class="cancel-btn" style="background:#335;color:#fff;border:none;border-radius:0;padding:8px 16px;cursor:pointer;">${t('common.cancel')}</button>
            <button type="button" class="save-btn" style="background:#FFD600;color:#002040;font-weight:bold;border:none;border-radius:0;padding:8px 16px;cursor:pointer;">${t('common.save')}</button>
          </div>
        </div>
      </form>
    `

    // Create popup
    popupRef = L.popup({
      closeButton: false,
      className: 'poi-popup',
      offset: [0, 5]
    })
      .setContent(popupContent)
      .setLatLng(L.latLng(poi.y, poi.x))
      .addTo(leafletMap)

    // Handle popup events
    const popupElement = popupRef.getElement()
    if (popupElement) {
      // Handle image upload
      const fileInput = popupElement.querySelector('.file-input') as HTMLInputElement
      const imagePreview = popupElement.querySelector('#image-preview') as HTMLImageElement
      const previewContainer = popupElement.querySelector('.image-preview') as HTMLElement
      const uploadPlaceholder = popupElement.querySelector('.upload-placeholder') as HTMLElement

      fileInput?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (imagePreview && previewContainer && uploadPlaceholder) {
              imagePreview.src = e.target?.result as string
              previewContainer.style.display = 'block'
              uploadPlaceholder.style.display = 'none'
            }
          }
          reader.readAsDataURL(file)
        }
      })

      // Handle buttons
      popupElement.querySelector('.cancel-btn')?.addEventListener('click', () => {
        cancelAddPoi()
      })

      popupElement.querySelector('.save-btn')?.addEventListener('click', () => {
        updatePOI(poi.id)
      })
    }
  }
}

async function handleDeletePOI(poiId: string) {
  poiToDelete.value = poiId
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!poiToDelete.value) return

  try {
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    await axios.delete(`/api/backend/pois/${poiToDelete.value}`, { headers })

    // Remove the POI from the map
    const poiIndex = pois.value.findIndex(p => p.id === poiToDelete.value)
    if (poiIndex !== -1) {
      const poi = pois.value[poiIndex]
      poi.marker?.remove()
      pois.value.splice(poiIndex, 1)
    }

    showSuccess(t('poi.deleteSuccess'))
  } catch (error: any) {
    console.error('Error deleting POI:', error)
    errorMessage.value = error.response?.data?.error || error.message || t('poi.error.delete')
    showError.value = true
  } finally {
    showDeleteDialog.value = false
    poiToDelete.value = null
  }
}

async function updatePOI(poiId: string) {
  if (!popupRef || !leafletMap || isLoading.value) return

  const latlng = popupRef.getLatLng()
  if (!latlng) return

  isLoading.value = true
  showError.value = false

  try {
    // Get the form from the popup
    const form = popupRef.getElement()?.querySelector('.poi-form')
    if (!form) return

    const name = (form.querySelector('#poi-name') as HTMLInputElement)?.value
    const categoryId = (form.querySelector('#poi-category') as HTMLSelectElement)?.value
    const description = (form.querySelector('#poi-description') as HTMLTextAreaElement)?.value
    const imageFile = (form.querySelector('#poi-image') as HTMLInputElement)?.files?.[0]

    // Prepare the POI data
    const poiData: any = {
      name,
      description,
      x: latlng.lng,
      y: latlng.lat,
      categoryId
    }

    // Get the token
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // If an image is selected, upload it first
    if (imageFile) {
      const formData = new FormData()
      formData.append('image', imageFile)
      const { data: imageData } = await axios.post(`/api/backend/pois/map/${props.map.id}/image`, formData, { headers })
      poiData.imageUrl = imageData.url
      poiData.thumbnailUrl = imageData.thumbnailUrl
    }

    // Update the POI
    const { data: updatedPOI } = await axios.put(`/api/backend/pois/${poiId}`, poiData, { headers })

    // Find the category of the POI
    const category = categories.value.find(cat => cat.id === updatedPOI.categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    // Update the marker icon
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="background-color: ${category.color || '#0099ff'}; --marker-color: ${category.color || '#0099ff'}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25); z-index:1;">
          <i class="mdi ${category.icon || 'mdi-map-marker'}" style="color: white; font-size: 25px; z-index:2;"></i>
        </div>
      `,
      iconSize: [40, 64],
      iconAnchor: [20, 48]
    })

    // Update the marker
    const poiIndex = pois.value.findIndex(p => p.id === poiId)
    if (poiIndex !== -1) {
      const poi = pois.value[poiIndex]
      poi.marker?.setIcon(icon)
      poi.marker?.setLatLng(L.latLng(updatedPOI.y, updatedPOI.x))

      // Update the popup content
      const popupContent = `
        <div style="background:#002040;color:#fff;border-radius:0;padding:0;width:400px;">
          ${updatedPOI.imageUrl ? `
            <div style="position:relative;">
              <img src="${updatedPOI.imageUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:0;cursor:pointer;" onclick="window.open('${updatedPOI.imageUrl}', '_blank')">
              <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
                <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <i class="mdi mdi-pencil"></i>
                </button>
                <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <i class="mdi mdi-delete"></i>
                </button>
                <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                  <i class="mdi mdi-close"></i>
                </button>
              </div>
            </div>
          ` : `
            <div class="poi-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px;">
              <button class="edit-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-pencil"></i>
              </button>
              <button class="delete-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-delete"></i>
              </button>
              <button class="close-btn" style="background:rgba(0,32,64,0.8);border:none;color:#fff;cursor:pointer;padding:8px;border-radius:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                <i class="mdi mdi-close"></i>
              </button>
            </div>
          `}
          <div style="padding:16px;">
            <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${updatedPOI.name}</h3>
            ${updatedPOI.description ? `<p style="margin:0;font-size:0.9rem;color:#ccc;max-height:125px;overflow:auto;">${updatedPOI.description}</p>` : ''}
            <div class="poi-metadata" style="display:none;margin-top:12px;font-size:0.8rem;color:#888;text-align:right;">
              <div>${t('poi.created')} ${new Date(updatedPOI.createdAt).toLocaleString('fr-FR', { 
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} ${t('poi.by')} ${updatedPOI.creator?.username || updatedPOI.creatorName || t('common.unknown')}</div>
              ${updatedPOI.updatedAt !== updatedPOI.createdAt ? `<div>${t('poi.updated')} ${new Date(updatedPOI.updatedAt).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} ${t('poi.by')} ${updatedPOI.updater?.username || updatedPOI.updaterName || t('common.unknown')}</div>` : ''}
            </div>
          </div>
        </div>
      `
      poi.marker?.bindPopup(popupContent, {
        offset: [0, 12],
        className: 'poi-info-popup',
        closeButton: false
      })
    }

    showClickMessage.value = false
    emit('show-sidebar')
    if (popupRef) {
      popupRef.remove()
      popupRef = null
    }
  } catch (error: any) {
    console.error('Error updating POI:', error)
    errorMessage.value = error.response?.data?.error || error.message || t('poi.error.update')
    showError.value = true
  } finally {
    isLoading.value = false
  }
}

const showSuccess = (message: string) => {
  errorMessage.value = message
  showError.value = true
}
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

/* Ajouter les styles pour les popups d'information */
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
