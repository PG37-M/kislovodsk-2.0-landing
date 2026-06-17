/* ═══════════════════════════════════════════════════
   ЗМК Кисловодск 2.0 — форма заявки + Telegram
   ═══════════════════════════════════════════════════ */

const TG_TOKEN   = '8935030538:AAEgI7VsAB7SozU7h1NcSygazvexuPxUbBs';
const TG_CHAT_ID = '215323571';

/* ── CSS ─────────────────────────────────────────── */
const FORM_CSS = `
.lf-overlay{
  position:fixed;inset:0;background:rgba(23,32,42,.7);z-index:2000;
  display:flex;align-items:center;justify-content:center;padding:16px;
  opacity:0;visibility:hidden;transition:all .2s;backdrop-filter:blur(4px);
}
.lf-overlay.open{opacity:1;visibility:visible}
.lf-box{
  background:#fff;border-radius:16px;width:100%;max-width:460px;
  box-shadow:0 24px 64px rgba(0,0,0,.25);
  transform:scale(.96) translateY(12px);transition:transform .22s;
  overflow:hidden;
}
.lf-overlay.open .lf-box{transform:scale(1) translateY(0)}
.lf-head{
  background:linear-gradient(135deg,#154360,#2E86C1);
  padding:24px 24px 20px;position:relative;
}
.lf-head h3{font-size:20px;font-weight:800;color:#fff;margin-bottom:4px}
.lf-head p{font-size:13px;color:rgba(255,255,255,.75)}
.lf-product{
  display:inline-block;margin-top:10px;
  background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);
  color:#fff;font-size:12px;font-weight:600;padding:3px 10px;border-radius:6px;
}
.lf-close{
  position:absolute;top:14px;right:14px;
  width:30px;height:30px;border-radius:50%;
  background:rgba(255,255,255,.15);color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;cursor:pointer;border:none;font-family:inherit;
  transition:background .15s;
}
.lf-close:hover{background:rgba(255,255,255,.3)}
.lf-body{padding:24px}
.lf-field{margin-bottom:14px}
.lf-label{display:block;font-size:12px;font-weight:600;color:#5D6D7E;margin-bottom:5px;letter-spacing:.3px}
.lf-input,.lf-textarea{
  width:100%;border:2px solid #D4E6F1;border-radius:8px;
  padding:11px 14px;font-size:14px;font-family:inherit;color:#1B2631;
  background:#F0F7FF;outline:none;transition:border-color .15s,box-shadow .15s;
}
.lf-input:focus,.lf-textarea:focus{
  border-color:#2E86C1;box-shadow:0 0 0 3px rgba(46,134,193,.12);background:#fff;
}
.lf-input.error,.lf-textarea.error{border-color:#E74C3C}
.lf-textarea{resize:vertical;min-height:72px}
.lf-submit{
  width:100%;background:#2E86C1;color:#fff;
  padding:14px;border-radius:8px;font-size:15px;font-weight:700;
  border:none;font-family:inherit;cursor:pointer;
  transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;
  margin-top:4px;
}
.lf-submit:hover:not(:disabled){background:#1A5276;transform:translateY(-1px);box-shadow:0 4px 16px rgba(46,134,193,.3)}
.lf-submit:disabled{opacity:.65;cursor:not-allowed;transform:none}
.lf-note{font-size:11px;color:#85929E;text-align:center;margin-top:10px;line-height:1.5}
.lf-note a{color:#2E86C1}

/* success / error states */
.lf-result{display:none;text-align:center;padding:32px 24px}
.lf-result.show{display:block}
.lf-result-ico{font-size:52px;margin-bottom:14px}
.lf-result h4{font-size:19px;font-weight:700;color:#1B2631;margin-bottom:8px}
.lf-result p{font-size:14px;color:#5D6D7E;line-height:1.55;margin-bottom:20px}
.lf-result-btn{
  display:inline-block;background:#2E86C1;color:#fff;
  padding:11px 28px;border-radius:8px;font-size:14px;font-weight:700;
  cursor:pointer;transition:background .15s;border:none;font-family:inherit;
}
.lf-result-btn:hover{background:#1A5276}

/* checkbox consent */
.lf-checkbox{
  display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:4px;
}
.lf-checkbox input{display:none}
.lf-checkbox-box{
  flex-shrink:0;width:18px;height:18px;margin-top:1px;
  border:2px solid #D4E6F1;border-radius:4px;background:#F0F7FF;
  transition:all .15s;display:flex;align-items:center;justify-content:center;
}
.lf-checkbox input:checked + .lf-checkbox-box{
  background:#2E86C1;border-color:#2E86C1;
}
.lf-checkbox input:checked + .lf-checkbox-box::after{
  content:'';display:block;width:5px;height:9px;
  border:2px solid #fff;border-top:none;border-left:none;
  transform:rotate(45deg) translate(-1px,-1px);
}
.lf-checkbox-box.error{border-color:#E74C3C;background:#FEF9F9}
.lf-checkbox-text{font-size:12px;color:#5D6D7E;line-height:1.5}
.lf-checkbox-text a{color:#2E86C1;text-decoration:underline}
.lf-consent-error{
  display:none;font-size:11px;color:#E74C3C;margin-bottom:8px;margin-top:-2px;padding-left:28px;
}
.lf-consent-error.show{display:block}

/* spinner */
.lf-spinner{
  width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);
  border-top-color:#fff;border-radius:50%;animation:lf-spin .7s linear infinite;display:none;
}
@keyframes lf-spin{to{transform:rotate(360deg)}}
.lf-submit.loading .lf-spinner{display:inline-block}
.lf-submit.loading .lf-btn-text{display:none}
`;

