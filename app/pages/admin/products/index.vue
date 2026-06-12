<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Товары</h1>
      <NuxtLink
          to="/admin/products/create"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg class="w-3.5 h-3.5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </span>
      <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по названию, артикулу, ID, штрихкоду…"
          class="w-full bg-white border border-[#E8E6E0] rounded-xl py-2.5 pl-9 pr-4 text-[13px] placeholder-[#C0BEB8] focus:outline-none focus:border-[#1A1A1A] transition-colors"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-[11px] uppercase tracking-[0.12em] text-[#ABABAB]">Статус</span>
        <div class="inline-flex bg-white border border-[#E8E6E0] rounded-lg p-0.5">
          <button
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              type="button"
              @click="setStatusFilter(opt.value)"
              class="px-3 h-7 rounded-md text-[12px] font-medium transition-colors"
              :class="statusFilter === opt.value
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[11px] uppercase tracking-[0.12em] text-[#ABABAB]">Наличие</span>
        <div class="inline-flex bg-white border border-[#E8E6E0] rounded-lg p-0.5">
          <button
              v-for="opt in STOCK_OPTIONS"
              :key="opt.value"
              type="button"
              @click="setStockFilter(opt.value)"
              class="px-3 h-7 rounded-md text-[12px] font-medium transition-colors"
              :class="stockFilter === opt.value
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="flex items-center gap-4 text-[12px] text-[#ABABAB]">
      <span v-if="store.pagination">Всего: <strong class="text-[#1A1A1A]">{{ store.pagination.total }}</strong></span>
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block bg-white border border-[#E8E6E0] rounded-xl overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
        <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
          <th class="th w-16">ID</th>
          <th class="th w-20">Фото</th>
          <th class="th">Название</th>
          <th class="th">Цена</th>
          <th class="th">Остаток</th>
          <th class="th">Активен</th>
          <th class="th w-24 text-right">Действия</th>
        </tr>
        </thead>

        <tbody>
        <!-- Loading skeleton -->
        <template v-if="store.loading">
          <tr v-for="n in 5" :key="n" class="border-b border-[#F0EEE9] last:border-0">
            <td class="td"><div class="h-3 w-8 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-12 w-12 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-48 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-16 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-12 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-8 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td" />
          </tr>
        </template>

        <template v-else>
          <template v-for="product in store.products" :key="product.id">
            <!-- Parent product row -->
            <tr
                class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
            >
              <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ product.id }}</td>

              <td class="td">
                <div class="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F4F0] flex items-center justify-center">
                  <img
                      v-if="product.images?.[0]?.url"
                      :src="product.images[0].url"
                      :alt="product.title"
                      class="w-full h-full object-cover"
                  />
                  <svg v-else class="w-5 h-5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              </td>

              <td class="td">
                <div class="flex items-center gap-2">
                  <!-- Expand/collapse button for products with children -->
                  <button
                      v-if="product.children && product.children.length > 0"
                      @click="toggleExpand(product.id)"
                      class="w-5 h-5 flex items-center justify-center rounded text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors shrink-0"
                  >
                    <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-90': expandedProducts.has(product.id) }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                  <NuxtLink
                      :to="`/admin/products/${product.id}/edit`"
                      class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors"
                  >
                    {{ product.external_title || product.title || '—' }}
                  </NuxtLink>
                  <span v-if="product.children && product.children.length > 0" class="text-[11px] text-[#ABABAB]">({{ product.children.length }})</span>
                </div>
              </td>

              <td class="td text-[13px] text-[#555]">
                {{ product.price ? `${product.price} ₽` : '—' }}
              </td>

              <td class="td">
                <StockTooltip
                    :total-stock="product.total_stock ?? 0"
                    :stocks="product.stocks"
                />
              </td>

              <td class="td">
                <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                    :class="product.is_active
                    ? 'bg-[#F0FDF4] text-[#15803D]'
                    : 'bg-[#F5F4F0] text-[#ABABAB]'"
                >
                  {{ product.is_active ? 'Да' : 'Нет' }}
                </span>
              </td>

              <td class="td">
                <div class="flex items-center justify-end gap-0.5">
                  <NuxtLink
                      :to="`/admin/products/${product.id}`"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                      title="Просмотр"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </NuxtLink>

                  <NuxtLink
                      :to="`/admin/products/${product.id}/edit`"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                      title="Редактировать"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </NuxtLink>

                  <button
                      @click.prevent="confirmDelete(product)"
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

            <!-- Child products rows (expanded) -->
            <template v-if="expandedProducts.has(product.id) && product.children && product.children.length > 0">
              <tr
                  v-for="child in product.children"
                  :key="`child-${child.id}`"
                  class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100 bg-[#FAFAF8]/50"
              >
                <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ child.id }}</td>

                <td class="td">
                  <div class="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F4F0] flex items-center justify-center">
                    <img
                        v-if="child.images?.[0]?.url"
                        :src="child.images[0].url"
                        :alt="child.title"
                        class="w-full h-full object-cover"
                    />
                    <svg v-else class="w-5 h-5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                </td>

                <td class="td">
                  <div class="flex items-center gap-2 pl-7">
                    <svg class="w-3 h-3 text-[#C0BEB8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <NuxtLink
                        :to="`/admin/products/${child.id}/edit`"
                        class="text-[13px] text-[#555] hover:text-[#1A1A1A] transition-colors"
                    >
                      {{ child.external_title || child.title || '—' }}
                    </NuxtLink>
                  </div>
                </td>

                <td class="td text-[13px] text-[#555]">
                  {{ child.price ? `${child.price} ₽` : '—' }}
                </td>

                <td class="td">
                  <StockTooltip
                      :total-stock="child.total_stock ?? 0"
                      :stocks="child.stocks"
                  />
                </td>

                <td class="td">
                  <span
                      class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                      :class="child.is_active
                      ? 'bg-[#F0FDF4] text-[#15803D]'
                      : 'bg-[#F5F4F0] text-[#ABABAB]'"
                  >
                    {{ child.is_active ? 'Да' : 'Нет' }}
                  </span>
                </td>

                <td class="td">
                  <div class="flex items-center justify-end gap-0.5">
                    <NuxtLink
                        :to="`/admin/products/${child.id}`"
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                        title="Просмотр"
                    >
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </NuxtLink>

                    <NuxtLink
                        :to="`/admin/products/${child.id}/edit`"
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                        title="Редактировать"
                    >
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </NuxtLink>

                    <button
                        @click.prevent="confirmDelete(child)"
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
            </template>
          </template>

          <tr v-if="!store.products.length">
            <td colspan="7" class="px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
              Товары не найдены
            </td>
          </tr>
        </template>
        </tbody>
      </table>

      <!-- Desktop Pagination -->
      <div v-if="totalPages > 1 || store.pagination && store.pagination.total > PER_PAGE_OPTIONS[0]"
           class="flex items-center justify-between px-5 py-3 border-t border-[#F0EEE9]">
        <div class="flex items-center gap-2">
          <span class="text-[12px] text-[#ABABAB]">Показывать</span>
          <div class="flex gap-1">
            <button v-for="n in PER_PAGE_OPTIONS" :key="n" @click="setPerPage(n)"
                    class="h-6 min-w-[28px] px-1.5 flex items-center justify-center rounded text-[12px] font-medium transition-colors"
                    :class="perPage === n ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'">{{ n }}</button>
          </div>
          <span class="text-[12px] text-[#ABABAB]">· {{ rangeText }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button @click="currentPage--" :disabled="currentPage === 1"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <template v-for="page in pagesToShow" :key="page">
            <span v-if="page === '...'" class="w-7 h-7 flex items-center justify-center text-[12px] text-[#C0BEB8]">…</span>
            <button v-else @click="currentPage = page"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[12px] font-medium transition-colors"
                    :class="currentPage === page ? 'bg-[#1A1A1A] text-white' : 'text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9]'">{{ page }}</button>
          </template>
          <button @click="currentPage++" :disabled="currentPage === totalPages || totalPages === 0"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile cards -->
    <div class="md:hidden space-y-2">
      <div v-for="product in store.products" :key="product.id"
           class="bg-white border border-[#E8E6E0] rounded-xl p-4">
        <div class="flex gap-3">
          <!-- Image -->
          <div class="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F4F0] flex items-center justify-center shrink-0">
            <img
                v-if="product.images?.[0]?.url"
                :src="product.images[0].url"
                :alt="product.title"
                class="w-full h-full object-cover"
            />
            <svg v-else class="w-6 h-6 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <NuxtLink
                    :to="`/admin/products/${product.id}/edit`"
                    class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors line-clamp-2"
                >
                  {{ product.external_title || product.title || '—' }}
                </NuxtLink>
                <p class="font-mono text-[10px] text-[#C0BEB8] mt-0.5">ID: {{ product.id }}</p>
              </div>
              <button
                  @click.prevent="confirmDelete(product)"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="product.price" class="text-[13px] font-medium text-[#1A1A1A]">{{ product.price }} ₽</span>
              <StockTooltip
                  :total-stock="product.total_stock ?? 0"
                  :stocks="product.stocks"
              />
              <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                  :class="product.is_active ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#F5F4F0] text-[#ABABAB]'"
              >
                {{ product.is_active ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div v-if="totalPages > 1 || store.pagination && store.pagination.total > PER_PAGE_OPTIONS[0]"
           class="bg-white border border-[#E8E6E0] rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between text-[12px] text-[#ABABAB]">
          <span>{{ rangeText }}</span>
        </div>
        <div class="flex items-center justify-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <span class="text-[12px] text-[#1A1A1A] font-medium">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button @click="currentPage++" :disabled="currentPage === totalPages || totalPages === 0"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#E8E6E0] hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm delete modal -->
    <Transition name="fade">
      <div
          v-if="deleteTarget"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          @click.self="deleteTarget = null"
      >
        <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-xl p-6 w-80 space-y-4">
          <p class="text-[13px] font-semibold text-[#1A1A1A]">Удалить товар?</p>
          <p class="text-[12px] text-[#ABABAB]">
            «{{ deleteTarget.title }}» будет удалён без возможности восстановления.
          </p>
          <div class="flex gap-2 justify-end">
            <button
                @click="deleteTarget = null"
                class="px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
            >
              Отмена
            </button>
            <button
                @click="doDelete"
                :disabled="deleting"
                class="px-3.5 py-2 rounded-lg text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {{ deleting ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Spacer for tooltips -->
    <div class="h-48"></div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'
import { useProductStore } from '~/stores/admin/product'
import StockTooltip from '~/components/admin/StockTooltip.vue'

definePageMeta({ layout: 'admin' })

const store = useProductStore()
const route = useRoute()
const router = useRouter()

const PER_PAGE_OPTIONS = [10, 20, 30, 50, 100] as const

type StatusFilter = 'all' | 'active' | 'inactive'
type StockFilter = 'all' | 'in_stock' | 'out_of_stock'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
]

const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'in_stock', label: 'В наличии' },
  { value: 'out_of_stock', label: 'Нет в наличии' },
]

function parseStatus(v: unknown): StatusFilter {
  return v === 'active' || v === 'inactive' ? v : 'all'
}
function parseStock(v: unknown): StockFilter {
  return v === 'in_stock' || v === 'out_of_stock' ? v : 'all'
}

const searchQuery = ref((route.query.q as string) || '')
const currentPage = ref(Number(route.query.page) || 1)
const perPage = ref(Number(route.query.per_page) || 20)
const statusFilter = ref<StatusFilter>(parseStatus(route.query.status))
const stockFilter = ref<StockFilter>(parseStock(route.query.stock))

// Инициализация с пагинацией
await useAsyncData('products', () => store.fetchAll({
  page: currentPage.value,
  per_page: perPage.value,
  search: searchQuery.value || undefined,
  status: statusFilter.value,
  stock: stockFilter.value,
}))

const deleteTarget = ref<Product | null>(null)
const deleting = ref(false)
const expandedProducts = ref<Set<number>>(new Set())

function toggleExpand(productId: number) {
  if (expandedProducts.value.has(productId)) {
    expandedProducts.value.delete(productId)
  } else {
    expandedProducts.value.add(productId)
  }
}

// Search with debounce
let searchTimeout: NodeJS.Timeout | null = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadProducts()
  }, 500)
}

