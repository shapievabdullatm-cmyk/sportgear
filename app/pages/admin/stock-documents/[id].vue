<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">
          Документ {{ document?.number }}
        </h1>
        <p class="text-[12px] text-[#ABABAB] mt-0.5">
          {{ getTypeLabel(document?.type) }} • {{ getStatusLabel(document?.status) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
            v-if="document?.status === 'draft'"
            :to="`/admin/stock-documents/${document.id}/edit`"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] px-3.5 py-2 text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
        >
          Редактировать
        </NuxtLink>
        <NuxtLink
            to="/admin/stock-documents"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] px-3.5 py-2 text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
        >
          Назад к списку
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-32 bg-[#F0EEE9] rounded-xl animate-pulse" />
      <div class="h-64 bg-[#F0EEE9] rounded-xl animate-pulse" />
    </div>

    <template v-else-if="document">
      <!-- Info -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-4">
        <h3 class="text-[13px] font-semibold text-[#1A1A1A]">Информация о документе</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Номер</div>
            <div class="text-[13px] text-[#1A1A1A] font-medium">{{ document.number }}</div>
          </div>

          <div>
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Тип</div>
            <span
                class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                :class="getTypeColor(document.type)"
            >
              {{ getTypeLabel(document.type) }}
            </span>
          </div>

          <div>
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Статус</div>
            <span
                class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                :class="getStatusColor(document.status)"
            >
              {{ getStatusLabel(document.status) }}
            </span>
          </div>

          <div>
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Склад</div>
            <div class="text-[13px] text-[#1A1A1A]">{{ document.warehouse?.title || `#${document.warehouse_id}` }}</div>
          </div>

          <div v-if="document.to_warehouse">
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Целевой склад</div>
            <div class="text-[13px] text-[#1A1A1A]">{{ document.to_warehouse.title }}</div>
          </div>

          <div>
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Создан</div>
            <div class="text-[13px] text-[#1A1A1A]">{{ formatDate(document.created_at) }}</div>
          </div>

          <div v-if="document.completed_at">
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Проведен</div>
            <div class="text-[13px] text-[#1A1A1A]">{{ formatDate(document.completed_at) }}</div>
          </div>

          <div v-if="document.user">
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Автор</div>
            <div class="text-[13px] text-[#1A1A1A]">{{ [document.user.last_name, document.user.first_name].filter(Boolean).join(' ') || document.user.email || document.user.phone }}</div>
          </div>

          <div v-if="document.completed_by_user">
            <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Провел</div>
            <div class="text-[13px] text-[#1A1A1A]">{{ [document.completed_by_user.last_name, document.completed_by_user.first_name].filter(Boolean).join(' ') || document.completed_by_user.email || document.completed_by_user.phone }}</div>
          </div>
        </div>

        <div v-if="document.comment">
          <div class="text-[11px] text-[#ABABAB] uppercase tracking-wider mb-1">Комментарий</div>
          <div class="text-[13px] text-[#555]">{{ document.comment }}</div>
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="p-6 border-b border-[#E8E6E0]">
          <h3 class="text-[13px] font-semibold text-[#1A1A1A]">Товары ({{ document.items?.length || 0 }})</h3>
        </div>

        <table class="w-full border-collapse">
          <thead>
          <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
            <th class="th">Товар</th>
            <th class="th text-right">Количество</th>
            <th class="th text-right">Цена</th>
            <th class="th text-right">Сумма</th>
            <th class="th">Комментарий</th>
          </tr>
          </thead>

          <tbody>
          <tr
              v-for="item in document.items"
              :key="item.id"
              class="border-b border-[#F0EEE9] last:border-0"
          >
            <td class="td">
              <div class="text-[13px] font-medium text-[#1A1A1A]">
                {{ item.product?.title || `Товар #${item.product_id}` }}
              </div>
              <div class="text-[11px] text-[#ABABAB] mt-0.5">ID: {{ item.product_id }}</div>
            </td>

            <td class="td text-right">
              <span class="text-[13px] font-medium text-[#1A1A1A]">{{ item.quantity }}</span>
            </td>

            <td class="td text-right">
              <span class="text-[13px] text-[#555]">{{ item.price ? `${item.price} ₽` : '—' }}</span>
            </td>

            <td class="td text-right">
              <span class="text-[13px] font-medium text-[#1A1A1A]">
                {{ item.price ? `${(item.quantity * item.price).toFixed(2)} ₽` : '—' }}
              </span>
            </td>

            <td class="td">
              <span class="text-[12px] text-[#555]">{{ item.comment || '—' }}</span>
            </td>
          </tr>

          <tr v-if="!document.items?.length">
            <td colspan="5" class="px-5 py-8 text-center text-[13px] text-[#C0BEB8]">
              Нет товаров
            </td>
          </tr>
          </tbody>

          <tfoot v-if="document.items?.length">
          <tr class="border-t-2 border-[#E8E6E0] bg-[#FAFAF8]">
            <td class="td font-semibold text-[13px] text-[#1A1A1A]">Итого</td>
            <td class="td text-right font-semibold text-[13px] text-[#1A1A1A]">
              {{ document.items.reduce((sum: number, item: any) => sum + item.quantity, 0) }}
            </td>
            <td class="td"></td>
            <td class="td text-right font-semibold text-[13px] text-[#1A1A1A]">
              {{ document.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.price || 0)), 0).toFixed(2) }} ₽
            </td>
            <td class="td"></td>
          </tr>
          </tfoot>
        </table>
      </div>

      <!-- Actions -->
      <div v-if="document.status === 'draft'" class="flex gap-3 justify-end">
        <button
            @click="completeDocument"
            :disabled="completing"
            class="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ completing ? 'Проведение...' : 'Провести документ' }}
        </button>
      </div>
    </template>

    <div v-else class="text-center py-12 text-[13px] text-[#C0BEB8]">
      Документ не найден
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useApi()

const document = ref<any>(null)
const loading = ref(false)
const completing = ref(false)

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    in: 'Приход',
    out: 'Расход',
    transfer: 'Перемещение'
  }
  return labels[type] || type
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    in: 'bg-green-50 text-green-700',
    out: 'bg-red-50 text-red-700',
    transfer: 'bg-blue-50 text-blue-700'
  }
  return colors[type] || 'bg-gray-50 text-gray-700'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    completed: 'Проведен',
    cancelled: 'Отменен'
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-gray-50 text-gray-700'
  }
  return colors[status] || 'bg-gray-50 text-gray-700'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchDocument() {
  loading.value = true
  try {
    const data = await $api<any>(`/admin/stock-documents/${route.params.id}`)
    document.value = data
  } catch (error) {
    console.error('Failed to fetch document:', error)
  } finally {
    loading.value = false
  }
}

async function completeDocument() {
  if (!confirm(`Провести документ ${document.value.number}? После проведения изменения будут применены к остаткам и документ нельзя будет изменить.`)) {
    return
  }

  completing.value = true
  try {
    await $api(`/admin/stock-documents/${route.params.id}/complete`, { method: 'POST' })
    await fetchDocument()
  } catch (error: any) {
    alert(error.data?.error || 'Ошибка при проведении документа')
  } finally {
    completing.value = false
  }
}

onMounted(() => {
  fetchDocument()
})
</script>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
</style>