<template>
  <v-container class="py-10" max-width="500">
    <v-card class="pa-6" elevation="4">
      <h2 class="text-h5 mb-4">{{ $t('auth.registerTitle') }}</h2>
      <v-form v-model="formValid" @submit.prevent="handleSubmit">
        <v-text-field 
          v-model="email" 
          :label="$t('common.email')" 
          :rules="[rules.required, rules.email]"
          prepend-inner-icon="mdi-email"
          type="email" 
        />
        <v-text-field 
          v-model="displayName" 
          :label="$t('auth.username')" 
          :rules="[rules.required, rules.displayName]"
          prepend-inner-icon="mdi-account" 
        />
        <v-text-field 
          v-model="password" 
          :label="$t('common.password')" 
          :rules="[rules.required, rules.strongPassword]" 
          :type="showPassword ? 'text' : 'password'"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" 
          prepend-inner-icon="mdi-lock" 
          @click:append="showPassword = !showPassword"
        />
        <v-text-field 
          v-model="confirmPassword" 
          :label="$t('auth.confirmPassword')" 
          :rules="[rules.required, confirmMatch]"
          :type="showPassword ? 'text' : 'password'" 
          prepend-inner-icon="mdi-lock-check" 
        />

        <v-btn 
          class="mt-4" 
          color="primary" 
          type="submit" 
          :disabled="!formValid || isSubmitting" 
          block
        >
          {{ $t('common.register') }}
        </v-btn>

        <v-alert v-if="success" type="success" class="mt-4">
          {{ $t('auth.verificationEmailSent', { email }) }}
        </v-alert>

        <v-alert v-if="error" type="error" class="mt-4">
          {{ error }}
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
const displayName = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const formValid = ref(false)
const isSubmitting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

const rules = {
  required: (v: string) => !!v || t('errors.required'),
  email: (v: string) => /.+@.+\..+/.test(v) || t('errors.invalidEmail'),
  displayName: (v: string) =>
    (!!v && v.length >= 3 && v.length <= 20 && /^[a-zA-Z0-9]+$/.test(v)) ||
    t('errors.invalidUsername'),
  strongPassword: (v: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(v) && v.length >= 8 ||
    t('errors.weakPassword')
}

const confirmMatch = () => {
  return password.value === confirmPassword.value || t('errors.passwordsDoNotMatch')
}

const handleSubmit = async () => {
  isSubmitting.value = true
  error.value = null
  success.value = false
  try {
    const res = await fetch(`${config.public.API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
        confirmPassword: confirmPassword.value,
        displayName: displayName.value
      })
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || t('errors.registrationFailed'))
    }

    success.value = true
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

<style scoped>
:deep(.v-field__input) {
  color: inherit;
}
:deep(.v-field--error .v-field__input),
:deep(.v-field--error .v-field__outline),
:deep(.v-field--error .v-label) {
  color: #ff5252;
}
</style>
