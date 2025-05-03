<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-4">
          <v-card-title class="text-h4 mb-4">
            {{ $t('navigation.profile') }}
          </v-card-title>

          <v-form @submit.prevent="saveProfile" ref="form">
            <!-- Avatar + Username en ligne -->
            <v-row align="center" class="mb-2">
              <v-col cols="auto">
                <v-avatar
                  size="100"
                  class="cursor-pointer elevation-2"
                  @click="triggerFileInput"
                  style="border: 2px solid #ccc;"
                >
                  <v-img
                    :src="user.photo_url || '/default-avatar.png'"
                    :alt="$t('profile.photo')"
                  />
                </v-avatar>
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/*"
                  class="d-none"
                  @change="handleFileUpload"
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model="user.displayName"
                  :label="$t('auth.username')"
                  disabled
                  class="mb-0"
                />
                <!-- Date de création juste sous le username -->
                <v-text-field
                  :model-value="formatDate(user.created_at)"
                  :label="$t('profile.createdAt')"
                  disabled
                  class="mb-4"
                />
              </v-col>
            </v-row>

            <!-- Email -->
            <v-text-field
              v-model="user.email"
              :label="$t('common.email')"
              :rules="emailRules"
              :error-messages="emailError"
              @input="emailError = ''"
              class="mb-4"
              :disabled="!isEditing"
            />

            <!-- Preferred Language -->
            <v-select
              v-model="user.preferredLanguage"
              :items="availableLanguages"
              :label="$t('profile.language')"
              class="mb-4"
              item-title="title"
              item-value="value"
              :disabled="!isEditing"
            />

            <!-- Email Opt-in -->
            <v-select
              v-model="user.emailOptIn"
              :items="optInOptions"
              :label="$t('profile.emailOptin')"
              class="mb-4"
              :disabled="!isEditing"
            />

            <!-- Section changement de mot de passe, un champ par ligne -->
            <v-divider class="my-4" />
            <div>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="newPassword"
                    :label="$t('profile.newPassword')"
                    type="password"
                    :rules="passwordRules"
                    autocomplete="new-password"
                    :disabled="!isEditing"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="confirmPassword"
                    :label="$t('profile.confirmPassword')"
                    type="password"
                    :rules="confirmPasswordRules"
                    autocomplete="new-password"
                    :disabled="!isEditing"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="currentPassword"
                    :label="$t('profile.currentPassword')"
                    type="password"
                    :rules="passwordRules"
                    autocomplete="current-password"
                    :disabled="!isEditing"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Action Buttons -->
            <v-row>
              <v-col cols="12" class="d-flex justify-end">
                <v-btn
                  v-if="!isEditing"
                  color="secondary"
                  @click="startEdit"
                >
                  {{ $t('profile.edit') }}
                </v-btn>
                <template v-else>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="loading"
                    :disabled="!isFormValid"
                    class="mr-2"
                  >
                    {{ $t('profile.save') }}
                  </v-btn>
                  <v-btn
                    color="secondary"
                    @click="cancelEdit"
                  >
                    {{ $t('common.cancel') }}
                  </v-btn>
                </template>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const form = ref(null);
const fileInput = ref(null);
const loading = ref(false);
const emailError = ref('');
const isEditing = ref(false);
const showPasswordSection = ref(false);

// User data
const user = ref({
  displayName: '',
  email: '',
  photo_url: '',
  preferredLanguage: '',
  emailOptIn: false,
  created_at: null
});

// Pour restaurer les valeurs si on annule
const originalUser = ref({});

// Password fields
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Available languages
const availableLanguages = [
  { title: 'Français', value: 'fr' },
  { title: 'English', value: 'en' }
];

// Opt-in options
const optInOptions = computed(() => [
  { title: t('profile.optinYes'), value: true },
  { title: t('profile.optinNo'), value: false }
]);

// Validation rules
const emailRules = [
  v => !!v || t('errors.required'),
  v => /.+@.+\..+/.test(v) || t('errors.invalidEmail')
];

const passwordRules = [
  v => !v || v.length >= 8 || t('errors.weakPassword'),
  v => !v || /[A-Z]/.test(v) || t('errors.weakPassword'),
  v => !v || /[a-z]/.test(v) || t('errors.weakPassword'),
  v => !v || /[0-9]/.test(v) || t('errors.weakPassword'),
  v => !v || /[!@#$%^&*]/.test(v) || t('errors.weakPassword')
];

const confirmPasswordRules = [
  v => !newPassword.value || v === newPassword.value || t('errors.passwordsDoNotMatch')
];

// Form validation
const isFormValid = computed(() => {
  if (!form.value) return false;
  const { valid } = form.value;
  if (showPasswordSection.value) {
    return valid && currentPassword.value && newPassword.value && confirmPassword.value;
  }
  return valid;
});

// Méthodes
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

const triggerFileInput = () => {
  if (isEditing.value) fileInput.value.click();
};

const handleFileUpload = async (event) => {
  if (!isEditing.value) return;
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    loading.value = true;
    const token = localStorage.getItem('token');
    const response = await fetch('/api/backend/me/avatar', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    const data = await response.json();
    user.value.photo_url = data.photo_url;
  } catch (error) {
    console.error('Error uploading avatar:', error);
  } finally {
    loading.value = false;
  }
};

const startEdit = () => {
  isEditing.value = true;
  originalUser.value = JSON.parse(JSON.stringify(user.value));
};

const cancelEdit = () => {
  isEditing.value = false;
  user.value = JSON.parse(JSON.stringify(originalUser.value));
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  showPasswordSection.value = false;
  emailError.value = '';
};

const saveProfile = async () => {
  if (!isFormValid.value) return;

  try {
    loading.value = true;
    const token = localStorage.getItem('token');
    const response = await fetch('/api/backend/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.value.email,
        preferredLanguage: user.value.preferredLanguage,
        emailOptIn: user.value.emailOptIn,
        ...(showPasswordSection.value && {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
          confirmPassword: confirmPassword.value
        })
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update profile');
    }

    // Reset password fields
    if (showPasswordSection.value) {
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      showPasswordSection.value = false;
    }
    isEditing.value = false;
    // Update localStorage if email changed
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.value.email !== storedUser.email) {
      localStorage.setItem('user', JSON.stringify({ ...storedUser, email: user.value.email }));
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    emailError.value = error.message;
  } finally {
    loading.value = false;
  }
};

// Load user data
const loadUserData = async () => {
  try {
    loading.value = true;
    const token = localStorage.getItem('token');
    const response = await fetch('/api/backend/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load user data');
    }

    const data = await response.json();
    user.value = {
      displayName: data.displayName,
      email: data.email,
      photo_url: data.photoUrl,
      preferredLanguage: data.preferredLanguage || data.language || 'fr',
      emailOptIn: data.emailOptin ?? false,
      created_at: data.created_at || data.createdAt || null
    };
    originalUser.value = JSON.parse(JSON.stringify(user.value));
  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    loading.value = false;
  }
};

// Initialize
loadUserData();
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style> 
