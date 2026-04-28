// ═══════════════════════════════════════════════════
// AI 自動改財產 — Standalone App v5.1
// ✅ 每行獨立設定：帳號 + 操作 + 數值
// ✅ 多帳號不同設定同時執行
// ═══════════════════════════════════════════════════

const AI_TOOL_REGISTRY = [];
function _registerAiTools() {
  PLATFORM_AIO.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_AIO, tool: t, game: 'aio' }));
  PLATFORM_TMD.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_TMD, tool: t, game: 'tmd' }));
  PLATFORM_VF.tools.forEach(t => AI_TOOL_REGISTRY.push({ platform: PLATFORM_VF, tool: t, game: 'vf' }));
}

const GAMES = {
  aio: { name: '明星3缺1', icon: '⭐', color: '#a78bfa', platform: () => PLATFORM_AIO },
  tmd: { name: '滿貫大亨', icon: '🀄', color: '#fbbf24', platform: () => PLATFORM_TMD },
  vf:  { name: 'Vegas Frenzy', icon: '🎰', color: '#f472b6', platform: () => PLATFORM_VF },
};
let selectedGame = null;
let cmdRows = []; // {id, account, actionIdx, value}
let rowIdCounter = 0;

// ── Actions per game (ep = endpoint, 直接寫死不需查表) ──
const GAME_ACTIONS = {
  aio: [
    { id:'aio_money',   ep:'/ChangeBill',   icon:'💰', label:'改金幣',     vLabel:'金幣數量',  def:500000,  mapFn:(a,v)=>({userName:a,currencyType:1,money:v}) },
    { id:'aio_diamond', ep:'/ChangeBill',   icon:'💎', label:'改鑽石',     vLabel:'鑽石數量',  def:100000,  mapFn:(a,v)=>({userName:a,currencyType:2,money:v}) },
    { id:'aio_vip',     ep:'/ChangeVIP',    icon:'👑', label:'改VIP',      vLabel:'VIP等級',   def:8,       mapFn:(a,v)=>({userName:a,level:v,tLevel:0,resetTime:0}) },
    { id:'aio_level',   ep:'/TestLevelUp',  icon:'📊', label:'改等級',     vLabel:'目標等級',  def:10,      mapFn:(a,v)=>({userName:a,targetLevel:v}) },
    { id:'aio_deposit', ep:'/TestDeposit',  icon:'💳', label:'測試儲值',   vLabel:'儲值金額',  def:100,     mapFn:(a,v)=>({userName:a,amount:v,currencyType:1}) },
    { id:'aio_refill',  ep:'/ResetRefillInfo', icon:'🔄', label:'清除補幣', vLabel:null, noVal:true, mapFn:(a)=>({userName:a}) },
    { id:'aio_skill',   ep:'/ChangeSkillCard', icon:'🃏', label:'改技能卡', vLabel:'數量', def:10, mapFn:(a,v)=>({account:a,itemNo:20001,amount:v}) },
    { id:'aio_godsend', ep:'/GodsendGivePrizeToFreeGameCard', icon:'🎁', label:'天降好禮', vLabel:'物品編號', def:13601001, mapFn:(a,v)=>({account:a,itemIndex:String(v),amount:1}) },
    { id:'aio_bp_score',ep:'/BattlePassAddScore', icon:'🏅', label:'BP分數', vLabel:'分數', def:100, mapFn:(a,v)=>({account:a,addScore:v}) },
    { id:'aio_bp_cond', ep:'/BattlePassConditionCount', icon:'✅', label:'BP條件', vLabel:null, noVal:true, mapFn:(a)=>({account:a,condition:1,count:1}) },
  ],
  tmd: [
    { id:'tmd_money',      ep:'/UpdatePlayerMoney',   icon:'💎', label:'調整紅鑽',   vLabel:'紅鑽數量',def:500000, mapFn:(a,v)=>({account:a,amount:v}) },
    { id:'tmd_vip',        ep:'/UpdatePlayerVip',     icon:'👑', label:'調整VIP',    vLabel:'VIP等級', def:8,      mapFn:(a,v)=>({account:a,vip:v}) },
    { id:'tmd_horse',      ep:'/Horse_ChangeUserLevel', icon:'🐴', label:'調整金馬', vLabel:'金馬等級',def:3, mapFn:(a,v)=>({account:a,level:v}) },
    { id:'tmd_clearPkg',   ep:'/ClearPlayerPackage',  icon:'🎒', label:'清空背包',   vLabel:null, noVal:true, mapFn:(a)=>({account:a}) },
    { id:'tmd_singleItem', ep:'/GetSingleForeverItemBySigleAccount', icon:'🎁', label:'單一物品',
      fields:[{k:'itemId',lbl:'物品ID',def:1},{k:'itemId2',lbl:'物品ID2',def:100},{k:'amount',lbl:'數量',def:1}],
      multiVal:true, mapFn:(a,f)=>({account:a,itemId:f.itemId,itemId2:f.itemId2,amount:f.amount}) },
    { id:'tmd_contItem', ep:'/GetContinuouslyForeverItemBySigleAccount', icon:'📦', label:'區間物品',
      fields:[{k:'itemId',lbl:'物品ID',def:1},{k:'beginItemId2',lbl:'起始ID2',def:1},{k:'endItemId2',lbl:'結束ID2',def:10},{k:'amount',lbl:'數量',def:1}],
      multiVal:true, mapFn:(a,f)=>({account:a,itemId:f.itemId,beginItemId2:f.beginItemId2,endItemId2:f.endItemId2,amount:f.amount}) },
    { id:'tmd_score',      ep:'/ScoreboardAssignScore', icon:'🏆', label:'排行榜', vLabel:'分數', def:10000, mapFn:(a,v)=>({id:1,account:a,score:v}) },
  ],
  vf: [
    { id:'vf_money', ep:'/Test_ModifyMoney',     icon:'💰', label:'修改財產',    vLabel:'金額',     def:100000, mapFn:(a,v)=>({accountId:parseInt(a,10)||0,currencyType:66,amount:String(v)}) },
    { id:'vf_vip',   ep:'/Test_ModifyVipInfo',   icon:'👑', label:'修改VIP',     vLabel:'VIP等級',  def:5,      mapFn:(a,v)=>({accountId:parseInt(a,10)||0,vipLv:v}) },
    { id:'vf_level', ep:'/Test_ModifyLevelInfo', icon:'📊', label:'修改等級',    vLabel:'等級',     def:10,     mapFn:(a,v)=>({accountId:parseInt(a,10)||0,Level:v}) },
    { id:'vf_bolt',  ep:'/Test_ModifyBoltPower', icon:'⚡', label:'BoltPower',   vLabel:'數值',     def:100,    mapFn:(a,v)=>({accountId:parseInt(a,10)||0,boltPower:v}) },
  ],
};

