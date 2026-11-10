<script setup>
import { computed } from 'vue'

const props = defineProps({
  promotion: { type: Object, required: true },
  adding: { type: Boolean, default: false },
  added: { type: Boolean, default: false },
})

const emit = defineEmits(['add-to-shopping-list'])

const BADGE_LABELS = {
  price_drop: '🔻 降價',
  discount_price: '🏷️ 折後價',
  deep_discount: '💯 下殺',
}

const discountPercent = computed(() =>
  props.promotion.discountRate ? Math.round(props.promotion.discountRate * 100) : null,
)

const isPxmartMega = computed(() => props.promotion.storeSource === '大全聯')
</script>

<template>
  <article class="promotion-card">
    <span class="promotion-thumb">
      <img v-if="promotion.imageUrl" :src="promotion.imageUrl" :alt="promotion.name" loading="lazy" />
      <span v-else class="promotion-thumb-fallback">🏷️</span>
    </span>
    <div class="promotion-info">
      <p class="promotion-source">
        <span class="store-source" :class="{ mega: isPxmartMega }">{{ promotion.storeSource }}</span>
        <span class="promotion-category">{{ promotion.category }}</span>
      </p>
      <h3>{{ promotion.name }}</h3>
      <p class="promotion-badges">
        <span v-for="badge in promotion.badges" :key="badge" class="badge" :class="badge">
          {{ BADGE_LABELS[badge] }}
        </span>
      </p>
      <p class="promotion-price">
        <strong>${{ promotion.salePrice }}</strong>
        <s v-if="promotion.marketPrice">${{ promotion.marketPrice }}</s>
        <span v-if="discountPercent" class="discount">-{{ discountPercent }}%</span>
      </p>
      <p v-if="promotion.referencePrice" class="reference-price">
        先前 30 天均價 ${{ promotion.referencePrice }}
      </p>
      <div class="promotion-actions">
        <a :href="promotion.productUrl" target="_blank" rel="noopener noreferrer">查看商品</a>
        <button
          type="button"
          :disabled="adding || added"
          @click="emit('add-to-shopping-list', promotion)"
        >
          {{ added ? '已加入採買清單' : '加入採買清單' }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.promotion-card {
  display: flex;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}

.promotion-thumb {
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.promotion-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.promotion-thumb-fallback {
  font-size: 32px;
}

.promotion-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.promotion-info h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  color: var(--text-h);
  overflow-wrap: anywhere;
}

.promotion-info p {
  margin: 0;
}

.promotion-source {
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.store-source {
  padding: 1px 8px;
  border-radius: 999px;
  background: #e8f1ff;
  color: #1d4ed8;
}

.store-source.mega {
  background: #fff1e6;
  color: #c2410c;
}

.promotion-category {
  color: var(--text);
}

.promotion-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--border);
  color: var(--text-h);
}

.badge.price_drop {
  background: #fde2e2;
  color: #b91c1c;
}

.promotion-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.promotion-price strong {
  font-size: 18px;
  color: #c53232;
}

.promotion-price s {
  font-size: 13px;
  color: var(--text);
}

.discount {
  font-size: 13px;
  color: #c53232;
}

.reference-price {
  font-size: 12px;
  color: var(--text);
}

.promotion-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.promotion-actions a,
.promotion-actions button {
  min-height: 44px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font-size: 14px;
  text-decoration: none;
}

.promotion-actions button {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.promotion-actions button:disabled {
  opacity: 0.6;
}

@media (prefers-color-scheme: dark) {
  .store-source {
    background: #1e3a8a;
    color: #dbeafe;
  }

  .store-source.mega {
    background: #7c2d12;
    color: #ffedd5;
  }

  .badge.price_drop {
    background: #7f1d1d;
    color: #fee2e2;
  }
}
</style>
