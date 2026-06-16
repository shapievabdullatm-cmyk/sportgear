<script setup>
import 'vue3-carousel/carousel.css'
import { Carousel, Slide } from 'vue3-carousel'
import { ref, onMounted, onUnmounted } from 'vue'

const { $api } = useApi()
const carouselRef = ref()
const currentSlide = ref(0)
const slides = ref([])
const containerRef = ref()
const loading = ref(true)

// Загружаем данные на клиенте для показа скелетона
onMounted(async () => {
  try {
    const data = await $api('/sliders')
    slides.value = Array.isArray(data) ? data : data?.data ?? []
  } finally {
    loading.value = false
  }
})

const config = {
  snapAlign: 'center',
  wrapAround: true,
  transition: 500,
  mouseDrag: true,
  touchDrag: true,
  breakpoints: {
    0: {
      itemsToShow: 1.15,
    },
    768: {
      itemsToShow: 1.5,
    },
  },
}

// Отслеживаем дистанцию тача, чтобы отличить тап от свайпа
const tapStartX = ref(0)
const tapStartY = ref(0)
const tapMoved = ref(false)

function onTapStart(e) {
  const touch = e.touches?.[0] ?? e
  tapStartX.value = touch.clientX
  tapStartY.value = touch.clientY
  tapMoved.value = false
}

function onTapMove(e) {
  const touch = e.touches?.[0] ?? e
  const dx = Math.abs(touch.clientX - tapStartX.value)
  const dy = Math.abs(touch.clientY - tapStartY.value)
  if (dx > 8 || dy > 8) {
    tapMoved.value = true
  }
}

function handleSlideClick(index) {
  // Если был свайп — не переключаем (Safari иногда стреляет click после свайпа)
  if (tapMoved.value) return
  if (index === currentSlide.value) return

  const total = slides.value.length
  if (total === 0) return

  const current = currentSlide.value
  const goNext = (index - current + total) % total === 1

  if (goNext) {
    carouselRef.value.next()
  } else {
    carouselRef.value.prev()
  }
}

let wheelTimer = null
function onWheel(e) {
  const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
  if (!isHorizontal) return
  e.preventDefault()
  if (Math.abs(e.deltaX) < 10) return
  if (wheelTimer) return
  wheelTimer = setTimeout(() => { wheelTimer = null }, 400)
  e.deltaX > 0 ? carouselRef.value.next() : carouselRef.value.prev()
}

// ── Axis-lock: чтобы вертикальный свайп не дёргал карусель ──
let lockedAxis = null
let touchStartX = 0
let touchStartY = 0
const AXIS_THRESHOLD = 6

function onContainerTouchStart(e) {
  lockedAxis = null
  if (!e.touches || e.touches.length !== 1) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onContainerTouchMove(e) {
  if (!e.touches || e.touches.length !== 1) return
  const t = e.touches[0]

  if (lockedAxis === null) {
    const dx = Math.abs(t.clientX - touchStartX)
    const dy = Math.abs(t.clientY - touchStartY)
    if (dx < AXIS_THRESHOLD && dy < AXIS_THRESHOLD) {
      e.stopPropagation()
      return
    }
    lockedAxis = dy > dx ? 'y' : 'x'
  }

  if (lockedAxis === 'y') {
    e.stopPropagation()
  }
}

onMounted(() => {
  containerRef.value?.addEventListener('wheel', onWheel, { passive: false })
  containerRef.value?.addEventListener('touchstart', onContainerTouchStart, { capture: true, passive: true })
  containerRef.value?.addEventListener('touchmove', onContainerTouchMove, { capture: true, passive: true })
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('wheel', onWheel)
  containerRef.value?.removeEventListener('touchstart', onContainerTouchStart, { capture: true })
  containerRef.value?.removeEventListener('touchmove', onContainerTouchMove, { capture: true })
})
</script>

<template>
  <div
      ref="containerRef"
      class="slider-container"
  >
    <!-- Skeleton loader -->
    <div v-if="loading" class="skeleton-wrapper">
      <div class="skeleton-slide skeleton-side-left"></div>
      <div class="skeleton-slide skeleton-center"></div>
      <div class="skeleton-slide skeleton-side-right"></div>
    </div>

    <!-- Actual carousel -->
    <Carousel v-else ref="carouselRef" v-model="currentSlide" v-bind="config">
      <Slide v-for="(slide, index) in slides" :key="slide.id">
        <div
            class="image-wrapper"
            :class="{ 'is-side': index !== currentSlide }"
            @touchstart.passive="onTapStart"
            @touchmove.passive="onTapMove"
            @click="handleSlideClick(index)"
        >
          <!-- Ссылка только на центральном слайде, на боковых просто картинка -->
          <a v-if="index === currentSlide" :href="slide.link" target="_blank" rel="noopener">
            <picture>
              <source v-if="slide.mobile_image" media="(max-width: 767px)" :srcset="slide.mobile_image" />
              <img class="slide-image" :src="slide.image" :alt="slide.title" />
            </picture>
          </a>
          <picture v-else>
            <source v-if="slide.mobile_image" media="(max-width: 767px)" :srcset="slide.mobile_image" />
            <img class="slide-image" :src="slide.image" :alt="slide.title" />
          </picture>
        </div>
      </Slide>
    </Carousel>
  </div>
</template>

<style scoped>
.slider-container {
  max-width: 100%;
  margin: 0 auto;
  overflow: hidden;
  touch-action: pan-y;
}

/* ── Skeleton ────────────────────────────────────────────── */
.skeleton-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 0 10px;
  width: 100%;
  box-sizing: border-box;
  min-height: 400px;
}

.skeleton-slide {
  border-radius: 10px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  flex-shrink: 0;
  height: 100%;
}

.skeleton-center {
  width: 100%;
  max-width: 65%;
  aspect-ratio: 2 / 1;
}

.skeleton-side-left,
.skeleton-side-right {
  width: 17.5%;
  aspect-ratio: 2 / 1;
}

@media (max-width: 767px) {
  .skeleton-center {
    aspect-ratio: 1 / 1;
  }

  .skeleton-side-left,
  .skeleton-side-right {
    aspect-ratio: 1 / 1;
  }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .skeleton-wrapper {
    gap: 8px;
    padding: 0 4px;
    min-height: 250px;
  }

  .skeleton-center {
    max-width: 87%;
  }

  .skeleton-side-left,
  .skeleton-side-right {
    width: 6.5%;
  }
}

/* ── Slider ──────────────────────────────────────────────── */
.image-wrapper {
  width: 100%;
  aspect-ratio: 2 / 1;
  position: relative;
  padding: 0 10px;
  box-sizing: border-box;
  transition: opacity 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.image-wrapper.is-side {
  cursor: pointer;
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  -webkit-user-drag: none;
  user-select: none;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

@media (max-width: 767px) {
  .image-wrapper {
    padding: 0 4px;
    aspect-ratio: 1 / 1;
  }
}
</style>