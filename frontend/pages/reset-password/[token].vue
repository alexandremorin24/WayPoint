<template>
  <v-container class="py-10" max-width="500">
    <v-card class="pa-6" elevation="4">
      <h2 class="text-h5 mb-4">{{ $t('auth.resetPasswordTitle') }}</h2>

      <v-form v-model="formValid" @submit.prevent="handleSubmit">
        <v-text-field 
          v-model="password" 
          :label="$t('auth.newPassword')" 
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required, rules.password]"
          prepend-inner-icon="mdi-lock" 
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
          @click:append="showPassword = !showPassword"
        />
        <v-text-field 
          v-model="confirmPassword" 
          :label="$t('auth.confirmNewPassword')" 
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required, rules.confirmPassword]"
          prepend-inner-icon="mdi-lock" 
        />
        <v-btn 
          class="mt-4" 
          color="primary" 
          type="submit" 
          :disabled="!formValid || isSubmitting" 
          block
        >
          {{ $t('auth.resetPassword') }}
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'

const config = useRuntimeConfig()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const formValid = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const token = ref<string | null>(null)

const rules = {
  required: (v: string) => !!v || t('errors.required'),
  password: (v: string) => {
    if (!v) return t('errors.required')
    if (v.length < 8) return t('errors.weakPassword')
    if (!/[A-Z]/.test(v)) return t('errors.weakPassword')
    if (!/[a-z]/.test(v)) return t('errors.weakPassword')
    if (!/[0-9]/.test(v)) return t('errors.weakPassword')
    if (!/[!@#$%^&*]/.test(v)) return t('errors.weakPassword')
    return true
  },
  confirmPassword: (v: string) => {
    if (!v) return t('errors.required')
    if (v !== password.value) return t('errors.passwordsDoNotMatch')
    return true
  }
}

onMounted(async () => {
  token.value = route.params.token as string
  if (!token.value) {
    error.value = t('errors.invalidToken')
    return
  }

  try {
    const res = await fetch(`${config.public.API_BASE}/password-reset/validate/${token.value}`)
    if (!res.ok) {
      throw new Error(t('errors.invalidToken'))
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.invalidToken')
  }
})

const handleSubmit = async () => {
  if (!token.value) return

  isSubmitting.value = true
  error.value = null
  success.value = null

  try {
    const res = await fetch(`${config.public.API_BASE}/password-reset/reset/${token.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || t('errors.unknown'))
    }

    success.value = t('auth.resetPasswordSuccess')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
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
