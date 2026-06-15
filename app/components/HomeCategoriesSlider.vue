<template>
  <section class="categories-section">
    <div class="categories-header">
      <h2 class="categories-title">Популярные категории</h2>
      <div class="categories-nav">
        <button
            class="nav-btn"
            :class="{ disabled: scrollPos <= 0 }"
            @click="scrollLeft"
            aria-label="Назад"
        >
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.6875 24.9375L4.75 19M4.75 19L10.6875 13.0625M4.75 19H33.25" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
            class="nav-btn"
            :class="{ disabled: isAtEnd }"
            @click="scrollRight"
            aria-label="Вперёд"
        >
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27.3125 13.0625L33.25 19M33.25 19L27.3125 24.9375M33.25 19H4.75" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="!fetched && items.length === 0" class="categories-track">
      <div v-for="n in 5" :key="n" class="skeleton" />
    </div>

    <!-- Cards -->
    <div
        v-else
        ref="trackRef"
        class="categories-track"
        @scroll.passive="onScroll"
    >
      <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/catalog/${item.slug}`"
          class="category-card"
      >
        <div class="card-image-wrapper">
          <img
              v-if="item.image"
              :src="item.image"
              :alt="item.title"
              class="card-image"
              loading="lazy"
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

const loading   = ref(true)
const items     = ref<PopularItem[]>([])
const trackRef  = ref<HTMLElement | null>(null)
const scrollPos = ref(0)
const isAtEnd   = ref(false)
const fetched   = ref(false)

async function load() {
  try {
    const res = await $api<{ data: PopularItem[] }>('/popular-categories')
    items.value = res.data ?? []
    fetched.value = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
})

function onScroll() {
  const el = trackRef.value
  if (!el) return
  scrollPos.value = el.scrollLeft
  isAtEnd.value   = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
}

const SCROLL_STEP = 300

function scrollLeft() {
  trackRef.value?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
}

function scrollRight() {
  trackRef.value?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
}

onMounted(() => {
  const el = trackRef.value
  if (el) isAtEnd.value = el.scrollWidth <= el.clientWidth
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
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  color: #1a1a1a;
  transition: opacity 0.15s;
  padding: 0;
}

.nav-btn:hover {
  opacity: 0.5;
}

.nav-btn.disabled {
  opacity: 0.22;
  pointer-events: none;
}

/* ── Track ───────────────────────────────────────────────── */
.categories-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  scrollbar-width: none;
  padding-bottom: 2px;
  padding-right: 48px;
  will-change: scroll-position;
}

.categories-track::-webkit-scrollbar {
  display: none;
}

/* ── Card ────────────────────────────────────────────────── */
.category-card {
  flex: 0 0 260px;
  scroll-snap-align: start;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ededef;
  -webkit-tap-highlight-color: transparent;
  transform: translateZ(0);
}

@media (hover: hover) {
  .category-card:hover {
    background-color: #515151;
  }

  .category-card:hover .card-image-wrapper {
    background-color: #515151;
  }

  .category-card:hover .card-label {
    background-color: #515151;
  }

  .category-card:hover .card-title {
    color: #ffffff;
  }
}

/* ── Image wrapper ── */
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
  scroll-snap-align: start;
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
    scroll-snap-align: none;
  }

  .skeleton::after {
    height: 11px;
    margin: 12px auto;
  }

  .categories-track {
    padding-right: 0;
    scroll-snap-type: none;
  }

  .card-image-wrapper,
  .card-label,
  .card-title {
    transition: none;
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
}
</style>