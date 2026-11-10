import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

const auth = vi.hoisted(() => ({ isLoggedIn: false }))

vi.mock('../../stores/auth', () => ({ useAuthStore: () => auth }))

// Views are irrelevant to routing - stub each with a text marker so none of them load for real.
const stub = vi.hoisted(() => (text) => ({ default: { render: () => text } }))
vi.mock('../../views/Home.vue', () => stub('HOME'))
vi.mock('../../views/Login.vue', () => stub('LOGIN'))
vi.mock('../../views/Refrigerator.vue', () => stub('REFRIGERATOR'))
vi.mock('../../views/ShoppingList.vue', () => stub('SHOPPING'))
vi.mock('../../views/Recipes.vue', () => stub('RECIPES'))
vi.mock('../../views/RecipeDetail.vue', () => stub('DETAIL'))
vi.mock('../../views/RecipeForm.vue', () => stub('RECIPE_FORM'))
vi.mock('../../views/Favorites.vue', () => stub('FAVORITES'))
vi.mock('../../views/Promotions.vue', () => stub('PROMOTIONS'))
vi.mock('../../views/FoodForm.vue', () => stub('FOOD_FORM'))
vi.mock('../../views/ScanFood.vue', () => stub('SCAN'))

import router from '../index'

function mountEntry() {
  const entry = router.getRoutes().find((route) => route.name === 'home').components.default
  return mount({ render: () => h(entry) })
}

describe('router', () => {
  beforeEach(async () => {
    auth.isLoggedIn = true
    await router.push('/refrigerator')
    auth.isLoggedIn = false
    await router.push('/')
  })

  it('shows the login form at "/" while logged out, without leaving the root URL', () => {
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(mountEntry().text()).toBe('LOGIN')
  })

  it('shows the home dashboard at "/" once logged in', () => {
    auth.isLoggedIn = true

    expect(mountEntry().text()).toBe('HOME')
  })

  it('sends logged-out visitors from a protected page back to "/" with no query', async () => {
    await router.push('/recipes')

    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('lets logged-in users open protected pages', async () => {
    auth.isLoggedIn = true
    await router.push('/recipes')

    expect(router.currentRoute.value.name).toBe('recipes')
  })

  it('redirects the old /login URL to "/"', async () => {
    await router.push('/login')

    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})
