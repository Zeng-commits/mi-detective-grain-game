/* 《米侦探：粮食王国大追捕》主控制器
 * 负责：三关场景渲染、米侦探交互、题目流程、结算与通关动画。
 * 主持人控制台逻辑见 js/host.js。
 */
(function () {
  'use strict';
  var MI = window.MI;
  var U = MI.util, A = MI.audio, S = MI.state;

  /* 运行时状态（不持久化） */
  MI.rt = {
    l1: { caseIdx: 0, clueCount: 0, wrongStreak: 0, solved: false, phase: 'brief', correctFirstTry: 0 },
    l2: { idx: 0, revealed: 'none', wrongStreak: 0, rightStreak: 0, progress: 0, correct: 0, wrong: 0, used: {}, current: null },
    l3: { taskIdx: 0, subIdx: 0, picked: [], results: [] },
    stopTyping: null
  };

  function stage() { return document.getElementById('stage'); }
  function modalRoot() { return document.getElementById('modal-root'); }

  /* ============================================================
   * 通用 UI 片段
   * ============================================================ */
  function cropChip(cropId, extraCls) {
    var c = window.getCrop(cropId);
    if (!c) return '';
    return '<div class="crop-chip ' + (extraCls || '') + '" style="--chip:' + c.color + ';--chip-ink:' + c.accent + '">' +
      '<span class="crop-chip__emoji">' + c.emoji + '</span>' +
      '<span class="crop-chip__name">' + U.esc(c.name) + '</span>' +
      '</div>';
  }

  var LET = ['A', 'B', 'C', 'D', 'E', 'F'];

  /** 候选对象乱序：同一案件内顺序固定，案件切换时重新打乱。
   *  目的：不让正确答案长期固定在第一个位置，避免孩子靠位置猜。 */
  function candidateOrder(list, cache, key) {
    if (!cache.order || cache.orderKey !== key) {
      cache.order = U.shuffle(list);
      cache.orderKey = key;
    }
    return cache.order;
  }

  /** 选项按钮 */
  function optionHTML(idx, text, state) {
    // state: '' | 'correct' | 'wrong' | 'dim'
    return '<button class="option option--' + (state || 'idle') + '" data-opt="' + idx + '">' +
      '<span class="option__key">' + LET[idx] + '</span>' +
      '<span class="option__text">' + U.esc(text) + '</span>' +
      '<span class="option__mark"></span>' +
      '</button>';
  }

  /* ============================================================
   * 米侦探形象 + 对话气泡
   * ============================================================ */
  MI.setDetective = function (expr) {
    var box = document.getElementById('detective-figure');
    if (!box) return;
    box.innerHTML = MI.detectiveSVG(expr || 'normal', 168);
    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');
  };

  var bubbleTimer = null;
  MI.say = function (text, expr, ms) {
    MI.setDetective(expr || 'normal');
    var b = document.getElementById('detective-bubble');
    if (!b) return;
    b.classList.remove('show');
    void b.offsetWidth;
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { b.classList.remove('show'); }, ms || 5200);
  };

  /** 异步说出台词：先显示本地兜底，AI 可用时再替换 */
  function sayAsync(context, fallback, expr) {
    MI.say(fallback, expr);
    MI.ai.detectiveTalk(context, fallback).then(function (r) {
      if (r.fromAI && r.text) MI.say(r.text, expr, 6000);
    });
  }

  /* ============================================================
   * 模态框
   * ============================================================ */
  MI.modal = {
    open: function (opts) {
      var root = modalRoot();
      var acts = (opts.actions || []).map(function (a, i) {
        return '<button class="btn ' + (a.cls || 'btn--ghost') + '" data-act="' + i + '">' + U.esc(a.label) + '</button>';
      }).join('');
      root.innerHTML =
        '<div class="modal-mask"></div>' +
        '<div class="modal ' + (opts.size ? 'modal--' + opts.size : '') + '">' +
        (opts.badge ? '<div class="modal__badge">' + opts.badge + '</div>' : '') +
        '<h3 class="modal__title">' + opts.title + '</h3>' +
        '<div class="modal__body">' + opts.body + '</div>' +
        (acts ? '<div class="modal__actions">' + acts + '</div>' : '') +
        '</div>';
      root.classList.add('open');
      U.$$('[data-act]', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          A.click();
          var a = opts.actions[+btn.dataset.act];
          if (a && a.onClick) a.onClick();
          if (!a || a.close !== false) MI.modal.close();
        });
      });
      var mask = U.$('.modal-mask', root);
      if (mask && opts.dismissible !== false) mask.addEventListener('click', function () { MI.modal.close(); });
      var first = U.$('.modal__actions .btn', root);
      if (first) first.focus();
    },
    close: function () {
      modalRoot().classList.remove('open');
      modalRoot().innerHTML = '';
    },
    isOpen: function () { return modalRoot().classList.contains('open'); }
  };

  /* ============================================================
   * 顶部进度条
   * ============================================================ */
  function renderTopProgress() {
    var st = S.get();
    var wrap = document.getElementById('stage-progress');
    if (!wrap) return;
    var items = [
      { key: 'level1', label: '第一关 · 悬疑案', short: '① 悬疑案', pct: level1Pct() },
      { key: 'level2', label: '第二关 · 追捕', short: '② 追捕', pct: level2Pct() },
      { key: 'level3', label: '第三关 · 真相', short: '③ 真相', pct: level3Pct() }
    ];
    wrap.innerHTML = items.map(function (it) {
      var active = st.phase === it.key;
      var done = it.pct >= 100;
      return '<div class="prog ' + (active ? 'is-active ' : '') + (done ? 'is-done' : '') + '" title="' + it.label + '">' +
        '<span class="prog__dot">' + (done ? '✓' : (active ? '●' : '○')) + '</span>' +
        '<span class="prog__label">' + it.short + '</span>' +
        '<span class="prog__bar"><i style="width:' + it.pct + '%"></i></span></div>';
    }).join('');
  }
  function level1Pct() {
    var r = MI.rt.l1;
    return Math.round((S.get().solved.length / window.CASES.length) * 100);
  }
  function level2Pct() { return Math.min(100, Math.round(MI.rt.l2.progress)); }
  function level3Pct() {
    var n = window.FINAL_CASE.tasks.length;
    return Math.round(((MI.rt.l3.taskIdx) / n) * 100);
  }

  function refreshTop() {
    renderTopProgress();
  }
  MI.refreshTop = refreshTop;

  /* ============================================================
   * 第一关：粮食王国悬疑案
   * ============================================================ */
  function renderLevel1() {
    var r = MI.rt.l1;
    var c = window.CASES[r.caseIdx];
    if (!c) return;

    if (r.phase === 'brief') {
      /* 简报在调查室：绝不出现目标作物的田地，避免背景剧透 */
      MI.bg.render('investigation');
      stage().innerHTML =
        '<section class="scene scene--brief">' +
        '<div class="dossier">' +
        '<div class="dossier__tab">' + U.esc(c.no) + '</div>' +
        '<div class="dossier__stamp">' + U.esc(c.difficultyLabel) + '</div>' +
        '<h2 class="dossier__title">' + U.esc(c.title) + '</h2>' +
        '<pre class="dossier__brief">' + U.esc(c.brief) + '</pre>' +
        '<div class="dossier__meta">' +
        '<span>候选对象 ' + c.candidates.length + ' 个</span><span>线索 3~4 条</span><span>进度 ' + (r.caseIdx + 1) + '/' + window.CASES.length + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="brief-note">' +
        '<p class="brief-note__lead" id="brief-typing"></p>' +
        '<button class="btn btn--primary btn--lg" id="btn-open-case">🔍 开始调查</button>' +
        '</div>' +
        '</section>';

      var fast = '';
      MI.rt.stopTyping = U.typewriter(document.getElementById('brief-typing'), c.intro, 34, function () { fast = ''; });
      var btn = document.getElementById('btn-open-case');
      btn.addEventListener('click', function () {
        A.click();
        if (MI.rt.stopTyping) MI.rt.stopTyping();
        r.phase = 'investigate'; r.clueCount = 0; r.wrongStreak = 0; r.solved = false;
        renderLevel1();
        MI.host.refresh();
        setTimeout(function () { MI.actions.revealClue(); }, 420);
      });
      sayAsync('案件开场：' + c.intro, MI.detectiveLines.intro, 'normal');
      return;
    }

    /* 调查阶段：使用中性村庄场景（不含任何目标作物特征） */
    MI.bg.render('village');
    var crop = window.getCrop(c.target);
    var revealed = crop.clues.slice(0, Math.max(1, r.clueCount));
    var order = candidateOrder(c.candidates, r, c.id);

    stage().innerHTML =
      '<section class="scene scene--l1">' +
      /* 左：档案 */
      '<aside class="casefile">' +
      '<div class="casefile__head"><span class="casefile__no">' + U.esc(c.no) + '</span><span class="casefile__lv">' + U.esc(c.difficultyLabel) + '</span></div>' +
      '<div class="casefile__title">' + U.esc(c.title) + '</div>' +
      '<ul class="casefile__stats">' +
      '<li><b>' + r.clueCount + '</b><span>已揭示线索</span></li>' +
      '<li><b>' + c.candidates.length + '</b><span>候选对象</span></li>' +
      '<li><b>' + (r.wrongStreak > 0 ? '有' : '无') + '</b><span>错误提示</span></li>' +
      '</ul>' +
      '<div class="casefile__hint">' +
      '<div class="casefile__hint-title">🔎 推理助手</div>' +
      '<p id="l1-hint">线索一条一条看，先抓住「关键词」，再和候选对象比一比。</p>' +
      '</div>' +
      '</aside>' +
      /* 中：线索 */
      '<div class="clue-zone">' +
      '<div class="clue-zone__head"><h3>线索档案</h3><span class="clue-count">' + revealed.length + ' / ' + crop.clues.length + '</span></div>' +
      '<div class="clue-list" id="clue-list">' +
      revealed.map(function (cl, i) {
        return '<article class="clue-card" data-clue="' + i + '" style="animation-delay:' + (i * 0.07) + 's">' +
          '<div class="clue-card__no">线索 ' + (i + 1) + '</div>' +
          '<div class="clue-card__dim">' + U.esc(cl.dimension) + '</div>' +
          '<p class="clue-card__text">' + U.esc(cl.text) + '</p>' +
          '</article>';
      }).join('') +
      '</div>' +
      '<div class="clue-actions">' +
      '<button class="btn btn--ghost" id="btn-more-clue" ' + (r.clueCount >= crop.clues.length ? 'disabled' : '') + '>＋ 揭示下一条线索</button>' +
      '<button class="btn btn--gold" id="btn-show-answer">📖 直接公布答案</button>' +
      '</div>' +
      '</div>' +
      /* 右：候选 */
      '<div class="candidate-zone">' +
      '<div class="candidate-zone__head"><h3>嫌疑犯候选</h3><p>点击你认为正确的粮食</p></div>' +
      '<div class="candidate-grid" id="candidate-grid">' +
      order.map(function (id) {
        var cc = window.getCrop(id);
        if (!cc) return '';
        return '<button class="candidate" data-crop="' + cc.id + '" style="--c:' + cc.color + ';--ink:' + cc.accent + '">' +
          '<span class="candidate__emoji">' + cc.emoji + '</span>' +
          '<span class="candidate__name">' + U.esc(cc.name) + '</span>' +
          '</button>';
      }).join('') +
      '</div>' +
      '</div>' +
      '</section>';

    /* 事件绑定 */
    var moreBtn = document.getElementById('btn-more-clue');
    if (moreBtn) moreBtn.addEventListener('click', function () { A.click(); MI.actions.revealClue(); });

    document.getElementById('btn-show-answer').addEventListener('click', function () {
      A.click();
      MI.actions.showAnswer();
    });

    U.$$('.candidate', stage()).forEach(function (btn) {
      btn.addEventListener('click', function () { choose(btn.dataset.crop); });
    });

    /* 新线索揭示动画 */
    requestAnimationFrame(function () {
      var last = document.querySelector('.clue-card:last-child');
      if (last) { last.classList.add('scanning'); A.reveal(); }
    });

    sayAsync('线索第 ' + r.clueCount + ' 条：' + (revealed[revealed.length - 1] || {}).text,
      r.clueCount <= 1 ? MI.detectiveLines.clue : '又一条线索到手！把这几条线索连起来想一想。', 'thinking');
  }

  function choose(cropId) {
    if (S.get().paused) { MI.toast('游戏已暂停，请先继续', 'warn'); return; }
    var r = MI.rt.l1;
    if (r.solved) return;                 /* 已结案，忽略后续点击 */
    var c = window.CASES[r.caseIdx];
    var crop = window.getCrop(c.target);
    var target = window.getCrop(cropId);
    var cards = U.$$('.candidate', stage());

    if (!target) return;

    if (cropId === c.target) {
      A.correct();
      cards.forEach(function (b) {
        b.classList.add(b.dataset.crop === c.target ? 'is-correct' : 'is-dim');
      });
      r.solved = true;
      if (S.get().solved.indexOf(c.id) < 0) S.get().solved.push(c.id);
      S.recordAnswer(true);
      S.save();
      /* 破案揭晓：这时才把场景切到目标作物的田地 */
      MI.bg.render(crop.scene);
      setTimeout(function () { showKnowledge(crop, c); }, 620);
    } else {
      A.wrong();
      r.wrongStreak++;
      S.recordAnswer(false);
      var card = cards.filter(function (b) { return b.dataset.crop === cropId; })[0];
      if (card) { card.classList.add('is-wrong'); setTimeout(function () { card.classList.remove('is-wrong'); }, 900); }
      /* 连续答错 → 自动给出提示 / 追加线索 */
      var hintEl = document.getElementById('l1-hint');
      if (r.wrongStreak >= 2 && r.clueCount < crop.clues.length) {
        r.clueCount++;
        renderLevel1();
        MI.toast('别急，再给你一条新线索！', 'warn');
        var h2 = document.getElementById('l1-hint');
        if (h2) h2.textContent = c.hintLines[Math.min(r.wrongStreak - 2, c.hintLines.length - 1)];
      } else {
        if (hintEl) hintEl.textContent = c.hintLines[Math.min(r.wrongStreak - 1, c.hintLines.length - 1)];
        MI.say(MI.detectiveLines.wrong, 'sad');
        A.tone(420, 0.12, 'sine', 0.06);
      }
    }
    refreshTop();
    MI.host.refresh();
  }

  function showKnowledge(crop, c) {
    var cid = crop.id;
    MI.modal.open({
      title: '结案！知识卡片',
      badge: '✅',
      size: 'lg',
      dismissible: false,
      body:
        '<div class="know">' +
        '<div class="know__crop">' + cropChip(cid) + '<div class="know__badge">' + crop.badge + '</div></div>' +
        '<p class="know__line">' + U.esc(c.winLine || '答对了！') + '</p>' +
        '<div class="know__grid">' +
        '<div class="know__row"><b>外形特征</b><span>' + U.esc(crop.dimensions.appearance) + '</span></div>' +
        '<div class="know__row"><b>生长习性</b><span>' + U.esc(crop.dimensions.habit) + '</span></div>' +
        '<div class="know__row"><b>分布区域</b><span>' + U.esc(crop.dimensions.region) + '</span></div>' +
        '<div class="know__row"><b>生产加工</b><span>' + U.esc(crop.dimensions.process) + '</span></div>' +
        '<div class="know__row"><b>营养与用途</b><span>' + U.esc(crop.dimensions.nutrition) + '</span></div>' +
        '<div class="know__row"><b>生活关联</b><span>' + U.esc(crop.dimensions.life) + '</span></div>' +
        '</div>' +
        '<div class="know__card">💡 ' + U.esc(c.knowledgeCard) + '</div>' +
        '</div>',
      actions: [
        { label: r_hasNextCase() ? '进入下一案 ▶' : '进入第二关 ▶', cls: 'btn--primary', onClick: function () { MI.actions.nextCase(); } }
      ]
    });
    A.success();
    sayAsync('结案：' + crop.name, c.winLine || MI.detectiveLines.win, 'happy');
  }
  function r_hasNextCase() { return MI.rt.l1.caseIdx < window.CASES.length - 1; }

  /* ============================================================
   * 第二关：嫌疑犯逃跑了！（快问快答 + 追逐）
   * ============================================================ */
  function buildL2Queue() {
    var bank = window.QUESTION_BANK || [];
    var byDiff = { easy: [], medium: [], hard: [] };
    bank.forEach(function (q) { if (byDiff[q.difficulty]) byDiff[q.difficulty].push(q); });
    var plan = [].concat(
      U.shuffle(byDiff.easy).slice(0, 5),
      U.shuffle(byDiff.medium).slice(0, 5),
      U.shuffle(byDiff.hard).slice(0, 2)
    );
    /* 若数量不足则补齐 */
    var rest = U.shuffle(bank.filter(function (q) { return plan.indexOf(q) < 0; }));
    while (plan.length < 12 && rest.length) plan.push(rest.shift());
    return plan;
  }

  function renderLevel2() {
    var r = MI.rt.l2;
    var st = S.get();
    MI.bg.render('road');
    if (!r.current) {
      r.queue = buildL2Queue();
      r.idx = 0;
      r.revealed = 'none';
      r.progress = 0; r.correct = 0; r.wrong = 0; r.used = {};
    }
    var diffLabel = { easy: '简单', medium: '中等', hard: '挑战' };
    var total = r.queue.length || 12;
    var cur = r.current;

    stage().innerHTML =
      '<section class="scene scene--l2">' +
      /* 追逐轨道 */
      '<div class="chase">' +
      '<div class="chase__head">' +
      '<h3>🚨 嫌疑犯逃跑了！</h3>' +
      '<p>答对一题，米侦探就追近一步；连续答对可以冲刺加速！</p>' +
      '</div>' +
      '<div class="chase__track">' +
      '<div class="chase__road"></div>' +
      '<div class="chase__target" style="left:calc(100% - 74px)"><span class="chase__target-emoji">❓</span><small>目标</small></div>' +
      '<div class="chase__hero" id="chase-hero" style="left:' + Math.max(0, Math.min(88, r.progress * 0.88)) + '%"><span class="chase__hero-emoji">🕵️</span><small>米侦探</small></div>' +
      '<div class="chase__gauge"><i id="chase-gauge" style="width:' + Math.min(100, r.progress) + '%"></i></div>' +
      '</div>' +
      '<div class="chase__stat">' +
      '<span>追击进度 <b>' + Math.min(100, Math.round(r.progress)) + '%</b></span>' +
      '</div>' +
      '</div>' +

      /* 题目区 */
      '<div class="qzone">' +
      (cur ? questionHTML(cur, r, diffLabel) : emptyQuestionHTML()) +
      '</div>' +
      '</section>';

    bindQuestion();
    sayAsync('追逐中', MI.detectiveLines.chase, 'wink');
  }

  function emptyQuestionHTML() {
    return '<div class="qcard qcard--empty">' +
      '<div class="qcard__placeholder">' +
      '<div class="qcard__ph-icon">🎤</div>' +
      '<h3>等待主持人出题</h3>' +
      '<p>点击右侧「主持人控制台」的 <b>显示题目</b> 开始这一轮快问快答。<br>也可以先选好难度：简单 / 中等 / 挑战。</p>' +
      '</div></div>';
  }

  function questionHTML(q, r, diffLabel) {
    var showAns = r.revealed === 'answer' || r.revealed === 'explain';
    var opts = q.options.map(function (t, i) {
      var state = '';
      if (showAns) state = (i === q.answer) ? 'correct' : 'dim';
      return optionHTML(i, t, state);
    }).join('');
    return '<div class="qcard" data-diff="' + q.difficulty + '">' +
      '<div class="qcard__top">' +
      '<span class="tag tag--' + q.difficulty + '">' + (diffLabel[q.difficulty] || q.difficulty) + '</span>' +
      '<span class="tag tag--cat">' + U.esc(q.category) + '</span>' +
      '<span class="qcard__no">第 ' + (r.idx + 1) + ' / ' + r.queue.length + ' 题</span>' +
      '</div>' +
      '<h3 class="qcard__q">' + U.esc(q.question) + '</h3>' +
      '<div class="options options--big">' + opts + '</div>' +
      (r.revealed === 'explain'
        ? '<div class="qcard__explain"><div class="qcard__explain-title">📘 答案解析</div><p>' + U.esc(q.explanation) + '</p>' +
          (q.funFact ? '<p class="qcard__fact">✨ 小知识：' + U.esc(q.funFact) + '</p>' : '') +
          '<div class="qcard__source">来源：' + U.esc(q.source || '常识') + ' · 编号 ' + U.esc(q.id) + '</div></div>'
        : '') +
      '</div>';
  }

  function bindQuestion() {
    U.$$('.option', stage()).forEach(function (b) {
      b.addEventListener('click', function () {
        if (MI.rt.l2.revealed !== 'answer' && MI.rt.l2.revealed !== 'explain') {
          MI.toast('请主持人先「显示答案」再公布结果', 'info');
          return;
        }
      });
    });
  }

  /** 抽下一题（按当前难度） */
  function pickQuestion() {
    var r = MI.rt.l2;
    var diff = S.get().l2.difficulty;
    var bank = window.QUESTION_BANK || [];
    var pool = bank.filter(function (q) { return q.difficulty === diff && !r.used[q.id]; });
    if (!pool.length) pool = bank.filter(function (q) { return !r.used[q.id]; });
    if (!pool.length) { r.used = {}; pool = bank.slice(); }
    var q = pool[Math.floor(Math.random() * pool.length)] || null;
    if (q) r.used[q.id] = true;
    return q;
  }

  /* ============================================================
   * 第三关：最终追捕与粮食王国的秘密
   * ============================================================ */
  function renderLevel3() {
    var r = MI.rt.l3;
    var FC = window.FINAL_CASE;
    var task = FC.tasks[r.taskIdx];
    MI.bg.render(task ? (task.type === 'identify' ? 'investigation' : 'granary') : 'night');

    if (!task) { renderTruth(); return; }

    stage().innerHTML =
      '<section class="scene scene--l3">' +
      '<div class="task-head">' +
      '<span class="task-head__no">' + U.esc(task.no) + '</span>' +
      '<h2 class="task-head__title">' + U.esc(task.title) + '</h2>' +
      '<p class="task-head__prompt">' + U.esc(task.prompt) + '</p>' +
      '<div class="task-steps">' + FC.tasks.map(function (t, i) {
        return '<span class="task-step ' + (i === r.taskIdx ? 'is-active' : '') + (i < r.taskIdx ? ' is-done' : '') + '">' + (i + 1) + '</span>';
      }).join('') + '</div>' +
      '</div>' +
      '<div class="task-body" id="task-body">' + taskBodyHTML(task) + '</div>' +
      '</section>';

    bindTask(task);
    sayAsync('最终任务 ' + task.no, MI.detectiveLines.final, 'thinking');
  }

  function taskBodyHTML(task) {
    var r = MI.rt.l3;
    if (task.type === 'identify') {
      return '<div class="clue-list clue-list--compact">' +
        task.clues.map(function (t, i) {
          return '<article class="clue-card clue-card--mini" style="animation-delay:' + (i * 0.1) + 's"><div class="clue-card__no">线索 ' + (i + 1) + '</div><p class="clue-card__text">' + U.esc(t) + '</p></article>';
        }).join('') +
        '</div><div class="candidate-grid candidate-grid--wide" id="candidate-grid">' +
        candidateOrder(task.candidates, MI.rt.l3, task.no).map(function (id) {
          var cc = window.getCrop(id);
          return '<button class="candidate" data-crop="' + cc.id + '" style="--c:' + cc.color + ';--ink:' + cc.accent + '">' +
            '<span class="candidate__emoji">' + cc.emoji + '</span><span class="candidate__name">' + U.esc(cc.name) + '</span></button>';
        }).join('') +
        '</div>';
    }
    if (task.type === 'pairing') {
      var rnd = task.rounds[r.subIdx];
      if (!rnd) return '<p class="task-done">全部配对完成！</p>';
      var gc = window.getCrop(rnd.grain);
      return '<div class="pairing">' +
        '<div class="pairing__left">' + cropChip(rnd.grain) + '<p class="pairing__ask">它可以做成下面哪一组食品？</p></div>' +
        '<div class="pairing__right"><div class="options options--stack">' +
        rnd.options.map(function (t, i) { return optionHTML(i, t, ''); }).join('') +
        '</div></div>' +
        '<div class="pairing__progress">第 ' + (r.subIdx + 1) + ' / ' + task.rounds.length + ' 组</div>' +
        '</div>';
    }
    if (task.type === 'catch' || task.type === 'choose') {
      var items = task.items;
      return '<div class="pick-grid">' +
        items.map(function (it, i) {
          return '<button class="pick" data-i="' + i + '">' +
            '<span class="pick__box"></span>' +
            '<span class="pick__text">' + U.esc(it.text) + '</span></button>';
        }).join('') +
        '</div>' +
        '<div class="pick-bar"><span class="pick-hint" id="pick-hint">已选 <b>0</b> 项 · 需要选出 <b>' + task.answerCount + '</b> 项</span>' +
        '<button class="btn btn--primary" id="btn-pick-submit" disabled>提交答案</button></div>';
    }
    return '';
  }

  function bindTask(task) {
    var r = MI.rt.l3;
    if (task.type === 'identify') {
      U.$$('.candidate', stage()).forEach(function (b) {
        b.addEventListener('click', function () {
          A.click();
          var ok = b.dataset.crop === task.answer;
          if (ok) {
            b.classList.add('is-correct');
            A.correct(); S.recordAnswer(true); S.save();
            finishTask(true, task.explanation, 1);
          } else {
            b.classList.add('is-wrong'); A.wrong(); S.recordAnswer(false);
            setTimeout(function () { b.classList.remove('is-wrong'); }, 900);
            MI.say('再想想「种植面积第一」和「爆米花」这两条线索。', 'sad');
          }
        });
      });
    }
    if (task.type === 'pairing') {
      var rnd = task.rounds[r.subIdx];
      if (!rnd) return;
      U.$$('.option', stage()).forEach(function (b) {
        b.addEventListener('click', function () {
          var i = +b.dataset.opt;
          if (i === rnd.answer) {
            b.classList.add('option--correct'); A.correct();
            S.recordAnswer(true); S.save();
            MI.toast(rnd.explanation, 'ok');
            r.subIdx++;
            if (r.subIdx >= task.rounds.length) finishTask(true, '四组配对全部正确！', task.rounds.length);
            else setTimeout(renderLevel3, 700);
          } else {
            b.classList.add('option--wrong'); A.wrong(); S.recordAnswer(false);
            MI.say('这个不太对哦，再想想它是用什么做的。', 'sad');
          }
        });
      });
    }
    if (task.type === 'catch' || task.type === 'choose') {
      r.picked = [];
      var hint = document.getElementById('pick-hint');
      var submit = document.getElementById('btn-pick-submit');
      U.$$('.pick', stage()).forEach(function (b) {
        b.addEventListener('click', function () {
          A.click();
          var i = +b.dataset.i;
          var pos = r.picked.indexOf(i);
          if (pos >= 0) { r.picked.splice(pos, 1); b.classList.remove('is-picked'); }
          else {
            if (r.picked.length >= task.answerCount) { MI.toast('最多选 ' + task.answerCount + ' 项', 'info'); return; }
            r.picked.push(i); b.classList.add('is-picked');
          }
          hint.innerHTML = '已选 <b>' + r.picked.length + '</b> 项 · 需要选出 <b>' + task.answerCount + '</b> 项';
          submit.disabled = r.picked.length !== task.answerCount;
        });
      });
      submit.addEventListener('click', function () {
        var key = task.type === 'catch' ? 'isTarget' : 'isCorrect';
        var right = 0, wrong = 0, detail = [];
        U.$$('.pick', stage()).forEach(function (b) {
          var i = +b.dataset.i, it = task.items[i], chosen = r.picked.indexOf(i) >= 0;
          if (chosen && it[key]) { b.classList.add('is-right'); right++; }
          else if (chosen && !it[key]) { b.classList.add('is-bad'); wrong++; }
          else if (!chosen && it[key]) { b.classList.add('is-missed'); }
          detail.push('<li class="' + ((chosen === !!it[key]) ? 'ok' : 'no') + '"><b>' + (it[key] ? '✓' : '✗') + '</b> ' + U.esc(it.text) + '<span>' + U.esc(it.why) + '</span></li>');
        });
        S.recordAnswer(wrong === 0 && right === task.answerCount);
        S.save();
        if (wrong === 0 && right === task.answerCount) {
          A.success();
          finishTask(true, '', 1);
        } else {
          A.wrong();
          MI.modal.open({
            title: '再看一看这几项',
            badge: '🔍',
            size: 'lg',
            body: '<ul class="verdict">' + detail.join('') + '</ul>',
            actions: [
              { label: '我再试一次', cls: 'btn--ghost', onClick: function () { renderLevel3(); } },
              { label: '知道了，继续 ▶', cls: 'btn--primary', onClick: function () { finishTask(false, '', 1); } }
            ]
          });
          MI.say('有几项选错了，看看解析再试一次吧！', 'thinking');
        }
      });
    }
  }

  function finishTask(ok, note, count) {
    var r = MI.rt.l3;
    r.taskIdx++;
    r.subIdx = 0;
    var total = window.FINAL_CASE.tasks.length;
    setTimeout(function () {
      if (r.taskIdx >= total) { MI.actions.showTruth(); }
      else { renderLevel3(); MI.host.refresh(); }
    }, ok ? 900 : 300);
    refreshTop(); MI.host.refresh();
  }

  function renderTruth() {
    MI.bg.render('night');
    var FC = window.FINAL_CASE;
    stage().innerHTML =
      '<section class="scene scene--truth">' +
      '<div class="truth">' +
      '<div class="truth__rays"></div>' +
      '<h2 class="truth__title">' + U.esc(FC.truthTitle) + '</h2>' +
      '<div class="truth__grid">' +
      FC.truthItems.map(function (t, i) {
        return '<article class="truth__item" style="animation-delay:' + (i * 0.22) + 's">' +
          '<div class="truth__icon">' + t.icon + '</div>' +
          '<h4>' + U.esc(t.title) + '</h4>' +
          '<p>' + U.esc(t.text) + '</p></article>';
      }).join('') +
      '</div>' +
      '<blockquote class="truth__quote">“' + U.esc(FC.closingLine) + '”<cite>—— 米侦探</cite></blockquote>' +
      '<button class="btn btn--gold btn--lg" id="btn-to-result">🏅 查看通关结算</button>' +
      '</div>' +
      '</section>';
    A.badge();
    sayAsync('真相揭晓', FC.closingLine, 'happy');
    document.getElementById('btn-to-result').addEventListener('click', function () {
      A.click(); MI.actions.goPhase('result');
    });
    MI.host.refresh();
  }

  /* ============================================================
   * 结算
   * ============================================================ */
  function renderResult() {
    MI.bg.render('granary');
    var st = S.get();
    var FC = window.FINAL_CASE;

    var awards = st.clueAwards || [];
    var clueLogHTML = awards.length
      ? '<div class="result__cluelog"><h3>纸质线索卡发放记录</h3><ul>' +
        awards.map(function (a) {
          var c = (window.PAPER_CLUES || []).filter(function (x) { return x.id === a.clueId; })[0];
          return '<li><b>' + (c ? U.esc(c.no) : a.clueId) + '</b> → ' + U.esc(a.recipient || '未指定同学') + '</li>';
        }).join('') + '</ul></div>'
      : '';

    stage().innerHTML =
      '<section class="scene scene--result">' +
      '<div class="result">' +
      '<div class="result__head">' +
      '<div class="result__medal">🏅</div>' +
      '<h2>通关成功 · 粮食王国守护者</h2>' +
      '<p>米侦探已完成全部调查任务，向你敬礼！</p>' +
      '</div>' +
      '<div class="result__stats">' +
      '<div class="rstat"><b>' + st.solved.length + '/' + window.CASES.length + '</b><span>识别案件告破</span></div>' +
      '<div class="rstat"><b>' + awards.length + '</b><span>已发放线索卡</span></div>' +
      '</div>' +
      clueLogHTML +
      '<div class="result__know"><h3>今天学到的知识</h3><div class="know-cards">' +
      FC.summary.map(function (s) {
        return '<div class="know-mini"><span>' + s.icon + '</span><div><b>' + U.esc(s.title) + '</b><p>' + U.esc(s.text) + '</p></div></div>';
      }).join('') + '</div></div>' +
      '<div class="result__acts">' +
      '<button class="btn btn--primary" id="btn-again">🔁 再玩一次</button>' +
      '<button class="btn btn--ghost" id="btn-print">🖨️ 打印纸质线索卡</button>' +
      '<button class="btn btn--gold" id="btn-export">📄 导出成绩单</button>' +
      '</div>' +
      '</div>' +
      '</section>';

    document.getElementById('btn-again').addEventListener('click', function () { A.click(); MI.actions.restart(); });
    document.getElementById('btn-print').addEventListener('click', function () { A.click(); MI.actions.openPrint(); });
    document.getElementById('btn-export').addEventListener('click', function () { A.click(); MI.actions.exportReport(); });

    A.badge();
    setTimeout(function () { A.success(); }, 400);
    MI.say('结案！' + MI.detectiveLines.closing, 'star', 9000);
    MI.host.refresh();
  }

  /* ============================================================
   * 开场
   * ============================================================ */
  function renderIntro() {
    MI.bg.render('investigation');
    stage().innerHTML =
      '<section class="scene scene--intro">' +
      '<div class="intro">' +
      '<div class="intro__case">' +
      '<div class="intro__stamp">紧急通知</div>' +
      '<h1 class="intro__title">米侦探<small>粮食王国大追捕</small></h1>' +
      '<p class="intro__sub">紧急通知！粮食王国发现一名神秘访客。它身上藏着许多秘密，只有真正聪明的小侦探才能找到它！</p>' +
      '<div class="intro__meta">' +
      '<span>👦 适合年级：小学中高年级</span><span>🎯 三关闯关</span><span>🖥️ 大屏演示 / 主持人控场</span>' +
      '</div>' +
      '<div class="intro__acts">' +
      '<button class="btn btn--gold btn--lg" id="btn-start">▶ 开始游戏</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>';

    document.getElementById('btn-start').addEventListener('click', function () {
      A.resume(); A.click();
      MI.actions.goPhase('level1');
    });
    sayAsync('开场', MI.detectiveLines.intro, 'normal');
  }

  /* ============================================================
   * 场景注册 + 控制器
   * ============================================================ */
  var RENDER = {
    intro: renderIntro,
    level1: renderLevel1,
    level2: renderLevel2,
    level3: renderLevel3,
    result: renderResult
  };

  function render() {
    var st = S.get();
    var fn = RENDER[st.phase] || renderIntro;
    fn();
    refreshTop();
    document.body.dataset.phase = st.phase;
    document.getElementById('app').classList.toggle('is-paused', !!st.paused);
    if (MI.host) MI.host.refresh();
  }
  MI.render = render;

  /* ============================================================
   * 单屏适配：把当前场景整体缩放，保证内容始终落在可视区域内（不滚动）
   * 仅在内容超过可视高度/宽度时才缩小，大屏投影保持原始尺寸。
   * ============================================================ */
  function fitStage() {
    var st = stage();
    var scene = st.querySelector('.scene');
    if (!scene) return;
    /* 先复位，量取真实布局尺寸 */
    scene.style.transform = '';
    scene.style.transformOrigin = '';
    var cs = getComputedStyle(st);
    var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    var availH = st.clientHeight - padY;
    var availW = st.clientWidth - padX;
    var needH = scene.scrollHeight;
    var needW = scene.scrollWidth;
    if (needH <= 0 || needW <= 0) return;
    /* 内容装不下 → 等比缩小；内容明显偏小 → 适度放大，让画面更饱满（上限 1.18 倍，避免过度拉伸） */
    var scale = Math.min(availH / needH, availW / needW, 1.18);
    if (Math.abs(scale - 1) > 0.01) {
      scene.style.transformOrigin = 'top center';
      scene.style.transform = 'scale(' + scale.toFixed(3) + ')';
    }
  }
  MI.fit = fitStage;

  var _fitRAF = null;
  function scheduleFit() {
    if (_fitRAF) cancelAnimationFrame(_fitRAF);
    _fitRAF = requestAnimationFrame(function () { requestAnimationFrame(fitStage); });
  }
  MI.scheduleFit = scheduleFit;

  MI.actions = {
    goPhase: function (phase) {
      var st = S.get();
      if (phase === 'level1') {
        MI.rt.l1 = { caseIdx: 0, clueCount: 0, wrongStreak: 0, solved: false, phase: 'brief', correctFirstTry: 0 };
        st.solved = [];
      }
      if (phase === 'level2') { MI.rt.l2 = { idx: 0, revealed: 'none', wrongStreak: 0, rightStreak: 0, progress: 0, correct: 0, wrong: 0, used: {}, current: null }; }
      if (phase === 'level3') { MI.rt.l3 = { taskIdx: 0, subIdx: 0, picked: [], results: [] }; }
      st.phase = phase;
      S.save();
      render();
    },

    /* ---- 第一关 ---- */
    revealClue: function () {
      var r = MI.rt.l1; var c = window.CASES[r.caseIdx]; var crop = window.getCrop(c.target);
      if (r.phase !== 'investigate' || r.clueCount >= crop.clues.length) {
        MI.toast('线索已经全部揭示，请选择候选对象', 'info'); return;
      }
      r.clueCount++;
      renderLevel1(); refreshTop(); MI.host.refresh();
    },
    showAnswer: function () {
      var r = MI.rt.l1; var c = window.CASES[r.caseIdx]; var crop = window.getCrop(c.target);
      if (crop.clues.length > r.clueCount) r.clueCount = crop.clues.length;
      renderLevel1();
      var cards = U.$$('.candidate', stage());
      cards.forEach(function (b) { b.classList.add(b.dataset.crop === c.target ? 'is-correct' : 'is-dim'); });
      if (S.get().solved.indexOf(c.id) < 0) S.get().solved.push(c.id);
      S.save();
      MI.bg.render(crop.scene);          /* 公布答案同样揭晓田地场景 */
      setTimeout(function () { showKnowledge(crop, c); }, 500);
      refreshTop(); MI.host.refresh();
    },
    nextCase: function () {
      var r = MI.rt.l1;
      if (r.caseIdx < window.CASES.length - 1) {
        r.caseIdx++; r.clueCount = 0; r.wrongStreak = 0; r.solved = false; r.phase = 'brief';
        renderLevel1(); refreshTop(); MI.host.refresh();
      } else {
        MI.actions.goPhase('level2');
      }
    },
    skipCase: function () {
      var r = MI.rt.l1; var c = window.CASES[r.caseIdx];
      if (S.get().solved.indexOf(c.id) < 0) S.get().solved.push(c.id);
      S.save();
      MI.actions.nextCase();
    },

    /* ---- 第二关 ---- */
    showQuestion: function () {
      var r = MI.rt.l2;
      var q = r.current || pickQuestion();
      r.current = q;
      r.revealed = 'question';
      r.idx = (r.correct + r.wrong);
      renderLevel2(); refreshTop(); MI.host.refresh();
      A.chase();
    },
    revealAnswer: function () {
      var r = MI.rt.l2;
      if (!r.current) { MI.toast('请先「显示题目」', 'info'); return; }
      r.revealed = 'answer'; renderLevel2(); MI.host.refresh();
      A.reveal();
    },
    revealExplain: function () {
      var r = MI.rt.l2;
      if (!r.current) { MI.toast('请先「显示题目」', 'info'); return; }
      r.revealed = 'explain'; renderLevel2(); MI.host.refresh();
    },
    nextQuestion: function () {
      var r = MI.rt.l2;
      if (r.correct + r.wrong >= r.queue.length) { MI.actions.goPhase('level3'); return; }
      r.current = null; r.revealed = 'none';
      MI.actions.showQuestion();
    },
    mark: function (ok) {
      var r = MI.rt.l2;
      if (!r.current) { MI.toast('请先「显示题目」', 'info'); return; }
      var q = r.current;
      S.recordAnswer(ok);
      /* 难度自适应 */
      if (ok) {
        r.correct++; r.rightStreak++; r.wrongStreak = 0;
        r.progress = Math.min(100, r.progress + (q.difficulty === 'hard' ? 18 : q.difficulty === 'medium' ? 14 : 11));
        A.correct();
        S.get().l2.difficulty = MI.ai.adjustDifficulty(r.wrongStreak, r.rightStreak);
      } else {
        r.wrong++; r.wrongStreak++; r.rightStreak = 0;
        r.progress = Math.max(0, r.progress - 3);
        A.wrong();
        S.get().l2.difficulty = MI.ai.adjustDifficulty(r.wrongStreak, r.rightStreak);
      }
      S.save();
      /* 触发纸质线索奖励检查 */
      MI.host.checkClueReward();
      /* 是否已追到目标 */
      if (r.progress >= 100) {
        setTimeout(function () {
          MI.modal.open({
            title: '追上了！嫌疑犯被逮住啦',
            badge: '🏃',
            body: '<p class="modal__p">米侦探一路追击，终于把目标堵在了粮仓门口！接下来进入<b>最终追捕</b>，我们要揭开粮食王国真正的秘密。</p>',
            actions: [{ label: '进入第三关 ▶', cls: 'btn--primary', onClick: function () { MI.actions.goPhase('level3'); } }]
          });
          A.success();
        }, 500);
        renderLevel2(); refreshTop(); MI.host.refresh();
        return;
      }
      if (r.correct + r.wrong >= r.queue.length) {
        MI.toast('本轮题目已完成，可以进入第三关', 'ok');
      }
      renderLevel2(); refreshTop(); MI.host.refresh();
    },
    setDifficulty: function (d) {
      S.get().l2.difficulty = d;
      S.save(); MI.renderLevel2Sync();
      MI.toast('难度已切换为：' + ({ easy: '简单', medium: '中等', hard: '挑战' }[d]), 'ok');
    },
    revealL2: function () { MI.rt.l2.revealed = 'answer'; renderLevel2(); },
    resetL2: function () { MI.actions.goPhase('level2'); },

    /* ---- 第三关 ---- */
    showTruth: function () {
      MI.rt.l3.taskIdx = window.FINAL_CASE.tasks.length;
      MI.bg.render('night');
      renderTruth();
      refreshTop();
    },
    nextTask: function () {
      var r = MI.rt.l3;
      if (r.taskIdx < window.FINAL_CASE.tasks.length) { r.taskIdx++; r.subIdx = 0; }
      renderLevel3(); refreshTop(); MI.host.refresh();
    },

    /* ---- 全局 ---- */
    pause: function () {
      S.get().paused = true; S.save();
      document.getElementById('app').classList.add('is-paused');
      document.getElementById('pause-veil').classList.add('show');
      MI.host.refresh();
    },
    resume: function () {
      S.get().paused = false; S.save();
      document.getElementById('app').classList.remove('is-paused');
      document.getElementById('pause-veil').classList.remove('show');
      MI.host.refresh();
    },
    togglePause: function () { S.get().paused ? MI.actions.resume() : MI.actions.pause(); },
    restart: function () {
      MI.modal.open({
        title: '重新开始？', badge: '⚠️',
        body: '<p class="modal__p">当前进度会被清空，确定要重新开始吗？</p>',
        actions: [
          { label: '取消', cls: 'btn--ghost' },
          { label: '确定重开', cls: 'btn--danger', onClick: function () { MI.actions.doRestart(); } }
        ]
      });
    },
    doRestart: function () {
      S.clear(); S.reset();
      MI.modal.close();
      MI.actions.goPhase('intro');
      MI.toast('已重新开始', 'ok');
    },
    openPrint: function () { window.open('print.html', '_blank'); },
    exportReport: function () {
      var st = S.get();
      var lines = [];
      lines.push('《米侦探：粮食王国大追捕》课堂记录');
      lines.push('时间：' + new Date().toLocaleString('zh-CN'));
      lines.push('—'.repeat(30));
      lines.push('识别案件告破：' + st.solved.length + ' / ' + window.CASES.length);
      lines.push('已发放线索卡：' + st.paperClues.length + ' 张');
      (st.clueAwards || []).forEach(function (a) {
        var c = (window.PAPER_CLUES || []).filter(function (x) { return x.id === a.clueId; })[0];
        lines.push('  ' + (c ? c.no : a.clueId) + ' → ' + (a.recipient || '未指定同学'));
      });
      lines.push('—'.repeat(30));
      lines.push('今天学到的知识：');
      window.FINAL_CASE.summary.forEach(function (s) { lines.push('  ' + s.title + '：' + s.text); });
      var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '米侦探-课堂记录.txt';
      a.click();
      MI.toast('课堂记录已导出', 'ok');
    },
    toggleHost: function () {
      var p = document.getElementById('host-panel');
      p.classList.toggle('open');
      document.body.classList.toggle('host-open', p.classList.contains('open'));
      /* 控制台展开/收起会改变舞台可用宽度，过渡结束后再适配一次 */
      scheduleFit();
      setTimeout(scheduleFit, 360);
    },
    toggleSound: function () {
      var m = A.toggle();
      var b = document.getElementById('btn-sound');
      b.textContent = m ? '🔇' : '🔊';
      MI.toast(m ? '已静音' : '已开启音效', 'info');
    }
  };

  MI.renderLevel2Sync = function () { if (S.get().phase === 'level2') renderLevel2(); };

  /* ============================================================
   * 启动
   * ============================================================ */
  MI.boot = function () {
    /* 顶栏按钮 */
    document.getElementById('btn-sound').addEventListener('click', function () { MI.actions.toggleSound(); });
    document.getElementById('btn-fullscreen').addEventListener('click', function () { A.click(); MI.toggleFullscreen(); });
    document.getElementById('btn-host').addEventListener('click', function () { A.click(); MI.actions.toggleHost(); });
    document.getElementById('btn-print-top').addEventListener('click', function () { A.click(); MI.actions.openPrint(); });
    document.getElementById('btn-restart-top').addEventListener('click', function () { A.click(); MI.actions.restart(); });

    /* 暂停遮罩 */
    document.getElementById('pause-veil').addEventListener('click', function () { MI.actions.resume(); });

    /* 状态变化 → 刷新 */
    S.on(function (state, type) {
      if (type === 'score' || type === 'change' || type === 'reset') refreshTop();
    });

    /* 键盘快捷键（主持人用） */
    document.addEventListener('keydown', function (e) {
      if (MI.modal.isOpen()) {
        if (e.key === 'Escape') MI.modal.close();
        return;
      }
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      var st = S.get();
      switch (e.key) {
        case ' ': e.preventDefault(); MI.actions.togglePause(); break;
        case 'ArrowRight':
          e.preventDefault();
          if (st.phase === 'level1') MI.actions.revealClue();
          else if (st.phase === 'level2') MI.actions.showQuestion();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (st.phase === 'level2') MI.actions.nextQuestion();
          break;
        case 'h': case 'H': MI.actions.toggleHost(); break;
        case 'f': case 'F': MI.toggleFullscreen(); break;
        case 'm': case 'M': MI.actions.toggleSound(); break;
      }
    });

    /* 首次交互解锁音频 */
    document.addEventListener('pointerdown', function once() {
      A.resume();
      document.removeEventListener('pointerdown', once);
    });

    S.load();
    MI.setDetective('normal');

    /* 单屏适配：场景内容变化 / 窗口尺寸变化 / 字体就绪后重新缩放 */
    var fitObs = new MutationObserver(scheduleFit);
    fitObs.observe(stage(), { childList: true, subtree: true });
    window.addEventListener('resize', scheduleFit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
    /* 启动后留一两帧兜底，确保首屏已适配 */
    scheduleFit(); setTimeout(scheduleFit, 350);

    render();
    document.getElementById('boot-veil').classList.add('gone');
    console.log('%c米侦探 · 游戏控制器已就绪', 'color:#3E8E4A;font-weight:bold');
  };
})();
