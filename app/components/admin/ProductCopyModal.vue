<template>
  <Transition name="modal">
    <div v-if="modelValue" @click.self="close" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div @click.stop class="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-[#E8E6E0]">
          <h2 class="text-[15px] font-semibold text-[#1A1A1A]">Копировать данные из товара</h2>
          <button @click="close" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0EEE9] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Search Product -->
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
              Выберите товар
            </label>
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Начните вводить название или артикул..."
                class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors"
            />
          </div>

          <!-- Products List -->
          <div v-if="searchQuery.length >= 2" class="space-y-2 max-h-48 overflow-y-auto">
            <div v-if="filteredProducts.length === 0" class="text-center py-8 text-[12px] text-[#ABABAB]">
              Товары не найдены
            </div>
            <button
                v-for="product in filteredProducts"
                :key="product.id"
                @click="selectProduct(product)"
                class="w-full flex items-center gap-3 p-3 border rounded-lg transition-colors"
                :class="selectedProduct?.id === product.id ? 'border-[#1A1A1A] bg-[#FAFAF8]' : 'border-[#E8E6E0] hover:border-[#C0BEB8]'"
            >
              <img
                  v-if="product.images && product.images.length"
                  :src="product.images[0].url"
                  :alt="product.title"
                  class="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
              <div v-else class="w-12 h-12 bg-[#E8E6E0] rounded-md flex-shrink-0" />

              <div class="flex-1 text-left min-w-0">
                <p class="text-[12px] font-medium text-[#1A1A1A] truncate">{{ product.external_title || product.title }}</p>
                <p v-if="product.article" class="text-[10px] text-[#ABABAB]">Артикул: {{ product.article }}</p>
              </div>

              <svg v-if="selectedProduct?.id === product.id" class="w-5 h-5 text-[#1A1A1A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>

          <!-- Selected Product Preview & Options -->
          <div v-if="selectedProduct" class="space-y-4 pt-4 border-t border-[#E8E6E0]">

            <!-- Preview -->
            <div class="flex items-center gap-3 p-3 bg-[#FAFAF8] rounded-lg">
              <img
                  v-if="selectedProduct.images && selectedProduct.images.length"
                  :src="selectedProduct.images[0].url"
                  :alt="selectedProduct.title"
                  class="w-16 h-16 object-cover rounded-md flex-shrink-0"
              />
              <div v-else class="w-16 h-16 bg-[#E8E6E0] rounded-md flex-shrink-0" />

              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-medium text-[#1A1A1A]">{{ selectedProduct.external_title || selectedProduct.title }}</p>
                <p v-if="selectedProduct.article" class="text-[11px] text-[#ABABAB]">Артикул: {{ selectedProduct.article }}</p>
                <p v-if="selectedProduct.price" class="text-[11px] text-[#555] mt-1">Цена: {{ selectedProduct.price }} ₽</p>
              </div>
            </div>

            <!-- Images Preview (if images option is selected) -->
            <div v-if="selectedOptions.images && selectedProduct.images && selectedProduct.images.length > 0" class="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
              <div class="flex items-start gap-2 mb-2">
                <svg class="w-4 h-4 text-[#15803D] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div class="flex-1">
                  <p class="text-[12px] font-medium text-[#15803D]">Будет скопировано {{ selectedProduct.images.length }} {{ selectedProduct.images.length === 1 ? 'изображение' : selectedProduct.images.length < 5 ? 'изображения' : 'изображений' }}</p>
                  <p class="text-[10px] text-[#15803D]/70 mt-0.5">Изображения будут скопированы на сервере</p>
                </div>
              </div>
              <div class="flex gap-2 overflow-x-auto">
                <img
                    v-for="(image, idx) in selectedProduct.images.slice(0, 5)"
                    :key="idx"
                    :src="image.url"
                    :alt="`Image ${idx + 1}`"
                    class="w-12 h-12 object-cover rounded flex-shrink-0"
                />
                <div v-if="selectedProduct.images.length > 5" class="w-12 h-12 bg-[#E8E6E0] rounded flex items-center justify-center flex-shrink-0">
                  <span class="text-[10px] text-[#555]">+{{ selectedProduct.images.length - 5 }}</span>
                </div>
              </div>
            </div>

            <!-- Copy Options -->
            <div>
              <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-3">
                Что копировать?
              </label>

              <div class="space-y-2">
                <label v-for="option in copyOptions" :key="option.key" class="flex items-start gap-3 p-3 rounded-lg hover:bg-[#FAFAF8] cursor-pointer transition-colors">
                  <input
                      type="checkbox"
                      v-model="selectedOptions[option.key]"
                      class="mt-0.5 w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-[#1A1A1A] focus:ring-offset-0"
                  />
                  <div class="flex-1">
                    <p class="text-[12px] font-medium text-[#1A1A1A]">{{ option.label }}</p>
                    <p class="text-[10px] text-[#ABABAB] mt-0.5">{{ option.description }}</p>
                  </div>
                </label>
              </div>
            </div>

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
              @click="copyData"
              :disabled="!selectedProduct"
              class="px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-[13px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Копировать данные
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'

interface CopyOption {
  key: string
  label: string
  description: string
  default: boolean
}

const props = defineProps<{
  modelValue: boolean
  products: Product[]
  currentProductId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'copy': [product: Product, options: Record<string, boolean>]
}>()

const searchQuery = ref('')
const selectedProduct = ref<Product | null>(null)

const copyOptions: CopyOption[] = [
  { key: 'images', label: 'Изображения', description: 'Все фотографии товара', default: true },
  { key: 'params', label: 'Характеристики', description: 'Все параметры (материал, цвет, размер и т.д.)', default: true },
  { key: 'description', label: 'Описание и габариты', description: 'Текстовое описание, вес и размеры товара', default: true },
  { key: 'seo', label: 'SEO поля', description: 'Meta title, description, keywords', default: true },
  { key: 'category', label: 'Категория', description: 'Категория товара', default: true },
  { key: 'brand', label: 'Бренд и происхождение', description: 'Бренд, родина бренда, страна производства', default: true },
  { key: 'bought_together', label: 'С этим покупают', description: 'Связанные товары', default: false },
]

const selectedOptions = ref<Record<string, boolean>>(
    copyOptions.reduce((acc, opt) => {
      acc[opt.key] = opt.default
      return acc
    }, {} as Record<string, boolean>)
)

const filteredProducts = computed(() => {
  if (searchQuery.value.length < 2) return []

  const query = searchQuery.value.toLowerCase()
  return props.products
      .filter(p => p.id !== props.currentProductId) // Исключаем текущий товар
      .filter(p => {
        const title = (p.external_title || p.title || '').toLowerCase()
        const article = (p.article || '').toLowerCase()
        return title.includes(query) || article.includes(query)
      })
      .slice(0, 10) // Показываем максимум 10 результатов
})

function selectProduct(product: Product) {
  selectedProduct.value = product
}

function close() {
  emit('update:modelValue', false)
  // Сбрасываем состояние при закрытии
  setTimeout(() => {
    searchQuery.value = ''
    selectedProduct.value = null
    selectedOptions.value = copyOptions.reduce((acc, opt) => {
      acc[opt.key] = opt.default
      return acc
    }, {} as Record<string, boolean>)
  }, 300)
}

function copyData() {
  if (!selectedProduct.value) return
  emit('copy', selectedProduct.value, selectedOptions.value)
  close()
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>