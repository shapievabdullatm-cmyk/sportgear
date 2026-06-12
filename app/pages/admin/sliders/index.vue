<script setup>
import { ref, onMounted } from 'vue'
import { useSliderStore } from '~/stores/admin/slider'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const store = useSliderStore()
const dragIndex = ref(null)
const overIndex = ref(null)
const saving = ref(false)
const deletingId = ref(null)

onMounted(() => store.fetchAll())

function onDragStart(i) { dragIndex.value = i }
function onDragOver(i)  { overIndex.value = i }

async function onDrop() {
  if (dragIndex.value === null || dragIndex.value === overIndex.value) {
    dragIndex.value = overIndex.value = null
    return
  }
  const arr = [...store.sliders]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(overIndex.value, 0, moved)
  store.sliders = arr.map((s, idx) => ({ ...s, position: idx }))
  dragIndex.value = overIndex.value = null

  saving.value = true
  try {
    await store.reorder(store.sliders.map(s => ({ id: s.id, position: s.position })))
  } finally {
    saving.value = false
  }
}

async function deleteSlider(id) {
  if (!confirm('Удалить слайдер?')) return
  deletingId.value = id
  try { await store.destroy(id) }
  finally { deletingId.value = null }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">

    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Слайдеры</h1>
      <div class="flex items-center gap-3">
        <span v-if="saving" class="text-[12px] text-[#ABABAB] hidden sm:inline">Сохранение…</span>
        <NuxtLink
            to="/admin/sliders/create"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 sm:px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить
        </NuxtLink>
      </div>
    </div>

    <p v-if="saving" class="text-[12px] text-[#ABABAB] sm:hidden">Сохранение порядка…</p>

    <div v-if="store.loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <div v-else-if="!store.sliders.length" class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
      Слайдеры не найдены
    </div>

    <template v-else>

      <div class="hidden sm:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] border-collapse" @dragover.prevent>
            <thead>
            <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
              <th class="th w-8"></th>
              <th class="th w-12">ID</th>
              <th class="th w-36">Фото</th>
              <th class="th">Заголовок</th>
              <th class="th">Ссылка</th>
              <th class="th w-24 text-right">Действия</th>
            </tr>
            </thead>

            <tbody>
            <tr
                v-for="(slider, i) in store.sliders"
                :key="slider.id"
                class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
                :class="{
                  'opacity-40': dragIndex === i,
                  'ring-2 ring-inset ring-[#1A1A1A]': overIndex === i && dragIndex !== i
                }"
                draggable="true"
                @dragstart="onDragStart(i)"
                @dragover.prevent="onDragOver(i)"
                @drop.prevent="onDrop"
                @dragend="dragIndex = overIndex = null"
            >
              <td class="td">
                <div class="flex justify-center text-[#C0BEB8] hover:text-[#1A1A1A] cursor-grab active:cursor-grabbing transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
                    <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                    <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                  </svg>
                </div>
              </td>

              <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ slider.id }}</td>

              <td class="td">
                <div class="w-28 h-12 rounded-lg overflow-hidden bg-[#F0EEE9] flex items-center justify-center shrink-0">
                  <img v-if="slider.image" :src="slider.image" :alt="slider.title" class="w-full h-full object-cover" />
                  <span v-else class="text-[10px] text-[#C0BEB8]">Нет фото</span>
                </div>
              </td>

              <td class="td text-[13px] font-medium text-[#1A1A1A]">{{ slider.title }}</td>

              <td class="td text-[13px] text-[#888] max-w-[200px]">
                <a :href="slider.link" target="_blank" rel="noopener" class="truncate block hover:text-[#1A1A1A] transition-colors">
                  {{ slider.link }}
                </a>
              </td>

              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <NuxtLink
                      :to="`/admin/sliders/${slider.id}/edit`"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                      title="Редактировать"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </NuxtLink>

                  <button
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                      :disabled="deletingId === slider.id"
                      title="Удалить"
                      @click="deleteSlider(slider.id)"
                  >
                    <div v-if="deletingId === slider.id" class="w-3 h-3 border-2 border-[#E8E6E0] border-t-[#C0BEB8] rounded-full animate-spin" />
                    <svg v-else class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
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

      <div class="sm:hidden space-y-3">
        <div
            v-for="slider in store.sliders"
            :key="slider.id"
            class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden"
        >
          <div class="w-full aspect-[2/1] bg-[#F0EEE9] overflow-hidden">
            <img
                v-if="slider.image"
                :src="slider.image"
                :alt="slider.title"
                class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-[11px] text-[#C0BEB8]">Нет фото</span>
            </div>
          </div>

          <div class="px-4 py-3.5 flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-medium text-[#1A1A1A] truncate leading-tight">{{ slider.title }}</p>
              <a
                  :href="slider.link"
                  target="_blank"
                  rel="noopener"
                  class="text-[12px] text-[#888] truncate block hover:text-[#1A1A1A] transition-colors mt-1"
              >
                {{ slider.link }}
              </a>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] font-mono text-[#C0BEB8] bg-[#FAFAF8] px-1.5 py-0.5 rounded border border-[#F0EEE9]">ID {{ slider.id }}</span>
              </div>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <NuxtLink
                  :to="`/admin/sliders/${slider.id}/edit`"
                  class="w-9 h-9 flex items-center justify-center rounded-lg text-[#C0BEB8] bg-[#FAFAF8] border border-[#F0EEE9] hover:text-[#1A1A1A] transition-colors"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </NuxtLink>

              <button
                  class="w-9 h-9 flex items-center justify-center rounded-lg text-[#C0BEB8] bg-[#FAFAF8] border border-[#F0EEE9] hover:text-red-400 hover:bg-red-50 hover:border-red-100 transition-colors"
                  :disabled="deletingId === slider.id"
                  @click="deleteSlider(slider.id)"
              >
                <div v-if="deletingId === slider.id" class="w-3.5 h-3.5 border-2 border-[#E8E6E0] border-t-[#C0BEB8] rounded-full animate-spin" />
                <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
</style>