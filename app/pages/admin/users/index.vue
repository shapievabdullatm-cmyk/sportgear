<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUserStore } from '~/stores/admin/user'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const store = useUserStore()

const PER_PAGE_OPTIONS = [10, 20, 30, 50, 100]

const searchQuery  = ref('')
const currentPage  = ref(1)
const perPage      = ref(20)
const deletingId   = ref<number | null>(null)
const deleteTarget = ref<{ id: number; name: string } | null>(null)
const deleting     = ref(false)

async function load() {
  await store.fetchAll({
    page:     currentPage.value,
    per_page: perPage.value,
    search:   searchQuery.value.trim() || undefined,
  })
}

await load()

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    load()
  }, 400)
}

function setPerPage(n: number) {
  if (perPage.value === n) return
  perPage.value = n
  currentPage.value = 1
  load()
}

watch(currentPage, load)

// ── Pagination helpers (паттерн как в products/index.vue) ─────────────
const totalPages = computed(() => store.pagination?.last_page ?? 1)

const rangeText = computed(() => {
  if (!store.pagination) return '0'
  const { from, to, total } = store.pagination
  if (!total) return '0'
  return `${from}–${to} из ${total}`
})

const pagesToShow = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: (number | '...')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (cur > 3) pages.push('...')

  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    pages.push(i)
  }

  if (cur < total - 2) pages.push('...')
  pages.push(total)

  return pages
})

// ── Helpers ───────────────────────────────────────────────────────────
function fullName(u: { first_name: string | null; last_name: string | null }): string {
  return [u.last_name, u.first_name].filter(Boolean).join(' ')
}

function genderLabel(g: string | null): string {
  if (g === 'male')   return 'М'
  if (g === 'female') return 'Ж'
  return '—'
}

function confirmDelete(user: { id: number; first_name: string | null; last_name: string | null; phone: string | null }) {
  deleteTarget.value = {
    id:   user.id,
    name: fullName(user) || user.phone || 'пользователя',
  }
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.destroy(deleteTarget.value.id)
    await load()
  } finally {
    deleting.value = false
    deleteTarget.value = null
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Пользователи</h1>
        <span v-if="store.pagination" class="text-[12px] text-[#ABABAB]">
          Всего: <strong class="text-[#1A1A1A]">{{ store.pagination.total }}</strong>
        </span>
      </div>
      <NuxtLink
          to="/admin/users/create"
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
            placeholder="Поиск по имени, фамилии, телефону или email..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
            @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <template v-else>

      <!-- DESKTOP: таблица + пагинация в одном блоке -->
      <div class="hidden md:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] border-collapse">
            <thead>
            <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
              <th class="th w-12">ID</th>
              <th class="th">ФИО</th>
              <th class="th">Телефон</th>
              <th class="th">Email</th>
              <th class="th w-16">Пол</th>
              <th class="th w-24">Адресов</th>
              <th class="th w-24 text-right">Действия</th>
            </tr>
            </thead>
            <tbody>
            <template v-if="store.users.length">
              <tr
                  v-for="user in store.users"
                  :key="user.id"
                  class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
              >
                <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ user.id }}</td>
                <td class="td text-[13px] font-medium text-[#1A1A1A]">{{ fullName(user) || '—' }}</td>
                <td class="td text-[13px] text-[#555] font-mono">{{ user.phone || '—' }}</td>
                <td class="td text-[13px] text-[#888]">{{ user.email || '—' }}</td>
                <td class="td text-[13px] text-[#555]">{{ genderLabel(user.gender) }}</td>
                <td class="td text-[13px] text-[#555]">{{ user.addresses_count }}</td>
                <td class="td">
                  <div class="flex items-center justify-end gap-0.5">
                    <NuxtLink
                        :to="`/admin/users/${user.id}/edit`"
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </NuxtLink>
                    <button
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                        :disabled="deletingId === user.id"
                        @click="confirmDelete(user)"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="7" class="td text-center py-12 text-[13px] text-[#C0BEB8]">
                {{ searchQuery ? 'Ничего не найдено' : 'Пользователи не найдены' }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Desktop Pagination -->
        <div v-if="totalPages > 1 || store.pagination && store.pagination.total > PER_PAGE_OPTIONS[0]"
             class="flex items-center justify-between px-5 py-3 border-t border-[#F0EEE9]">
          <div class="flex items-center gap-2">
            <span class="text-[12px] text-[#ABABAB]">Показывать</span>
            <div class="flex gap-1">
              <button
                  v-for="n in PER_PAGE_OPTIONS"
                  :key="n"
                  @click="setPerPage(n)"
                  class="h-6 min-w-[28px] px-1.5 flex items-center justify-center rounded text-[12px] font-medium transition-colors"
                  :class="perPage === n ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
              >{{ n }}</button>
            </div>
            <span class="text-[12px] text-[#ABABAB]">· {{ rangeText }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <template v-for="page in pagesToShow" :key="page">
              <span v-if="page === '...'" class="w-7 h-7 flex items-center justify-center text-[12px] text-[#C0BEB8]">…</span>
              <button
                  v-else
                  @click="currentPage = page"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[12px] font-medium transition-colors"
                  :class="currentPage === page ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
              >{{ page }}</button>
            </template>
            <button
                @click="currentPage++"
                :disabled="currentPage === totalPages || totalPages === 0"
                class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- MOBILE: карточки -->
      <div class="md:hidden space-y-2">
        <template v-if="store.users.length">
          <div
              v-for="user in store.users"
              :key="user.id"
              class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
              {{ (user.last_name?.[0] || user.first_name?.[0] || '?').toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium text-[#1A1A1A] truncate">{{ fullName(user) || 'Без имени' }}</div>
              <div class="text-[11px] text-[#ABABAB] font-mono truncate mt-0.5">{{ user.phone || '—' }}</div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <NuxtLink
                  :to="`/admin/users/${user.id}/edit`"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </NuxtLink>
              <button
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors"
                  @click="confirmDelete(user)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>
          </div>
        </template>

        <div
            v-else
            class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]"
        >
          {{ searchQuery ? 'Ничего не найдено' : 'Пользователи не найдены' }}
        </div>

        <!-- Mobile Pagination -->
        <div v-if="totalPages > 1 || store.pagination && store.pagination.total > PER_PAGE_OPTIONS[0]"
             class="bg-white border border-[#E8E6E0] rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between text-[12px] text-[#ABABAB]">
            <span>{{ rangeText }}</span>
          </div>
          <div class="flex items-center justify-center gap-2">
            <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <span class="text-[12px] text-[#1A1A1A] font-medium">
              {{ currentPage }} / {{ totalPages }}
            </span>

            <button
                @click="currentPage++"
                :disabled="currentPage === totalPages || totalPages === 0"
                class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- Confirm delete modal -->
    <Transition name="fade">
      <div
          v-if="deleteTarget"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          @click.self="deleteTarget = null"
      >
        <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-xl p-6 w-80 space-y-4">
          <p class="text-[13px] font-semibold text-[#1A1A1A]">Удалить пользователя?</p>
          <p class="text-[12px] text-[#ABABAB]">
            «{{ deleteTarget.name }}» и все его адреса будут удалены без возможности восстановления.
          </p>
          <div class="flex gap-2 justify-end">
            <button
                @click="deleteTarget = null"
                class="px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
            >
              Отмена
            </button>
            <button
                @click="doDelete"
                :disabled="deleting"
                class="px-3.5 py-2 rounded-lg text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>