// ── NLP 口語化解析規則 ──
const NLP_RULES = [
  // AIO
  { game:'aio', kw:['明星','aio','star'], sub:['金幣','錢','coin','money','改金','金'], actionId:'aio_money', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['鑽石','diamond','鑽','改鑽'], actionId:'aio_diamond', extractVal:true,
    resolve:(a,v)=>({ep:'/ChangeBill', params:{userName:a,currencyType:2,money:v||100000}}) },
  { game:'aio', kw:['明星','aio','star'], sub:['vip'], actionId:'aio_vip', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['等級','level','升級'], actionId:'aio_level', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['儲值','deposit','充值'], actionId:'aio_deposit', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['補幣','refill'], actionId:'aio_refill', extractVal:false },
  { game:'aio', kw:['明星','aio','star'], sub:['技能卡','skill'], actionId:'aio_skill', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['天降','godsend'], actionId:'aio_godsend', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['bp','battlepass','通行證'], actionId:'aio_bp_score', extractVal:true },
  { game:'aio', kw:['明星','aio','star'], sub:['bp條件','任務條件'], actionId:'aio_bp_cond', extractVal:false },
  // TMD
  { game:'tmd', kw:['滿貫','tmd'], sub:['紅鑽','錢','鑽石','money','金'], actionId:'tmd_money', extractVal:true },
  { game:'tmd', kw:['滿貫','tmd'], sub:['vip'], actionId:'tmd_vip', extractVal:true },
  { game:'tmd', kw:['滿貫','tmd'], sub:['金馬','horse','馬'], actionId:'tmd_horse', extractVal:true },
  { game:'tmd', kw:['滿貫','tmd'], sub:['清空背包','背包','clear'], actionId:'tmd_clearPkg', extractVal:false },
  { game:'tmd', kw:['滿貫','tmd'], sub:['單一物品','item'], actionId:'tmd_singleItem', extractVal:true },
  { game:'tmd', kw:['滿貫','tmd'], sub:['區間物品','continuous'], actionId:'tmd_contItem', extractVal:true },
  { game:'tmd', kw:['滿貫','tmd'], sub:['排行榜','score'], actionId:'tmd_score', extractVal:true },
  // VF
  { game:'vf', kw:['vf','vegas','frenzy'], sub:['錢','金幣','money','財產','gold','金'], actionId:'vf_money', extractVal:true },
  { game:'vf', kw:['vf','vegas','frenzy'], sub:['vip'], actionId:'vf_vip', extractVal:true },
  { game:'vf', kw:['vf','vegas','frenzy'], sub:['等級','level'], actionId:'vf_level', extractVal:true },
  { game:'vf', kw:['vf','vegas','frenzy'], sub:['bolt','boltpower'], actionId:'vf_bolt', extractVal:true },
];

