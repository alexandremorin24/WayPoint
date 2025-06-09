<template>
  <v-container class="py-10" max-width="500">
    <v-card class="pa-6" elevation="4">
      <h2 class="text-h5 mb-4">{{ $t('auth.resetPasswordRequestTitle') }}</h2>
      <p class="mb-4">{{ $t('auth.resetPasswordRequestDescription') }}</p>

      <v-form v-model="formValid" @submit.prevent="handleSubmit">
        <v-text-field 
          v-model="email" 
          :label="$t('common.email')" 
          type="email" 
          :rules="[rules.required, rules.email]"
          prepend-inner-icon="mdi-email" 
        />
        <v-btn 
          class="mt-4" 
          color="primary" 
          type="submit" 
          :disabled="!formValid || isSubmitting" 
          block
        >
          {{ $t('auth.resetPasswordRequest') }}
        </v-btn>
        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
        </v-alert>
        <v-alert v-if="success" type="success" class="mt-4">
          {{ success }}
        </v-alert>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const config = useRuntimeConfig()
const { t } = useI18n()

const email = ref('')
const formValid = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const rules = {
  required: (v: string) => !!v || t('errors.required'),
  email: (v: string) => /.+@.+\..+/.test(v) || t('errors.invalidEmail')
}

const handleSubmit = async () => {
  isSubmitting.value = true
  error.value = null
  success.value = null

  try {
    const res = await fetch(`${config.public.API_BASE}/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || t('errors.unknown'))
    }

    success.value = t('auth.resetPasswordRequestSuccess')
    email.value = ''
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = t('errors.unknown')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script> 
