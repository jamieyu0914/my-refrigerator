import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'
import { useAuthStore } from '../stores/auth'
import Home from '../views/Home.vue'
import Refrigerator from '../views/Refrigerator.vue'
import ShoppingList from '../views/ShoppingList.vue'
import Recipes from '../views/Recipes.vue'
import RecipeDetail from '../views/RecipeDetail.vue'
import RecipeForm from '../views/RecipeForm.vue'
import Favorites from '../views/Favorites.vue'
import Promotions from '../views/Promotions.vue'
import Login from '../views/Login.vue'
import FoodForm from '../views/FoodForm.vue'
import ScanFood from '../views/ScanFood.vue'

// "/" is the app's front door: logged-out visitors see the login form right there (the URL
// stays at the site root), logged-in users see the home dashboard.
const Entry = {
  name: 'Entry',
  setup() {
    const auth = useAuthStore()
    return () => h(auth.isLoggedIn ? Home : Login)
  },
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Entry },
    {
      path: '/refrigerator',
      name: 'refrigerator',
      component: Refrigerator,
      meta: { requiresAuth: true },
    },
    {
      path: '/shopping-list',
      name: 'shopping-list',
      component: ShoppingList,
      meta: { requiresAuth: true },
    },
    { path: '/recipes', name: 'recipes', component: Recipes, meta: { requiresAuth: true } },
    {
      path: '/recipes/new',
      name: 'recipe-new',
      component: RecipeForm,
      meta: { requiresAuth: true },
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: RecipeDetail,
      meta: { requiresAuth: true },
    },
    {
      path: '/recipes/:id/edit',
      name: 'recipe-edit',
      component: RecipeForm,
      meta: { requiresAuth: true },
    },
    { path: '/favorites', name: 'favorites', component: Favorites, meta: { requiresAuth: true } },
    {
      path: '/promotions',
      name: 'promotions',
      component: Promotions,
      meta: { requiresAuth: true },
    },
    // Old bookmarks: the login form now lives at the root.
    { path: '/login', redirect: { name: 'home' } },
    { path: '/food/new', name: 'food-new', component: FoodForm, meta: { requiresAuth: true } },
    { path: '/food/:id/edit', name: 'food-edit', component: FoodForm, meta: { requiresAuth: true } },
    { path: '/scan', name: 'scan', component: ScanFood, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Logged out: every protected page falls back to "/", which shows the login form.
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'home' }
  }
})

export default router
