<template>
  <client-only>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10">
          <v-card class="pa-4">
            <v-card-title class="text-h4 mb-4">
              {{ $t('myMaps.title') }}
            </v-card-title>

            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-progress-circular v-if="loading" indeterminate color="primary" class="my-8" />

            <v-row v-if="!loading && maps.length">
              <v-col v-for="map in maps" :key="map.id" cols="12" sm="6" md="4" lg="3">
                <v-card class="mb-4">
                  <NuxtLink :to="`/maps/${map.gameId}/${map.id}`">
                    <v-img :src="getMapImage(map)" height="180px" cover />
                  </NuxtLink>
                  <v-card-title>{{ map.name }}</v-card-title>
                  <v-card-subtitle>{{ formatDate(map.updatedAt ?? map.createdAt) }}</v-card-subtitle>
                  <v-card-text>{{ map.description }}</v-card-text>
                  <v-card-actions>
                    <v-btn color="primary" @click="goToMap(map.id, map.gameId)">
                      {{ $t('common.edit') }}
                    </v-btn>
                    <v-btn color="error" variant="outlined" @click="openDeleteDialog(map)">
                      {{ $t('common.delete') }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>

            <v-alert v-else-if="!loading && !maps.length" type="info">
              {{ $t('myMaps.noMaps') }}
            </v-alert>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="deleteDialog" max-width="500">
        <v-card>
          <v-card-title class="text-h5">
            {{ $t('myMaps.deleteTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert type="warning" class="mb-2">
              {{ $t('myMaps.deleteWarning') }}
            </v-alert>
            <div class="mb-2">
              {{ $t('myMaps.deleteExplain') }}
            </div>
            <v-text-field
              v-model="deleteConfirmText"
              :label="$t('myMaps.deleteLabel')"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="grey" variant="outlined" @click="closeDeleteDialog">
              {{ $t('common.cancel') }}
            </v-btn>
            <v-btn
              :color="deleteConfirmText === 'delete' ? 'red' : 'grey'"
              :disabled="deleteConfirmText !== 'delete'"
              @click="confirmDeleteMap"
            >
              {{ $t('common.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </client-only>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { MapData } from '@/types'
import { transformMap, type RawMapData } from '@/utils/transform'

const { t } = useI18n()
const router = useRouter()

const maps = ref<MapData[]>([])
const mapToDelete = ref<MapData | null>(null)

const loading = ref(true)
const error = ref('')
const deleteDialog = ref(false)
const deleteConfirmText = ref('')

// ✅ Format de date lisible
function formatDate(date?: string) {
  return date ? new Date(date).toLocaleDateString() : ''
}

// ✅ Gestion image avec fallback
function getMapImage(map: MapData) {
  return map.thumbnailUrl || map.imageUrl || '/default-map.png'
}

// ✅ Redirection vers la carte
function goToMap(mapId: string, gameId: string) {
  router.push(`/maps/${gameId}/${mapId}`)
}

// ✅ Suppression carte
function openDeleteDialog(map: MapData) {
  mapToDelete.value = map
  deleteConfirmText.value = ''
  deleteDialog.value = true
}
function closeDeleteDialog() {
  deleteDialog.value = false
  mapToDelete.value = null
  deleteConfirmText.value = ''
}

async function confirmDeleteMap() {
  if (!mapToDelete.value || deleteConfirmText.value !== 'delete') return
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const res = await fetch(`/api/backend/maps/${mapToDelete.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(t('errors.deleteFailed'))
    maps.value = maps.value.filter(m => m.id !== mapToDelete.value!.id)
    closeDeleteDialog()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('errors.unknown')
  } finally {
    loading.value = false
  }
}

// ✅ Chargement cartes personnelles
async function fetchMyMaps(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const meRes = await fetch('/api/backend/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!meRes.ok) {
      if (meRes.status === 403) {
        router.push('/login')
        return
      }
      throw new Error(t('errors.fetchProfileFailed'))
    }

    const me: { id: string } = await meRes.json()

    const mapsRes = await fetch(`/api/backend/maps/owner/${me.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!mapsRes.ok) throw new Error(t('errors.fetchMapsFailed'))

    const raw: RawMapData[] = await mapsRes.json()
    maps.value = raw.map(transformMap).sort((a, b) =>
      new Date(b.updatedAt ?? b.createdAt).getTime() -
      new Date(a.updatedAt ?? a.createdAt).getTime()
    )
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('errors.unknown')
  } finally {
    loading.value = false
  }
}

onMounted(fetchMyMaps)
</script>
