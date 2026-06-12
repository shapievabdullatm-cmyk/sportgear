<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuickLinksClientStore } from '~/stores/quick-links'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: number
  title: string
  slug: string
  image: string | null
  parent_id: number | null
  position: number
}

// ─── Quick links ──────────────────────────────────────────────────────────────
const quickLinksStore = useQuickLinksClientStore()
const { links: quickLinks } = storeToRefs(quickLinksStore)

// ─── Data ─────────────────────────────────────────────────────────────────────
const { $api } = useApi()
const categories = ref<Category[]>([])
const loaded = ref(false)

async function ensureLoaded() {
  if (loaded.value) return
  try {
    const res = await $api<{ data: Category[] } | Category[]>('/categories')
    categories.value = Array.isArray(res) ? res : res.data
    loaded.value = true
  } catch {
    // silent
  }
}

// ─── Tree helpers ─────────────────────────────────────────────────────────────
function sorted(list: Category[]) {
  return [...list].sort((a, b) => a.position - b.position)
}
const roots = computed(() => sorted(categories.value.filter(c => c.parent_id === null)))

function childrenOf(id: number): Category[] {
  return sorted(categories.value.filter(c => c.parent_id === id))
}
function hasKids(cat: Category) {
  return categories.value.some(c => c.parent_id === cat.id)
}
function catUrl(cat: Category) {
  return `/catalog/${cat.slug}`
}

// ─── Desktop mega-menu ────────────────────────────────────────────────────────
const megaOpen  = ref(false)
const hoveredL1 = ref<Category | null>(null)
const hoveredL2 = ref<Category | null>(null)
const hoveredL3 = ref<Category | null>(null)
const panelTop  = ref(103) // динамически вычисляется при открытии
let pickL1Timer: ReturnType<typeof setTimeout> | null = null
let pickL2Timer: ReturnType<typeof setTimeout> | null = null

const l2 = computed(() => hoveredL1.value ? childrenOf(hoveredL1.value.id) : [])
const l3 = computed(() => hoveredL2.value ? childrenOf(hoveredL2.value.id) : [])

// Превью: L3 (если есть фото) → L2 → L1 → первая корневая с фото → первая корневая
const previewCat = computed(
    () => (hoveredL3.value?.image ? hoveredL3.value : null)
        ?? hoveredL2.value
        ?? hoveredL1.value
        ?? roots.value.find(c => c.image)
        ?? roots.value[0]
        ?? null
)

function openMega() {
  // Измеряем низ хедера — панель прилипает вплотную без зазора
  const header = document.querySelector('.site-header') as HTMLElement | null
  if (header) panelTop.value = Math.round(header.getBoundingClientRect().bottom)
  ensureLoaded()
  megaOpen.value = true
}
function toggleMega() {
  if (megaOpen.value) {
    closeMega()
  } else {
    openMega()
  }
}
function closeMega() {
  if (pickL1Timer) { clearTimeout(pickL1Timer); pickL1Timer = null }
  if (pickL2Timer) { clearTimeout(pickL2Timer); pickL2Timer = null }
  megaOpen.value = false
  hoveredL1.value = null
  hoveredL2.value = null
  hoveredL3.value = null
}
function pickL1(cat: Category) {
  if (pickL1Timer) { clearTimeout(pickL1Timer); pickL1Timer = null }
  if (hoveredL1.value?.id === cat.id) return
  pickL1Timer = setTimeout(() => {
    hoveredL1.value = cat
    hoveredL2.value = null
    hoveredL3.value = null
    pickL1Timer = null
  }, 200)
}
function cancelPickL1() {
  if (pickL1Timer) { clearTimeout(pickL1Timer); pickL1Timer = null }
}
function pickL2(cat: Category) {
  if (pickL2Timer) { clearTimeout(pickL2Timer); pickL2Timer = null }
  if (hoveredL2.value?.id === cat.id) return
  pickL2Timer = setTimeout(() => {
    hoveredL2.value = cat
    hoveredL3.value = null
    pickL2Timer = null
  }, 180)
}
function cancelPickL2() {
  if (pickL2Timer) { clearTimeout(pickL2Timer); pickL2Timer = null }
}
function pickL3(cat: Category) {
  hoveredL3.value = cat
}

