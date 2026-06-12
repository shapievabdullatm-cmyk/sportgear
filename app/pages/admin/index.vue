<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

type StatFormat = 'int' | 'currency'

interface DashboardStat {
  key: string
  label: string
  value: number
  format: StatFormat
  change: number | null
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

interface DashboardRecentOrder {
  id: number
  number: string
  customer: string
  total: number
  status: string
  created_at: string | null
}

interface DashboardTopProduct {
  id: number
  title: string
  slug: string | null
  image_url: string | null
  sales: number
  revenue: number
  trend: 'up' | 'down'
}

interface DashboardActivity {
  type: string
  event: string
  action: string
  description: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'red'
  time: string | null
}

interface DashboardResponse {
  stats: DashboardStat[]
  recent_orders: DashboardRecentOrder[]
  top_products: DashboardTopProduct[]
  activity: DashboardActivity[]
}

const { $api } = useApi()

const { data, pending, error, refresh } = await useAsyncData<DashboardResponse>(
  'admin-dashboard',
  () => $api<DashboardResponse>('/admin/dashboard'),
)

const stats         = computed(() => data.value?.stats ?? [])
const recentOrders  = computed(() => data.value?.recent_orders ?? [])
const topProducts   = computed(() => data.value?.top_products ?? [])
const activityLog   = computed(() => data.value?.activity ?? [])

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('ru-RU')

const formatStatValue = (stat: DashboardStat): string => {
  if (stat.format === 'currency') {
    return currencyFormatter.format(stat.value)
  }
  return numberFormatter.format(stat.value)
}

const formatChange = (change: number | null): string => {
  if (change === null) return '—'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

const changeTrend = (change: number | null): 'up' | 'down' | 'flat' => {
  if (change === null || change === 0) return 'flat'
  return change > 0 ? 'up' : 'down'
}

const formatCurrency = (value: number): string => currencyFormatter.format(value)

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffSec < 60) return 'только что'
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60)
    return `${m} ${pluralize(m, 'минуту', 'минуты', 'минут')} назад`
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600)
    return `${h} ${pluralize(h, 'час', 'часа', 'часов')} назад`
  }
  const days = Math.floor(diffSec / 86400)
  if (days < 7) {
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    new:        'bg-zinc-50 text-zinc-700 border-zinc-200',
    confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
    assembling: 'bg-amber-50 text-amber-700 border-amber-200',
    packed:     'bg-indigo-50 text-indigo-700 border-indigo-200',
    shipped:    'bg-purple-50 text-purple-700 border-purple-200',
    delivered:  'bg-green-50 text-green-700 border-green-200',
    cancelled:  'bg-red-50 text-red-700 border-red-200',
  }
  return colors[status] || 'bg-zinc-50 text-zinc-700 border-zinc-200'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new:        'Новый',
    confirmed:  'Подтверждён',
    assembling: 'Собирается',
    packed:     'Собран',
    shipped:    'Отправлен',
    delivered:  'Доставлен',
    cancelled:  'Отменён',
  }
  return labels[status] || status
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-900 tracking-tight">Дашборд</h1>
        <p class="text-sm text-zinc-500 mt-1">Обзор ключевых метрик и активности</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        :disabled="pending"
        @click="refresh()"
      >
        <Icon
          name="heroicons:arrow-path"
          :class="['w-3.5 h-3.5', pending && 'animate-spin']"
        />
        Обновить
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"
    >
      Не удалось загрузить данные дашборда.
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <template v-if="pending && !data">
        <div
          v-for="i in 4"
          :key="`stat-skel-${i}`"
          class="bg-white rounded-xl border border-zinc-100 p-5 animate-pulse h-[124px]"
        />
      </template>
      <template v-else>
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="bg-white rounded-xl border border-zinc-100 p-5 hover:shadow-lg hover:shadow-zinc-900/5 transition-all duration-200"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-zinc-900 mt-2 tracking-tight">{{ formatStatValue(stat) }}</p>
              <div class="flex items-center gap-1 mt-2">
                <Icon
                  v-if="changeTrend(stat.change) !== 'flat'"
                  :name="changeTrend(stat.change) === 'up' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                  :class="[
                    'w-3 h-3',
                    changeTrend(stat.change) === 'up' ? 'text-green-600' : 'text-red-600'
                  ]"
                />
                <span
                  :class="[
                    'text-xs font-semibold',
                    changeTrend(stat.change) === 'up'   && 'text-green-600',
                    changeTrend(stat.change) === 'down' && 'text-red-600',
                    changeTrend(stat.change) === 'flat' && 'text-zinc-500',
                  ]"
                >
                  {{ formatChange(stat.change) }}
                </span>
                <span class="text-xs text-zinc-400 ml-1">за месяц</span>
              </div>
            </div>
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                stat.color === 'blue' && 'bg-blue-50',
                stat.color === 'green' && 'bg-green-50',
                stat.color === 'purple' && 'bg-purple-50',
                stat.color === 'orange' && 'bg-orange-50',
              ]"
            >
              <Icon
                :name="stat.icon"
                :class="[
                  'w-5 h-5',
                  stat.color === 'blue' && 'text-blue-600',
                  stat.color === 'green' && 'text-green-600',
                  stat.color === 'purple' && 'text-purple-600',
                  stat.color === 'orange' && 'text-orange-600',
                ]"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Orders -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-zinc-900 uppercase tracking-wider">Последние заказы</h2>
            <p class="text-xs text-zinc-500 mt-0.5">Недавние транзакции</p>
          </div>
          <NuxtLink
            to="/admin/orders"
            class="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors flex items-center gap-1"
          >
            Все заказы
            <Icon name="heroicons:arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-zinc-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Заказ</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Клиент</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Сумма</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Статус</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Дата</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              <tr v-if="pending && !data">
                <td colspan="5" class="px-6 py-10 text-center text-sm text-zinc-400">Загрузка…</td>
              </tr>
              <tr v-else-if="!recentOrders.length">
                <td colspan="5" class="px-6 py-10 text-center text-sm text-zinc-400">Заказов пока нет</td>
              </tr>
              <tr
                v-for="order in recentOrders"
                :key="order.id"
                class="hover:bg-zinc-50 transition-colors cursor-pointer"
                @click="$router.push(`/admin/orders/${order.id}`)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-semibold text-zinc-900">#{{ order.number }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-zinc-700">{{ order.customer }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-semibold text-zinc-900">{{ formatCurrency(order.total) }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border',
                      getStatusColor(order.status)
                    ]"
                  >
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-xs text-zinc-500">{{ formatDate(order.created_at) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-zinc-100">
          <h2 class="text-sm font-bold text-zinc-900 uppercase tracking-wider">Активность</h2>
          <p class="text-xs text-zinc-500 mt-0.5">Последние события</p>
        </div>
        <div class="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          <div v-if="pending && !data" class="py-8 text-center text-sm text-zinc-400">
            Загрузка…
          </div>
          <div v-else-if="!activityLog.length" class="py-8 text-center text-sm text-zinc-400">
            Событий пока нет
          </div>
          <div
            v-for="(activity, index) in activityLog"
            :key="index"
            class="flex gap-3 group"
          >
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                activity.color === 'blue' && 'bg-blue-50 group-hover:bg-blue-100',
                activity.color === 'green' && 'bg-green-50 group-hover:bg-green-100',
                activity.color === 'purple' && 'bg-purple-50 group-hover:bg-purple-100',
                activity.color === 'red' && 'bg-red-50 group-hover:bg-red-100',
              ]"
            >
              <Icon
                :name="activity.icon"
                :class="[
                  'w-4 h-4',
                  activity.color === 'blue' && 'text-blue-600',
                  activity.color === 'green' && 'text-green-600',
                  activity.color === 'purple' && 'text-purple-600',
                  activity.color === 'red' && 'text-red-600',
                ]"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-zinc-900">{{ activity.action }}</p>
              <p class="text-xs text-zinc-500 mt-0.5 truncate">{{ activity.description }}</p>
              <p class="text-xs text-zinc-400 mt-1">{{ formatRelativeTime(activity.time) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Products -->
    <div class="bg-white rounded-xl border border-zinc-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-zinc-900 uppercase tracking-wider">Топ товары</h2>
          <p class="text-xs text-zinc-500 mt-0.5">Самые продаваемые товары за месяц</p>
        </div>
        <NuxtLink
          to="/admin/products"
          class="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors flex items-center gap-1"
        >
          Все товары
          <Icon name="heroicons:arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Товар</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Продажи</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Выручка</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Тренд</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-if="pending && !data">
              <td colspan="4" class="px-6 py-10 text-center text-sm text-zinc-400">Загрузка…</td>
            </tr>
            <tr v-else-if="!topProducts.length">
              <td colspan="4" class="px-6 py-10 text-center text-sm text-zinc-400">Продаж за этот месяц пока нет</td>
            </tr>
            <tr
              v-for="product in topProducts"
              :key="product.id"
              class="hover:bg-zinc-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.title"
                      class="w-full h-full object-cover"
                    >
                    <Icon v-else name="heroicons:cube" class="w-5 h-5 text-zinc-400" />
                  </div>
                  <NuxtLink
                    v-if="product.slug"
                    :to="`/products/${product.slug}`"
                    class="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
                  >
                    {{ product.title }}
                  </NuxtLink>
                  <span v-else class="text-sm font-medium text-zinc-900">{{ product.title }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-zinc-900">{{ product.sales }}</span>
                <span class="text-xs text-zinc-500 ml-1">шт</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-zinc-900">{{ formatCurrency(product.revenue) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1">
                  <Icon
                    :name="product.trend === 'up' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                    :class="[
                      'w-4 h-4',
                      product.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    ]"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #fafafa;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d4d4d8;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
}
</style>