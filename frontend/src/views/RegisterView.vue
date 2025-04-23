<template>
  <v-container class="py-10" max-width="500">
    <v-card class="pa-6" elevation="4">
      <h2 class="text-h5 mb-4">Create your WayPoint account</h2>

      <v-form v-model="formValid" @submit.prevent="handleSubmit">
        <!-- Email -->
        <v-text-field
          v-model="email"
          label="Email"
          :rules="[rules.required, rules.email]"
          prepend-inner-icon="mdi-email"
          type="email"
        />

        <!-- Display Name -->
        <v-text-field
          v-model="displayName"
          label="Nickname"
          :rules="[rules.required, rules.displayName]"
          prepend-inner-icon="mdi-account"
        />

        <!-- Password -->
        <v-text-field
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPassword = !showPassword"
          :rules="[rules.required, rules.strongPassword]"
          prepend-inner-icon="mdi-lock"
        />

        <!-- Confirm Password -->
        <v-text-field
          v-model="confirmPassword"
          label="Confirm Password"
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required, confirmMatch]"
          prepend-inner-icon="mdi-lock-check"
        />

        <v-btn
          class="mt-4"
          color="primary"
          type="submit"
          :disabled="!formValid || isSubmitting"
          block
        >
          Create Account
        </v-btn>

        <v-alert
          v-if="success"
          type="success"
          class="mt-4"
        >
          A verification email has been sent to {{ email }}.
        </v-alert>

        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
        >
          {{ error }}
        </v-alert>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

// Fields
const email = ref('')
const displayName = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const formValid = ref(false)
const isSubmitting = ref(false)
const success = ref(false)
const error = ref(null)

// Validation rules
const rules = {
  required: v => !!v || 'This field is required',
  email: v => /.+@.+\..+/.test(v) || 'Enter a valid email',
  displayName: v =>
    (!!v && v.length >= 3 && v.length <= 20 && /^[a-zA-Z0-9]+$/.test(v)) ||
    'Nickname must be 3-20 characters, letters and numbers only',
  strongPassword: v =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(v) && v.length >= 8 ||
    'Password must be 8+ chars with uppercase, lowercase, number and symbol'
}

// Confirm password validator (not in rules because reactive)
const confirmMatch = () => {
  return password.value === confirmPassword.value || 'Passwords do not match'
}

// Handle form submission
const handleSubmit = async () => {
  isSubmitting.value = true
  error.value = null
  success.value = false

  try {
    const res = await fetch('/api/register', {
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
      throw new Error(data.error || 'Registration failed')
    }

    success.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>
