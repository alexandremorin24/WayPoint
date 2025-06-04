<template>
  <transition name="slide-panel">
    <div v-if="open" class="category-panel-fixed">
      <!-- Main category panel -->
      <v-card class="category-sidebar-card" style="overflow-y: auto; min-width: 300px; width: 100%; background: #032040; color: #fff; border-radius: 0 8px 8px 0; border: 1px solid #fff3; border-left: none;">
        <v-card-title class="d-flex align-center justify-space-between text-white font-weight-bold">
          <span v-if="!editingCategory">{{ t('sidebar.manageCategories') }}</span>
          <span v-else>
            {{ isNewCategory ? t('sidebar.addCategory') : t('sidebar.editCategory') }}
          </span>
          <v-btn icon size="small" @click="closePanel" color="info"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text style="padding-top: 0;">
          <!-- Category list view -->
          <template v-if="!editingCategory">
            <v-btn block color="info" class="mb-2 text-white" style="font-weight:600;" @click="startAddCategory">
              <v-icon left>mdi-plus</v-icon>
              {{ t('sidebar.addCategory') }}
            </v-btn>
            <v-text-field
              v-model="search"
              :placeholder="t('common.search')"
              dense
              hide-details
              class="mb-2 text-white"
              prepend-inner-icon="mdi-magnify"
              style="background:#061c36;border-radius:4px;color:#fff;"
            />
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-2"
              closable
              @click:close="error = null"
            >
              {{ error }}
            </v-alert>
            <div class="category-list-scroll">
              <v-list density="compact" class="bg-transparent">
                <!-- Main categories with expandable subcategories -->
                <v-list-group
                  v-for="cat in mainCategories"
                  :key="cat.id"
                  v-model="openGroups[cat.id]"
                  class="category-group"
                >
                  <template #activator="{ props, isOpen }">
                    <v-list-item v-bind="props" class="text-white">
                      <template #title>
                        <v-icon
                          class="transition-fast-in-fast-out mr-2"
                          :style="{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease-in-out' }"
                          size="small"
                        >
                          mdi-chevron-right
                        </v-icon>
                        <span :style="{ backgroundColor: cat.color || '#0099ff', borderRadius: '50%', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', boxShadow: '0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25)' }">
                          <v-icon color="white" size="20">{{ cat.icon || 'mdi-folder' }}</v-icon>
                        </span>
                        <span class="text-white">{{ cat.name }}</span>
                      </template>
                      <template #append>
                        <v-btn icon size="x-small" variant="plain" @click.stop="startEditCategory(cat)"><v-icon color="white">mdi-pencil</v-icon></v-btn>
                        <v-btn icon size="x-small" variant="plain" @click.stop="startDeleteCategory(cat)"><v-icon color="white">mdi-delete</v-icon></v-btn>
                      </template>
                    </v-list-item>
                  </template>
                  <!-- Subcategories list -->
                  <v-list-item
                    v-for="sub in getSubcategories(cat.id)"
                    :key="sub.id"
                    class="subcategory-item"
                    density="compact"
                    style="padding: 0 8px; padding-left:45px;"
                  >
                    <template #title>
                      <span :style="{ backgroundColor: sub.color || '#0099ff', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', boxShadow: '0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25)' }">
                        <v-icon color="white" size="18">{{ sub.icon || 'mdi-circle-small' }}</v-icon>
                      </span>
                      <span class="subcategory-label text-white">{{ sub.name }}</span>
                    </template>
                    <template #append>
                      <v-btn icon size="x-small" variant="plain" @click.stop="startEditCategory(sub)"><v-icon color="white">mdi-pencil</v-icon></v-btn>
                      <v-btn icon size="x-small" variant="plain" @click.stop="startDeleteCategory(sub)"><v-icon color="white">mdi-delete</v-icon></v-btn>
                    </template>
                  </v-list-item>
                </v-list-group>
              </v-list>
            </div>
          </template>
          <!-- Category edit form -->
          <template v-else>
            <div class="edit-category-form">
              <v-text-field
                v-model="editingCategory.name"
                :label="t('sidebar.name')"
                dense
                hide-details
                class="mb-2 text-white"
                style="background:#061c36;border-radius:4px;color:#fff;"
              />
              <v-select
                v-model="editingCategory.parentCategoryId"
                :items="[
                  { value: null, title: t('sidebar.none') },
                  ...mainCategories
                    .filter(cat => cat.id !== editingCategory?.id)
                    .map(c => ({ value: c.id, title: c.name }))
                ]"
                :label="t('sidebar.parentCategory')"
                dense
                hide-details
                class="mb-2 text-white"
                style="background:#061c36;border-radius:4px;color:#fff;"
              />
              <!-- Bloc sélecteur icône + couleur côte à côte -->
              <div class="d-flex align-center mb-2 mt-4" style="gap: 18px;">
                <span class="mr-2">{{ t('sidebar.icon') }} :</span>
                <v-btn
                  icon
                  size="large"
                  :style="{
                    backgroundColor: editingCategory?.color || '#0099ff',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    minHeight: '44px',
                    padding: 0
                  }"
                  @click="toggleIconGrid"
                >
                  <v-icon color="white" :icon="editingCategory?.icon || 'mdi-help-circle-outline'" style="text-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25);" />
                </v-btn>
                <span class="ml-4 mr-2">{{ t('sidebar.color') }} :</span>
                <v-btn icon size="small" :style="{ backgroundColor: editingCategory?.color || '#0099ff', border: '1px solid #fff3', width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', borderRadius: '50%', padding: 0 }" @click="toggleColorGrid">
                  <v-icon color="#fff">mdi-palette</v-icon>
                </v-btn>
              </div>
              <!-- Grille d'icônes sous le bloc, dans le flux -->
              <transition name="slide-down">
                <div v-if="showIconGrid">
                  <div class="icon-grid d-flex flex-wrap" style="gap: 8px 4px;">
                    <v-btn
                      v-for="option in markerIconOptions"
                      :key="option.icon"
                      icon
                      size="large"
                      :style="{
                        backgroundColor: editingCategory?.color || '#0099ff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        minHeight: '40px',
                        padding: 0
                      }"
                      @click="selectIcon(option.icon)"
                    >
                      <v-icon color="white" :icon="option.icon" style="text-shadow: 0 0 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.25);" />
                    </v-btn>
                  </div>
                </div>
              </transition>
              <!-- Grille de couleurs sous le bouton Color, dans le flux -->
              <transition name="slide-down">
                <div v-if="showColorGrid">
                  <div class="color-grid d-flex flex-wrap" style="gap: 8px 4px; margin-top: 8px;">
                    <v-btn
                      v-for="color in colorOptions"
                      :key="color"
                      icon
                      size="small"
                      :style="{ backgroundColor: color, border: '1px solid #fff3', width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', borderRadius: '50%', padding: 0 }"
                      @click="editingCategory.color = color; showColorGrid = false"
                    >
                      <v-icon color="#fff" :icon="editingCategory?.icon || 'mdi-help-circle-outline'" />
                    </v-btn>
                    <!-- Bouton couleur personnalisée -->
                    <v-btn icon size="small" :style="{ backgroundColor: editingCategory?.color || '#0099ff', border: '1px solid #fff3', width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', borderRadius: '50%', padding: 0 }" @click="openColorPicker">
                      <v-icon color="#fff">mdi-eyedropper</v-icon>
                      <input ref="colorInputRef" type="color" style="display:none" @input="setCustomColor" />
                    </v-btn>
                  </div>
                </div>
              </transition>
              <!-- Action buttons -->
              <div class="d-flex justify-end mt-4">
                <v-btn class="mr-2" variant="outlined" color="grey" @click="cancelEditCategory">{{ t('sidebar.cancel') }}</v-btn>
                <v-btn color="secondary" @click="saveCategory">{{ t('sidebar.save') }}</v-btn>
              </div>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </div>
  </transition>
  <NotificationPopup
    v-model="showNotification"
    :message="notificationMessage"
    :type="notificationType"
  />
  <ConfirmDialog
    v-model="showConfirmDialog"
    :title="t('sidebar.confirmDelete')"
    :message="confirmMessage"
    :confirm-text="t('sidebar.yes')"
    :cancel-text="t('sidebar.no')"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiAccount, mdiStar, mdiMapMarker, mdiFolder, mdiHome, mdiFlag, mdiHeart, mdiPaw, mdiSchool, mdiTree, mdiCar, mdiBike, mdiBus, mdiTrain, mdiAirplane, mdiChevronRight } from '@mdi/js'
