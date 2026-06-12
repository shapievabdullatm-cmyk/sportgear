<template>
  <div class="min-h-screen bg-white">

    <!-- Header -->
    <div class="border-b border-[#DCDCDC]">
      <div class="max-w-[1760px] mx-auto px-8 h-14 flex items-center justify-between">
        <NuxtLink
            to="/admin/products"
            class="flex items-center gap-2 text-[13px] text-black hover:opacity-60 transition-opacity"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Назад
        </NuxtLink>

        <NuxtLink
            :to="`/admin/products/${id}/edit`"
            class="text-[13px] text-black hover:opacity-60 transition-opacity"
        >
          Редактировать
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-[1760px] mx-auto px-8 py-10">
      <div class="grid grid-cols-12 gap-8 animate-pulse">
        <div class="col-span-7 space-y-2">
          <div class="w-full bg-gray-100" style="aspect-ratio: 3/4"></div>
          <div class="grid grid-cols-6 gap-2">
            <div v-for="n in 6" :key="n" class="bg-gray-100" style="aspect-ratio: 3/4"></div>
          </div>
        </div>
        <div class="col-span-5 space-y-4">
          <div class="h-6 w-3/4 bg-gray-100"></div>
          <div class="h-8 w-1/3 bg-gray-100"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="product" class="max-w-[1760px] mx-auto px-8 py-10">
      <div class="grid grid-cols-12 gap-8">

        <!-- Left: Images (7 cols) -->
        <div class="col-span-12 lg:col-span-7">
          <div class="space-y-2">
            <!-- Main Image -->
            <div
                class="relative bg-[#F6F6F6] cursor-pointer overflow-hidden"
                style="aspect-ratio: 3/4"
                @click="openLightbox(selectedImageIndex)"
            >
              <img
                  v-if="product.images?.[selectedImageIndex]?.url"
                  :src="product.images[selectedImageIndex].url"
                  :alt="product.title || ''"
                  class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-20 h-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>

              <!-- Discount badge -->
              <div v-if="product.old_price && product.price && product.old_price > product.price" class="absolute top-3 left-3">
                <div class="bg-[#E1251B] text-white text-[12px] font-bold px-2 py-1 rounded">
                  -{{ Math.round((1 - product.price / product.old_price) * 100) }}%
                </div>
              </div>
            </div>

            <!-- Thumbnails -->
            <div v-if="product.images && product.images.length > 1" class="grid grid-cols-6 gap-2">
              <button
                  v-for="(image, index) in product.images.slice(0, 6)"
                  :key="image.id"
                  @click="selectedImageIndex = index"
                  class="relative bg-[#F6F6F6] overflow-hidden transition-opacity"
                  :class="selectedImageIndex === index ? 'opacity-100 ring-1 ring-black' : 'opacity-50 hover:opacity-75'"
                  style="aspect-ratio: 3/4"
              >
                <img
                    :src="image.url"
                    :alt="`${product.title} - ${index + 1}`"
                    class="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Info (5 cols) -->
        <div class="col-span-12 lg:col-span-5">
          <div class="lg:sticky lg:top-4 space-y-6">

            <!-- Brand & Title -->
            <div class="space-y-2">
              <h1 class="text-[24px] leading-tight text-black">
                {{ product.title || product.external_title || 'Без названия' }}
              </h1>
              <p v-if="product.article" class="text-[13px] text-[#9B9B9B]">
                Артикул: {{ product.article }}
              </p>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-3">
              <span class="text-[28px] font-bold text-black">
                {{ product.price ? formatPrice(product.price) : '—' }} ₽
              </span>
              <span v-if="product.old_price && product.old_price > (product.price || 0)" class="text-[18px] text-[#9B9B9B] line-through">
                {{ formatPrice(product.old_price) }} ₽
              </span>
            </div>

            <!-- Status -->
            <div class="py-4 border-t border-[#DCDCDC]">
              <div class="flex items-center gap-2">
                <div
                    class="w-2 h-2 rounded-full"
                    :class="product.is_active ? 'bg-[#00C853]' : 'bg-[#9B9B9B]'"
                ></div>
                <span class="text-[14px]" :class="product.is_active ? 'text-black' : 'text-[#9B9B9B]'">
                  {{ product.is_active ? 'В наличии' : 'Нет в наличии' }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="product.description" class="py-4 border-t border-[#DCDCDC] space-y-3">
              <h2 class="text-[14px] font-bold text-black uppercase">Описание</h2>
              <p class="text-[14px] text-black leading-relaxed whitespace-pre-wrap">{{ product.description }}</p>
            </div>

            <!-- Characteristics -->
            <div v-if="product.params && product.params.length > 0" class="py-4 border-t border-[#DCDCDC] space-y-4">
              <h2 class="text-[14px] font-bold text-black uppercase">Характеристики</h2>

              <div class="space-y-2">
                <div
                    v-for="(param, index) in product.params"
                    :key="index"
                    class="flex justify-between gap-4 py-2"
                >
                  <span class="text-[14px] text-[#9B9B9B]">{{ param.title }}</span>

                  <!-- Color display -->
                  <div v-if="param.is_color" class="flex flex-wrap items-center gap-2 justify-end">
                    <template v-if="Array.isArray(param.value)">
                      <div v-for="(colorValue, i) in param.value" :key="i" class="flex items-center gap-1.5">
                        <div
                          class="w-4 h-4 rounded-full border border-[#DCDCDC]"
                          :style="{ background: colorCss(colorValue) }"
                        />
                        <span class="text-[14px] text-black">{{ colorName(colorValue) }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div class="flex items-center gap-1.5">
                        <div
                          class="w-4 h-4 rounded-full border border-[#DCDCDC]"
                          :style="{ background: colorCss(param.value as string) }"
                        />
                        <span class="text-[14px] text-black">{{ colorName(param.value as string) }}</span>
                      </div>
                    </template>
                  </div>

                  <!-- Regular value -->
                  <span v-else class="text-[14px] text-black text-right">
                    {{ Array.isArray(param.value) ? param.value.join(', ') : param.value }}{{ param.unit ? ' ' + param.unit : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="py-4 border-t border-[#DCDCDC] space-y-4">
              <h2 class="text-[14px] font-bold text-black uppercase">Дополнительная информация</h2>

              <div class="space-y-2">
                <div v-if="product.width || product.height || product.length" class="flex justify-between py-2">
                  <span class="text-[14px] text-[#9B9B9B]">Размеры (Ш×В×Д)</span>
                  <span class="text-[14px] text-black">{{ product.width || '—' }} × {{ product.height || '—' }} × {{ product.length || '—' }} см</span>
                </div>

                <div v-if="product.weight" class="flex justify-between py-2">
                  <span class="text-[14px] text-[#9B9B9B]">Вес</span>
                  <span class="text-[14px] text-black">{{ product.weight }} кг</span>
                </div>

                <div v-if="product.category_id" class="flex justify-between py-2">
                  <span class="text-[14px] text-[#9B9B9B]">Категория</span>
                  <span class="text-[14px] text-black">ID: {{ product.category_id }}</span>
                </div>

                <div v-if="product.product_group_id" class="flex justify-between py-2">
                  <span class="text-[14px] text-[#9B9B9B]">Группа товаров</span>
                  <span class="text-[14px] text-black">ID: {{ product.product_group_id }}</span>
                </div>

                <div class="flex justify-between py-2">
                  <span class="text-[14px] text-[#9B9B9B]">Slug</span>
                  <span class="text-[14px] text-black font-mono text-[12px]">{{ product.slug || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- SEO -->
            <div v-if="product.meta_title || product.meta_description || product.meta_keywords" class="py-4 border-t border-[#DCDCDC] space-y-4">
              <h2 class="text-[14px] font-bold text-black uppercase">SEO</h2>

              <div class="space-y-3">
                <div v-if="product.meta_title">
                  <p class="text-[13px] text-[#9B9B9B] mb-1">Meta Title</p>
                  <p class="text-[14px] text-black">{{ product.meta_title }}</p>
                </div>

                <div v-if="product.meta_description">
                  <p class="text-[13px] text-[#9B9B9B] mb-1">Meta Description</p>
                  <p class="text-[14px] text-black">{{ product.meta_description }}</p>
                </div>

                <div v-if="product.meta_keywords">
                  <p class="text-[13px] text-[#9B9B9B] mb-1">Meta Keywords</p>
                  <p class="text-[14px] text-black">{{ product.meta_keywords }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Error -->
    <div v-else class="max-w-[1760px] mx-auto px-8 py-20 text-center">
      <p class="text-[14px] text-[#9B9B9B]">Товар не найден</p>
    </div>

    <!-- Lightbox -->
    <Transition name="fade">
      <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-50 bg-white"
      >
        <!-- Close button -->
        <button
            @click="closeLightbox"
            class="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center text-black hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Counter -->
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-20 text-[13px] text-black">
          {{ lightboxIndex + 1 }} / {{ product?.images?.length || 0 }}
        </div>

        <!-- Navigation -->
        <button
            v-if="product && product.images && product.images.length > 1 && lightboxIndex > 0"
            @click.stop="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white border border-[#DCDCDC] rounded-full hover:bg-gray-50 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <button
            v-if="product && product.images && product.images.length > 1 && lightboxIndex < product.images.length - 1"
            @click.stop="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white border border-[#DCDCDC] rounded-full hover:bg-gray-50 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!-- Image -->
        <div class="w-full h-full flex items-center justify-center p-16 bg-[#F6F6F6]" @click="closeLightbox">
          <img
              v-if="product?.images?.[lightboxIndex]?.url"
              :src="product.images[lightboxIndex].url"
              :alt="product.title || ''"
              class="max-w-full max-h-full object-contain"
              @click.stop
          />
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'
import { optionColorName, optionColorCss } from '~/types/param'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const { $api } = useApi()
const id = computed(() => route.params.id as string)

const product = ref<Product | null>(null)
const loading = ref(true)
const selectedImageIndex = ref(0)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

// Color helpers
const colorName = optionColorName
const colorCss = optionColorCss

// Format price with spaces
function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

function nextImage() {
  if (!product.value?.images) return
  if (lightboxIndex.value < product.value.images.length - 1) {
    lightboxIndex.value++
  }
}

function prevImage() {
  if (!product.value?.images) return
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--
  }
}

onMounted(async () => {
  try {
    const response = await $api<{ data?: Product } | Product>(`/admin/products/${id.value}`)
    product.value = 'data' in response ? response.data : response
  } catch (error) {
    console.error('Failed to load product:', error)
  } finally {
    loading.value = false
  }

  // Keyboard shortcuts
  const handleKeydown = (e: KeyboardEvent) => {
    if (!lightboxOpen.value) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  })
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>