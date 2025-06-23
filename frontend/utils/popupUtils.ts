import type { Category } from '@/types/category'
import type { POIData } from '@/types/poi'
import type { Popup, LatLng } from 'leaflet'
import type { Composer } from 'vue-i18n'
import type { UserRoleData } from '@/types/map'
import { poiService } from '@/services/poiService'

type TranslationFunction = (key: string) => string
type Translator = Composer | TranslationFunction | { t: TranslationFunction }

export const POPUP_STYLES = {
  offset: [0, 12] as [number, number],
  width: 400,
  backgroundColor: '#002040',
  textColor: '#fff'
}

export const POPUP_CONFIG = {
  closeButton: false,
  className: 'poi-popup',
  offset: [0, 5] as [number, number]
}

// Utility function for date formatting
export function formatPoiDate(date: Date): string {
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Template for action buttons
export function createActionsTemplate() {
  return `
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
  `
}

// Template for the popup content
export function createPoiPopupTemplate(poi: POIData, translator: Translator) {
  const t = typeof translator === 'function' ? translator : translator.t.bind(translator)
  return `
    <div style="background:${POPUP_STYLES.backgroundColor};color:${POPUP_STYLES.textColor};border-radius:0;padding:0;width:${POPUP_STYLES.width}px;">
      ${poi.imageUrl ? `
        <div style="position:relative;">
          <img src="${poi.imageUrl}" style="width:100%;height:200px;object-fit:cover;border-radius:0;cursor:pointer;" onclick="window.open('${poi.imageUrl}', '_blank')">
          ${createActionsTemplate()}
        </div>
      ` : createActionsTemplate()}
      <div style="padding:16px;">
        <h3 style="margin:0 0 8px 0;font-size:1.1rem;">${poi.name}</h3>
        ${poi.description ? `<p style="margin:0;font-size:0.9rem;color:#ccc;max-height:125px;overflow:auto;">${poi.description}</p>` : ''}
        <div class="poi-metadata" style="display:none;margin-top:12px;font-size:0.8rem;color:#888;text-align:right;">
          <div>${t('poi.created')} ${formatPoiDate(new Date(poi.createdAt || ''))} ${t('poi.by')} ${poi.creator?.username || t('common.unknown')}</div>
          ${poi.updatedAt !== poi.createdAt ? `<div>${t('poi.updated')} ${formatPoiDate(new Date(poi.updatedAt || ''))} ${t('poi.by')} ${poi.updater?.username || t('common.unknown')}</div>` : ''}
        </div>
      </div>
    </div>
  `
}

export function createPopup(L: typeof import('leaflet'), content: string, latlng: LatLng): Popup {
  return L.popup(POPUP_CONFIG)
    .setContent(content)
    .setLatLng(latlng)
}

export interface PopupManager {
  createPoiPopup: (poi: POIData) => string;
  createFormPopup: (poi: POIData | null, categories: Category[]) => string;
  setupPoiEvents: (element: HTMLElement, poi: POIData, onEdit: () => void, onDelete: () => void, onClose: () => void) => void;
  setupFormEvents: (element: HTMLElement, onSave: () => void, onCancel: () => void) => void;
}

export function createPopupManager(translator: Translator): PopupManager {
  const t = typeof translator === 'function' ? translator : translator.t.bind(translator)
  return {
    createPoiPopup(poi: POIData): string {
      return createPoiPopupTemplate(poi, t)
    },

    createFormPopup(poi: POIData | null, categories: Category[]): string {
      return createPoiFormTemplate(poi, categories, t)
    },

    setupPoiEvents(element: HTMLElement, poi: POIData, onEdit: () => void, onDelete: () => void, onClose: () => void) {
      setupPoiEvents(element, poi, onEdit, onDelete, onClose)
    },

    setupFormEvents(element: HTMLElement, onSave: () => void, onCancel: () => void) {
      setupFormEvents(element, onSave, onCancel)
    }
  }
}

// Template for the POI form
export function createPoiFormTemplate(poi: POIData | null = null, categories: Category[] = [], translator: Translator) {
  const t = typeof translator === 'function' ? translator : translator.t.bind(translator)
  const categoriesOptions = categories.map(cat =>
    `<option value="${cat.id}" ${poi && cat.id === poi.categoryId ? 'selected' : ''}>${cat.name}</option>`
  ).join('')

  return `
    <form class="poi-form" style="background:${POPUP_STYLES.backgroundColor};color:${POPUP_STYLES.textColor};border-radius:0;padding:20px;">
      <input type="hidden" id="should-delete-image" value="false" />
      <div class="d-flex flex-column">
        <div class="d-flex flex-row align-center mb-2">
          <span style="font-weight:bold;font-size:1.2rem;">${poi ? t('poi.form.editTitle') : t('poi.form.title')}</span>
        </div>
        <div class="mb-3"><hr style="border:0;border-top:1px solid #335;"></hr></div>

        <div class="d-flex flex-row align-center mb-2">
          <label for="poi-name" style="width:90px;min-width:90px;">${t('poi.form.name')}</label>
          <input id="poi-name" class="flex-grow-1 ml-2" type="text" value="${poi?.name || ''}" placeholder="${t('poi.form.name')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;" />
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
            <input id="poi-image" type="file" accept="image/*" class="file-input" style="position:absolute;width:100%;height:100%;top:0;left:0;opacity:0;cursor:pointer;z-index:1;" />
            <div class="upload-placeholder d-flex flex-column align-center justify-center pa-4" style="padding:16px;${poi?.imageUrl ? 'display:none;' : ''}">
              <span style="color:#ccc;">${t('poi.form.uploadPlaceholder')}</span>
              <small style="color:#888;">${t('poi.form.uploadHint')}</small>
            </div>
            <div class="image-preview" style="display:${poi?.imageUrl ? 'block' : 'none'};">
              <img src="${poi?.imageUrl || ''}" alt="Preview" id="image-preview" style="width:100%;height:150px;object-fit:cover;border-radius:0;" />
              <button type="button" class="remove-image" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:0;background:rgba(0,0,0,0.5);color:#fff;border:none;cursor:pointer;font-size:16px;z-index:2;">×</button>
            </div>
          </div>
        </div>

        <div class="d-flex flex-row align-center mb-2">
          <label for="poi-description" style="width:90px;min-width:90px;">${t('poi.form.description')}</label>
          <textarea id="poi-description" class="flex-grow-1 ml-2" rows="2" placeholder="${t('poi.form.description')}" style="background:#001428;color:#fff;border:1px solid #335;border-radius:0;padding:6px;">${poi?.description || ''}</textarea>
        </div>

        <div class="d-flex flex-row justify-end gap-2 mt-4">
          <button type="button" class="cancel-btn" style="background:#335;color:#fff;border:none;border-radius:0;padding:8px 16px;cursor:pointer;">${t('common.cancel')}</button>
          <button type="button" class="save-btn" style="background:#FFD600;color:#002040;font-weight:bold;border:none;border-radius:0;padding:8px 16px;cursor:pointer;">${t('common.save')}</button>
        </div>
      </div>
    </form>
  `
}

// Form events configuration
export function setupFormEvents(
  formElement: HTMLElement,
  onSave: () => void,
  onCancel: () => void
) {
  // Image upload handling
  const fileInput = formElement.querySelector('.file-input') as HTMLInputElement
  const imagePreview = formElement.querySelector('#image-preview') as HTMLImageElement
  const previewContainer = formElement.querySelector('.image-preview') as HTMLElement
  const uploadPlaceholder = formElement.querySelector('.upload-placeholder') as HTMLElement
  const removeImageBtn = formElement.querySelector('.remove-image') as HTMLButtonElement
  const shouldDeleteImage = formElement.querySelector('#should-delete-image') as HTMLInputElement

  if (fileInput && imagePreview && previewContainer && uploadPlaceholder) {
    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          imagePreview.src = e.target?.result as string
          previewContainer.style.display = 'block'
          uploadPlaceholder.style.display = 'none'
          shouldDeleteImage.value = 'false'
        }
        reader.readAsDataURL(file)
      }
    })

    // Image deletion button handling
    removeImageBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      fileInput.value = ''
      imagePreview.src = ''
      previewContainer.style.display = 'none'
      uploadPlaceholder.style.display = 'block'
      shouldDeleteImage.value = 'true'
    })
  }

  // Button handling
  formElement.querySelector('.cancel-btn')?.addEventListener('click', onCancel)
  formElement.querySelector('.save-btn')?.addEventListener('click', onSave)
}