/* ── HTML ─────────────────────────────────────────── */
const FORM_HTML = `
<div class="lf-overlay" id="lfOverlay">
  <div class="lf-box" id="lfBox">
    <div class="lf-head">
      <button class="lf-close" onclick="LF.close()">✕</button>
      <h3>Получить КП за 2 часа</h3>
      <p>Укажите контакты — перезвоним и пришлём расчёт бесплатно</p>
      <span class="lf-product" id="lfProductLabel" style="display:none"></span>
    </div>
    <div id="lfFormWrap">
      <div class="lf-body">
        <div class="lf-field">
          <label class="lf-label" for="lfName">Ваше имя</label>
          <input class="lf-input" id="lfName" type="text" placeholder="Иван Петрович" autocomplete="name">
        </div>
        <div class="lf-field">
          <label class="lf-label" for="lfPhone">Телефон <span style="color:#E74C3C">*</span></label>
          <input class="lf-input" id="lfPhone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel">
        </div>
        <div class="lf-field">
          <label class="lf-label" for="lfComment">Комментарий (необязательно)</label>
          <textarea class="lf-textarea" id="lfComment" placeholder="Площадь, сроки, особые требования..."></textarea>
        </div>
        <label class="lf-checkbox" id="lfConsentWrap">
          <input type="checkbox" id="lfConsent">
          <span class="lf-checkbox-box"></span>
          <span class="lf-checkbox-text">Я ознакомлен(а) с <a href="privacy.html" target="_blank">политикой обработки персональных данных</a> и даю согласие на обработку моих данных</span>
        </label>
        <p class="lf-consent-error" id="lfConsentError">Необходимо дать согласие на обработку данных</p>
        <button class="lf-submit" id="lfSubmit" onclick="LF.send()">
          <div class="lf-spinner"></div>
          <span class="lf-btn-text">📨 Отправить заявку</span>
        </button>
        <p class="lf-note">Или напишите напрямую: <a href="https://wa.me/79203404615" target="_blank">WhatsApp</a></p>
      </div>
    </div>
    <div class="lf-result" id="lfSuccess">
      <div class="lf-result-ico">✅</div>
      <h4>Заявка принята!</h4>
      <p>Мы получили ваш запрос и перезвоним в течение <strong>15 минут</strong> в рабочее время.<br>Если срочно — звоните: <a href="tel:+79203404615">8 920 340-46-15</a></p>
      <button class="lf-result-btn" onclick="LF.close()">Отлично, закрыть</button>
    </div>
    <div class="lf-result" id="lfError">
      <div class="lf-result-ico">⚠️</div>
      <h4>Ошибка отправки</h4>
      <p>Попробуйте позвонить напрямую:<br><a href="tel:+79203404615" style="font-size:18px;font-weight:700;color:#2E86C1">8 920 340-46-15</a><br>или написать в WhatsApp.</p>
      <button class="lf-result-btn" onclick="LF.resetForm()" style="background:#5D6D7E">Попробовать снова</button>
    </div>
  </div>
</div>
`;

