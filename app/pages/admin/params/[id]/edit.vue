<template>
  <div class="max-w-2xl mx-auto space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Атрибут</h1>
        <p class="text-[12px] text-[#ABABAB] mt-0.5 font-mono">{{ paramData?.slug }}</p>
      </div>
      <button @click="router.back()" class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Назад
      </button>
    </div>

    <AdminAppToast :show="toastShow" :progress="toastProgress" :title="toastTitle" :subtitle="toastSubtitle" @close="toastShow = false" />

    <!-- ① Основное -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-4">
      <p class="text-[11px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]">Основное</p>

      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Название <span class="text-red-400">*</span></label>
        <input v-model="form.title" @input="onTitleInput" type="text" placeholder="Название атрибута"
               class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors" />
      </div>

      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Слаг</label>
        <div class="relative flex items-center">
          <input v-model="form.slug" @input="onSlugInput" type="text" placeholder="slug"
                 class="w-full px-3.5 py-2.5 pr-10 rounded-lg border text-[13px] font-mono text-[#1A1A1A] placeholder-[#C0BEB8] outline-none transition-colors"
                 :class="slugError ? 'border-red-400 bg-red-50' : slugManual ? 'border-[#1A1A1A] bg-white' : 'border-[#E8E6E0] bg-[#FAFAF8] focus:border-[#1A1A1A] focus:bg-white'" />
          <button type="button" @click="toggleSlugLock"
                  class="absolute right-2.5 transition-colors"
                  :class="slugManual ? 'text-[#1A1A1A]' : 'text-[#C0BEB8] hover:text-[#1A1A1A]'"
                  :title="slugManual ? 'Вернуть автогенерацию' : 'Редактировать вручную'">
            <svg v-if="!slugManual" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
          </button>
        </div>
        <p v-if="slugError" class="text-[11px] text-red-400">{{ slugError }}</p>
        <p v-else class="text-[11px] text-[#C0BEB8]">
          /catalog?<span class="text-[#888]">{{ form.slug || '…' }}</span>=value
          <span v-if="slugChecking" class="ml-1.5 text-[#ABABAB]">· проверка…</span>
          <span v-else-if="!slugManual" class="ml-1.5 text-[#ABABAB]">· автогенерация</span>
        </p>
      </div>

      <!-- Type -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Тип данных <span class="text-red-400">*</span></label>
        <div class="relative" ref="dropdownRef">
          <button type="button" @click="dropdownOpen = !dropdownOpen"
                  class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-left outline-none hover:border-[#C0BEB8] transition-colors"
                  :class="dropdownOpen ? 'border-[#1A1A1A] bg-white' : ''">
            <span v-if="selectedType" class="flex items-center gap-2">
              <TypeIcon :value="selectedType.value" class="w-3.5 h-3.5 shrink-0 text-[#555]" />
              <span class="text-[#1A1A1A]">{{ selectedType.title }}</span>
            </span>
            <span v-else class="text-[#C0BEB8]">Выберите тип</span>
            <svg class="w-3.5 h-3.5 shrink-0 text-[#ABABAB] transition-transform" :class="dropdownOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#E8E6E0] rounded-lg shadow-lg z-20 overflow-hidden">
              <button v-for="type in filterTypes" :key="type.value" type="button" @click="selectType(type)"
                      class="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors flex items-center gap-2.5"
                      :class="form.filter_type === type.value ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A] hover:bg-[#FAFAF8]'">
                <TypeIcon :value="type.value" class="w-3.5 h-3.5 shrink-0" :class="form.filter_type === type.value ? 'text-white' : 'text-[#888]'" />
                <span class="flex-1">{{ type.title }}</span>
                <svg v-if="form.filter_type === type.value" class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Unit — доступна для любого типа -->
      <div v-if="form.filter_type !== null" class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Единица измерения</label>
        <div class="flex items-center gap-2">
          <input v-model="form.unit" type="text" placeholder="г, кг, см…"
                 class="w-36 px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors" />
          <div class="flex flex-wrap gap-1.5">
            <button v-for="u in UNIT_PRESETS" :key="u" type="button" @click="form.unit = u"
                    class="px-2 py-1 rounded text-[11px] font-medium border transition-colors"
                    :class="form.unit === u ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white border-[#E8E6E0] text-[#888] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'">{{ u }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ② Настройки -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-4">
      <p class="text-[11px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]">Использование</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label v-for="s in SETTINGS" :key="s.key"
               class="flex items-start gap-3 p-3 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] cursor-pointer select-none"
               @click="(form as any)[s.key] = !(form as any)[s.key]">
          <div class="relative mt-0.5 shrink-0">
            <div class="w-9 h-5 rounded-full transition-colors duration-200"
                 :class="(form as any)[s.key] ? 'bg-[#1A1A1A]' : 'bg-[#D1CEC9]'"></div>
            <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                 :class="(form as any)[s.key] ? 'translate-x-4' : 'translate-x-0'"></div>
          </div>
          <div>
            <p class="text-[12px] font-medium text-[#1A1A1A]">{{ s.label }}</p>
            <p class="text-[11px] text-[#ABABAB] mt-0.5">{{ s.desc }}</p>
          </div>
        </label>
      </div>
      <div class="flex items-center gap-3 pt-1">
        <label class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] shrink-0">Порядок</label>
        <input v-model.number="form.sort" type="number" min="0"
               class="w-20 px-3 py-2 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-center text-[#1A1A1A] outline-none focus:border-[#1A1A1A] transition-colors" />
        <p class="text-[11px] text-[#ABABAB]">Меньше = выше в списке</p>
      </div>
    </div>

    <!-- ③ Варианты (MULTISELECT) -->
    <Transition name="slide">
      <div v-if="isListType" class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]">Варианты <span class="text-red-400">*</span></p>
          <span class="text-[11px] text-[#ABABAB]">{{ form.options.length }} шт.</span>
        </div>
        <div class="space-y-1.5">
          <div v-for="(opt, idx) in form.options" :key="idx"
               class="flex items-center gap-2 rounded-lg transition-colors"
               :class="dragOverIdx === idx && dragIdx !== idx ? 'ring-1 ring-[#1A1A1A] ring-offset-1' : ''"
               draggable="true"
               @dragstart="onDragStart(idx)"
               @dragover="onDragOver(idx, $event)"
               @dragend="onDragEnd"
               @drop="onDropOptions(idx)">
            <div class="cursor-grab active:cursor-grabbing text-[#D1CEC9] hover:text-[#888] shrink-0 transition-colors" title="Перетащить">
              <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3.5" r="1.3"/><circle cx="11" cy="3.5" r="1.3"/>
                <circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/>
                <circle cx="5" cy="12.5" r="1.3"/><circle cx="11" cy="12.5" r="1.3"/>
              </svg>
            </div>
            <input v-model="opt.value" @input="onOptionValueInput(opt)" type="text" :placeholder="`Вариант ${idx + 1}`"
                   class="flex-1 px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors" />
            <input v-model="opt.slug" @input="opt.slugManual = true" type="text" placeholder="slug"
                   class="w-28 px-3 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[12px] font-mono text-[#888] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors" />
            <button v-if="form.options.length > 1" type="button" @click="form.options.splice(idx, 1)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
        <button type="button" @click="form.options.push({ value: '', slug: '', slugManual: false })"
                class="inline-flex items-center gap-1.5 text-[12px] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Добавить вариант
        </button>
      </div>
    </Transition>

    <!-- ④ Цвета -->
    <Transition name="slide">
      <div v-if="isColorType" class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]">Цвета <span class="text-red-400">*</span></p>
          <span class="text-[11px] text-[#ABABAB]">{{ form.colorOptions.length }} шт.</span>
        </div>

        <div v-for="(opt, idx) in form.colorOptions" :key="idx"
             class="rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] p-3 space-y-3 transition-colors"
             :class="dragColorOverIdx === idx && dragColorIdx !== idx ? 'ring-1 ring-[#1A1A1A] ring-offset-1' : ''"
             draggable="true"
             @dragstart="onColorDragStart(idx)"
             @dragover="onColorDragOver(idx, $event)"
             @dragend="onColorDragEnd"
             @drop="onDropColors(idx)">
          <div class="flex items-center gap-2.5">
            <div class="cursor-grab active:cursor-grabbing text-[#D1CEC9] hover:text-[#888] shrink-0 transition-colors" title="Перетащить">
              <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3.5" r="1.3"/><circle cx="11" cy="3.5" r="1.3"/>
                <circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/>
                <circle cx="5" cy="12.5" r="1.3"/><circle cx="11" cy="12.5" r="1.3"/>
              </svg>
            </div>
            <div class="w-9 h-9 rounded-lg shrink-0 border border-[#E8E6E0]" :style="{ background: colorPreview(opt) }"></div>
            <input v-model="opt.name" @input="onColorNameInput(opt)" type="text" placeholder="Название цвета"
                   class="flex-1 px-3 py-2 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors" />
            <input v-model="opt.slug" @input="opt.slugManual = true" type="text" placeholder="slug"
                   class="w-24 px-2.5 py-2 rounded-lg border border-[#E8E6E0] bg-white text-[11px] font-mono text-[#888] outline-none focus:border-[#1A1A1A] transition-colors" />
            <button v-if="form.colorOptions.length > 1" type="button" @click="form.colorOptions.splice(idx, 1)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
            <button v-if="idx === form.colorOptions.length - 1" type="button" @click="form.colorOptions.push(defaultColor())"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          <div class="flex flex-wrap items-start gap-3 pl-0.5">
            <div class="flex rounded-lg border border-[#E8E6E0] overflow-hidden shrink-0">
              <button v-for="ct in COLOR_TYPES" :key="ct.value" type="button" @click="opt.type = ct.value as ColorKind"
                      class="px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-[#E8E6E0] last:border-r-0"
                      :class="opt.type === ct.value ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#888] hover:bg-[#F0EEE9]'">
                {{ ct.label }}
              </button>
            </div>

            <template v-if="opt.type === 'solid'">
              <div class="flex items-center gap-2">
                <label class="text-[11px] text-[#ABABAB]">Цвет</label>
                <input v-model="opt.stops[0].color" type="color" class="w-8 h-8 rounded-lg cursor-pointer border border-[#E8E6E0] p-0.5 bg-white" />
                <span class="text-[11px] font-mono text-[#ABABAB] uppercase">{{ opt.stops[0].color }}</span>
              </div>
            </template>

            <template v-else-if="opt.type === 'dual'">
              <div v-for="(stop, si) in opt.stops.slice(0,2)" :key="si" class="flex items-center gap-2">
                <label class="text-[11px] text-[#ABABAB]">Цвет {{ si + 1 }}</label>
                <input v-model="stop.color" type="color" class="w-8 h-8 rounded-lg cursor-pointer border border-[#E8E6E0] p-0.5 bg-white" />
                <span class="text-[11px] font-mono text-[#ABABAB] uppercase">{{ stop.color }}</span>
              </div>
            </template>

            <template v-else>
              <div class="flex-1 min-w-0 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] text-[#ABABAB]">Стоп-цвета ({{ opt.stops.length }})</span>
                  <button type="button" @click="opt.stops.push({ color: '#A855F7' })"
                          class="inline-flex items-center gap-1 text-[11px] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Добавить
                  </button>
                </div>
                <div class="h-5 rounded-md" :style="{ background: colorPreview(opt) }"></div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(stop, si) in opt.stops" :key="si"
                       class="flex items-center gap-1.5 bg-white rounded-lg border border-[#E8E6E0] px-2 py-1.5">
                    <input v-model="stop.color" type="color" class="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <span class="text-[11px] font-mono text-[#ABABAB] uppercase w-14">{{ stop.color }}</span>
                    <button v-if="opt.stops.length > 2" type="button" @click="opt.stops.splice(si, 1)"
                            class="text-[#D1CEC9] hover:text-red-400 transition-colors">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-[11px] text-[#ABABAB] shrink-0">Угол</label>
                  <input v-model.number="opt.angle" type="number" min="0" max="360"
                         class="w-14 px-2 py-1.5 rounded-lg border border-[#E8E6E0] bg-white text-[12px] text-center outline-none focus:border-[#1A1A1A] transition-colors" />
                  <span class="text-[11px] text-[#ABABAB]">°</span>
                  <div class="flex gap-1">
                    <button v-for="a in [0, 45, 90, 135, 180]" :key="a" type="button" @click="opt.angle = a"
                            class="px-1.5 py-1 rounded text-[10px] border transition-colors"
                            :class="opt.angle === a ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white border-[#E8E6E0] text-[#888] hover:border-[#1A1A1A]'">{{ a }}°</button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <button type="button" @click="form.colorOptions.push(defaultColor())"
                class="inline-flex items-center gap-1.5 text-[12px] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Добавить цвет
        </button>
      </div>
    </Transition>

    <!-- ⑤ Boolean info -->
    <Transition name="slide">
      <div v-if="isBooleanType" class="bg-white border border-[#E8E6E0] rounded-xl p-5 flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-[#F0EEE9] flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/></svg>
        </div>
        <div>
          <p class="text-[13px] font-medium text-[#1A1A1A]">Логический атрибут</p>
          <p class="text-[12px] text-[#888] mt-0.5 leading-relaxed">Вариантов не нужно — покупатель увидит переключатель <strong>Да / Нет</strong>.</p>
        </div>
      </div>
    </Transition>

    <!-- Save -->
    <div class="flex justify-end">
      <button type="button" :disabled="!isFormValid" @click="save"
              class="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors"
              :class="isFormValid ? 'bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer' : 'bg-[#F0EEE9] text-[#C0BEB8] cursor-not-allowed'">
        Сохранить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Param, FilterTypeItem } from '~/types/param'
import { ParamFilterType, slugify, serializeColorValue, parseColorValue, type ColorKind } from '~/types/param'
import { useParamStore } from '~/stores/admin/params'

definePageMeta({ middleware: 'admin', layout: 'admin' })

const route  = useRoute()
const router = useRouter()
const store  = useParamStore()
const id     = Number(route.params.id)

const { data: pageData } = await useAsyncData(`param-edit-${id}`, async () => {
  const { $api } = useApi()
  return $api<{ param: Param; filterTypes: FilterTypeItem[] }>(`/admin/params/${id}/edit`)
})
const filterTypes = computed(() => pageData.value?.filterTypes ?? [])
const paramData   = computed(() => pageData.value?.param)

const UNIT_PRESETS = ['г', 'кг', 'мл', 'л', 'мм', 'см', 'м', 'шт', 'мАч', 'Вт', '°C', 'дюйм']
const COLOR_TYPES  = [{ value: 'solid', label: 'Сплошной' }, { value: 'dual', label: 'Двойной' }, { value: 'gradient', label: 'Градиент' }]
const SETTINGS     = [
  { key: 'is_filterable', label: 'В фильтрах',  desc: 'Боковые фильтры каталога' },
  { key: 'is_searchable', label: 'В поиске',     desc: 'Полнотекстовый поиск'     },
  { key: 'is_comparable', label: 'В сравнении',  desc: 'Сравнение товаров'        },
]

interface ColorStop { color: string }
interface ColorOpt  { id?: number; name: string; slug: string; slugManual: boolean; type: ColorKind; stops: ColorStop[]; angle: number }

function defaultColor(): ColorOpt {
  return { name: '', slug: '', slugManual: false, type: 'solid', stops: [{ color: '#3B82F6' }, { color: '#EF4444' }], angle: 135 }
}

function colorPreview(opt: ColorOpt): string {
  if (opt.type === 'solid') return opt.stops[0]?.color ?? '#ccc'
  if (opt.type === 'dual') {
    const c1 = opt.stops[0]?.color ?? '#ccc', c2 = opt.stops[1]?.color ?? '#ccc'
    return `linear-gradient(90deg, ${c1} 50%, ${c2} 50%)`
  }
  const n = opt.stops.length
  const parts = opt.stops.map((s, i) => `${s.color} ${Math.round(i / (n - 1) * 100)}%`).join(', ')
  return `linear-gradient(${opt.angle}deg, ${parts})`
}

function serializeOpt(opt: ColorOpt): string {
  if (opt.type === 'solid') return serializeColorValue({ name: opt.name.trim(), type: 'solid', color1: opt.stops[0].color })
  if (opt.type === 'dual')  return serializeColorValue({ name: opt.name.trim(), type: 'dual', color1: opt.stops[0].color, color2: opt.stops[1]?.color ?? opt.stops[0].color })
  return serializeColorValue({ name: opt.name.trim(), type: 'gradient', color1: opt.stops[0].color, color2: opt.stops[opt.stops.length - 1].color, angle: opt.angle, stops: opt.stops.map(s => s.color) })
}

function loadColorOptions(param: Param): ColorOpt[] {
  if (!param.options?.length) return [defaultColor()]
  return param.options.map(opt => {
    const cv = parseColorValue(opt.value)
    if (!cv) return defaultColor()
    const stops: ColorStop[] = cv.stops
        ? (cv.stops as string[]).map(c => ({ color: c }))
        : [{ color: cv.color1 }, { color: cv.color2 ?? cv.color1 }]
    return { id: opt.id, name: cv.name, slug: opt.slug ?? '', slugManual: true, type: cv.type, stops, angle: cv.angle ?? 135 }
  })
}

const isInitColor = Number(paramData.value?.filter_type) === ParamFilterType.COLOR
const isInitList  = Number(paramData.value?.filter_type) === ParamFilterType.MULTISELECT

interface ListOpt { id?: number; value: string; slug: string; slugManual: boolean }

const form = reactive({
  title:         paramData.value?.title         ?? '',
  slug:          paramData.value?.slug          ?? '',
  filter_type:   paramData.value?.filter_type   ? Number(paramData.value.filter_type) : null as number | null,
  unit:          paramData.value?.unit          ?? '',
  is_filterable: paramData.value?.is_filterable ?? true,
  is_searchable: paramData.value?.is_searchable ?? false,
  is_comparable: paramData.value?.is_comparable ?? false,
  sort:          paramData.value?.sort          ?? 0,
  options: (isInitList && paramData.value?.options?.length
      ? paramData.value.options.map(o => ({ id: o.id, value: o.value, slug: o.slug ?? '', slugManual: true }))
      : [{ value: '', slug: '', slugManual: false }]) as ListOpt[],
  colorOptions: (isInitColor && paramData.value ? loadColorOptions(paramData.value) : [defaultColor()]) as ColorOpt[],
})

const slugManual    = ref(true)
const slugError     = ref('')
const slugChecking  = ref(false)
const dropdownOpen  = ref(false)
const dropdownRef   = ref<HTMLElement | null>(null)

// ── Slug availability check ───────────────────────────────────────────────────
let slugCheckTimer: ReturnType<typeof setTimeout> | null = null

async function checkSlugAvailability(slug: string) {
  if (!slug) return
  slugChecking.value = true
  slugError.value = ''
  try {
    const { $api } = useApi()
    const res = await $api<{ slug: string; available: boolean }>(
        `/admin/params/check-slug?slug=${encodeURIComponent(slug)}&except_id=${id}`
    )
    if (!res.available) {
      slugError.value = `Слаг «${res.slug}» уже занят`
    } else if (res.slug !== form.slug) {
      form.slug = res.slug
    }
  } catch {
    // игнорируем — сервер всё равно проверит при сохранении
  } finally {
    slugChecking.value = false
  }
}

function scheduleSlugCheck(slug: string) {
  if (slugCheckTimer) clearTimeout(slugCheckTimer)
  slugCheckTimer = setTimeout(() => checkSlugAvailability(slug), 500)
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const toastShow     = ref(false)
const toastProgress = ref(100)
const toastTitle    = ref('')
const toastSubtitle = ref('')
let toastTimer: ReturnType<typeof setInterval> | null = null

function showToast(title: string, subtitle = '') {
  if (toastTimer) clearInterval(toastTimer)
  toastTitle.value    = title
  toastSubtitle.value = subtitle
  toastProgress.value = 100
  toastShow.value     = true
  toastTimer = setInterval(() => {
    toastProgress.value -= 2
    if (toastProgress.value <= 0) { clearInterval(toastTimer!); toastShow.value = false }
  }, 60)
}

// ── Drag & Drop ───────────────────────────────────────────────────────────────
const dragIdx     = ref<number | null>(null)
const dragOverIdx = ref<number | null>(null)

function onDragStart(idx: number)              { dragIdx.value = idx }
function onDragOver(idx: number, e: DragEvent) { e.preventDefault(); dragOverIdx.value = idx }
function onDragEnd()                           { dragIdx.value = null; dragOverIdx.value = null }
function onDropOptions(idx: number) {
  if (dragIdx.value === null || dragIdx.value === idx) { onDragEnd(); return }
  const [item] = form.options.splice(dragIdx.value, 1)
  form.options.splice(idx, 0, item)
  onDragEnd()
}

const dragColorIdx     = ref<number | null>(null)
const dragColorOverIdx = ref<number | null>(null)

function onColorDragStart(idx: number)              { dragColorIdx.value = idx }
function onColorDragOver(idx: number, e: DragEvent) { e.preventDefault(); dragColorOverIdx.value = idx }
function onColorDragEnd()                           { dragColorIdx.value = null; dragColorOverIdx.value = null }
function onDropColors(idx: number) {
  if (dragColorIdx.value === null || dragColorIdx.value === idx) { onColorDragEnd(); return }
  const [item] = form.colorOptions.splice(dragColorIdx.value, 1)
  form.colorOptions.splice(idx, 0, item)
  onColorDragEnd()
}

const selectedType  = computed(() => filterTypes.value.find(t => t.value === form.filter_type) ?? null)
const isListType    = computed(() => form.filter_type === ParamFilterType.MULTISELECT)
const isColorType   = computed(() => form.filter_type === ParamFilterType.COLOR)
const isBooleanType = computed(() => form.filter_type === ParamFilterType.BOOLEAN)

const isFormValid = computed(() => {
  if (!form.title.trim() || form.filter_type === null) return false
  if (slugError.value || slugChecking.value) return false
  if (isListType.value && form.options.some(o => !o.value.trim())) return false
  if (isColorType.value && form.colorOptions.some(o => !o.name.trim())) return false
  return true
})

function onTitleInput() {
  if (!slugManual.value) {
    form.slug = slugify(form.title)
    scheduleSlugCheck(form.slug)
  }
  slugError.value = ''
}

function onSlugInput() {
  if (!form.slug) { slugManual.value = false; form.slug = slugify(form.title) }
  else { slugManual.value = true }
  slugError.value = ''
  scheduleSlugCheck(form.slug)
}

function toggleSlugLock() {
  if (slugManual.value) { slugManual.value = false; form.slug = slugify(form.title) }
  else { slugManual.value = true }
}

function onOptionValueInput(opt: ListOpt) {
  if (!opt.slugManual) opt.slug = slugify(opt.value)
  if (!opt.value && !opt.slugManual) opt.slug = ''
}

function onColorNameInput(opt: ColorOpt) {
  if (!opt.slugManual) opt.slug = slugify(opt.name)
  if (!opt.name && !opt.slugManual) opt.slug = ''
}

onMounted(() => document.addEventListener('click', handleOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleOutside))
function handleOutside(e: MouseEvent) {
  if (!dropdownRef.value?.contains(e.target as Node)) dropdownOpen.value = false
}

function selectType(type: FilterTypeItem) {
  form.filter_type = type.value
  dropdownOpen.value = false
}

async function save() {
  if (!isFormValid.value || form.filter_type === null) return
  const options = isListType.value
      ? form.options.filter(o => o.value.trim()).map(o => ({ ...(o.id ? { id: o.id } : {}), value: o.value.trim(), slug: o.slug || slugify(o.value) }))
      : isColorType.value
          ? form.colorOptions.map(o => ({ ...(o.id ? { id: o.id } : {}), value: serializeOpt(o), slug: o.slug || slugify(o.name) }))
          : []
  try {
    await store.update(id, {
      title: form.title.trim(), slug: form.slug || slugify(form.title),
      filter_type: form.filter_type, unit: form.unit || null,
      is_filterable: form.is_filterable, is_searchable: form.is_searchable, is_comparable: form.is_comparable,
      sort: form.sort, options,
    })
  } catch (err: any) {
    const errors = err?.data?.errors ?? err?.response?.data?.errors ?? null
    if (errors) {
      if (errors.slug)  slugError.value = Array.isArray(errors.slug) ? errors.slug[0] : errors.slug
      if (errors.title) showToast('Ошибка', Array.isArray(errors.title) ? errors.title[0] : errors.title)
      if (!errors.slug && !errors.title) showToast('Ошибка сохранения', 'Проверьте заполненные поля')
    } else {
      showToast('Ошибка', 'Не удалось сохранить атрибут')
    }
    return
  }
  showToast('Изменения сохранены', form.title.trim())
}
</script>

<!-- TypeIcon shared component -->
<script lang="ts">
import { defineComponent, h } from 'vue'

export const TypeIcon = defineComponent({
  name: 'TypeIcon',
  props: { value: Number },
  inheritAttrs: false,
  setup(props, { attrs }) {
    const svgAttrs = () => ({
      fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor',
      'stroke-width': '1.75', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      ...attrs,
    })
    const icons: Record<number, () => any> = {
      1: () => h('svg', svgAttrs(), [h('line', { x1: '4', y1: '8', x2: '20', y2: '8' }), h('line', { x1: '4', y1: '14', x2: '14', y2: '14' })]),
      2: () => h('svg', svgAttrs(), [h('line', { x1: '4', y1: '7', x2: '20', y2: '7' }), h('line', { x1: '4', y1: '12', x2: '20', y2: '12' }), h('line', { x1: '4', y1: '17', x2: '14', y2: '17' })]),
      3: () => h('svg', svgAttrs(), [h('line', { x1: '4', y1: '9', x2: '20', y2: '9' }), h('line', { x1: '4', y1: '15', x2: '20', y2: '15' }), h('line', { x1: '10', y1: '4', x2: '8', y2: '20' }), h('line', { x1: '16', y1: '4', x2: '14', y2: '20' })]),
      4: () => h('svg', svgAttrs(), [h('path', { d: 'M4 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0' })]),
      6: () => h('svg', svgAttrs(), [h('circle', { cx: '12', cy: '12', r: '9' }), h('circle', { cx: '8', cy: '11', r: '1.2', fill: 'currentColor', stroke: 'none' }), h('circle', { cx: '12', cy: '8', r: '1.2', fill: 'currentColor', stroke: 'none' }), h('circle', { cx: '16', cy: '11', r: '1.2', fill: 'currentColor', stroke: 'none' })]),
      7: () => h('svg', svgAttrs(), [h('rect', { x: '2', y: '7', width: '20', height: '10', rx: '5' }), h('circle', { cx: '16', cy: '12', r: '3', fill: 'currentColor', stroke: 'none' })]),
      8: () => h('svg', svgAttrs(), [
        h('rect', { x: '3', y: '5', width: '5', height: '5', rx: '1' }), h('polyline', { points: '4.5 7.5 6 9 8.5 6.5' }),
        h('rect', { x: '3', y: '13', width: '5', height: '5', rx: '1' }),
        h('line', { x1: '12', y1: '7.5', x2: '21', y2: '7.5' }), h('line', { x1: '12', y1: '15.5', x2: '21', y2: '15.5' }),
      ]),
    }
    return () => { const fn = icons[props.value!]; return fn ? fn() : h('span') }
  },
})
</script>

<style scoped>
.slide-enter-active,.slide-leave-active{transition:opacity .2s ease,transform .2s ease}
.slide-enter-from,.slide-leave-to{opacity:0;transform:translateY(-8px)}
.dropdown-enter-active{transition:opacity .15s ease,transform .15s ease}
.dropdown-leave-active{transition:opacity .1s ease,transform .1s ease}
.dropdown-enter-from,.dropdown-leave-to{opacity:0;transform:translateY(-4px)}
input[type="color"]::-webkit-color-swatch-wrapper{padding:0}
input[type="color"]::-webkit-color-swatch{border:none;border-radius:4px}
</style>