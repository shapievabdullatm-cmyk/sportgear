<template>
  <div v-if="categories && categories.length > 0" class="subcategories">
    <div class="subcategories-wrapper">
      <button
          v-if="canScroll"
          type="button"
          class="nav-btn nav-btn--prev"
          :class="{ 'is-hidden': atStart }"
          aria-label="Назад"
          @click="scrollByStep(-1)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div
          class="subcategories-slider"
          ref="sliderRef"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @scroll="updateScrollState"
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

      <button
          v-if="canScroll"
          type="button"
          class="nav-btn nav-btn--next"
          :class="{ 'is-hidden': atEnd }"
          aria-label="Вперёд"
          @click="scrollByStep(1)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
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

const canScroll = ref(false)
const atStart = ref(true)
const atEnd = ref(false)

function updateScrollState() {
  const el = sliderRef.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canScroll.value = max > 1
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft >= max - 1
}

function scrollByStep(dir: 1 | -1) {
  const el = sliderRef.value
  if (!el) return
  const step = Math.max(el.clientWidth * 0.8, 240)
  el.scrollBy({ left: dir * step, behavior: 'smooth' })
}

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

let ro: ResizeObserver | null = null

onMounted(() => {
  nextTick(updateScrollState)
  if (typeof ResizeObserver !== 'undefined' && sliderRef.value) {
    ro = new ResizeObserver(updateScrollState)
    ro.observe(sliderRef.value)
  }
  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', updateScrollState)
})
</script>

<style scoped>
.subcategories {
  margin-bottom: 32px;
}

.subcategories-wrapper {
  position: relative;
}

.subcategories-slider {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  cursor: grab;
  user-select: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
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

/* ── Nav buttons (desktop only) ─────────────────────────── */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #E5E5E7;
  background: #fff;
  color: #1A1A1A;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: opacity 0.18s, background-color 0.18s, transform 0.18s;
  z-index: 2;
  padding: 0;
}

.nav-btn:hover {
  background: #F5F4F0;
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.96);
}

.nav-btn--prev {
  left: -8px;
}

.nav-btn--next {
  right: -8px;
}

.nav-btn.is-hidden {
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 768px) {
  .nav-btn {
    display: none;
  }
}
</style>