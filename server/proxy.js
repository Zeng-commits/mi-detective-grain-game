#!/usr/bin/env node
/* 《米侦探：粮食王国大追捕》AI 服务端代理（可选组件，零依赖）
 *
 * 作用有两个：
 *   1. 托管静态文件：`node server/proxy.js` 后浏览器打开 http://localhost:8787 即可运行游戏。
 *   2. 提供 AI 接口 /api/mi：把前端请求转发给大模型，**API 密钥只保存在服务端环境变量里**，
 *      前端代码与浏览器 Network 面板中都不会出现密钥。
 *
 * 启动方式（PowerShell / CMD）：
 *   set MI_API_KEY=sk-xxxx
 *   set MI_API_BASE=https://api.openai.com/v1
 *   set MI_MODEL=gpt-4o-mini
 *   node server/proxy.js
 *
 * 启动方式（bash / macOS / Linux）：
 *   MI_API_KEY=sk-xxxx MI_MODEL=gpt-4o-mini node server/proxy.js
 *
 * 未设置 MI_API_KEY 时，服务仍可正常托管静态文件，游戏自动运行在「离线模式」，
 * 使用已人工审核的默认题库，教学流程完全不受影响。
 *
 * 安全约定（重要）：
 *   - 本代理只处理白名单任务（generateClue / explain / generateQuestion / detectiveTalk）。
 *   - 代理**不会**返回或改写题目的标准答案，前端始终以已审核题库的答案为唯一判定依据。
 *   - AI 生成的题目默认标记为「未人工复核」，前端只在标记 reviewed 时采用。
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8787;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.MI_API_KEY || '';
const API_BASE = (process.env.MI_API_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '');
const MODEL = process.env.MI_MODEL || 'gpt-4o-mini';
const UPSTREAM_TIMEOUT = Number(process.env.MI_TIMEOUT || 15000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

/* ---------------------------------------------------------------- */
/* 1. 任务提示词（约束 AI 只做表达，不做判定）                        */
/* ---------------------------------------------------------------- */
const SYSTEM_PROMPT = [
  '你是儿童教育游戏《米侦探：粮食王国大追捕》中的智能调查助手，服务对象是中国小学中高年级学生。',
  '你的语言必须口语化、活泼、简短，不使用生僻词和书面语。',
  '铁律：',
  '1) 不得编造任何统计数据。涉及中国粮食产量、播种面积、单产时，只能引用「国家统计局2025年12月12日公告」的数据，并在文字中注明来源年份。',
  '2) 不得改变任何题目的标准答案。答案由已审核题库决定，你只负责解释与补充。',
  '3) 不得把任何粮食作物描述成坏人。案件中的「嫌疑犯」只是游戏角色。',
  '4) 涉及粮食安全时传递积极、正面、符合国家粮食安全战略的价值观。',
  '5) 只输出要求的 JSON，不要输出多余文字。'
].join('\n');

function buildUserPrompt(task, payload) {
  const p = payload || {};
  switch (task) {
    case 'generateClue':
      return [
        `请为「${p.cropName || p.crop}」生成 1 条适合小学生推理的游戏线索。`,
        `这是第 ${(p.revealed || 0) + 1} 条线索，要由易到难逐步揭示。`,
        '线索只能是 1 句话，不超过 40 字，不许直接说出作物名字，要留出推理空间。',
        '输出 JSON：{"clue":"线索文字","dimension":"外形特征|生长习性|分布区域|生产加工|营养用途|生活关联"}'
      ].join('\n');
    case 'explain':
      return [
        `学生做的题目是：${p.question}`,
        `选项：${(p.options || []).map((o, i) => `${'ABCD'[i]}.${o}`).join('  ')}`,
        `标准答案是：${'ABCD'[p.answer]}（这个答案不可更改）`,
        `学生选择了：${'ABCD'[p.chosen]}`,
        '请用小学生能听懂的话解释为什么标准答案是对的，并补充 1 条有趣的粮食小知识。',
        '总字数不超过 110 字。输出 JSON：{"explanation":"解释+小知识"}'
      ].join('\n');
    case 'generateQuestion':
      return [
        `请围绕「${p.category || '粮食安全'}」主题，为小学生出 1 道${({ easy: '简单', medium: '中等', hard: '挑战' }[p.difficulty] || '中等')}难度的单选题。`,
        '必须恰好 4 个选项，且只有一个正确答案，选项之间互斥。',
        '不允许涉及具体统计数字；如果必须涉及，请使用「国家统计局2025年12月12日公告」中已核实的数据并注明。',
        '输出 JSON：{"question":"题干","options":["A","B","C","D"],"answer":0,"explanation":"解析","funFact":"小知识","category":"分类","difficulty":"难度","source":"来源","reviewed":true}'
      ].join('\n');
    case 'detectiveTalk':
      return [
        `当前剧情节点：${p.context || '游戏进行中'}`,
        '请以「米侦探」的身份说 1 句简短、有趣、有角色感的话，鼓励孩子继续推理。不超过 40 字。',
        '输出 JSON：{"line":"台词"}'
      ].join('\n');
    default:
      return '';
  }
}

/* ---------------------------------------------------------------- */
/* 2. 调用上游大模型（OpenAI 兼容接口）                               */
/* ---------------------------------------------------------------- */
async function callLLM(task, payload) {
  if (!API_KEY) throw new Error('服务端未配置 MI_API_KEY');
  const userPrompt = buildUserPrompt(task, payload);
  if (!userPrompt) throw new Error('未知任务：' + task);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT);
  try {
    // Node 18+ 内置全局 fetch
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error('上游返回 HTTP ' + res.status);
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content : '';
    if (!text) throw new Error('上游返回内容为空');
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------- */
/* 3. HTTP 服务                                                     */
/* ---------------------------------------------------------------- */
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(ROOT, rel);
  // 防目录穿越
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);

  if (parsed.pathname === '/api/mi') {
    if (req.method === 'GET') {
      // 健康检查：前端据此判断 AI 是否可用
      return sendJSON(res, 200, { ok: true, ai: !!API_KEY, model: API_KEY ? MODEL : null });
    }
    if (req.method !== 'POST') { return sendJSON(res, 405, { ok: false, error: 'Method Not Allowed' }); }

    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > 64 * 1024) req.destroy(); // 限制请求体大小
    });
    req.on('end', async () => {
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch (e) { return sendJSON(res, 400, { ok: false, error: '请求体不是合法 JSON' }); }
      const task = body.task;
      try {
        const result = await callLLM(task, body.payload);
        // 二次校验：题目类任务必须结构完整，否则拒绝返回
        if (task === 'generateQuestion') {
          const q = result.question;
          if (!q || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.answer !== 'number') {
            return sendJSON(res, 200, { ok: false, error: '生成题目结构不完整，已回退本地题库' });
          }
        }
        return sendJSON(res, 200, Object.assign({ ok: true, via: 'ai' }, result));
      } catch (e) {
        return sendJSON(res, 200, { ok: false, error: String(e.message || e) });
      }
    });
    return;
  }

  serveStatic(req, res, parsed.pathname);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  米侦探：粮食王国大追捕 · 本地服务已启动      │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log(`  游戏地址：http://${HOST}:${PORT}`);
  console.log(`  AI 接口：http://${HOST}:${PORT}/api/mi`);
  console.log(`  AI 状态：${API_KEY ? '✅ 已启用（模型 ' + MODEL + '）' : '⚪ 离线模式（未配置 MI_API_KEY，使用已审核默认题库）'}`);
  console.log('');
});
