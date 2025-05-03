<template>
    <v-container class="py-10" max-width="600">
        <v-card class="pa-6" elevation="4">
            <h2 class="text-h5 mb-4">Create a New Map</h2>
            <v-form v-model="formValid" @submit.prevent="handleCreate">
                <v-text-field v-model="gameName" label="Game Name" :rules="[rules.required, rules.min, rules.max]" required />
                <v-text-field v-model="name" label="Map Name" :rules="[rules.required, rules.min, rules.max]" required />
                <v-textarea v-model="description" label="Description" :rules="[rules.required, rules.descMax]" required />
                <v-file-input v-model="imageFile" label="Map Image" accept="image/*" :rules="[rules.required]" required />
                <v-checkbox v-model="isPublic" label="Public map?" :true-value="true" :false-value="false" />
                <v-btn class="mt-4" color="primary" type="submit" :disabled="!formValid || isSubmitting" block>
                    Create Map
                </v-btn>
                <v-progress-linear v-if="uploadProgress > 0 && uploadProgress < 100" :value="uploadProgress" class="mt-4" color="primary" height="8">
                  <template #default>
                    <span>{{ uploadProgress }}%</span>
                  </template>
                </v-progress-linear>
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
const gameName = ref('');
const name = ref('');
const description = ref('');
const imageFile = ref<File | null>(null);
const isPublic = ref(false);
const formValid = ref(false);
const isSubmitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const uploadProgress = ref(0);

const rules = {
    required: (v: unknown) => !!v || 'This field is required',
    min: (v: string) => v.length >= 3 || 'Minimum 3 characters',
    max: (v: string) => v.length <= 100 || 'Maximum 100 characters',
    descMax: (v: string) => v.length <= 500 || 'Maximum 500 characters',
};

const handleCreate = async () => {
    isSubmitting.value = true;
    error.value = null;
    success.value = false;
    uploadProgress.value = 0;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            error.value = 'You must be logged in to create a map.';
            return;
        }
        if (!imageFile.value) {
            error.value = 'Please select an image.';
            return;
        }
        const formData = new FormData();
        formData.append('gameName', gameName.value.trim());
        formData.append('name', name.value.trim());
        formData.append('description', description.value.trim());
        formData.append('isPublic', String(isPublic.value));
        formData.append('image', imageFile.value);

        // Use XMLHttpRequest to track upload progress
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${config.public.API_BASE}/maps`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    uploadProgress.value = Math.round((event.loaded / event.total) * 100);
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.responseText);
                    success.value = true;
                    router.push(`/maps/${data.gameId}/${data.id}`);
                    resolve();
                } else {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        reject(new Error(data.error || 'Failed to create map'));
                    } catch {
                        reject(new Error('Failed to create map'));
                    }
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            error.value = err.message;
        } else {
            error.value = 'An unknown error occurred.';
        }
    } finally {
        isSubmitting.value = false;
        uploadProgress.value = 0;
    }
};
</script>
