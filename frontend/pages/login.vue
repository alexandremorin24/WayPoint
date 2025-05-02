<template>
    <v-container class="py-10" max-width="500">
        <v-card class="pa-6" elevation="4">
            <h2 class="text-h5 mb-4">Login</h2>

            <v-form v-model="formValid" @submit.prevent="handleLogin">
                <v-text-field v-model="email" label="Email" type="email" :rules="[rules.required, rules.email]"
                    prepend-inner-icon="mdi-email" />
                <v-text-field v-model="password" label="Password" :type="showPassword ? 'text' : 'password'"
                    :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append="showPassword = !showPassword"
                    :rules="[rules.required]" prepend-inner-icon="mdi-lock" />
                <v-btn class="mt-4" color="primary" type="submit" :disabled="!formValid || isSubmitting" block>
                    Login
                </v-btn>
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
const password = ref('')
const showPassword = ref(false)
const formValid = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

const rules = {
    required: (v: string) => !!v || 'This field is required',
    email: (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email'
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
            throw new Error(data.error || 'Login failed')
        }
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/')
    } catch (err: any) {
        error.value = err.message
    } finally {
        isSubmitting.value = false
    }
}
</script>
