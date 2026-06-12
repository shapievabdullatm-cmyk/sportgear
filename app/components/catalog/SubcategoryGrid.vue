<template>
  <div v-if="categories && categories.length > 0" class="subcategories">
    <div
        class="subcategories-slider"
        ref="sliderRef"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        :class="{ dragging: isDragging }"
    >
      <NuxtLink
          v-for="category in categories"
          :key="category.id"
          :to="'/catalog/' + category.slug"
          class="subcategory-card"
          @click.capture="onCardClick"
      >
        <span class="subcategory-name">{{ category.title }}</span>
        <div class="subcategory-image">
          <img v-if="category.image" :src="category.image" :alt="category.title" />
          <div v-else class="no-image"></div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Category {
  id: number
  title: string
  slug: string
  image: string | null
}

defineProps<{
  categories: Category[]
}>()

const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const hasDragged = ref(false)

function onMouseDown(e: MouseEvent) {
  if (!sliderRef.value) return
  isDragging.value = true
  hasDragged.value = false
  startX.value = e.pageX - sliderRef.value.offsetLeft
  scrollLeft.value = sliderRef.value.scrollLeft
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !sliderRef.value) return
  e.preventDefault()
  const x = e.pageX - sliderRef.value.offsetLeft
  const walk = (x - startX.value) * 1.2
  if (Math.abs(walk) > 4) hasDragged.value = true
  sliderRef.value.scrollLeft = scrollLeft.value - walk
}

function onMouseUp() {
  isDragging.value = false
}

function onCardClick(e: MouseEvent) {
  if (hasDragged.value) e.preventDefault()
}

// Touch support
const touchStartX = ref(0)
const touchScrollLeft = ref(0)

function onTouchStart(e: TouchEvent) {
  if (!sliderRef.value) return
  touchStartX.value = e.touches[0].clientX
  touchScrollLeft.value = sliderRef.value.scrollLeft
}

function onTouchMove(e: TouchEvent) {
  if (!sliderRef.value) return
  const diff = touchStartX.value - e.touches[0].clientX
  sliderRef.value.scrollLeft = touchScrollLeft.value + diff
}

function onTouchEnd() {}
</script>

<style scoped>
.subcategories {
  margin-bottom: 32px;
}

.subcategories-slider {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  cursor: grab;
  user-select: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.subcategories-slider::-webkit-scrollbar {
  display: none;
}

.subcategories-slider.dragging {
  cursor: grabbing;
  scroll-behavior: auto;
}

.subcategory-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-width: 200px;
  max-width: 200px;
  min-height: 100px;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background: #EDEDEF;
  padding: 12px 0 0 12px;
  flex-shrink: 0;
  position: relative;
}

.subcategory-name {
  font-size: 13px;
  font-weight: 500;
  color: #222;
  line-height: 1.35;
  max-width: 100px;
  flex-shrink: 0;
}

.subcategory-image {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 115px;
  height: 120px;
  overflow: hidden;
}

.subcategory-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top left;
  pointer-events: none;
}

.no-image {
  width: 100%;
  height: 100%;
  background: transparent;
}
</style>