// ─── Mobile menu ─────────────────────────────────────────────────────────────
const mobileOpen = ref(false)
const mobilePath = ref<Category[]>([])

const mobileParent = computed(() => mobilePath.value.at(-1) ?? null)
const mobileItems  = computed(() => mobileParent.value ? childrenOf(mobileParent.value.id) : roots.value)
const mobileTitle  = computed(() => mobileParent.value?.title ?? 'КАТАЛОГ')

function openMobile() {
  ensureLoaded()
  mobileOpen.value = true
  mobilePath.value = []
}
function closeMobile() {
  mobileOpen.value = false
  mobilePath.value = []
}
function mobileEnter(cat: Category) {
  if (hasKids(cat)) {
    mobilePath.value = [...mobilePath.value, cat]
  } else {
    navigateTo(catUrl(cat))
    closeMobile()
  }
}
function mobileBack() {
  mobilePath.value = mobilePath.value.slice(0, -1)
}

watch(mobileOpen, v => { document.body.style.overflow = v ? 'hidden' : '' })
onUnmounted(() => { document.body.style.overflow = '' })

const route = useRoute()
watch(() => route.path, () => {
  closeMega()
  closeMobile()
})

defineExpose({ openMobile })
</script>

<template>
  <!-- ═══════════════════════════════════════════════════════════════════════
       DESKTOP  ─  триггер + мега-панель
       ═══════════════════════════════════════════════════════════════════════ -->
  <div class="catalog-wrap">
    <button class="catalog-trigger" @click="toggleMega">
      КАТАЛОГ
    </button>

    <!-- Бэкдроп — закрывает меню по клику вне панели -->
    <Teleport to="body">
      <div v-if="megaOpen" class="mega-backdrop" @click="closeMega" />
    </Teleport>

    <Transition name="mega-drop">
      <div
          v-if="megaOpen"
          class="mega-panel"
          :style="{ top: panelTop + 'px' }"
      >
        <button class="mega-close" aria-label="Закрыть" @click="closeMega">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- ── Левая часть: колонки ────────────────────────────────────── -->
        <div class="mega-cols-area">

          <div class="mega-cols">
            <!-- L1 -->
            <div class="mega-col">
              <NuxtLink
                  v-for="cat in roots"
                  :key="cat.id"
                  :to="catUrl(cat)"
                  class="mega-link"
                  :class="{ 'is-active': hoveredL1?.id === cat.id }"
                  @mouseenter="pickL1(cat)"
                  @mouseleave="cancelPickL1"
                  @click="closeMega"
              >
                <span>{{ cat.title }}</span>
                <svg v-if="hasKids(cat)" class="mega-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </NuxtLink>
            </div>

            <!-- L2 -->
            <Transition name="col-slide">
              <div v-if="l2.length" class="mega-col">
                <TransitionGroup name="item-slide" tag="div" class="mega-col-inner">
                  <NuxtLink
                      v-for="cat in l2"
                      :key="cat.id"
                      :to="catUrl(cat)"
                      class="mega-link"
                      :class="{ 'is-active': hoveredL2?.id === cat.id }"
                      @mouseenter="pickL2(cat)"
                      @mouseleave="cancelPickL2"
                      @click="closeMega"
                  >
                    <span>{{ cat.title }}</span>
                    <svg v-if="hasKids(cat)" class="mega-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </NuxtLink>
                </TransitionGroup>
              </div>
            </Transition>

            <!-- L3 -->
            <Transition name="col-slide">
              <div v-if="l3.length" class="mega-col">
                <TransitionGroup name="item-slide" tag="div" class="mega-col-inner">
                  <NuxtLink
                      v-for="cat in l3"
                      :key="cat.id"
                      :to="catUrl(cat)"
                      class="mega-link"
                      :class="{ 'is-active': hoveredL3?.id === cat.id }"
                      @mouseenter="pickL3(cat)"
                      @click="closeMega"
                  >
                    <span>{{ cat.title }}</span>
                  </NuxtLink>
                </TransitionGroup>
              </div>
            </Transition>
          </div>
        </div>

        <!-- ── Правая часть: фото во всю высоту панели ────────────────── -->
        <div class="mega-image-side">
          <Transition name="img-fade">
            <img
                v-if="previewCat?.image"
                :key="previewCat.id"
                :src="previewCat.image"
                :alt="previewCat.title"
                class="mega-image"
            />
          </Transition>
        </div>
      </div>
    </Transition>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════
       MOBILE  ─  drawer слева
       ═══════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="mobileOpen" class="mob-backdrop" @click="closeMobile" />
    </Transition>

    <Transition name="mob-slide">
      <div v-if="mobileOpen" class="mob-drawer">
        <div class="mob-bar">
          <button v-if="mobilePath.length" class="mob-btn" @click="mobileBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polyline points="15 18 9 12 15 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <span v-else class="mob-spacer" />

          <NuxtLink to="/" class="mob-logo-link" @click="closeMobile">
            <Icon name="my:logo" class="mob-logo" />
          </NuxtLink>

          <button class="mob-btn" @click="closeMobile" aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="mob-section-title">{{ mobileTitle }}</div>

        <NuxtLink
            v-if="mobileParent"
            :to="catUrl(mobileParent)"
            class="mob-view-all"
            @click="closeMobile"
        >
          Все товары раздела
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </NuxtLink>

        <div class="mob-list">
          <button
              v-for="cat in mobileItems"
              :key="cat.id"
              class="mob-item"
              @click="mobileEnter(cat)"
          >
            <span>{{ cat.title }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polyline points="9 18 15 12 9 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div v-if="!mobileParent && quickLinks.length" class="mob-quick-links">
            <div class="mob-quick-links-title">Быстрые ссылки</div>
            <div class="mob-quick-links-list">
              <a v-for="link in quickLinks" :key="link.id" :href="link.url" class="mob-quick-link" @click="closeMobile">
                {{ link.title }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Обёртка триггера ───────────────────────────────────────────────────── */
.catalog-wrap {
  position: relative;
  display: contents;
}

.catalog-trigger {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #000;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.catalog-trigger:hover { opacity: 0.55; }

/* ─── Бэкдроп мега-меню ──────────────────────────────────────────────────── */
.mega-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
}

/* ─── Мега-панель ─────────────────────────────────────────────────────────── */
/* top задаётся через :style (getBoundingClientRect) = 0 зазор с хедером     */
/* bottom:0 = растягивается до низа viewport                                  */
.mega-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: #fff;
  display: flex;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
}

.mega-close {
  position: absolute;
  top: 16px;
  right: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  display: flex;
  align-items: center;
  padding: 4px;
  z-index: 2;
  transition: color 0.15s;
}
.mega-close:hover { color: #000; }

/* Левая часть (колонки) */
.mega-cols-area {
  flex: 1;
  min-width: 0;
  position: relative;
  padding: 40px 48px;
  overflow-y: auto;
}

.mega-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 8px;
  align-items: start;
  width: 100%;
}

/* ─── Колонки ─────────────────────────────────────────────────────────────── */
.mega-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mega-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #222;
  text-decoration: none;
  border-radius: 6px;
  line-height: 1.35;
  transition: background 0.12s, color 0.12s;
}
.mega-link:hover,
.mega-link.is-active {
  background: #f5f5f5;
  color: #000;
}
.mega-link.is-active .mega-chevron { opacity: 1; }

