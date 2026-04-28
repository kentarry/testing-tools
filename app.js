// ═══════════════════════════════════════════════════
// AI 自動改財產 — Standalone App v4
// ✅ 先選遊戲再操作，避免改錯
// ✅ 雲端代理免開 RUN.BAT
// ✅ GitHub Pages 部署就緒
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
  aio: { name: '明星3缺1', icon: '⭐', color: '#8b5cf6', platform: () => PLATFORM_AIO },
  tmd: { name: '滿貫大亨', icon: '🀄', color: '#f59e0b', platform: () => PLATFORM_TMD },
  vf:  { name: 'Vegas Frenzy', icon: '🎰', color: '#ec4899', platform: () => PLATFORM_VF },
};
let selectedGame = null;

// ── Match rules per game (no need to type game name) ──
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

// ── Cloud proxy with fallback ──
const CLOUD_PROXIES = [
  url => `https://corsproxy.io/?${url}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];
async function _fetchViaProxy(url) {
  const useCloud = document.getElementById('aiCloudProxy')?.checked;
  if (!useCloud) {
    return fetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`);
  }
  let lastErr;
  for (const mkProxy of CLOUD_PROXIES) {
    try {
      const res = await fetch(mkProxy(url));
      if (res.ok || res.status < 500) return res;
    } catch (e) { lastErr = e; }
  }
  try { return await fetch(url); } catch(e) { lastErr = e; }
  throw lastErr || new Error('All proxies failed');
}

// ── Execute ──
async function _aiExecTool(entry) {
  const { platform, tool, params } = entry;
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k,v]) => qs.append(k,v));
  const url = platform.base + tool.ep + (qs.toString() ? '?'+qs.toString() : '');
  const res = await _fetchViaProxy(url);
  return { ok: res.ok, status: res.status, text: await res.text(), url };
}

// ── Chat history ──
let _aiChatHistory = [];

// ── Helpers ──
function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
function toast(msg, type='ok') {
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'info' ? 'info' : type);
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

function _getAccounts() {
  const raw = document.getElementById('aiAccountInput')?.value || '';
  return raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
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
  // Update button states
  document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('game-' + gameKey)?.classList.add('active');
  // Update accent color
  document.documentElement.style.setProperty('--acc', g.color);
  // Show selected game badge
  const badge = document.getElementById('selectedGameBadge');
  if (badge) badge.innerHTML = `<span class="game-badge" style="background:${g.color}20;color:${g.color};border:1px solid ${g.color}55">${g.icon} ${g.name}</span>`;
  // Update placeholder & enable input
  const reqInput = document.getElementById('aiRequestInput');
  if (reqInput) {
    reqInput.disabled = false;
    const examples = {
      aio: '例：改金幣 500000、vip 8、改鑽石 100000',
      tmd: '例：改錢 500000、vip 8、金馬 5',
      vf:  '例：改錢 100000、vip 5、等級 10',
    };
    reqInput.placeholder = examples[gameKey] || '';
  }
  // Update sidebar highlight
  document.querySelectorAll('.pb-group').forEach(g => g.classList.remove('selected'));
  document.getElementById('sidebar-' + gameKey)?.classList.add('selected');
  // Update available tools display
  const toolLabel = document.getElementById('toolListGameName');
  if (toolLabel) toolLabel.textContent = `— ${g.icon} ${g.name}`;
  _updateToolList();
  // Focus input
  document.getElementById('aiAccountInput')?.focus();
  toast(`已選擇 ${g.icon} ${g.name}`, 'info');
}

function _updateToolList() {
  const container = document.getElementById('toolListContent');
  if (!container || !selectedGame) return;
  const tools = AI_TOOL_REGISTRY.filter(r => r.game === selectedGame ||
    (selectedGame === 'aio' && r.game === '明星3缺1') ||
    (selectedGame === 'tmd' && r.game === '滿貫大亨') ||
    (selectedGame === 'vf' && r.game === 'Vegas Frenzy'));
  const g = GAMES[selectedGame];
  container.innerHTML = tools.map(r =>
    `<div class="ai-tools-item">${r.tool.icon} ${r.tool.name}</div>`
  ).join('');
}

