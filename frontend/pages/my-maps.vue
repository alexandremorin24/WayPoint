<template>
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
                <v-img :src="getMapImage(map)" height="180px" cover />
                <v-card-title>{{ map.name }}</v-card-title>
                <v-card-subtitle>{{ map.game_name }}</v-card-subtitle>
                <v-card-subtitle>{{ formatDate(map.updated_at || map.created_at) }}</v-card-subtitle>
                <v-card-text>{{ map.description }}</v-card-text>
                <v-card-actions>
                  <v-btn color="primary" @click="goToMap(map.id, map.game_id)">{{ $t('common.edit') }}</v-btn>
                  <v-btn color="error" variant="outlined" @click="openDeleteDialog(map)">{{ $t('common.delete') }}</v-btn>
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
          <v-text-field v-model="deleteConfirmText" :label="$t('myMaps.deleteLabel')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="outlined" @click="closeDeleteDialog">{{ $t('common.cancel') }}</v-btn>
          <v-btn :color="deleteConfirmText === 'delete' ? 'red' : 'grey'" :disabled="deleteConfirmText !== 'delete'" @click="confirmDeleteMap" >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
const maps = ref([]);
const loading = ref(true);
const error = ref('');

const deleteDialog = ref(false);
const mapToDelete = ref(null);
const deleteConfirmText = ref('');

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

function getMapImage(map) {
  return map.thumbnail_url || map.image_url || '/default-map.png';
}

function goToMap(id, gameId) {
  router.push(`/maps/${gameId}/${id}`);
}

function openDeleteDialog(map) {
  mapToDelete.value = map;
  deleteConfirmText.value = '';
  deleteDialog.value = true;
}

function closeDeleteDialog() {
  deleteDialog.value = false;
  mapToDelete.value = null;
  deleteConfirmText.value = '';
}

async function confirmDeleteMap() {
  if (!mapToDelete.value || deleteConfirmText.value !== 'delete') return;
  try {
    loading.value = true;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/backend/maps/${mapToDelete.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erreur lors de la suppression.');
    maps.value = maps.value.filter(m => m.id !== mapToDelete.value.id);
    closeDeleteDialog();
  } catch (e) {
    error.value = e.message || 'Erreur inconnue.';
  } finally {
    loading.value = false;
  }
}

async function fetchMyMaps() {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    // Get current user
    const meRes = await fetch('/api/backend/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!meRes.ok) throw new Error('Unable to fetch user profile.');
    const me = await meRes.json();
    // Get user's maps
    const mapsRes = await fetch(`/api/backend/maps/owner/${me.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!mapsRes.ok) throw new Error('Unable to fetch your maps.');
    const data = await mapsRes.json();
    maps.value = Array.isArray(data) ? data.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)) : [];
  } catch (e) {
    error.value = e.message || 'Unknown error.';
  } finally {
    loading.value = false;
  }
}

fetchMyMaps();
</script> 