function _extractNumber(text) {
  const m = text.match(/(\d[\d,]*)/);
  return m ? parseInt(m[1].replace(/,/g,''),10) : null;
}

// 從口語輸入解析出 [{game, actionId, account, value}]
// 已選平台時不需打平台名，如「ray1 改金幣 500000」
function _nlpParse(input) {
  const lower = input.toLowerCase().trim();
  const tokens = input.trim().split(/\s+/);

  // 先嘗試帶平台名的完整匹配
  for (const rule of NLP_RULES) {
    if (rule.kw.some(k => lower.includes(k.toLowerCase())) && rule.sub.some(s => lower.includes(s.toLowerCase()))) {
      return [_extractMatch(rule, tokens, input, false)];
    }
  }
  // 若上方已選平台，只用 sub 關鍵字匹配（不需打平台名）
  if (selectedGame) {
    for (const rule of NLP_RULES.filter(r => r.game === selectedGame)) {
      if (rule.sub.some(s => lower.includes(s.toLowerCase()))) {
        return [_extractMatch(rule, tokens, input, true)];
      }
    }
  }
  return [];
}

function _extractMatch(rule, tokens, input, skipGameKw) {
  const allKw = skipGameKw ? [...rule.sub] : [...rule.kw, ...rule.sub];
  let account = null;
  const numericTokens = [];
  for (const tk of tokens) {
    const tkL = tk.toLowerCase();
    if (allKw.some(k => tkL.includes(k.toLowerCase()) || k.toLowerCase().includes(tkL))) continue;
    if (['改','設','調','加','設定','修改','調整'].some(w => tkL === w)) continue;
    if (/^\d+$/.test(tk)) { numericTokens.push(tk); continue; }
    account = tk; break;
  }
  if (!account && numericTokens.length >= 2) account = numericTokens[0];
  if (!account && numericTokens.length === 1 && rule.game === 'vf') account = numericTokens[0];
  const val = rule.extractVal ? _extractNumber(input.replace(account||'','').trim()) : null;
  return { game: rule.game, actionId: rule.actionId, account, value: val };
}

async function _nlpExec(input) {
  const parsed = _nlpParse(input);
  const hint = selectedGame
    ? '已選' + GAMES[selectedGame].icon + '，直接輸入如：「ray1 改金幣 500000」'
    : '請先選擇平台，或輸入：「明星 ray1 改金幣 500000」';
  if (!parsed.length) return { ok:false, msg:'❌ 無法辨識指令。' + hint };
  const p = parsed[0];
  if (!p.account) return { ok:false, msg:'❌ 找不到帳號。' + hint };
  const actions = GAME_ACTIONS[p.game];
  if (!actions) return { ok:false, msg:'❌ 未知平台: ' + p.game };
  const action = actions.find(a => a.id === p.actionId);
  if (!action) return { ok:false, msg:'❌ 未知操作: ' + p.actionId };
  const val = action.noVal ? null : (p.value || action.def);
  const params = action.mapFn(p.account, val);
  const g = GAMES[p.game];
  const platform = g.platform();
  try {
    const r = await _execApi(platform.base, action.ep, params);
    return { ok:r.ok, msg:r.ok ? `✅ ${g.icon} ${p.account} → ${action.label}${action.noVal?'':' = '+val}` : `❌ 失敗 HTTP ${r.status}`, detail:r.text };
  } catch(e) {
    return { ok:false, msg:'❌ 錯誤: '+e.message };
  }
}

let _nlpHistory = [];

// ── Proxy 智慧引擎 v3 ──
// 設計目標：GitHub Pages 零本地依賴、高速、低錯誤率
let _localProxyOk = false;
let _proxyStats = {}; // {proxyIdx: {ok:N, fail:N, avgMs:N}} — 追蹤成功率

// 開機自動偵測本地 proxy
async function _detectLocalProxy() {
  try {
    const r = await fetch('http://localhost:8787/api/proxy?url=' + encodeURIComponent('https://example.com'), {signal: AbortSignal.timeout(2000)});
    _localProxyOk = true;
  } catch { _localProxyOk = false; }
  _updateProxyBadge();
}

