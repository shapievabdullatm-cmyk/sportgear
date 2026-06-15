<template>
  <section class="categories-section">
    <div class="categories-header">
      <h2 class="categories-title">Популярные категории</h2>
      <div class="categories-nav">
        <button
            class="nav-btn"
            :class="{ disabled: offset >= 0 - 1 }"
            @click="nudge(-1)"
            aria-label="Назад"
        >
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.6875 24.9375L4.75 19M4.75 19L10.6875 13.0625M4.75 19H33.25" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
            class="nav-btn"
            :class="{ disabled: isAtEnd }"
            @click="nudge(1)"
            aria-label="Вперёд"
        >
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27.3125 13.0625L33.25 19M33.25 19L27.3125 24.9375M33.25 19H4.75" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="!fetched && items.length === 0" class="categories-viewport">
      <div class="categories-track">
        <div v-for="n in 5" :key="n" class="skeleton" />
      </div>
    </div>

    <!-- Cards -->
    <div
        v-else
        ref="viewportRef"
        class="categories-viewport"
        :class="{ grabbing: isDragging }"
    >
      <div
          ref="trackRef"
          class="categories-track"
      >
        <NuxtLink
            v-for="item in items"
            :key="item.id"
            :to="`/catalog/${item.slug}`"
            class="category-card"
            draggable="false"
            @click="onCardClick"
        >
          <div class="card-image-wrapper">
            <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="card-image"
                loading="lazy"
                draggable="false"
            />
            <div v-else class="card-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          </div>

          <div class="card-label">
            <span class="card-title">{{ item.title }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface PopularItem {
  id:          number
  position:    number
  category_id: number
  title:       string
  slug:        string
  image:       string | null
}

const { $api } = useApi()

const items       = ref<PopularItem[]>([])
const fetched     = ref(false)
const viewportRef = ref<HTMLElement | null>(null)
const trackRef    = ref<HTMLElement | null>(null)

const isDragging  = ref(false)
const offset      = ref(0)

let currentOffset = 0
let startOffset = 0
let startX = 0
let lastX = 0
let lastT = 0
let velocity = 0
let minOffset = 0
let suppressClick = false
let rafId: number | null = null
let dragging = false

const isAtEnd = computed(() => offset.value <= minOffset + 1)

function setTransform(x: number) {
  const t = trackRef.value
  if (!t) return
  t.style.transform = `translate3d(${x}px, 0, 0)`
}

function setTransition(value: string) {
  const t = trackRef.value
  if (!t) return
  t.style.transition = value
}

function recalcBounds() {
  const v = viewportRef.value
  const t = trackRef.value
  if (!v || !t) return
  minOffset = Math.min(0, v.clientWidth - t.scrollWidth)
  if (currentOffset < minOffset) currentOffset = minOffset
  if (currentOffset > 0) currentOffset = 0
  offset.value = currentOffset
  setTransform(currentOffset)
}

async function load() {
  try {
    const res = await $api<{ data: PopularItem[] }>('/popular-categories')
    items.value = res.data ?? []
    fetched.value = true
    await nextTick()
    recalcBounds()
  } catch {
    fetched.value = true
  }
}

function clampWithRubber(x: number): number {
  if (x > 0) return x * 0.35
  if (x < minOffset) return minOffset + (x - minOffset) * 0.35
  return x
}

function cancelMomentum() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function dragStart(x: number) {
  cancelMomentum()
  startX = x
  lastX = x
  lastT = performance.now()
  velocity = 0
  startOffset = currentOffset
  suppressClick = false
  dragging = true
  isDragging.value = true
  setTransition('none')
}

function dragMove(x: number) {
  if (!dragging) return
  const dx = x - startX

  const now = performance.now()
  const dt = now - lastT
  if (dt > 0) velocity = (x - lastX) / dt
  lastX = x
  lastT = now

  currentOffset = clampWithRubber(startOffset + dx)
  setTransform(currentOffset)

  if (Math.abs(dx) > 3) suppressClick = true
}

function dragEnd() {
  if (!dragging) return
  dragging = false
  isDragging.value = false
  offset.value = currentOffset
  startMomentum()
}

function startMomentum() {
  if (currentOffset > 0 || currentOffset < minOffset) {
    snapBack()
    return
  }

  let v = velocity * 16
  const friction = 0.94

  const step = () => {
    v *= friction
    currentOffset += v
    if (currentOffset > 0) {
      currentOffset = 0
      offset.value = 0
      setTransform(0)
      rafId = null
      return
    }
    if (currentOffset < minOffset) {
      currentOffset = minOffset
      offset.value = minOffset
      setTransform(minOffset)
      rafId = null
      return
    }
    setTransform(currentOffset)
    if (Math.abs(v) < 0.2) {
      offset.value = currentOffset
      rafId = null
      return
    }
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

function snapBack() {
  const target = currentOffset > 0 ? 0 : minOffset
  currentOffset = target
  offset.value = target
  setTransition('transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)')
  setTransform(target)
}

/* ── Touch handlers (mobile) ─────────────────────────────── */
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  dragStart(e.touches[0]!.clientX)
}

function onTouchMove(e: TouchEvent) {
  if (!dragging || e.touches.length !== 1) return
  e.preventDefault()
  dragMove(e.touches[0]!.clientX)
}

function onTouchEnd() {
  dragEnd()
}

/* ── Mouse handlers (desktop) ────────────────────────────── */
function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  e.preventDefault()
  dragStart(e.clientX)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  dragMove(e.clientX)
}

function onMouseUp() {
  dragEnd()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onCardClick(e: MouseEvent) {
  if (suppressClick) {
    e.preventDefault()
    e.stopPropagation()
    suppressClick = false
  }
}

const STEP = 300
function nudge(dir: 1 | -1) {
  cancelMomentum()
  const target = Math.max(minOffset, Math.min(0, currentOffset - dir * STEP))
  currentOffset = target
  offset.value = target
  setTransition('transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)')
  setTransform(target)
}

let ro: ResizeObserver | null = null

onMounted(async () => {
  await load()

  const vp = viewportRef.value
  if (vp) {
    vp.addEventListener('touchstart', onTouchStart, { passive: true })
    vp.addEventListener('touchmove', onTouchMove, { passive: false })
    vp.addEventListener('touchend', onTouchEnd)
    vp.addEventListener('touchcancel', onTouchEnd)
    vp.addEventListener('mousedown', onMouseDown)
  }

  if (typeof ResizeObserver !== 'undefined' && vp) {
    ro = new ResizeObserver(recalcBounds)
    ro.observe(vp)
    if (trackRef.value) ro.observe(trackRef.value)
  }
  window.addEventListener('resize', recalcBounds)
})

onBeforeUnmount(() => {
  cancelMomentum()
  const vp = viewportRef.value
  if (vp) {
    vp.removeEventListener('touchstart', onTouchStart)
    vp.removeEventListener('touchmove', onTouchMove)
    vp.removeEventListener('touchend', onTouchEnd)
    vp.removeEventListener('touchcancel', onTouchEnd)
    vp.removeEventListener('mousedown', onMouseDown)
  }
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  ro?.disconnect()
  window.removeEventListener('resize', recalcBounds)
})
</script>

<style scoped>
.categories-section {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 70px 80px 0;
  box-sizing: border-box;
}

@media (max-width: 1280px) {
  .categories-section { padding: 48px 48px 0; }
}

@media (max-width: 1024px) {
  .categories-section { padding: 40px 32px 0; }
}

@media (max-width: 768px) {
  .categories-section { padding: 32px 20px 0; }
}

@media (max-width: 480px) {
  .categories-section { padding: 24px 16px 0; }
}

/* ── Header ──────────────────────────────────────────────── */
.categories-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.categories-title {
  font-size: 25px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.02em;
}

.categories-nav {
  display: flex;
  gap: 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #1a1a1a;
  transition: opacity 0.15s;
  padding: 0;
}
.nav-btn:hover { opacity: 0.5; }
.nav-btn.disabled { opacity: 0.22; pointer-events: none; }

/* ── Viewport / Track ──────────────────────────────────────── */
.categories-viewport {
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

.categories-viewport.grabbing { cursor: grabbing; }

.categories-track {
  display: flex;
  gap: 12px;
  will-change: transform;
  padding-right: 48px;
  transform: translate3d(0, 0, 0);
}

/* ── Card ────────────────────────────────────────────────── */
.category-card {
  flex: 0 0 260px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ededef;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-drag: none;
}

@media (hover: hover) {
  .category-card:hover { background-color: #515151; }
  .category-card:hover .card-image-wrapper { background-color: #515151; }
  .category-card:hover .card-label { background-color: #515151; }
  .category-card:hover .card-title { color: #ffffff; }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background-color: #ededef;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.18s ease;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.card-label {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px 8px;
  background: #ededef;
  min-height: 38px;
  flex: 1;
  transition: background-color 0.18s ease;
}

.card-title {
  display: block;
  font-size: 12px;
  font-weight: 800;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #1a1a1a;
  line-height: 1.25;
  text-align: center;
  word-break: break-word;
  hyphens: auto;
  transition: color 0.18s ease;
}

/* ── Skeleton ────────────────────────────────────────────── */
.skeleton {
  flex: 0 0 260px;
  border-radius: 10px;
  background-color: #ededef;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.skeleton::before {
  content: '';
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton::after {
  content: '';
  display: block;
  width: 60%;
  height: 13px;
  margin: 16px auto;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 3px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 640px) {
  .category-card,
  .skeleton {
    flex: 0 0 calc((100% - 12px * 1.5) / 2.5);
    border-radius: 5px;
  }

  .skeleton::after {
    height: 11px;
    margin: 12px auto;
  }

  .categories-track {
    padding-right: 0;
  }

  .categories-title {
    font-size: 17px;
  }

  .nav-btn {
    display: none;
  }

  .card-label {
    padding: 6px 6px;
    min-height: 32px;
  }

  .card-title {
    font-size: 10px;
  }

  .card-image-wrapper,
  .card-label,
  .card-title {
    transition: none;
  }
}
</style>