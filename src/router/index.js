import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import ItemForm from '../views/ItemForm.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login, meta: { requiresAuth: false } },
    { path: '/items/new', name: 'item-new', component: ItemForm, meta: { requiresAuth: true } },
    { path: '/items/:id/edit', name: 'item-edit', component: ItemForm, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const { state } = useAuth()

  if (to.meta.requiresAuth && !state.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && state.isLoggedIn) {
    return { name: 'home' }
  }
})

export default router