function _updateProxyBadge() {
  const el = document.getElementById('proxyStatus');
  if (!el) return;
  if (_localProxyOk) {
    el.textContent = '🟢 本地代理';
    el.style.background = 'rgba(45,212,160,.15)';
    el.style.color = '#6ee7b7';
  } else {
    el.textContent = '☁️ 雲端模式';
    el.style.background = 'rgba(251,191,36,.15)';
    el.style.color = '#fbbf24';
  }
}

// 帶超時的 fetch
function _timedFetch(url, ms=8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {signal: ctrl.signal}).then(r => { clearTimeout(timer); return r; });
}

// 雲端代理池（6 個備選，分散風險）
const CLOUD_PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://corsproxy.org/?${encodeURIComponent(u)}`,
  u => `https://proxy.cors.sh/${u}`,
  u => `https://thingproxy.freeboard.io/fetch/${u}`,
];

// 記錄代理成功/失敗
function _recordProxy(idx, ok, ms) {
  if (!_proxyStats[idx]) _proxyStats[idx] = {ok:0, fail:0, totalMs:0, count:0};
  const s = _proxyStats[idx];
  ok ? s.ok++ : s.fail++;
  if (ms) { s.totalMs += ms; s.count++; }
}

// 取得排序後的代理索引（成功率高、速度快的排前面）
function _rankedProxyIndices() {
  const indices = CLOUD_PROXIES.map((_,i) => i);
  return indices.sort((a,b) => {
    const sa = _proxyStats[a], sb = _proxyStats[b];
    if (!sa && !sb) return 0;
    if (!sa) return 1;
    if (!sb) return -1;
    const rateA = sa.ok / (sa.ok + sa.fail || 1);
    const rateB = sb.ok / (sb.ok + sb.fail || 1);
    if (Math.abs(rateA - rateB) > 0.2) return rateB - rateA; // 成功率差異大 → 優先成功率高的
    const avgA = sa.count ? sa.totalMs / sa.count : 9999;
    const avgB = sb.count ? sb.totalMs / sb.count : 9999;
    return avgA - avgB; // 速度快的排前
  });
}

async function _fetchViaProxy(url) {
  // 策略 1：本地 proxy 可用 → 優先走本地（最快最穩）
  if (_localProxyOk) {
    try {
      return await _timedFetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`, 8000);
    } catch {
      _localProxyOk = false;
      _updateProxyBadge();
    }
  }

  // 策略 2：智慧競速 — 依歷史表現排序，前 3 個競速
  const ranked = _rankedProxyIndices();
  const wave1 = ranked.slice(0, 3);
  const wave2 = ranked.slice(3);

  // Wave 1：前 3 個代理同時競速（8秒超時）
  const wave1Promises = wave1.map(idx => {
    const t0 = Date.now();
    return _timedFetch(CLOUD_PROXIES[idx](url), 8000)
      .then(r => {
        if (!r.ok && r.status >= 500) throw new Error('5xx');
        _recordProxy(idx, true, Date.now() - t0);
        return r;
      })
      .catch(e => { _recordProxy(idx, false); throw e; });
  });
  // 也偷偷嘗試本地 proxy（萬一剛啟動）
  wave1Promises.push(
    _timedFetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`, 3000)
      .then(r => { _localProxyOk = true; _updateProxyBadge(); return r; })
      .catch(() => { throw new Error('local'); })
  );
  try { return await Promise.any(wave1Promises); } catch { /* Wave 1 全失敗 */ }

  // Wave 2：剩餘 3 個代理同時競速（12秒超時）
  if (wave2.length) {
    const wave2Promises = wave2.map(idx => {
      const t0 = Date.now();
      return _timedFetch(CLOUD_PROXIES[idx](url), 12000)
        .then(r => {
          if (!r.ok && r.status >= 500) throw new Error('5xx');
          _recordProxy(idx, true, Date.now() - t0);
          return r;
        })
        .catch(e => { _recordProxy(idx, false); throw e; });
    });
    try { return await Promise.any(wave2Promises); } catch { /* Wave 2 全失敗 */ }
  }

  // 策略 3：最後逐一重試表現最好的前 3 個（15秒超時，最後手段）
  for (const idx of ranked.slice(0, 3)) {
    try {
      const t0 = Date.now();
      const r = await _timedFetch(CLOUD_PROXIES[idx](url), 15000);
      if (r.ok || r.status < 500) {
        _recordProxy(idx, true, Date.now() - t0);
        return r;
      }
    } catch { /* next */ }
  }

  throw new Error('所有代理均無法連線，請稍後再試');
}

