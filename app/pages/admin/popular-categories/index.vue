<template>
  <div class="max-w-2xl space-y-6 mx-auto">

    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Популярные категории</h1>
      <NuxtLink
          to="/admin/categories"
          class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Назад
      </NuxtLink>
    </div>

    <div class="bg-white border border-[#E8E6E0] rounded-xl p-5 space-y-3 relative z-30">
      <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Добавить категорию</label>
      <div class="flex gap-2">
        <div class="relative flex-1">
          <input
              v-model="search"
              type="text"
              placeholder="Начните вводить название..."
              class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
              @focus="dropdownOpen = true"
              @input="dropdownOpen = true"
              @blur="onBlur"
          />

          <ul
              v-if="dropdownOpen && filteredAvailable.length"
              class="absolute z-[100] left-0 right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-xl max-h-52 overflow-y-auto"
          >
            <li
                v-for="cat in filteredAvailable"
                :key="cat.id"
                class="px-3.5 py-2 text-[13px] text-[#1A1A1A] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                @mousedown.prevent="selectCategory(cat)"
            >
              {{ cat.title }}
            </li>
          </ul>

          <div
              v-if="dropdownOpen && search && !filteredAvailable.length && !selected"
              class="absolute z-[100] left-0 right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg px-3.5 py-3 text-[13px] text-[#ABABAB]"
          >
            Категория не найдена или уже добавлена
          </div>
        </div>
        <button
            :disabled="!selected || adding"
            @click="addCategory"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {{ adding ? 'Добавление...' : 'Добавить' }}
        </button>
      </div>
    </div>

    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden relative z-10">
      <div class="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
        <span class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Список · {{ items.length }}</span>
        <span v-if="reordering" class="text-[11px] text-[#ABABAB]">Сохраняем порядок...</span>
      </div>

      <div v-if="!loading && items.length === 0" class="py-12 text-center text-[13px] text-[#ABABAB]">
        Пока нет ни одной популярной категории
      </div>

      <div v-if="loading" class="divide-y divide-[#F0EEE9]">
        <div v-for="n in 4" :key="n" class="flex items-center gap-3 px-5 py-3.5 animate-pulse">
          <div class="w-4 h-4 rounded bg-[#E8E6E0]"/>
          <div class="w-10 h-10 rounded-lg bg-[#E8E6E0] shrink-0"/>
          <div class="h-3.5 w-40 rounded bg-[#E8E6E0]"/>
        </div>
      </div>

      <ul
          v-else
          ref="listRef"
          class="divide-y divide-[#F0EEE9]"
      >
        <li
            v-for="(item, idx) in items"
            :key="item.id"
            class="flex items-center gap-3 px-5 py-3 group select-none hover:bg-[#FCFCFA] transition-colors"
            draggable="true"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @dragend="onDragEnd"
        >
          <svg
              class="w-4 h-4 text-[#C0BEB8] cursor-grab active:cursor-grabbing shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6h16.5"/>
          </svg>

          <span class="text-[11px] font-semibold text-[#C0BEB8] w-4 shrink-0 text-center">{{ idx + 1 }}</span>

          <div class="w-10 h-10 rounded-lg overflow-hidden border border-[#E8E6E0] shrink-0 bg-[#FAFAF8] flex items-center justify-center">
            <img v-if="item.image" :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
            <svg v-else class="w-5 h-5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>

          <span class="flex-1 text-[13px] text-[#1A1A1A] font-medium truncate">{{ item.title }}</span>

          <button
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-red-50 text-[#ABABAB] hover:text-red-500"
              :disabled="removing === item.id"
              @click="removeItem(item)"
          >
            <svg v-if="removing !== item.id" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <span v-else class="text-[10px] animate-pulse">...</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useApi()

interface PopularItem {
  id:          number
  position:    number
  category_id: number
  title:       string
  slug:        string
  image:       string | null
}

interface AvailableCategory {
  id:    number
  title: string
  slug:  string
}

const adding     = ref(false)
const reordering = ref(false)
const removing   = ref<number | null>(null)

const items     = ref<PopularItem[]>([])
const available = ref<AvailableCategory[]>([])

const search       = ref('')
const selected     = ref<AvailableCategory | null>(null)
const dropdownOpen = ref(false)

// ─── Fetch ────────────────────────────────────────────────────────────────────

// Используем useAsyncData правильно, возвращая объект с данными для корректного SSR
const { data, pending: loading } = await useAsyncData('popular-categories-page', async () => {
  const [resItems, resAvail] = await Promise.all([
    $api<{ data?: PopularItem[] } | PopularItem[]>('/admin/popular-categories'),
    $api<{ data?: AvailableCategory[] } | AvailableCategory[]>('/admin/popular-categories/available'),
  ])

  return {
    items: (Array.isArray(resItems) ? resItems : (resItems?.data ?? [])) as PopularItem[],
    available: (Array.isArray(resAvail) ? resAvail : (resAvail?.data ?? [])) as AvailableCategory[]
  }
})

// Синхронизируем данные после загрузки (важно для гидратации)
if (data.value) {
  items.value = [...data.value.items]
  available.value = [...data.value.available]
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const filteredAvailable = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = available.value || []

  // Если категория выбрана и в инпуте ее имя - не показываем список
  if (selected.value && search.value === selected.value.title) {
    return []
  }

  if (!q) return list.slice(0, 10)
  return list.filter(c => c.title.toLowerCase().includes(q)).slice(0, 20)
})

