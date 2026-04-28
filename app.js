// ═══════════════════════════════════════════════════
// AI 自動改財產 — Standalone App v3
// ✅ 完全獨立，不依賴父專案
// ✅ 預設雲端代理，免開 RUN.BAT
// ✅ 支援 GitHub Pages 部署
// ═══════════════════════════════════════════════════

// ── Tool Registry ──
const AI_TOOL_REGISTRY = [];
function _registerAiTools() {
  PLATFORM_AIO.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_AIO, tool: t, game: '明星3缺1' }));
  PLATFORM_TMD.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_TMD, tool: t, game: '滿貫大亨' }));
  PLATFORM_VF.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_VF, tool: t, game: 'Vegas Frenzy' }));
}

// ── Skill definitions ──
const AI_SKILLS = {
  'aio-rich':  { desc: '🌟 明星 — 金幣+鑽石+VIP', steps: a => [
    { id:'aio_money', p:{userName:a,currencyType:1,money:999999} },
    { id:'aio_money', p:{userName:a,currencyType:2,money:999999} },
    { id:'aio_vip',   p:{userName:a,level:10,tLevel:0,resetTime:0} },
  ]},
  'aio-max':   { desc: '🌟 明星 — 全拉滿', steps: a => [
    { id:'aio_money', p:{userName:a,currencyType:1,money:9999999} },
    { id:'aio_money', p:{userName:a,currencyType:2,money:9999999} },
    { id:'aio_vip',   p:{userName:a,level:10,tLevel:0,resetTime:0} },
    { id:'aio_level', p:{userName:a,targetLevel:99} },
    { id:'aio_bp_score', p:{account:a,addScore:99999} },
  ]},
  'tmd-rich':  { desc: '🀄 滿貫 — 紅鑽+VIP', steps: a => [
    { id:'tmd_money', p:{account:a,amount:999999} },
    { id:'tmd_vip',   p:{account:a,vip:10} },
  ]},
  'tmd-max':   { desc: '🀄 滿貫 — 全拉滿', steps: a => [
    { id:'tmd_money', p:{account:a,amount:9999999} },
    { id:'tmd_vip',   p:{account:a,vip:10} },
    { id:'tmd_horse', p:{account:a,level:5} },
  ]},
  'vf-rich':   { desc: '🎰 VF — 金幣+VIP', steps: a => [
    { id:'vf_money', p:{accountId:parseInt(a,10)||0,currencyType:66,amount:'999999'} },
    { id:'vf_vip',   p:{accountId:parseInt(a,10)||0,vipLv:10} },
  ]},
  'vf-max':    { desc: '🎰 VF — 全拉滿', steps: a => [
    { id:'vf_money', p:{accountId:parseInt(a,10)||0,currencyType:66,amount:'9999999'} },
    { id:'vf_vip',   p:{accountId:parseInt(a,10)||0,vipLv:10} },
    { id:'vf_level', p:{accountId:parseInt(a,10)||0,Level:99} },
    { id:'vf_bolt',  p:{accountId:parseInt(a,10)||0,boltPower:99999} },
  ]},
};