async function _execApi(base, ep, params) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k,v]) => qs.append(k,v));
  const url = base + ep + (qs.toString() ? '?' + qs.toString() : '');
  const res = await _fetchViaProxy(url);
  return {ok: res.ok, status: res.status, text: await res.text(), url};
}

// ── Helpers ──
let _resultHistory=[];
function _esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
function toast(msg,type='ok'){
  const box=document.getElementById('toastBox');const el=document.createElement('div');
  el.className='toast '+type;el.textContent=msg;box.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),300);},3500);
}

// _findToolEntry removed — endpoints are now embedded directly in GAME_ACTIONS

function _renderResults(){
  const c=document.getElementById('resultMessages');if(!c)return;
  if(!_resultHistory.length){c.innerHTML=`<div class="results-empty"><span class="empty-icon">📋</span><span>執行結果將顯示在這裡</span></div>`;return;}
  c.innerHTML='<div class="result-list">'+_resultHistory.map(msg=>{
    if(msg.role==='user')return `<div class="result-item user"><div class="result-header">👤 ${_esc(msg.label)}</div><div class="result-body">${_esc(msg.text)}</div></div>`;
    const cls=msg.ok?'ok':'err';
    return `<div class="result-item bot ${cls}"><div class="result-header">🤖 ${_esc(msg.label)}</div><div class="result-body">${_esc(msg.text)}</div>${msg.detail?`<div class="result-detail">${_esc(msg.detail)}</div>`:''}</div>`;
  }).join('')+'</div>';
  c.scrollTop=c.scrollHeight;
}

// ══════════════════════════════════════
// SELECT GAME
// ══════════════════════════════════════
function selectGame(gameKey){
  selectedGame=gameKey;
  document.querySelectorAll('.game-card').forEach(b=>b.classList.remove('active'));
  document.getElementById('game-'+gameKey)?.classList.add('active');
  // Show command table
  document.getElementById('cmdTableArea').style.display='block';
  document.getElementById('btnExec').disabled=false;
  // Reset rows and add one empty row
  cmdRows=[];
  addRow();
  const g=GAMES[gameKey];
  toast(`已選擇 ${g.icon} ${g.name}`,'info');
}

// ══════════════════════════════════════
// COMMAND ROW MANAGEMENT
// ══════════════════════════════════════
function addRow(account='',actionIdx=0,value=null){
  const id=rowIdCounter++;
  cmdRows.push({id,account,actionIdx,value});
  _renderTable();
  // Focus the new row's account input after render
  setTimeout(()=>{const el=document.getElementById('acc-'+id);if(el&&!account)el.focus();},50);
}

function removeRow(id){
  cmdRows=cmdRows.filter(r=>r.id!==id);
  if(!cmdRows.length)addRow();
  else _renderTable();
}

function duplicateRow(id){
  const src=cmdRows.find(r=>r.id===id);
  if(!src)return;
  // Read current DOM values
  _syncRowFromDom(id);
  addRow(src.account,src.actionIdx,src.value);
}

function _syncRowFromDom(id){
  const row=cmdRows.find(r=>r.id===id);if(!row)return;
  const accEl=document.getElementById('acc-'+id);
  const actEl=document.getElementById('act-'+id);
  if(accEl)row.account=accEl.value.trim();
  if(actEl)row.actionIdx=parseInt(actEl.value,10);
  // multiVal: sync each field
  if(selectedGame){
    const action=GAME_ACTIONS[selectedGame][row.actionIdx];
    if(action&&action.multiVal&&action.fields){
      if(!row.fieldValues)row.fieldValues={};
      action.fields.forEach(f=>{
        const el=document.getElementById('mf-'+f.k+'-'+id);
        if(el)row.fieldValues[f.k]=el.value;
      });
      return;
    }
  }
  const valEl=document.getElementById('val-'+id);
  const val2El=document.getElementById('val2-'+id);
  if(valEl)row.value=valEl.value;
  if(val2El)row.value2=val2El.value;
}

function _syncAllRows(){
  cmdRows.forEach(r=>_syncRowFromDom(r.id));
}

function onActionChange(id){
  _syncRowFromDom(id);
  const row=cmdRows.find(r=>r.id===id);
  if(!row||!selectedGame)return;
  const actions=GAME_ACTIONS[selectedGame];
  const action=actions[row.actionIdx];
  row.value=action.noVal?'':String(action.def||'');
  if(action.dualVal) row.value2=String(action.def2||'');
  if(action.multiVal&&action.fields){
    row.fieldValues={};
    action.fields.forEach(f=>row.fieldValues[f.k]=String(f.def));
  }
  // Re-render just the value cell
  const valCell=document.getElementById('valcell-'+id);
  if(valCell) valCell.innerHTML=_buildValHtml(action,row);
}

