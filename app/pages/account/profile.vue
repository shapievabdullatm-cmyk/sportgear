<script setup lang="ts">
import type { User } from '~/types'

definePageMeta({ middleware: 'auth' })
const auth     = useAuthStore()
const { $api } = useApi()

// ── Edit modal ─────────────────────────────────────────────────────
const showModal = ref(false)
const saving    = ref(false)
const saved     = ref(false)
const saveErr   = ref('')

const form = reactive({
  first_name: '',
  last_name:  '',
  gender:     '',
  birth_date: '',
})

function openEditModal() {
  const u = auth.user
  form.first_name = u?.first_name ?? ''
  form.last_name  = u?.last_name  ?? ''
  form.gender     = u?.gender     ?? ''
  form.birth_date = u?.birth_date ? u.birth_date.slice(0, 10) : ''
  saveErr.value   = ''
  saved.value     = false
  emailStep.value = 'idle'
  newEmail.value  = ''
  emailErr.value  = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  emailStep.value = 'idle'
  newEmail.value  = ''
  emailErr.value  = ''
}

async function saveProfile() {
  saveErr.value = ''
  saving.value  = true
  saved.value   = false
  try {
    const updated = await $api<User>('/profile', {
      method: 'PATCH',
      body: {
        first_name: form.first_name || null,
        last_name:  form.last_name  || null,
        gender:     form.gender     || null,
        birth_date: form.birth_date || null,
      },
    })
    auth.setUser(updated)
    saved.value = true
    setTimeout(() => {
      showModal.value = false
      saved.value     = false
    }, 900)
  } catch (e: any) {
    saveErr.value = e?.data?.message ?? 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

// ── Email ──────────────────────────────────────────────────────────
const emailStep    = ref<'idle' | 'input' | 'sent'>('idle')
const newEmail     = ref('')
const emailLoading = ref(false)
const emailErr     = ref('')
const emailSuccess = ref('')

async function requestEmailChange() {
  emailErr.value     = ''
  emailSuccess.value = ''
  emailLoading.value = true
  try {
    const res = await $api<{ message: string }>('/profile/request-email-change', {
      method: 'POST',
      body: { email: newEmail.value },
    })
    emailSuccess.value = res.message
    emailStep.value    = 'sent'
  } catch (e: any) {
    emailErr.value = e?.data?.errors?.email?.[0]
        ?? e?.data?.message
        ?? 'Ошибка'
  } finally {
    emailLoading.value = false
  }
}


const genderOptions = [
  { value: '',       label: 'Не указан' },
  { value: 'male',   label: 'Мужской'   },
  { value: 'female', label: 'Женский'   },
]

const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  const f = u.first_name?.[0] ?? ''
  const l = u.last_name?.[0]  ?? ''
  return (l + f).toUpperCase() || (u.phone?.slice(1, 3) ?? '?')
})

const fullName = computed(() => {
  const u = auth.user
  if (!u) return ''
  return [u.last_name, u.first_name].filter(Boolean).join(' ')
})
</script>

