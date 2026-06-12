<template>
  <Transition name="modal">
    <div v-if="modelValue" @click.self="close" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div @click.stop class="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-[#E8E6E0]">
          <h2 class="text-[15px] font-semibold text-[#1A1A1A]">Объединить с другим товаром</h2>
          <button @click="close" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0EEE9] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">

          <!-- Error -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-[12px] text-red-600">{{ errorMessage }}</p>
          </div>

          <!-- Search -->
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
              Найти товар
            </label>
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Название, артикул или штрихкод..."
                class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors"
            />
            <p class="text-[11px] text-[#ABABAB] mt-1.5">
              Объединять можно только товары без родительского товара.
            </p>
          </div>

          <!-- Loading -->
          <div v-if="searching" class="flex items-center justify-center py-6">
            <svg class="w-5 h-5 animate-spin text-[#ABABAB]" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>

          <!-- Results -->
          <div v-else-if="searchQuery.length >= 2" class="space-y-2">
            <div v-if="results.length === 0" class="text-center py-8 text-[12px] text-[#ABABAB]">
              Товары не найдены
            </div>
            <button
                v-for="product in results"
                :key="product.id"
                @click="selected = product"
                class="w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left"
                :class="selected?.id === product.id ? 'border-[#1A1A1A] bg-[#FAFAF8]' : 'border-[#E8E6E0] hover:border-[#C0BEB8]'"
            >
              <img
                  v-if="product.images && product.images.length"
                  :src="product.images[0].url"
                  :alt="product.title || ''"
                  class="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
              <div v-else class="w-12 h-12 bg-[#E8E6E0] rounded-md flex-shrink-0" />

              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-medium text-[#1A1A1A] truncate">{{ product.external_title || product.title || 'Товар #' + product.id }}</p>
                <p v-if="product.article" class="text-[10px] text-[#ABABAB]">Артикул: {{ product.article }}</p>
                <p v-if="product.product_group_id" class="text-[10px] text-[#F59E0B] mt-0.5">Уже в другой группе</p>
              </div>

              <svg v-if="selected?.id === product.id" class="w-5 h-5 text-[#1A1A1A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-[#E8E6E0]">
          <button
              @click="close"
              class="px-4 py-2 text-[13px] font-medium text-[#555] hover:text-[#1A1A1A] transition-colors"
          >
            Отмена
          </button>
          <button
              @click="confirm"
              :disabled="!selected || saving"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[13px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="saving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Объединить
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'
import type { ApiResponse } from '~/types/api'

const props = defineProps<{
  modelValue: boolean
  currentProductId: number
  excludedIds: number[]
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'merge': [productId: number]
}>()

const { $api } = useApi()

const searchQuery = ref('')
const results = ref<Product[]>([])
const selected = ref<Product | null>(null)
const searching = ref(false)
const errorMessage = ref<string | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (q) => {
  selected.value = null
  errorMessage.value = null

  if (debounceTimer) clearTimeout(debounceTimer)
  if (q.length < 2) {
    results.value = []
    searching.value = false
    return
  }

  searching.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({ search: q, per_page: '15' })
      const res = await $api<ApiResponse<Product[]>>(`/admin/products?${params.toString()}`)
      const excluded = new Set([props.currentProductId, ...props.excludedIds])
      results.value = (res.data ?? []).filter(p => !excluded.has(p.id) && !p.parent_id)
    } catch (e) {
      results.value = []
    } finally {
      searching.value = false
    }
  }, 250)
})

function confirm() {
  if (!selected.value) return
  emit('merge', selected.value.id)
}

function close() {
  emit('update:modelValue', false)
  setTimeout(() => {
    searchQuery.value = ''
    results.value = []
    selected.value = null
    errorMessage.value = null
  }, 300)
}

defineExpose({
  showError(msg: string) { errorMessage.value = msg },
})
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div, .modal-leave-active > div { transition: transform 0.2s ease; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.95); }
</style>