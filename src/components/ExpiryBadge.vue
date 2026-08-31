<script setup>
import { computed } from 'vue'

const props = defineProps({
  expiryDate: { type: String, default: null },
})

const SOON_DAYS = 3

const status = computed(() => {
  if (!props.expiryDate) return 'none'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(props.expiryDate)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= SOON_DAYS) return 'soon'
  return 'ok'
})

const label = computed(() => {
  switch (status.value) {
    case 'expired':
      return '已過期'
    case 'soon':
      return '即將到期'
    case 'ok':
      return props.expiryDate
    default:
      return '未設定到期日'
  }
})
</script>

<template>
  <span class="badge" :class="`badge-${status}`">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-ok {
  background: rgba(48, 164, 108, 0.15);
  color: #1c8a5a;
}

.badge-soon {
  background: rgba(245, 166, 35, 0.18);
  color: #b3720a;
}

.badge-expired {
  background: rgba(229, 72, 77, 0.18);
  color: #c53232;
}

.badge-none {
  background: var(--border);
  color: var(--text);
}

@media (prefers-color-scheme: dark) {
  .badge-ok {
    color: #4ade80;
  }

  .badge-soon {
    color: #fbbf24;
  }

  .badge-expired {
    color: #f87171;
  }
}
</style>
