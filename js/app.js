/* 能源知識王線上競賽：活動狀態倒數、上傳準備清單、海報放大、複製連結、分享、App 內建瀏覽器提醒 */
(function () {
  'use strict';

  // ---------- 活動狀態（台灣時間） ----------
  var START = new Date('2026-11-23T00:00:00+08:00').getTime();
  var END = new Date('2026-12-07T23:59:59+08:00').getTime();
  var statusEl = document.getElementById('status');
  var statusText = document.getElementById('statusText');

  function renderStatus() {
    if (!statusEl) return;
    var now = Date.now();
    var state, html;
    if (now < START) {
      var d1 = Math.ceil((START - now) / 86400000);
      state = 'soon';
      html = '活動即將開始，還有 <b>' + d1 + '</b> 天';
    } else if (now <= END) {
      var left = END - now;
      var days = Math.floor(left / 86400000);
      var hours = Math.floor((left % 86400000) / 3600000);
      state = 'live';
      html = days > 0
        ? '活動進行中！截止倒數 <b>' + days + '</b> 天 <b>' + hours + '</b> 小時'
        : '最後一天！今天 23:59 截止，還剩 <b>' + hours + '</b> 小時';
    } else {
      state = 'ended';
      html = '活動已於 12/7（一）結束，謝謝大家參與！';
    }
    statusEl.setAttribute('data-state', state);
    statusText.innerHTML = html;
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  // ---------- 提示訊息 ----------
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  // ---------- 上傳準備清單（只存在這台裝置） ----------
  var STORE_KEY = 'energy-king-checklist-v1';
  var checklist = document.getElementById('checklist');
  var boxes = checklist ? checklist.querySelectorAll('input[type="checkbox"]') : [];
  var meter = checklist ? checklist.querySelector('.meter') : null;
  var meterBar = document.getElementById('meterBar');
  var checkMsg = document.getElementById('checkMsg');

  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveChecks(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 無痕模式可能不能存 */ }
  }
  function renderChecks() {
    var done = 0;
    Array.prototype.forEach.call(boxes, function (b) { if (b.checked) done++; });
    var total = boxes.length;
    if (meterBar) meterBar.style.width = (done / total * 100) + '%';
    if (meter) meter.setAttribute('aria-valuenow', String(done));
    if (checkMsg) {
      checkMsg.textContent = done === total
        ? '三張都準備好了！快去上傳，越早送出越有機會 🎉'
        : '已準備 ' + done + ' 張，還差 ' + (total - done) + ' 張，加油！';
    }
    if (checklist) checklist.classList.toggle('is-ready', done === total);
  }
  if (boxes.length) {
    var saved = loadChecks();
    Array.prototype.forEach.call(boxes, function (b) {
      b.checked = !!saved[b.dataset.key];
      b.addEventListener('change', function () {
        var state = loadChecks();
        state[b.dataset.key] = b.checked;
        saveChecks(state);
        renderChecks();
      });
    });
    renderChecks();
  }

  // ---------- 上傳表單：App 內建瀏覽器再提醒一次（Google 禁止在 LINE／FB 內建瀏覽器登入） ----------
  var IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Messenger|MicroMessenger|KAKAOTALK|\bLine\//i.test(navigator.userAgent || '');
  Array.prototype.forEach.call(document.querySelectorAll('.js-form-link'), function (a) {
    a.addEventListener('click', function (e) {
      if (!IN_APP) return;
      e.preventDefault();
      try {
        window.alert('上傳表單要用學校 Google 帳號（ltes 網域）登入，但您目前在 App 內建瀏覽器（LINE／FB 等）中，Google 禁止在這裡登入。\n\n請點右上／右下角「⋯」→ 選「用預設瀏覽器開啟」後再上傳。');
      } catch (err) { /* 部分 App 不允許 alert */ }
    });
  });

  // ---------- 海報放大 ----------
  var lightbox = document.getElementById('lightbox');
  var closeBtn = document.getElementById('lightboxClose');
  function openPoster() {
    if (!lightbox) return;
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else window.open('assets/poster.webp', '_blank', 'noopener');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.js-open-poster'), function (btn) {
    btn.addEventListener('click', openPoster);
  });
  if (closeBtn) closeBtn.addEventListener('click', function () { lightbox.close(); });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
  }

  // ---------- 複製連結 ----------
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (err) { reject(err); }
      ta.remove();
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
    btn.addEventListener('click', function () {
      copyText(btn.dataset.copy).then(function () { toast('✅ 已複製連結'); }, function () { toast('無法自動複製，請長按連結文字複製'); });
    });
  });

  // ---------- 分享這個網站 ----------
  var SITE_URL = 'https://cagoooo.github.io/energy-knowledge-king/';
  Array.prototype.forEach.call(document.querySelectorAll('.js-share'), function (btn) {
    btn.addEventListener('click', function () {
      var data = { title: '能源知識王線上競賽', text: '答題 90 分以上、上傳三張截圖，最快完成者送全家禮券 100 元！', url: SITE_URL };
      if (navigator.share) {
        navigator.share(data).catch(function () { /* 使用者取消 */ });
      } else {
        copyText(SITE_URL).then(function () { toast('✅ 已複製網站連結，可以貼到 LINE 分享'); }, function () { toast(SITE_URL); });
      }
    });
  });

  // ---------- 版本號（本機開發顯示「開發版」） ----------
  var vt = document.getElementById('versionTag');
  if (vt && vt.textContent.indexOf('__') !== -1) vt.textContent = '開發版';
})();
