<template>
  <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click.self="$emit('close')"
  >
    <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-[#E8E6E0]">
        <div>
          <h3 class="text-[15px] font-semibold text-[#1A1A1A]">История движений</h3>
          <p class="text-[12px] text-[#ABABAB] mt-0.5">Товар #{{ productId }}</p>
        </div>
        <button
            @click="$emit('close')"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 5" :key="n" class="h-20 bg-[#F0EEE9] rounded-lg animate-pulse" />
        </div>

        <div v-else-if="movements.length === 0" class="text-center py-12">
          <svg class="w-12 h-12 mx-auto text-[#C0BEB8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p class="text-[13px] text-[#C0BEB8]">История движений пуста</p>
        </div>

        <div v-else class="space-y-3">
          <div
              v-for="movement in movements"
              :key="movement.id"
              class="border border-[#E8E6E0] rounded-lg p-4 hover:bg-[#FAFAF8] transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 flex-1">
                <!-- Icon -->
                <div
                    :class="[
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      getTypeColor(movement.type).bg
                    ]"
                >
                  <svg
                      class="w-5 h-5"
                      :class="getTypeColor(movement.type).text"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                  >
                    <template v-if="movement.type === 'in'">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </template>
                    <template v-else-if="movement.type === 'out'">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </template>
                    <template v-else-if="movement.type === 'transfer_in' || movement.type === 'transfer_out'">
                      <polyline points="17 11 21 7 17 3"/>
                      <path d="M21 7H9a4 4 0 0 0-4 4v6"/>
                      <polyline points="7 21 3 17 7 13"/>
                    </template>
                    <template v-else>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </template>
                  </svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[13px] font-semibold text-[#1A1A1A]">
                      {{ getTypeLabel(movement.type) }}
                    </span>
                    <span
                        :class="[
                          'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
                          movement.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        ]"
                    >
                      {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
                    </span>
                  </div>

                  <div class="text-[12px] text-[#ABABAB] space-y-0.5">
                    <div>
                      Склад: <span class="text-[#555]">{{ movement.warehouse?.title || `#${movement.warehouse_id}` }}</span>
                    </div>
                    <div v-if="movement.related_warehouse">
                      {{ movement.type === 'transfer_in' ? 'Откуда' : 'Куда' }}:
                      <span class="text-[#555]">{{ movement.related_warehouse.title }}</span>
                    </div>
                    <div>
                      Остаток: <span class="text-[#555]">{{ movement.quantity_before }} → {{ movement.quantity_after }}</span>
                    </div>
                    <div v-if="movement.reason">
                      Причина: <span class="text-[#555]">{{ movement.reason }}</span>
                    </div>
                    <div v-if="movement.comment" class="mt-1">
                      <span class="text-[#555]">{{ movement.comment }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Date & User -->
              <div class="text-right shrink-0">
                <div class="text-[11px] text-[#ABABAB]">
                  {{ formatDate(movement.created_at) }}
                </div>
                <div v-if="movement.user" class="text-[11px] text-[#ABABAB] mt-1">
                  {{ [movement.user.last_name, movement.user.first_name].filter(Boolean).join(' ') || movement.user.email || movement.user.phone }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-[#E8E6E0] flex justify-end">
        <button
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Movement {
  id: number
  product_id: number
  warehouse_id: number
  type: string
  quantity: number
  quantity_before: number
  quantity_after: number
  related_warehouse_id?: number
  reason?: string
  comment?: string
  user_id?: number
  created_at: string
  warehouse?: { id: number; title: string }
  related_warehouse?: { id: number; title: string }
  user?: { id: number; name?: string; email: string }
}

const props = defineProps<{
  productId: number
  warehouseId?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const { $api } = useApi()

const movements = ref<Movement[]>([])
const loading = ref(false)

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    in: 'Приход',
    out: 'Расход',
    transfer_in: 'Перемещение (приход)',
    transfer_out: 'Перемещение (расход)',
    adjustment: 'Корректировка'
  }
  return labels[type] || type
}

function getTypeColor(type: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    in: { bg: 'bg-green-50', text: 'text-green-600' },
    out: { bg: 'bg-red-50', text: 'text-red-600' },
    transfer_in: { bg: 'bg-blue-50', text: 'text-blue-600' },
    transfer_out: { bg: 'bg-orange-50', text: 'text-orange-600' },
    adjustment: { bg: 'bg-purple-50', text: 'text-purple-600' }
  }
  return colors[type] || { bg: 'bg-gray-50', text: 'text-gray-600' }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  if (hours < 24) return `${hours} ч назад`
  if (days < 7) return `${days} дн назад`

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchMovements() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.warehouseId) params.append('warehouse_id', props.warehouseId.toString())

    const data = await $api<Movement[]>(`/admin/stocks/${props.productId}/movements?${params}`)
    movements.value = data
  } catch (error) {
    console.error('Failed to fetch movements:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMovements()
})
</script>