// 生成數值欄位 HTML
function _buildValHtml(action,row){
  if(action.noVal) return `<span class="no-val-tag">無需數值</span>`;
  if(action.multiVal&&action.fields){
    const fv=row.fieldValues||{};
    return `<div style="display:flex;gap:6px">${action.fields.map(f=>
      `<div style="flex:1;min-width:0"><div style="font-size:10px;color:var(--t3);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.lbl}</div><input class="fi row-val" type="number" id="mf-${f.k}-${row.id}" value="${fv[f.k]!==undefined?fv[f.k]:f.def}" placeholder="${f.lbl}" title="${f.lbl}" style="width:100%"></div>`
    ).join('')}</div>`;
  }
  if(action.dualVal){
    return `<div style="display:flex;gap:4px"><input class="fi row-val" type="number" id="val-${row.id}" value="${row.value!==null?row.value:action.def}" placeholder="${action.vLabel}" title="${action.vLabel}" style="flex:1"><input class="fi row-val" type="number" id="val2-${row.id}" value="${row.value2!==undefined?row.value2:action.def2}" placeholder="${action.vLabel2}" title="${action.vLabel2}" style="flex:1"></div>`;
  }
  return `<input class="fi row-val" type="number" id="val-${row.id}" value="${row.value!==null?row.value:action.def}" placeholder="${action.vLabel}" title="${action.vLabel}">`;
}

function _renderTable(){
  if(!selectedGame)return;
  const actions=GAME_ACTIONS[selectedGame];
  const g=GAMES[selectedGame];
  const tbody=document.getElementById('cmdTbody');
  tbody.innerHTML=cmdRows.map(row=>{
    const action=actions[row.actionIdx]||actions[0];
    return `<tr class="cmd-row" id="row-${row.id}">
      <td><input class="fi row-acc" type="text" id="acc-${row.id}" value="${_esc(row.account)}" placeholder="帳號" autocomplete="off"></td>
      <td><select class="fi row-act" id="act-${row.id}" onchange="onActionChange(${row.id})">
        ${actions.map((a,i)=>`<option value="${i}" ${i===row.actionIdx?'selected':''}>${a.icon} ${a.label}</option>`).join('')}
      </select></td>
      <td id="valcell-${row.id}">${_buildValHtml(action,row)}</td>
      <td class="row-actions">
        <button class="row-btn row-btn-dup" onclick="duplicateRow(${row.id})" title="複製此行">📋</button>
        <button class="row-btn row-btn-del" onclick="removeRow(${row.id})" title="刪除此行">✕</button>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('rowCount').textContent=cmdRows.length;
}

// Batch add: modal with textarea for multi-line paste
function batchAddAccounts(){
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'batchModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--raised);border:1px solid rgba(108,140,255,.15);border-radius:16px;padding:24px;width:420px;max-width:90vw;box-shadow:0 24px 80px rgba(0,0,0,.5)">
      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:12px">📋 批次貼上帳號</div>
      <div style="font-size:12px;color:var(--t3);margin-bottom:12px">每行一個帳號，或用逗號分隔</div>
      <textarea id="batchTextarea" style="width:100%;min-height:160px;padding:12px;background:var(--input);border:1px solid var(--bdr);border-radius:10px;color:#fff;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;resize:vertical;outline:none" placeholder="ray1&#10;ray2&#10;ray3&#10;ray4"></textarea>
      <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">
        <button onclick="document.getElementById('batchModal').remove()" style="padding:8px 20px;border-radius:8px;border:1px solid rgba(108,140,255,.1);background:transparent;color:var(--t2);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">取消</button>
        <button onclick="_doBatchAdd()" style="padding:8px 20px;border-radius:8px;border:none;background:var(--gradient-main);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 12px rgba(108,140,255,.3)">確認新增</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  // Focus textarea
  setTimeout(() => document.getElementById('batchTextarea')?.focus(), 100);
  // Close on overlay click
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
}

