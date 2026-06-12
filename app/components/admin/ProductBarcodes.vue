<template>
  <div class="bg-white border border-[#E8E6E0] rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Штрихкоды</h2>
      <button
        @click="showAddForm = true"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#333] transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить штрихкод
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showAddForm" class="mb-4 p-4 bg-[#FAFAF8] border border-[#E8E6E0] rounded-lg space-y-3">
      <div class="space-y-1.5">
        <label class="field-label">Штрихкод <span class="text-red-400">*</span></label>
        <input
          v-model="newBarcode.barcode"
          type="text"
          class="field-input"
          placeholder="Введите штрихкод"
          @keyup.enter="addBarcode"
        />
      </div>
      <div v-if="addError" class="text-[12px] text-red-600">{{ addError }}</div>
      <div class="flex gap-2">
        <button
          @click="addBarcode"
          type="button"
          :disabled="!newBarcode.barcode.trim()"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          Добавить
        </button>
        <button
          @click="cancelAdd"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] bg-white px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>

    <!-- Barcodes list -->
    <div v-if="localBarcodes.length" class="space-y-2">
      <div
        v-for="(barcode, index) in localBarcodes"
        :key="index"
        class="flex items-center justify-between p-3 bg-[#FAFAF8] border border-[#E8E6E0] rounded-lg hover:border-[#C0BEB8] transition-colors"
      >
        <div class="flex-1">
          <div v-if="editingIndex !== index" class="flex items-center gap-2">
            <span class="text-[13px] font-medium text-[#1A1A1A]">{{ barcode.barcode }}</span>
          </div>
          <div v-else class="space-y-2">
            <input
              v-model="editForm.barcode"
              type="text"
              class="field-input"
              placeholder="Введите штрихкод"
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="editingIndex !== index"
            @click="startEdit(index, barcode)"
            type="button"
            class="text-[#ABABAB] hover:text-blue-600 transition-colors"
            title="Редактировать"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <template v-if="editingIndex === index">
            <button
              @click="saveEdit(index)"
              type="button"
              :disabled="!editForm.barcode.trim()"
              class="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
              title="Сохранить"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button
              @click="cancelEdit"
              type="button"
              class="text-[#ABABAB] hover:text-red-600 transition-colors"
              title="Отмена"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </template>
          <button
            v-if="editingIndex !== index"
            @click="removeBarcode(index)"
            type="button"
            class="text-[#ABABAB] hover:text-red-600 transition-colors"
            title="Удалить"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div v-else-if="!showAddForm" class="text-center py-8 text-[13px] text-[#ABABAB]">
      Штрихкоды не добавлены
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface Barcode {
  barcode: string
  type: string | null
}

const props = defineProps<{
  modelValue?: Barcode[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Barcode[]]
}>()

const localBarcodes = ref<Barcode[]>([...(props.modelValue || [])])
const showAddForm = ref(false)
const addError = ref('')

const editingIndex = ref<number | null>(null)

const newBarcode = reactive({
  barcode: '',
  type: null as string | null
})

const editForm = reactive({
  barcode: '',
  type: null as string | null
})

// Sync with parent
watch(localBarcodes, (value) => {
  emit('update:modelValue', value)
}, { deep: true })

// Sync from parent (when form is reset)
watch(() => props.modelValue, (value) => {
  localBarcodes.value = [...(value || [])]
}, { deep: true })

function addBarcode() {
  if (!newBarcode.barcode.trim()) return

  addError.value = ''

  localBarcodes.value.push({
    barcode: newBarcode.barcode.trim(),
    type: newBarcode.type
  })

  newBarcode.barcode = ''
  newBarcode.type = null
  showAddForm.value = false
}

function cancelAdd() {
  showAddForm.value = false
  newBarcode.barcode = ''
  newBarcode.type = null
  addError.value = ''
}

function startEdit(index: number, barcode: Barcode) {
  editingIndex.value = index
  editForm.barcode = barcode.barcode
  editForm.type = barcode.type
}

function saveEdit(index: number) {
  if (!editForm.barcode.trim()) return

  localBarcodes.value[index] = {
    barcode: editForm.barcode.trim(),
    type: editForm.type
  }

  editingIndex.value = null
  editForm.barcode = ''
  editForm.type = null
}

function cancelEdit() {
  editingIndex.value = null
  editForm.barcode = ''
  editForm.type = null
}

function removeBarcode(index: number) {
  localBarcodes.value.splice(index, 1)
}
</script>

<style scoped>
.field-label { @apply block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]; }
.field-input { @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors; }
</style>