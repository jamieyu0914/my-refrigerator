import { config } from '@vue/test-utils'

// vue-router's components are registered globally via app.use(router), which test mounts never
// install - without this, any view/component that renders <RouterLink>/<RouterView> logs a
// "Failed to resolve component" warning on every test, even though the test still passes.
// Per-mount `global.stubs` in an individual test still overrides these when it needs to.
config.global.stubs = {
  // A plain `true` stub never invokes the default slot, so any text/content inside
  // <RouterLink>...</RouterLink> across the app would show as uncovered even though it's
  // exercised in real usage - render it through so link content stays covered.
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: true,
}
