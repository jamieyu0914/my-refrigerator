export function matchesRecipeSearch(recipe, query) {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true

  if (recipe.title.toLowerCase().includes(trimmed)) return true
  return recipe.tags.some((tag) => tag.toLowerCase().includes(trimmed))
}
