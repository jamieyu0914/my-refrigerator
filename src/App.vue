<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const layouts = {
  default: DefaultLayout,
  auth: AuthLayout,
}

const route = useRoute()
const layout = computed(() => layouts[route.meta.layout] || DefaultLayout)
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