// ── Keyword matching rules ──
const AI_MATCH_RULES = [
  { id:'aio_money',   kw:['明星','aio'], sub:['錢','金幣','鑽石','i幣','改錢','changebill','幣'], mapFn: _mapAioMoney },
  { id:'aio_vip',     kw:['明星','aio'], sub:['vip','等級vip'], mapFn: _mapAioVip },
  { id:'aio_level',   kw:['明星','aio'], sub:['等級','level','升級'], mapFn: _mapAioLevel },
  { id:'aio_deposit', kw:['明星','aio'], sub:['儲值','deposit','充值'], mapFn: _mapAioDeposit },
  { id:'aio_refill',  kw:['明星','aio'], sub:['補幣','refill'], mapFn: _mapSimple },
  { id:'aio_skill',   kw:['明星','aio'], sub:['技能卡','skillcard','skill'], mapFn: _mapAioSkill },
  { id:'aio_godsend', kw:['明星','aio'], sub:['天降好禮','godsend','遊戲卡'], mapFn: _mapAioGodsend },
  { id:'aio_bp_score',kw:['明星','aio'], sub:['bp','battlepass','通行證','分數'], mapFn: _mapAioBpScore },
  { id:'aio_bp_condition', kw:['明星','aio'], sub:['bp條件','任務條件'], mapFn: _mapAioBpCond },
  { id:'tmd_money',   kw:['滿貫','tmd'], sub:['紅鑽','錢','鑽石','money','改錢'], mapFn: _mapTmdMoney },
  { id:'tmd_vip',     kw:['滿貫','tmd'], sub:['vip'], mapFn: _mapTmdVip },
  { id:'tmd_horse',   kw:['滿貫','tmd'], sub:['金馬','horse','馬'], mapFn: _mapTmdHorse },
  { id:'tmd_clearPkg',kw:['滿貫','tmd'], sub:['清空背包','背包','clearpackage'], mapFn: _mapSimple },
  { id:'tmd_singleItem', kw:['滿貫','tmd'], sub:['單一物品','singleitem'], mapFn: _mapTmdSingleItem },
  { id:'tmd_contItem',   kw:['滿貫','tmd'], sub:['區間物品','continuous'], mapFn: _mapTmdContItem },
  { id:'tmd_score',   kw:['滿貫','tmd'], sub:['排行榜','scoreboard'], mapFn: _mapTmdScore },
  { id:'vf_money',    kw:['vf','vegas','frenzy'], sub:['錢','金幣','money','財產','gold'], mapFn: _mapVfMoney },
  { id:'vf_vip',      kw:['vf','vegas','frenzy'], sub:['vip'], mapFn: _mapVfVip },
  { id:'vf_level',    kw:['vf','vegas','frenzy'], sub:['等級','level'], mapFn: _mapVfLevel },
  { id:'vf_bolt',     kw:['vf','vegas','frenzy'], sub:['bolt','boltpower'], mapFn: _mapVfBolt },
];

// ── Map functions ──
function _num(t) { const m = t.match(/(\d[\d,]*)/); return m ? parseInt(m[1].replace(/,/g,''),10) : null; }
function _mapAioMoney(a,t)  { const v=_num(t.replace(a,'')); return { userName:a, currencyType:/鑽石|diamond/i.test(t)?2:1, money:v ?? 100000 }; }
function _mapAioVip(a,t)    { return { userName:a, level:_num(t.replace(a,'')) ?? 5, tLevel:0, resetTime:0 }; }
function _mapAioLevel(a,t)  { return { userName:a, targetLevel:_num(t.replace(a,'')) ?? 10 }; }
function _mapAioDeposit(a,t){ const v=_num(t.replace(a,'')) ?? 100; return { userName:a, amount:v, currencyType:/鑽石/i.test(t)?2:1 }; }
function _mapSimple(a)      { return { userName:a }; }
function _mapAioSkill(a,t)  { let n=20001; if(/鎖定/.test(t))n=20003; else if(/冰凍/.test(t))n=20005; else if(/加倍/.test(t))n=20007; return{account:a,itemNo:n,amount:_num(t.replace(a,'')) ?? 10}; }
function _mapAioGodsend(a,t){ return { account:a, itemIndex:String(_num(t.replace(a,'')) ?? 13601001), amount:1 }; }
function _mapAioBpScore(a,t){ return { account:a, addScore:_num(t.replace(a,'')) ?? 100 }; }
function _mapAioBpCond(a)   { return { account:a, condition:1, count:1 }; }
function _mapTmdMoney(a,t)  { return { account:a, amount:_num(t.replace(a,'')) ?? 100000 }; }
function _mapTmdVip(a,t)    { return { account:a, vip:_num(t.replace(a,'')) ?? 5 }; }
function _mapTmdHorse(a,t)  { return { account:a, level:_num(t.replace(a,'')) ?? 3 }; }
function _mapTmdSingleItem(a){ return { account:a, itemId:1, itemId2:100, amount:1 }; }
function _mapTmdContItem(a) { return { account:a, itemId:1, beginItemId2:1, endItemId2:10, amount:1 }; }
function _mapTmdScore(a,t)  { return { id:1, account:a, score:_num(t.replace(a,'')) ?? 10000 }; }
function _mapVfMoney(a,t)   { return { accountId:parseInt(a,10)||0, currencyType:66, amount:String(_num(t.replace(a,'')) ?? 100000) }; }
function _mapVfVip(a,t)     { return { accountId:parseInt(a,10)||0, vipLv:_num(t.replace(a,'')) ?? 5 }; }
function _mapVfLevel(a,t)   { return { accountId:parseInt(a,10)||0, Level:_num(t.replace(a,'')) ?? 10 }; }
function _mapVfBolt(a,t)    { return { accountId:parseInt(a,10)||0, boltPower:_num(t.replace(a,'')) ?? 100 }; }

