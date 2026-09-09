/**
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} title
 * @property {string|null} imageUrl
 * @property {number|null} cookTimeMinutes
 * @property {string|null} difficulty
 * @property {string|null} description
 * @property {string[]} tags
 * @property {boolean} isFavorite
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {import('./recipeIngredient').RecipeIngredient[]|undefined} ingredients
 * @property {import('./recipeStep').RecipeStep[]|undefined} steps
 */

export {}
