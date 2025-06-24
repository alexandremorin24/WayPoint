<template>
  <transition name="slide-panel">
    <div v-if="open" class="invitation-panel-fixed">
      <v-card class="invitation-sidebar-card" style="overflow-y: auto; min-width: 300px; width: 100%; background: #032040; color: #fff; border-radius: 0 8px 8px 0; border: 1px solid #fff3; border-left: none;">
        <v-card-title class="d-flex align-center justify-space-between text-white font-weight-bold">
          <span>Manage collaborators</span>
          <v-btn icon size="small" @click="closePanel" color="info"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text style="padding: 16px;">
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">Invite a collaborator</div>
            <div class="d-flex flex-column gap-2">
              <v-autocomplete
                v-model="selectedUser"
                :items="users"
                :loading="loadingUsers"
                v-model:search="search"
                @update:search="onSearchInput"
                item-title="display_name"
                item-value="id"
                :label="$t('invitationSidebar.searchUser')"
                hide-no-data
                hide-selected
                return-object
                clearable
              >
                <template #prepend-inner>
                  <v-icon :color="isValidEmail(search) ? 'primary' : undefined">
                    {{ isValidEmail(search) ? 'mdi-email' : 'mdi-account-search' }}
                  </v-icon>
                </template>

                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar size="32">
                        <v-img :src="item.raw.avatar_url || '/default-avatar.png'" />
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.display_name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.email }}</v-list-item-subtitle>
                  </v-list-item>
                </template>

                <template #no-data>
                  <v-list-item v-if="isValidEmail(search)">
                    <template #prepend>
                      <v-icon color="primary">mdi-email-plus</v-icon>
                    </template>
                    <v-list-item-title>{{ $t('invitationSidebar.inviteByEmail', { email: search }) }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-else-if="!search || search.length < 2">
                    <v-list-item-title>{{ $t('invitationSidebar.typeMore') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-else>
                    <v-list-item-title>{{ $t('invitationSidebar.noUsers') }}</v-list-item-title>
                    <v-list-item-subtitle>{{ $t('invitationSidebar.tryEmail') }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-autocomplete>
              <div class="d-flex flex-column gap-2">
                <v-select
                  v-model="selectedRole"
                  :items="availableRoles"
                  label="Choose role"
                  hide-details="auto"
                  class="flex-grow-1"
                  density="compact"
                  bg-color="#061c36"
                  variant="outlined"
                  item-title="title"
                  item-value="value"
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title" :subtitle="item.raw.description" />
                  </template>
                </v-select>
                <div v-if="selectedRole" class="text-caption text-grey">
                  {{ availableRoles.find(r => r.value === selectedRole)?.description }}
                </div>
                <v-btn
                  color="warning"
                  :disabled="!isValid"
                  :loading="loading"
                  @click="sendInvitation"
                >
                  Invite
                </v-btn>
              </div>
            </div>
          </div>

          <div class="text-subtitle-1 mb-2">Active collaborators</div>
          <div class="collaborators-list">
            <div v-for="collab in collaborators" :key="collab.userId" class="collaborator-item d-flex align-center justify-space-between py-2">
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-2">
                  <v-img :src="collab.avatar || '/default-avatar.png'" />
                </v-avatar>
                <span class="text-body-1">{{ collab.username }}</span>
              </div>
              <div class="d-flex align-center gap-2">
                <v-select
                  v-model="collab.role"
                  :items="availableRoles"
                  hide-details
                  density="compact"
                  class="role-select"
                  bg-color="#061c36"
                  variant="outlined"
                  @update:model-value="updateCollaboratorRole(collab, $event)"
                />
                <v-btn
                  v-if="collab.username === 'Pierre'"
                  color="error"
                  variant="text"
                  @click="revokeAccess(collab)"
                >
                  Revoke
                </v-btn>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </transition>

  <NotificationPopup
    v-model="showNotification"
    :message="notificationMessage"
    :type="notificationType"
  />

  <ConfirmDialog
    v-model="showConfirmDialog"
    :title="confirmTitle"
    :message="confirmMessage"
    :confirm-text="t('common.yes')"
    :cancel-text="t('common.no')"
    @confirm="confirmAction"
    @cancel="cancelAction"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationPopup from './NotificationPopup.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import type { UserRole } from '@/types/map'

interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
}

interface UserSelection {
  id: string
  type: 'user'
}

interface EmailSelection {
  email: string
  type: 'email'
}

type Selection = UserSelection | EmailSelection

interface Collaborator {
  userId: string
  username: string
  role: UserRole
  avatar?: string
}

const props = defineProps<{
  open: boolean
  mapId: string
  gameId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:collaborators', collaborators: Collaborator[]): void
  (e: 'userSelected', selection: Selection): void
}>()

const { t } = useI18n()

// État local
const selectedUser = ref<User | null>(null)
const selectedRole = ref<UserRole | ''>('')
const loading = ref(false)
const loadingUsers = ref(false)
const collaborators = ref<Collaborator[]>([])
const users = ref<User[]>([])
const search = ref('')

// État pour les notifications et confirmations
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'error' | 'success' | 'info'>('error')
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingAction = ref<(() => Promise<void>) | null>(null)

// Rôles disponibles
const availableRoles = [
  { 
    value: 'editor_all',
    title: t('roles.editor_all'),
    description: t('roles.editor_all_description')
  },
  { 
    value: 'editor_own',
    title: t('roles.editor_own'),
    description: t('roles.editor_own_description')
  },
  { 
    value: 'contributor',
    title: t('roles.contributor'),
    description: t('roles.contributor_description')
  },
  { 
    value: 'viewer',
    title: t('roles.viewer'),
    description: t('roles.viewer_description')
  }
]

// Computed properties
const isValid = computed(() => {
  return selectedUser.value && selectedRole.value
})

// Gestion de la recherche avec debounce
const searchTimeout = ref<NodeJS.Timeout | null>(null)

function onSearchInput(value: string) {
  console.log('[DEBUG] onSearchInput called with:', value)
  
  // Annuler le timeout précédent s'il existe
  if (searchTimeout.value) {
    console.log('[DEBUG] Clearing previous timeout')
    clearTimeout(searchTimeout.value)
  }

  // Si la valeur est vide, on ne fait rien
  if (!value) {
    console.log('[DEBUG] Empty value')
    return
  }

  console.log('[DEBUG] Setting new timeout for search')
  // Attendre avant de lancer la recherche
  searchTimeout.value = setTimeout(() => {
    console.log('[DEBUG] Timeout triggered, calling searchUsers')
    searchUsers(value)
  }, 300)
}

function onClear() {
  selectedUser.value = null
}

async function searchUsers(query: string) {
  console.log('[DEBUG] searchUsers called with:', query)

  if (!query || query.length < 2) {
    console.log('[DEBUG] Query too short, clearing results')
    users.value = []
    return
  }

  loadingUsers.value = true
  try {
    const url = `/api/backend/search?q=${encodeURIComponent(query)}`
    console.log('[DEBUG] Fetching URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    console.log('[DEBUG] Response status:', response.status)
    
    if (!response.ok) {
      console.error('[DEBUG] Response not OK:', await response.text())
      throw new Error('Failed to fetch users')
    }
    
    const data = await response.json()
    console.log('[DEBUG] Search results:', data)
    users.value = data
  } catch (error) {
    console.error('[ERROR] Search failed:', error)
    users.value = []
  } finally {
    loadingUsers.value = false
  }
}

// Méthodes
const closePanel = () => {
  emit('close')
}

const showError = (message: string) => {
  notificationMessage.value = message
  notificationType.value = 'error'
  showNotification.value = true
}

const showSuccess = (message: string) => {
  notificationMessage.value = message
  notificationType.value = 'success'
  showNotification.value = true
}

const updateCollaboratorRole = async (collaborator: Collaborator, newRole: UserRole) => {
  loading.value = true
  try {
    const response = await fetch(`/api/backend/maps/${props.mapId}/users/${collaborator.userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ role: newRole })
    })

    if (!response.ok) throw new Error(t('errors.updateRoleFailed'))
    
    collaborator.role = newRole
    showSuccess(t('success.roleUpdated'))
  } catch (error) {
    console.error('Error updating role:', error)
    showError(t('errors.updateRoleFailed'))
  } finally {
    loading.value = false
  }
}

const revokeAccess = async (collaborator: Collaborator) => {
  confirmTitle.value = t('invitation.confirmRevoke')
  confirmMessage.value = t('invitation.confirmRevokeMessage', { user: collaborator.username })
  pendingAction.value = async () => {
    loading.value = true
    try {
      const response = await fetch(`/api/backend/maps/${props.mapId}/users/${collaborator.userId}/role`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error(t('errors.revokeFailed'))

      collaborators.value = collaborators.value.filter(c => c.userId !== collaborator.userId)
      showSuccess(t('success.accessRevoked'))
    } catch (error) {
      console.error('Error revoking access:', error)
      showError(t('errors.revokeFailed'))
    } finally {
      loading.value = false
    }
  }
  showConfirmDialog.value = true
}

const sendInvitation = async () => {
  if (!selectedUser.value || !selectedRole.value) return

  loading.value = true
  try {
    const response = await fetch(`/api/backend/maps/${props.mapId}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        userId: selectedUser.value.id,
        role: selectedRole.value
      })
    })

    if (!response.ok) throw new Error(t('errors.invitationFailed'))

    showSuccess(t('success.invitationSent'))
    selectedUser.value = null
    selectedRole.value = ''
  } catch (error) {
    console.error('Error sending invitation:', error)
    showError(t('errors.invitationFailed'))
  } finally {
    loading.value = false
  }
}

const confirmAction = async () => {
  if (pendingAction.value) {
    await pendingAction.value()
    showConfirmDialog.value = false
    pendingAction.value = null
  }
}

const cancelAction = () => {
  showConfirmDialog.value = false
  pendingAction.value = null
}

// Chargement initial des collaborateurs
const loadCollaborators = async () => {
  try {
    const response = await fetch(`/api/backend/maps/${props.mapId}/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!response.ok) throw new Error(t('errors.fetchCollaboratorsFailed'))
    collaborators.value = await response.json()
  } catch (error) {
    console.error('Error loading collaborators:', error)
    showError(t('errors.fetchCollaboratorsFailed'))
  }
}

// Gestion de la sélection
watch([selectedUser, search], ([newUser, newSearch]: [User | null, string | null]) => {
  console.log('[DEBUG] Selection changed:', { newUser, newSearch })
  if (newUser) {
    emit('userSelected', { id: newUser.id, type: 'user' })
  } else if (newSearch && isValidEmail(newSearch)) {
    emit('userSelected', { email: newSearch, type: 'email' })
  }
})

// Ajout de la fonction de validation d'email
function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

onMounted(() => {
  loadCollaborators()
})

// Nettoyage
onUnmounted(() => {
  if (pendingAction.value) {
    pendingAction.value = null
  }
})

// Nettoyage du timeout quand le composant est détruit
onBeforeUnmount(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>

<style scoped>
/* Fixed position panel */
.invitation-panel-fixed {
  position: fixed;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  z-index: 999;
  max-width: 500px;
  width: 100%;
}

/* Slide panel animation */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
}
.slide-panel-enter-from {
  transform: translateY(-50%) translateX(100%);
}
.slide-panel-enter-to {
  transform: translateY(-50%) translateX(0);
}
.slide-panel-leave-from {
  transform: translateY(-50%) translateX(0);
}
.slide-panel-leave-to {
  transform: translateY(-50%) translateX(100%);
}

/* Collaborator list styles */
.collaborator-item {
  transition: all 0.2s ease;
}

.collaborator-item:hover {
  background: #061c36;
}

.role-select {
  min-width: 120px;
}

.gap-2 {
  gap: 8px;
}

/* Mobile responsive styles */
@media (max-width: 600px) {
  .invitation-panel-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    transform: none;
    max-width: none;
  }

  .invitation-sidebar-card {
    height: 100vh;
    border-radius: 0 !important;
  }
}
</style>
