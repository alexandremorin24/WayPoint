<template>
  <transition name="slide-panel">
    <div v-if="open" class="category-panel-fixed">
      <!-- Main category panel -->
      <v-card style="overflow-y: auto; min-width: 300px; background: #032040; color: #fff; border-radius: 0 8px 8px 0; border: 1px solid #fff3; border-left: none;">
        <v-card-title class="d-flex align-center justify-space-between text-white font-weight-bold">
          <span v-if="!editingCategory">{{ $t('sidebar.manageCategories') }}</span>
          <span v-else>{{ $t('sidebar.addEditCategory') }}</span>
          <v-btn icon size="small" @click="closePanel" color="info"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text style="padding-top: 0;">
          <!-- Category list view -->
          <template v-if="!editingCategory">
            <v-btn block color="info" class="mb-2 text-white" style="font-weight:600;" @click="startAddCategory">
              <v-icon left>mdi-plus</v-icon>
              {{ $t('sidebar.addCategory') }}
            </v-btn>
            <v-text-field
              v-model="search"
              :placeholder="$t('common.search')"
              dense
              hide-details
              class="mb-2 text-white"
              prepend-inner-icon="mdi-magnify"
              style="background:#061c36;border-radius:4px;color:#fff;"
            />
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
                        <v-icon color="white" size="small" class="mr-2">{{ cat.icon || 'mdi-folder' }}</v-icon>
                        <span class="text-white">{{ cat.name }}</span>
                      </template>
                      <template #append>
                        <v-btn icon size="x-small" variant="plain" @click.stop="startEditCategory(cat)"><v-icon color="white">mdi-pencil</v-icon></v-btn>
                        <v-btn icon size="x-small" variant="plain" @click.stop="deleteCategory(cat)"><v-icon color="white">mdi-delete</v-icon></v-btn>
                      </template>
                    </v-list-item>
                  </template>
                  <!-- Subcategories list -->
                  <v-list-item
                    v-for="sub in getSubcategories(cat.id)"
                    :key="sub.id"
                    class="subcategory-item"
                    density="compact"
                    style="padding: 0 8px;"
                  >
                    <template #title>
                      <v-icon color="white" size="small" class="mr-2">{{ sub.icon || 'mdi-circle-small' }}</v-icon>
                      <span class="subcategory-label text-white">{{ sub.name }}</span>
                    </template>
                    <template #append>
                      <v-btn icon size="x-small" variant="plain" @click.stop="startEditCategory(sub)"><v-icon color="white">mdi-pencil</v-icon></v-btn>
                      <v-btn icon size="x-small" variant="plain" @click.stop="deleteCategory(sub)"><v-icon color="white">mdi-delete</v-icon></v-btn>
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
                :label="$t('sidebar.name')"
                dense
                hide-details
                class="mb-2 text-white"
                style="background:#061c36;border-radius:4px;color:#fff;"
              />
              <v-select
                v-model="editingCategory.parentCategoryId"
                :items="[
                  { value: null, title: $t('sidebar.none') },
                  ...mainCategories
                    .filter(cat => cat.id !== editingCategory?.id)
                    .map(c => ({ value: c.id, title: c.name }))
                ]"
                :label="$t('sidebar.parentCategory')"
                dense
                hide-details
                class="mb-2 text-white"
                style="background:#061c36;border-radius:4px;color:#fff;"
              />
              <!-- Icon and color pickers -->
              <div class="d-flex align-center mb-2 mt-4">
                <span class="mr-2">{{ $t('sidebar.icon') }} :</span>
                <v-menu offset-y>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="small" color="info">
                      <v-icon :icon="getIconForCategory(editingCategory)" />
                    </v-btn>
                  </template>
                  <v-sheet class="pa-2" color="#061c36" style="max-width: 260px;">
                    <div class="d-flex flex-wrap">
                      <v-btn
                        v-for="icon in iconOptions"
                        :key="icon.value"
                        icon
                        size="small"
                        color="info"
                        class="ma-1"
                        @click="editingCategory && (editingCategory.icon = icon.value)"
                      >
                        <v-icon :icon="icon.icon" />
                      </v-btn>
                    </div>
                  </v-sheet>
                </v-menu>
                <span class="ml-4 mr-2">{{ $t('sidebar.color') }} :</span>
                <v-menu offset-y>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon size="small" :style="{ backgroundColor: editingCategory.color || '#0099ff', border: '1px solid #fff3' }">
                      <v-icon color="#fff">mdi-palette</v-icon>
                    </v-btn>
                  </template>
                  <v-sheet class="pa-2" color="#061c36" style="max-width: 260px;">
                    <div class="d-flex flex-wrap">
                      <v-btn
                        v-for="color in colorOptions"
                        :key="color"
                        icon
                        size="small"
                        :style="{ backgroundColor: color, border: '1px solid #fff3', margin: '2px' }"
                        @click="editingCategory.color = color"
                      >
                        <v-icon color="#fff">mdi-checkbox-blank-circle</v-icon>
                      </v-btn>
                    </div>
                  </v-sheet>
                </v-menu>
              </div>
              <!-- Action buttons -->
              <div class="d-flex justify-end mt-4">
                <v-btn class="mr-2" variant="outlined" color="grey" @click="cancelEditCategory">{{ $t('sidebar.cancel') }}</v-btn>
                <v-btn color="secondary" @click="saveCategory">{{ $t('sidebar.save') }}</v-btn>
              </div>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mdiAccount, mdiStar, mdiMapMarker, mdiFolder, mdiHome, mdiFlag, mdiHeart, mdiPaw, mdiSchool, mdiTree, mdiCar, mdiBike, mdiBus, mdiTrain, mdiAirplane, mdiChevronRight } from '@mdi/js'
