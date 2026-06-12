<template>
  <div class="space-y-6">

    <AdminAppToast
        :show="toast.show.value"
        :progress="toast.progress.value"
        title="Порядок сохранён"
        subtitle="Позиции категорий обновлены"
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
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-[#1A1A1A] text-white transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h8M8 16h5"/>
            </svg>
            Иерархия
          </NuxtLink>
          <NuxtLink
              to="/admin/categories/list"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            Список
          </NuxtLink>
        </div>

        <button
            v-if="reorderDirty"
            type="button"
            :disabled="reordering"
            @click="saveOrder"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#1A1A1A] px-3.5 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors duration-150 disabled:opacity-50"
        >
          {{ reordering ? 'Сохранение...' : 'Сохранить порядок' }}
        </button>

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

    <!-- List -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div v-if="loading" class="py-16 text-center text-[13px] text-[#C0BEB8]">Загрузка...</div>

      <div v-else-if="!items.length" class="py-16 text-center text-[13px] text-[#C0BEB8]">
        Категорий пока нет
      </div>

      <ul v-else class="divide-y divide-[#F0EEE9]">
        <template v-for="node in flatTree" :key="node.category.id">
          <li
              v-if="node.visible"
              class="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAF8] transition-colors duration-100 group"
          >
            <!-- Tree indent + toggle -->
            <div
                class="shrink-0 flex items-center gap-1"
                :style="{ paddingLeft: `${node.depth * 18}px` }"
            >
              <!-- Tree line for children -->
              <span
                  v-if="node.depth > 0"
                  class="shrink-0 text-[#D8D6D0] select-none font-mono text-[12px] leading-none"
              >{{ node.isLast ? '└' : '├' }}</span>

              <!-- Toggle for parents -->
              <button
                  v-if="node.hasChildren"
                  type="button"
                  @click="toggle(node.category.id)"
                  class="w-4 h-4 shrink-0 flex items-center justify-center rounded text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
              >
                <svg
                    class="w-3 h-3 transition-transform duration-200"
                    :class="{ 'rotate-90': expanded.has(node.category.id) }"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <span v-else class="w-4 shrink-0" />
            </div>

            <!-- Фото -->
            <div class="w-9 h-[54px] rounded-md overflow-hidden shrink-0 bg-[#F5F4F0]">
              <img v-if="node.category.image" :src="node.category.image" :alt="node.category.title" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-4 h-4 text-[#D5D3CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            </div>

            <!-- Title + meta -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <!-- Folder icon for parents -->
                <svg
                    v-if="node.hasChildren"
                    class="w-3.5 h-3.5 shrink-0 transition-colors duration-150"
                    :class="expanded.has(node.category.id) ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                </svg>

                <p class="text-[13px] font-medium text-[#1A1A1A] truncate">{{ node.category.title }}</p>

                <span
                    v-if="node.hasChildren"
                    class="shrink-0 px-1.5 py-0.5 rounded-md bg-[#F0EEE9] text-[10px] font-medium text-[#ABABAB]"
                >
                  {{ node.childCount }}
                </span>
              </div>
              <p class="text-[11px] text-[#ABABAB] truncate font-mono">{{ node.category.slug }}</p>
            </div>

            <!-- Position controls — only within same parent group -->
            <div class="flex flex-col gap-0.5 shrink-0">
              <button
                  type="button"
                  :disabled="node.isFirstInGroup"
                  @click="moveUp(node.category)"
                  class="flex items-center justify-center w-6 h-5 rounded hover:bg-[#F0EEE9] disabled:opacity-20 transition-colors"
                  title="Переместить вверх"
              >
                <svg class="w-3 h-3 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </button>
              <button
                  type="button"
                  :disabled="node.isLastInGroup"
                  @click="moveDown(node.category)"
                  class="flex items-center justify-center w-6 h-5 rounded hover:bg-[#F0EEE9] disabled:opacity-20 transition-colors"
                  title="Переместить вниз"
              >
                <svg class="w-3 h-3 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <NuxtLink
                  :to="`/admin/categories/${node.category.id}/edit`"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#F0EEE9] transition-colors"
                  title="Редактировать"
              >
                <svg class="w-3.5 h-3.5 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </NuxtLink>

              <button
                  type="button"
                  @click="confirmDelete(node.category)"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-50 transition-colors"
                  title="Удалить"
              >
                <svg class="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </li>
        </template>
      </ul>
    </div>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div class="bg-white rounded-xl border border-[#E8E6E0] shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
          <h2 class="text-[14px] font-semibold text-[#1A1A1A]">Удалить категорию?</h2>
          <div class="space-y-2">
            <p class="text-[12px] text-[#ABABAB] leading-relaxed">
              «{{ deleteTarget.title }}» будет удалена. Фото категории также будет удалено с сервера.
            </p>
            <p v-if="deleteProductsCount > 0" class="text-[12px] text-amber-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠️ В этой категории {{ deleteProductsCount }} {{ productWord(deleteProductsCount) }}.
              У них будет обнулена категория.
            </p>
            <p class="text-[11px] text-[#C0BEB8]">
              Это действие нельзя отменить.
            </p>
          </div>
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

    <!-- Success toast after delete -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="deleteSuccess" class="fixed top-5 right-5 z-50 w-80">
          <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-lg overflow-hidden">
            <div class="p-4 flex items-start gap-3">
              <div class="w-7 h-7 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5 text-[#15803D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold text-[#1A1A1A]">Категория удалена</p>
                <p v-if="deleteSuccessMessage" class="text-[11px] text-[#ABABAB] mt-0.5">{{ deleteSuccessMessage }}</p>
              </div>
              <button @click="deleteSuccess = false" class="text-[#C0BEB8] hover:text-[#1A1A1A] shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin', })

interface Category {
  id:        number
  title:     string
  slug:      string
  image:     string | null
  parent_id: number | null
  position:  number
}

interface TreeNode {
  category:      Category
  depth:         number
  isLast:        boolean       // last among siblings (for tree line symbol)
  isFirstInGroup: boolean      // first in same-parent group (disable move-up)
  isLastInGroup:  boolean      // last in same-parent group (disable move-down)
  hasChildren:   boolean
  childCount:    number
  visible:       boolean
}

const { $api }  = useApi()
const toast     = useToast()

const loading      = ref(true)
const items        = ref<Category[]>([])
const reorderDirty = ref(false)
const reordering   = ref(false)
const deleting     = ref(false)
const deleteTarget = ref<Category | null>(null)
const deleteProductsCount = ref(0)
const deleteSuccess = ref(false)
const deleteSuccessMessage = ref('')

// Helper for Russian pluralization
function productWord(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'товаров'
  if (lastDigit === 1) return 'товар'
  if (lastDigit >= 2 && lastDigit <= 4) return 'товара'
  return 'товаров'
}

// ─── Accordion state ──────────────────────────────────────────────────────────

const expanded = ref<Set<number>>(new Set())

function toggle(id: number) {
  const next = new Set(expanded.value)
  if (next.has(id)) {
    collapseDeep(id, next)
  } else {
    next.add(id)
  }
  expanded.value = next
}

function collapseDeep(id: number, set: Set<number>) {
  set.delete(id)
  const children = childrenMap.value.get(id) ?? []
  for (const child of children) collapseDeep(child.id, set)
}

// ─── Load ─────────────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  try {
    const res = await $api<{ data: Category[] }>('/admin/categories')
    items.value = res.data ?? []
  } finally {
    loading.value = false
  }
}