// ── Main submit ──
async function aiSubmit() {
  if (!selectedGame) { toast('⚠️ 請先選擇遊戲平台！', 'err'); return; }

  const requestEl = document.getElementById('aiRequestInput');
  const accounts = _getAccounts();
  const request = requestEl.value.trim();
  const g = GAMES[selectedGame];

  if (!accounts.length) { toast('請輸入帳號', 'err'); document.getElementById('aiAccountInput')?.focus(); return; }
  if (!request) { toast('請輸入需求', 'err'); requestEl.focus(); return; }

  _aiChatHistory.push({ role: 'user', account: accounts.join(', '), text: `[${g.icon} ${g.name}] ${request}  (${accounts.length} 帳號)` });
  requestEl.value = '';

  const testMatches = _aiParseRequest(accounts[0], request);
  if (testMatches.length === 0) {
    const rules = GAME_MATCH_RULES[selectedGame] || [];
    const keywords = rules.map(r => r.sub.slice(0,2).join('、')).join('、');
    _aiChatHistory.push({ role:'bot', ok:false, game:g.name, toolName:'無法辨識',
      text:'❌ 無法辨識需求',
      detail:`${g.name} 支援的關鍵字：${keywords}\n範例：「改金幣 500000」「vip 8」` });
    _renderAiHistory();
    toast('❌ 無法辨識需求', 'err');
    return;
  }

  const startTime = Date.now();
  _aiChatHistory.push({ role:'bot', ok:true, game:g.name, toolName:'批次執行',
    text:`⏳ ${g.icon} ${g.name} — 批次執行 ${accounts.length} 帳號 × ${testMatches.length} 工具...` });
  _renderAiHistory();

  const allResults = await Promise.all(accounts.map(async account => {
    const matches = _aiParseRequest(account, request);
    const results = await Promise.all(matches.map(async entry => {
      if (!entry.params) return { ok: false, status: 0, text: '需要手動操作', toolName: entry.tool.name };
      try {
        const r = await _aiExecTool(entry);
        return { ...r, toolName: entry.tool.name };
      } catch(e) {
        return { ok: false, status: 0, text: e.message, toolName: entry.tool.name };
      }
    }));
    return { account, results };
  }));

  const elapsed = Date.now() - startTime;
  const totalTasks = allResults.reduce((s, r) => s + r.results.length, 0);
  const totalOk = allResults.reduce((s, r) => s + r.results.filter(x => x.ok).length, 0);
  const allOk = totalOk === totalTasks;

  _aiChatHistory[_aiChatHistory.length - 1] = {
    role:'bot', ok:allOk, game:g.name, toolName:'批次執行',
    text: allOk
      ? `✅ 全部成功！(${accounts.length} 帳號 × ${testMatches.length} 工具 = ${totalOk}/${totalTasks}，${elapsed}ms)`
      : `⚠️ 部分失敗 (${totalOk}/${totalTasks}，${elapsed}ms)`,
    detail: allResults.map(ar =>
      `👤 ${ar.account}: ` + ar.results.map(r => `${r.ok?'✅':'❌'} ${r.toolName} [${r.status}]`).join(' | ')
    ).join('\n')
  };
  _renderAiHistory();
  toast(allOk ? `✅ ${accounts.length} 帳號批次完成 (${elapsed}ms)` : '⚠️ 部分失敗', allOk ? 'ok' : 'err');
}

// ═══ BUILD SIDEBAR ═══
function buildSidebar() {
  const pbar = document.getElementById('pbar');
  const platforms = [
    { key:'aio', p: PLATFORM_AIO },
    { key:'tmd', p: PLATFORM_TMD },
    { key:'vf',  p: PLATFORM_VF },
  ];
  let html = '';
  platforms.forEach(({ key, p }) => {
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
      <div class="p-title">🤖 AI 自動改財產 <span style="font-size:12px;color:var(--t3);margin-left:8px">v4</span></div>
      <div class="p-desc">① 選擇遊戲 → ② 輸入帳號 → ③ 輸入需求 → ④ 執行
💡 不需要在指令中輸入遊戲名稱，選了就會自動對應！</div>
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
      <div class="ai-input-row">
        <textarea class="fi ai-input" id="aiAccountInput" placeholder="② 帳號（每行一個）" style="width:160px;flex-shrink:0;min-height:60px;resize:vertical;font-family:inherit;line-height:1.5"></textarea>
        <input class="fi ai-input" type="text" id="aiRequestInput" placeholder="③ 先選擇上方遊戲平台..." style="flex:1" disabled
          onkeydown="if(event.key==='Enter')aiSubmit()">
        <button class="btn btn-go ai-send-btn" onclick="aiSubmit()">⚡ 執行</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
        <label style="font-size:12px;color:var(--accH);display:flex;align-items:center;gap:4px" title="免開 RUN.BAT">
          <input type="checkbox" id="aiCloudProxy" checked> ☁️ 雲端代理
        </label>
        <button class="btn btn-rst" style="font-size:11px;padding:3px 10px;margin-left:auto" onclick="_aiChatHistory=[];_renderAiHistory()">🗑️ 清除紀錄</button>
      </div>
    </div>

    <div class="ai-tools-ref" id="toolListArea">
      <div class="ai-tools-ref-title">📋 可用工具 <span id="toolListGameName" style="font-size:12px;color:var(--t3)">（請先選擇遊戲）</span></div>
      <div id="toolListContent" class="ai-tools-item" style="color:var(--t4)">← 點選左側或上方的遊戲平台</div>
    </div>`;

  _renderAiHistory();
}

// ═══ INIT ═══
buildSidebar();
renderMainPanel();
