import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import type { ThemeDefinition } from 'vuetify'

const customTheme: ThemeDefinition = {
    dark: false,
    colors: {
        primary: '#001D3D',      // dark blue
        secondary: '#FFC300',    // yellow
        accent: '#000814',       // medium blue
        background: '#003566',   // almost black
        surface: '#FFFFFF',      // white   
        info: '#0077b6',        // light blue
        error: '#d90429',        // red
        success: '#43aa8b',      // green
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