import type { Category } from '@/types/category'

const props = defineProps<{
  open: boolean
  categories?: Category[]
}>()
const emit = defineEmits(['close', 'add-category'])

const search = ref('')
const editingCategory = ref<Category | null>(null)
const isOpen = ref(false)

const iconOptions = [
  { value: 'mdi-account', icon: mdiAccount },
  { value: 'mdi-star', icon: mdiStar },
  { value: 'mdi-map-marker', icon: mdiMapMarker },
  { value: 'mdi-folder', icon: mdiFolder },
  { value: 'mdi-home', icon: mdiHome },
  { value: 'mdi-flag', icon: mdiFlag },
  { value: 'mdi-heart', icon: mdiHeart },
  { value: 'mdi-paw', icon: mdiPaw },
  { value: 'mdi-school', icon: mdiSchool },
  { value: 'mdi-tree', icon: mdiTree },
  { value: 'mdi-car', icon: mdiCar },
  { value: 'mdi-bike', icon: mdiBike },
  { value: 'mdi-bus', icon: mdiBus },
  { value: 'mdi-train', icon: mdiTrain },
  { value: 'mdi-airplane', icon: mdiAirplane },
]

const colorOptions = [
  '#0099ff', '#2ecc40', '#ff4136', '#ffc300', '#8e44ad', '#e67e22', '#43aa8b', '#0077b6', '#d90429', '#000814'
]

const dummyCategories: Category[] = [
  {
    id: '1',
    mapId: '1',
    name: 'Category 1',
    icon: 'mdi-account',
    color: '#FF0000',
    parentCategoryId: null
  },
  {
    id: '2',
    mapId: '1',
    name: 'Subcategory 1-1',
    icon: 'mdi-star',
    color: '#00FF00',
    parentCategoryId: '1'
  },
  {
    id: '3',
    mapId: '1',
    name: 'Category 2',
    icon: 'mdi-star',
    color: '#0000FF',
    parentCategoryId: null
  }
]

const filteredCategories = computed(() => {
  const cats = props.categories && props.categories.length > 0 ? props.categories : dummyCategories
  if (!search.value) return cats
  return cats.filter(cat =>
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

function closePanel() {
  emit('close')
}
function startAddCategory() {
  editingCategory.value = {
    id: crypto.randomUUID(),
    mapId: '1',
    name: '',
    icon: 'mdi-account',
    parentCategoryId: null
  }
}
function startEditCategory(cat: Category) {
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
function saveCategory() {
  if (!editingCategory.value) return

  // Check if the category has children
  const hasChildren = filteredCategories.value.some(cat => cat.parentCategoryId === editingCategory.value?.id)
  
  // If the category has children, it cannot have a parent
  if (hasChildren && editingCategory.value.parentCategoryId) {
    alert('A parent category cannot have a parent category')
    return
  }

  // TODO: Implement save logic
  editingCategory.value = null
}
function deleteCategory(cat: Category) {
  alert('Delete category: ' + cat.name)
}

const handleCategoryClick = (category: Category) => {
  if (category.parentCategoryId) {
    // This is a subcategory
    console.log('Subcategory clicked:', category.name)
  } else {
    // This is a main category
    console.log('Category clicked:', category.name)
  }
}

const getIconForCategory = (category: Category | null) => {
  if (!category?.icon) return mdiAccount
  return iconOptions.find(i => i.value === category.icon)?.icon || mdiAccount
}

const canBeParent = (category: Category) => {
  return !category.parentCategoryId
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
</style> 
