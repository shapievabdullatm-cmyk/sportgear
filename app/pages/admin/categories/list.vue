<template>
  <div class="space-y-6">

    <AdminAppToast
        :show="toast.show.value"
        :progress="toast.progress.value"
        title="Категория удалена"
        subtitle="Категория успешно удалена"
        @close="toast.close"
    />

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Категории</h1>

      <div class="flex items-center gap-3">
        <!-- View Switcher -->
        <div class="inline-flex items-center rounded-lg border border-[#E8E6E0] bg-white p-1">
          <NuxtLink
              to="/admin/categories"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h8M8 16h5"/>
            </svg>
            Иерархия
          </NuxtLink>
          <NuxtLink
              to="/admin/categories/list"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-[#1A1A1A] text-white transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            Список
          </NuxtLink>
        </div>

        <NuxtLink
            to="/admin/categories/create"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[12px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Добавить
        </NuxtLink>
      </div>
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
            placeholder="Поиск по названию или slug..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
            @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Desktop List -->
    <div class="hidden md:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div v-if="loading" class="py-16 text-center text-[13px] text-[#C0BEB8]">Загрузка...</div>

      <div v-else-if="!items.length" class="py-16 text-center text-[13px] text-[#C0BEB8]">
        {{ searchQuery ? 'Ничего не найдено' : 'Категорий пока нет' }}
      </div>

      <ul v-else class="divide-y divide-[#F0EEE9]">
        <li
            v-for="category in items"
            :key="category.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAF8] transition-colors duration-100 group"
        >
          <!-- Фото -->
          <div class="w-9 h-[54px] rounded-md overflow-hidden shrink-0 bg-[#F5F4F0]">
            <img v-if="category.image" :src="category.image" :alt="category.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-4 h-4 text-[#D5D3CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          </div>

          <!-- Title + meta -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-[13px] font-medium text-[#1A1A1A] truncate">{{ category.title }}</p>
              <span v-if="category.parent_title" class="shrink-0 px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[10px] font-medium text-[#ABABAB]">
                {{ category.parent_title }}
              </span>
            </div>
            <p class="text-[11px] text-[#ABABAB] truncate font-mono">{{ category.slug }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <NuxtLink
                :to="`/admin/categories/${category.id}/edit`"
                class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#F0EEE9] transition-colors"
                title="Редактировать"
            >
              <svg class="w-3.5 h-3.5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </NuxtLink>

            <button
                type="button"
                @click="confirmDelete(category)"
                class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-50 transition-colors"
                title="Удалить"
            >
              <svg class="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </li>
      </ul>

      <!-- Desktop Pagination -->
      <div v-if="pagination.total > pagination.per_page" class="border-t border-[#F0EEE9] px-5 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[12px] text-[#ABABAB]">Показывать</span>
            <div class="flex gap-1">
              <button
                  v-for="n in perPageOptions"
                  :key="n"
                  @click="changePerPage(n)"
                  class="h-6 min-w-[28px] px-1.5 flex items-center justify-center rounded text-[12px] font-medium transition-colors"
                  :class="pagination.per_page === n ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
              >
                {{ n }}
              </button>
            </div>
            <span class="text-[12px] text-[#ABABAB]">
              · Показано {{ pagination.from }}-{{ pagination.to }} из {{ pagination.total }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
                type="button"
                :disabled="pagination.current_page === 1"
                @click="goToPage(pagination.current_page - 1)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
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
              >
                {{ page }}
              </button>
              <span v-else class="inline-flex items-center justify-center w-8 h-8 text-[12px] text-[#ABABAB]">...</span>
            </template>

            <button
                type="button"
                :disabled="pagination.current_page === pagination.last_page"
                @click="goToPage(pagination.current_page + 1)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-2">
      <div v-if="loading" class="bg-white border border-[#E8E6E0] rounded-xl py-16 text-center text-[13px] text-[#C0BEB8]">
        Загрузка...
      </div>

      <div v-else-if="!items.length" class="bg-white border border-[#E8E6E0] rounded-xl py-16 text-center text-[13px] text-[#C0BEB8]">
        {{ searchQuery ? 'Ничего не найдено' : 'Категорий пока нет' }}
      </div>

      <template v-else>
        <div v-for="category in items" :key="category.id"
             class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3.5 flex items-start gap-3">
          <!-- Фото -->
          <div class="w-12 h-[72px] rounded-md overflow-hidden shrink-0 bg-[#F5F4F0]">
            <img v-if="category.image" :src="category.image" :alt="category.title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-5 h-5 text-[#D5D3CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <NuxtLink
                    :to="`/admin/categories/${category.id}/edit`"
                    class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors block"
                >
                  {{ category.title }}
                </NuxtLink>
                <p class="text-[11px] text-[#ABABAB] truncate font-mono mt-0.5">{{ category.slug }}</p>
              </div>
              <button
                  type="button"
                  @click="confirmDelete(category)"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
            <div v-if="category.parent_title" class="flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F0EEE9] text-[10px] font-medium text-[#ABABAB]">
                {{ category.parent_title }}
              </span>
            </div>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="pagination.total > pagination.per_page" class="bg-white border border-[#E8E6E0] rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between text-[12px] text-[#ABABAB]">
            <span>Показано {{ pagination.from }}-{{ pagination.to }} из {{ pagination.total }}</span>
          </div>
          <div class="flex items-center justify-center gap-2">
            <button
                type="button"
                :disabled="pagination.current_page === 1"
                @click="goToPage(pagination.current_page - 1)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <span class="text-[12px] text-[#1A1A1A] font-medium">
              {{ pagination.current_page }} / {{ pagination.last_page }}
            </span>

            <button
                type="button"
                :disabled="pagination.current_page === pagination.last_page"
                @click="goToPage(pagination.current_page + 1)"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div class="bg-white rounded-xl border border-[#E8E6E0] shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
          <h2 class="text-[14px] font-semibold text-[#1A1A1A]">Удалить категорию?</h2>
          <p class="text-[12px] text-[#ABABAB] leading-relaxed">
            «{{ deleteTarget.title }}» будет удалена. Фото категории также будет удалено с сервера.
            Это действие нельзя отменить.
          </p>
          <div class="flex justify-end gap-2">
            <button type="button" @click="deleteTarget = null"
                    class="px-3.5 py-2 rounded-lg text-[12px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
              Отмена
            </button>
            <button type="button" :disabled="deleting" @click="doDelete"
                    class="px-3.5 py-2 rounded-lg bg-red-500 text-[12px] font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50">
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', })

interface Category {
  id:           number
  title:        string
  slug:         string
  image:        string | null
  parent_id:    number | null
  parent_title?: string
  position:     number
}

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

const { $api }  = useApi()
const toast     = useToast()

const loading      = ref(true)
const items        = ref<Category[]>([])
const searchQuery  = ref('')
const deleting     = ref(false)
const deleteTarget = ref<Category | null>(null)

const pagination = ref<PaginationMeta>({
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: 0,
  to: 0
})

const perPageOptions = [10, 20, 30, 50, 100] as const

// ─── Load ─────────────────────────────────────────────────────────────────────

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

    const res = await $api<{ data: Category[]; meta: PaginationMeta }>(`/admin/categories?${params}`)
    items.value = res.data ?? []

    if (res.meta) {
      pagination.value = res.meta
    }
  } finally {
    loading.value = false
  }
}

await load()

// ─── Search with debounce ─────────────────────────────────────────────────────

let searchTimeout: NodeJS.Timeout | null = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    pagination.value.current_page = 1
    load(1)
  }, 500)
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.last_page) return
  load(page)
}

function changePerPage(perPage: number) {
  pagination.value.per_page = perPage
  load(1)
}

const visiblePages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const pages: (number | string)[] = []

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

// ─── Delete ───────────────────────────────────────────────────────────────────

function confirmDelete(cat: Category) {
  deleteTarget.value = cat
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $api(`/admin/categories/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    toast.open()

    // Reload current page
    await load(pagination.value.current_page)
  } finally {
    deleting.value = false
  }
}
</script>