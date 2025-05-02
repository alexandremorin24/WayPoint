<template>
    <v-container class="py-10" max-width="600">
        <v-card class="pa-6" elevation="4">
            <h2 class="text-h5 mb-4">Create a New Map</h2>
            <v-form v-model="formValid" @submit.prevent="handleCreate">
                <v-text-field v-model="name" label="Name" :rules="[rules.required, rules.min, rules.max]" required />
                <v-textarea v-model="description" label="Description" :rules="[rules.required, rules.descMax]"
                    required />
                <v-text-field v-model="imageUrl" label="Image URL" :rules="[rules.required, rules.url]" required />
                <v-checkbox v-model="isPublic" label="Public map?" :true-value="true" :false-value="false" />
                <v-btn class="mt-4" color="primary" type="submit" :disabled="!formValid || isSubmitting" block>
                    Create Map
                </v-btn>
                <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
                <v-alert v-if="success" type="success" class="mt-4">Map created successfully!</v-alert>
            </v-form>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const config = useRuntimeConfig();

const router = useRouter();
const name = ref('');
const description = ref('');
const imageUrl = ref('');
const isPublic = ref(false);
const formValid = ref(false);
const isSubmitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const rules = {
    required: (v: string) => !!v || 'This field is required',
    min: (v: string) => v.length >= 3 || 'Minimum 3 characters',
    max: (v: string) => v.length <= 100 || 'Maximum 100 characters',
    descMax: (v: string) => v.length <= 500 || 'Maximum 500 characters',
    url: (v: string) => /^https?:\/\/.+\..+/.test(v) || 'Must be a valid URL',
};

const handleCreate = async () => {
    isSubmitting.value = true;
    error.value = null;
    success.value = false;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            error.value = 'You must be logged in to create a map.';
            return;
        }
        const res = await fetch(`${config.public.API_BASE}/maps`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: name.value.trim(),
                description: description.value.trim(),
                imageUrl: imageUrl.value.trim(),
                isPublic: isPublic.value,
            }),
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to create map');
        }
        success.value = true;
        setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
        error.value = err.message;
    } finally {
        isSubmitting.value = false;
    }
};
</script>