/* ── LOGIC ────────────────────────────────────────── */
const LF = {
  currentProduct: '',

  init() {
    // inject CSS
    const style = document.createElement('style');
    style.textContent = FORM_CSS;
    document.head.appendChild(style);
    // inject HTML
    document.body.insertAdjacentHTML('beforeend', FORM_HTML);
    // phone mask
    document.getElementById('lfPhone').addEventListener('input', LF.phoneMask);
    // close on overlay click
    document.getElementById('lfOverlay').addEventListener('click', e => {
      if (e.target.id === 'lfOverlay') LF.close();
    });
    // esc
    document.addEventListener('keydown', e => { if (e.key === 'Escape') LF.close(); });
    // track phone & WhatsApp clicks for Metrica / Roistat
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;
      if (a.href && a.href.startsWith('tel:')) {
        if (typeof ym === 'function') ym(109779710, 'reachGoal', 'phone_click');
        if (window.roistat && typeof roistat.goal === 'function') roistat.goal('phone_click');
      }
      if (a.href && a.href.includes('wa.me')) {
        if (typeof ym === 'function') ym(109779710, 'reachGoal', 'whatsapp_click');
        if (window.roistat && typeof roistat.goal === 'function') roistat.goal('whatsapp_click');
      }
    });
    // intercept CTA buttons
    LF.hookButtons();
  },

  hookButtons() {
    // run after DOM is ready
    const intercept = () => {
      // marketplace: «Узнать цену»
      document.querySelectorAll('.btn-card-p').forEach(btn => {
        if (btn.tagName === 'A' && btn.href.includes('tel:')) {
          btn.addEventListener('click', e => {
            e.preventDefault();
            const card = btn.closest('.prod-card');
            const name = card?.querySelector('.card-name a, .card-name')?.textContent?.trim() || '';
            LF.open(name);
          });
        }
      });
      // product page: «Получить КП за 2 часа»
      document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.href?.includes('tel:')) {
          btn.addEventListener('click', e => {
            e.preventDefault();
            const title = document.getElementById('infoTitle')?.textContent || '';
            LF.open(title);
          });
        }
      });
      // header «Получить КП»
      document.querySelectorAll('.btn-header, .btn-hdr').forEach(btn => {
        if (btn.href?.includes('tel:') || btn.href === '#') {
          btn.addEventListener('click', e => {
            e.preventDefault();
            LF.open('');
          });
        }
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', intercept);
    } else {
      intercept();
    }
  },

  open(productName) {
    LF.currentProduct = productName || '';
    LF.resetForm();
    const lbl = document.getElementById('lfProductLabel');
    if (productName) {
      lbl.textContent = '📦 ' + productName;
      lbl.style.display = 'inline-block';
    } else {
      lbl.style.display = 'none';
    }
    document.getElementById('lfOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('lfPhone').focus(), 200);
  },

  close() {
    document.getElementById('lfOverlay').classList.remove('open');
    document.body.style.overflow = '';
  },

  resetForm() {
    document.getElementById('lfFormWrap').style.display = '';
    document.getElementById('lfSuccess').classList.remove('show');
    document.getElementById('lfError').classList.remove('show');
    document.getElementById('lfSubmit').classList.remove('loading');
    document.getElementById('lfSubmit').disabled = false;
    ['lfName','lfPhone','lfComment'].forEach(id => {
      const el = document.getElementById(id);
      el.value = '';
      el.classList.remove('error');
    });
    // reset consent
    const consent = document.getElementById('lfConsent');
    if (consent) {
      consent.checked = false;
      consent.nextElementSibling.classList.remove('error');
      document.getElementById('lfConsentError').classList.remove('show');
    }
  },

  phoneMask(e) {
    let v = e.target.value.replace(/\D/g,'');
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (v.startsWith('7')) {
      v = '+7 (' + v.slice(1,4) + ') ' + v.slice(4,7) + '-' + v.slice(7,9) + '-' + v.slice(9,11);
      e.target.value = v.replace(/[\s\-\(\)]+$/, '');
    }
  },

  validate() {
    let ok = true;
    // phone
    const phone = document.getElementById('lfPhone').value.replace(/\D/g,'');
    const phoneEl = document.getElementById('lfPhone');
    if (phone.length < 10) {
      phoneEl.classList.add('error');
      phoneEl.focus();
      ok = false;
    } else {
      phoneEl.classList.remove('error');
    }
    // consent
    const consent = document.getElementById('lfConsent');
    const consentBox = consent.nextElementSibling; // .lf-checkbox-box
    const consentErr = document.getElementById('lfConsentError');
    if (!consent.checked) {
      consentBox.classList.add('error');
      consentErr.classList.add('show');
      ok = false;
    } else {
      consentBox.classList.remove('error');
      consentErr.classList.remove('show');
    }
    return ok;
  },

  async send() {
    if (!LF.validate()) return;

    const btn = document.getElementById('lfSubmit');
    btn.classList.add('loading');
    btn.disabled = true;

    const name    = document.getElementById('lfName').value.trim() || 'не указано';
    const phone   = document.getElementById('lfPhone').value.trim();
    const comment = document.getElementById('lfComment').value.trim();
    const product = LF.currentProduct;
    const page    = window.location.pathname.split('/').pop() || 'сайт';
    const now     = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'});

    const text = [
      '🏗 <b>Новая заявка с сайта ЗМК</b>',
      '',
      product ? `📦 <b>Товар:</b> ${product}` : null,
      `👤 <b>Имя:</b> ${name}`,
      `📞 <b>Телефон:</b> ${phone}`,
      comment ? `💬 <b>Комментарий:</b> ${comment}` : null,
      '',
      `🕐 ${now} (МСК)`,
      `🌐 Страница: ${page}`,
    ].filter(l => l !== null).join('\n');

    try {
      const resp = await fetch(
        `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text,
            parse_mode: 'HTML'
          })
        }
      );
      const data = await resp.json();
      if (data.ok) {
        document.getElementById('lfFormWrap').style.display = 'none';
        document.getElementById('lfSuccess').classList.add('show');
        // ── Яндекс Метрика: цель «Заявка отправлена»
        if (typeof ym === 'function') ym(109779710, 'reachGoal', 'form_submit');
        // ── Roistat: событие конверсии
        if (window.roistat && typeof roistat.goal === 'function') roistat.goal('form_submit');
        // save to localStorage as backup
        const leads = JSON.parse(localStorage.getItem('zmk_leads') || '[]');
        leads.push({name, phone, comment, product, time: now});
        localStorage.setItem('zmk_leads', JSON.stringify(leads));
      } else {
        throw new Error(data.description || 'Telegram API error');
      }
    } catch(err) {
      console.error('Telegram send error:', err);
      // save anyway
      const leads = JSON.parse(localStorage.getItem('zmk_leads') || '[]');
      leads.push({name, phone, comment, product, time: now, error: err.message});
      localStorage.setItem('zmk_leads', JSON.stringify(leads));
      document.getElementById('lfFormWrap').style.display = 'none';
      document.getElementById('lfError').classList.add('show');
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
};

// auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LF.init());
} else {
  LF.init();
}

// expose globally for inline onclick
window.LF = LF;