.mega-chevron {
  opacity: 0.3;
  flex-shrink: 0;
  transition: opacity 0.12s;
}
.mega-link:hover .mega-chevron { opacity: 0.65; }

/* ─── Правая панель: фото во всю высоту ──────────────────────────────────── */
.mega-image-side {
  flex-shrink: 0;
  align-self: stretch;
  overflow: hidden;
  /* Фиксированная ширина — контейнер не прыгает при смене фото */
  width: clamp(240px, 24vw, 400px);
  margin-right: 48px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}

.mega-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.mega-image-placeholder {
  position: absolute;
  inset: 0;
  background: transparent;
}

/* ─── Mobile backdrop ────────────────────────────────────────────────────── */
.mob-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1099;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* ─── Mobile drawer ──────────────────────────────────────────────────────── */
.mob-drawer {
  position: fixed;
  top: 0; left: 0;
  width: min(420px, 100vw);
  height: 100%;
  z-index: 1100;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mob-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.mob-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.15s;
}
.mob-btn:hover { background: #f5f5f5; }

.mob-spacer { width: 32px; }
.mob-logo-link { display: flex; align-items: center; }
.mob-logo { font-size: 36px; }

.mob-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #aaa;
  padding: 18px 20px 10px;
  flex-shrink: 0;
}

