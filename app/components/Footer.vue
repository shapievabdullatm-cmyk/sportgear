<script setup lang="ts">

</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">

      <!-- Top row: logo + cols -->
      <div class="footer-top">

        <!-- Brand -->
        <div class="footer-brand">
          <NuxtLink to="/" class="footer-logo-link" aria-label="На главную">
            <Icon name="my:logo" class="footer-logo" />
          </NuxtLink>
          <p class="footer-tagline">Экипировка для бойцов.<br>Профессиональное снаряжение.</p>
          <div class="footer-socials">
            <!-- VK -->
            <a href="/" target="_blank" rel="noopener" aria-label="VK" class="social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.585-1.496c.598-.189 1.364 1.26 2.177 1.815.614.418 1.08.326 1.08.326l2.17-.03s1.134-.07.597-1.007c-.044-.073-.312-.658-1.608-1.86-1.357-1.258-1.174-1.054.459-3.228.998-1.329 1.396-2.142 1.271-2.49-.12-.332-.855-.244-.855-.244l-2.44.015s-.181-.025-.315.056c-.132.079-.217.264-.217.264s-.386 1.029-.901 1.903c-1.085 1.844-1.52 1.942-1.697 1.827-.412-.267-.309-1.073-.309-1.646 0-1.79.271-2.534-.528-2.73-.265-.064-.46-.106-1.138-.113-.87-.009-1.606.003-2.022.207-.277.135-.491.437-.361.454.161.021.526.099.72.363.25.341.241 1.107.241 1.107s.144 2.107-.335 2.368c-.328.176-.778-.183-1.745-1.825-.496-.858-.872-1.806-.872-1.806s-.072-.178-.202-.274c-.157-.115-.376-.151-.376-.151l-2.318.015s-.347.01-.474.161c-.113.135-.009.414-.009.414s1.814 4.246 3.868 6.385c1.884 1.963 4.024 1.834 4.024 1.834h.97z"/>
              </svg>
            </a>
            <!-- Telegram -->
            <a href="/" target="_blank" rel="noopener" aria-label="Telegram" class="social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 5L2 12.5l7 1M21 5l-2.5 15L9 13.5M21 5L9 13.5m0 0V19l3.5-3"/>
              </svg>
            </a>
            <!-- Instagram / general cam icon -->
            <a href="/" target="_blank" rel="noopener" aria-label="Instagram" class="social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Col: Каталог -->
        <div class="footer-col">
          <p class="footer-col-title">Каталог</p>
          <ul>
            <li><NuxtLink to="/" class="footer-link">Новинки</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Перчатки</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Кроссовки</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Шорты</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Рюкзаки</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Аксессуары</NuxtLink></li>
          </ul>
        </div>

        <!-- Col: Покупателям -->
        <div class="footer-col">
          <p class="footer-col-title">Покупателям</p>
          <ul>
            <li><NuxtLink to="/" class="footer-link">Доставка и оплата</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Возврат и обмен</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Размерная сетка</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Программа лояльности</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Подарочные карты</NuxtLink></li>
          </ul>
        </div>

        <!-- Col: Компания -->
        <div class="footer-col">
          <p class="footer-col-title">Компания</p>
          <ul>
            <li><NuxtLink to="/" class="footer-link">О нас</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Контакты</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Вакансии</NuxtLink></li>
            <li><NuxtLink to="/" class="footer-link">Партнёрам</NuxtLink></li>
          </ul>
        </div>

        <!-- Col: Контакты -->
        <div class="footer-col">
          <p class="footer-col-title">Контакты</p>
          <ul>
            <li><a href="tel:+78001234567" class="footer-link">8 800 123-45-67</a></li>
            <li><a href="mailto:info@rage.ru" class="footer-link">info@rage.ru</a></li>
            <li class="footer-address">Москва, ул. Примерная, 1</li>
          </ul>
          <p class="footer-work-hours">Пн–Пт: 9:00 – 18:00</p>
        </div>

      </div>

      <!-- Bottom row -->
      <div class="footer-bottom">
        <p class="footer-copy">© {{ new Date().getFullYear() }} RAGE. Все права защищены.</p>
        <div class="footer-legal">
          <NuxtLink to="/" class="footer-link-sm">Политика конфиденциальности</NuxtLink>
          <NuxtLink to="/" class="footer-link-sm">Пользовательское соглашение</NuxtLink>
        </div>
      </div>

    </div>
  </footer>
</template>

<style scoped>
/* ─── Footer ───────────────────────────────────── */
.site-footer {
  background: #f8f8f8;
  color: #1a1a1a;
  margin-top: 30px;
  width: 100%;
}

.footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 64px 80px 32px;
  box-sizing: border-box;
}

/* Top grid */
.footer-top {
  display: grid;
  grid-template-columns: 260px repeat(4, 1fr);
  gap: 40px;
  padding-bottom: 48px;
  border-bottom: 1px solid #e0e0e0;
}

/* Brand column */
.footer-logo-link {
  display: inline-block;
  margin-bottom: 16px;
  color: #1a1a1a;
  text-decoration: none;
}

.footer-logo {
  font-size: 40px;
  color: #1a1a1a;
}

.footer-tagline {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 24px;
}

.footer-socials {
  display: flex;
  gap: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d0d0d0;
  border-radius: 50%;
  color: #666;
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;
}

.social-link:hover {
  border-color: #1a1a1a;
  color: #1a1a1a;
}

/* Nav columns */
.footer-col p.footer-col-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #1a1a1a;
  margin: 0 0 18px;
}

.footer-col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-link {
  font-size: 13px;
  color: #666;
  text-decoration: none;
  transition: color 0.15s;
  display: inline-block;
}

.footer-link:hover { color: #1a1a1a; }

.footer-address {
  font-size: 13px;
  color: #666;
}

.footer-work-hours {
  font-size: 12px;
  color: #888;
  margin: 14px 0 0;
}

/* Bottom row */
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-copy {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.footer-legal {
  display: flex;
  gap: 24px;
}

.footer-link-sm {
  font-size: 12px;
  color: #999;
  text-decoration: none;
  transition: color 0.15s;
}

.footer-link-sm:hover { color: #1a1a1a; }

/* Responsive footer */
@media (max-width: 1280px) {
  .footer-inner { padding: 56px 48px 28px; }
  .footer-top { grid-template-columns: 220px repeat(4, 1fr); gap: 28px; }
}

@media (max-width: 1024px) {
  .footer-inner { padding: 48px 32px 24px; }
  .footer-top { grid-template-columns: repeat(3, 1fr); }
  .footer-brand { grid-column: 1 / -1; }
}

@media (max-width: 640px) {
  .footer-inner { padding: 40px 20px 24px; }
  .footer-top { grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .footer-bottom { flex-direction: column; align-items: flex-start; }
  .footer-legal { flex-direction: column; gap: 8px; }
}
</style>