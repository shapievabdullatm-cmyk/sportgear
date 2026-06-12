<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Blog } from '~/types/blog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

const { $api } = useApi()
const loading = ref(true)
const blogs = ref<Blog[]>([])
const searchQuery = ref('')
const deleting = ref(false)
const deleteTarget = ref<Blog | null>(null)

const pagination = ref<PaginationMeta>({
  current_page: 1,
  last_page: 1,
  per_page: 10,
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

    const res = await $api<{ data: Blog[]; meta: PaginationMeta }>(`/admin/blogs?${params}`)
    blogs.value = res.data ?? []

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

function confirmDelete(blog: Blog) {
  deleteTarget.value = blog
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $api(`/admin/blogs/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null

    // Reload current page
    await load(pagination.value.current_page)
  } finally {
    deleting.value = false
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Блог</h1>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/admin/blog-categories"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] bg-white px-3 sm:px-3.5 py-2 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors duration-150"
        >
          <Icon name="material-symbols:category-outline" class="w-3.5 h-3.5 shrink-0" />
          Категории
        </NuxtLink>
        <NuxtLink
          to="/admin/blogs/create"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 sm:px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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
          placeholder="Поиск по заголовку или slug..."
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
    <div v-else-if="!blogs.length" class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
      {{ searchQuery ? 'Статьи не найдены' : 'Статьи не созданы' }}
    </div>

    <!-- Table (Desktop) -->
    <div v-else class="hidden sm:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] border-collapse">
          <thead>
            <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
              <th class="th w-12">ID</th>
              <th class="th w-32">Баннер</th>
              <th class="th">Заголовок</th>
              <th class="th w-32">Дата</th>
              <th class="th w-24 text-center">Статус</th>
              <th class="th w-32 text-right">Действия</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="blog in blogs"
              :key="blog.id"
              class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
            >
              <td class="td text-[#ABABAB]">{{ blog.id }}</td>

              <td class="td">
                <div v-if="blog.banner_image" class="w-20 h-10 rounded overflow-hidden bg-[#F0EEE9]">
                  <img :src="blog.banner_image" :alt="blog.title" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-20 h-10 rounded bg-[#F0EEE9] flex items-center justify-center">
                  <Icon name="material-symbols:image-outline" class="w-5 h-5 text-[#C0BEB8]" />
                </div>
              </td>

              <td class="td">
                <div class="max-w-md">
                  <div class="font-medium text-[#1A1A1A] truncate">{{ blog.title }}</div>
                  <div class="text-[11px] text-[#ABABAB] truncate">/{{ blog.slug }}</div>
                </div>
              </td>

              <td class="td text-[#ABABAB]">
                {{ blog.published_at ? formatDate(blog.published_at) : '—' }}
              </td>

              <td class="td text-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  :class="blog.is_published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="blog.is_published ? 'bg-green-500' : 'bg-gray-400'" />
                  {{ blog.is_published ? 'Опубликован' : 'Черновик' }}
                </span>
              </td>

              <td class="td">
                <div class="flex items-center justify-end gap-1">
                  <NuxtLink
                    :to="`/admin/blogs/${blog.id}/edit`"
                    class="w-7 h-7 flex items-center justify-center rounded text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
                    title="Редактировать"
                  >
                    <Icon name="material-symbols:edit-outline" class="w-4 h-4" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="w-7 h-7 flex items-center justify-center rounded text-[#C0BEB8] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Удалить"
                    @click="confirmDelete(blog)"
                  >
                    <Icon name="material-symbols:delete-outline" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.last_page > 1 || pagination.total > 10" class="border-t border-[#F0EEE9] px-5 py-4">
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

    <!-- Cards (Mobile) -->
    <div v-if="!loading && blogs.length > 0" class="sm:hidden space-y-3">
      <div
        v-for="blog in blogs"
        :key="blog.id"
        class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden"
      >
        <div v-if="blog.banner_image" class="w-full bg-[#F0EEE9]">
          <img :src="blog.banner_image" :alt="blog.title" class="w-full h-auto" />
        </div>
        <div v-else class="w-full h-32 bg-[#F0EEE9] flex items-center justify-center">
          <Icon name="material-symbols:image-outline" class="w-8 h-8 text-[#C0BEB8]" />
        </div>

        <div class="p-4 space-y-3">
          <div>
            <div class="font-medium text-[13px] text-[#1A1A1A] mb-1">{{ blog.title }}</div>
            <div class="text-[11px] text-[#ABABAB]">/{{ blog.slug }}</div>
          </div>

          <div class="flex items-center justify-between text-[11px]">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
              :class="blog.is_published
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="blog.is_published ? 'bg-green-500' : 'bg-gray-400'" />
              {{ blog.is_published ? 'Опубликован' : 'Черновик' }}
            </span>
            <span class="text-[#ABABAB]">
              {{ blog.published_at ? formatDate(blog.published_at) : '—' }}
            </span>
          </div>

          <div class="flex gap-2 pt-2 border-t border-[#F0EEE9]">
            <NuxtLink
              :to="`/admin/blogs/${blog.id}/edit`"
              class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F0EEE9] px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#E8E6E0] transition-colors"
            >
              <Icon name="material-symbols:edit-outline" class="w-4 h-4" />
              Редактировать
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors"
              @click="confirmDelete(blog)"
            >
              <Icon name="material-symbols:delete-outline" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div v-if="pagination.last_page > 1 || pagination.total > 10" class="bg-white border border-[#E8E6E0] rounded-xl p-4 space-y-3">
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
    </div>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div class="bg-white rounded-xl border border-[#E8E6E0] shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
          <h2 class="text-[14px] font-semibold text-[#1A1A1A]">Удалить статью?</h2>
          <p class="text-[12px] text-[#ABABAB] leading-relaxed">
            «{{ deleteTarget.title }}» будет удалена. Это действие нельзя отменить.
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

<style scoped>
.th {
  @apply px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB];
}

.td {
  @apply px-4 py-3 text-[13px] text-[#1A1A1A];
}
</style>