// ── Parse request ──
function _aiParseRequest(account, request) {
  const lower = request.toLowerCase();
  const results = [];
  for (const rule of AI_MATCH_RULES) {
    if (rule.kw.some(k => lower.includes(k.toLowerCase())) && rule.sub.some(s => lower.includes(s.toLowerCase()))) {
      const entry = AI_TOOL_REGISTRY.find(r => r.tool.id === rule.id);
      if (entry && rule.mapFn) results.push({ ...entry, params: rule.mapFn(account, request), rule });
    }
  }
  return results;
}

// ── Proxy helper ──
function _getProxyUrl(url) {
  const useCloud = document.getElementById('aiCloudProxy')?.checked;
  return useCloud
    ? `https://corsproxy.io/?${encodeURIComponent(url)}`
    : `http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`;
}

// ── Execute via proxy ──
async function _aiExecTool(entry) {
  const { platform, tool, params } = entry;
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k,v]) => qs.append(k,v));
  const url = platform.base + tool.ep + (qs.toString() ? '?'+qs.toString() : '');
  const res = await fetch(_getProxyUrl(url));
  return { ok: res.ok, status: res.status, text: await res.text(), url };
}

async function _aiExecStep(step) {
  const entry = AI_TOOL_REGISTRY.find(r => r.tool.id === step.id);
  if (!entry) return { ok: false, status: 0, text: 'Tool not found: ' + step.id };
  const qs = new URLSearchParams();
  Object.entries(step.p).forEach(([k,v]) => qs.append(k,v));
  const url = entry.platform.base + entry.tool.ep + '?' + qs.toString();
  const res = await fetch(_getProxyUrl(url));
  return { ok: res.ok, status: res.status, text: await res.text(), url, entry };
}

// ── Chat history ──
let _aiChatHistory = [];

// ── Helpers ──
function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>'); }
function toast(msg, type='ok') {
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'info' ? 'info' : type);
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ── Parse accounts ──
function _getAccounts() {
  const raw = document.getElementById('aiAccountInput')?.value || '';
  return raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
}

// ── Render history ──
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

