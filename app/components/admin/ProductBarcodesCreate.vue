<template>
  <div class="bg-white border border-[#E8E6E0] rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Штрихкоды</h2>
      <button
        @click="showAddForm = true"
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
      <div v-if="addWarning" class="text-[12px] text-yellow-600">{{ addWarning }}</div>
      <div v-if="addError" class="text-[12px] text-red-600">{{ addError }}</div>
      <div class="flex gap-2">
        <button
          @click="addBarcode"
          :disabled="adding || !newBarcode.barcode.trim()"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          <svg v-if="adding" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ adding ? 'Добавление...' : 'Добавить' }}
        </button>
        <button
          @click="cancelAdd"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] bg-white px-3 py-2 text-[12px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors"
        >
          Отмена
        </button>
      </div>
    </div>

    <!-- Barcodes list -->
    <div v-if="barcodes.length" class="space-y-2">
      <div
        v-for="barcode in barcodes"
        :key="barcode.id"
        :class="[
          'flex items-center justify-between p-3 rounded-lg transition-colors',
          barcode.is_duplicate
            ? 'bg-yellow-50 border-2 border-yellow-400'
            : 'bg-[#FAFAF8] border border-[#E8E6E0] hover:border-[#C0BEB8]'
        ]"
      >
        <div class="flex-1">
          <div v-if="editingId !== barcode.id" class="flex items-center gap-2">
            <span class="text-[13px] font-medium text-[#1A1A1A]">{{ barcode.barcode }}</span>
            <span v-if="barcode.is_duplicate" class="text-[11px] px-2 py-0.5 rounded bg-yellow-200 text-yellow-800">
              Дубликат
            </span>
          </div>
          <div v-else class="space-y-2">
            <input
              v-model="editForm.barcode"
              type="text"
              class="field-input"
              placeholder="Введите штрихкод"
            />
            <div v-if="editWarning" class="text-[12px] text-yellow-600">{{ editWarning }}</div>
            <div v-if="editError" class="text-[12px] text-red-600">{{ editError }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="editingId !== barcode.id"
            @click="startEdit(barcode)"
            class="text-[#ABABAB] hover:text-blue-600 transition-colors"
            title="Редактировать"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <template v-if="editingId === barcode.id">
            <button
              @click="saveEdit(barcode.id)"
              :disabled="editing || !editForm.barcode.trim()"
              class="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
              title="Сохранить"
            >
              <svg v-if="editing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button
              @click="cancelEdit"
              :disabled="editing"
              class="text-[#ABABAB] hover:text-red-600 transition-colors disabled:opacity-50"
              title="Отмена"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </template>
          <button
            v-if="editingId !== barcode.id"
            @click="removeBarcode(barcode.id)"
            :disabled="deleting === barcode.id"
            class="text-[#ABABAB] hover:text-red-600 transition-colors disabled:opacity-50"
            title="Удалить"
          >
            <svg v-if="deleting === barcode.id" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
import { ref, reactive } from 'vue'

interface Barcode {
  id: number
  barcode: string
  type: string | null
  is_duplicate?: boolean
}

const props = defineProps<{
  productId: number
  initialBarcodes?: Barcode[]
}>()

const { $api } = useApi()

const barcodes = ref<Barcode[]>(props.initialBarcodes || [])
const showAddForm = ref(false)
const adding = ref(false)
const deleting = ref<number | null>(null)
const addError = ref('')
const addWarning = ref('')

const editingId = ref<number | null>(null)
const editing = ref(false)
const editError = ref('')
const editWarning = ref('')

const newBarcode = reactive({
  barcode: '',
  type: null as string | null
})

const editForm = reactive({
  barcode: '',
  type: null as string | null
})

async function addBarcode() {
  if (!newBarcode.barcode.trim()) return

  addError.value = ''
  addWarning.value = ''
  adding.value = true

  try {
    const response = await $api<Barcode>(`/admin/products/${props.productId}/barcodes`, {
      method: 'POST',
      body: JSON.stringify({
        barcode: newBarcode.barcode.trim(),
        type: newBarcode.type
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.is_duplicate) {
      addWarning.value = 'Внимание: такой штрихкод уже существует в системе'
    }

    barcodes.value.push(response)
    newBarcode.barcode = ''
    newBarcode.type = null

    setTimeout(() => {
      showAddForm.value = false
      addWarning.value = ''
    }, 2000)
  } catch (e: any) {
    if (e?.data?.errors?.barcode) {
      addError.value = e.data.errors.barcode[0]
    } else if (e?.data?.message) {
      addError.value = e.data.message
    } else {
      addError.value = 'Ошибка при добавлении штрихкода'
    }
  } finally {
    adding.value = false
  }
}

function cancelAdd() {
  showAddForm.value = false
  newBarcode.barcode = ''
  newBarcode.type = null
  addError.value = ''
  addWarning.value = ''
}

function startEdit(barcode: Barcode) {
  editingId.value = barcode.id
  editForm.barcode = barcode.barcode
  editForm.type = barcode.type
  editError.value = ''
  editWarning.value = ''
}

async function saveEdit(id: number) {
  if (!editForm.barcode.trim()) return

  editError.value = ''
  editWarning.value = ''
  editing.value = true

  try {
    const response = await $api<Barcode>(`/admin/products/${props.productId}/barcodes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        barcode: editForm.barcode.trim(),
        type: editForm.type
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.is_duplicate) {
      editWarning.value = 'Внимание: такой штрихкод уже существует в системе'
    }

    const index = barcodes.value.findIndex(b => b.id === id)
    if (index !== -1) {
      barcodes.value[index] = response
    }

    setTimeout(() => {
      editingId.value = null
      editWarning.value = ''
    }, 2000)
  } catch (e: any) {
    if (e?.data?.errors?.barcode) {
      editError.value = e.data.errors.barcode[0]
    } else if (e?.data?.message) {
      editError.value = e.data.message
    } else {
      editError.value = 'Ошибка при обновлении штрихкода'
    }
  } finally {
    editing.value = false
  }
}

function cancelEdit() {
  editingId.value = null
  editForm.barcode = ''
  editForm.type = null
  editError.value = ''
  editWarning.value = ''
}

async function removeBarcode(id: number) {
  if (!confirm('Удалить этот штрихкод?')) return

  deleting.value = id

  try {
    await $api(`/admin/products/${props.productId}/barcodes/${id}`, {
      method: 'DELETE'
    })

    barcodes.value = barcodes.value.filter(b => b.id !== id)
  } catch (e) {
    alert('Ошибка при удалении штрихкода')
  } finally {
    deleting.value = null
  }
}
</script>

<style scoped>
.field-label { @apply block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]; }
.field-input { @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors; }
</style>