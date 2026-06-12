<template>
  <div class="relative inline-block">
    <div
        @mouseenter="(e) => { showTooltip = true; updateTooltipPosition(e) }"
        @mouseleave="showTooltip = false"
        class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[13px] font-medium cursor-help transition-colors"
        :class="stockClass"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <span>{{ totalStock }}</span>
    </div>

    <!-- Tooltip -->
    <Transition name="tooltip">
      <div
          v-if="showTooltip && stocks && stocks.length > 0"
          class="fixed w-64 bg-white border border-[#E8E6E0] rounded-lg shadow-xl overflow-hidden pointer-events-none"
          :style="tooltipStyle"
          style="z-index: 9999;"
      >
        <div class="px-3 py-2 bg-[#FAFAF8] border-b border-[#E8E6E0]">
          <p class="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#ABABAB]">Остатки по складам</p>
        </div>
        <div class="divide-y divide-[#F0EEE9]">
          <div
              v-for="stock in stocks"
              :key="stock.warehouse_id"
              class="px-3 py-2.5 flex items-center justify-between"
          >
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-medium text-[#1A1A1A] truncate">
                {{ stock.warehouse_title || `Склад #${stock.warehouse_id}` }}
              </p>
              <p v-if="stock.reserved_quantity > 0" class="text-[10px] text-[#ABABAB] mt-0.5">
                Резерв: {{ stock.reserved_quantity }}
              </p>
            </div>
            <div class="flex items-center gap-2 ml-3">
              <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                  :class="getStockBadgeClass(stock.available_quantity)"
              >
                {{ stock.available_quantity }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="totalReserved > 0" class="px-3 py-2 bg-[#FAFAF8] border-t border-[#E8E6E0]">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-[#ABABAB]">Всего / Доступно</span>
            <span class="font-medium text-[#1A1A1A]">{{ totalStock }} / {{ totalAvailable }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface Stock {
  warehouse_id: number
  warehouse_title?: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
}

interface Props {
  totalStock: number
  stocks?: Stock[]
  tooltipPosition?: 'top' | 'bottom'
}

const props = withDefaults(defineProps<Props>(), {
  tooltipPosition: 'bottom'
})

const showTooltip = ref(false)
const tooltipStyle = ref({})
const triggerRef = ref<HTMLElement | null>(null)

function updateTooltipPosition(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom + 8}px`,
    transform: 'translateX(-50%)'
  }
}

const totalReserved = computed(() => {
  if (!props.stocks) return 0
  return props.stocks.reduce((sum, stock) => sum + stock.reserved_quantity, 0)
})

const totalAvailable = computed(() => {
  if (!props.stocks) return props.totalStock
  return props.stocks.reduce((sum, stock) => sum + stock.available_quantity, 0)
})

const stockClass = computed(() => {
  if (props.totalStock === 0) {
    return 'bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]'
  } else if (props.totalStock < 10) {
    return 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
  } else {
    return 'bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]'
  }
})

function getStockBadgeClass(quantity: number): string {
  if (quantity === 0) {
    return 'bg-[#FEF2F2] text-[#991B1B]'
  } else if (quantity < 5) {
    return 'bg-[#FEF3C7] text-[#92400E]'
  } else {
    return 'bg-[#F0FDF4] text-[#15803D]'
  }
}
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>