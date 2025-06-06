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
      <div style="background:#002040;color:#fff;border-radius:10px;padding:10px;">
        <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${name}</h3>
        ${description ? `<p style="margin:0 0 8px 0;font-size:0.9rem;">${description}</p>` : ''}
        ${poiData.thumbnailUrl ? `<img src="${poiData.thumbnailUrl}" style="max-width:100%;border-radius:4px;margin-bottom:8px;cursor:pointer;" onclick="window.open('${poiData.imageUrl}', '_blank')">` : ''}
      </div>
    `
    marker.bindPopup(popupContent)

    // Add the POI to the local list
    pois.value.push({
      id: poi.id,
      latlng: markerLatLng,
      category: poi.categoryId,
      marker
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
      <div style="background:#002040;color:#fff;border-radius:10px;padding:10px;">
        <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${formData.name}</h3>
        ${formData.description ? `<p style="margin:0 0 8px 0;font-size:0.9rem;">${formData.description}</p>` : ''}
        ${poiData.thumbnailUrl ? `<img src="${poiData.thumbnailUrl}" style="max-width:100%;border-radius:4px;margin-bottom:8px;cursor:pointer;" onclick="window.open('${poiData.imageUrl}', '_blank')">` : ''}
      </div>
    `
    marker.bindPopup(popupContent)

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
          <div style="background:#002040;color:#fff;border-radius:10px;padding:10px;">
            <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${poi.name}</h3>
            ${poi.description ? `<p style="margin:0 0 8px 0;font-size:0.9rem;">${poi.description}</p>` : ''}
            ${poi.imageUrl ? `<img src="${poi.imageUrl}" style="max-width:100%;border-radius:4px;margin-bottom:8px;">` : ''}
          </div>
        `
        marker.bindPopup(popupContent, {
          offset: [0, 12],
          className: 'poi-info-popup'
        })

        // Add the POI to the local list
        pois.value.push({
          id: poi.id,
          latlng: markerLatLng,
          category: poi.categoryId,
          marker
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
        <form class="poi-form" style="background:#002040;color:#fff;border-radius:10px;padding:20px;">
          <div class="d-flex flex-column">
            <div class="d-flex flex-row align-center mb-2">
              <span style="font-weight:bold;font-size:1.2rem;">${t('poi.form.title')}</span>
            </div>
            <div class="mb-3"><hr style="border:0;border-top:1px solid #335;"></hr></div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-name" style="width:90px;min-width:90px;">${t('poi.form.name')}</label>
              <input id="poi-name" class="flex-grow-1 ml-2" type="text" placeholder="${t('poi.form.name')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:4px;padding:6px;" />
            </div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-category" style="width:90px;min-width:90px;">${t('poi.form.category')}</label>
              <select id="poi-category" class="flex-grow-1 ml-2" style="background:#001428;color:#fff;border:1px solid #335;border-radius:4px;padding:6px;">
                <option value="">${t('poi.form.chooseCategory')}</option>
                ${categoriesOptions}
              </select>
            </div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-image" style="width:90px;min-width:90px;">${t('poi.form.image')}</label>
              <div class="image-upload flex-grow-1 ml-2" style="position:relative;border:2px dashed #335;border-radius:4px;background:#001428;min-height:80px;text-align:center;cursor:pointer;">
                <input id="poi-image" type="file" accept="image/*" class="file-input" style="position:absolute;width:100%;height:100%;top:0;left:0;opacity:0;cursor:pointer;z-index:2;" />
                <div class="upload-placeholder d-flex flex-column align-center justify-center pa-4" style="padding:16px;">
                  <span style="color:#ccc;">${t('poi.form.uploadPlaceholder')}</span>
                  <small style="color:#888;">${t('poi.form.uploadHint')}</small>
                </div>
                <div class="image-preview" style="display: none;">
                  <img src="" alt="Preview" id="image-preview" style="width:100%;height:150px;object-fit:cover;border-radius:4px;" />
                  <button type="button" class="remove-image" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;cursor:pointer;font-size:16px;">×</button>
                </div>
              </div>
            </div>

            <div class="d-flex flex-row align-center mb-2">
              <label for="poi-description" style="width:90px;min-width:90px;">${t('poi.form.description')}</label>
              <textarea id="poi-description" class="flex-grow-1 ml-2" rows="2" placeholder="${t('poi.form.description')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:4px;padding:6px;"></textarea>
            </div>

            <div class="d-flex flex-row justify-end gap-2 mt-4">
              <button type="button" class="cancel-btn" style="background:#335;color:#fff;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">${t('common.cancel')}</button>
              <button type="button" class="save-btn" style="background:#FFD600;color:#002040;font-weight:bold;border:none;border-radius:4px;padding:8px 16px;cursor:pointer;">${t('common.save')}</button>
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
    border-radius: 8px;
    overflow: hidden;
  }

  .leaflet-popup-content {
    margin: 0;
    width: 385px;
  }

  .poi-form {
    padding: 16px;

    .v-field__input {
      width: 100%;
      padding: 8px;
      border-radius: 4px;
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
      border-radius: 4px;
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
        border-radius: 4px;

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
  border-radius: 16px !important;
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
