/* 《米侦探：粮食王国大追捕》核心引擎
 * 提供：工具函数 / 音效合成 / 全局状态 / AI 适配层（含离线回退）/ 提示气泡
 * 设计原则：
 *   1. 全部本地逻辑优先，断网也能跑完整个教学流程。
 *   2. AI 只负责「表达」，绝不负责「判定」——标准答案永远来自已审核题库。
 */
(function () {
  'use strict';

  var MI = window.MI = window.MI || {};

  /* ============================================================
   * 1. 工具函数
   * ============================================================ */
  var util = {
    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },
    el: function (tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); },
    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    uid: function (p) { return (p || 'id') + '-' + Math.random().toString(36).slice(2, 8); },
    /* 打字机效果 */
    typewriter: function (node, text, speed, onDone) {
      speed = speed || 38;
      node.textContent = '';
      node.classList.add('typing');
      var i = 0;
      var timer = setInterval(function () {
        node.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(timer);
          node.classList.remove('typing');
          if (onDone) onDone();
        }
      }, speed);
      return function () { clearInterval(timer); node.textContent = text; node.classList.remove('typing'); };
    },
    fmtPct: function (a, b) { return b > 0 ? Math.round((a / b) * 100) + '%' : '—'; }
  };
  MI.util = util;

  /* ============================================================
   * 2. 音效（WebAudio 实时合成，不依赖任何音频文件）
   * ============================================================ */
  var audio = {
    ctx: null,
    muted: false,
    init: function () {
      if (this.ctx) return this.ctx;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    resume: function () {
      var c = this.init();
      if (c && c.state === 'suspended') c.resume();
    },
    tone: function (freq, dur, type, gain, delay) {
      if (this.muted) return;
      var c = this.init();
      if (!c) return;
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain == null ? 0.14 : gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    },
    seq: function (notes) {
      var self = this;
      notes.forEach(function (n, i) {
        self.tone(n[0], n[1] || 0.16, n[2] || 'sine', n[3], (n[4] || i * 0.09));
      });
    },
    click: function () { this.tone(660, 0.07, 'triangle', 0.09); },
    hover: function () { this.tone(880, 0.04, 'sine', 0.04); },
    correct: function () { this.seq([[784, 0.14], [1046, 0.16], [1318, 0.22]]); },
    wrong: function () { this.seq([[300, 0.16, 'sawtooth', 0.09], [196, 0.26, 'sawtooth', 0.09, 0.12]]); },
    reveal: function () { this.tone(1180, 0.12, 'sine', 0.07); this.tone(1560, 0.16, 'sine', 0.05, 0.07); },
    scan: function () { this.tone(520, 0.5, 'sine', 0.05); this.tone(880, 0.4, 'sine', 0.03, 0.12); },
    success: function () { this.seq([[523, 0.16], [659, 0.16], [784, 0.16], [1046, 0.34]]); },
    chase: function () { this.seq([[440, 0.09, 'square', 0.06], [587, 0.09, 'square', 0.06], [740, 0.12, 'square', 0.06]]); },
    badge: function () { this.seq([[1046, 0.12], [1318, 0.12], [1568, 0.12], [2093, 0.4]]); },
    toggle: function () {
      this.muted = !this.muted;
      if (!this.muted) { this.resume(); this.click(); }
      return this.muted;
    }
  };
  MI.audio = audio;

  /* ============================================================
   * 3. 全局状态
   * ============================================================ */
  var STORAGE_KEY = 'mi-detective-save-v1';

  function defaultState() {
    return {
      phase: 'idle',                 // idle | intro | level1 | level2 | level3 | result
      paused: false,
      hostMode: true,
      caseIdx: 0,
      clueIdx: 0,
      attempts: 0,
      solved: [],                    // 已破案件 id
      paperClues: [],                // 已发放的线索卡 id（由 clueAwards 派生，供发放记录使用）
      clueUnlocked: [],              // 已停用（保留兼容旧存档）：发放时机与对象完全由老师决定
      clueAwards: [],                // [{clueId, recipient, at}] 由主持人记录发给哪位同学
      l2: { queue: [], index: 0, revealed: 'none', difficulty: 'easy', progress: 0 },
      l3: { taskIdx: 0 },
      startedAt: 0
    };
  }

  var listeners = [];
  var state = defaultState();

  var store = {
    get: function () { return state; },
    reset: function () {
      state = defaultState();
      this.emit('reset');
      return state;
    },
    /* 局部更新：patch 为对象或函数 */
    set: function (patch, silent) {
      if (typeof patch === 'function') patch(state);
      else Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
      if (!silent) this.emit('change');
      return state;
    },
    on: function (fn) { listeners.push(fn); return fn; },
    emit: function (type) {
      listeners.forEach(function (fn) {
        try { fn(state, type); } catch (e) { console.warn('[state] listener error', e); }
      });
    },
    save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 忽略隐私模式 */ }
    },
    load: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        var data = JSON.parse(raw);
        if (data && typeof data === 'object' && data.phase) { state = Object.assign(defaultState(), data); return true; }
      } catch (e) { /* ignore */ }
      return false;
    },
    clear: function () { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }
  };
  MI.state = store;

  /* ---------- 计分（已取消） ----------
   * 本游戏不做任何计分 / 小组竞争。保留 recordAnswer 空接口，
   * 仅为避免改动大量调用点；它不再产生任何分数或统计。 */
  MI.score = {
    recordAnswer: function (ok) { /* 计分已取消，空操作 */ }
  };

  /* 便捷别名：保留 recordAnswer 空接口（计分已取消） */
  store.recordAnswer = function (ok) { return MI.score.recordAnswer(ok); };

  /* ============================================================
   * 4. AI 适配层（可选在线大模型 + 强制离线回退）
   * ------------------------------------------------------------
   * 配置方式：在 index.html 中设置
   *   window.MI_AI_CONFIG = { endpoint: 'http://localhost:8787/api/mi', model: 'gpt-4o-mini' };
   * 注意：endpoint 指向的是「你自己的服务端代理」，API 密钥保存在服务端环境变量中，
   *       绝不要把密钥写进前端代码。未配置或调用失败时，全部自动走本地已审核内容。
   * ============================================================ */
  var ai = {
    config: null,
    online: false,
    lastError: '',
    init: function () {
      var cfg = window.MI_AI_CONFIG;
      if (cfg && cfg.endpoint) { this.config = cfg; this.online = true; }
      else { this.config = null; this.online = false; }
      return this.online;
    },
    status: function () {
      if (!this.config) return { online: false, text: '离线模式（使用已审核默认题库）' };
      return { online: this.online, text: this.online ? 'AI 调查助手已连接' : 'AI 未连接，已自动切换本地题库' };
    },
    /* 统一请求；任何异常都抛出，由调用方回退 */
    request: async function (task, payload) {
      if (!this.config) throw new Error('AI 未配置');
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, (this.config.timeout || 6000));
      try {
        var res = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: task, model: this.config.model || '', payload: payload || {} }),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        if (!data || data.ok === false) throw new Error((data && data.error) || 'AI 返回异常');
        return data;
      } finally { clearTimeout(timer); }
    },

    /* --- 能力 1：智能生成线索（回退：从已审核线索库按序取） --- */
    generateClue: async function (crop, usedCount) {
      var localPick = function () {
        var c = window.getCrop(crop);
        if (!c || !c.clues || !c.clues.length) return null;
        return c.clues[Math.min(usedCount, c.clues.length - 1)];
      };
      try {
        var r = await this.request('generateClue', { crop: crop, cropName: (window.getCrop(crop) || {}).name, revealed: usedCount });
        if (r && r.clue && typeof r.clue === 'string') {
          return { text: r.clue, dimension: r.dimension || '智能线索', fromAI: true };
        }
      } catch (e) { this.lastError = e.message; }
      var l = localPick();
      return l ? { text: l.text, dimension: l.dimension, fromAI: false } : null;
    },

    /* --- 能力 2：智能解释答案（回退：题库解析 + 趣味知识） --- */
    explain: async function (question, chosenIndex) {
      var local = {
        text: (question.explanation || '') + (question.funFact ? '　小知识：' + question.funFact : ''),
        fromAI: false
      };
      try {
        var r = await this.request('explain', { question: question.question, options: question.options, answer: question.answer, chosen: chosenIndex });
        if (r && r.explanation) return { text: r.explanation, fromAI: true };
      } catch (e) { this.lastError = e.message; }
      return local;
    },

    /* --- 能力 3：智能调整难度（本地策略即可，无需联网） --- */
    adjustDifficulty: function (recentWrongStreak, recentCorrectStreak) {
      if (recentWrongStreak >= 2) return 'easy';
      if (recentCorrectStreak >= 2) return 'hard';
      return 'medium';
    },

    /* --- 能力 4：智能生成题目（回退：从已审核题库按主题/难度抽题） --- */
    generateQuestion: async function (category, difficulty) {
      var pool = (window.QUESTION_BANK || []).filter(function (q) {
        return (!category || q.category === category) && (!difficulty || q.difficulty === difficulty);
      });
      var localPick = function () {
        var p = pool.length ? pool : (window.QUESTION_BANK || []);
        return p.length ? p[Math.floor(Math.random() * p.length)] : null;
      };
      try {
        var r = await this.request('generateQuestion', { category: category, difficulty: difficulty });
        if (r && r.question && Array.isArray(r.question.options) && r.question.options.length === 4 &&
            typeof r.question.answer === 'number') {
          /* 安全门：AI 生成的题目仅在其自带校验标记通过时使用 */
          var q = r.question;
          q.reviewed = !!q.reviewed;
          q.source = q.source || 'AI 生成（未人工复核，仅作拓展）';
          if (q.reviewed) return q;
        }
      } catch (e) { this.lastError = e.message; }
      return localPick();
    },

    /* --- 能力 5：智能扮演米侦探（回退：角色台词库） --- */
    detectiveTalk: async function (context, fallback) {
      try {
        var r = await this.request('detectiveTalk', { context: context });
        if (r && r.line) return { text: r.line, fromAI: true };
      } catch (e) { this.lastError = e.message; }
      return { text: fallback, fromAI: false };
    }
  };
  ai.init();
  MI.ai = ai;

  /* 一段提示性兜底台词，供各场景复用 */
  MI.detectiveLines = {
    intro: '米侦探报到！线索出现了，准备好和我一起破案了吗？',
    clue: '叮——新线索出现了，睁大眼睛看清楚！',
    correct: '漂亮！你的推理完全正确，米侦探给你记上一功！',
    wrong: '别灰心，线索还没用完。再观察一次，答案离我们很近了。',
    chase: '别让它跑了！答对一题，我们就追近一步！',
    win: '结案！这一案，你赢啦！',
    final: '真相就在眼前，把线索拼起来吧！',
    closing: '每一粒粮食都来之不易。认识粮食、珍惜粮食、节约粮食，就是我们每个人都能完成的任务！'
  };

  /* ============================================================
   * 5. 提示气泡与轻提示
   * ============================================================ */
  MI.toast = function (msg, type) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = util.el('div', 'toast-wrap'); wrap.id = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var t = util.el('div', 'toast toast--' + (type || 'info'), util.esc(msg));
    wrap.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3100);
  };

  /* 主持人提示（屏幕顶部条） */
  MI.hostHint = function (msg, ms) {
    var bar = document.getElementById('host-hint');
    if (!bar) return;
    bar.textContent = msg;
    bar.classList.add('show');
    clearTimeout(bar._t);
    bar._t = setTimeout(function () { bar.classList.remove('show'); }, ms || 3200);
  };

  /* ============================================================
   * 6. 全屏与键盘
   * ============================================================ */
  MI.toggleFullscreen = function () {
    var d = document;
    var el = d.documentElement;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    }
  };

  console.log('%c米侦探 · 核心引擎已加载', 'color:#C08A1E;font-weight:bold');
})();
