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
    { id:'tmd_singleItem', ep:'/GetSingleForeverItemBySigleAccount', icon:'🎁', label:'單一物品', vLabel:'物品ID2', def:100, mapFn:(a,v)=>({account:a,itemId:1,itemId2:v,amount:1}) },
    { id:'tmd_contItem',   ep:'/GetContinuouslyForeverItemBySigleAccount', icon:'📦', label:'區間物品', vLabel:'結束ID', def:10, mapFn:(a,v)=>({account:a,itemId:1,beginItemId2:1,endItemId2:v,amount:1}) },
    { id:'tmd_score',      ep:'/ScoreboardAssignScore', icon:'🏆', label:'排行榜', vLabel:'分數', def:10000, mapFn:(a,v)=>({id:1,account:a,score:v}) },
  ],
  vf: [
    { id:'vf_money', ep:'/Test_ModifyMoney',     icon:'💰', label:'修改財產',    vLabel:'金額',     def:100000, mapFn:(a,v)=>({accountId:parseInt(a,10)||0,currencyType:66,amount:String(v)}) },
    { id:'vf_vip',   ep:'/Test_ModifyVipInfo',   icon:'👑', label:'修改VIP',     vLabel:'VIP等級',  def:5,      mapFn:(a,v)=>({accountId:parseInt(a,10)||0,vipLv:v}) },
    { id:'vf_level', ep:'/Test_ModifyLevelInfo', icon:'📊', label:'修改等級',    vLabel:'等級',     def:10,     mapFn:(a,v)=>({accountId:parseInt(a,10)||0,Level:v}) },
    { id:'vf_bolt',  ep:'/Test_ModifyBoltPower', icon:'⚡', label:'BoltPower',   vLabel:'數值',     def:100,    mapFn:(a,v)=>({accountId:parseInt(a,10)||0,boltPower:v}) },
  ],
};

// ── Skills ──
const AI_SKILLS = {
  'aio-rich':{ game:'aio', desc:'金幣+鑽石+VIP', icon:'⭐', steps:a=>[
    {ep:'/ChangeBill',p:{userName:a,currencyType:1,money:999999}},{ep:'/ChangeBill',p:{userName:a,currencyType:2,money:999999}},{ep:'/ChangeVIP',p:{userName:a,level:10,tLevel:0,resetTime:0}}
  ]},
  'tmd-rich':{ game:'tmd', desc:'紅鑽+VIP', icon:'🀄', steps:a=>[
    {ep:'/UpdatePlayerMoney',p:{account:a,amount:999999}},{ep:'/UpdatePlayerVip',p:{account:a,vip:10}}
  ]},
  'tmd-max':{ game:'tmd', desc:'全拉滿', icon:'🀄', steps:a=>[
    {ep:'/UpdatePlayerMoney',p:{account:a,amount:9999999}},{ep:'/UpdatePlayerVip',p:{account:a,vip:10}},{ep:'/Horse_ChangeUserLevel',p:{account:a,level:5}}
  ]},
  'vf-rich':{ game:'vf', desc:'金幣+VIP', icon:'🎰', steps:a=>[
    {ep:'/Test_ModifyMoney',p:{accountId:parseInt(a,10)||0,currencyType:66,amount:'999999'}},{ep:'/Test_ModifyVipInfo',p:{accountId:parseInt(a,10)||0,vipLv:10}}
  ]},
};

// ── Proxy 智慧引擎 ──
let _localProxyOk = false; // 本地 proxy 是否可用

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

function _raceFetch(url, timeoutMs=8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, {signal: ctrl.signal}).then(r => { clearTimeout(timer); return r; });
}

