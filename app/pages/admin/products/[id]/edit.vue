<template>
  <div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.visible.value" class="fixed top-5 right-5 z-[60] w-72">
        <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-lg overflow-hidden">
          <div class="p-4 flex items-center gap-3">
            <div class="w-7 h-7 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shrink-0">
              <svg class="w-3.5 h-3.5 text-[#15803D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="text-[13px] font-semibold text-[#1A1A1A] flex-1">Сохранено</p>
            <button @click="toast.hide()" class="text-[#C0BEB8] hover:text-[#1A1A1A]">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="h-0.5 bg-[#1A1A1A] transition-all duration-100" :style="{ width: toast.progress.value + '%' }" />
        </div>
      </div>
    </Transition>

    <!-- Sticky Toolbar (full main width) -->
    <div class="sticky top-0 z-30 px-6 md:px-10 py-2 bg-white border-b border-[#E8E6E0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div class="max-w-[1400px] mx-auto">
        <!-- Breadcrumb row -->
        <NuxtLink
            to="/admin/products"
            class="inline-flex items-center gap-1 text-[11px] leading-none text-[#888] hover:text-[#1A1A1A] transition-colors"
        >
          <svg class="block w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Все товары
        </NuxtLink>

        <!-- Title row -->
        <div class="mt-1.5 flex items-center justify-between gap-3">
          <div class="flex items-baseline gap-2.5 min-w-0 flex-1">
            <h1 class="text-[15px] font-semibold text-[#1A1A1A] truncate">
              {{ form.title || 'Без названия' }}
            </h1>
            <span
                v-if="dirty"
                class="inline-flex items-baseline gap-1.5 text-[12px] text-[#B45309] flex-shrink-0"
            >
              <span class="self-center w-1.5 h-1.5 rounded-full bg-amber-500" />
              Изменено
            </span>
            <span
                v-else
                class="inline-flex items-baseline gap-1.5 text-[12px] flex-shrink-0"
                :class="form.is_active ? 'text-[#15803D]' : 'text-[#888]'"
            >
              <span
                  class="self-center w-1.5 h-1.5 rounded-full"
                  :class="form.is_active ? 'bg-[#15803D]' : 'bg-[#ABABAB]'"
              />
              {{ form.is_active ? 'Активен' : 'Скрыт' }}
            </span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
                @click="showCopyModal = true"
                class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-[#555] hover:text-[#1A1A1A] border border-[#E8E6E0] rounded-lg hover:border-[#C0BEB8] transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Копировать
            </button>
            <button
                @click.prevent="submit"
                :disabled="saving || !dirty"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-1.5 text-[12px] font-medium text-white hover:bg-[#333] transition-colors disabled:bg-[#C0BEB8] disabled:cursor-not-allowed"
            >
              <svg v-if="saving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-[1400px] mx-auto px-6 md:px-10 py-6">

      <!-- Errors -->
      <div v-if="errors.length" class="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1 mb-6">
        <p v-for="(e, i) in errors" :key="i" class="text-[12px] text-red-600">{{ e }}</p>
      </div>

      <!-- 2-column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- ── LEFT MAIN COLUMN ─────────────────────────────────────── -->
        <div class="lg:col-span-2 space-y-5 min-w-0">

          <!-- Основное -->
          <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Основное</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Название и описание товара</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <div class="sm:col-span-4 space-y-1.5">
                <label class="field-label">Заголовок <span class="text-red-400">*</span></label>
                <input v-model="form.title" type="text" placeholder="Название товара" class="field-input" />
              </div>
              <div class="sm:col-span-2 space-y-1.5">
                <label class="field-label">Артикул</label>
                <input v-model="form.article" type="text" placeholder="SKU-001" class="field-input" />
              </div>
              <div class="sm:col-span-6 space-y-1.5">
                <label class="field-label">Внешнее название</label>
                <input v-model="form.external_title" type="text" placeholder="Используется в каталоге и SEO" class="field-input" />
              </div>
              <div class="sm:col-span-6 space-y-1.5">
                <label class="field-label">Описание</label>
                <textarea v-model="form.description" rows="5" placeholder="Подробное описание товара…" class="field-input resize-none" />
              </div>
            </div>
          </section>

          <!-- Изображения -->
          <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Изображения</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Перетащите для изменения порядка. Первое — главное.</p>
            </div>
            <ImageManager
                :images="allImages"
                :marked-for-deletion="markedForDeletion"
                :is-edit-mode="true"
                @update:images="onImagesReorder"
                @add-files="addFiles"
                @remove="removePending"
                @preview="previewImage = $event"
                @mark="mark"
                @unmark="unmark"
            />
          </section>

          <!-- Цена -->
          <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Цена</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Старая цена показывается перечёркнутой</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="field-label">Цена, ₽</label>
                <input v-model.number="form.price" type="number" min="0" step="0.01" placeholder="0" class="field-input" />
              </div>
              <div class="space-y-1.5">
                <label class="field-label">Старая цена, ₽</label>
                <input v-model.number="form.old_price" type="number" min="0" step="0.01" placeholder="0" class="field-input" />
              </div>
            </div>
          </section>

          <!-- Габариты -->
          <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Габариты</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Используются для расчёта доставки</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="space-y-1.5">
                <label class="field-label">Длина, мм</label>
                <input v-model.number="form.length" type="number" min="0" placeholder="0" class="field-input" />
              </div>
              <div class="space-y-1.5">
                <label class="field-label">Ширина, мм</label>
                <input v-model.number="form.width" type="number" min="0" placeholder="0" class="field-input" />
              </div>
              <div class="space-y-1.5">
                <label class="field-label">Высота, мм</label>
                <input v-model.number="form.height" type="number" min="0" placeholder="0" class="field-input" />
              </div>
              <div class="space-y-1.5">
                <label class="field-label">Вес, г</label>
                <input v-model.number="form.weight" type="number" min="0" placeholder="0" class="field-input" />
              </div>
            </div>
          </section>

          <!-- Params skeleton -->
          <section v-if="paramsLoading" class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6 space-y-3">
            <div class="h-4 w-32 bg-[#F0EEE9] rounded animate-pulse mb-2" />
            <div v-for="n in 4" :key="n" class="h-10 bg-[#F0EEE9] rounded-lg animate-pulse" />
          </section>

          <!-- Params -->
          <section v-else-if="resolvedParams.length" class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Характеристики</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Параметры выбранной категории</p>
            </div>
            <div class="divide-y divide-[#F0EEE9]">
        <div
            v-for="p in resolvedParams"
            :key="p.id"
            class="grid grid-cols-1 sm:grid-cols-4 gap-3 py-3.5 first:pt-0 last:pb-0 items-start"
        >
          <div class="sm:pt-2.5 space-y-0.5">
            <p class="text-[12px] font-medium text-[#555]">
              {{ p.title }}<span v-if="p.required" class="text-red-400 ml-0.5">*</span>
            </p>
            <p v-if="p.unit" class="text-[11px] text-[#ABABAB]">{{ p.unit }}</p>
            <p class="text-[10px] text-[#C0BEB8]">{{ p.filter_type_title }}</p>
          </div>

          <div class="sm:col-span-3">

            <input v-if="p.filter_type === PARAM_TYPE.STRING"
                   type="text" class="field-input"
                   v-model="pv(p.id).value"
            />
            <textarea v-else-if="p.filter_type === PARAM_TYPE.TEXT"
                      rows="3" class="field-input resize-none"
                      v-model="pv(p.id).value"
            />
            <input v-else-if="p.filter_type === PARAM_TYPE.INTEGER"
                   type="number" step="1" class="field-input"
                   v-model.number="pv(p.id).value"
            />
            <input v-else-if="p.filter_type === PARAM_TYPE.FLOAT"
                   type="number" step="0.01" class="field-input"
                   v-model.number="pv(p.id).value"
            />
            <label v-else-if="p.filter_type === PARAM_TYPE.BOOLEAN"
                   class="relative inline-flex items-center cursor-pointer mt-1.5"
            >
              <input type="checkbox"
                     :checked="!!pv(p.id).value"
                     @change="pv(p.id).value = ($event.target as HTMLInputElement).checked ? 1 : 0"
                     class="sr-only peer"
              />
              <div class="w-9 h-5 bg-[#E8E6E0] peer-checked:bg-[#1A1A1A] rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>

            <!-- COLOR: одиночный (p.multiple=false) или множественный (p.multiple=true) -->
            <template v-else-if="p.filter_type === PARAM_TYPE.COLOR">
              <template v-if="p.multiple">
                <!-- Множественный выбор цветов через MultiSelect -->
                <MultiSelect
                    :model-value="pv(p.id).option_ids"
                    @update:model-value="pv(p.id).option_ids = $event"
                    :options="p.options.map(opt => ({ value: opt.id, label: colorName(opt.value), color: colorCss(opt.value) }))"
                    :show-colors="true"
                    placeholder="Выберите цвета..."
                />
              </template>
              <template v-else>
                <!-- Одиночный выбор цвета -->
                <SearchableSelect
                    :model-value="pv(p.id).option_id"
                    @update:model-value="pv(p.id).option_id = $event"
                    :options="[
                      { value: null, label: 'Не выбрано' },
                      ...p.options.map(opt => ({ value: opt.id, label: colorName(opt.value), color: colorCss(opt.value) }))
                    ]"
                    placeholder="Выберите цвет..."
                />
              </template>
            </template>

            <!-- MULTISELECT: множественный выбор -->
            <template v-else-if="p.filter_type === PARAM_TYPE.MULTISELECT">
              <!-- Если is_size = true, то только одиночный выбор -->
              <template v-if="p.is_size">
                <SearchableSelect
                    :model-value="pv(p.id).option_id"
                    @update:model-value="pv(p.id).option_id = $event"
                    :options="[
                      { value: null, label: 'Не выбрано' },
                      ...p.options.map(opt => ({ value: opt.id, label: opt.value }))
                    ]"
                    placeholder="Выберите размер..."
                />
              </template>
              <template v-else>
                <MultiSelect
                    :model-value="pv(p.id).option_ids"
                    @update:model-value="pv(p.id).option_ids = $event"
                    :options="p.options.map(opt => ({ value: opt.id, label: opt.value }))"
                    placeholder="Выберите варианты..."
                />
              </template>
            </template>

                </div>
              </div>
            </div>
          </section>

          <!-- Barcodes -->
          <ProductBarcodesCreate :product-id="productId" :initial-barcodes="product.barcodes || []" />

          <!-- Bought Together -->
          <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">С этим товаром покупают</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Рекомендации на странице товара</p>
            </div>
            <MultiSelect
                v-model="boughtTogetherIds"
                :options="availableProductsOptions"
                placeholder="Начните вводить название товара…"
                :show-selected="false"
            />
            <div v-if="selectedBoughtTogetherProducts.length" class="mt-4 space-y-2">
              <div
                  v-for="prod in selectedBoughtTogetherProducts"
                  :key="prod.id"
                  class="flex items-center gap-3 p-2 border border-[#E8E6E0] rounded-lg bg-[#FAFAF8] hover:bg-[#F5F5F3] transition-colors"
              >
                <img
                    v-if="prod.images && prod.images.length"
                    :src="prod.images[0].url"
                    :alt="prod.title"
                    class="w-12 h-12 object-cover rounded-md flex-shrink-0"
                />
                <div v-else class="w-12 h-12 bg-[#E8E6E0] rounded-md flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-medium text-[#1A1A1A] truncate">{{ prod.external_title || prod.title }}</p>
                  <p v-if="prod.article" class="text-[10px] text-[#ABABAB]">Артикул: {{ prod.article }}</p>
                </div>
                <button
                    @click.prevent="boughtTogetherIds = boughtTogetherIds.filter(id => id !== prod.id)"
                    class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-[#ABABAB] hover:text-red-600 transition-colors"
                    type="button"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <!-- SEO -->
          <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 sm:p-6">
            <div class="mb-4">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A]">SEO</h2>
              <p class="text-[11px] text-[#888] mt-0.5">Мета-теги для поисковиков</p>
            </div>
            <SeoFields v-model="seoData" />
          </section>

        </div>

        <!-- ── RIGHT SIDEBAR ─────────────────────────────────────────── -->
        <div class="lg:col-span-1 space-y-5 min-w-0">
          <div class="lg:sticky lg:top-[72px] space-y-5">

            <!-- Публикация -->
            <section class="bg-white border border-[#E8E6E0] rounded-xl p-5">
              <h2 class="text-[13px] font-semibold text-[#1A1A1A] mb-3">Публикация</h2>
              <label class="flex items-center justify-between cursor-pointer group">
                <div>
                  <p class="text-[12px] font-medium text-[#1A1A1A]">Активен</p>
                  <p class="text-[11px] text-[#888] mt-0.5">{{ form.is_active ? 'Товар виден в каталоге' : 'Скрыт от покупателей' }}</p>
                </div>
                <div class="relative">
                  <input type="checkbox" v-model="form.is_active" class="sr-only peer" />
                  <div class="w-10 h-6 bg-[#E8E6E0] peer-checked:bg-[#1A1A1A] rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
                </div>
              </label>
            </section>

            <!-- Классификация -->
            <section class="bg-white border border-[#E8E6E0] rounded-xl p-5 space-y-4">
              <div>
                <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Классификация</h2>
                <p class="text-[11px] text-[#888] mt-0.5">Где и под каким брендом</p>
              </div>
              <div class="space-y-3">
                <div class="space-y-1.5">
                  <label class="field-label">Категория <span class="text-red-400">*</span></label>
                  <SearchableSelect
                      v-model="form.category_id"
                      :options="categoryOptions"
                      placeholder="Выберите категорию"
                      @update:model-value="onCategoryChange"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="field-label">Родительский товар</label>
                  <SearchableSelect
                      v-model="form.parent_id"
                      :options="parentProductOptions"
                      placeholder="Не выбрано"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="field-label">Бренд</label>
                  <SearchableSelect
                      v-model="form.brand_id"
                      :options="brandOptions"
                      placeholder="Выберите бренд"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="field-label">Родина бренда</label>
                  <SearchableSelect
                      v-model="form.brand_origin_id"
                      :options="brandOriginOptions"
                      placeholder="Не выбрано"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="field-label">Страна производства</label>
                  <SearchableSelect
                      v-model="form.manufacturing_country_id"
                      :options="manufacturingCountryOptions"
                      placeholder="Не выбрано"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="field-label">Таблица размеров</label>
                  <SearchableSelect
                      v-model="form.size_table_id"
                      :options="sizeTableOptions"
                      placeholder="Не выбрано"
                  />
                </div>
              </div>
            </section>

            <!-- Остатки -->
            <section v-if="product.stocks && product.stocks.length > 0" class="bg-white border border-[#E8E6E0] rounded-xl p-5">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Остатки</h2>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-semibold bg-[#F0FDF4] text-[#15803D]">
                  {{ product.total_stock ?? 0 }} шт
                </span>
              </div>
              <div class="space-y-2">
                <div
                    v-for="stock in product.stocks"
                    :key="stock.warehouse_id"
                    class="flex items-center justify-between gap-3 py-2 px-3 bg-[#FAFAF8] border border-[#F0EEE9] rounded-lg"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] font-medium text-[#1A1A1A] truncate">
                      {{ stock.warehouse_title || 'Склад #' + stock.warehouse_id }}
                    </p>
                    <p v-if="stock.reserved_quantity > 0" class="text-[10px] text-[#F59E0B] mt-0.5">
                      В резерве: {{ stock.reserved_quantity }}
                    </p>
                  </div>
                  <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold flex-shrink-0"
                      :class="getStockBadgeClass(stock.available_quantity)"
                  >
                    {{ stock.available_quantity }}
                  </span>
                </div>
              </div>
            </section>

            <!-- Группа товаров -->
            <section class="bg-white border border-[#E8E6E0] rounded-xl p-5">
              <div class="flex items-start justify-between mb-3 gap-3">
                <div class="min-w-0">
                  <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Группа товаров</h2>
                  <p class="text-[11px] text-[#888] mt-0.5">Карточки одной группы переключаются на витрине</p>
                </div>
              </div>

              <p v-if="!groupMembers.length" class="text-[11px] text-[#888] py-2">
                Товар не состоит в группе.
              </p>

              <div v-else class="space-y-1.5">
                <div
                    v-for="member in groupMembers"
                    :key="member.id"
                    class="flex items-center gap-2.5 p-2 border rounded-lg transition-colors"
                    :class="member.id === productId
                      ? 'border-[#1A1A1A] bg-[#FAFAF8]'
                      : 'border-[#E8E6E0] hover:border-[#C0BEB8] cursor-pointer'"
                    @click="member.id !== productId && attemptSwitch(member)"
                >
                  <img
                      v-if="member.images && member.images.length"
                      :src="member.images[0].url"
                      :alt="member.title || ''"
                      class="w-9 h-9 object-cover rounded-md flex-shrink-0"
                  />
                  <div v-else class="w-9 h-9 bg-[#E8E6E0] rounded-md flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-medium text-[#1A1A1A] truncate">
                      {{ member.external_title || member.title || 'Товар #' + member.id }}
                    </p>
                    <p v-if="member.id === productId" class="text-[9px] uppercase tracking-wider text-[#15803D] font-semibold mt-0.5">
                      Текущий
                    </p>
                  </div>
                  <button
                      @click.stop.prevent="onDetach(member.id)"
                      :disabled="groupSaving"
                      class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      type="button"
                      title="Открепить"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <button
                  @click.prevent="showMergeModal = true"
                  class="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium text-[#555] hover:text-[#1A1A1A] border border-[#E8E6E0] rounded-lg hover:border-[#C0BEB8] transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Объединить с товаром
              </button>
            </section>

          </div>
        </div>

      </div>
    </div>

    <!-- Image Preview Modal -->
    <Transition name="modal">
      <div v-if="previewImage" @click="previewImage = null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div @click.stop class="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl">
          <button @click="previewImage = null" class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img :src="previewImage" class="max-w-full max-h-[90vh] object-contain" />
        </div>
      </div>
    </Transition>

    <!-- Copy Modal -->
    <ProductCopyModal
        v-model="showCopyModal"
        :products="products"
        :current-product-id="productId"
        @copy="handleCopyData"
    />

    <!-- Merge Modal -->
    <ProductGroupMergeModal
        ref="mergeModalRef"
        v-model="showMergeModal"
        :current-product-id="productId"
        :excluded-ids="groupMembers.map(m => m.id)"
        :saving="groupSaving"
        @merge="onMerge"
    />

    <!-- Switch confirmation modal -->
    <Transition name="modal">
      <div
          v-if="pendingSwitch"
          @click.self="cancelSwitch"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div @click.stop class="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
          <div class="p-6 space-y-3">
            <h3 class="text-[14px] font-semibold text-[#1A1A1A]">Несохранённые изменения</h3>
            <p class="text-[12px] text-[#555]">
              В этой карточке есть изменения. Сохранить их перед переходом на «{{ pendingSwitch.external_title || pendingSwitch.title || 'товар #' + pendingSwitch.id }}»?
            </p>
          </div>
          <div class="flex items-center justify-end gap-2 p-4 border-t border-[#E8E6E0] bg-[#FAFAF8] rounded-b-xl">
            <button
                @click="cancelSwitch"
                class="px-3 py-2 text-[12px] font-medium text-[#555] hover:text-[#1A1A1A] transition-colors"
            >
              Отмена
            </button>
            <button
                @click="switchWithoutSave"
                :disabled="saving"
                class="px-3 py-2 text-[12px] font-medium text-[#555] hover:text-[#1A1A1A] border border-[#E8E6E0] rounded-lg transition-colors disabled:opacity-50"
            >
              Без сохранения
            </button>
            <button
                @click="saveAndSwitch"
                :disabled="saving"
                class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-white bg-[#1A1A1A] hover:bg-[#333] rounded-lg transition-colors disabled:opacity-50"
            >
              <svg v-if="saving" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Сохранить и перейти
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import type { Product, Category, ProductImage } from '~/types/product'
import { useProductParams } from '~/composables/useProductParams'
import { useToast } from '~/composables/useToast'
import { optionColorName, optionColorCss } from '~/types/param'
import SearchableSelect from '~/components/admin/SearchableSelect.vue'
import MultiSelect from '~/components/admin/MultiSelect.vue'
import SeoFields from '~/components/admin/SeoFields.vue'
import ImageManager from '~/components/admin/ImageManager.vue'
import ProductBarcodesCreate from '~/components/admin/ProductBarcodesCreate.vue'
import ProductCopyModal from '~/components/admin/ProductCopyModal.vue'
import ProductGroupMergeModal from '~/components/admin/ProductGroupMergeModal.vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useProductGroupStore } from '~/stores/admin/product-group'

definePageMeta({
  layout: 'admin',
  fullBleed: true,
  key: (route) => route.fullPath,
})

const route = useRoute()
const router = useRouter()
const { $api } = useApi()
const toast = useToast()
const {
  PARAM_TYPE,
  resolvedParams,
  paramValues,
  paramsLoading,
  loadParams,
  appendParamsToFormData,
  resetParamValues,
  pv,
} = useProductParams()

// ── Color helpers ─────────────────────────────────────────────────────────────
const colorName = optionColorName
const colorCss  = optionColorCss

const productId = Number(route.params.id)

// ── Init data ─────────────────────────────────────────────────────────────────
const { data: initData } = await useAsyncData(`product-edit-${productId}`, () =>
    $api<{ product: Product; categories: Category[]; brands: any[]; brandOrigins: any[]; manufacturingCountries: any[]; products: Product[]; groupMembers: Product[] }>(
        `/admin/products/${productId}/edit`
    )
)
if (!initData.value) throw createError({ statusCode: 404 })

const product                = initData.value.product
const categories             = computed(() => initData.value?.categories             ?? [])
const brands                 = computed(() => initData.value?.brands                 ?? [])
const brandOrigins           = computed(() => initData.value?.brandOrigins           ?? [])
const manufacturingCountries = computed(() => initData.value?.manufacturingCountries ?? [])
const products               = computed(() => initData.value?.products               ?? [])

// Load size tables
const { data: sizeTablesData } = await useAsyncData('size-tables-list', () =>
  $api('/admin/size-tables/list')
)
const sizeTables = computed(() => sizeTablesData.value ?? [])

// ── Options for selects ───────────────────────────────────────────────────────
const categoryOptions = computed(() =>
    categories.value.map(c => ({ value: c.id, label: c.title }))
)
const brandOptions = computed(() =>
    brands.value.map(b => ({ value: b.id, label: b.name }))
)
const brandOriginOptions = computed(() => [
    { value: null, label: 'Не выбрано' },
    ...brandOrigins.value.map(o => ({ value: o.id, label: o.name }))
])
const manufacturingCountryOptions = computed(() => [
    { value: null, label: 'Не выбрано' },
    ...manufacturingCountries.value.map(c => ({ value: c.id, label: c.name }))
])

const sizeTableOptions = computed(() => [
    { value: null, label: 'Не выбрано' },
    ...sizeTables.value.map(t => ({ value: t.id, label: t.name }))
])

const parentProductOptions = computed(() => [
    { value: null, label: 'Не выбрано' },
    ...products.value
        .filter(p => !p.parent_id && p.id !== product.id)
        .map(p => ({ value: p.id, label: p.external_title || p.title || 'Товар #' + p.id }))
])

// ── Form ──────────────────────────────────────────────────────────────────────
const form = reactive({
  title:            product.title            ?? '',
  external_title:   product.external_title   ?? '',
  article:          product.article          ?? '',
  description:      product.description      ?? '',
  price:            product.price,
  old_price:        product.old_price,
  weight:           product.weight,
  width:            product.width,
  height:           product.height,
  length:           product.length,
  meta_title:       product.meta_title       ?? '',
  meta_description: product.meta_description ?? '',
  meta_keywords:    product.meta_keywords    ?? '',
  is_active:        product.is_active,
  category_id:      product.category_id,
  parent_id:                product.parent_id,
  brand_id:                 product.brand_id,
  brand_origin_id:          product.brand_origin_id,
  manufacturing_country_id: product.manufacturing_country_id,
  size_table_id:            product.size_table_id,
  copy_image_ids:           [] as number[],
})

const errors = ref<string[]>([])
const saving = ref(false)

// ── Product Group ─────────────────────────────────────────────────────────────
const productGroupStore = useProductGroupStore()
const groupMembers = ref<Product[]>(initData.value.groupMembers ?? [])
const groupSaving = computed(() => productGroupStore.saving)
const showMergeModal = ref(false)
const mergeModalRef = ref<InstanceType<typeof ProductGroupMergeModal> | null>(null)
const pendingSwitch = ref<Product | null>(null)

async function onMerge(otherProductId: number) {
  try {
    const members = await productGroupStore.merge([productId, otherProductId])
    groupMembers.value = members
    showMergeModal.value = false
    toast.show()
  } catch (e: any) {
    const msg = e?.data?.errors
        ? Object.values(e.data.errors).flat().join(' ')
        : 'Не удалось объединить товары'
    mergeModalRef.value?.showError(String(msg))
  }
}

async function onDetach(memberId: number) {
  const groupId = groupMembers.value[0]?.product_group_id
  if (!groupId) return
  try {
    const members = await productGroupStore.detach(groupId, memberId)
    groupMembers.value = memberId === productId ? [] : members
    toast.show()
  } catch (e: any) {
    const msg = e?.data?.errors
        ? Object.values(e.data.errors).flat().join(' ')
        : 'Не удалось открепить товар'
    errors.value = [String(msg)]
  }
}

// ── Dirty tracking ────────────────────────────────────────────────────────────
const dirty = ref(false)
const dirtyReady = ref(false)
function markDirty() { if (dirtyReady.value) dirty.value = true }
function snapshotDirty() { dirty.value = false }
function isDirty(): boolean { return dirty.value }

// ── Switching between group members ──────────────────────────────────────────
function attemptSwitch(member: Product) {
  if (isDirty()) {
    pendingSwitch.value = member
  } else {
    router.push(`/admin/products/${member.id}/edit`)
  }
}

function cancelSwitch() {
  pendingSwitch.value = null
}

function switchWithoutSave() {
  const target = pendingSwitch.value
  pendingSwitch.value = null
  dirty.value = false
  if (target) router.push(`/admin/products/${target.id}/edit`)
}

async function saveAndSwitch() {
  const target = pendingSwitch.value
  if (!target) return
  await submit()
  if (errors.value.length === 0) {
    pendingSwitch.value = null
    router.push(`/admin/products/${target.id}/edit`)
  }
}

// Guard general navigation away (sidebar, "Назад" link, etc.)
onBeforeRouteLeave((to, from, next) => {
  if (pendingSwitch.value) { next(); return }
  if (!isDirty()) { next(); return }
  const ok = window.confirm('У вас есть несохранённые изменения. Покинуть страницу?')
  next(ok)
})

// ── Bought Together Products ──────────────────────────────────────────────────
const boughtTogetherIds = ref<number[]>(
    product.bought_together_products?.map(p => p.id) ?? []
)

const availableProductsOptions = computed(() =>
    products.value
        .filter(p => !p.parent_id && p.id !== product.id)
        .map(p => ({
          value: p.id,
          label: p.external_title || p.title || 'Товар #' + p.id
        }))
)

const selectedBoughtTogetherProducts = computed(() =>
    products.value.filter(p => boughtTogetherIds.value.includes(p.id))
)

// ── SEO data ──────────────────────────────────────────────────────────────────
const seoData = computed({
  get: () => ({
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    meta_keywords: form.meta_keywords,
  }),
  set: (val) => {
    form.meta_title = val.meta_title
    form.meta_description = val.meta_description
    form.meta_keywords = val.meta_keywords
  }
})

// ── Category change handler ───────────────────────────────────────────────────
function onCategoryChange(categoryId: number | string | null) {
  if (categoryId && typeof categoryId === 'number' && categoryId !== form.category_id) {
    loadParams(categoryId, productId)
  }
}

// ── Load params with existing values ─────────────────────────────────────────
if (form.category_id) {
  await loadParams(form.category_id, productId)
}

// ── Images state ──────────────────────────────────────────────────────────────
const sortedImages      = ref<ProductImage[]>([...(product.images ?? [])])
const markedForDeletion = ref(new Set<number>())
const previewImage      = ref<string | null>(null)

function mark(id: number)   { markedForDeletion.value = new Set([...markedForDeletion.value, id]) }
function unmark(id: number) { const s = new Set(markedForDeletion.value); s.delete(id); markedForDeletion.value = s }

// ── Upload new files ──────────────────────────────────────────────────────────
const pendingFiles       = ref<File[]>([])
const pendingPreviews    = ref<string[]>([])
const copiedImagePreviews = ref<string[]>([]) // Превью скопированных изображений

// ── Dirty watchers ─────────────────────────────────────────────────────────────
watch(form, markDirty, { deep: true })
watch(boughtTogetherIds, markDirty, { deep: true })
watch(pendingFiles, markDirty, { deep: true })
watch(markedForDeletion, markDirty, { deep: true })
watch(copiedImagePreviews, markDirty, { deep: true })
watch(sortedImages, markDirty, { deep: true })
watch(resolvedParams, markDirty, { deep: true })
watch(paramValues, markDirty, { deep: true })

onMounted(() => { nextTick(() => { dirtyReady.value = true }) })

// ── Copy Modal ────────────────────────────────────────────────────────────────
const showCopyModal = ref(false)

function addFiles(files: File[]) {
  files.forEach(file => {
    pendingFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = ev => pendingPreviews.value.push(ev.target!.result as string)
    reader.readAsDataURL(file)
  })
}

function removePending(idx: number) {
  pendingFiles.value.splice(idx, 1)
  pendingPreviews.value.splice(idx, 1)
}

// ── Combined images for ImageManager ──────────────────────────────────────────
const allImages = computed(() => {
  const existing = sortedImages.value.map(img => ({ ...img, url: img.url }))
  const pending = pendingPreviews.value.map((preview, i) => ({
    id: undefined,
    preview,
    url: preview
  }))
  const copied = copiedImagePreviews.value.map((url, i) => ({
    id: undefined,
    preview: url,
    url: url,
    isCopied: true // Маркер для скопированных изображений
  }))
  return [...existing, ...pending, ...copied]
})

// ── Reorder handler ───────────────────────────────────────────────────────────
function onImagesReorder(newImages: any[]) {
  // Separate existing, new, and copied images
  const existingImages: ProductImage[] = []
  const newPendingPreviews: string[] = []
  const newPendingFiles: File[] = []
  const newCopiedPreviews: string[] = []

  newImages.forEach(img => {
    if (img.id !== undefined) {
      // Existing image
      const original = sortedImages.value.find(si => si.id === img.id)
      if (original) existingImages.push(original)
    } else if (img.isCopied) {
      // Copied image
      const oldIndex = copiedImagePreviews.value.indexOf(img.url)
      if (oldIndex >= 0) {
        newCopiedPreviews.push(copiedImagePreviews.value[oldIndex])
      }
    } else {
      // New pending image
      const oldIndex = pendingPreviews.value.indexOf(img.preview)
      if (oldIndex >= 0) {
        newPendingPreviews.push(pendingPreviews.value[oldIndex])
        newPendingFiles.push(pendingFiles.value[oldIndex])
      }
    }
  })

  sortedImages.value = existingImages
  pendingPreviews.value = newPendingPreviews
  pendingFiles.value = newPendingFiles
  copiedImagePreviews.value = newCopiedPreviews
}

// ── Copy Data Handler ─────────────────────────────────────────────────────────
async function handleCopyData(sourceProduct: Product, options: Record<string, boolean>) {
  try {
    // Загружаем полные данные товара с параметрами
    const fullProduct = await $api<{ product: Product }>(`/admin/products/${sourceProduct.id}/edit`)
    const product = fullProduct.product

    // Копируем описание
    if (options.description && product.description) {
      form.description = product.description
      // Копируем также размеры и вес вместе с описанием
      if (product.weight !== null) form.weight = product.weight
      if (product.width !== null) form.width = product.width
      if (product.height !== null) form.height = product.height
      if (product.length !== null) form.length = product.length
    }

    // Копируем SEO поля
    if (options.seo) {
      if (product.meta_title) form.meta_title = product.meta_title
      if (product.meta_description) form.meta_description = product.meta_description
      if (product.meta_keywords) form.meta_keywords = product.meta_keywords
    }

    // Копируем категорию
    if (options.category && product.category_id) {
      form.category_id = product.category_id
      // Загружаем параметры для новой категории
      await loadParams(product.category_id, productId)
    }

    // Копируем бренд и происхождение
    if (options.brand) {
      if (product.brand_id) form.brand_id = product.brand_id
      if (product.brand_origin_id) form.brand_origin_id = product.brand_origin_id
      if (product.manufacturing_country_id) form.manufacturing_country_id = product.manufacturing_country_id
    }

    // Копируем "С этим покупают"
    if (options.bought_together && product.bought_together_products) {
      boughtTogetherIds.value = product.bought_together_products.map(p => p.id)
    }

    // Копируем изображения - сохраняем ID для отправки на сервер
    if (options.images && product.images && product.images.length > 0) {
      form.copy_image_ids = product.images.map(img => img.id)
      // Добавляем превью для отображения в интерфейсе
      copiedImagePreviews.value = product.images.map(img => img.url)
    }

    // Копируем параметры (если категория та же или загрузили параметры)
    if (options.params && resolvedParams.value.length > 0 && product.raw_params) {
      // Параметры уже загружены через loadParams
      // Копируем значения из исходного товара
      resolvedParams.value.forEach(param => {
        const sourceParam = product.raw_params?.find((p: any) => p.param_id === param.id)

        if (sourceParam) {
          const val = pv(param.id)
          if (sourceParam.value !== undefined && sourceParam.value !== null) val.value = sourceParam.value
          if (sourceParam.option_id !== undefined && sourceParam.option_id !== null) val.option_id = sourceParam.option_id
          if (sourceParam.option_ids !== undefined && sourceParam.option_ids.length > 0) val.option_ids = [...sourceParam.option_ids]
        }
      })
    }

    showCopySuccessMessage(options, product)
    toast.show()
  } catch (e) {
    console.error('Error copying product data:', e)
    errors.value = ['Ошибка при копировании данных товара']
  }
}

// Показываем уведомление с деталями копирования
function showCopySuccessMessage(options: Record<string, boolean>, product: Product) {
  const copiedItems: string[] = []
  if (options.description) copiedItems.push('описание и габариты')
  if (options.seo) copiedItems.push('SEO поля')
  if (options.category) copiedItems.push('категорию')
  if (options.brand) copiedItems.push('бренд')
  if (options.images && product.images?.length) copiedItems.push(`${product.images.length} изображений`)
  if (options.params) copiedItems.push('характеристики')
  if (options.bought_together) copiedItems.push('связанные товары')

  console.log('✅ Скопировано:', copiedItems.join(', '))
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function submit() {
  errors.value = []
  if (!form.title.trim())     errors.value.push('Укажите заголовок')
  if (!form.category_id)      errors.value.push('Выберите категорию')
  if (errors.value.length) return

  saving.value = true
  try {
    // 1. Удаляем отмеченные изображения
    if (markedForDeletion.value.size) {
      await Promise.all(
          [...markedForDeletion.value].map(id =>
              $api(`/admin/images/${id}`, { method: 'DELETE' })
          )
      )
      sortedImages.value = sortedImages.value.filter(img => !markedForDeletion.value.has(img.id))
      markedForDeletion.value = new Set()
    }

    // 2. FormData
    const fd = new FormData()
    fd.append('_method', 'PATCH')

    // Отправляем все поля формы
    fd.append('title', form.title || '')
    fd.append('external_title', form.external_title || '')
    fd.append('article', form.article || '')
    fd.append('description', form.description || '')
    fd.append('is_active', form.is_active ? '1' : '0')

    if (form.price !== null) fd.append('price', String(form.price))
    if (form.old_price !== null) fd.append('old_price', String(form.old_price))
    if (form.weight !== null) fd.append('weight', String(form.weight))
    if (form.width !== null) fd.append('width', String(form.width))
    if (form.height !== null) fd.append('height', String(form.height))
    if (form.length !== null) fd.append('length', String(form.length))
    if (form.category_id !== null) fd.append('category_id', String(form.category_id))
    if (form.parent_id !== null) fd.append('parent_id', String(form.parent_id))
    if (form.brand_id !== null) fd.append('brand_id', String(form.brand_id))
    if (form.brand_origin_id !== null) fd.append('brand_origin_id', String(form.brand_origin_id))
    if (form.manufacturing_country_id !== null) fd.append('manufacturing_country_id', String(form.manufacturing_country_id))
    if (form.size_table_id !== null) fd.append('size_table_id', String(form.size_table_id))

    fd.append('meta_title', form.meta_title || '')
    fd.append('meta_description', form.meta_description || '')
    fd.append('meta_keywords', form.meta_keywords || '')

    // 3. Порядок изображений: image_order[{id}] = position
    sortedImages.value.forEach((img, idx) => {
      fd.append(`image_order[${img.id}]`, String(idx))
    })

    // 4. Новые изображения
    pendingFiles.value.forEach(f => fd.append('images[]', f))

    // 5. Параметры
    appendParamsToFormData(fd)

    // 6. Bought Together Products
    boughtTogetherIds.value.forEach((id, index) => {
      fd.append(`bought_together_ids[${index}]`, String(id))
    })

    // 7. Copy Image IDs
    if (form.copy_image_ids && form.copy_image_ids.length > 0) {
      form.copy_image_ids.forEach((id, index) => {
        fd.append(`copy_image_ids[${index}]`, String(id))
      })
      // Очищаем после отправки
      form.copy_image_ids = []
    }

    const updated = await $api<{ data: Product }>(`/admin/products/${productId}`, {
      method:  'POST',
      body:    fd,
      headers: { Accept: 'application/json' },
    })

    // Обновляем изображения и остатки. Глушим markDirty на время,
    // чтобы watcher'ы не пометили карточку как изменённую обратно.
    dirtyReady.value = false

    await nextTick()
    sortedImages.value = updated.data.images ? [...updated.data.images] : []
    pendingFiles.value    = []
    pendingPreviews.value = []
    copiedImagePreviews.value = [] // Очищаем скопированные превью

    // Обновляем информацию о товаре (включая остатки)
    if (updated.data.stocks) {
      product.stocks = updated.data.stocks
      product.total_stock = updated.data.total_stock
    }

    // Ждём два tick'а, чтобы все deep watcher'ы отработали на наших присвоениях
    await nextTick()
    await nextTick()
    snapshotDirty()
    dirtyReady.value = true
    toast.show()
  } catch (e: unknown) {
    const err = e as { data?: { errors?: Record<string, string[]> } }
    if (err?.data?.errors) {
      errors.value = Object.values(err.data.errors).flat()
    } else {
      errors.value = ['Произошла ошибка. Попробуйте снова.']
    }
  } finally {
    saving.value = false
  }
}

function getStockBadgeClass(quantity: number): string {
  if (quantity === 0) {
    return 'bg-[#FEF2F2] text-[#991B1B]'
  } else if (quantity < 5) {
    return 'bg-[#FEF3C7] text-[#92400E]'
  } else {
    return 'bg-[#F0FDF4] text-[#15803D]'
  }
}
</script>

<style scoped>
.field-label { @apply block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#555]; }
.field-input { @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#6B6B6B] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors; }
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.95); }
</style>