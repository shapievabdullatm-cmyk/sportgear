<template>
  <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click.self="$emit('close')"
  >
    <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-[15px] font-semibold text-[#1A1A1A]">{{ title }}</h3>
        <button
            @click="$emit('close')"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Stock Info -->
      <div class="p-3 bg-[#FAFAF8] border border-[#E8E6E0] rounded-lg space-y-1">
        <div class="text-[12px] text-[#ABABAB]">Товар</div>
        <div class="text-[13px] font-medium text-[#1A1A1A]">
          {{ stock.product?.title || `Товар #${stock.product_id}` }}
        </div>
        <div class="text-[12px] text-[#ABABAB] mt-2">Склад</div>
        <div class="text-[13px] font-medium text-[#1A1A1A]">
          {{ stock.warehouse?.title || `Склад #${stock.warehouse_id}` }}
        </div>
        <div class="text-[12px] text-[#ABABAB] mt-2">Текущий остаток</div>
        <div class="text-[13px] font-medium text-[#1A1A1A]">
          {{ stock.quantity }} (доступно: {{ stock.quantity - stock.reserved_quantity }})
        </div>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <!-- Transfer: select target warehouse -->
        <div v-if="type === 'transfer'">
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Целевой склад *
          </label>
          <select
              v-model="form.to_warehouse_id"
              required
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
          >
            <option value="">Выберите склад</option>
            <option
                v-for="warehouse in warehouses"
                :key="warehouse.id"
                :value="warehouse.id"
                :disabled="warehouse.id === stock.warehouse_id"
            >
              {{ warehouse.title }}
            </option>
          </select>
        </div>

        <!-- Quantity -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            {{ type === 'adjust' ? 'Новое количество *' : 'Количество *' }}
          </label>
          <input
              v-model="form.quantity"
              type="number"
              :min="type === 'adjust' ? '0' : '1'"
              required
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
              placeholder="0"
          />
          <p v-if="type === 'adjust'" class="text-[11px] text-[#ABABAB] mt-1">
            Текущее: {{ stock.quantity }}
          </p>
        </div>

        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Причина
          </label>
          <input
              v-model="form.reason"
              type="text"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
              :placeholder="reasonPlaceholder"
          />
        </div>

        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Комментарий
          </label>
          <textarea
              v-model="form.comment"
              rows="3"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent resize-none"
              placeholder="Дополнительная информация"
          />
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-[12px] text-red-600">{{ error }}</p>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-lg text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
          >
            Отмена
          </button>
          <button
              type="submit"
              :disabled="submitting"
              :class="[
                'px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-50',
                type === 'remove' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1A1A1A] hover:bg-[#333]'
              ]"
          >
            {{ submitting ? 'Обработка...' : buttonText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface Stock {
  id: number
  product_id: number
  warehouse_id: number
  quantity: number
  reserved_quantity: number
  product?: { id: number; title: string }
  warehouse?: { id: number; title: string }
}

interface Warehouse {
  id: number
  title: string
}

const props = defineProps<{
  type: 'add' | 'remove' | 'adjust' | 'transfer'
  stock: Stock
  warehouses: Warehouse[]
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { $api } = useApi()

const form = reactive({
  quantity: '',
  to_warehouse_id: '',
  reason: '',
  comment: ''
})

const submitting = ref(false)
const error = ref('')

const title = computed(() => {
  const titles = {
    add: 'Приход товара',
    remove: 'Расход товара',
    adjust: 'Корректировка остатков',
    transfer: 'Перемещение товара'
  }
  return titles[props.type]
})

const buttonText = computed(() => {
  const texts = {
    add: 'Добавить',
    remove: 'Списать',
    adjust: 'Скорректировать',
    transfer: 'Переместить'
  }
  return texts[props.type]
})

const reasonPlaceholder = computed(() => {
  const placeholders = {
    add: 'Например: Поставка от поставщика',
    remove: 'Например: Продажа',
    adjust: 'Например: Инвентаризация',
    transfer: 'Например: Перемещение на региональный склад'
  }
  return placeholders[props.type]
})

async function submit() {
  submitting.value = true
  error.value = ''

  try {
    let endpoint = ''
    let body: any = {
      product_id: props.stock.product_id,
      warehouse_id: props.stock.warehouse_id,
      quantity: parseInt(form.quantity),
      reason: form.reason || undefined,
      comment: form.comment || undefined
    }

    if (props.type === 'transfer') {
      endpoint = '/admin/stocks/transfer'
      body = {
        product_id: props.stock.product_id,
        from_warehouse_id: props.stock.warehouse_id,
        to_warehouse_id: parseInt(form.to_warehouse_id),
        quantity: parseInt(form.quantity),
        reason: form.reason || undefined,
        comment: form.comment || undefined
      }
    } else {
      endpoint = `/admin/stocks/${props.type}`
    }

    await $api(endpoint, {
      method: 'POST',
      body
    })

    emit('success')
    emit('close')
  } catch (err: any) {
    error.value = err.data?.error || err.message || 'Ошибка при выполнении операции'
  } finally {
    submitting.value = false
  }
}
</script>