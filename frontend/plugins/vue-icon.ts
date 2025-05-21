import { defineNuxtPlugin } from '#app'
import SvgIcon from '@jamescoyle/vue-icon'

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.vueApp.component('SvgIcon', SvgIcon)
})