<template>
  <AccountMobileHeader title="Личный кабинет" :back="false" />

  <div class="account-wrap">
    <AccountSidebar />

    <main class="account-main">

      <!-- User card -->
      <div class="user-card">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ fullName || 'Не указано' }}</div>
          <div class="user-phone">{{ auth.user?.phone }}</div>
          <div v-if="auth.user?.email" class="user-email">{{ auth.user.email }}</div>
        </div>
        <button class="user-edit-btn" title="Редактировать" @click="openEditModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      <!-- Mobile: nav list -->
      <nav class="mobile-nav">
        <button class="nav-row" @click="openEditModal">
          <span class="nav-row-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="nav-row-label">Мои данные</span>
          <svg class="nav-row-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <NuxtLink to="/account/addresses" class="nav-row">
          <span class="nav-row-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </span>
          <span class="nav-row-label">Адреса доставки</span>
          <svg class="nav-row-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </NuxtLink>

        <NuxtLink to="/wishlist" class="nav-row">
          <span class="nav-row-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </span>
          <span class="nav-row-label">Избранное</span>
          <svg class="nav-row-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </NuxtLink>

        <span class="nav-row nav-row--disabled">
          <span class="nav-row-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </span>
          <span class="nav-row-label">Мои заказы</span>
          <svg class="nav-row-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </span>

        <span class="nav-row nav-row--disabled">
          <span class="nav-row-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </span>
          <span class="nav-row-label">Отзывы</span>
          <svg class="nav-row-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </span>

        <div class="nav-logout-wrap">
          <button class="nav-logout-btn" @click="auth.logoutUser">Выйти из аккаунта</button>
        </div>
      </nav>

    </main>
  </div>

  <!-- Edit Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">Редактировать данные</span>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="uf-field">
            <span class="uf-label">Фамилия</span>
            <input v-model="form.last_name" type="text" placeholder="Иванов" class="uf-input" />
          </div>
          <div class="uf-field">
            <span class="uf-label">Имя</span>
            <input v-model="form.first_name" type="text" placeholder="Иван" class="uf-input" />
          </div>
          <div class="uf-field">
            <span class="uf-label">Пол</span>
            <div class="gender-selector">
              <button
                v-for="opt in genderOptions"
                :key="opt.value"
                type="button"
                class="gender-btn"
                :class="{ active: form.gender === opt.value }"
                @click="form.gender = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>
          <div class="uf-field">
            <span class="uf-label">Дата рождения</span>
            <input v-model="form.birth_date" type="date" class="uf-input" />
          </div>
          <p v-if="saveErr" class="form-error">{{ saveErr }}</p>
          <p v-if="saved" class="form-success">✓ Данные сохранены</p>

          <div class="modal-divider" />

          <div class="uf-field" style="margin-bottom: 12px;">
            <span class="uf-label">Email</span>
            <div class="email-display">
              {{ auth.user?.email ?? 'Не указан' }}
              <span v-if="auth.user?.pending_email" class="badge-pending">
                ожидает: {{ auth.user.pending_email }}
              </span>
            </div>
          </div>

          <template v-if="emailStep === 'idle'">
            <button class="text-link" @click="emailStep = 'input'">
              {{ auth.user?.email ? 'Изменить email' : 'Добавить email' }}
            </button>
          </template>

          <template v-else-if="emailStep === 'input'">
            <div class="uf-field" style="margin-top: 16px;">
              <span class="uf-label">Новый email</span>
              <input v-model="newEmail" type="email" placeholder="new@example.com" class="uf-input" @keyup.enter="requestEmailChange" />
            </div>
            <p v-if="emailErr" class="form-error">{{ emailErr }}</p>
            <div class="btn-row">
              <button class="save-btn save-btn--sm" :disabled="emailLoading || !newEmail" @click="requestEmailChange">
                {{ emailLoading ? 'Отправляем...' : 'Отправить письмо' }}
              </button>
              <button class="cancel-btn cancel-btn--sm" @click="emailStep = 'idle'; newEmail = ''; emailErr = ''">Отмена</button>
            </div>
          </template>

          <template v-else-if="emailStep === 'sent'">
            <p class="form-success">✓ {{ emailSuccess }}</p>
            <p class="hint-text">Перейдите по ссылке в письме, чтобы подтвердить новый адрес.</p>
            <button class="text-link" @click="emailStep = 'input'; newEmail = ''">Указать другой адрес</button>
          </template>
        </div>
        <div class="modal-footer">
          <button class="save-btn" :disabled="saving" @click="saveProfile">
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
          <button class="cancel-btn" @click="closeModal">Отмена</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────── */
.account-wrap {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: calc(100vh - 120px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 40px;
}

.account-main { min-width: 0; }

/* ── User card ───────────────────────────────────────────────────── */
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  margin-bottom: 32px;
  background: #fff;
}

.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-phone {
  font-size: 13px;
  color: #999;
}

.user-email {
  font-size: 13px;
  color: #bbb;
  margin-top: 2px;
}

