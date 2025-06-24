<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
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

        <!-- Confirmation card -->
        <v-card v-else class="pa-6">
          <div class="text-center mb-6">
            <v-icon size="48" color="primary" class="mb-4">mdi-account-multiple</v-icon>
            <div class="text-h5">{{ $t('invitation.confirmTitle') }}</div>
          </div>

          <div class="text-body-1 mb-6">
            {{ $t('invitation.confirmDescription', { 
              owner: invitation.inviterName,
              map: invitation.mapName,
              game: invitation.gameName
            }) }}
          </div>

          <v-card class="mb-6 pa-4" variant="outlined">
            <div class="text-h6 mb-2">{{ $t('invitation.roleTitle', { role: $t(`roles.${invitation.role}`) }) }}</div>
            <div class="text-body-1">{{ $t(`roles.${invitation.role}_description`) }}</div>
            <v-list class="mt-2">
              <v-list-item
                v-for="(permission, index) in $t(`roles.${invitation.role}_permissions`)"
                :key="index"
                prepend-icon="mdi-check"
                class="text-body-2"
              >
                {{ permission }}
              </v-list-item>
            </v-list>
          </v-card>

          <div class="d-flex gap-4">
            <v-btn
              color="primary"
              size="large"
              block
              :loading="submitting"
              @click="handleAccept"
            >
              {{ $t('invitation.accept') }}
            </v-btn>

            <v-btn
              color="error"
              size="large"
              block
              variant="outlined"
              :disabled="submitting"
              @click="handleReject"
            >
              {{ $t('invitation.reject') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useNotification } from '~/composables/useNotification'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { showError, showSuccess } = useNotification()

// State
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const invitation = ref(null)

// Get the invitation token from the URL
const token = route.params.token

onMounted(async () => {
  // Verify that user is logged in
  if (!auth.isAuthenticated) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    return
  }

  try {
    // Fetch invitation details
    const response = await fetch('/api/backend/invitations/' + token + '/check', {
      headers: {
        'Authorization': 'Bearer ' + auth.token
      }
    })
    
    if (!response.ok) throw new Error('Invalid invitation')
    
    const data = await response.json()
    invitation.value = data.invitation
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function handleAccept() {
  submitting.value = true
  try {
    const response = await fetch('/api/backend/invitations/' + token + '/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + auth.token
      },
      body: JSON.stringify({ action: 'accept' })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const data = await response.json()
    showSuccess($t('invitation.accepted'))
    router.push('/maps/' + invitation.value.gameId + '/' + invitation.value.mapId)
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function handleReject() {
  if (!confirm($t('invitation.confirmReject'))) return

  submitting.value = true
  try {
    const response = await fetch('/api/backend/invitations/' + token + '/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + auth.token
      },
      body: JSON.stringify({ action: 'reject' })
    })

    if (!response.ok) throw new Error('Failed to reject invitation')

    showSuccess($t('invitation.rejected'))
    router.push('/explore')
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}
</script> 
