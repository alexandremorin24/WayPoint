<template>
  <div class="mobile-poi-form" :class="{ visible: showMobileForm }">
    <div class="form-header">
      <h2>{{ $t('poi.form.title') }}</h2>
      <v-btn icon @click="$emit('cancel')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <form class="poi-form" @submit.prevent="$emit('save', formData)">
      <div class="form-content">
        <div class="form-field">
          <label for="poi-name">{{ $t('poi.form.name') }}</label>
          <input 
            id="poi-name" 
            v-model="formData.name" 
            type="text" 
            :placeholder="$t('poi.form.name')"
            required
          />
        </div>

        <div class="form-field">
          <label for="poi-category">{{ $t('poi.form.category') }}</label>
          <select 
            id="poi-category" 
            v-model="formData.categoryId"
            required
          >
            <option value="">{{ $t('poi.form.chooseCategory') }}</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="form-field">
          <label for="poi-image">{{ $t('poi.form.image') }}</label>
          <div 
            class="image-upload"
            @click="triggerFileInput"
          >
            <input 
              ref="fileInput"
              id="poi-image" 
              type="file" 
              accept="image/*" 
              class="file-input"
              @change="handleFileChange"
            />
            <div v-if="!imagePreview" class="upload-placeholder">
              <span>{{ $t('poi.form.uploadPlaceholder') }}</span>
              <small>{{ $t('poi.form.uploadHint') }}</small>
            </div>
            <div v-else class="image-preview">
              <img :src="imagePreview" alt="Preview" />
              <button 
                type="button" 
                class="remove-image"
                @click.stop="removeImage"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="form-field">
          <label for="poi-description">{{ $t('poi.form.description') }}</label>
          <textarea 
            id="poi-description" 
            v-model="formData.description"
            :placeholder="$t('poi.form.description')"
            rows="2"
          ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <v-btn 
          color="error" 
          variant="text" 
          @click="$emit('cancel')"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn 
          color="primary" 
          type="submit"
          :loading="loading"
        >
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { Category } from '@/types/category'

const props = defineProps<{
  categories: Category[]
  loading?: boolean
  showMobileForm: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save', data: any): void
  (e: 'category-change', category: Category): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)

const formData = reactive({
  name: '',
  description: '',
  categoryId: '',
  imageFile: null as File | null
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    formData.imageFile = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  formData.imageFile = null
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

watch(() => formData.categoryId, (newCategoryId) => {
  const selectedCategory = props.categories.find(cat => cat.id === newCategoryId)
  if (selectedCategory) {
    emit('category-change', selectedCategory)
  }
})
</script>

<style scoped>
.mobile-poi-form {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50vh;
  background: #002040;
  color: white;
  z-index: 4000;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  pointer-events: none;
  opacity: 0;
}

.mobile-poi-form.visible {
  transform: translateY(0);
  pointer-events: auto;
  opacity: 1;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #335;
}

.form-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  background: #001428;
  color: white;
  border: 1px solid #335;
}

.form-field textarea {
  min-height: 80px;
  resize: vertical;
}

.image-upload {
  position: relative;
  border: 2px dashed #335;
  border-radius: 4px;
  min-height: 80px;
  cursor: pointer;
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

.upload-placeholder {
  padding: 16px;
  text-align: center;
  color: #ccc;
}

.upload-placeholder small {
  display: block;
  color: #888;
  margin-top: 4px;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 150px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #335;
}
</style> 
