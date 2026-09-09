import { createRouter, createWebHistory } from 'vue-router'
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { requiresAuth: true } },
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
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false, layout: 'auth' },
    },
    { path: '/food/new', name: 'food-new', component: FoodForm, meta: { requiresAuth: true } },
    { path: '/food/:id/edit', name: 'food-edit', component: FoodForm, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'home' }
  }
})

export default router
