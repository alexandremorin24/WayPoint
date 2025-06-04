<template>
  <v-dialog
    v-model="show"
    max-width="400"
    class="confirm-dialog"
  >
    <v-card class="confirm-card">
      <v-card-title class="text-white d-flex align-center">
        <v-icon class="mr-2" color="warning">{{ mdiAlert }}</v-icon>
        {{ title }}
      </v-card-title>
      <v-card-text class="text-white">
        {{ message }}
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          class="confirm-no-btn"
          @click="onCancel"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          class="ml-2"
          color="secondary"
          variant="elevated"
          @click="onConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { mdiAlert } from '@mdi/js'

const props = defineProps<{
  modelValue: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const show = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  show.value = newValue
})

watch(show, (newValue) => {
  emit('update:modelValue', newValue)
})

function onConfirm() {
  emit('confirm')
  show.value = false
}

function onCancel() {
  emit('cancel')
  show.value = false
}
</script>

<style scoped>
.confirm-dialog :deep(.v-overlay__content) {
  background: transparent !important;
}

.confirm-card {
  background: #032040 !important;
  border: 1px solid #fff3;
  border-radius: 8px;
}

.confirm-card :deep(.v-card-title) {
  font-size: 1.2rem;
  font-weight: 600;
  padding: 16px;
}

.confirm-card :deep(.v-card-text) {
  padding: 16px;
  font-size: 1rem;
  line-height: 1.5;
}

.confirm-card :deep(.v-card-actions) {
  padding: 16px;
}

.confirm-no-btn {
  border-color: #fff !important;
  color: #fff !important;
}

.confirm-no-btn:hover,
.confirm-no-btn:focus {
  border-color: #fff !important;
  color: #fff !important;
  background: rgba(255,255,255,0.08) !important;
}
</style> 
