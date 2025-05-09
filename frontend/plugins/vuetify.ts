import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import type { ThemeDefinition } from 'vuetify'

const customTheme: ThemeDefinition = {
    dark: false,
    colors: {
        primary: '#001D3D',      // bleu foncé
        secondary: '#FFC300',    // jaune
        accent: '#003566',       // bleu moyen
        background: '#000814',   // presque noir
        surface: '#FFFFFF',      // blanc
        info: '#0077b6',        // bleu clair
        error: '#d90429',        // rouge
        success: '#43aa8b',      // vert
    },
}

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({
        components,
        directives,
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: {
                mdi,
            },
        },
        theme: {
            defaultTheme: 'customTheme',
            themes: {
                customTheme,
            },
        },
    })
    nuxtApp.vueApp.use(vuetify)
}) 
