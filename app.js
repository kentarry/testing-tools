// ═══════════════════════════════════════════════════
// AI 自動改財產 — Standalone App v5
// ✅ 先選遊戲再操作，避免改錯
// ✅ 每行獨立指令：帳號 指令 數值
// ✅ 自動偵測本地代理（最快）
// ✅ 雲端代理 Promise.any 賽跑 + 自動重試
// ═══════════════════════════════════════════════════

// ── Tool Registry ──
const AI_TOOL_REGISTRY = [];
function _registerAiTools() {
  PLATFORM_AIO.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_AIO, tool: t, game: 'aio' }));
  PLATFORM_TMD.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_TMD, tool: t, game: 'tmd' }));
  PLATFORM_VF.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_VF, tool: t, game: 'vf' }));
}

// ── Game definitions ──
const GAMES = {
  aio: { name: '明星3缺1', icon: '⭐', color: '#8b5cf6' },
  tmd: { name: '滿貫大亨', icon: '🀄', color: '#f59e0b' },
  vf:  { name: 'Vegas Frenzy', icon: '🎰', color: '#ec4899' },
};
let selectedGame = null;

// ── Match rules per game ──
const GAME_MATCH_RULES = {
  aio: [
    { id:'aio_money',   sub:['錢','金幣','鑽石','i幣','改錢','changebill','幣','money'], mapFn: _mapAioMoney },
    { id:'aio_vip',     sub:['vip'], mapFn: _mapAioVip },
    { id:'aio_level',   sub:['等級','level','升級'], mapFn: _mapAioLevel },
    { id:'aio_deposit', sub:['儲值','deposit','充值'], mapFn: _mapAioDeposit },
    { id:'aio_refill',  sub:['補幣','refill'], mapFn: _mapSimple },
    { id:'aio_skill',   sub:['技能卡','skillcard','skill'], mapFn: _mapAioSkill },
    { id:'aio_godsend', sub:['天降好禮','godsend','遊戲卡'], mapFn: _mapAioGodsend },
    { id:'aio_bp_score',sub:['bp','battlepass','通行證','分數'], mapFn: _mapAioBpScore },
    { id:'aio_bp_condition', sub:['bp條件','任務條件'], mapFn: _mapAioBpCond },
  ],
  tmd: [
    { id:'tmd_money',   sub:['紅鑽','錢','鑽石','money','改錢','幣'], mapFn: _mapTmdMoney },
    { id:'tmd_vip',     sub:['vip'], mapFn: _mapTmdVip },
    { id:'tmd_horse',   sub:['金馬','horse','馬'], mapFn: _mapTmdHorse },
    { id:'tmd_clearPkg',sub:['清空背包','背包','clearpackage'], mapFn: _mapSimple },
    { id:'tmd_singleItem', sub:['單一物品','singleitem'], mapFn: _mapTmdSingleItem },
    { id:'tmd_contItem',   sub:['區間物品','continuous'], mapFn: _mapTmdContItem },
    { id:'tmd_score',   sub:['排行榜','scoreboard'], mapFn: _mapTmdScore },
  ],
  vf: [
    { id:'vf_money',    sub:['錢','金幣','money','財產','gold','改錢'], mapFn: _mapVfMoney },
    { id:'vf_vip',      sub:['vip'], mapFn: _mapVfVip },
    { id:'vf_level',    sub:['等級','level'], mapFn: _mapVfLevel },
    { id:'vf_bolt',     sub:['bolt','boltpower'], mapFn: _mapVfBolt },
  ],
};

// ── Map functions ──
function _num(t) { const m = t.match(/(\d[\d,]*)/); return m ? parseInt(m[1].replace(/,/g,''),10) : null; }
function _mapAioMoney(a,t)  { const v=_num(t); return { userName:a, currencyType:/鑽石|diamond/i.test(t)?2:1, money:v ?? 100000 }; }
function _mapAioVip(a,t)    { return { userName:a, level:_num(t) ?? 5, tLevel:0, resetTime:0 }; }
function _mapAioLevel(a,t)  { return { userName:a, targetLevel:_num(t) ?? 10 }; }
function _mapAioDeposit(a,t){ return { userName:a, amount:_num(t) ?? 100, currencyType:/鑽石/i.test(t)?2:1 }; }
function _mapSimple(a)      { return { userName:a }; }
function _mapAioSkill(a,t)  { let n=20001; if(/鎖定/.test(t))n=20003; else if(/冰凍/.test(t))n=20005; else if(/加倍/.test(t))n=20007; return{account:a,itemNo:n,amount:_num(t) ?? 10}; }
function _mapAioGodsend(a,t){ return { account:a, itemIndex:String(_num(t) ?? 13601001), amount:1 }; }
function _mapAioBpScore(a,t){ return { account:a, addScore:_num(t) ?? 100 }; }
function _mapAioBpCond(a)   { return { account:a, condition:1, count:1 }; }
function _mapTmdMoney(a,t)  { return { account:a, amount:_num(t) ?? 100000 }; }
function _mapTmdVip(a,t)    { return { account:a, vip:_num(t) ?? 5 }; }
function _mapTmdHorse(a,t)  { return { account:a, level:_num(t) ?? 3 }; }
function _mapTmdSingleItem(a){ return { account:a, itemId:1, itemId2:100, amount:1 }; }
function _mapTmdContItem(a) { return { account:a, itemId:1, beginItemId2:1, endItemId2:10, amount:1 }; }
function _mapTmdScore(a,t)  { return { id:1, account:a, score:_num(t) ?? 10000 }; }
function _mapVfMoney(a,t)   { return { accountId:parseInt(a,10)||0, currencyType:66, amount:String(_num(t) ?? 100000) }; }
function _mapVfVip(a,t)     { return { accountId:parseInt(a,10)||0, vipLv:_num(t) ?? 5 }; }
function _mapVfLevel(a,t)   { return { accountId:parseInt(a,10)||0, Level:_num(t) ?? 10 }; }
function _mapVfBolt(a,t)    { return { accountId:parseInt(a,10)||0, boltPower:_num(t) ?? 100 }; }