function _doBatchAdd(){
  const ta = document.getElementById('batchTextarea');
  const text = ta?.value || '';
  document.getElementById('batchModal')?.remove();
  if(!text.trim()) return;
  _syncAllRows();
  const accounts = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  if(!accounts.length) return;
  // If only 1 empty row exists, replace it
  if(cmdRows.length===1 && !cmdRows[0].account){
    cmdRows[0].account = accounts[0];
    accounts.slice(1).forEach(a => { const id=rowIdCounter++; cmdRows.push({id, account:a, actionIdx:cmdRows[0].actionIdx, value:null}); });
  } else {
    accounts.forEach(a => { const id=rowIdCounter++; cmdRows.push({id, account:a, actionIdx:0, value:null}); });
  }
  _renderTable();
  toast(`已新增 ${accounts.length} 個帳號`, 'info');
}

// Apply same action+value to all rows
function applyToAll(){
  _syncAllRows();
  if(!cmdRows.length)return;
  const first=cmdRows[0];
  cmdRows.forEach(r=>{r.actionIdx=first.actionIdx;r.value=first.value;});
  _renderTable();
  toast('已套用第一行設定到所有行','info');
}

// ══════════════════════════════════════
// EXECUTE
// ══════════════════════════════════════
async function execSubmit(){
  if(!selectedGame){toast('⚠️ 請先選擇遊戲平台','err');return;}
  _syncAllRows();
  const g=GAMES[selectedGame];
  const actions=GAME_ACTIONS[selectedGame];
  const platform=g.platform();

  // Validate
  const validRows=cmdRows.filter(r=>r.account);
  if(!validRows.length){toast('請至少輸入一個帳號','err');return;}

  const btn=document.getElementById('btnExec');
  btn.classList.add('loading');btn.disabled=true;

  // Build summary
  const summary=validRows.map(r=>{
    const act=actions[r.actionIdx]||actions[0];
    return `${r.account} → ${act.label}${act.noVal?'':' '+r.value}`;
  }).join('、');
  _resultHistory.push({role:'user',label:`${validRows.length} 筆指令`,text:`[${g.icon} ${g.name}] ${summary}`});
  _renderResults();

  const startTime=Date.now();
  // Execute all rows in parallel
  const results=await Promise.all(validRows.map(async row=>{
    const action=actions[row.actionIdx]||actions[0];
    let params;
    if(action.multiVal&&action.fields){
      const fv=row.fieldValues||{};
      const fieldObj={};
      action.fields.forEach(f=>fieldObj[f.k]=parseInt(fv[f.k],10)||f.def);
      params=action.mapFn(row.account,fieldObj);
    }else if(action.dualVal){
      const val=parseInt(row.value,10)||action.def;
      const val2=parseInt(row.value2,10)||action.def2;
      params=action.mapFn(row.account,val,val2);
    }else{
      const val=action.noVal?null:(parseInt(row.value,10)||action.def);
      params=action.mapFn(row.account,val);
    }
    try{
      const r=await _execApi(platform.base,action.ep,params);
      return{account:row.account,action:action.label,ok:r.ok,status:r.status,text:r.text};
    }catch(e){return{account:row.account,action:action.label,ok:false,status:0,text:e.message};}
  }));

  const elapsed=Date.now()-startTime;
  const okCnt=results.filter(r=>r.ok).length;
  const allOk=okCnt===results.length;
  _resultHistory.push({
    role:'bot',ok:allOk,label:`${g.name} 批次執行`,
    text:allOk?`✅ 全部成功！(${results.length} 筆，${elapsed}ms)`:`⚠️ 部分失敗 (${okCnt}/${results.length}，${elapsed}ms)`,
    detail:results.map(r=>`${r.ok?'✅':'❌'} ${r.account} → ${r.action}`).join('\n')
  });
  _renderResults();
  btn.classList.remove('loading');btn.disabled=false;
  // Mark row results
  results.forEach((r,i)=>{
    const rowEl=document.getElementById('row-'+validRows[i].id);
    if(rowEl){rowEl.classList.remove('row-ok','row-err');rowEl.classList.add(r.ok?'row-ok':'row-err');}
  });
  toast(allOk?`✅ ${results.length} 筆完成 (${elapsed}ms)`:`⚠️ 失敗 ${results.length-okCnt} 筆`,allOk?'ok':'err');
}

// ── NLP chat submit ──
async function nlpSubmit(){
  const el=document.getElementById('nlpInput');
  const input=el.value.trim();
  if(!input){toast('請輸入指令','err');return;}
  _nlpHistory.push({role:'user',text:input});
  _renderNlpChat();
  el.value='';
  const r=await _nlpExec(input);
  _nlpHistory.push({role:'bot',ok:r.ok,text:r.msg,detail:r.detail||''});
  _renderNlpChat();
  toast(r.ok?'✅ 執行成功':'❌ 執行失敗',r.ok?'ok':'err');
}

