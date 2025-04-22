<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <v-app>
    <v-app-bar flat color="primary" dark>
      <v-container class="d-flex align-center justify-space-between">
        <RouterLink to="/" class="d-flex align-center text-white text-decoration-none">
          <v-img
            src="@/assets/logo.svg"
            alt="WayPoint logo"
            max-width="40"
            class="me-3"
          />
          <span class="text-h6 font-weight-bold">WayPoint</span>
        </RouterLink>

        <div class="d-flex align-center">
          <RouterLink to="/" class="v-btn" exact>Home</RouterLink>
          <RouterLink to="/login" class="v-btn">Login</RouterLink>
          <RouterLink to="/register" class="v-btn">Register</RouterLink>
        </div>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-8">
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>
