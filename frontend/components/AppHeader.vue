<template>
  <div class="landing-header d-flex align-center justify-end">
    <div class="header-btns d-flex align-center">
      <v-btn 
        class="header-btn text-uppercase font-weight-bold" 
        :to="'/'" 
        variant="outlined"
        color="secondary"
        min-width="110"
        min-height="38"
        rounded="lg"
        bg-color="primary"
      >
        {{ $t('navigation.home').toUpperCase() }}
      </v-btn>
      <v-btn 
        class="header-btn text-uppercase font-weight-bold" 
        :to="'/explore'" 
        variant="outlined"
        color="secondary"
        min-width="110"
        min-height="38"
        rounded="lg"
        bg-color="primary"
      >
        {{ $t('navigation.explore').toUpperCase() }}
      </v-btn>
      <v-btn 
        class="header-btn text-uppercase font-weight-bold" 
        :to="'/maps/create'" 
        variant="outlined"
        color="secondary"
        min-width="110"
        min-height="38"
        rounded="lg"
        bg-color="primary"
      >
        {{ $t('navigation.create').toUpperCase() }}
      </v-btn>
      <template v-if="!isLoggedIn">
        <v-btn 
          class="header-btn text-uppercase font-weight-bold" 
          :to="'/login'" 
          variant="outlined"
          color="secondary"
          min-width="110"
          min-height="38"
          rounded="lg"
          bg-color="primary"
        >
          {{ $t('common.login').toUpperCase() }}
        </v-btn>
        <v-btn 
          class="header-btn text-uppercase font-weight-bold" 
          :to="'/register'" 
          variant="outlined"
          color="secondary"
          min-width="110"
          min-height="38"
          rounded="lg"
          bg-color="primary"
        >
          {{ $t('common.register').toUpperCase() }}
        </v-btn>
      </template>
      <template v-else>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="header-btn profile-btn text-uppercase font-weight-bold"
              color="secondary"
              variant="flat"
              min-width="110"
              min-height="38"
              rounded="lg"
            >
              <svg-icon type="mdi" :path="mdiAccount" class="mr-2" width="20" height="20" />
              {{ user.displayName || 'Profile' }}
            </v-btn>
          </template>
          <v-list class="profile-menu-list">
            <v-list-item :to="'/my-maps'" class="profile-menu-item text-uppercase font-weight-bold">
              <v-list-item-title class="font-weight-bold">{{ $t('navigation.map').toUpperCase() }}</v-list-item-title>
            </v-list-item>
            <v-list-item :to="'/profil'" class="profile-menu-item text-uppercase font-weight-bold">
              <v-list-item-title class="font-weight-bold">{{ $t('navigation.profile').toUpperCase() }}</v-list-item-title>
            </v-list-item>
            <v-divider class="profile-menu-divider"></v-divider>
            <v-list-item @click="logout" class="profile-menu-item text-uppercase font-weight-bold">
              <v-list-item-title class="font-weight-bold">{{ $t('common.logout').toUpperCase() }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiAccount } from '@mdi/js'

const isLoggedIn = ref(false)
const user = ref<{ displayName: string }>({ displayName: '' })

function updateUserFromStorage() {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  isLoggedIn.value = !!token
  try {
    user.value = userData ? JSON.parse(userData) : { displayName: '' }
  } catch {
    user.value = { displayName: '' }
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

onMounted(() => {
  updateUserFromStorage()
  window.addEventListener('storage', updateUserFromStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateUserFromStorage)
})
</script>

<style scoped>
.landing-header {
  background-color: transparent;
  padding: 16px 24px 16px 0;
}

.header-btns {
  gap: 16px;
}

.header-btn:not(.profile-btn) {
  background-color: rgb(var(--v-theme-primary)) !important;
}

.header-btn:hover, .header-btn:focus {
  background: rgb(var(--v-theme-secondary)) !important;
  color: rgb(var(--v-theme-primary)) !important;
  border-color: rgb(var(--v-theme-secondary)) !important;
}

.profile-menu-list {
  background: rgb(var(--v-theme-primary)) !important;
  border: 2px solid rgb(var(--v-theme-secondary)) !important;
  border-radius: 12px !important;
  margin-top: 16px !important;
}

.profile-menu-item {
  color: rgb(var(--v-theme-secondary)) !important;
  border-radius: 8px;
  margin: 0 8px;
}

.profile-menu-item:hover, .profile-menu-item:focus {
  background: rgb(var(--v-theme-secondary)) !important;
  color: rgb(var(--v-theme-primary)) !important;
}

.profile-menu-divider {
  border-color: rgb(var(--v-theme-secondary)) !important;
  margin: 0;
}

.profile-menu-list .v-list-item {
  min-height: 35px !important;
}
</style>
