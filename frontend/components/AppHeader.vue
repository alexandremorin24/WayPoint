<template>
  <div class="landing-header d-flex align-center justify-end">
    <template v-if="!isLoggedIn">
      <v-btn color="secondary" class="mx-2" variant="flat" :to="localePath('login')">
        {{ $t('common.login') }}
      </v-btn>
      <v-btn color="secondary" class="mx-2" variant="outlined" :to="localePath('register')">
        {{ $t('common.register') }}
      </v-btn>
    </template>

    <template v-else>
      <v-btn color="secondary" class="mx-2" variant="outlined" :to="localePath('/my-maps')">
        {{ $t('navigation.map') }}
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" class="mx-2" color="secondary" variant="flat">
            <svg-icon type="mdi" :path="mdiAccount" class="mr-2" width="20" height="20" />
            {{ user.displayName || 'Profil' }}
          </v-btn>
        </template>

        <v-list>
          <v-list-item :to="localePath('/profil')">
            <v-list-item-title>{{ $t('navigation.profile') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>{{ $t('common.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SvgIcon from '@jamescoyle/vue-icon'
import { mdiAccount } from '@mdi/js'

const localePath = useLocalePath()
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
  window.location.href = localePath('login')
}

onMounted(() => {
  updateUserFromStorage()
  window.addEventListener('storage', updateUserFromStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateUserFromStorage)
})
</script>
