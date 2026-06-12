<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Быстрые ссылки</h1>
      <button
          @click="openModal()"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
        <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
          <th class="th w-16">ID</th>
          <th class="th">Заголовок</th>
          <th class="th">URL</th>
          <th class="th w-24 text-right">Действия</th>
        </tr>
        </thead>

        <tbody>
        <tr
            v-for="link in links"
            :key="link.id"
            class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
        >
          <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ link.id }}</td>

          <td class="td text-[13px] font-medium text-[#1A1A1A]">{{ link.title }}</td>

          <td class="td text-[13px] text-[#888]">{{ link.url }}</td>

          <td class="td">
            <div class="flex items-center justify-end gap-0.5">
              <button
                  @click="openModal(link)"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                  title="Редактировать"
              >
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>

              <button
                  @click="remove(link.id)"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                  title="Удалить"
              >
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!links.length">
          <td colspan="4" class="px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
            Ссылки не найдены
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
            v-if="isModalOpen"
            class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/30" @click="closeModal"></div>

          <div class="relative bg-white border border-[#E8E6E0] rounded-xl p-6 w-full max-w-sm space-y-5">

            <h2 class="text-[15px] font-semibold text-[#1A1A1A]">
              {{ editingId ? 'Редактировать ссылку' : 'Новая ссылка' }}
            </h2>

            <div class="space-y-1.5">
              <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
                Заголовок <span class="text-red-400">*</span>
              </label>
              <input
                  v-model="form.title"
                  type="text"
                  placeholder="Введите заголовок"
                  class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
                URL адрес <span class="text-red-400">*</span>
              </label>
              <input
                  v-model="form.url"
                  type="text"
                  placeholder="https://..."
                  class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
              />
            </div>

            <div class="border-t border-[#F0EEE9]"></div>

            <div class="flex justify-end gap-2">
              <button
                  @click="closeModal"
                  class="inline-flex items-center rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
              >
                Отмена
              </button>
              <button
                  @click="save"
                  :disabled="!isFormValid || isSubmitting"
                  class="inline-flex items-center rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors duration-150"
                  :class="isFormValid && !isSubmitting
                  ? 'bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer'
                  : 'bg-[#F0EEE9] text-[#C0BEB8] cursor-not-allowed'"
              >
                {{ isSubmitting ? 'Сохранение...' : (editingId ? 'Сохранить' : 'Создать') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuickLinksStore } from '~/stores/admin/quick-links'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const store = useQuickLinksStore()
const { links } = storeToRefs(store)

const isModalOpen = ref(false)
const isSubmitting = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({ title: '', url: '' })

const isFormValid = computed(() => !!form.title.trim() && !!form.url.trim())

onMounted(() => store.fetch())

function openModal(link?: any) {
  editingId.value = link?.id ?? null
  form.title = link?.title ?? ''
  form.url = link?.url ?? ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingId.value = null
}

async function save() {
  if (!isFormValid.value) return
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await store.update(editingId.value, { ...form })
    } else {
      await store.create({ ...form })
    }
    closeModal()
  } finally {
    isSubmitting.value = false
  }
}

async function remove(id: number) {
  await store.delete(id)
}
</script>

<style scoped>
.th {
  @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB];
}
.td {
  @apply px-5 py-3.5;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>