// ── Execute skill ──
async function aiRunSkill(skillName) {
  const accounts = _getAccounts();
  if (!accounts.length) { toast('請先輸入帳號', 'err'); document.getElementById('aiAccountInput')?.focus(); return; }
  const skill = AI_SKILLS[skillName];
  if (!skill) { toast('未知技能', 'err'); return; }

  _aiChatHistory.push({ role: 'user', account: accounts.join(', '), text: `⚡ 技能: ${skill.desc}  (${accounts.length} 帳號)` });
  _aiChatHistory.push({ role: 'bot', ok: true, game: 'Skill', toolName: skillName, text: `⏳ 執行中... (${accounts.length} 帳號，並行模式)` });
  _renderAiHistory();

  const startTime = Date.now();
  const allResults = await Promise.all(accounts.map(async account => {
    const steps = skill.steps(account);
    const results = await Promise.all(steps.map(s => _aiExecStep(s)));
    return { account, steps, results };
  }));

  const elapsed = Date.now() - startTime;
  const totalSteps = allResults.reduce((s, r) => s + r.results.length, 0);
  const totalOk = allResults.reduce((s, r) => s + r.results.filter(x => x.ok).length, 0);
  const allOk = totalOk === totalSteps;

  _aiChatHistory[_aiChatHistory.length - 1] = {
    role: 'bot', ok: allOk, game: 'Skill', toolName: skillName,
    text: allOk ? `✅ 技能完成！(${accounts.length} 帳號，${totalOk}/${totalSteps} 成功，${elapsed}ms)` : `⚠️ 部分失敗 (${totalOk}/${totalSteps}，${elapsed}ms)`,
    detail: allResults.map(ar => `👤 ${ar.account}: ` + ar.results.map((r, i) => `${r.ok?'✅':'❌'} ${ar.steps[i].id}`).join(' | ')).join('\\n')
  };
  _renderAiHistory();
  toast(allOk ? `✅ 技能完成 ${accounts.length} 帳號 (${elapsed}ms)` : '⚠️ 部分失敗', allOk ? 'ok' : 'err');
}

// ── Main submit ──
async function aiSubmit() {
  const requestEl = document.getElementById('aiRequestInput');
  const accounts = _getAccounts();
  const request = requestEl.value.trim();

  if (!accounts.length) { toast('請輸入帳號', 'err'); document.getElementById('aiAccountInput')?.focus(); return; }
  if (!request) { toast('請輸入需求', 'err'); requestEl.focus(); return; }

  _aiChatHistory.push({ role: 'user', account: accounts.join(', '), text: `${request}  (${accounts.length} 帳號)` });
  requestEl.value = '';

  const testMatches = _aiParseRequest(accounts[0], request);
  if (testMatches.length === 0) {
    _aiChatHistory.push({ role:'bot', ok:false, toolName:'無法辨識', text:'❌ 無法辨識需求', detail:'範例：「明星 改金幣 500000」「滿貫 vip 8」「vf 改錢 100000」' });
    _renderAiHistory();
    toast('❌ 無法辨識需求', 'err');
    return;
  }

  const startTime = Date.now();
  _aiChatHistory.push({ role:'bot', ok:true, game:'AI', toolName:'批次執行',
    text:`⏳ 批次執行 ${accounts.length} 帳號 × ${testMatches.length} 工具 (並行模式)...` });
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
    role:'bot', ok:allOk, game:'AI', toolName:'批次執行',
    text: allOk
      ? `✅ 全部成功！(${accounts.length} 帳號 × ${testMatches.length} 工具 = ${totalOk}/${totalTasks}，${elapsed}ms)`
      : `⚠️ 部分失敗 (${totalOk}/${totalTasks}，${elapsed}ms)`,
    detail: allResults.map(ar =>
      `👤 ${ar.account}: ` + ar.results.map(r => `${r.ok?'✅':'❌'} ${r.toolName}`).join(' | ')
    ).join('\\n')
  };
  _renderAiHistory();
  toast(allOk ? `✅ ${accounts.length} 帳號批次完成 (${elapsed}ms)` : '⚠️ 部分失敗', allOk ? 'ok' : 'err');
}