import type { Category, CreateCategory } from '@/types/category'
import { categoryService } from '@/services/categoryService'
import NotificationPopup from './NotificationPopup.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  categories?: Category[]
  mapId: string
}>()
const emit = defineEmits(['close', 'add-category', 'update:categories'])

const search = ref('')
const editingCategory = ref<Category | null>(null)
const isNewCategory = ref(false)
const isOpen = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const colorOptions = [
  '#0099ff', '#2ecc40', '#ff4136', '#ffc300', '#8e44ad', '#e67e22', '#43aa8b', '#0077b6', '#d90429', '#000814', '#f39c12'
]

const markerIconOptions = [
  { icon: 'mdi-sword-cross' },
  { icon: 'mdi-skull-crossbones' },
  { icon: 'mdi-pickaxe' },
  { icon: 'mdi-treasure-chest' },
  { icon: 'mdi-duck' },
  { icon: 'mdi-door' },
  { icon: 'mdi-cart' },
  { icon: 'mdi-note-text-outline' },
  { icon: 'mdi-shield-home' },
  { icon: 'mdi-puzzle' },
  { icon: 'mdi-wall' },
  { icon: 'mdi-flask' }
]

const filteredCategories = computed(() => {
  if (!props.categories) return []
  if (!search.value) return props.categories
  return props.categories.filter(cat =>
    cat.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

const mainCategories = computed(() => {
  return filteredCategories.value.filter(cat => !cat.parentCategoryId)
})

const getSubcategories = (categoryId: string) => {
  return filteredCategories.value.filter(cat => cat.parentCategoryId === categoryId)
}

const openGroups = ref<Record<string, boolean>>({})

watch(filteredCategories, (cats) => {
  cats.forEach(cat => {
    if (!(cat.id in openGroups.value)) openGroups.value[cat.id] = false
  })
}, { immediate: true })

const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'error' | 'success' | 'info'>('error')

const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const categoryToDelete = ref<Category | null>(null)

const showIconGrid = ref(false)
function toggleIconGrid() {
  showIconGrid.value = !showIconGrid.value
  if (showIconGrid.value) showColorGrid.value = false
}
function selectIcon(icon: string) {
  if (editingCategory.value) editingCategory.value.icon = icon
  showIconGrid.value = false
}

const showColorGrid = ref(false)
function toggleColorGrid() {
  showColorGrid.value = !showColorGrid.value
  if (showColorGrid.value) showIconGrid.value = false
}
const colorInputRef = ref<HTMLInputElement | null>(null)
function openColorPicker() { colorInputRef.value?.click() }
function setCustomColor(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (editingCategory.value) editingCategory.value.color = val
  showColorGrid.value = false
}

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
function startAddCategory() {
  isNewCategory.value = true
  editingCategory.value = {
    id: 'temp',
    mapId: props.mapId,
    name: '',
    icon: 'mdi-account',
    parentCategoryId: null
  }
}
function startEditCategory(cat: Category) {
  isNewCategory.value = false
  editingCategory.value = {
    id: cat.id,
    mapId: cat.mapId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    parentCategoryId: cat.parentCategoryId
  }
}
function cancelEditCategory() {
  editingCategory.value = null
}
async function saveCategory() {
  if (!editingCategory.value) return

  // Validate name
  if (!editingCategory.value.name.trim()) {
    showError('Category name is required')
    return
  }

  // Check if the category has subcategories
  const hasChildren = !isNewCategory.value && 
    filteredCategories.value.some(cat => cat.parentCategoryId === editingCategory.value?.id)
  
  // If the category has children, it cannot have a parent
  if (hasChildren && editingCategory.value.parentCategoryId) {
    showError('A parent category cannot have a parent category')
    return
  }

  try {
    loading.value = true

    let updatedCategory: Category
    if (!isNewCategory.value) {
      // Update existing category
      updatedCategory = await categoryService.updateCategory(editingCategory.value.id, {
        name: editingCategory.value.name.trim(),
        icon: editingCategory.value.icon,
        color: editingCategory.value.color,
        parentCategoryId: editingCategory.value.parentCategoryId
      })
    } else {
      // Create new category
      updatedCategory = await categoryService.createCategory(props.mapId, {
        name: editingCategory.value.name.trim(),
        icon: editingCategory.value.icon,
        color: editingCategory.value.color,
        parentCategoryId: editingCategory.value.parentCategoryId,
        mapId: props.mapId
      })
    }

    // Update the categories list
    const updatedCategories = props.categories ? [...props.categories] : []
    const index = updatedCategories.findIndex(c => c.id === updatedCategory.id)
    if (index !== -1) {
      updatedCategories[index] = updatedCategory
    } else {
      updatedCategories.push(updatedCategory)
    }
    emit('update:categories', updatedCategories)

    editingCategory.value = null
    isNewCategory.value = false
    showSuccess(isNewCategory.value ? 'Category created successfully' : 'Category updated successfully')
  } catch (err: any) {
    console.error('Error saving category:', err)
    showError(err.response?.data?.error || 'Failed to save category')
  } finally {
    loading.value = false
  }
}
function startDeleteCategory(cat: Category) {
  // Vérifier si la catégorie a des sous-catégories
  const hasChildren = filteredCategories.value.some(c => c.parentCategoryId === cat.id)
  if (hasChildren) {
    showError(t('sidebar.cannotDeleteParent'))
    return
  }
  categoryToDelete.value = cat
  confirmMessage.value = `${t('sidebar.confirmDeleteMessage')} "${cat.name}"?`
  showConfirmDialog.value = true
}
async function confirmDelete() {
  if (!categoryToDelete.value) return

  try {
    loading.value = true

    await categoryService.deleteCategory(categoryToDelete.value.id)

    // Update the categories list
    const updatedCategories = props.categories?.filter(c => c.id !== categoryToDelete.value?.id) || []
    emit('update:categories', updatedCategories)
    showSuccess('Category deleted successfully')
  } catch (err: any) {
    console.error('Error deleting category:', err)
    showError(err.response?.data?.error || 'Failed to delete category')
  } finally {
    loading.value = false
    categoryToDelete.value = null
  }
}
function cancelDelete() {
  categoryToDelete.value = null
}
</script>

<style scoped>
/* Fixed position panel */
.category-panel-fixed {
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

/* Scrollable category list */
.category-list-scroll {
  max-height: 350px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Category group styling */
.category-group {
  margin-bottom: 8px;
}

/* Subcategory item styling */
.subcategory-item {
  padding-left: 45px !important;
  display: flex;
  align-items: center;
  min-height: 40px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.subcategory-label {
  color: #fff;
  margin-right: 8px;
}

.subcategory-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  margin-right: 8px;
  border: 1px solid #fff3;
  display: inline-block;
}

.subcategory-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

/* Mobile responsive styles */
@media (max-width: 600px) {
  .category-panel-fixed {
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    transform: none !important;
    border-radius: 0 !important;
    border-left: none !important;
    z-index: 4000 !important;
  }
  .category-panel-fixed .v-card {
    width: 100vw !important;
    border-radius: 0 !important;
    height: 100vh !important;
    min-height: 100vh !important;
    max-height: 100vh !important;
  }
}

/* Slide down animation */
.slide-down-enter-active, .slide-down-leave-active {
  transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s;
  overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-down-enter-to, .slide-down-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (min-width: 600px) {
  .category-sidebar-card {
    max-width: 300px;
  }
}
</style> 
