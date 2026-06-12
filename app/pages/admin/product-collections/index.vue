<template>
  <div class="max-w-4xl space-y-6 mx-auto">

    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Коллекции товаров</h1>
      <NuxtLink
          to="/admin"
          class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Назад
      </NuxtLink>
    </div>

    <div class="flex justify-end">
      <NuxtLink
          to="/admin/product-collections/create"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Создать коллекцию
      </NuxtLink>
    </div>

    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
        <span class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Список · {{ collections.length }}</span>
        <span v-if="reordering" class="text-[11px] text-[#ABABAB]">Сохраняем порядок...</span>
      </div>

      <div v-if="!loading && collections.length === 0" class="py-12 text-center text-[13px] text-[#ABABAB]">
        Пока нет ни одной коллекции
      </div>

      <div v-if="loading" class="divide-y divide-[#F0EEE9]">
        <div v-for="n in 4" :key="n" class="flex items-center gap-3 px-5 py-3.5 animate-pulse">
          <div class="w-4 h-4 rounded bg-[#E8E6E0]"/>
          <div class="h-3.5 w-60 rounded bg-[#E8E6E0]"/>
          <div class="ml-auto h-3.5 w-16 rounded bg-[#E8E6E0]"/>
        </div>
      </div>

      <ul
          v-else
          class="divide-y divide-[#F0EEE9]"
      >
        <li
            v-for="(collection, idx) in collections"
            :key="collection.id"
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

          <NuxtLink
              :to="`/admin/product-collections/${collection.id}`"
              class="flex-1 text-[13px] text-[#1A1A1A] font-medium truncate hover:text-[#666] transition-colors"
          >
            {{ collection.name }}
          </NuxtLink>

          <span class="text-[11px] text-[#ABABAB]">{{ collection.items_count }} товаров</span>

          <button
              class="px-2 py-1 rounded text-[11px] font-medium transition-colors"
              :class="collection.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'"
              @click="toggleActive(collection)"
          >
            {{ collection.is_active ? 'Активна' : 'Неактивна' }}
          </button>

          <button
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-red-50 text-[#ABABAB] hover:text-red-500"
              :disabled="removing === collection.id"
              @click="removeCollection(collection)"
          >
            <svg v-if="removing !== collection.id" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
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

interface Collection {
  id: number
  name: string
  is_active: boolean
  position: number
  items_count: number
  created_at: string
  updated_at: string
}

const loading = ref(true)
const reordering = ref(false)
const removing = ref<number | null>(null)
const collections = ref<Collection[]>([])

async function load() {
  loading.value = true
  try {
    const res = await $api<{ data: Collection[] }>('/admin/product-collections')
    collections.value = res.data ?? []
  } finally {
    loading.value = false
  }
}

await load()

async function toggleActive(collection: Collection) {
  try {
    await $api(`/admin/product-collections/${collection.id}`, {
      method: 'PATCH',
      body: { is_active: !collection.is_active }
    })
    collection.is_active = !collection.is_active
  } catch (e) {
    console.error('Toggle active error:', e)
  }
}

async function removeCollection(collection: Collection) {
  if (removing.value) return
  if (!confirm(`Удалить коллекцию "${collection.name}"?`)) return

  removing.value = collection.id
  try {
    await $api(`/admin/product-collections/${collection.id}`, { method: 'DELETE' })
    collections.value = collections.value.filter(c => c.id !== collection.id)
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
  const arr = [...collections.value]
  const [moved] = arr.splice(dragFromIdx, 1)
  arr.splice(idx, 0, moved)
  collections.value = arr
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
    const payload = collections.value.map((item, idx) => ({ id: item.id, position: idx }))
    await $api('/admin/product-collections/reorder', {
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