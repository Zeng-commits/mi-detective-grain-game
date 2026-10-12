/* 《米侦探：粮食王国大追捕》美术资产层
 * 全部使用内联 SVG 绘制：米侦探形象（含表情系统）+ 9 个差异化场景背景。
 * 零外部图片依赖 —— 断网、拷 U 盘、投影仪直连都能正常显示。
 */
(function () {
  'use strict';
  var MI = window.MI = window.MI || {};

  /* ============================================================
   * 一、米侦探形象（可切换表情）
   * expr: normal | happy | thinking | surprised | sad | wink | star
   * ============================================================ */
  function eyes(expr) {
    if (expr === 'happy' || expr === 'star') {
      /* 弯弯笑眼 + 星星点缀 */
      var spark = expr === 'star'
        ? '<text x="20" y="64" font-size="22">✨</text><text x="104" y="62" font-size="24">✨</text>'
        : '<text x="26" y="70" font-size="18">✨</text><text x="102" y="68" font-size="18">✨</text>';
      return '' +
        '<path d="M42 92 q12 -15 24 0" stroke="#3A3350" stroke-width="4.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M74 92 q12 -15 24 0" stroke="#3A3350" stroke-width="4.6" fill="none" stroke-linecap="round"/>' +
        spark;
    }
    if (expr === 'wink') {
      return '' +
        '<ellipse cx="54" cy="92" rx="10.5" ry="12.5" fill="#fff" stroke="#3A3350" stroke-width="2.4"/>' +
        '<circle cx="55" cy="94" r="6.4" fill="#2E2A40"/><circle cx="52.5" cy="91" r="2.4" fill="#fff"/>' +
        '<path d="M74 94 q12 -15 24 0" stroke="#3A3350" stroke-width="4.6" fill="none" stroke-linecap="round"/>';
    }
    if (expr === 'surprised') {
      return '' +
        '<circle cx="54" cy="90" r="13" fill="#fff" stroke="#3A3350" stroke-width="2.4"/>' +
        '<circle cx="54" cy="90" r="6.6" fill="#2E2A40"/><circle cx="51" cy="86.5" r="2.4" fill="#fff"/>' +
        '<circle cx="86" cy="90" r="13" fill="#fff" stroke="#3A3350" stroke-width="2.4"/>' +
        '<circle cx="86" cy="90" r="6.6" fill="#2E2A40"/><circle cx="83" cy="86.5" r="2.4" fill="#fff"/>';
    }
    if (expr === 'sad') {
      return '' +
        '<path d="M44 87 q10 -6 20 0" stroke="#3A3350" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M76 87 q10 -6 20 0" stroke="#3A3350" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="54" cy="94" rx="8" ry="9" fill="#fff" stroke="#3A3350" stroke-width="2.2"/>' +
        '<circle cx="54" cy="95" r="4.4" fill="#2E2A40"/>' +
        '<ellipse cx="86" cy="94" rx="8" ry="9" fill="#fff" stroke="#3A3350" stroke-width="2.2"/>' +
        '<circle cx="86" cy="95" r="4.4" fill="#2E2A40"/>';
    }
    /* normal / thinking —— 大眼睛 + 高光，更可爱 */
    var lx = expr === 'thinking' ? 52 : 55;
    var rx = expr === 'thinking' ? 84 : 87;
    return '' +
      '<ellipse cx="54" cy="92" rx="10.5" ry="12.5" fill="#fff" stroke="#3A3350" stroke-width="2.4"/>' +
      '<circle cx="' + lx + '" cy="94" r="6.4" fill="#2E2A40"/>' +
      '<circle cx="' + (lx - 2.5) + '" cy="91" r="2.4" fill="#fff"/>' +
      '<ellipse cx="86" cy="92" rx="10.5" ry="12.5" fill="#fff" stroke="#3A3350" stroke-width="2.4"/>' +
      '<circle cx="' + rx + '" cy="94" r="6.4" fill="#2E2A40"/>' +
      '<circle cx="' + (rx - 2.5) + '" cy="91" r="2.4" fill="#fff"/>';
  }

  function mouth(expr) {
    if (expr === 'happy' || expr === 'star') {
      return '<path d="M58 110 q12 13 24 0 q-12 7 -24 0 Z" fill="#C75B5B"/>' +
             '<path d="M64 118 q6 4 12 0" fill="#E8899A"/>';
    }
    if (expr === 'surprised') return '<ellipse cx="70" cy="112" rx="7" ry="9" fill="#C75B5B"/>';
    if (expr === 'sad') return '<path d="M60 116 q10 -9 20 0" stroke="#C75B5B" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
    if (expr === 'thinking') return '<path d="M62 112 h16" stroke="#C75B5B" stroke-width="3.6" stroke-linecap="round"/>';
    return '<path d="M61 110 q9 9 18 0" stroke="#C75B5B" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
  }

  function extra(expr) {
    if (expr === 'thinking') return '<text x="106" y="56" font-size="24">💭</text>';
    if (expr === 'surprised') return '<text x="106" y="54" font-size="26">❗</text>';
    if (expr === 'sad') return '<path d="M118 110 q4 12 0 18 q-4 -6 0 -18 Z" fill="#7FC4E8"/>';
    return '';
  }

  /** 生成米侦探 SVG。size 为像素宽度 */
  MI.detectiveSVG = function (expr, size) {
    expr = expr || 'normal';
    var w = size || 150;
    var h = Math.round(w * 170 / 140);
    return '' +
      '<svg class="detective-svg" viewBox="0 0 140 170" width="' + w + '" height="' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="米侦探">' +
      '<defs>' +
      '<linearGradient id="grainBody" x1="0" y1="0" x2="0.25" y2="1">' +
      '<stop offset="0" stop-color="#FFFDF6"/><stop offset="0.5" stop-color="#FBF1D9"/><stop offset="1" stop-color="#ECD9AE"/>' +
      '</linearGradient>' +
      '<linearGradient id="hatGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#5468B0"/><stop offset="1" stop-color="#39477E"/>' +
      '</linearGradient>' +
      '<radialGradient id="glassGrad" cx="0.35" cy="0.3" r="0.85">' +
      '<stop offset="0" stop-color="#EAF7FF" stop-opacity="0.95"/><stop offset="1" stop-color="#A9D8F0" stop-opacity="0.4"/>' +
      '</radialGradient>' +
      '</defs>' +
      /* 地面阴影 */
      '<ellipse cx="70" cy="158" rx="36" ry="7" fill="rgba(28,34,60,.18)"/>' +
      /* 侦探披风（身后） */
      '<path d="M36 102 C24 118 22 134 30 146 L48 138 Z" fill="url(#hatGrad)"/>' +
      '<path d="M104 102 C116 118 118 134 110 146 L92 138 Z" fill="url(#hatGrad)"/>' +
      /* 身体（米粒） */
      '<path d="M70 32 C98 46 108 74 108 98 C108 122 92 142 70 142 C48 142 32 122 32 98 C32 74 42 46 70 32 Z" fill="url(#grainBody)" stroke="#C9AE7A" stroke-width="2.6"/>' +
      /* 身体高光 */
      '<ellipse cx="54" cy="68" rx="12" ry="20" fill="#ffffff" opacity="0.28" transform="rotate(-18 54 68)"/>' +
      /* 蝴蝶结（领结） */
      '<path d="M70 126 L57 119 L57 133 Z" fill="#D9534F"/>' +
      '<path d="M70 126 L83 119 L83 133 Z" fill="#D9534F"/>' +
      '<rect x="66" y="121" width="8" height="10" rx="2" fill="#B23A37"/>' +
      /* 腮红 */
      '<ellipse cx="42" cy="106" rx="8" ry="5.2" fill="#F79A9A" opacity="0.55"/>' +
      '<ellipse cx="98" cy="106" rx="8" ry="5.2" fill="#F79A9A" opacity="0.55"/>' +
      /* 表情 */
      '<g>' + eyes(expr) + '</g>' +
      '<g>' + mouth(expr) + '</g>' +
      /* 侦探帽（猎鹿帽：宽帽檐 + 圆顶 + 金帽带） */
      '<path d="M26 54 Q70 45 114 54 Q70 63 26 54 Z" fill="#2F3C6E"/>' +
      '<path d="M42 54 C42 22 98 22 98 54 Z" fill="url(#hatGrad)" stroke="#2C3560" stroke-width="2"/>' +
      '<path d="M42 49 Q70 56 98 49 L98 55 Q70 62 42 55 Z" fill="#FFC94A"/>' +
      /* 放大镜（右手举起） */
      '<g transform="rotate(12 122 122)">' +
      '<circle cx="122" cy="122" r="17.5" fill="url(#glassGrad)" stroke="#E8B44A" stroke-width="5"/>' +
      '<circle cx="122" cy="122" r="17.5" fill="none" stroke="#C08A1E" stroke-width="1.6"/>' +
      '<path d="M115 112 q7 -6 15 -2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>' +
      '<rect x="133" y="135" width="9" height="26" rx="4.5" transform="rotate(-45 137 148)" fill="#8A5A22"/>' +
      '</g>' +
      /* 小手 */
      '<circle cx="103" cy="133" r="8" fill="#FBF1D9" stroke="#C9AE7A" stroke-width="2.2"/>' +
      '<g>' + extra(expr) + '</g>' +
      '</svg>';
  };

  /* ============================================================
   * 二、场景背景（viewBox 1600x900，slice 铺满）
   * ============================================================ */
  var W = 1600, H = 900;
  /* 云朵 */
  function cloud(x, y, s, op) {
    s = s || 1; op = op == null ? 0.85 : op;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" opacity="' + op + '">' +
      '<ellipse cx="0" cy="0" rx="58" ry="26" fill="#fff"/><ellipse cx="42" cy="8" rx="42" ry="20" fill="#fff"/>' +
      '<ellipse cx="-40" cy="8" rx="38" ry="18" fill="#fff"/><ellipse cx="6" cy="-16" rx="34" ry="22" fill="#fff"/></g>';
  }
  function sun(x, y, r, color) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 2.1) + '" fill="' + color + '" opacity="0.18"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 1.45) + '" fill="' + color + '" opacity="0.28"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '"/>';
  }
  /* 稻/麦穗小图标 */
  function spike(x, y, h, col, curve) {
    var stem = '<path d="M' + x + ' ' + y + ' q' + (curve || 0) + ' ' + (-h / 2) + ' 0 ' + (-h) + '" stroke="' + col + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    var grains = '';
    for (var i = 0; i < 5; i++) {
      var yy = y - h * (0.42 + i * 0.13);
      var xx = x + (curve || 0) * (0.42 + i * 0.13);
      grains += '<ellipse cx="' + (xx - 8) + '" cy="' + yy + '" rx="6" ry="9" transform="rotate(-24 ' + (xx - 8) + ' ' + yy + ')" fill="' + col + '"/>' +
        '<ellipse cx="' + (xx + 8) + '" cy="' + yy + '" rx="6" ry="9" transform="rotate(24 ' + (xx + 8) + ' ' + yy + ')" fill="' + col + '"/>';
    }
    return stem + grains;
  }

  var SVGS = {
    /* ---------------- 稻田 ---------------- */
    ricefield: function () {
      var s = '';
      s += sun(1310, 170, 62, '#FFD97D');
      s += cloud(240, 150, 1.1) + cloud(900, 110, 0.9, 0.75) + cloud(1420, 240, 0.8, 0.6);
      s += '<path d="M0 430 Q260 360 520 420 Q780 480 1040 415 Q1300 355 1600 425 L1600 620 L0 620 Z" fill="#8FBF8A"/>';
      s += '<path d="M0 480 Q300 430 620 480 Q940 530 1260 480 Q1430 455 1600 480 L1600 900 L0 900 Z" fill="#6FAF6B"/>';
      /* 水田 */
      s += '<rect x="0" y="530" width="1600" height="250" fill="#9FD3E8" opacity="0.75"/>';
      s += '<g stroke="#CBEBF5" stroke-width="3" opacity="0.7">' +
        '<path d="M120 600 H420"/><path d="M700 640 H1000"/><path d="M1120 590 H1420"/><path d="M300 700 H640"/>' +
        '<path d="M860 720 H1180"/><path d="M60 760 H360"/></g>';
      /* 田埂 */
      s += '<g stroke="#7FA96A" stroke-width="16" stroke-linecap="round" opacity="0.9">' +
        '<path d="M0 560 H1600"/><path d="M0 660 H1600"/><path d="M0 770 H1600"/></g>';
      /* 稻丛 */
      var clusters = [[90, 590], [330, 585], [560, 592], [800, 586], [1040, 592], [1290, 585], [1500, 590],
        [200, 700], [470, 695], [730, 702], [990, 696], [1250, 700], [1450, 695],
        [140, 810], [420, 805], [680, 812], [940, 806], [1200, 810], [1470, 806]];
      clusters.forEach(function (c) {
        s += '<g opacity="0.95">' +
          '<path d="M' + c[0] + ' ' + c[1] + ' q-8 -46 4 -78" stroke="#4E9A55" stroke-width="5" fill="none" stroke-linecap="round"/>' +
          '<path d="M' + (c[0] + 18) + ' ' + c[1] + ' q4 -50 -6 -80" stroke="#5FAA63" stroke-width="5" fill="none" stroke-linecap="round"/>' +
          '<path d="M' + (c[0] + 36) + ' ' + c[1] + ' q10 -44 -2 -72" stroke="#4E9A55" stroke-width="5" fill="none" stroke-linecap="round"/>' +
          '<ellipse cx="' + (c[0] + 6) + '" cy="' + (c[1] - 80) + '" rx="7" ry="14" fill="#E8C259"/>' +
          '<ellipse cx="' + (c[0] + 12) + '" cy="' + (c[1] - 82) + '" rx="7" ry="14" fill="#F2C744"/>' +
          '<ellipse cx="' + (c[0] + 34) + '" cy="' + (c[1] - 74) + '" rx="7" ry="14" fill="#E8C259"/>' +
          '</g>';
      });
      s += '<path d="M0 900 L0 830 Q200 800 400 830 Q650 866 900 828 Q1200 786 1600 836 L1600 900 Z" fill="#4E8A4A"/>';
      return s;
    },
    /* ---------------- 麦田 ---------------- */
    wheatfield: function () {
      var s = '';
      s += sun(300, 160, 68, '#FFE08A');
      s += cloud(700, 130, 1) + cloud(1250, 190, 0.85, 0.7) + cloud(1450, 110, 0.7, 0.55);
      s += '<path d="M0 420 Q300 350 600 410 Q900 470 1200 405 Q1400 365 1600 410 L1600 900 L0 900 Z" fill="#D9B44A"/>';
      /* 风车 */
      s += '<g transform="translate(1330,300)" opacity="0.9">' +
        '<path d="M-18 130 L-10 -30 L10 -30 L18 130 Z" fill="#C9C3B0"/>' +
        '<circle cx="0" cy="-30" r="12" fill="#8A5A22"/>' +
        '<g stroke="#F5EFDD" stroke-width="9" stroke-linecap="round" opacity="0.95">' +
        '<path d="M0 -30 L0 -132"/><path d="M0 -30 L92 -68"/><path d="M0 -30 L-92 -68"/><path d="M0 -30 L0 72"/>' +
        '</g></g>';
      s += '<g stroke="#B8862B" stroke-width="14" stroke-linecap="round" opacity="0.55">' +
        '<path d="M0 520 H1600"/><path d="M0 640 H1600"/><path d="M0 760 H1600"/></g>';
      for (var r = 0; r < 4; r++) {
        var baseY = 540 + r * 118, col = r < 2 ? '#F0C84C' : '#E0AE33';
        for (var i = 0; i < 26; i++) {
          var x = 30 + i * 62 + (r % 2) * 22;
          s += spike(x, baseY, 96 + (r % 3) * 8, col, (i % 2 ? 4 : -4));
        }
      }
      s += '<path d="M0 900 L0 850 Q300 820 600 850 Q1000 886 1300 844 Q1470 822 1600 848 L1600 900 Z" fill="#C79A2E"/>';
      return s;
    },
    /* ---------------- 玉米地 ---------------- */
    cornfield: function () {
      var s = '';
      s += sun(1380, 150, 58, '#FFE9A3');
      s += cloud(300, 130, 1.05) + cloud(820, 175, 0.8, 0.7) + cloud(1180, 105, 0.85, 0.65);
      s += '<path d="M0 400 Q320 340 640 395 Q960 450 1280 390 Q1440 360 1600 395 L1600 900 L0 900 Z" fill="#8FC36E"/>';
      s += '<rect x="0" y="470" width="1600" height="430" fill="#79B75C" opacity="0.55"/>';
      var stalk = function (x, baseY, sc, op) {
        var h = 330 * sc;
        var out = '<g transform="translate(' + x + ',' + baseY + ') scale(' + sc + ')" opacity="' + op + '">';
        out += '<path d="M0 0 L0 ' + (-h) + '" stroke="#3F8A45" stroke-width="16" stroke-linecap="round"/>';
        for (var i = 0; i < 5; i++) {
          var yy = -h * (0.22 + i * 0.16);
          var dir = i % 2 ? 1 : -1;
          out += '<path d="M0 ' + yy + ' q' + (dir * 62) + ' -26 ' + (dir * 104) + ' 10 q' + (dir * -50) + ' 26 ' + (dir * -104) + ' -10 Z" fill="' + (i % 2 ? '#4E9C52' : '#3F8A45') + '"/>';
        }
        out += '<path d="M0 ' + (-h * 0.5) + ' q26 6 34 40 q-24 8 -34 -40 Z" fill="#F2C744"/>';
        out += '<ellipse cx="14" cy="' + (-h * 0.5 - 8) + '" rx="16" ry="34" transform="rotate(14 14 ' + (-h * 0.5 - 8) + ')" fill="#F2C744" stroke="#D19E10" stroke-width="3"/>';
        out += '<path d="M0 ' + (-h) + ' q-10 -34 4 -58" stroke="#3F8A45" stroke-width="6" fill="none" stroke-linecap="round"/>';
        out += '<path d="M0 ' + (-h) + ' q14 -30 -2 -54" stroke="#4E9C52" stroke-width="6" fill="none" stroke-linecap="round"/>';
        out += typeof spike === 'function' ? spike(2, -h, 46, '#E8C259', 3) : '';
        out += '</g>';
        return out;
      };
      for (var i = 0; i < 9; i++) s += stalk(60 + i * 190, 500, 0.62, 0.6);
      for (var j = 0; j < 7; j++) s += stalk(150 + j * 240, 640, 0.88, 0.85);
      for (var k = 0; k < 5; k++) s += stalk(120 + k * 360, 880, 1.18, 1);
      s += '<path d="M0 900 L0 872 Q400 850 800 872 Q1200 894 1600 872 L1600 900 Z" fill="#5E9948"/>';
      return s;
    },
    /* ---------------- 大豆田 ---------------- */
    soyfield: function () {
      var s = '';
      s += sun(320, 150, 56, '#FFEBA8');
      s += cloud(760, 140, 1) + cloud(1330, 180, 0.8, 0.65);
      s += '<path d="M0 410 Q340 350 680 405 Q1020 460 1360 400 Q1480 378 1600 405 L1600 900 L0 900 Z" fill="#93C07A"/>';
      s += '<g stroke="#6FA457" stroke-width="13" stroke-linecap="round" opacity="0.5">' +
        '<path d="M0 540 H1600"/><path d="M0 680 H1600"/><path d="M0 820 H1600"/></g>';
      var bush = function (x, y, sc, op) {
        var o = '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')" opacity="' + op + '">';
        o += '<path d="M0 0 L0 -60" stroke="#4E8A43" stroke-width="10" stroke-linecap="round"/>';
        for (var i = 0; i < 6; i++) {
          var a = (i / 6) * Math.PI * 2;
          var rx = 46 + (i % 3) * 8, ry = 26;
          o += '<ellipse cx="' + (Math.cos(a) * 26) + '" cy="' + (-66 + Math.sin(a) * 18) + '" rx="' + rx + '" ry="' + ry + '" fill="' + (i % 2 ? '#7FB863' : '#6FA457') + '"/>';
        }
        o += '<g fill="#D9A94E" stroke="#A87A22" stroke-width="2">' +
          '<ellipse cx="-30" cy="-58" rx="9" ry="13" transform="rotate(-25 -30 -58)"/>' +
          '<ellipse cx="26" cy="-62" rx="9" ry="13" transform="rotate(22 26 -62)"/>' +
          '<ellipse cx="0" cy="-88" rx="9" ry="13"/>' +
          '</g>';
        o += '</g>';
        return o;
      };
      for (var i = 0; i < 8; i++) s += bush(60 + i * 205, 560, 0.7, 0.65);
      for (var j = 0; j < 6; j++) s += bush(180 + j * 270, 700, 0.95, 0.88);
      for (var k = 0; k < 4; k++) s += bush(220 + k * 400, 880, 1.3, 1);
      s += '<path d="M0 900 L0 868 Q400 846 800 868 Q1200 890 1600 868 L1600 900 Z" fill="#5E9948"/>';
      return s;
    },
    /* ---------------- 马铃薯地 ---------------- */
    potatofield: function () {
      var s = '';
      s += sun(1290, 175, 54, '#FFE7B0');
      s += cloud(420, 140, 1) + cloud(1020, 170, 0.85, 0.7);
      s += '<path d="M0 400 Q360 345 720 400 Q1080 455 1440 398 L1600 400 L1600 900 L0 900 Z" fill="#A8B87A"/>';
      /* 垄沟 */
      for (var r = 0; r < 4; r++) {
        var y = 520 + r * 108, sc = 0.55 + r * 0.16;
        s += '<g transform="translate(0,' + y + ')">';
        s += '<path d="M0 20 Q400 -26 800 20 Q1200 66 1600 20 L1600 200 L0 200 Z" fill="#8D6B45" opacity="' + (0.75 + r * 0.06) + '"/>';
        s += '<path d="M0 20 Q400 -26 800 20 Q1200 66 1600 20" stroke="#6E5231" stroke-width="8" fill="none" opacity="0.6"/>';
        s += '</g>';
        for (var i = 0; i < 9; i++) {
          var x = 80 + i * 190;
          var py = y + 8 + Math.sin(i) * 6;
          s += '<g transform="translate(' + x + ',' + py + ') scale(' + sc + ')">' +
            '<ellipse cx="0" cy="0" rx="52" ry="20" fill="#6FA457"/>' +
            '<ellipse cx="-30" cy="-14" rx="26" ry="16" fill="#7FB863"/>' +
            '<ellipse cx="26" cy="-16" rx="28" ry="17" fill="#7FB863"/>' +
            '<circle cx="-8" cy="-28" r="7" fill="#FFF8F0" stroke="#D9C7A8" stroke-width="2"/>' +
            '<circle cx="22" cy="-32" r="6" fill="#FFF8F0" stroke="#D9C7A8" stroke-width="2"/>' +
            '<circle cx="-8" cy="-28" r="2.6" fill="#F0C24A"/>' +
            '<circle cx="22" cy="-32" r="2.2" fill="#F0C24A"/>' +
            '</g>';
        }
      }
      s += '<path d="M0 900 L0 866 Q400 844 800 866 Q1200 888 1600 866 L1600 900 Z" fill="#7E8E52"/>';
      return s;
    },
    /* ---------------- 粮食王国村庄（中性场景：不出现任何具体作物，避免剧透目标） ---------------- */
    village: function () {
      var s = '';
      s += sun(1320, 150, 58, '#FFE9A3');
      s += cloud(250, 135, 1.05) + cloud(830, 168, 0.85, 0.72) + cloud(1400, 225, 0.72, 0.5);
      /* 远山 */
      s += '<path d="M0 396 Q230 292 470 372 Q690 444 910 364 Q1170 268 1410 378 Q1520 420 1600 392 L1600 540 L0 540 Z" fill="#A6CBAB"/>';
      s += '<path d="M0 438 Q300 366 620 428 Q940 490 1260 424 Q1450 388 1600 428 L1600 570 L0 570 Z" fill="#86B78E"/>';
      /* 草地 */
      s += '<path d="M0 528 Q400 486 800 518 Q1200 552 1600 512 L1600 900 L0 900 Z" fill="#8FC26F"/>';
      /* 小河 */
      s += '<path d="M0 596 Q280 578 500 616 Q700 650 900 618 Q1150 580 1600 610" stroke="#9FD3E8" stroke-width="30" fill="none" opacity="0.8" stroke-linecap="round"/>';
      s += '<path d="M0 596 Q280 578 500 616 Q700 650 900 618 Q1150 580 1600 610" stroke="#D6EEF8" stroke-width="10" fill="none" opacity="0.7" stroke-linecap="round"/>';
      /* 村口小路 */
      s += '<path d="M690 540 Q766 660 660 772 Q604 846 648 900 L872 900 Q826 838 892 752 Q972 646 886 540 Z" fill="#D8CFB8" opacity="0.95"/>';
      /* 农舍 */
      function house(x, y, sc) {
        return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
          '<rect x="-58" y="-52" width="116" height="86" fill="#F3E6CC" stroke="#C9B08A" stroke-width="3"/>' +
          '<path d="M-76 -52 L0 -110 L76 -52 Z" fill="#C0643E" stroke="#9A4A2A" stroke-width="3"/>' +
          '<rect x="-50" y="-30" width="30" height="26" fill="#9FD3E8" stroke="#7FA9BE" stroke-width="3"/>' +
          '<rect x="16" y="-34" width="30" height="68" fill="#8A5A34"/>' +
          '<rect x="60" y="-96" width="16" height="26" fill="#B98F52"/>' +
          '<circle cx="68" cy="-104" r="9" fill="#E8EAEE" opacity="0.75"/>' +
          '</g>';
      }
      function tree(x, y, sc) {
        return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
          '<rect x="-11" y="-64" width="22" height="70" fill="#8A6533" rx="5"/>' +
          '<circle cx="0" cy="-96" r="46" fill="#5FA85F"/><circle cx="-36" cy="-74" r="32" fill="#4E9C52"/>' +
          '<circle cx="36" cy="-76" r="34" fill="#6FB86A"/></g>';
      }
      s += house(360, 560, 0.9) + house(1180, 548, 0.95) + house(760, 512, 0.62);
      s += tree(180, 600, 0.9) + tree(1010, 588, 0.95) + tree(1460, 610, 0.85) + tree(560, 520, 0.5);
      /* 栅栏 */
      for (var i = 0; i < 9; i++) {
        var fx = 40 + i * 190;
        s += '<g opacity="0.9"><rect x="' + fx + '" y="680" width="12" height="72" fill="#B98F52" rx="4"/>' +
          '<rect x="' + (fx - 34) + '" y="698" width="80" height="10" fill="#C9A164" rx="5"/></g>';
      }
      /* 飞鸟 */
      s += '<g stroke="#5A6BA8" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55">' +
        '<path d="M560 180 q16 -12 32 0"/><path d="M612 156 q14 -10 28 0"/><path d="M660 196 q12 -9 24 0"/></g>';
      /* 前景 */
      s += '<path d="M0 900 L0 848 Q400 826 800 848 Q1200 870 1600 848 L1600 900 Z" fill="#7BB05C"/>';
      return s;
    },
    /* ---------------- 粮仓 ---------------- */
    granary: function () {
      var s = '';
      s += '<rect x="0" y="0" width="1600" height="900" fill="#E9D6AF"/>';
      s += '<rect x="0" y="0" width="1600" height="470" fill="#DCC79C"/>';
      /* 木梁 */
      s += '<g fill="#B98F52" opacity="0.9">' +
        '<rect x="0" y="120" width="1600" height="34"/><rect x="0" y="330" width="1600" height="30"/>' +
        '<rect x="240" y="0" width="34" height="470"/><rect x="800" y="0" width="34" height="470"/><rect x="1330" y="0" width="34" height="470"/>' +
        '</g>';
      /* 吊灯 */
      s += '<g transform="translate(800,60)"><path d="M0 0 L0 60" stroke="#7A5B2E" stroke-width="5"/>' +
        '<path d="M-40 60 L40 60 L26 108 L-26 108 Z" fill="#C08A1E"/>' +
        '<circle cx="0" cy="112" r="12" fill="#FFE9A8"/><circle cx="0" cy="112" r="52" fill="#FFE9A8" opacity="0.22"/></g>';
      /* 麻袋堆 */
      function sack(x, y, sc, rot) {
        return '<g transform="translate(' + x + ',' + y + ') rotate(' + (rot || 0) + ') scale(' + sc + ')">' +
          '<path d="M-52 0 q-8 -60 10 -96 q10 -16 42 -16 q32 0 42 16 q18 36 10 96 Z" fill="#E4D2A8" stroke="#BFA475" stroke-width="4"/>' +
          '<path d="M-24 -112 q24 -14 48 0 q-8 12 -24 12 q-16 0 -24 -12 Z" fill="#C9AE7A"/>' +
          '<text x="0" y="-30" font-size="34" text-anchor="middle" fill="#8A6A34">粮</text>' +
          '</g>';
      }
      s += sack(300, 620, 1.05, -6) + sack(500, 660, 1.25, 3) + sack(1160, 640, 1.1, 5) + sack(1380, 690, 1.3, -3);
      s += sack(700, 700, 1.4, 0) + sack(960, 720, 1.5, 2);
      /* 谷堆 */
      s += '<path d="M-40 780 Q400 620 840 780 Z" fill="#E8C259"/>';
      s += '<path d="M-40 780 Q400 620 840 780" stroke="#C79A2E" stroke-width="6" fill="none"/>';
      s += '<path d="M760 830 Q1100 690 1520 830 Z" fill="#DEB44A"/>';
      s += '<path d="M760 830 Q1100 690 1520 830" stroke="#C79A2E" stroke-width="6" fill="none"/>';
      s += '<rect x="0" y="800" width="1600" height="100" fill="#A87C42"/>';
      s += '<g stroke="#8A6533" stroke-width="4" opacity="0.7"><path d="M0 830 H1600"/><path d="M0 862 H1600"/></g>';
      return s;
    },
    /* ---------------- 乡村道路（追逐） ---------------- */
    road: function () {
      var s = '';
      s += sun(800, 130, 60, '#FFE79A');
      s += cloud(240, 150, 1) + cloud(1320, 130, 0.9, 0.75);
      s += '<path d="M0 380 Q400 320 800 370 Q1200 420 1600 365 L1600 520 L0 520 Z" fill="#8EBF79"/>';
      s += '<rect x="0" y="470" width="1600" height="430" fill="#96C67E"/>';
      /* 路面（透视） */
      s += '<path d="M640 470 L960 470 L1520 900 L80 900 Z" fill="#C9BFA6"/>';
      s += '<path d="M660 480 L940 480 L1480 890 L120 890 Z" fill="#D8CFB8"/>';
      s += '<g stroke="#F5EFDD" stroke-width="12" stroke-dasharray="46 46" opacity="0.9">' +
        '<path d="M800 500 L800 880"/></g>';
      /* 栅栏 */
      for (var i = 0; i < 11; i++) {
        var x = 20 + i * 150;
        var sc = 1 + (i > 5 ? 0.9 : 0);
        s += '<g opacity="0.95"><rect x="' + x + '" y="420" width="12" height="90" fill="#B98F52" rx="4"/>' +
          '<rect x="' + (x - 40) + '" y="440" width="92" height="11" fill="#C9A164" rx="5"/></g>';
      }
      /* 树 */
      function tree(x, y, sc) {
        return '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
          '<rect x="-13" y="-70" width="26" height="76" fill="#8A6533" rx="6"/>' +
          '<circle cx="0" cy="-104" r="52" fill="#5FA85F"/><circle cx="-40" cy="-80" r="36" fill="#4E9C52"/>' +
          '<circle cx="40" cy="-82" r="38" fill="#6FB86A"/></g>';
      }
      s += tree(120, 470, 0.85) + tree(1500, 480, 0.9) + tree(300, 440, 0.6);
      /* 粮仓远景 */
      s += '<g transform="translate(1180,300) scale(0.9)" opacity="0.9">' +
        '<rect x="-90" y="-20" width="180" height="140" fill="#C08A4E"/>' +
        '<path d="M-110 -20 L0 -110 L110 -20 Z" fill="#A8722E"/>' +
        '<rect x="-34" y="30" width="68" height="90" fill="#7A4E1E"/>' +
        '<rect x="-14" y="-10" width="28" height="26" fill="#FFF3D0"/></g>';
      return s;
    },
    /* ---------------- 米侦探调查室 ---------------- */
    investigation: function () {
      var s = '';
      s += '<rect x="0" y="0" width="1600" height="900" fill="#232C55"/>';
      s += '<rect x="0" y="0" width="1600" height="900" fill="url(#sky-investigation)"/>';
      /* 窗 */
      s += '<g opacity="0.9"><rect x="1150" y="90" width="330" height="230" rx="14" fill="#0F1738" stroke="#5C6BA8" stroke-width="8"/>' +
        '<path d="M1315 90 V320 M1150 205 H1480" stroke="#5C6BA8" stroke-width="8"/>' +
        '<circle cx="1420" cy="145" r="26" fill="#FFD166"/><circle cx="1230" cy="170" r="4" fill="#fff"/><circle cx="1270" cy="140" r="3" fill="#fff"/><circle cx="1200" cy="255" r="3" fill="#fff"/></g>';
      /* 桌面 */
      s += '<path d="M0 640 L1600 640 L1600 900 L0 900 Z" fill="#3A2E22"/>';
      s += '<rect x="0" y="640" width="1600" height="26" fill="#8A6533"/>';
      /* 档案板 */
      s += '<rect x="70" y="90" width="620" height="400" rx="16" fill="#6B4B2A" stroke="#4E3418" stroke-width="10"/>';
      s += '<rect x="96" y="116" width="568" height="348" rx="10" fill="#8A6533"/>';
      var papers = [[130, 150, 150, -4], [320, 142, 150, 3], [510, 152, 130, -2], [160, 320, 150, 4], [346, 330, 170, -3], [540, 322, 116, 3]];
      papers.forEach(function (p) {
        s += '<g transform="translate(' + p[0] + ',' + p[1] + ') rotate(' + p[3] + ')">' +
          '<rect width="' + p[2] + '" height="140" fill="#FBF6E8" stroke="#D8C9A8" stroke-width="2"/>' +
          '<circle cx="' + (p[2] / 2) + '" cy="10" r="7" fill="#E4572E"/>' +
          '<g stroke="#B9AE93" stroke-width="4" stroke-linecap="round">' +
          '<path d="M16 40 H' + (p[2] - 16) + '"/><path d="M16 62 H' + (p[2] - 24) + '"/><path d="M16 84 H' + (p[2] - 40) + '"/>' +
          '</g></g>';
      });
      /* 台灯 */
      s += '<g transform="translate(1230,430)"><path d="M0 210 L0 60" stroke="#5C6BA8" stroke-width="10"/>' +
        '<path d="M-60 60 L60 60 L36 -8 L-36 -8 Z" fill="#4C5B96"/>' +
        '<ellipse cx="0" cy="212" rx="52" ry="14" fill="#4C5B96"/>' +
        '<path d="M-58 62 L58 62 L300 250 L-300 250 Z" fill="#FFE9A8" opacity="0.16"/></g>';
      /* 桌面道具 */
      s += '<ellipse cx="400" cy="760" rx="120" ry="30" fill="#5C4020" opacity="0.6"/>';
      s += '<circle cx="380" cy="740" r="60" fill="#DCEBF7" opacity="0.35" stroke="#E8B44A" stroke-width="10"/>';
      s += '<rect x="430" y="756" width="18" height="76" rx="9" transform="rotate(30 439 794)" fill="#8A5A22"/>';
      s += '<g transform="translate(880,720)"><rect x="-90" y="-10" width="180" height="120" rx="10" fill="#7A5230"/>' +
        '<rect x="-70" y="10" width="140" height="80" rx="6" fill="#FBF6E8"/>' +
        '<g stroke="#B9AE93" stroke-width="5" stroke-linecap="round"><path d="M-52 36 H52"/><path d="M-52 58 H30"/></g></g>';
      s += '<g stroke="#FFC94A" stroke-width="5" fill="none" opacity="0.85">' +
        '<path d="M120 520 q40 30 0 60"/><path d="M150 540 q30 22 0 44"/></g>';
      return s;
    },
    /* ---------------- 星空真相 ---------------- */
    night: function () {
      var s = '';
      s += '<rect x="0" y="0" width="1600" height="900" fill="#161C3E"/>';
      s += '<circle cx="1250" cy="180" r="130" fill="#FFF3C4" opacity="0.12"/>';
      s += '<circle cx="1250" cy="180" r="86" fill="#FFF3C4" opacity="0.22"/>';
      s += '<circle cx="1250" cy="180" r="62" fill="#FFF6D8"/>';
      s += '<circle cx="1228" cy="160" r="12" fill="#EFE2B8" opacity="0.5"/><circle cx="1268" cy="204" r="9" fill="#EFE2B8" opacity="0.45"/>';
      var stars = [[120, 90], [260, 170], [420, 70], [560, 200], [700, 110], [880, 60], [980, 230], [1400, 100], [1500, 260], [80, 300], [340, 330], [620, 320], [1080, 340], [1480, 60], [200, 240]];
      stars.forEach(function (p, i) {
        var r = 2 + (i % 3);
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '" fill="#FFFFFF" opacity="' + (0.55 + (i % 4) * 0.12) + '"/>' +
          '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r * 3) + '" fill="#FFFFFF" opacity="0.08"/>';
      });
      /* 远山剪影 */
      s += '<path d="M0 620 Q220 500 440 600 Q640 690 860 590 Q1080 490 1300 600 Q1450 672 1600 600 L1600 900 L0 900 Z" fill="#20264C"/>';
      s += '<path d="M0 700 Q300 640 620 700 Q960 764 1290 700 Q1450 668 1600 700 L1600 900 L0 900 Z" fill="#171C3C"/>';
      /* 粮田剪影 */
      for (var i = 0; i < 24; i++) {
        var x = 20 + i * 68;
        s += '<g opacity="0.85" transform="translate(' + x + ',770) scale(1.5)">' + spike(0, 0, 90, '#0F1330', (i % 2 ? 4 : -4)) + '</g>';
      }
      /* 萤火虫 */
      var flies = [[200, 620], [520, 560], [860, 600], [1180, 540], [1420, 640], [340, 500], [1000, 480]];
      flies.forEach(function (p, i) {
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#FFE082" opacity="0.9"/>' +
          '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="22" fill="#FFE082" opacity="0.15"/>';
      });
      return s;
    }
  };

  /* 场景主色映射（供 CSS 变量注入） */
  var SCENE_THEME = {
    ricefield: ['#BFE9FF', '#E8F7D9'],
    wheatfield: ['#FFE9B8', '#FFF6DD'],
    cornfield: ['#CDEBFF', '#EAF9D6'],
    soyfield: ['#D6ECFF', '#F0F7DC'],
    potatofield: ['#DCEBFF', '#F2F6E0'],
    village: ['#CFE9FF', '#EAF6DC'],
    granary: ['#F3E3C3', '#FBF2DF'],
    road: ['#CFE9FF', '#FFF3D9'],
    investigation: ['#2A3566', '#4A5A9E'],
    night: ['#1B2350', '#3B2E63']
  };

  MI.bg = {
    render: function (sceneKey) {
      var layer = document.getElementById('bg-layer');
      if (!layer) return;
      var key = SVGS[sceneKey] ? sceneKey : 'investigation';
      var theme = SCENE_THEME[key] || SCENE_THEME.investigation;
      layer.style.setProperty('--sky-1', theme[0]);
      layer.style.setProperty('--sky-2', theme[1]);
      layer.innerHTML =
        '<svg class="bg-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="sky-' + key + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + theme[0] + '"/><stop offset="1" stop-color="' + theme[1] + '"/></linearGradient></defs>' +
        '<rect width="' + W + '" height="' + H + '" fill="url(#sky-' + key + ')"/>' +
        SVGS[key]() + '</svg>';
      layer.className = 'bg-layer bg--' + key;
      layer.dataset.scene = key;
    },
    list: Object.keys(SVGS)
  };
})();