await load()

// ─── Tree builder ─────────────────────────────────────────────────────────────

const childrenMap = computed(() => {
  const map = new Map<number | null, Category[]>()
  for (const cat of items.value) {
    const key = cat.parent_id ?? null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(cat)
  }
  return map
})

const flatTree = computed<TreeNode[]>(() => {
  const result: TreeNode[] = []

  function walk(parentId: number | null, depth: number, parentVisible: boolean) {
    const siblings = childrenMap.value.get(parentId) ?? []
    siblings.forEach((cat, i) => {
      const subChildren = childrenMap.value.get(cat.id) ?? []
      const hasChildren = subChildren.length > 0
      const visible = parentId === null
          ? true
          : parentVisible && expanded.value.has(parentId)

      result.push({
        category:       cat,
        depth,
        isLast:         i === siblings.length - 1,
        isFirstInGroup: i === 0,
        isLastInGroup:  i === siblings.length - 1,
        hasChildren,
        childCount:     subChildren.length,
        visible,
      })

      walk(cat.id, depth + 1, visible)
    })
  }

  walk(null, 0, true)
  return result
})

// ─── Sorting (within the same parent group) ───────────────────────────────────

function siblingsOf(cat: Category): Category[] {
  return (childrenMap.value.get(cat.parent_id ?? null) ?? [])
}

function swapInItems(a: Category, b: Category) {
  const arr = [...items.value]
  const ai = arr.findIndex(c => c.id === a.id)
  const bi = arr.findIndex(c => c.id === b.id)
  ;[arr[ai], arr[bi]] = [arr[bi], arr[ai]]
  items.value = arr
  reorderDirty.value = true
}

function moveUp(cat: Category) {
  const siblings = siblingsOf(cat)
  const idx = siblings.findIndex(c => c.id === cat.id)
  if (idx <= 0) return
  swapInItems(cat, siblings[idx - 1])
}

function moveDown(cat: Category) {
  const siblings = siblingsOf(cat)
  const idx = siblings.findIndex(c => c.id === cat.id)
  if (idx === -1 || idx >= siblings.length - 1) return
  swapInItems(cat, siblings[idx + 1])
}

async function saveOrder() {
  reordering.value = true
  try {
    // Send each group separately so positions restart from 0 per parent
    const grouped = new Map<number | null, Category[]>()
    for (const cat of items.value) {
      const key = cat.parent_id ?? null
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(cat)
    }

    const payload: { id: number; position: number }[] = []
    for (const [, group] of grouped) {
      group.forEach((cat, idx) => payload.push({ id: cat.id, position: idx }))
    }

    await $api('/admin/categories/reorder', { method: 'POST', body: { items: payload } })
    reorderDirty.value = false
    toast.open()
  } finally {
    reordering.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function confirmDelete(cat: Category) {
  deleteTarget.value = cat
  deleteProductsCount.value = 0

  // Получаем количество продуктов в категории
  try {
    const res = await $api<{ data: any[] }>(`/admin/products?category_id=${cat.id}`)
    deleteProductsCount.value = res.data?.length ?? 0
  } catch (e) {
    console.error('Failed to fetch products count:', e)
  }
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await $api<{ message: string; products_affected: number }>(
        `/admin/categories/${deleteTarget.value.id}`,
        { method: 'DELETE' }
    )

    items.value = items.value.filter(c => c.id !== deleteTarget.value!.id)
    deleteTarget.value = null

    // Показываем успешное сообщение
    if (res.products_affected > 0) {
      deleteSuccessMessage.value = `У ${res.products_affected} ${productWord(res.products_affected)} категория была обнулена`
    } else {
      deleteSuccessMessage.value = ''
    }

    deleteSuccess.value = true
    setTimeout(() => {
      deleteSuccess.value = false
    }, 5000)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>