// ═══ BUILD SIDEBAR ═══
function buildSidebar() {
  const pbar = document.getElementById('pbar');
  const platforms = [
    { p: PLATFORM_AIO, tools: PLATFORM_AIO.tools },
    { p: PLATFORM_TMD, tools: PLATFORM_TMD.tools },
    { p: PLATFORM_VF, tools: PLATFORM_VF.tools },
  ];
  let html = '';
  platforms.forEach(({ p, tools }) => {
    html += `<div class="pb-group">
      <div class="pb-group-title" onclick="this.parentElement.classList.toggle('open')">
        <span><span class="menu-icon">${p.icon}</span>${p.name}</span>
        <span class="caret">▼</span>
      </div>
      <ul class="pb-tools">
        ${tools.map(t => `<li><a onclick="toast('此工具請用上方 AI 指令操作','info')">${t.icon} ${t.name}</a></li>`).join('')}
      </ul>
    </div>`;
  });
  pbar.innerHTML = html;
}

// ═══ RENDER MAIN PANEL ═══
function renderMainPanel() {
  if (AI_TOOL_REGISTRY.length === 0) _registerAiTools();

  let skillHtml = '<div class="ai-skills"><div class="ai-tools-ref-title">⚡ 一鍵技能 (Skills)</div><div class="ai-skill-grid">';
  for (const [name, skill] of Object.entries(AI_SKILLS)) {
    skillHtml += `<button class="ai-skill-btn" onclick="aiRunSkill('${name}')">${skill.desc}</button>`;
  }
  skillHtml += '</div></div>';

  let toolHtml = '<div class="ai-tools-ref"><div class="ai-tools-ref-title">📋 可用工具一覽</div>';
  const groups = {};
  AI_TOOL_REGISTRY.forEach(r => { if (!groups[r.game]) groups[r.game] = []; groups[r.game].push(r.tool); });
  for (const game in groups) {
    toolHtml += `<div class="ai-tools-group">${game}</div>`;
    groups[game].forEach(t => { toolHtml += `<div class="ai-tools-item">${t.icon} ${t.name}</div>`; });
  }
  toolHtml += '</div>';

  const panel = document.getElementById('panel');
  panel.innerHTML = `
    <div class="p-head">
      <div class="p-title">🤖 AI 自動改財產 <span style="font-size:12px;color:var(--t3);margin-left:8px">v3 — Standalone</span></div>
      <div class="p-desc">輸入帳號與需求，AI 自動辨識並執行。支援 <b>技能一鍵執行</b> 和 <b>批量模式</b>。
範例：「明星 改金幣 500000」「滿貫 vip 8」「vf 改錢 100000」
💡 此為獨立網頁版，預設使用雲端代理，無需開啟 RUN.BAT</div>
    </div>
    ${skillHtml}
    <div class="ai-chat-area" id="aiChatArea">
      <div class="ai-chat-messages" id="aiChatMessages"></div>
    </div>
    <div class="ai-input-area">
      <div class="ai-input-row">
        <textarea class="fi ai-input" id="aiAccountInput" placeholder="帳號（每行一個）" style="width:160px;flex-shrink:0;min-height:60px;resize:vertical;font-family:inherit;line-height:1.5"></textarea>
        <input class="fi ai-input" type="text" id="aiRequestInput" placeholder="輸入需求，例：明星 改金幣 500000" style="flex:1"
          onkeydown="if(event.key==='Enter')aiSubmit()">
        <button class="btn btn-go ai-send-btn" onclick="aiSubmit()">⚡ 執行</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
        <label style="font-size:12px;color:var(--t3);display:flex;align-items:center;gap:4px">
          <input type="checkbox" id="aiParallelMode" checked> 並行執行 (更快)
        </label>
        <label style="font-size:12px;color:var(--accH);display:flex;align-items:center;gap:4px;margin-left:12px" title="免開 RUN.BAT，適合放 GitHub Pages">
          <input type="checkbox" id="aiCloudProxy" checked> ☁️ 雲端代理 (免伺服器)
        </label>
        <button class="btn btn-rst" style="font-size:11px;padding:3px 10px;margin-left:auto" onclick="_aiChatHistory=[];_renderAiHistory()">🗑️ 清除紀錄</button>
      </div>
    </div>
    ${toolHtml}`;
  _renderAiHistory();
}

// ═══ INIT ═══
buildSidebar();
renderMainPanel();