watch(searchQuery, debouncedSearch)

// Load products with pagination
async function loadProducts() {
  await store.fetchAll({
    page: currentPage.value,
    per_page: perPage.value,
    search: searchQuery.value.trim() || undefined,
    status: statusFilter.value,
    stock: stockFilter.value,
  })
}

function setStatusFilter(value: StatusFilter) {
  if (statusFilter.value === value) return
  statusFilter.value = value
  currentPage.value = 1
  loadProducts()
  syncQuery()
}

function setStockFilter(value: StockFilter) {
  if (stockFilter.value === value) return
  stockFilter.value = value
  currentPage.value = 1
  loadProducts()
  syncQuery()
}

// Pagination
const totalPages = computed(() => store.pagination?.last_page ?? 1)

const rangeText = computed(() => {
  if (!store.pagination) return '0'
  const { from, to, total } = store.pagination
  if (!total) return '0'
  return `${from}–${to} из ${total}`
})

const pagesToShow = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: (number | '...')[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (cur > 3) pages.push('...')

  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) {
    pages.push(i)
  }

  if (cur < total - 2) pages.push('...')
  pages.push(total)

  return pages
})

function syncQuery() {
  router.replace({
    query: {
      ...route.query,
      page: currentPage.value,
      per_page: perPage.value,
      q: searchQuery.value || undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
      stock: stockFilter.value === 'all' ? undefined : stockFilter.value,
    }
  })
}

watch([currentPage, perPage], () => {
  loadProducts()
  syncQuery()
})

function setPerPage(n: number) {
  perPage.value = n
  currentPage.value = 1
}

// Delete actions
function confirmDelete(product: Product) {
  deleteTarget.value = product
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.destroy(deleteTarget.value.id)

    // Перезагружаем данные
    await loadProducts()

    // Если текущая страница пуста, переходим на предыдущую
    if (store.products.length === 0 && currentPage.value > 1) {
      currentPage.value--
      await loadProducts()
    }

    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>