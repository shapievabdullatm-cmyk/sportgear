<template>
  <div class="space-y-5">

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Атрибуты</h1>
        <Transition name="fade">
          <button v-if="selectedIds.length > 0" @click="confirmBulkDelete"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-100 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Удалить ({{ selectedIds.length }})
          </button>
        </Transition>
      </div>
      <NuxtLink to="/admin/params/create"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Добавить атрибут
      </NuxtLink>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg class="w-3.5 h-3.5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </span>
        <input v-model="searchQuery" type="text" placeholder="Поиск по названию, слагу, типу…"
               class="w-full bg-white border border-[#E8E6E0] rounded-xl py-2.5 pl-9 pr-4 text-[13px] placeholder-[#C0BEB8] focus:outline-none focus:border-[#1A1A1A] transition-colors" />
      </div>
      <div class="relative" ref="typeFilterRef">
        <button type="button" @click="typeFilterOpen = !typeFilterOpen"
                class="flex items-center gap-2 bg-white border border-[#E8E6E0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1A1A1A] hover:border-[#C0BEB8] transition-colors whitespace-nowrap"
                :class="typeFilterOpen ? 'border-[#1A1A1A]' : ''">
          <svg class="w-3.5 h-3.5 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
          <span>{{ selectedTypeFilter ? allTypes.find(t => t.value === selectedTypeFilter)?.title : 'Все типы' }}</span>
          <svg class="w-3 h-3 text-[#ABABAB]" :class="typeFilterOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <Transition name="dropdown">
          <div v-if="typeFilterOpen" class="absolute top-[calc(100%+4px)] right-0 bg-white border border-[#E8E6E0] rounded-lg shadow-lg z-20 overflow-hidden min-w-[180px]">
            <button type="button" @click="selectedTypeFilter = null; typeFilterOpen = false"
                    class="w-full text-left px-3.5 py-2.5 text-[13px] flex items-center gap-2 transition-colors"
                    :class="!selectedTypeFilter ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-[#FAFAF8]'">
              Все типы
            </button>
            <button v-for="t in allTypes" :key="t.value" type="button"
                    @click="selectedTypeFilter = t.value; typeFilterOpen = false"
                    class="w-full text-left px-3.5 py-2.5 text-[13px] flex items-center gap-2 transition-colors group"
                    :class="selectedTypeFilter === t.value ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-[#FAFAF8]'">
              <component :is="typeIcon(t.value)" class="w-3.5 h-3.5" :class="selectedTypeFilter === t.value ? 'text-white/70' : 'text-[#ABABAB]'" />
              {{ t.title }}
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <div class="flex items-center gap-4 text-[12px] text-[#ABABAB]">
      <span v-if="store.pagination">Всего: <strong class="text-[#1A1A1A]">{{ store.pagination.total }}</strong></span>
      <span v-if="filteredParams.length !== store.params.length">Показано: <strong class="text-[#1A1A1A]">{{ filteredParams.length }}</strong></span>
    </div>

    <div class="hidden md:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
        <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
          <th class="th w-10 !pr-0">
            <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll"
                   class="w-3.5 h-3.5 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 cursor-pointer">
          </th>
          <th class="th w-12">ID</th>
          <th class="th">Атрибут</th>
          <th class="th w-36">Тип</th>
          <th class="th w-52">Флаги</th>
          <th class="th w-24 text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="param in paginatedParams" :key="param.id"
            class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors"
            :class="{'bg-[#FAFAF8]': selectedIds.includes(param.id)}">
          <td class="td !pr-0">
            <input type="checkbox" v-model="selectedIds" :value="param.id"
                   class="w-3.5 h-3.5 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 cursor-pointer">
          </td>
          <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ param.id }}</td>

          <td class="td">
            <div class="space-y-1">
              <NuxtLink :to="`/admin/params/${param.id}/edit`"
                        class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors">
                {{ param.title }}
              </NuxtLink>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-[11px] text-[#C0BEB8]">/{{ param.slug }}</span>
                <span v-if="param.unit" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0EEE9] text-[#888]">{{ param.unit }}</span>
              </div>
              <!-- Color swatches -->
              <div v-if="param.filter_type === 6 && param.options?.length" class="flex items-center gap-1 pt-0.5">
                <div v-for="opt in param.options.slice(0, 8)" :key="opt.id"
                     class="w-3.5 h-3.5 rounded-full border border-[#E8E6E0] shrink-0"
                     :style="{ background: optColorCss(opt.value) }" :title="optColorName(opt.value)" />
                <span v-if="param.options.length > 8" class="text-[10px] text-[#C0BEB8]">+{{ param.options.length - 8 }}</span>
              </div>
              <!-- Multiselect option count -->
              <div v-else-if="param.filter_type === 8 && param.options?.length"
                   class="text-[11px] text-[#C0BEB8]">
                {{ param.options.length }} вариант{{ noun(param.options.length, 'ов', '', 'а', 'ов') }}
              </div>
            </div>
          </td>

          <td class="td">
            <span class="inline-flex items-center gap-1.5 text-[12px] text-[#888]">
              <component :is="typeIcon(param.filter_type)" class="w-3.5 h-3.5 text-[#ABABAB] shrink-0" />
              {{ param.filter_type_title }}
            </span>
          </td>

          <td class="td">
            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="param.is_filterable" class="inline-flex items-center gap-1 text-[11px] text-[#888]">
                <svg class="w-3 h-3 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                Фильтр
              </span>
              <span v-if="param.is_searchable" class="inline-flex items-center gap-1 text-[11px] text-[#888]">
                <svg class="w-3 h-3 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Поиск
              </span>
              <span v-if="param.is_comparable" class="inline-flex items-center gap-1 text-[11px] text-[#888]">
                <svg class="w-3 h-3 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                Сравнение
              </span>
              <span v-if="!param.is_filterable && !param.is_searchable && !param.is_comparable" class="text-[11px] text-[#D0CEC9]">—</span>
            </div>
          </td>

          <td class="td">
            <div class="flex items-center justify-end gap-0.5">
              <NuxtLink :to="`/admin/params/${param.id}/edit`"
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </NuxtLink>
              <button @click="confirmSingleDelete(param.id)"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!filteredParams.length">
          <td colspan="6" class="px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
            Атрибуты не найдены
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1 || store.pagination && store.pagination.total > PER_PAGE_OPTIONS[0]"
           class="flex items-center justify-between px-5 py-3 border-t border-[#F0EEE9]">
        <div class="flex items-center gap-2">
          <span class="text-[12px] text-[#ABABAB]">Показывать</span>
          <div class="flex gap-1">
            <button v-for="n in PER_PAGE_OPTIONS" :key="n" @click="setPerPage(n)"
                    class="h-6 min-w-[28px] px-1.5 flex items-center justify-center rounded text-[12px] font-medium transition-colors"
                    :class="perPage === n ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'">{{ n }}</button>
          </div>
          <span class="text-[12px] text-[#ABABAB]">· {{ rangeText }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <template v-for="page in pagesToShow" :key="page">
            <span v-if="page === '...'" class="w-7 h-7 flex items-center justify-center text-[12px] text-[#C0BEB8]">…</span>
            <button v-else @click="currentPage = page"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[12px] font-medium transition-colors"
                    :class="currentPage === page ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'">{{ page }}</button>
          </template>
          <button @click="currentPage++" :disabled="currentPage === totalPages || totalPages === 0"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile cards -->
    <div class="md:hidden space-y-2">
      <div v-for="param in paginatedParams" :key="param.id"
           class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3.5 flex items-start gap-3"
           :class="{'border-[#1A1A1A]': selectedIds.includes(param.id!)}">
        <input type="checkbox" v-model="selectedIds" :value="param.id"
               class="w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 cursor-pointer mt-0.5">
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-start justify-between gap-2">
            <div>
              <NuxtLink :to="`/admin/params/${param.id}/edit`"
                        class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors">
                {{ param.title }}
              </NuxtLink>
              <p class="font-mono text-[10px] text-[#C0BEB8]">/{{ param.slug }}</p>
            </div>
            <button @click="confirmSingleDelete(param.id!)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]" :class="typeBadgeClass(param.filter_type)">
              <component :is="typeIcon(param.filter_type)" class="w-2.5 h-2.5 shrink-0" />
              {{ param.filter_type_title }}
            </span>
            <span v-if="param.unit" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0EEE9] text-[#888]">{{ param.unit }}</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="param.is_filterable" class="inline-flex items-center gap-1 text-[11px] text-[#888]">
              <svg class="w-3 h-3 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
              Фильтр
            </span>
            <span v-if="param.is_searchable" class="inline-flex items-center gap-1 text-[11px] text-[#888]">
              <svg class="w-3 h-3 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Поиск
            </span>
            <span v-if="param.is_comparable" class="inline-flex items-center gap-1 text-[11px] text-[#888]">
              <svg class="w-3 h-3 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              Сравнение
            </span>
          </div>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div v-if="totalPages > 1 || store.pagination && store.pagination.total > PER_PAGE_OPTIONS[0]" class="bg-white border border-[#E8E6E0] rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between text-[12px] text-[#ABABAB]">
          <span>{{ rangeText }}</span>
        </div>
        <div class="flex items-center justify-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <span class="text-[12px] text-[#1A1A1A] font-medium">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button @click="currentPage++" :disabled="currentPage === totalPages || totalPages === 0"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete modal -->
    <Transition name="modal">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#1A1A1A]/10 backdrop-blur-[2px]" @click="closeModal"></div>
        <div class="relative w-full max-w-[360px] bg-white border border-[#E8E6E0] rounded-2xl shadow-xl overflow-hidden">
          <div class="px-6 pt-8 pb-6 text-center">
            <div class="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 class="text-[15px] font-semibold text-[#1A1A1A] mb-2">{{ isBulkMode ? 'Удалить выбранные?' : 'Удалить атрибут?' }}</h3>
            <p class="text-[13px] text-[#888] leading-relaxed">
              {{ isBulkMode
                ? `Будет удалено ${selectedIds.length} атрибут${nounRaw(selectedIds.length)} со всеми вариантами. Действие необратимо.`
                : `Атрибут #${idToDelete} будет удалён со всеми вариантами. Действие необратимо.` }}
            </p>
          </div>
          <div class="flex border-t border-[#F0EEE9]">
            <button @click="closeModal" class="flex-1 px-4 py-4 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors">Отмена</button>
            <div class="w-[1px] bg-[#F0EEE9]"></div>
            <button @click="handleDelete" class="flex-1 px-4 py-4 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors">Удалить</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useParamStore } from '~/stores/admin/params'
import { parseColorValue, colorValueToCss } from '~/types/param'

definePageMeta({ layout: 'admin', middleware: 'admin', })

const store  = useParamStore()
const route  = useRoute()
const router = useRouter()

// Инициализация с пагинацией
await useAsyncData('params', () => store.fetchAll({
  page: Number(route.query.page) || 1,
  per_page: Number(route.query.per_page) || 20,
  search: (route.query.q as string) || undefined
}))

// ── Icon components ──────────────────────────────────────────────────────────

const IconText    = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.75' }, [h('line', { x1: '4', y1: '8', x2: '20', y2: '8', 'stroke-linecap': 'round' }), h('line', { x1: '4', y1: '14', x2: '14', y2: '14', 'stroke-linecap': 'round' })])
const IconNumber  = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.75' }, [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' })])
const IconColor   = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.75' }, [h('circle', { cx: '12', cy: '12', r: '9', 'stroke-linecap': 'round' }), h('circle', { cx: '8', cy: '11', r: '1.2', fill: 'currentColor', stroke: 'none' }), h('circle', { cx: '12', cy: '8', r: '1.2', fill: 'currentColor', stroke: 'none' }), h('circle', { cx: '16', cy: '11', r: '1.2', fill: 'currentColor', stroke: 'none' })])
const IconList    = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.75' }, [h('rect', { x: '3', y: '5', width: '5', height: '5', rx: '1', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('polyline', { points: '4.5 7.5 6 9 8.5 6.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('rect', { x: '3', y: '13', width: '5', height: '5', rx: '1', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('line', { x1: '12', y1: '7.5', x2: '21', y2: '7.5', 'stroke-linecap': 'round' }), h('line', { x1: '12', y1: '15.5', x2: '21', y2: '15.5', 'stroke-linecap': 'round' })])
const IconToggle  = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.75' }, [h('rect', { x: '1', y: '5', width: '22', height: '14', rx: '7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('circle', { cx: '16', cy: '12', r: '3' })])
const IconDefault = () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '1.75' }, [h('circle', { cx: '12', cy: '12', r: '10' })])

// ── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 20, 30, 50, 100] as const

const allTypes = computed(() => {
  const seen = new Set<number>()
  const types: { value: number; title: string }[] = []
  for (const p of store.params) {
    if (!seen.has(p.filter_type)) {
      seen.add(p.filter_type)
      types.push({ value: p.filter_type, title: p.filter_type_title ?? '' })
    }
  }
  return types.sort((a, b) => a.value - b.value)
})

// ── State ────────────────────────────────────────────────────────────────────

const searchQuery        = ref((route.query.q as string) || '')
const currentPage        = ref(Number(route.query.page) || 1)
const perPage            = ref(Number(route.query.per_page) || 20)
const selectedIds        = ref<number[]>([])
const selectedTypeFilter = ref<number | null>(null)
const typeFilterOpen     = ref(false)
const typeFilterRef      = ref<HTMLElement | null>(null)

const isModalOpen = ref(false)
const idToDelete  = ref<number | null>(null)
const isBulkMode  = ref(false)

// ── Search with debounce ─────────────────────────────────────────────────────

let searchTimeout: NodeJS.Timeout | null = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadParams()
  }, 500)
}

watch(searchQuery, debouncedSearch)

// ── Load params with pagination ──────────────────────────────────────────────

async function loadParams() {
  await store.fetchAll({
    page: currentPage.value,
    per_page: perPage.value,
    search: searchQuery.value.trim() || undefined
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(v: number) {
  const m: Record<number, any> = {
    1: IconText, 2: IconText,
    3: IconNumber, 4: IconNumber,
    6: IconColor,
    7: IconToggle,
    8: IconList,
  }
  return m[v] ?? IconDefault
}

function typeBadgeClass(v: number): string {
  const m: Record<number, string> = {
    1: 'bg-gray-50 text-gray-500',
    2: 'bg-gray-50 text-gray-500',
    3: 'bg-blue-50 text-blue-600',
    4: 'bg-blue-50 text-blue-600',
    6: 'bg-pink-50 text-pink-600',
    7: 'bg-teal-50 text-teal-600',
    8: 'bg-amber-50 text-amber-600',
  }
  return m[v] ?? 'bg-[#F0EEE9] text-[#888]'
}

function optColorCss(value: string): string {
  const cv = parseColorValue(value)
  return cv ? colorValueToCss(cv) : '#E8E6E0'
}

function optColorName(value: string): string {
  try { return JSON.parse(value)?.name ?? value } catch { return value }
}

function nounRaw(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 14) return 'ов'
  if (n % 10 === 1) return ''
  if (n % 10 >= 2 && n % 10 <= 4) return 'а'
  return 'ов'
}

function noun(n: number, v0: string, v1: string, v2: string, v5: string): string {
  if (n % 100 >= 11 && n % 100 <= 14) return v5
  if (n % 10 === 1) return v1
  if (n % 10 >= 2 && n % 10 <= 4) return v2
  return v5
}

// ── Filtering & Selection ────────────────────────────────────────────────────

const filteredParams = computed(() => {
  // Фильтрация по типу на клиенте (только для текущей страницы)
  if (!selectedTypeFilter.value) {
    return store.params
  }
  return store.params.filter(p => p.filter_type === selectedTypeFilter.value)
})

const isAllSelected = computed(() =>
    filteredParams.value.length > 0 &&
    filteredParams.value.every(p => selectedIds.value.includes(p.id!)),
)

function toggleSelectAll() {
  if (isAllSelected.value) {
    const ids = filteredParams.value.map(p => p.id!)
    selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
  } else {
    const newIds = filteredParams.value.map(p => p.id!).filter(id => !selectedIds.value.includes(id))
    selectedIds.value.push(...newIds)
  }
}

// ── Pagination ───────────────────────────────────────────────────────────────

const totalPages = computed(() => store.pagination?.last_page ?? 1)
const paginatedParams = computed(() => filteredParams.value)

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

function syncQuery() {
  router.replace({
    query: {
      ...route.query,
      page: currentPage.value,
      per_page: perPage.value,
      q: searchQuery.value || undefined
    }
  })
}

watch([currentPage, perPage], () => {
  loadParams()
  syncQuery()
})

function setPerPage(n: number) {
  perPage.value = n
  currentPage.value = 1
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => document.addEventListener('click', closeDropdowns))
onBeforeUnmount(() => document.removeEventListener('click', closeDropdowns))

function closeDropdowns(e: MouseEvent) {
  if (!typeFilterRef.value?.contains(e.target as Node)) typeFilterOpen.value = false
}

// ── Actions ───────────────────────────────────────────────────────────────────

function confirmSingleDelete(id: number) { idToDelete.value = id; isBulkMode.value = false; isModalOpen.value = true }
function confirmBulkDelete()              { isBulkMode.value = true; isModalOpen.value = true }
function closeModal()                     { isModalOpen.value = false; idToDelete.value = null; isBulkMode.value = false }

async function handleDelete() {
  if (isBulkMode.value) {
    for (const id of selectedIds.value) await store.destroy(id)
    selectedIds.value = []
  } else if (idToDelete.value) {
    await store.destroy(idToDelete.value)
    selectedIds.value = selectedIds.value.filter(id => id !== idToDelete.value)
  }

  // Перезагружаем данные с сервера
  await loadParams()

  // Если текущая страница пуста, переходим на предыдущую
  if (paginatedParams.value.length === 0 && currentPage.value > 1) {
    currentPage.value--
    await loadParams()
  }

  closeModal()
}
</script>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.dropdown-enter-active { transition: opacity .15s ease, transform .15s ease; }
.dropdown-leave-active { transition: opacity .1s ease, transform .1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }

input[type="checkbox"] { @apply rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 focus:ring-offset-0; }
</style>