function selectCategory(cat: AvailableCategory) {
  selected.value = cat
  search.value = cat.title
  dropdownOpen.value = false
}

function onBlur() {
  setTimeout(() => { dropdownOpen.value = false }, 200)
}

watch(search, (val) => {
  if (selected.value && val !== selected.value.title) {
    selected.value = null
  }
})

// ─── Actions ──────────────────────────────────────────────────────────────────

async function addCategory() {
  if (!selected.value || adding.value) return
  adding.value = true
  try {
    const response = await $api<{ data: PopularItem } | PopularItem>('/admin/popular-categories', {
      method: 'POST',
      body: { category_id: selected.value.id },
    })

    const newItem = ('data' in response) ? response.data : response
    items.value = [...items.value, newItem]

    available.value = available.value.filter(c => c.id !== selected.value!.id)
    search.value = ''
    selected.value = null
  } catch (e) {
    console.error('Add error:', e)
  } finally {
    adding.value = false
  }
}

async function removeItem(item: PopularItem) {
  if (removing.value) return
  removing.value = item.id
  try {
    await $api(`/admin/popular-categories/${item.id}`, { method: 'DELETE' })
    items.value = items.value.filter(i => i.id !== item.id)

    available.value.push({
      id: item.category_id,
      title: item.title,
      slug: item.slug
    })
    available.value.sort((a, b) => a.title.localeCompare(b.title))
  } catch (e) {
    console.error('Remove error:', e)
  } finally {
    removing.value = null
  }
}

// ─── Drag-and-drop reorder ────────────────────────────────────────────────────

let dragFromIdx = -1
let reorderTimer: any = null

function onDragStart(idx: number) {
  dragFromIdx = idx
}

function onDragOver(idx: number) {
  if (dragFromIdx === -1 || dragFromIdx === idx) return
  const arr = [...items.value]
  const [moved] = arr.splice(dragFromIdx, 1)
  arr.splice(idx, 0, moved)
  items.value = arr
  dragFromIdx = idx
}

function onDragEnd() {
  dragFromIdx = -1
  if (reorderTimer) clearTimeout(reorderTimer)
  reorderTimer = setTimeout(saveOrder, 800)
}

async function saveOrder() {
  reordering.value = true
  try {
    const payload = items.value.map((item, idx) => ({ id: item.id, position: idx + 1 }))
    await $api('/admin/popular-categories/reorder', {
      method: 'POST',
      body: { items: payload },
    })
  } catch (e) {
    console.error('Reorder error:', e)
  } finally {
    reordering.value = false
  }
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}
</style>