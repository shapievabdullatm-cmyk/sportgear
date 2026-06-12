<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useBlogCategoryStore } from '~/stores/admin/blogCategory'
import type { BlogCategory } from '~/types/blog'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const store = useBlogCategoryStore()
await store.fetchAll()

// ─── Form ─────────────────────────────────────────────────────────────────────

const showForm = ref(false)
const editTarget = ref<BlogCategory | null>(null)
const submitting = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive({ name: '', slug: '' })

const formTitle = computed(() => editTarget.value ? 'Редактировать категорию' : 'Новая категория')

function openCreate() {
  editTarget.value = null
  form.name = ''
  form.slug = ''
  errors.value = {}
  showForm.value = true
}

function openEdit(cat: BlogCategory) {
  editTarget.value = cat
  form.name = cat.name
  form.slug = cat.slug
  errors.value = {}
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editTarget.value = null
}

async function submitForm() {
  if (!form.name.trim() || submitting.value) return
  submitting.value = true
  errors.value = {}

  const payload: { name: string; slug?: string } = { name: form.name.trim() }
  if (form.slug.trim()) payload.slug = form.slug.trim()

  try {
    if (editTarget.value) {
      await store.update(editTarget.value.id, payload)
    } else {
      await store.store(payload)
    }
    closeForm()
  } catch (e: any) {
    const data = e?.data ?? e?.response?._data
    if (data?.errors) {
      errors.value = Object.fromEntries(
        Object.entries(data.errors).map(([k, v]: [string, any]) => [k, v[0]])
      )
    }
  } finally {
    submitting.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteTarget = ref<BlogCategory | null>(null)
const deleting = ref(false)

function confirmDelete(cat: BlogCategory) {
  deleteTarget.value = cat
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.destroy(deleteTarget.value.id)
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

async function moveUp(index: number) {
  if (index === 0) return
  const ids = store.categories.map(c => c.id)
  ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
  await store.reorder(ids)
}

async function moveDown(index: number) {
  if (index === store.categories.length - 1) return
  const ids = store.categories.map(c => c.id)
  ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
  await store.reorder(ids)
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/blogs"
          class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Категории блога</h1>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 sm:px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors"
        @click="openCreate"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden max-w-lg">
      <div class="px-5 py-4 border-b border-[#F0EEE9]">
        <p class="text-[13px] font-semibold text-[#1A1A1A]">{{ formTitle }}</p>
      </div>

      <div class="px-5 py-4 space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-1.5">
            Название <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Название категории"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors"
            :class="{ 'border-red-300 bg-red-50': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-[11px] text-red-400">{{ errors.name }}</p>
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-1.5">
            Slug (URL)
          </label>
          <input
            v-model="form.slug"
            type="text"
            placeholder="Оставьте пустым для автогенерации"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors"
            :class="{ 'border-red-300 bg-red-50': errors.slug }"
          />
          <p v-if="errors.slug" class="mt-1 text-[11px] text-red-400">{{ errors.slug }}</p>
        </div>
      </div>

      <div class="px-5 py-4 border-t border-[#F0EEE9] flex justify-end gap-2">
        <button
          type="button"
          class="px-3.5 py-2 rounded-lg text-[12px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors"
          @click="closeForm"
        >
          Отмена
        </button>
        <button
          type="button"
          :disabled="!form.name.trim() || submitting"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-colors"
          :class="form.name.trim() && !submitting
            ? 'bg-[#1A1A1A] text-white hover:bg-[#333]'
            : 'bg-[#F0EEE9] text-[#C0BEB8] cursor-not-allowed'"
          @click="submitForm"
        >
          <div v-if="submitting" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ submitting ? 'Сохранение...' : (editTarget ? 'Сохранить' : 'Создать') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!store.categories.length" class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
      Категории не созданы
    </div>

    <!-- Table -->
    <div v-else class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
            <th class="th w-10">#</th>
            <th class="th">Название</th>
            <th class="th hidden sm:table-cell">Slug</th>
            <th class="th w-24 text-center">Порядок</th>
            <th class="th w-28 text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(cat, index) in store.categories"
            :key="cat.id"
            class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors"
          >
            <td class="td text-[#ABABAB]">{{ cat.id }}</td>
            <td class="td font-medium text-[#1A1A1A]">{{ cat.name }}</td>
            <td class="td hidden sm:table-cell text-[#ABABAB] text-[12px]">{{ cat.slug }}</td>

            <!-- Sort buttons -->
            <td class="td">
              <div class="flex items-center justify-center gap-0.5">
                <button
                  type="button"
                  :disabled="index === 0"
                  class="w-6 h-6 flex items-center justify-center rounded text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Вверх"
                  @click="moveUp(index)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>
                <button
                  type="button"
                  :disabled="index === store.categories.length - 1"
                  class="w-6 h-6 flex items-center justify-center rounded text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Вниз"
                  @click="moveDown(index)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            </td>

            <!-- Actions -->
            <td class="td">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="w-7 h-7 flex items-center justify-center rounded text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
                  title="Редактировать"
                  @click="openEdit(cat)"
                >
                  <Icon name="material-symbols:edit-outline" class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="w-7 h-7 flex items-center justify-center rounded text-[#C0BEB8] hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Удалить"
                  @click="confirmDelete(cat)"
                >
                  <Icon name="material-symbols:delete-outline" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div class="bg-white rounded-xl border border-[#E8E6E0] shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
          <h2 class="text-[14px] font-semibold text-[#1A1A1A]">Удалить категорию?</h2>
          <p class="text-[12px] text-[#ABABAB] leading-relaxed">
            «{{ deleteTarget.name }}» будет удалена. Статьи этой категории останутся без категории.
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