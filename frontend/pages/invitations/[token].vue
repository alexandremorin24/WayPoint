<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <!-- Loading state -->
        <v-card v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-4">{{ $t('invitation.loading') }}</div>
        </v-card>

        <!-- Error state -->
        <v-card v-else-if="error" class="text-center pa-4">
          <v-icon size="48" color="error" class="mb-4">mdi-alert-circle</v-icon>
          <div class="text-h6 mb-2">{{ $t('invitation.error') }}</div>
          <div class="text-body-1">{{ error }}</div>
          <v-btn color="primary" class="mt-4" to="/">
            {{ $t('common.backToHome') }}
          </v-btn>
        </v-card>

        <!-- Invitation details and form -->
        <v-card v-else class="pa-4">
          <div class="text-center mb-6">
            <v-icon size="48" color="primary" class="mb-4">mdi-email-check</v-icon>
            <div class="text-h5">{{ $t('invitation.title') }}</div>
          </div>

          <div class="text-body-1 mb-6">
            {{ $t('invitation.description', { 
              inviter: invitation.inviterName,
              map: invitation.mapName,
              game: invitation.gameName
            }) }}
          </div>

          <!-- Existing user -->
          <template v-if="hasAccount">
            <div class="text-body-1 mb-4">
              {{ $t('invitation.existingAccount', { email: invitation.email }) }}
            </div>
            <v-btn
              block
              color="primary"
              :to="'/login?redirect=' + encodeURIComponent('/invitations/' + token + '/accept')"
            >
              {{ $t('auth.login') }}
            </v-btn>
          </template>

          <!-- New user registration -->
          <v-form
            v-else
            ref="form"
            v-model="formValid"
            @submit.prevent="handleSubmit"
          >
            <div class="text-body-1 mb-4">
              {{ $t('invitation.newAccount') }}
            </div>

            <!-- Email (disabled) -->
            <v-text-field
              v-model="invitation.email"
              :label="$t('auth.email')"
              disabled
              outlined
              class="mb-4"
            ></v-text-field>

            <!-- Display name -->
            <v-text-field
              v-model="form.displayName"
              :label="$t('auth.displayName')"
              :rules="[rules.required, rules.displayName]"
              outlined
              @input="errors.displayName = ''"
              :error-messages="errors.displayName"
            ></v-text-field>

            <!-- Password -->
            <v-text-field
              v-model="form.password"
              :label="$t('auth.password')"
              :rules="[rules.required, rules.password]"
              :type="showPassword ? 'text' : 'password'"
              outlined
              @input="errors.password = ''"
              :error-messages="errors.password"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="showPassword = !showPassword"
            ></v-text-field>

            <!-- Confirm password -->
            <v-text-field
              v-model="form.confirmPassword"
              :label="$t('auth.confirmPassword')"
              :rules="[rules.required, rules.confirmPassword]"
              :type="showPassword ? 'text' : 'password'"
              outlined
              @input="errors.confirmPassword = ''"
              :error-messages="errors.confirmPassword"
            ></v-text-field>

            <!-- Action buttons -->
            <div class="d-flex flex-column gap-2">
              <v-btn
                block
                color="primary"
                type="submit"
                :loading="submitting"
                :disabled="!formValid"
              >
                {{ $t('invitation.acceptAndCreate') }}
              </v-btn>

              <v-btn
                block
                color="error"
                text
                @click="rejectInvitation"
                :disabled="submitting"
              >
                {{ $t('invitation.reject') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { t } = useI18n()

// State
const loading = ref(true)
const error = ref(null)
const invitation = ref(null)
const hasAccount = ref(false)
const formValid = ref(false)
const submitting = ref(false)
const showPassword = ref(false)
const form = reactive({
  displayName: '',
  password: '',
  confirmPassword: ''
})
const errors = reactive({
  displayName: '',
  password: '',
  confirmPassword: ''
})

// Form validation rules
const rules = {
  required: v => !!v || 'Ce champ est requis',
  displayName: v => (v && v.length >= 3) || 'Le nom doit faire au moins 3 caractères',
  password: v => (v && v.length >= 8) || 'Le mot de passe doit faire au moins 8 caractères',
  confirmPassword: v => v === form.password || 'Les mots de passe ne correspondent pas'
}

// Get the invitation token from the URL
const token = route.params.token

// Load invitation details
onMounted(async () => {
  try {
    const response = await fetch('/api/backend/invitations/' + token + '/check')
    if (!response.ok) throw new Error('Invalid invitation')
    
    const data = await response.json()
    invitation.value = data.invitation
    hasAccount.value = data.hasAccount
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// Handle form submission
async function handleSubmit() {
  if (!formValid.value) return

  submitting.value = true
  try {
    const response = await fetch('/api/backend/invitations/' + token + '/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'accept',
        registrationData: {
          displayName: form.displayName,
          password: form.password
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const data = await response.json()
    router.push(data.redirectTo)
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}

// Handle invitation rejection
async function rejectInvitation() {
  if (!confirm(t('invitation.confirmReject'))) return

  submitting.value = true
  try {
    const response = await fetch('/api/backend/invitations/' + token + '/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'reject' })
    })

    if (!response.ok) throw new Error('Failed to reject invitation')

    router.push('/')
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}
</script> 
