<template>
    <v-container class="py-10" max-width="600">
        <v-card class="pa-6" elevation="4">
            <h2 class="text-h5 mb-4">{{ $t('createMap.title') }}</h2>
            <v-form v-model="formValid" @submit.prevent="handleCreate">
                <v-text-field 
                    v-model="gameName" 
                    :label="$t('createMap.gameName')" 
                    :rules="[rules.required, rules.min, rules.max]" 
                    required
                    @input="debounceFetchPublicMaps" 
                />
                <v-text-field v-model="name" :label="$t('createMap.mapName')" :rules="[rules.required, rules.min, rules.max]" required />
                <v-textarea v-model="description" :label="$t('createMap.description')" :rules="[rules.required, rules.descMax]" required />

                <div v-if="publicMaps.length > 0">
                    <div class="mb-2">{{ $t('createMap.selectOrUpload') }}</div>
                    <v-row>
                        <v-col
                            v-for="map in publicMaps"
                            :key="map.id"
                            cols="6"
                            class="d-flex flex-column align-center"
                        >
                            <v-img
                                :src="backendBase + map.thumbnail_url"
                                :alt="map.name"
                                width="120"
                                height="80"
                                class="mb-1"
                                :class="{'border-primary': selectedMapId === map.id, 'border': true, 'cursor-pointer': true}"
                                @click="selectExistingMap(map.id)"
                            />
                            <v-radio
                                v-model="selectedMapId"
                                :label="map.name"
                                :value="map.id"
                                color="primary"
                            />
                        </v-col>
                    </v-row>
                    <v-divider class="my-2" />
                    <v-radio-group v-model="selectedMapId">
                        <v-radio :label="$t('createMap.uploadNew')" value="upload" />
                    </v-radio-group>
                </div>

                <v-file-input
                    v-if="selectedMapId === 'upload' || publicMaps.length === 0"
                    v-model="imageFile"
                    :label="$t('createMap.mapImage')"
                    accept="image/*"
                    :rules="[rules.required]"
                    required
                />

                <v-btn class="mt-4" color="primary" type="submit" :disabled="!formValid || isSubmitting" block>
                    {{ $t('createMap.create') }}
                </v-btn>
                <v-progress-linear v-if="uploadProgress > 0 && uploadProgress < 100" :value="uploadProgress" class="mt-4" color="primary" height="8">
                  <template #default>
                    <span>{{ uploadProgress }}%</span>
                  </template>
                </v-progress-linear>
                <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
                <v-alert v-if="success" type="success" class="mt-4">{{ $t('createMap.success') }}</v-alert>
            </v-form>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const config = useRuntimeConfig();

const router = useRouter();
const localePath = useLocalePath();
const { t } = useI18n();
const gameName = ref('');
const name = ref('');
const description = ref('');
const imageFile = ref<File | null>(null);
const formValid = ref(false);
const isSubmitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const uploadProgress = ref(0);
const publicMaps = ref<RawMapData[]>([]);
const selectedMapId = ref<string>('upload');
const backendBase = config.public.API_BASE.replace(/\/api\/backend$/, '');

const rules = {
    required: (v: unknown) => !!v || t('errors.required'),
    min: (v: string) => v.length >= 3 || t('errors.invalidUsername'),
    max: (v: string) => v.length <= 100 || t('errors.invalidUsername'),
    descMax: (v: string) => v.length <= 500 || t('errors.invalidUsername'),
};

// Debounce function to avoid too many API calls
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const fetchPublicMaps = async () => {
    publicMaps.value = [];
    selectedMapId.value = 'upload';
    if (!gameName.value) return;
    try {
        const res = await fetch(`${config.public.API_BASE}/maps/public-by-game-name/${encodeURIComponent(gameName.value.trim())}`);
        if (res.ok) {
            publicMaps.value = await res.json();
        }
    } catch (e) {
        console.warn('fetchPublicMaps error', e)
        // Silent fail
    }
};

const debounceFetchPublicMaps = debounce(fetchPublicMaps, 500);

const selectExistingMap = (id: string) => {
    selectedMapId.value = id;
};

const handleCreate = async () => {
    isSubmitting.value = true;
    error.value = null;
    success.value = false;
    uploadProgress.value = 0;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            error.value = t('createMap.mustBeLogged');
            return;
        }
        if ((selectedMapId.value === 'upload' || publicMaps.value.length === 0) && !imageFile.value) {
            error.value = t('createMap.pleaseSelectImage');
            return;
        }
        const formData = new FormData();
        formData.append('gameName', gameName.value.trim());
        formData.append('name', name.value.trim());
        formData.append('description', description.value.trim());
        if (selectedMapId.value !== 'upload' && publicMaps.value.length > 0) {
            formData.append('imageFromMapId', selectedMapId.value);
        } else {
            formData.append('image', imageFile.value!);
        }

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
                    router.push(localePath(`/maps/${data.gameId}/${data.id}`));
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

<style scoped>
.border-primary {
    border: 2px solid #1976d2 !important;
}
.border {
    border: 1px solid #ccc;
}
.cursor-pointer {
    cursor: pointer;
}
:deep(.v-field__input) {
    color: inherit;
}
:deep(.v-field--error .v-field__input) {
    color: #ff5252;
}
:deep(.v-field--error .v-field__outline) {
    color: #ff5252;
}
:deep(.v-field--error .v-label) {
    color: #ff5252;
}
</style>
