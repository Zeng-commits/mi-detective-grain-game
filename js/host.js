/* 《米侦探：粮食王国大追捕》主持人控制台
 * 面向小学宣讲现场的控场面板：节奏控制、难度切换、纸质线索发放、关卡跳转。
 * 所有操作都可鼠标点击，并配有键盘快捷键提示，方便老师一只手操作、一只手讲课。
 */
(function () {
  'use strict';
  var MI = window.MI;
  var U = MI.util, A = MI.audio, S = MI.state;

  /* 纸质线索发放门槛：答对第 N 题时发放下一张 */
  var CLUE_THRESHOLD = [3, 5, 7, 9];

  function panel() { return document.getElementById('host-panel'); }
  function sec(id) { return document.getElementById(id); }

  function btn(label, cls, attr, disabled) {
    return '<button class="hbtn ' + (cls || '') + '" ' + (attr || '') + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }

  /** 线索卡卡片（弹窗内展示；award 存在时显示已发给哪位同学） */
  function clueCardHTML(clue, award) {
    var who = award
      ? '<div class="clue-reward__who">已发给：<b>' + U.esc(award.recipient || '未指定同学') + '</b></div>'
      : '';
    return '<div class="clue-reward">' +
      '<div class="clue-reward__card">' +
      '<div class="clue-reward__head"><span>' + U.esc(clue.no) + '</span><b>' + U.esc(clue.code) + '</b></div>' +
      '<div class="clue-reward__body">' +
      '<div class="clue-reward__icon">' + clue.icon + '</div>' +
      '<h4>' + U.esc(clue.title) + '</h4>' +
      '<p>' + U.esc(clue.content) + '</p>' +
      '<div class="clue-reward__hint">提示：' + U.esc(clue.hint) + '</div>' +
      '</div>' +
      '<div class="clue-reward__foot">粮食王国 · 米侦探专用线索　|　' + U.esc((clue.tags || []).join(' · ')) + '</div>' +
      '</div>' + who +
      '</div>';
  }

  var host = {
    /* ---------- 刷新整个面板 ---------- */
    refresh: function () {
      var p = panel();
      if (!p) return;
      var st = S.get();

      /* 全局 */
      sec('hp-global').innerHTML =
        '<div class="hp__row">' +
        btn('▶ 开始游戏', 'hbtn--gold', 'data-a="start"', st.phase !== 'intro') +
        btn(st.paused ? '▶ 继续' : '⏸ 暂停', 'hbtn--blue', 'data-a="pause"', st.phase === 'intro') +
        '</div>' +
        '<div class="hp__row">' +
        btn('⛶ 全屏投影', '', 'data-a="fullscreen"') +
        btn(A.muted ? '🔇 已静音' : '🔊 音效开', '', 'data-a="sound"') +
        '</div>' +
        '<div class="hp__row">' +
        btn('🖨️ 打印线索卡', '', 'data-a="print"') +
        btn('🔁 重新开始', 'hbtn--warn', 'data-a="restart"') +
        '</div>' +
        '<div class="hp__row">' +
        btn('🏁 结束并结算', 'hbtn--danger', 'data-a="finish"') +
        '</div>' +
        '<p class="hp__note">快捷键：空格=暂停/继续　←=下一条线索/出题　↓=下一题　H=控制台　F=全屏　M=静音</p>';

      /* 当前阶段上下文 */
      sec('hp-context').innerHTML = this.contextHTML(st);

      /* 纸质线索 */
      sec('hp-clues').innerHTML = this.clueHTML(st);

      /* 关卡跳转 */
      sec('hp-jump').innerHTML =
        '<div class="hp__row">' +
        btn('① 第一关', st.phase === 'level1' ? 'hbtn--on' : '', 'data-a="goto" data-p="level1"') +
        btn('② 第二关', st.phase === 'level2' ? 'hbtn--on' : '', 'data-a="goto" data-p="level2"') +
        '</div>' +
        '<div class="hp__row">' +
        btn('③ 第三关', st.phase === 'level3' ? 'hbtn--on' : '', 'data-a="goto" data-p="level3"') +
        btn('🏅 结算页', st.phase === 'result' ? 'hbtn--on' : '', 'data-a="goto" data-p="result"') +
        '</div>';

      this.bind();
      this.exportAPI();
    },

    contextHTML: function (st) {
      if (st.phase === 'intro') {
        return '<p class="hp__note">点击「开始游戏」进入第一关。本游戏为全班互动宣讲，无需分组、不做计分。</p>';
      }
      if (st.phase === 'level1') {
        var r = MI.rt.l1, c = window.CASES[r.caseIdx] || {};
        var crop = window.getCrop(c.target) || { clues: [] };
        return '<div class="hp__case">案件 ' + (r.caseIdx + 1) + '/' + window.CASES.length + '　' + U.esc(c.title || '') + '</div>' +
          '<div class="hp__row">' +
          btn('＋ 下一条线索', 'hbtn--blue', 'data-a="clue"', r.clueCount >= crop.clues.length) +
          btn('📖 公布答案', 'hbtn--gold', 'data-a="answer"') +
          '</div>' +
          '<div class="hp__row">' +
          btn('案件通过 ▶', '', 'data-a="nextcase"') +
          btn('跳过本案件', 'hbtn--warn', 'data-a="skipcase"') +
          '</div>' +
          '<p class="hp__note">已揭示线索 ' + r.clueCount + ' / ' + crop.clues.length +
          '　连续答错 2 次会自动追加线索并给出提示。</p>';
      }
      if (st.phase === 'level2') {
        var l2 = MI.rt.l2;
        var d = st.l2.difficulty;
        return '<div class="hp__case">第 ' + (l2.correct + l2.wrong + (l2.current ? 1 : 0)) + ' 题　进度 ' + Math.min(100, Math.round(l2.progress)) + '%</div>' +
          '<div class="hp__row">' +
          btn('🎤 显示题目', 'hbtn--blue', 'data-a="q"') +
          btn('✅ 显示答案', 'hbtn--gold', 'data-a="a"', !l2.current) +
          '</div>' +
          '<div class="hp__row">' +
          btn('📘 显示解析', '', 'data-a="e"', !l2.current) +
          btn('➡ 下一题', 'hbtn--on', 'data-a="nq"', !l2.current) +
          '</div>' +
          '<div class="hp__sub">判定学生回答</div>' +
          '<div class="hp__row">' +
          btn('答对了 ✓', 'hbtn--ok', 'data-a="ok"', !l2.current) +
          btn('答错了 ✗', 'hbtn--warn', 'data-a="no"', !l2.current) +
          '</div>' +
          '<div class="hp__sub">题目难度</div>' +
          '<div class="hp__row hp__row--tight">' +
          btn('简单', d === 'easy' ? 'hbtn--on' : '', 'data-a="diff" data-d="easy"') +
          btn('中等', d === 'medium' ? 'hbtn--on' : '', 'data-a="diff" data-d="medium"') +
          btn('挑战', d === 'hard' ? 'hbtn--on' : '', 'data-a="diff" data-d="hard"') +
          '</div>' +
          '<p class="hp__note">流程：显示题目 → 学生举手 → 显示答案 → 显示解析 → 判「答对了」推进追击。<br>不做任何计分，答对越多，米侦探追得越近。</p>';
      }
      if (st.phase === 'level3') {
        var r3 = MI.rt.l3;
        return '<div class="hp__case">任务 ' + Math.min(r3.taskIdx + 1, window.FINAL_CASE.tasks.length) + '/' + window.FINAL_CASE.tasks.length + '</div>' +
          '<div class="hp__row">' +
          btn('跳过本任务 ▶', '', 'data-a="nexttask"') +
          btn('🔓 直接揭晓真相', 'hbtn--gold', 'data-a="truth"') +
          '</div>' +
          '<p class="hp__note">本关由孩子上台操作答题，主持人负责引导与加分。</p>';
      }
      if (st.phase === 'result') {
        return '<div class="hp__row">' + btn('🔁 再来一局', 'hbtn--gold', 'data-a="restart"') + '</div>' +
          '<p class="hp__note">可以导出成绩单、打印纸质线索卡分发给同学。</p>';
      }
      return '';
    },

    clueHTML: function (st) {
      var mine = window.PAPER_CLUES || [];
      var unlocked = st.clueUnlocked || [];
      var awards = st.clueAwards || [];
      var ready = 0;
      var cards = mine.map(function (c, i) {
        var award = awards.filter(function (a) { return a.clueId === c.id; })[0];
        var isUnlocked = unlocked.indexOf(c.id) >= 0;
        var cls = award ? 'is-got' : (isUnlocked ? 'is-ready' : 'is-locked');
        if (isUnlocked && !award) ready++;
        var state = award
          ? ('已发给 ' + U.esc(award.recipient || '未指定同学'))
          : (isUnlocked ? '待发放' : ('答对第 ' + CLUE_THRESHOLD[i] + ' 题解锁'));
        return '<button class="clue-mini ' + cls + '" data-a="clue-award" data-c="' + c.id + '" title="点击发放">' +
          '<span class="clue-mini__icon">' + c.icon + '</span>' +
          '<span class="clue-mini__no">' + U.esc(c.no) + '</span>' +
          '<span class="clue-mini__state">' + state + '</span></button>';
      }).join('');
      return '<div class="hp__cluebar"><span>已发放 <b>' + awards.length + '</b> / ' + mine.length + ' 张' +
        (ready ? '<i class="hp__ready">待发放 ' + ready + '</i>' : '') + '</span>' +
        '<button class="gbtn" data-a="cluereset">重置记录</button></div>' +
        '<div class="hp__cluegrid">' + cards + '</div>' +
        '<div class="hp__row">' + btn('🖨️ 打印全部线索卡', 'hbtn--blue', 'data-a="print"') + '</div>' +
        '<p class="hp__note">系统只负责提示「有线索了」，<b>发给哪位同学由老师决定</b>。<br>' +
        '答对第 ' + CLUE_THRESHOLD.join(' / ') + ' 题时自动解锁，点击卡片填写接收同学即可发放。</p>';
    },

    /* ---------- 事件绑定 ---------- */
    bind: function () {
      var p = panel();
      if (!p || p.dataset.bound === '1') return;
      p.dataset.bound = '1';
      p.addEventListener('click', function (e) {
        var t = e.target.closest('[data-a]');
        if (!t || !p.contains(t)) return;
        var a = t.dataset.a;
        A.click();
        switch (a) {
          case 'start': MI.actions.goPhase('level1'); break;
          case 'pause': MI.actions.togglePause(); break;
          case 'fullscreen': MI.toggleFullscreen(); break;
          case 'sound': MI.actions.toggleSound(); host.refresh(); break;
          case 'print': MI.actions.openPrint(); break;
          case 'restart': MI.actions.restart(); break;
          case 'finish': MI.actions.goPhase('result'); break;
          case 'goto': MI.actions.goPhase(t.dataset.p); break;
          case 'clue': MI.actions.revealClue(); break;
          case 'answer': MI.actions.showAnswer(); break;
          case 'nextcase': MI.actions.nextCase(); break;
          case 'skipcase': MI.actions.skipCase(); break;
          case 'q': MI.actions.showQuestion(); break;
          case 'a': MI.actions.revealAnswer(); break;
          case 'e': MI.actions.revealExplain(); break;
          case 'nq': MI.actions.nextQuestion(); break;
          case 'ok': MI.actions.mark(true); break;
          case 'no': MI.actions.mark(false); break;
          case 'diff': MI.actions.setDifficulty(t.dataset.d); break;
          case 'nexttask': MI.actions.nextTask(); break;
          case 'truth': MI.actions.showTruth(); break;
          case 'clue-award': host.awardClue(t.dataset.c); break;
          case 'cluereset':
            S.get().clueAwards = [];
            S.get().paperClues = [];
            S.save(); host.refresh(); MI.refreshTop(); MI.toast('线索发放记录已重置', 'ok'); break;
        }
      });
      document.getElementById('hp-close').addEventListener('click', function () { MI.actions.toggleHost(); });
    },

    /* ---------- 纸质线索：解锁（游戏只管提示） ---------- */
    checkClueReward: function () {
      var st = S.get();
      if (!st.clueUnlocked) st.clueUnlocked = [];
      var newly = [];
      (window.PAPER_CLUES || []).forEach(function (clue, i) {
        var th = CLUE_THRESHOLD[i];
        if (th == null) return;
        if (MI.rt.l2.correct >= th && st.clueUnlocked.indexOf(clue.id) < 0) {
          st.clueUnlocked.push(clue.id);
          newly.push(clue);
        }
      });
      if (!newly.length) return;
      S.save();
      host.refresh();
      MI.refreshTop();
      /* 只提示「有线索了」——发给哪位同学完全由主持人决定 */
      var names = newly.map(function (c) { return c.no; }).join('、');
      MI.hostHint('🎁 ' + names + ' 已解锁，请老师决定发给哪位同学', 5200);
      MI.toast('🎁 出现新线索，等待老师发放', 'ok');
      if (MI.say) MI.say('叮——' + names + ' 出现啦！老师，请把线索卡发给您想奖励的同学。', 'happy', 6000);
    },

    /* ---------- 纸质线索：发放（完全由主持人决定发给哪位同学） ---------- */
    awardClue: function (clueId) {
      var st = S.get();
      var clue = (window.PAPER_CLUES || []).filter(function (c) { return c.id === clueId; })[0];
      if (!clue) return;
      var award = (st.clueAwards || []).filter(function (a) { return a.clueId === clueId; })[0];

      /* 最近发放过的接收人，方便老师快速选择 */
      var recent = (st.clueAwards || []).map(function (a) { return a.recipient; })
        .filter(function (n, i, arr) { return n && arr.indexOf(n) === i; }).slice(0, 8);
      var datalist = recent.length
        ? '<datalist id="clue-recipient-list">' + recent.map(function (n) { return '<option value="' + U.esc(n) + '"></option>'; }).join('') + '</datalist>'
        : '';

      MI.modal.open({
        title: '这张线索卡发给哪位同学？',
        badge: clue.icon,
        size: 'lg',
        body:
          '<p class="modal__p" style="text-align:center;margin-bottom:16px">系统只负责提示「有线索了」，' +
          '<b>发给哪位同学由老师决定</b>。</p>' +
          clueCardHTML(clue, award) +
          '<div class="clue-recipient">' +
          '<label for="clue-recipient">接收同学（姓名 / 学号）</label>' +
          '<input id="clue-recipient" class="clue-recipient__input" list="clue-recipient-list" placeholder="例如：小明 / A03" value="' + U.esc(award ? (award.recipient || '') : '') + '" />' +
          datalist +
          '</div>',
        actions: [
          { label: '取消', cls: 'btn--ghost' },
          { label: '确认发放 ✅', cls: 'btn--gold', close: false, onClick: function () {
              var name = (document.getElementById('clue-recipient') || {}).value || '';
              host.confirmAward(clue, name.trim());
            } }
        ]
      });
    },

    /* 确认发放给某位同学 */
    confirmAward: function (clue, recipient) {
      var st = S.get();
      st.clueAwards = st.clueAwards || [];
      var rec = {
        clueId: clue.id,
        recipient: recipient || '未指定同学',
        at: Date.now()
      };
      var idx = -1;
      st.clueAwards.forEach(function (a, i) { if (a.clueId === clue.id) idx = i; });
      if (idx >= 0) st.clueAwards[idx] = rec; else st.clueAwards.push(rec);
      st.paperClues = st.clueAwards.map(function (a) { return a.clueId; });
      S.save();
      host.refresh();
      MI.refreshTop();
      A.success();

      MI.modal.open({
        title: '线索卡已发放',
        badge: '✅',
        size: 'lg',
        body:
          '<p class="modal__p" style="text-align:center;margin-bottom:16px">已把 <b>' + U.esc(clue.no) + '</b>' +
          ' 发给 <b>' + U.esc(rec.recipient) + '</b>，请把纸质卡片交给他 / 她。</p>' +
          clueCardHTML(clue, rec),
        actions: [
          { label: '🖨️ 打印线索卡', cls: 'btn--gold', onClick: function () { MI.actions.openPrint(); } },
          { label: '继续游戏', cls: 'btn--primary' }
        ]
      });
    },

    /* ---------- 暴露给外部（打印页/自动化） ---------- */
    exportAPI: function () {
      window.MI_HOST_API = {
        awardClue: host.awardClue,
        paperClues: function () { return window.PAPER_CLUES; },
        awarded: function () { return S.get().paperClues; }
      };
    }
  };

  MI.host = host;

  /* 暴露打印所需数据 */
  MI.printClues = function () { return (window.PAPER_CLUES || []); };
})();
