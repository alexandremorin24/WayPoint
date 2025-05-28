<template>
  <div class="language-switcher">
    <select v-model="currentLocale" @change="switchLanguage">
      <option v-for="lang in availableLocales" :key="lang.code" :value="lang.code">
        {{ lang.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
const { locale, locales } = useI18n()
const currentLocale = ref(locale.value)
const availableLocales = computed(() => {
  return locales.value
})

const switchLanguage = () => {
  locale.value = currentLocale.value
}
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  cursor: pointer;
}
</style> 
