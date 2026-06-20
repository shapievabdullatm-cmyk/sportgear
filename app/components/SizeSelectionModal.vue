<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">Выберите размер</h3>
            <button class="modal-close" @click="close" aria-label="Закрыть">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="sizes-grid">
              <button
                v-for="size in sizes"
                :key="size.product_id"
                @click="selectSize(size.product_id)"
                class="size-button"
                :class="{
                  active: selectedSize === size.product_id,
                  disabled: size.total_stock === 0,
                  'in-cart': getSizeQuantityInCart(size.product_id) > 0
                }"
                :disabled="size.total_stock === 0"
              >
                {{ size.size }}
                <span v-if="getSizeQuantityInCart(size.product_id) > 0" class="size-badge">
                  {{ getSizeQuantityInCart(size.product_id) }}
                </span>
              </button>
            </div>
          </div>

          <div v-if="mode === 'cart'" class="modal-footer">
            <button
              class="btn-confirm"
              :disabled="!selectedSize"
              @click="confirm"
            >
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ProductSize } from '~/types/product'
import { useCartStore } from '~/stores/cart'

interface Props {
  modelValue: boolean
  sizes: ProductSize[]
  initialSize?: number | null
  mode?: 'cart' | 'wishlist'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', sizeId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'cart'
})
const emit = defineEmits<Emits>()

const cartStore = useCartStore()
const selectedSize = ref<number | null>(props.initialSize || null)

function selectSize(productId: number) {
  selectedSize.value = productId
  if (props.mode === 'wishlist') {
    confirm()
  }
}

function getSizeQuantityInCart(productId: number): number {
  const item = cartStore.items.find(item => item.product_id === productId)
  return item ? item.quantity : 0
}

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  if (selectedSize.value) {
    emit('confirm', selectedSize.value)
    close()
  }
}

// Сбросить выбор при открытии модалки
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedSize.value = props.initialSize || null
  }
})

// Закрытие по Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.modal-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f4f4f4;
  color: #1a1a1a;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.sizes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.size-button {
  position: relative;
  min-width: 56px;
  padding: 10px 16px;
  border: 1.5px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
  white-space: nowrap;
}

.size-button:hover:not(:disabled) {
  border-color: #1a1a1a;
}

.size-button.active {
  border-color: #1a1a1a;
  background: #1a1a1a;
  color: #fff;
}

.size-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  text-decoration: line-through;
}

.size-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #C1121C;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e5e5e5;
}

.btn-confirm {
  width: 100%;
  padding: 14px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  background: #333;
}

.btn-confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.95);
}

/* Mobile */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-container {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }

  .modal-fade-enter-from .modal-container,
  .modal-fade-leave-to .modal-container {
    transform: translateY(100%);
  }
}
</style>