// ── Parse request (scoped to selected game) ──
function _aiParseRequest(account, request) {
  if (!selectedGame) return [];
  const lower = request.toLowerCase();
  const rules = GAME_MATCH_RULES[selectedGame] || [];
  const results = [];
  for (const rule of rules) {
    if (rule.sub.some(s => lower.includes(s.toLowerCase()))) {
      const entry = AI_TOOL_REGISTRY.find(r => r.tool.id === rule.id);
      if (entry && rule.mapFn) results.push({ ...entry, params: rule.mapFn(account, request), rule });
    }
  }
  return results;
}

// ══════════════════════════════════════════
// ⚡ PROXY ENGINE — Auto-detect + Race
// ══════════════════════════════════════════
let _proxyMode = 'detecting'; // 'local' | 'cloud' | 'detecting'
let _bestCloudProxy = null;

const CLOUD_PROXIES = [
  { name:'corsproxy',  mk: url => `https://corsproxy.io/?${url}` },
  { name:'allorigins', mk: url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
];

function _timeout(promise, ms) {
  return Promise.race([promise, new Promise((_,r) => setTimeout(() => r(new Error('Timeout')), ms))]);
}

// Auto-detect: try local proxy first
async function _detectProxy() {
  try {
    const res = await _timeout(fetch('http://localhost:8787/api/proxy?url=' + encodeURIComponent('https://httpbin.org/get')), 2000);
    if (res.ok) { _proxyMode = 'local'; _updateProxyBadge(); return; }
  } catch(e) {}
  _proxyMode = 'cloud';
  _updateProxyBadge();
}

function _updateProxyBadge() {
  const el = document.getElementById('proxyStatus');
  if (!el) return;
  if (_proxyMode === 'local') {
    el.textContent = '🚀 本地代理 (極速)';
    el.style.background = 'rgba(52,211,153,.15)';
    el.style.color = '#6ee7b7';
  } else {
    el.textContent = '☁️ 雲端代理';
    el.style.background = 'rgba(129,140,248,.15)';
    el.style.color = '#a5b4fc';
  }
}

async function _fetchViaProxy(url) {
  // Local proxy (fastest)
  if (_proxyMode === 'local') {
    return _timeout(fetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`), 8000);
  }
  // Cloud: if we know the best proxy, try it first
  if (_bestCloudProxy) {
    try {
      const res = await _timeout(fetch(_bestCloudProxy.mk(url)), 5000);
      if (res.ok || res.status < 500) return res;
    } catch(e) { _bestCloudProxy = null; }
  }
  // Race all cloud proxies
  try {
    return await Promise.any(CLOUD_PROXIES.map(p =>
      _timeout(fetch(p.mk(url)), 8000).then(res => {
        if (!res.ok && res.status >= 500) throw new Error(`${p.name}:${res.status}`);
        _bestCloudProxy = p;
        return res;
      })
    ));
  } catch(e) {
    // Last resort: direct
    try { return await _timeout(fetch(url), 5000); } catch(e2) {}
    throw new Error('所有代理皆失敗');
  }
}

// ── Execute with retry ──
async function _aiExecTool(entry) {
  const { platform, tool, params } = entry;
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k,v]) => qs.append(k,v));
  const url = platform.base + tool.ep + (qs.toString() ? '?'+qs.toString() : '');
  for (let i = 0; i < 2; i++) {
    try {
      const res = await _fetchViaProxy(url);
      const text = await res.text();
      return { ok: res.ok, status: res.status, text, url };
    } catch(e) {
      if (i === 1) return { ok: false, status: 0, text: e.message, url };
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

// ══════════════════════════════════════════
// UI
// ══════════════════════════════════════════
let _aiChatHistory = [];

function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
function toast(msg, type='ok') {
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'info' ? 'info' : type);
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

function _renderAiHistory() {
  const c = document.getElementById('aiChatMessages');
  if (!c) return;
  c.innerHTML = _aiChatHistory.map(msg => {
    if (msg.role === 'user') return `<div class="ai-msg ai-msg-user"><div class="ai-msg-label">👤 ${msg.account}</div><div class="ai-msg-text">${_esc(msg.text)}</div></div>`;
    const cls = msg.ok ? 'ai-msg-ok' : 'ai-msg-err';
    return `<div class="ai-msg ai-msg-bot ${cls}"><div class="ai-msg-label">🤖 ${msg.game||'AI'} → ${msg.toolName||''}</div><div class="ai-msg-text">${_esc(msg.text)}</div>${msg.detail?`<div class="ai-msg-detail">${_esc(msg.detail)}</div>`:''}</div>`;
  }).join('');
  c.scrollTop = c.scrollHeight;
}

// ── Select game ──
function selectGame(gameKey) {
  selectedGame = gameKey;
  const g = GAMES[gameKey];
  document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('game-' + gameKey)?.classList.add('active');
  document.documentElement.style.setProperty('--acc', g.color);
  const badge = document.getElementById('selectedGameBadge');
  if (badge) badge.innerHTML = `<span class="game-badge" style="background:${g.color}20;color:${g.color};border:1px solid ${g.color}55">${g.icon} ${g.name}</span>`;
  const cmdInput = document.getElementById('aiCommandInput');
  if (cmdInput) {
    cmdInput.disabled = false;
    const ex = {
      aio: 'ray1 vip 8\nray2 改金幣 500000\nray3 改鑽石 100000',
      tmd: 'ray1 vip 5\nray2 改錢 200000\nray3 金馬 3',
      vf:  '163436 vip 5\n163437 改錢 100000',
    };
    cmdInput.placeholder = ex[gameKey] || '';
  }
  document.querySelectorAll('.pb-group').forEach(g => g.classList.remove('selected'));
  document.getElementById('sidebar-' + gameKey)?.classList.add('selected');
  const toolLabel = document.getElementById('toolListGameName');
  if (toolLabel) toolLabel.textContent = `— ${g.icon} ${g.name}`;
  _updateToolList();
  cmdInput?.focus();
  toast(`已選擇 ${g.icon} ${g.name}`, 'info');
}

function _updateToolList() {
  const container = document.getElementById('toolListContent');
  if (!container || !selectedGame) return;
  const tools = AI_TOOL_REGISTRY.filter(r => r.game === selectedGame);
  container.innerHTML = tools.map(r =>
    `<div class="ai-tools-item">${r.tool.icon} ${r.tool.name}</div>`
  ).join('');
}

// ══════════════════════════════════════════
// ⚡ SUBMIT — Parse each line as: account command [value]
// ══════════════════════════════════════════
async function aiSubmit() {
  if (!selectedGame) { toast('⚠️ 請先選擇遊戲平台！', 'err'); return; }
  const g = GAMES[selectedGame];
  const cmdInput = document.getElementById('aiCommandInput');
  const raw = cmdInput?.value?.trim() || '';
  if (!raw) { toast('請輸入指令', 'err'); cmdInput?.focus(); return; }

  // Parse lines: each line = "account command [value]"
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const tasks = [];
  for (const line of lines) {
    const parts = line.split(/\s+/);
    const account = parts[0];
    const command = parts.slice(1).join(' ');
    if (!account || !command) continue;
    const matches = _aiParseRequest(account, command);
    if (matches.length > 0) {
      tasks.push({ account, command, matches });
    } else {
      tasks.push({ account, command, matches: [], error: '無法辨識' });
    }
  }

  if (tasks.length === 0) {
    toast('❌ 沒有可執行的指令', 'err');
    return;
  }

  // Show user message
  const summary = tasks.map(t => `${t.account} ${t.command}`).join('\n');
  _aiChatHistory.push({ role: 'user', account: `${tasks.length} 筆`, text: `[${g.icon} ${g.name}]\n${summary}` });

  // Show processing
  _aiChatHistory.push({ role:'bot', ok:true, game:g.name, toolName:'批次執行',
    text:`⏳ 並行執行 ${tasks.length} 筆指令... [${_proxyMode === 'local' ? '🚀本地' : '☁️雲端'}]` });
  _renderAiHistory();
  cmdInput.value = '';

  const startTime = Date.now();

  // Execute ALL tasks in parallel
  const results = await Promise.all(tasks.map(async task => {
    if (task.error) return { ...task, results: [{ ok:false, status:0, text:task.error, toolName:'❌' }] };
    const execResults = await Promise.all(task.matches.map(async entry => {
      try {
        const r = await _aiExecTool(entry);
        return { ...r, toolName: entry.tool.name };
      } catch(e) {
        return { ok:false, status:0, text:e.message, toolName: entry.tool.name };
      }
    }));
    return { ...task, results: execResults };
  }));

  const elapsed = Date.now() - startTime;
  const totalOk = results.reduce((s, t) => s + t.results.filter(r => r.ok).length, 0);
  const totalTasks = results.reduce((s, t) => s + t.results.length, 0);
  const allOk = totalOk === totalTasks;

  _aiChatHistory[_aiChatHistory.length - 1] = {
    role:'bot', ok:allOk, game:g.name, toolName:'批次執行',
    text: allOk
      ? `✅ 全部成功！(${totalOk}/${totalTasks} 筆，${elapsed}ms)`
      : `⚠️ ${totalOk}/${totalTasks} 成功 (${elapsed}ms)`,
    detail: results.map(t =>
      `👤 ${t.account} [${t.command}]: ` + t.results.map(r => `${r.ok?'✅':'❌'} ${r.toolName}`).join(' ')
    ).join('\n')
  };
  _renderAiHistory();
  toast(allOk ? `✅ ${totalTasks} 筆全部完成 (${elapsed}ms)` : `⚠️ ${totalOk}/${totalTasks} 成功`, allOk ? 'ok' : 'err');
}

// ═══ BUILD SIDEBAR ═══
function buildSidebar() {
  const pbar = document.getElementById('pbar');
  let html = '';
  [['aio', PLATFORM_AIO], ['tmd', PLATFORM_TMD], ['vf', PLATFORM_VF]].forEach(([key, p]) => {
    const g = GAMES[key];
    html += `<div class="pb-group" id="sidebar-${key}" onclick="selectGame('${key}')">
      <div class="pb-group-title">
        <span><span class="menu-icon">${g.icon}</span>${g.name}</span>
        <span class="caret-arrow">→</span>
      </div>
      <ul class="pb-tools">
        ${p.tools.map(t => `<li><span>${t.icon} ${t.name}</span></li>`).join('')}
      </ul>
    </div>`;
  });
  pbar.innerHTML = html;
}

// ═══ RENDER MAIN PANEL ═══
function renderMainPanel() {
  if (AI_TOOL_REGISTRY.length === 0) _registerAiTools();
  const panel = document.getElementById('panel');
  panel.innerHTML = `
    <div class="p-head">
      <div class="p-title">🤖 AI 自動改財產 <span style="font-size:12px;color:var(--t3);margin-left:8px">v5</span></div>
      <div class="p-desc">① 選擇遊戲 → ② 輸入指令（每行一筆） → ③ 執行
每行格式：<code>帳號 指令 數值</code>
範例：
<code>ray1 vip 1
ray2 vip 2
ray3 改金幣 500000</code></div>
    </div>

    <div class="game-selector">
      <div class="game-selector-title">① 選擇遊戲平台</div>
      <div class="game-btn-row">
        ${Object.entries(GAMES).map(([key, g]) =>
          `<button class="game-btn" id="game-${key}" onclick="selectGame('${key}')" style="--gc:${g.color}">
            <span class="game-btn-icon">${g.icon}</span>
            <span class="game-btn-name">${g.name}</span>
          </button>`
        ).join('')}
      </div>
    </div>

    <div id="selectedGameBadge" style="margin-bottom:12px"></div>

    <div class="ai-chat-area" id="aiChatArea">
      <div class="ai-chat-messages" id="aiChatMessages"></div>
    </div>

    <div class="ai-input-area">
      <div class="ai-input-col">
        <textarea class="fi ai-cmd-input" id="aiCommandInput" disabled
          placeholder="② 先選擇上方遊戲平台..."
          rows="5"></textarea>
        <button class="btn btn-go ai-send-btn" onclick="aiSubmit()">⚡ 執行</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;align-items:center">
        <span class="proxy-badge" id="proxyBadge">偵測中...</span>
        <button class="btn btn-rst" style="font-size:11px;padding:3px 10px;margin-left:auto" onclick="_aiChatHistory=[];_renderAiHistory()">🗑️ 清除紀錄</button>
      </div>
    </div>

    <div class="ai-tools-ref" id="toolListArea">
      <div class="ai-tools-ref-title">📋 可用工具 <span id="toolListGameName" style="font-size:12px;color:var(--t3)">（請先選擇遊戲）</span></div>
      <div id="toolListContent" class="ai-tools-item" style="color:var(--t4)">← 點選上方的遊戲平台</div>
    </div>`;
  _renderAiHistory();
}

// ═══ INIT ═══
buildSidebar();
renderMainPanel();
_detectProxy();
