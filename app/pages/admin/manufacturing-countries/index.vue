<script setup>
import { ref, computed } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useApi()

const loading = ref(true)
const items = ref([])
const searchQuery = ref('')
const deletingId = ref(null)

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0
})

const perPageOptions = [10, 20, 30, 50, 100]

// Загрузка данных
async function load(page = 1) {
  loading.value = true
  try {
    const params = new URLSearchParams({
      paginate: '1',
      page: String(page),
      per_page: String(pagination.value.per_page)
    })

    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    const res = await $api(`/admin/manufacturing-countries?${params}`)
    items.value = res.data ?? []

    if (res.meta) {
      pagination.value = res.meta
    }
  } finally {
    loading.value = false
  }
}

await load()

// Поиск с debounce
let searchTimeout = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    pagination.value.current_page = 1
    load(1)
  }, 500)
}

// Пагинация
function goToPage(page) {
  if (page < 1 || page > pagination.value.last_page) return
  load(page)
}

function changePerPage(perPage) {
  pagination.value.per_page = perPage
  load(1)
}

const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const pages = []

  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) pages.push('...')

  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    pages.push(i)
  }

  if (current < last - 2) pages.push('...')

  pages.push(last)

  return pages
})

async function deleteCountry(id) {
  if (!confirm('Удалить страну производства?')) return
  deletingId.value = id
  try {
    await $api(`/admin/manufacturing-countries/${id}`, { method: 'DELETE' })
    await load(pagination.value.current_page)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Страны производства</h1>
      <NuxtLink
          to="/admin/manufacturing-countries/create"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 sm:px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по названию..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
            @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
      {{ searchQuery ? 'Ничего не найдено' : 'Страны производства не найдены' }}
    </div>

    <template v-else>

      <!-- MOBILE: карточки (до sm) -->
      <div class="sm:hidden space-y-2">
        <div
            v-for="country in items"
            :key="country.id"
            class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <!-- Флаг -->
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-[#F0EEE9] flex items-center justify-center shrink-0">
            <img v-if="country.flag_url" :src="country.flag_url" :alt="country.name" class="w-full h-full object-contain p-1.5" />
            <span v-else class="text-[9px] text-[#C0BEB8]">Нет</span>
          </div>
          <!-- Инфо -->
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-medium text-[#1A1A1A] truncate">{{ country.name }}</div>
            <div class="text-[11px] text-[#ABABAB] font-mono truncate mt-0.5">{{ country.slug }}</div>
          </div>
          <!-- Действия -->
          <div class="flex items-center gap-1 shrink-0">
            <NuxtLink
                :to="`/admin/manufacturing-countries/${country.id}/edit`"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </NuxtLink>
            <button
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors"
                :disabled="deletingId === country.id"
                @click="deleteCountry(country.id)"
            >
              <div v-if="deletingId === country.id" class="w-3.5 h-3.5 border-2 border-[#E8E6E0] border-t-[#C0BEB8] rounded-full animate-spin" />
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- DESKTOP: таблица (sm и выше) -->
      <div class="hidden sm:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] border-collapse">
            <thead>
            <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
              <th class="th w-12">ID</th>
              <th class="th w-36">Флаг</th>
              <th class="th">Название</th>
              <th class="th">Slug</th>
              <th class="th w-24 text-right">Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="country in items"
                :key="country.id"
                class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
            >
              <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ country.id }}</td>
              <td class="td">
                <div class="w-28 h-12 rounded-lg overflow-hidden bg-[#F0EEE9] flex items-center justify-center shrink-0">
                  <img v-if="country.flag_url" :src="country.flag_url" :alt="country.name" class="w-full h-full object-contain p-2" />
                  <span v-else class="text-[10px] text-[#C0BEB8]">Нет</span>
                </div>
              </td>
              <td class="td text-[13px] font-medium text-[#1A1A1A]">{{ country.name }}</td>
              <td class="td text-[13px] text-[#888] font-mono">{{ country.slug }}</td>
              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <NuxtLink
                      :to="`/admin/manufacturing-countries/${country.id}/edit`"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </NuxtLink>
                  <button
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                      :disabled="deletingId === country.id"
                      @click="deleteCountry(country.id)"
                  >
                    <div v-if="deletingId === country.id" class="w-3 h-3 border-2 border-[#E8E6E0] border-t-[#C0BEB8] rounded-full animate-spin" />
                    <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ПАГИНАЦИЯ (общая) -->
      <div v-if="pagination.total > pagination.per_page" class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3.5">

        <!-- Мобильная пагинация -->
        <div class="sm:hidden space-y-3">
          <!-- Счётчик -->
          <p class="text-center text-[12px] text-[#ABABAB]">
            {{ pagination.from }}–{{ pagination.to }} из {{ pagination.total }}
          </p>
          <!-- Страницы -->
          <div class="flex items-center justify-center gap-1">
            <button
                type="button"
                :disabled="pagination.current_page === 1"
                @click="goToPage(pagination.current_page - 1)"
                class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="page in visiblePages" :key="page">
              <button
                  v-if="page !== '...'"
                  type="button"
                  @click="goToPage(page)"
                  :class="[
                  'inline-flex items-center justify-center w-9 h-9 rounded-lg text-[13px] font-medium transition-colors',
                  page === pagination.current_page
                    ? 'bg-[#1A1A1A] text-white'
                    : 'border border-[#E8E6E0] text-[#1A1A1A] hover:bg-[#FAFAF8]'
                ]"
              >{{ page }}</button>
              <span v-else class="inline-flex items-center justify-center w-9 h-9 text-[13px] text-[#ABABAB]">…</span>
            </template>
            <button
                type="button"
                :disabled="pagination.current_page === pagination.last_page"
                @click="goToPage(pagination.current_page + 1)"
                class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <!-- По сколько показывать -->
          <div class="flex items-center justify-center gap-1.5">
            <span class="text-[12px] text-[#ABABAB]">По</span>
            <div class="flex gap-1">
              <button
                  v-for="n in perPageOptions"
                  :key="n"
                  @click="changePerPage(n)"
                  class="h-7 min-w-[32px] px-2 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors"
                  :class="pagination.per_page === n ? 'bg-[#1A1A1A] text-white' : 'border border-[#E8E6E0] text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
              >{{ n }}</button>
            </div>
          </div>
        </div>

        <!-- Десктопная пагинация -->
        <div class="hidden sm:flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[12px] text-[#ABABAB]">Показывать</span>
            <div class="flex gap-1">
              <button
                  v-for="n in perPageOptions"
                  :key="n"
                  @click="changePerPage(n)"
                  class="h-6 min-w-[28px] px-1.5 flex items-center justify-center rounded text-[12px] font-medium transition-colors"
                  :class="pagination.per_page === n ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
              >{{ n }}</button>
            </div>
            <span class="text-[12px] text-[#ABABAB]">· {{ pagination.from }}–{{ pagination.to }} из {{ pagination.total }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
                type="button"
                :disabled="pagination.current_page === 1"
                @click="goToPage(pagination.current_page - 1)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="page in visiblePages" :key="page">
              <button
                  v-if="page !== '...'"
                  type="button"
                  @click="goToPage(page)"
                  :class="[
                  'inline-flex items-center justify-center w-8 h-8 rounded-md text-[12px] font-medium transition-colors',
                  page === pagination.current_page
                    ? 'bg-[#1A1A1A] text-white'
                    : 'border border-[#E8E6E0] hover:bg-[#FAFAF8]'
                ]"
              >{{ page }}</button>
              <span v-else class="inline-flex items-center justify-center w-8 h-8 text-[12px] text-[#ABABAB]">…</span>
            </template>
            <button
                type="button"
                :disabled="pagination.current_page === pagination.last_page"
                @click="goToPage(pagination.current_page + 1)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

      </div>

    </template>
  </div>
</template>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
</style>