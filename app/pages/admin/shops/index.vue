<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShopStore, type Shop } from '~/stores/admin/shop'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const store = useShopStore()

const loading = ref(true)
const searchQuery = ref('')
const deletingId = ref<number | null>(null)
const togglingId = ref<number | null>(null)

async function load() {
  loading.value = true
  try {
    await store.fetchAll()
  } finally {
    loading.value = false
  }
}

await load()

const filteredItems = computed<Shop[]>(() => {
  if (!searchQuery.value.trim()) return store.shops
  const q = searchQuery.value.toLowerCase()
  return store.shops.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.external_id && s.external_id.toLowerCase().includes(q))
  )
})

async function toggleShop(shop: Shop) {
  if (togglingId.value) return
  togglingId.value = shop.id
  try {
    await store.toggle(shop.id)
  } finally {
    togglingId.value = null
  }
}

async function deleteShop(id: number) {
  if (!confirm('Удалить магазин?')) return
  deletingId.value = id
  try {
    await store.destroy(id)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Магазины</h1>
      <NuxtLink
          to="/admin/shops/create"
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
            placeholder="Поиск по названию, адресу, городу, телефону..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredItems.length" class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
      {{ searchQuery ? 'Ничего не найдено' : 'Магазины не найдены' }}
    </div>

    <template v-else>

      <!-- MOBILE: карточки -->
      <div class="sm:hidden space-y-2">
        <div
            v-for="shop in filteredItems"
            :key="shop.id"
            class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-medium text-[#1A1A1A] truncate">{{ shop.name }}</div>
              <div v-if="shop.address" class="text-[11px] text-[#888] truncate mt-0.5">{{ shop.address }}</div>
              <div v-if="shop.phone" class="text-[11px] text-[#ABABAB] font-mono mt-0.5">{{ shop.phone }}</div>
              <div v-if="shop.warehouses?.length" class="text-[10px] text-[#C0BEB8] uppercase tracking-wider mt-1">
                Склады: {{ shop.warehouses.length }}
              </div>
            </div>
            <button
                @click="toggleShop(shop)"
                :disabled="togglingId === shop.id"
                class="shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                :class="shop.is_active ? 'bg-[#1A1A1A]' : 'bg-[#E8E6E0]'"
            >
              <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                  :class="shop.is_active ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
          <div class="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-[#F0EEE9]">
            <NuxtLink
                :to="`/admin/shops/${shop.id}/edit`"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </NuxtLink>
            <button
                class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors"
                :disabled="deletingId === shop.id"
                @click="deleteShop(shop.id)"
            >
              <div v-if="deletingId === shop.id" class="w-3.5 h-3.5 border-2 border-[#E8E6E0] border-t-[#C0BEB8] rounded-full animate-spin" />
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

      <!-- DESKTOP: таблица -->
      <div class="hidden sm:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px] border-collapse">
            <thead>
            <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
              <th class="th w-12">ID</th>
              <th class="th">Название</th>
              <th class="th">Адрес</th>
              <th class="th w-32">Телефон</th>
              <th class="th w-24 text-center">Склады</th>
              <th class="th w-24">Статус</th>
              <th class="th w-24 text-right">Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="shop in filteredItems"
                :key="shop.id"
                class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
            >
              <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ shop.id }}</td>
              <td class="td text-[13px] font-medium text-[#1A1A1A]">
                {{ shop.name }}
                <div v-if="shop.city" class="text-[11px] text-[#ABABAB] font-normal">{{ shop.city }}</div>
              </td>
              <td class="td text-[12px] text-[#888]">{{ shop.address || '—' }}</td>
              <td class="td text-[12px] text-[#888] font-mono">{{ shop.phone || '—' }}</td>
              <td class="td text-center text-[12px] text-[#1A1A1A]">{{ shop.warehouses?.length ?? 0 }}</td>
              <td class="td">
                <button
                    @click="toggleShop(shop)"
                    :disabled="togglingId === shop.id"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                    :class="shop.is_active ? 'bg-[#1A1A1A]' : 'bg-[#E8E6E0]'"
                >
                  <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                      :class="shop.is_active ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </td>
              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <NuxtLink
                      :to="`/admin/shops/${shop.id}/edit`"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </NuxtLink>
                  <button
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                      :disabled="deletingId === shop.id"
                      @click="deleteShop(shop.id)"
                  >
                    <div v-if="deletingId === shop.id" class="w-3 h-3 border-2 border-[#E8E6E0] border-t-[#C0BEB8] rounded-full animate-spin" />
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

    </template>
  </div>
</template>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
</style>