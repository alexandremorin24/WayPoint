<template>
  <v-container>
    <v-card class="mx-auto" max-width="400">
      <v-card-title>Connexion</v-card-title>
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="email"
            label="Email"
            required
          ></v-text-field>
          <v-text-field
            v-model="password"
            label="Mot de passe"
            type="password"
            required
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="login">Se connecter</v-btn>
        <v-btn to="/register">S'inscrire</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const login = () => {
  // TODO: Implémenter la logique de connexion
}
</script> 