// POI events configuration
export function setupPoiEvents(
  popupElement: HTMLElement,
  poi: POIData,
  onEdit: () => void,
  onDelete: () => void,
  onClose: () => void
) {
  const actionsDiv = popupElement.querySelector('.poi-actions') as HTMLElement
  const metadataDiv = popupElement.querySelector('.poi-metadata') as HTMLElement
  if (!actionsDiv || !metadataDiv) return

  // Permissions check
  checkUserPermissions(poi).then(hasPermission => {
    if (hasPermission) {
      actionsDiv.style.display = 'flex'
      metadataDiv.style.display = 'block'
    }
  })

  // Events setup
  const editBtn = popupElement.querySelector('.edit-btn')
  const deleteBtn = popupElement.querySelector('.delete-btn')
  const closeBtn = popupElement.querySelector('.close-btn')

  editBtn?.addEventListener('click', onEdit)
  deleteBtn?.addEventListener('click', onDelete)
  closeBtn?.addEventListener('click', onClose)
}

// User permissions check
async function checkUserPermissions(poi: POIData): Promise<boolean> {
  const roleData = await poiService.checkPermissions(poi.mapId) as UserRoleData | null
  if (!roleData) return false

  return roleData.role === 'owner' ||
    roleData.role === 'editor_all' ||
    (roleData.role === 'editor_own' && poi.creatorId === roleData.userId)
} 
