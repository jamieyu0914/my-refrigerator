<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const layouts = {
  default: DefaultLayout,
  auth: AuthLayout,
}

const route = useRoute()
const auth = useAuthStore()
// Logged-out visitors see the login form at "/", which should have no NavBar.
const layout = computed(() =>
  auth.isLoggedIn ? layouts[route.meta.layout] || DefaultLayout : AuthLayout,
)
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
