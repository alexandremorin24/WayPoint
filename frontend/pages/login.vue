<template>
  <v-container class="py-10" max-width="500">
    <v-card class="pa-6" elevation="4">
      <h2 class="text-h5 mb-4">{{ $t('auth.loginTitle') }}</h2>

      <v-form v-model="formValid" @submit.prevent="handleLogin">
        <v-text-field 
          v-model="email" 
          :label="$t('common.email')" 
          type="email" 
          :rules="[rules.required, rules.email]"
          prepend-inner-icon="mdi-email" 
        />
        <v-text-field 
          v-model="password" 
          :label="$t('common.password')" 
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required]" 
          prepend-inner-icon="mdi-lock" 
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
          @click:append="showPassword = !showPassword"
        />
        <v-btn class="mt-4" color="primary" type="submit" :disabled="!formValid || isSubmitting" block>
          {{ $t('common.login') }}
        </v-btn>
        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
        </v-alert>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const config = useRuntimeConfig()
const { t } = useI18n()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const formValid = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

const rules = {
  required: (v: string) => !!v || t('errors.required'),
  email: (v: string) => /.+@.+\..+/.test(v) || t('errors.invalidEmail')
}

const handleLogin = async () => {
  isSubmitting.value = true
  error.value = null
  try {
    const res = await fetch(`${config.public.API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || t('errors.loginFailed'))
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/my-maps')
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

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/my-maps')
  }
})
</script>