function _renderNlpChat(){
  const c=document.getElementById('nlpMessages');if(!c)return;
  if(!_nlpHistory.length){c.innerHTML='<div class="results-empty"><span class="empty-icon">💬</span><span>在下方輸入口語指令，例如：「明星 ray1 改金幣 500000」</span></div>';return;}
  c.innerHTML='<div class="result-list">'+_nlpHistory.map(msg=>{
    if(msg.role==='user')return `<div class="result-item user"><div class="result-header">👤 你</div><div class="result-body">${_esc(msg.text)}</div></div>`;
    const cls=msg.ok?'ok':'err';
    return `<div class="result-item bot ${cls}"><div class="result-header">🤖 AI</div><div class="result-body">${_esc(msg.text)}</div>${msg.detail?`<div class="result-detail">${_esc(msg.detail)}</div>`:''}</div>`;
  }).join('')+'</div>';
  c.scrollTop=c.scrollHeight;
}

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
function renderApp(){
  if(!AI_TOOL_REGISTRY.length)_registerAiTools();
  document.getElementById('main').innerHTML=`
    <div class="app-container">
      <!-- STEP 1: Game -->
      <div class="section-card">
        <div class="section-title"><span class="step-num">1</span> 選擇遊戲平台</div>
        <div class="game-grid">
          ${Object.entries(GAMES).map(([k,g])=>`<button class="game-card" id="game-${k}" onclick="selectGame('${k}')" style="--gc:${g.color}"><span class="game-icon">${g.icon}</span><span class="game-name">${g.name}</span></button>`).join('')}
        </div>
      </div>

      <!-- COMMAND TABLE -->
      <div class="section-card" id="cmdTableArea" style="display:none">
        <div class="section-title"><span class="step-num">2</span> 設定指令 <span class="row-count-badge"><span id="rowCount">0</span> 筆</span></div>
        <div class="table-toolbar">
          <button class="tb-btn" onclick="addRow()">➕ 新增一行</button>
          <button class="tb-btn" onclick="batchAddAccounts()">📋 批次貼上帳號</button>
          <button class="tb-btn" onclick="applyToAll()">🔄 套用第一行設定到全部</button>
        </div>
        <div class="table-wrap">
          <table class="cmd-table">
            <thead><tr><th>帳號</th><th>操作</th><th>數值</th><th style="width:70px"></th></tr></thead>
            <tbody id="cmdTbody"></tbody>
          </table>
        </div>
      </div>

      <!-- NLP Chat -->
      <div class="section-card">
        <div class="section-title"><span class="step-num">💬</span> 口語化指令（直接輸入即執行）</div>
        <div style="font-size:12px;color:var(--t3);margin-bottom:12px;line-height:1.8">
          上方已選平台時，直接輸入帳號＋操作＋數值即可<br>
          範例：「ray1 改金幣 500000」「ray10 vip 8」（也可加平台名：「明星 ray1 改金幣 500000」）
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <input class="fi" type="text" id="nlpInput" placeholder="ray1 改金幣 500000" style="flex:1" onkeydown="if(event.key==='Enter')nlpSubmit()">
          <button class="btn-exec" onclick="nlpSubmit()" style="padding:10px 20px;font-size:13px"><span class="btn-text">⚡ 執行</span></button>
        </div>
        <div class="results-area" id="nlpMessages" style="min-height:80px;max-height:300px">
          <div class="results-empty"><span class="empty-icon">💬</span><span>在上方輸入口語指令，例如：「明星 ray1 改金幣 500000」</span></div>
        </div>
        <div style="margin-top:8px;text-align:right"><button class="btn-clear" onclick="_nlpHistory=[];_renderNlpChat()">🗑️ 清除</button></div>
      </div>

      <!-- Execute -->
      <div class="section-card">
        <div class="exec-area">
          <button class="btn-exec" id="btnExec" onclick="execSubmit()" disabled><span class="btn-text">⚡ 執行全部</span></button>
          <button class="btn-clear" onclick="_resultHistory=[];_renderResults()">🗑️ 清除紀錄</button>
        </div>
      </div>

      <!-- Results -->
      <div class="section-card">
        <div class="section-title"><span class="step-num">📊</span> 執行結果</div>
        <div class="results-area" id="resultMessages">
          <div class="results-empty"><span class="empty-icon">📋</span><span>執行結果將顯示在這裡</span></div>
        </div>
      </div>
    </div>`;
}

renderApp();
_detectLocalProxy(); // 自動偵測本地 proxy
