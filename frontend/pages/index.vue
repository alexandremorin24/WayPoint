<template>
  <div class="snap-container">
    <!-- Hero Section -->
    <section
      id="section-1"
      class="snap-section d-flex flex-column align-center justify-center text-center"
      :style="{ backgroundImage: 'linear-gradient(rgba(0, 29, 61, 0.9), rgba(0, 29, 61, 0.9)), url(/index/hero-bg.jpg)' }"
      style="background-size: cover; background-position: center; color: white; position: relative;"
    >
      <div class="landing-actions d-flex align-center justify-end">
        <v-btn
          color="secondary"
          class="mx-2"
          variant="flat"
          :to="localePath('login')"
        >
          {{ $t('common.login') }}
        </v-btn>
        <v-btn
          color="secondary"
          class="mx-2"
          variant="outlined"
          :to="localePath('register')"
        >
          {{ $t('common.register') }}
        </v-btn>
      </div>
      <v-container class="fill-height d-flex align-center justify-center">
        <v-row class="fill-height d-flex align-center justify-center" justify="center" align="center">
          <v-col cols="12" md="8">
            <v-slide-y-transition>
              <h1 class="text-h2 font-weight-bold mb-4 animate-text">{{ $t('landing.hero.title') }}</h1>
            </v-slide-y-transition>
            <v-fade-transition>
              <p class="text-h6 font-weight-regular mb-8">{{ $t('landing.hero.subtitle') }}</p>
            </v-fade-transition>
            <v-scale-transition>
              <v-btn
                :color="$vuetify.theme.current.colors.secondary"
                size="x-large"
                class="mt-4 animate-btn text-black"
                @click="scrollToSection(2)"
              >
                <v-icon color="black" class="mr-2 text-black">mdi-map-marker</v-icon>
                {{ $t('landing.hero.startButton') }}
              </v-btn>
            </v-scale-transition>
          </v-col>
        </v-row>
      </v-container>
      <div class="scroll-indicator">
        <v-btn
          :color="$vuetify.theme.current.colors.secondary"
          icon
          class="animate-bounce"
          @click="scrollToSection(2)"
        >
          <v-icon color="black">mdi-chevron-down</v-icon>
        </v-btn>
      </div>
    </section>

    <!-- Features Section -->
    <section id="section-2" class="snap-section d-flex align-center justify-center" style="background-color: #001D3D; color: white;">
      <v-container class="fill-height d-flex align-center justify-center">
        <v-slide-y-transition>
          <h2 class="text-h4 font-weight-bold text-center mb-10">{{ $t('landing.features.title') }}</h2>
        </v-slide-y-transition>
        <v-row dense class="fill-height d-flex align-center justify-center">
          <v-col
            v-for="(feature, index) in features"
            :key="index"
            cols="12"
            md="4"
            class="mb-6"
          >
            <v-hover v-slot="{ isHovering, props }">
              <v-card
                v-bind="props"
                :elevation="isHovering === true ? 8 : 2"
                class="feature-card transition-swing"
                color="primary"
              >
                <v-img height="180" :src="feature.image" :alt="feature.title" cover class="mb-4" />
                <v-card-title class="text-h6 font-weight-bold">{{ feature.title }}</v-card-title>
                <v-card-text>{{ feature.description }}</v-card-text>
                <v-fade-transition>
                  <template v-if="isHovering">
                    <v-overlay :model-value="true" contained scrim="primary" class="align-center justify-center">
                      <v-btn color="secondary" variant="text">{{ $t('landing.features.learnMore') }}</v-btn>
                    </v-overlay>
                  </template>
                </v-fade-transition>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Community Section -->
    <section id="section-3" class="snap-section d-flex align-center justify-center" style="background-color: #003566; color: white;">
      <v-container class="fill-height d-flex align-center justify-center">
        <v-slide-y-transition>
          <h2 class="text-h4 font-weight-bold text-center mb-10">{{ $t('landing.community.title') }}</h2>
        </v-slide-y-transition>
        <v-carousel
          cycle
          height="400"
          hide-delimiter-background
          show-arrows="hover"
          class="rounded-lg"
        >
          <v-carousel-item v-for="(map, i) in communityMaps" :key="i">
            <v-sheet height="100%" class="d-flex align-center justify-center">
              <v-img :src="map.image" height="100%" cover class="rounded-lg">
                <template #placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="grey-lighten-4" />
                  </v-row>
                </template>
                <div class="fill-height d-flex flex-column justify-end pa-4 map-overlay">
                  <h3 class="text-h5 font-weight-bold mb-2">{{ map.title }}</h3>
                  <p class="text-subtitle-1">{{ map.description }}</p>
                </div>
              </v-img>
            </v-sheet>
          </v-carousel-item>
        </v-carousel>
      </v-container>
    </section>

    <!-- Call to Action Section -->
    <section id="section-4" class="snap-section d-flex align-center justify-center text-center" style="background-color: #000814; color: white; position: relative;">
      <v-container class="fill-height d-flex align-center justify-center">
        <v-row justify="center" class="fill-height d-flex align-center justify-center">
          <v-col cols="12" md="8">
            <v-slide-y-transition>
              <h2 class="text-h4 font-weight-bold mb-6">{{ $t('landing.cta.title') }}</h2>
            </v-slide-y-transition>
            <v-scale-transition>
              <v-btn
                color="secondary"
                size="x-large"
                class="elevation-2 text-black animate-btn"
                @click="navigateToCreate"
              >
                <v-icon class="mr-2">mdi-plus-circle</v-icon>
                {{ $t('landing.cta.button') }}
              </v-btn>
            </v-scale-transition>
          </v-col>
        </v-row>
      </v-container>
      <footer class="landing-footer">
        <span>&copy; {{ new Date().getFullYear() }} WayPoint &mdash; {{ $t('landing.footer') }}</span>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">

