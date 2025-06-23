<template>
  <NotificationPopup
    v-model="show"
    :message="message"
    :type="type"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NotificationPopup from './NotificationPopup.vue'

const show = ref(false)
const message = ref('')
const type = ref<'error' | 'success' | 'info'>('error')

// Public interface for the notification system
const notificationSystem = {
  showError(msg: string) {
    message.value = msg
    type.value = 'error'
    show.value = true
    console.error('Error:', msg)
  },

  showSuccess(msg: string) {
    message.value = msg
    type.value = 'success'
    show.value = true
  },

  showInfo(msg: string) {
    message.value = msg
    type.value = 'info'
    show.value = true
  }
}

// Expose the public interface
defineExpose(notificationSystem)
</script> 