.user-edit-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  background: none;
  cursor: pointer;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.user-edit-btn:hover { border-color: #111; color: #111; background: #f9f9f9; }

/* ── Mobile nav (hidden on desktop) ─────────────────────────────── */
.mobile-nav { display: none; }

/* ── Email / links ───────────────────────────────────────────────── */
.badge-pending {
  font-size: 11px;
  color: #d97706;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 3px 8px;
}

.text-link {
  font-size: 13px;
  color: #999;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
}
.text-link:hover { color: #111; }

.hint-text {
  font-size: 13px;
  color: #999;
  margin-top: 6px;
  margin-bottom: 12px;
}

/* ── Inputs ──────────────────────────────────────────────────────── */
.uf-field { margin-bottom: 28px; }

.uf-label {
  display: block;
  font-size: 11px;
  color: #aaa;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.uf-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ddd;
  padding: 6px 0 10px;
  font-size: 15px;
  font-family: 'Montserrat', sans-serif;
  color: #111;
  background: transparent;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}
.uf-input:focus { border-bottom-color: #111; }
.uf-input::placeholder { color: #ccc; }

.gender-selector {
  display: flex;
  gap: 8px;
  padding: 6px 0 10px;
  border-bottom: 1px solid #ddd;
}

.gender-btn {
  padding: 7px 18px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: transparent;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}
.gender-btn:hover { border-color: #bbb; color: #333; }
.gender-btn.active { background: #111; border-color: #111; color: #fff; }

/* ── Buttons ─────────────────────────────────────────────────────── */
.save-btn {
  padding: 12px 28px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: opacity 0.15s;
}
.save-btn:hover { opacity: 0.8; }
.save-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.cancel-btn {
  padding: 12px 20px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  color: #777;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.cancel-btn:hover { border-color: #aaa; color: #111; }

.btn-row { display: flex; gap: 10px; margin-top: 4px; }

.form-error  { font-size: 12px; color: #d14343; margin-bottom: 12px; margin-top: 4px; }
.form-success { font-size: 12px; color: #0f8a5f; margin-bottom: 12px; margin-top: 4px; }

/* ── Modal ───────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 18px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title { font-size: 16px; font-weight: 700; color: #111; }

.modal-close {
  background: none;
  border: none;
  font-size: 14px;
  color: #aaa;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.15s;
  line-height: 1;
}
.modal-close:hover { color: #111; }

.modal-body { padding: 24px 28px; overflow-y: auto; flex: 1; }

.modal-divider { height: 1px; background: #f0f0f0; margin: 8px 0 24px; }

.email-display {
  font-size: 15px;
  color: #111;
  padding: 4px 0 10px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.save-btn--sm  { padding: 9px 18px; font-size: 12px; }
.cancel-btn--sm { padding: 9px 14px; font-size: 12px; }

.modal-footer {
  padding: 16px 28px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .account-wrap {
    grid-template-columns: 180px 1fr;
    padding: 40px 24px;
  }
}

@media (max-width: 768px) {
  .account-wrap {
    grid-template-columns: 1fr;
    padding: 16px 0 40px;
  }

  /* user card gets full-width flush style */
  .user-card {
    margin: 16px 20px 0;
    border-radius: 12px;
  }

  /* show mobile nav, hide desktop email section */
  .mobile-nav    { display: flex; flex-direction: column; }
  .desktop-content { display: none; }

  /* ── Nav rows ── */
  .nav-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 15px 20px;
    border: none;
    background: none;
    cursor: pointer;
    text-decoration: none;
    border-bottom: 1px solid #f5f5f5;
    font-family: 'Montserrat', sans-serif;
    width: 100%;
    text-align: left;
    transition: background 0.1s;
  }
  .nav-row:first-child { margin-top: 20px; border-top: 1px solid #f5f5f5; }
  .nav-row:active { background: #f9f9f9; }

  .nav-row--disabled {
    cursor: default;
    pointer-events: none;
  }

  .nav-row-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111;
    flex-shrink: 0;
  }
  .nav-row--disabled .nav-row-icon { color: #ccc; }

  .nav-row-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #111;
  }
  .nav-row--disabled .nav-row-label { color: #bbb; }

  .nav-row-chevron {
    color: #ccc;
    flex-shrink: 0;
  }
  .nav-row--disabled .nav-row-chevron { opacity: 0.3; }

  /* ── Logout ── */
  .nav-logout-wrap {
    padding: 24px 20px 0;
  }

  .nav-logout-btn {
    font-size: 13px;
    color: #bbb;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-family: 'Montserrat', sans-serif;
    transition: color 0.15s;
  }
  .nav-logout-btn:hover { color: #555; }
}
</style>