import { useI18n } from 'vue-i18n'
const localePath = useLocalePath()
const router = useRouter()
const { t } = useI18n()

definePageMeta({
  layout: 'landing'
})

const features = [
  {
    title: t('landing.features.upload.title'),
    description: t('landing.features.upload.description'),
    image: '/index/placeholder.png'
  },
  {
    title: t('landing.features.poi.title'),
    description: t('landing.features.poi.description'),
    image: '/index/placeholder.png'
  },
  {
    title: t('landing.features.collaborate.title'),
    description: t('landing.features.collaborate.description'),
    image: '/index/placeholder.png'
  }
]

const communityMaps = [
  {
    title: 'Elden Ring World Map',
    description: 'Complete map of the Lands Between with all boss locations',
    image: '/index/placeholder.png'
  },
  {
    title: 'Zelda: Tears of the Kingdom',
    description: 'Interactive map of Hyrule with shrines and koroks',
    image: '/index/placeholder.png'
  },
  {
    title: "Baldur's Gate 3",
    description: 'Map of Faer\u00fbn with quest locations and secrets',
    image: '/index/placeholder.png'
  }
]

function scrollToSection(sectionNumber: number) {
  const section = document.getElementById(`section-${sectionNumber}`)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' })
  }
}

function navigateToCreate() {
  router.push(localePath('/maps/create'))
}
</script>

<style scoped>
/* Styles identiques à ta version précédente */
.snap-container {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.snap-section {
  scroll-snap-align: start;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
}
.feature-card {
  transition: transform 0.3s ease;
}
.feature-card:hover {
  transform: translateY(-5px);
}
.map-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
}
.animate-text {
  animation: fadeInUp 1s ease-out;
}
.animate-btn {
  animation: pulse 2s infinite;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
.animate-bounce {
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.transition-swing {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.landing-actions {
  position: absolute;
  top: 0;
  right: 0;
  padding: 2rem 2.5rem 0 0;
  z-index: 10;
}
@media (max-width: 600px) {
  .landing-actions {
    padding: 1rem 1rem 0 0;
  }
}
.landing-footer {
  width: 100vw;
  text-align: center;
  color: #fff;
  background: transparent;
  font-size: 1rem;
  position: absolute;
  left: 0;
  bottom: 0;
  padding-bottom: 1.5rem;
  z-index: 5;
}
</style>