.mob-view-all {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 12px 8px;
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #000;
  text-decoration: none;
  flex-shrink: 0;
  transition: background 0.15s;
}
.mob-view-all:hover { background: #ebebeb; }

.mob-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 24px;
  -webkit-overflow-scrolling: touch;
}

.mob-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  font-size: 15px;
  font-weight: 500;
  color: #111;
  background: none;
  border: none;
  border-bottom: 1px solid #f4f4f4;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  border-radius: 6px;
}
.mob-item:hover { background: #fafafa; }
.mob-item:last-child { border-bottom: none; }
.mob-item svg { color: #bbb; flex-shrink: 0; }

/* ─── Быстрые ссылки ─────────────────────────────────────────────────────── */
.mob-quick-links {
  padding: 16px 0 12px;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.mob-quick-links-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #aaa;
  margin-bottom: 12px;
}
.mob-quick-links-list { display: flex; flex-direction: column; gap: 2px; }
.mob-quick-link {
  display: block;
  padding: 9px 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.12s, color 0.12s;
}
.mob-quick-link:hover { background: #f5f5f5; color: #000; }

/* ─── Transitions ────────────────────────────────────────────────────────── */

/* Появление всей панели */
.mega-drop-enter-active {
  transition: opacity 0.22s ease, transform 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.mega-drop-leave-active {
  transition: opacity 0.16s ease, transform 0.18s ease;
}
.mega-drop-enter-from,
.mega-drop-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── Стаггер L1 при открытии панели ─────── */
@keyframes link-in {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

.mega-drop-enter-active .mega-col:first-child .mega-link {
  animation: link-in 0.34s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(1)  { animation-delay: 55ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(2)  { animation-delay: 85ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(3)  { animation-delay: 115ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(4)  { animation-delay: 145ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(5)  { animation-delay: 175ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(6)  { animation-delay: 205ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(7)  { animation-delay: 235ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(8)  { animation-delay: 265ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(9)  { animation-delay: 295ms }
.mega-drop-enter-active .mega-col:first-child .mega-link:nth-child(10) { animation-delay: 325ms }

/* ── L2 / L3 колонка: плавное появление/скрытие ─────── */
/* Колонка сама не анимируется — только появляется/исчезает без сдвига лейаута */
.col-slide-enter-active { transition: opacity 0.15s ease; }
.col-slide-leave-active  { transition: opacity 0.1s ease; pointer-events: none; }
.col-slide-enter-from,
.col-slide-leave-to      { opacity: 0; }

/* ── Пункты внутри L2/L3: TransitionGroup item-slide ─── */
/* Враппер TransitionGroup — повторяет flex-колонку */
.mega-col-inner {
  display: flex;
  flex-direction: column;
  position: relative; /* нужен TransitionGroup для move-transition */
}

.item-slide-enter-active {
  transition: opacity 0.24s ease, transform 0.26s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.item-slide-leave-active {
  transition: opacity 0.14s ease;
  position: absolute; /* убираем из потока при уходе — нет скачков */
  width: 100%;
  pointer-events: none;
}
.item-slide-move {
  transition: transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.item-slide-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}
.item-slide-leave-to { opacity: 0; }

/* ── Фото: кросс-фейд + выезд снизу ─── */
.img-fade-enter-active {
  transition: opacity 0.35s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.img-fade-leave-active {
  transition: opacity 0.2s ease;
  position: absolute;
}
.img-fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.img-fade-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.mob-slide-enter-active,
.mob-slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.mob-slide-enter-from,
.mob-slide-leave-to { transform: translateX(-100%); }

/* ─── Скрыть на мобиле ───────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .catalog-wrap { display: none; }
}
</style>