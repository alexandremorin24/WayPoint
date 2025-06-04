<template>
  <v-snackbar
    v-model="show"
    :color="type"
    :timeout="timeout"
    location="top"
    class="notification-popup"
    :class="type"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-2">{{ icon }}</v-icon>
      {{ message }}
    </div>
    <template v-slot:actions>
      <v-btn
        icon
        variant="text"
        @click="show = false"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { mdiAlertCircle, mdiCheckCircle, mdiInformation } from '@mdi/js'

const props = defineProps<{
  modelValue: boolean
  message: string
  type?: 'error' | 'success' | 'info'
  timeout?: number
}>()

const emit = defineEmits(['update:modelValue'])

const show = ref(props.modelValue)
const timeout = props.timeout || 5000

const icon = computed(() => {
  switch (props.type) {
    case 'error':
      return mdiAlertCircle
    case 'success':
      return mdiCheckCircle
    default:
      return mdiInformation
  }
})

watch(() => props.modelValue, (newValue) => {
  show.value = newValue
})

watch(show, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<style scoped>
.notification-popup {
  background: transparent !important;
}

.notification-popup :deep(.v-snackbar__wrapper) {
  background: #032040 !important;
  border: 1px solid #fff3;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 16px auto;
}

.notification-popup :deep(.v-snackbar__content) {
  color: #fff;
  padding: 12px 16px;
}

.notification-popup.error :deep(.v-snackbar__wrapper) {
  border-left: 4px solid #ff4136;
}

.notification-popup.success :deep(.v-snackbar__wrapper) {
  border-left: 4px solid #2ecc40;
}

.notification-popup.info :deep(.v-snackbar__wrapper) {
  border-left: 4px solid #0099ff;
}

.notification-popup :deep(.v-snackbar__actions) {
  padding-right: 8px;
}

.notification-popup :deep(.v-btn) {
  color: #fff !important;
}
</style> 
