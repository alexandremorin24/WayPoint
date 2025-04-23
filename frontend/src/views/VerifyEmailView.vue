<template>
    <v-container class="py-10 text-center" max-width="600">
      <v-card class="pa-6" elevation="4">
        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        />
  
        <v-icon v-if="status === 'success'" color="success" size="48">mdi-check-circle</v-icon>
        <v-icon v-if="status === 'error'" color="error" size="48">mdi-alert-circle</v-icon>
  
        <h2 class="text-h6 font-weight-bold mt-4">
          {{ message }}
        </h2>
  
        <v-btn v-if="status === 'success'" class="mt-6" to="/login" color="primary">
          Go to Login
        </v-btn>
      </v-card>
    </v-container>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  
  const route = useRoute()
  const status = ref('loading')
  const message = ref('Verifying your email...')
  const loading = ref(true)
  
  onMounted(async () => {
    const token = route.query.token
  
    if (!token) {
      status.value = 'error'
      message.value = 'Missing verification token'
      loading.value = false
      return
    }
  
    try {
      const res = await fetch(`/api/verify-email?token=${token}`)
      const data = await res.json()
  
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired token')
      }
  
      status.value = 'success'
      message.value = 'Your email has been verified. You can now log in!'
    } catch (err) {
      status.value = 'error'
      message.value = err.message
    } finally {
      loading.value = false
    }
  })
  </script>
  