async function _fetchViaProxy(url) {
  // 策略 1：本地 proxy 可用 → 優先走本地（最快）
  if (_localProxyOk) {
    try {
      return await _raceFetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`, 8000);
    } catch {
      _localProxyOk = false;
      _updateProxyBadge();
    }
  }

  // 策略 2：雲端代理競速（適用 GitHub Pages，所有 URL 都嘗試）
  const candidates = [
    _raceFetch(`https://corsproxy.io/?${url}`, 8000).then(r => { if(!r.ok && r.status>=500) throw new Error('5xx'); return r; }),
    _raceFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 8000).then(r => { if(!r.ok && r.status>=500) throw new Error('5xx'); return r; }),
  ];
  // 也同時嘗試本地 proxy（萬一剛好啟動了）
  candidates.push(
    _raceFetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`, 3000)
      .then(r => { _localProxyOk = true; _updateProxyBadge(); return r; })
      .catch(() => { throw new Error('local unavailable'); })
  );
  try { return await Promise.any(candidates); }
  catch { /* all failed */ }

  // 最後嘗試直連
  return _raceFetch(url, 5000);
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
  // Show command table & skills
  document.getElementById('cmdTableArea').style.display='block';
  document.getElementById('skillArea').style.display='block';
  document.getElementById('btnExec').disabled=false;
  // Reset rows and add one empty row
  cmdRows=[];
  addRow();
  // Render skills
  const g=GAMES[gameKey];
  const skills=Object.entries(AI_SKILLS).filter(([,s])=>s.game===gameKey);
  const sa=document.getElementById('skillContent');
  sa.innerHTML=skills.map(([name,s])=>`<button class="skill-chip" onclick="runSkill('${name}')"><span class="skill-icon">${s.icon}</span> ${s.desc}</button>`).join('');
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
  const valEl=document.getElementById('val-'+id);
  if(accEl)row.account=accEl.value.trim();
  if(actEl)row.actionIdx=parseInt(actEl.value,10);
  if(valEl)row.value=valEl.value;
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
  row.value=action.noVal?'':String(action.def);
  // Re-render just the value cell
  const valCell=document.getElementById('valcell-'+id);
  if(valCell){
    if(action.noVal){
      valCell.innerHTML=`<span class="no-val-tag">無需數值</span>`;
    }else{
      valCell.innerHTML=`<input class="fi row-val" type="number" id="val-${id}" value="${action.def}" placeholder="${action.vLabel}" title="${action.vLabel}">`;
    }
  }
}

function _renderTable(){
  if(!selectedGame)return;
  const actions=GAME_ACTIONS[selectedGame];
  const g=GAMES[selectedGame];
  const tbody=document.getElementById('cmdTbody');
  tbody.innerHTML=cmdRows.map(row=>{
    const action=actions[row.actionIdx]||actions[0];
    const valHtml=action.noVal
      ?`<span class="no-val-tag">無需數值</span>`
      :`<input class="fi row-val" type="number" id="val-${row.id}" value="${row.value!==null?row.value:action.def}" placeholder="${action.vLabel}" title="${action.vLabel}">`;
    return `<tr class="cmd-row" id="row-${row.id}">
      <td><input class="fi row-acc" type="text" id="acc-${row.id}" value="${_esc(row.account)}" placeholder="帳號" autocomplete="off"></td>
      <td><select class="fi row-act" id="act-${row.id}" onchange="onActionChange(${row.id})">
        ${actions.map((a,i)=>`<option value="${i}" ${i===row.actionIdx?'selected':''}>${a.icon} ${a.label}</option>`).join('')}
      </select></td>
      <td id="valcell-${row.id}">${valHtml}</td>
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
    const val=action.noVal?null:(parseInt(row.value,10)||action.def);
    const params=action.mapFn(row.account,val);
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
    detail:results.map(r=>`${r.ok?'✅':'❌'} ${r.account} → ${r.action} [${r.status}]`).join('\n')
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

// ── Skill execution ──
async function runSkill(skillName){
  if(!selectedGame){toast('請先選擇遊戲','err');return;}
  _syncAllRows();
  const accounts=[...new Set(cmdRows.filter(r=>r.account).map(r=>r.account))];
  if(!accounts.length){toast('請先輸入帳號','err');return;}
  const skill=AI_SKILLS[skillName];if(!skill)return;
  const g=GAMES[selectedGame];const platform=g.platform();
  const btn=document.getElementById('btnExec');btn.classList.add('loading');btn.disabled=true;
  _resultHistory.push({role:'user',label:accounts.join(', '),text:`⚡ 技能: ${skill.icon} ${skill.desc} (${accounts.length} 帳號)`});
  _renderResults();
  const t0=Date.now();
  const all=await Promise.all(accounts.map(async acc=>{
    const steps=skill.steps(acc);
    const res=await Promise.all(steps.map(async s=>{try{const r=await _execApi(platform.base,s.ep,s.p);return{ok:r.ok,status:r.status};}catch(e){return{ok:false,status:0};}}));
    return{account:acc,results:res};
  }));
  const elapsed=Date.now()-t0;
  const totalS=all.reduce((s,r)=>s+r.results.length,0);
  const totalOk=all.reduce((s,r)=>s+r.results.filter(x=>x.ok).length,0);
  _resultHistory.push({role:'bot',ok:totalOk===totalS,label:`技能: ${skill.desc}`,
    text:totalOk===totalS?`✅ 技能完成！(${accounts.length} 帳號，${totalOk}/${totalS}，${elapsed}ms)`:`⚠️ 部分失敗 (${totalOk}/${totalS}，${elapsed}ms)`,
    detail:all.map(ar=>`👤 ${ar.account}: `+ar.results.map(r=>r.ok?'✅':'❌').join(' ')).join('\n')
  });
  _renderResults();btn.classList.remove('loading');btn.disabled=false;
  toast(totalOk===totalS?`✅ 技能完成 (${elapsed}ms)`:'⚠️ 部分失敗',totalOk===totalS?'ok':'err');
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

      <!-- Skills -->
      <div class="section-card" id="skillArea" style="display:none">
        <div class="section-title"><span class="step-num">⚡</span> 一鍵技能（快捷）</div>
        <div class="skill-grid" id="skillContent"></div>
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
