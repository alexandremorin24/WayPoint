<template>
  <div class="map-container">
    <div ref="mapContainer" class="map" />

    <div v-if="showClickMessage" class="click-message">
      {{ $t('map.clickToAddPoi') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import type { Map as LeafletMap, ImageOverlay, LatLng, Popup } from 'leaflet'
import type { MapData } from '@/types/map'

const props = defineProps<{
  map: MapData
  addPoiMode: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel-poi'): void
  (e: 'show-sidebar'): void
}>()

interface POI {
  id: string
  latlng: LatLng
  category: string
}

const pois = ref<POI[]>([])

// Leaflet
const mapContainer = ref<HTMLElement | null>(null)
let L: typeof import('leaflet')
let leafletMap: LeafletMap | null = null
let _imageOverlay: ImageOverlay | null = null
let popupRef: Popup | null = null

// State
const isMobile = computed(() => useDisplay().mobile.value)
const { t, locale } = useI18n()

// Map dimensions
let mapWidth = 0
let mapHeight = 0

const showClickMessage = ref(false)

function cancelAddPoi() {
  emit('cancel-poi')
  emit('show-sidebar')
  showClickMessage.value = false
  if (popupRef) {
    popupRef.remove()
    popupRef = null
  }
}

function savePOI() {
  if (!popupRef || !leafletMap) return

  const latlng = popupRef.getLatLng()
  if (!latlng) return

  const category = 'default'

  pois.value.push({
    id: crypto.randomUUID(),
    latlng,
    category
  })

  showClickMessage.value = false
  emit('show-sidebar')
  if (popupRef) {
    popupRef.remove()
    popupRef = null
  }
}

onMounted(async () => {
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  const bounds: [[number, number], [number, number]] = [
    [0, 0],
    [props.map.height, props.map.width]
  ]

  mapWidth = props.map.width
  mapHeight = props.map.height

  if (!mapContainer.value) return

  leafletMap = L.map(mapContainer.value, {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
  })

  leafletMap.zoomControl.setPosition('topright')
  leafletMap.attributionControl.remove()

  if (!props.map.imageUrl) {
    console.warn('missing imageUrl', props.map)
    return
  }

  _imageOverlay = L.imageOverlay(props.map.imageUrl, bounds).addTo(leafletMap)
  leafletMap.fitBounds(bounds, { padding: [10, 10] })
  leafletMap.setMaxBounds(bounds)
  await nextTick()
  setTimeout(() => leafletMap?.invalidateSize(), 100)

  // Handle POI markers only if in addPoiMode
  leafletMap.on('click', (e: { latlng: LatLng }) => {
    if (!props.addPoiMode || !leafletMap) return

    const point = leafletMap.latLngToContainerPoint(e.latlng)
    if (
      point.x < 0 || point.y < 0 ||
      point.x > mapWidth || point.y > mapHeight
    ) {
      return
    }

    // Remove existing popup
    if (popupRef) {
      popupRef.remove()
    }

    // Create popup content
    const key = locale.value === 'fr' ? 'marqueur' : 'poi'
    const popupContent = `
      <form class="poi-form" style="background:#002040;color:#fff;border-radius:10px;padding:20px;">
        <div class="d-flex flex-column">
          <div class="d-flex flex-row align-center mb-2">
            <span style="font-weight:bold;font-size:1.2rem;">${t(`${key}.form.title`)}</span>
          </div>
          <div class="mb-3"><hr style="border:0;border-top:1px solid #335;"></hr></div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-name" style="width:90px;min-width:90px;">${t(`${key}.form.name`)}</label>
            <input id="poi-name" class="flex-grow-1 ml-2" type="text" placeholder="${t(`${key}.form.name`)}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:4px;padding:6px;" />
          </div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-category" style="width:90px;min-width:90px;">${t(`${key}.form.category`)}</label>
            <select id="poi-category" class="flex-grow-1 ml-2" style="background:#001428;color:#fff;border:1px solid #335;border-radius:4px;padding:6px;">
              <option value="">${t(`${key}.form.chooseCategory`)}</option>
              <option value="shop">${t(`${key}.categories.shop`)}</option>
              <option value="restaurant">${t(`${key}.categories.restaurant`)}</option>
              <option value="hotel">${t(`${key}.categories.hotel`)}</option>
              <option value="attraction">${t(`${key}.categories.attraction`)}</option>
              <option value="other">${t(`${key}.categories.other`)}</option>
            </select>
          </div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-image" style="width:90px;min-width:90px;">${t(`${key}.form.image`)}</label>
            <div class="image-upload flex-grow-1 ml-2" style="position:relative;border:2px dashed #335;border-radius:4px;background:#001428;min-height:80px;text-align:center;cursor:pointer;">
              <input id="poi-image" type="file" accept="image/*" class="file-input" style="position:absolute;width:100%;height:100%;top:0;left:0;opacity:0;cursor:pointer;z-index:2;" />
              <div class="upload-placeholder d-flex flex-column align-center justify-center pa-4" style="padding:16px;">
                <span style="color:#ccc;">${t(`${key}.form.uploadPlaceholder`)}</span>
                <small style="color:#888;">${t(`${key}.form.uploadHint`)}</small>
              </div>
              <div class="image-preview" style="display: none;">
                <img src="" alt="Preview" id="image-preview" style="width:100%;height:150px;object-fit:cover;border-radius:4px;" />
                <button type="button" class="remove-image" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;cursor:pointer;font-size:16px;">×</button>
              </div>
            </div>
          </div>

          <div class="d-flex flex-row align-center mb-2">
            <label for="poi-description" style="width:90px;min-width:90px;">${t(`${key}.form.description`)}</label>
            <textarea id="poi-description" class="flex-grow-1 ml-2" rows="2" placeholder="${t(`${key}.form.description`)}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:4px;padding:6px;"></textarea>
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
      offset: [0, 0]
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

    showClickMessage.value = true

    if (isMobile.value) {
      leafletMap.setView(e.latlng, leafletMap.getZoom(), {
        animate: true,
        duration: 0.3
      })
    }
  })
})

onUnmounted(() => {
  leafletMap?.remove()
  leafletMap = null
  _imageOverlay = null
  popupRef?.remove()
  popupRef = null
})

watch(() => props.addPoiMode, (active) => {
  if (leafletMap && leafletMap.getContainer()) {
    leafletMap.getContainer().classList.toggle('add-poi-cursor', active)
  }
}, { immediate: true })
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
</style>
