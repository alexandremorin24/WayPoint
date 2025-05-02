<template>
    <v-container class="py-10" max-width="500">
        <v-card class="pa-6" elevation="4">
            <h2 class="text-h5 mb-4">Register</h2>
            <v-form v-model="formValid" @submit.prevent="handleSubmit">
                <v-text-field v-model="email" label="Email" :rules="[rules.required, rules.email]"
                    prepend-inner-icon="mdi-email" type="email" />
                <v-text-field v-model="displayName" label="Username" :rules="[rules.required, rules.displayName]"
                    prepend-inner-icon="mdi-account" />
                <v-text-field v-model="password" label="Password" :type="showPassword ? 'text' : 'password'"
                    :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append="showPassword = !showPassword"
                    :rules="[rules.required, rules.strongPassword]" prepend-inner-icon="mdi-lock" />
                <v-text-field v-model="confirmPassword" label="Confirm Password"
                    :type="showPassword ? 'text' : 'password'" :rules="[rules.required, confirmMatch]"
                    prepend-inner-icon="mdi-lock-check" />
                <v-btn class="mt-4" color="primary" type="submit" :disabled="!formValid || isSubmitting" block>
                    Register
                </v-btn>
                <v-alert v-if="success" type="success" class="mt-4">
                    Verification email sent to {{ email }}
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
import { useRouter } from 'vue-router'
const config = useRuntimeConfig()

const router = useRouter()
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
    required: (v: string) => !!v || 'This field is required',
    email: (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email',
    displayName: (v: string) =>
        (!!v && v.length >= 3 && v.length <= 20 && /^[a-zA-Z0-9]+$/.test(v)) ||
        'Username must be 3-20 characters, letters and numbers only',
    strongPassword: (v: string) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(v) && v.length >= 8 ||
        'Password must be 8+ chars with uppercase, lowercase, number and symbol'
}

const confirmMatch = () => {
    return password.value === confirmPassword.value || 'Passwords do not match'
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
            throw new Error(data.error || 'Registration failed')
        }
        success.value = true
    } catch (err: any) {
        error.value = err.message
    } finally {
        isSubmitting.value = false
    }
}
</script>
