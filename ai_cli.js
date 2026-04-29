#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════
 * AI 自動改財產 — CLI 快速執行工具
 * 直接在終端執行，無需開瀏覽器，零 Token 消耗
 * ═══════════════════════════════════════════════════
 * 
 * Usage:
 *   node ai_cli.js <platform> <account> <action> [value] [extra...]
 *   node ai_cli.js --batch <file.txt>
 *   node ai_cli.js --skill <skillName> <account> [value]
 *   node ai_cli.js --list
 *   node ai_cli.js --skills
 * 
 * Examples:
 *   node ai_cli.js aio ray15 money 500000
 *   node ai_cli.js aio ray15 diamond 100000
 *   node ai_cli.js tmd ray10 money 100000
 *   node ai_cli.js tmd ray10 vip 8
 *   node ai_cli.js vf 163436 money 100000
 *   node ai_cli.js vf 163436 vip 5
 *   node ai_cli.js --skill rich ray15          (預設大量金幣+鑽石+VIP)
 *   node ai_cli.js --skill reset ray15         (重置補幣+清背包)
 *   node ai_cli.js --batch commands.txt        (批量執行)
 */

const http = require('http');
const https = require('https');

const PROXY_HOST = 'localhost';
const PROXY_PORT = 8787;

// ══════════════════════════════════════════════════════
// Platform definitions (mirrors browser platform configs)
// ══════════════════════════════════════════════════════
const PLATFORMS = {
  aio: {
    name: '明星3缺1',
    base: 'http://34.80.13.113/InnerService/Service.asmx',
    actions: {
      money:    { ep: '/ChangeBill',       map: (a, v) => ({ userName: a, currencyType: 1, money: v ?? 100000 }) },
      diamond:  { ep: '/ChangeBill',       map: (a, v) => ({ userName: a, currencyType: 2, money: v ?? 100000 }) },
      coin:     { ep: '/ChangeBill',       map: (a, v) => ({ userName: a, currencyType: 1, money: v ?? 100000 }) },
      vip:      { ep: '/ChangeVIP',        map: (a, v) => ({ userName: a, level: v ?? 5, tLevel: 0, resetTime: 0 }) },
      level:    { ep: '/TestLevelUp',      map: (a, v) => ({ userName: a, targetLevel: v ?? 10 }) },
      deposit:  { ep: '/TestDeposit',      map: (a, v) => ({ userName: a, amount: v ?? 100, currencyType: 1 }) },
      refill:   { ep: '/ResetRefillInfo',  map: (a) => ({ userName: a }) },
      skill:    { ep: '/ChangeSkillCard',  map: (a, v, extra) => ({ account: a, itemNo: extra ?? 20001, amount: v ?? 10 }) },
      godsend:  { ep: '/GodsendGivePrizeToFreeGameCard', map: (a, v) => ({ account: a, itemIndex: v ?? '13601001', amount: 1 }) },
      bp:       { ep: '/BattlePassAddScore', map: (a, v) => ({ account: a, addScore: v ?? 100 }) },
      bpcond:   { ep: '/BattlePassConditionCount', map: (a) => ({ account: a, condition: 1, count: 1 }) },
    }
  },
  tmd: {
    name: '滿貫大亨',
    base: 'https://tmd.towergame.com/TMD/TestEnvironment/Service.asmx',
    actions: {
      money:    { ep: '/UpdatePlayerMoney',   map: (a, v) => ({ account: a, amount: v ?? 100000 }) },
      vip:      { ep: '/UpdatePlayerVip',     map: (a, v) => ({ account: a, vip: v ?? 5 }) },
      horse:    { ep: '/Horse_ChangeUserLevel', map: (a, v) => ({ account: a, level: v ?? 3 }) },
      clear:    { ep: '/ClearPlayerPackage',  map: (a) => ({ account: a }) },
      item:     { ep: '/GetSingleForeverItemBySigleAccount', map: (a, v, extra) => ({ account: a, itemId: 1, itemId2: v ?? 100, amount: extra ?? 1 }) },
      score:    { ep: '/ScoreboardAssignScore', map: (a, v) => ({ id: 1, account: a, score: v ?? 10000 }) },
    }
  },
  vf: {
    name: 'Vegas Frenzy',
    base: 'https://test-vegasfrenzy.towergame.com/service/1999',
    actions: {
      money:    { ep: '/Test_ModifyMoney',       map: (a, v) => ({ accountId: parseInt(a, 10), currencyType: 66, amount: String(v ?? 100000) }) },
      vip:      { ep: '/Test_ModifyVipInfo',     map: (a, v) => ({ accountId: parseInt(a, 10), vipLv: v ?? 5 }) },
      level:    { ep: '/Test_ModifyLevelInfo',   map: (a, v) => ({ accountId: parseInt(a, 10), Level: v ?? 10, exp: '0', PercentOfExp: 0 }) },
      bolt:     { ep: '/Test_ModifyBoltPower',   map: (a, v) => ({ accountId: parseInt(a, 10), boltPower: v ?? 100 }),
                  chain: [{ ep: '/Test_Bingo_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) }] },
      item:     { ep: '/Test_GoldItem_ModifyPlayerData', map: (a, v, extra) => ({ accountId: parseInt(a, 10), prizeCode: v ?? '00060066', modifyAmount: extra ?? 1 }) },
      godsend:  { ep: '/Test_GodSend_GiveReward', map: (a, v) => ({ accountId: parseInt(a, 10), rewardGroupId: 0, singlePrizeCode: v ?? '00060066', singlePrizeAmount: '100' }) },
      inbox:    { ep: '/Test_Inbox_InsertMail',  map: (a) => ({ accountId: parseInt(a, 10), mailType: 5 }) },
      deposit:  { ep: '/Test_Add_UserStoredValueRecord', map: (a, v) => ({ accountId: parseInt(a, 10), price: v ?? 4.99, time: new Date().toISOString().slice(0,19).replace('T',' ') }) },
      deldeposit: { ep: '/Test_Delete_UserStoredValueRecord', map: (a, v) => ({ accountId: parseInt(a, 10), days: v ?? -1 }) },
      bpreset:  { ep: '/Test_BattlePass_PlayerReset', map: (a) => ({ accountId: parseInt(a, 10) }) },
      bpv2reset:{ ep: '/Test_BattlePassV2_PlayerReset', map: (a) => ({ accountId: parseInt(a, 10) }) },
      bptype:   { ep: '/Test_BattlePass_SetPlayerPassType', map: (a, v) => ({ accountId: parseInt(a, 10), passType: v ?? 1 }) },
      bingo:    { ep: '/Test_Bingo_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      attend:   { ep: '/Test_AttendBook_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      mission:  { ep: '/Test_Mission_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      quest:    { ep: '/Test_QuestGame_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      eventmission: { ep: '/Test_EventMission_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      tag:      { ep: '/Test_UserTag_Clear',     map: (a) => ({ accountId: parseInt(a, 10) }) },
      email:    { ep: '/Test_ClearProfileDataEmail', map: (a) => ({ accountId: parseInt(a, 10) }) },
      ad:       { ep: '/Test_AD_ClearPlayerData', map: (a, v) => ({ accountId: parseInt(a, 10), adType: v ?? 0 }) },
      offline:  { ep: '/Test_OfflineBonus_ClearPlayerData', map: (a, v) => ({ accountId: parseInt(a, 10), offlineBonusType: v ?? 0 }) },
      offlinemul: { ep: '/Test_OfflineBonus_ClearPlayerMultipleData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      piggy:    { ep: '/Test_PiggyBank_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      couponact:{ ep: '/Test_Coupon_ClearPlayerActivity', map: (a) => ({ accountId: parseInt(a, 10) }) },
      couponown:{ ep: '/Test_Coupon_ClearPlayerCoupon', map: (a) => ({ accountId: parseInt(a, 10) }) },
      credential: { ep: '/Test_Credential_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      liveops:  { ep: '/Test_LiveOps_ClearUserActivity', map: (a) => ({ accountId: parseInt(a, 10) }) },
      luckytrip:{ ep: '/Test_LuckyTrip_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      specialsign: { ep: '/Test_SpecialSignIn_ClearPlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      groupprize: { ep: '/Test_Clear_Player_GroupingPrizeData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      albumall: { ep: '/Test_JourneyAlbum_AllDeletePlayerData', map: (a) => ({ accountId: parseInt(a, 10) }) },
      albummission: { ep: '/Test_JourneyAlbum_DeletePlayerMission', map: (a) => ({ accountId: parseInt(a, 10) }) },
      albumfree:{ ep: '/Test_JourneyAlbum_ReTakeFreePack', map: (a) => ({ accountId: parseInt(a, 10) }) },
      dropitem: { ep: '/Test_DropItems_FastDrop', map: (a) => ({ accountId: parseInt(a, 10) }) },
    }
  }
};

// ══════════════════════════════════════════════════════
// Multi-account expansion
// Supports: "ray1,ray2,ray3" or "ray1~ray7" or "ray1" (single)
// ══════════════════════════════════════════════════════
function expandAccounts(input) {
  if (!input) return [];
  // Split by comma first
  const parts = input.split(',').map(s => s.trim()).filter(Boolean);
  const result = [];
  for (const part of parts) {
    // Check for range syntax: prefix<N>~prefix<M>
    const rangeMatch = part.match(/^(.+?)(\d+)~\1?(\d+)$/);
    if (rangeMatch) {
      const prefix = rangeMatch[1];
      const start = parseInt(rangeMatch[2], 10);
      const end = parseInt(rangeMatch[3], 10);
      const lo = Math.min(start, end), hi = Math.max(start, end);
      for (let i = lo; i <= hi; i++) result.push(prefix + i);
    } else {
      result.push(part);
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════
// Skills — predefined multi-step command sequences
// ══════════════════════════════════════════════════════
const SKILLS = {
  // ── AIO Skills ──
  'aio-rich': {
    desc: '明星3缺1 — 大量金幣+鑽石+VIP滿',
    steps: (account, v) => [
      { platform: 'aio', action: 'money',   account, value: v || 999999 },
      { platform: 'aio', action: 'diamond', account, value: v || 999999 },
      { platform: 'aio', action: 'vip',     account, value: 10 },
    ]
  },
  'aio-max': {
    desc: '明星3缺1 — 全部拉滿 (金幣+鑽石+VIP+等級+BP)',
    steps: (account, v) => [
      { platform: 'aio', action: 'money',   account, value: v || 9999999 },
      { platform: 'aio', action: 'diamond', account, value: v || 9999999 },
      { platform: 'aio', action: 'vip',     account, value: 10 },
      { platform: 'aio', action: 'level',   account, value: 99 },
      { platform: 'aio', action: 'bp',      account, value: 99999 },
    ]
  },
  'aio-reset': {
    desc: '明星3缺1 — 重置 (清補幣)',
    steps: (account) => [
      { platform: 'aio', action: 'refill', account },
    ]
  },

  // ── TMD Skills ──
  'tmd-rich': {
    desc: '滿貫大亨 — 紅鑽+VIP',
    steps: (account, v) => [
      { platform: 'tmd', action: 'money', account, value: v || 999999 },
      { platform: 'tmd', action: 'vip',   account, value: 10 },
    ]
  },
  'tmd-max': {
    desc: '滿貫大亨 — 全部拉滿 (紅鑽+VIP+金馬)',
    steps: (account, v) => [
      { platform: 'tmd', action: 'money', account, value: v || 9999999 },
      { platform: 'tmd', action: 'vip',   account, value: 10 },
      { platform: 'tmd', action: 'horse', account, value: 5 },
    ]
  },
  'tmd-reset': {
    desc: '滿貫大亨 — 清空背包',
    steps: (account) => [
      { platform: 'tmd', action: 'clear', account },
    ]
  },

  // ── VF Skills ──
  'vf-rich': {
    desc: 'Vegas Frenzy — 大量金幣+VIP',
    steps: (account, v) => [
      { platform: 'vf', action: 'money', account, value: v || 999999 },
      { platform: 'vf', action: 'vip',   account, value: 10 },
    ]
  },
  'vf-max': {
    desc: 'Vegas Frenzy — 全部拉滿 (金幣+VIP+等級+BoltPower)',
    steps: (account, v) => [
      { platform: 'vf', action: 'money', account, value: v || 9999999 },
      { platform: 'vf', action: 'vip',   account, value: 10 },
      { platform: 'vf', action: 'level', account, value: 99 },
      { platform: 'vf', action: 'bolt',  account, value: 99999 },
    ]
  },
  'vf-reset': {
    desc: 'Vegas Frenzy — 清除 (簽到+BP+任務)',
    steps: (account) => [
      { platform: 'vf', action: 'attend',  account },
      { platform: 'vf', action: 'bpreset', account },
      { platform: 'vf', action: 'tag',     account },
    ]
  },

  // ── Cross-Platform Skills ──
  'all-rich': {
    desc: '全平台 — 同帳號全部加滿',
    steps: (account, v) => [
      { platform: 'aio', action: 'money',   account, value: v || 999999 },
      { platform: 'aio', action: 'diamond', account, value: v || 999999 },
      { platform: 'aio', action: 'vip',     account, value: 10 },
      { platform: 'tmd', action: 'money',   account, value: v || 999999 },
      { platform: 'tmd', action: 'vip',     account, value: 10 },
    ]
  },
};

// ══════════════════════════════════════════════════════
// HTTP execution (direct, no browser proxy needed)
// ══════════════════════════════════════════════════════
function execApi(baseUrl, ep, params) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => qs.append(k, v));
    const fullPath = ep + (qs.toString() ? '?' + qs.toString() : '');

    // Use the proxy server (must be running)
    const target = baseUrl + fullPath;
    const proxyPath = `/api/proxy?url=${encodeURIComponent(target)}`;

    const req = http.request({
      hostname: PROXY_HOST,
      port: PROXY_PORT,
      path: proxyPath,
      method: 'GET',
      timeout: 10000,
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// Direct HTTPS execution (bypass proxy entirely for maximum speed)
function execApiDirect(baseUrl, ep, params) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => qs.append(k, v));
    const fullUrl = baseUrl + ep + (qs.toString() ? '?' + qs.toString() : '');

    const url = new (require('url').URL)(fullUrl);
    const httpMod = url.protocol === 'https:' ? https : http;

    const req = httpMod.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 10000,
      headers: { 'User-Agent': 'AI-CLI/1.0' }
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ══════════════════════════════════════════════════════
// Execute a single command (single account)
// ══════════════════════════════════════════════════════
async function runCommandSingle(platformId, account, actionId, value, extra, opts = {}) {
  const platform = PLATFORMS[platformId];
  if (!platform) {
    console.error(`❌ 未知平台: "${platformId}" (可用: ${Object.keys(PLATFORMS).join(', ')})`);
    return false;
  }
  const action = platform.actions[actionId];
  if (!action) {
    console.error(`❌ 未知動作: "${actionId}" (${platform.name} 可用: ${Object.keys(platform.actions).join(', ')})`);
    return false;
  }

  const params = action.map(account, value !== undefined && value !== '' ? Number(value) : undefined, extra !== undefined && extra !== '' ? (isNaN(extra) ? extra : Number(extra)) : undefined);

  if (!opts.quiet) {
    const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(' ');
    process.stdout.write(`  ⏳ ${platform.name} ${actionId} → ${account} [${paramStr}] ... `);
  }

  const startTime = Date.now();
  try {
    let result;
    if (opts.useProxy) {
      result = await execApi(platform.base, action.ep, params);
    } else {
      try {
        result = await execApiDirect(platform.base, action.ep, params);
      } catch {
        result = await execApi(platform.base, action.ep, params);
      }
    }

    const elapsed = Date.now() - startTime;
    if (!opts.quiet) {
      if (result.ok) {
        console.log(`✅ (${elapsed}ms)`);
      } else {
        console.log(`❌ HTTP ${result.status} (${elapsed}ms)`);
      }
    }

    if (opts.verbose && result.body) {
      const trimmed = result.body.substring(0, 200).trim();
      console.log(`     📄 ${trimmed}`);
    }

    // Execute chained actions (e.g., bolt → bingo clear)
    if (result.ok && action.chain && action.chain.length) {
      for (const chainAction of action.chain) {
        const chainParams = chainAction.map(account);
        if (!opts.quiet) {
          process.stdout.write(`  🔗 連鎖: ${chainAction.ep} ... `);
        }
        try {
          let chainResult;
          if (opts.useProxy) {
            chainResult = await execApi(platform.base, chainAction.ep, chainParams);
          } else {
            try { chainResult = await execApiDirect(platform.base, chainAction.ep, chainParams); }
            catch { chainResult = await execApi(platform.base, chainAction.ep, chainParams); }
          }
          if (!opts.quiet) console.log(chainResult.ok ? '✅' : `❌ HTTP ${chainResult.status}`);
        } catch (ce) {
          if (!opts.quiet) console.log(`❌ ${ce.message}`);
        }
      }
    }

    return result.ok;
  } catch (e) {
    const elapsed = Date.now() - startTime;
    if (!opts.quiet) {
      console.log(`❌ Error: ${e.message} (${elapsed}ms)`);
    }
    return false;
  }
}

// ══════════════════════════════════════════════════════
// Execute command for multiple accounts (parallel)
// ══════════════════════════════════════════════════════
async function runCommand(platformId, accountInput, actionId, value, extra, opts = {}) {
  const accounts = expandAccounts(accountInput);
  if (accounts.length === 0) { console.error('❌ 帳號為空'); return false; }
  if (accounts.length === 1) return runCommandSingle(platformId, accounts[0], actionId, value, extra, opts);

  console.log(`\n👥 多帳號模式: ${accounts.length} 個帳號 (並行執行)`);
  console.log('─'.repeat(50));
  const startTime = Date.now();
  const results = await Promise.all(accounts.map(a => runCommandSingle(platformId, a, actionId, value, extra, opts)));
  const okCount = results.filter(r => r).length;
  const elapsed = Date.now() - startTime;
  console.log('─'.repeat(50));
  console.log(`📊 多帳號結果: 成功 ${okCount}/${accounts.length} | 總耗時 ${elapsed}ms`);
  return okCount === accounts.length;
}

// ══════════════════════════════════════════════════════
// Execute a skill for a single account
// ══════════════════════════════════════════════════════
async function runSkillSingle(skillName, account, value, opts = {}) {
  const skill = SKILLS[skillName];
  const steps = skill.steps(account, value ? Number(value) : undefined);

  if (opts.parallel) {
    const promises = steps.map(s => runCommandSingle(s.platform, s.account, s.action, s.value, s.extra, opts));
    const results = await Promise.all(promises);
    return results.filter(r => r).length;
  } else {
    let ok = 0;
    for (const s of steps) { if (await runCommandSingle(s.platform, s.account, s.action, s.value, s.extra, opts)) ok++; }
    return ok;
  }
}

// ══════════════════════════════════════════════════════
// Execute a skill (multi-step sequence) — multi-account!
// ══════════════════════════════════════════════════════
async function runSkill(skillName, accountInput, value, opts = {}) {
  const skill = SKILLS[skillName];
  if (!skill) {
    console.error(`❌ 未知技能: "${skillName}"`);
    console.log('可用技能:');
    Object.entries(SKILLS).forEach(([k, v]) => console.log(`  ${k.padEnd(15)} — ${v.desc}`));
    return false;
  }

  const accounts = expandAccounts(accountInput);
  if (accounts.length === 0) { console.error('❌ 帳號為空'); return false; }

  const stepsPerAccount = skill.steps('_', value ? Number(value) : undefined).length;
  console.log(`\n🎯 執行技能: ${skillName} (${skill.desc})`);
  console.log(`   帳號: ${accounts.join(', ')} (${accounts.length} 個) | 每帳號步驟: ${stepsPerAccount}`);
  console.log('─'.repeat(50));

  const startTime = Date.now();
  // All accounts execute in parallel
  const results = await Promise.all(accounts.map(a => runSkillSingle(skillName, a, value, { ...opts, parallel: true })));
  const totalSteps = stepsPerAccount * accounts.length;
  const totalOk = results.reduce((s, n) => s + n, 0);
  const elapsed = Date.now() - startTime;
  console.log('─'.repeat(50));
  console.log(`${totalOk === totalSteps ? '✅' : '⚠️'} 技能完成 | ${accounts.length} 帳號 | 成功: ${totalOk}/${totalSteps} | 總耗時: ${elapsed}ms`);
  return totalOk === totalSteps;
}

// ══════════════════════════════════════════════════════
// Batch execution from file
// ══════════════════════════════════════════════════════
async function runBatch(filePath, opts = {}) {
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 檔案不存在: ${filePath}`);
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('//'));

  console.log(`\n📋 批量執行: ${filePath} (${lines.length} 個指令)`);
  console.log('═'.repeat(50));

  const startTime = Date.now();
  let success = 0, fail = 0;

  // Group lines by account to allow parallel per-account execution
  const tasks = lines.map(line => {
    const parts = line.split(/\s+/);
    if (parts[0] === '--skill' || parts[0] === 'skill') {
      return { type: 'skill', skillName: parts[1], account: parts[2], value: parts[3] };
    } else {
      return { type: 'cmd', platform: parts[0], account: parts[1], action: parts[2], value: parts[3], extra: parts[4] };
    }
  });

  // Execute all tasks (accounts auto-expand inside runCommand/runSkill)
  for (const task of tasks) {
    let ok;
    if (task.type === 'skill') {
      ok = await runSkill(task.skillName, task.account, task.value, opts);
    } else {
      ok = await runCommand(task.platform, task.account, task.action, task.value, task.extra, opts);
    }
    if (ok) success++; else fail++;
  }

  const elapsed = Date.now() - startTime;
  console.log('═'.repeat(50));
  console.log(`📊 批量結果: 成功 ${success} / 失敗 ${fail} / 總耗時 ${elapsed}ms`);
}

// ══════════════════════════════════════════════════════
// Print help / listings
// ══════════════════════════════════════════════════════
function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🤖 AI 自動改財產 — CLI 快速執行工具               ║
║   零 Token 消耗 • 批量執行 • 技能系統               ║
╚═══════════════════════════════════════════════════════╝

📌 基本用法:
  node ai_cli.js <platform> <account> <action> [value] [extra]

📌 多帳號 (所有模式皆支援):
  逗號分隔:  node ai_cli.js aio ray1,ray2,ray3 money 500000
  範圍語法:  node ai_cli.js aio ray1~7 money 500000   (= ray1..ray7)
  混合:      node ai_cli.js aio ray1~3,ray10,ray15 vip 8

📌 技能模式 (多步驟一鍵執行):
  node ai_cli.js --skill <skillName> <account> [value]
  node ai_cli.js --skill aio-rich ray1~7          (7帳號並行)

📌 批量模式 (從檔案讀取指令):
  node ai_cli.js --batch <file.txt>

📌 查看清單:
  node ai_cli.js --list          列出所有平台與動作
  node ai_cli.js --skills        列出所有技能

📌 選項:
  --verbose, -v    顯示 API 回應內容
  --parallel, -p   並行執行 (技能模式)
  --proxy          強制使用 proxy (需要 server.js 執行中)
  --quiet, -q      安靜模式

📝 範例:
  node ai_cli.js aio ray15 money 500000
  node ai_cli.js aio ray1~7 vip 8                (多帳號)
  node ai_cli.js tmd ray1,ray2,ray3 money 100000  (多帳號)
  node ai_cli.js --skill aio-rich ray1~7          (多帳號技能)
  node ai_cli.js --batch commands.txt
`);
}

function printList() {
  console.log('\n📋 所有平台與動作:\n');
  for (const [pid, p] of Object.entries(PLATFORMS)) {
    console.log(`  🏷️  ${pid.toUpperCase()} — ${p.name}`);
    for (const [aid, a] of Object.entries(p.actions)) {
      console.log(`      ${aid.padEnd(12)} → ${a.ep}`);
    }
    console.log('');
  }
}

function printSkills() {
  console.log('\n🎯 所有技能 (Skills):\n');
  for (const [name, skill] of Object.entries(SKILLS)) {
    const demoSteps = skill.steps('ACCOUNT', 0);
    console.log(`  ${name.padEnd(15)} — ${skill.desc}`);
    console.log(`  ${''.padEnd(15)}   步驟: ${demoSteps.map(s => `${s.platform}:${s.action}`).join(' → ')}`);
  }
  console.log('');
}

// ══════════════════════════════════════════════════════
// Interactive REPL mode
// ══════════════════════════════════════════════════════
async function runInteractive() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`
╔═══════════════════════════════════════════════════════╗
║   🤖 AI CLI — 互動模式 (輸入 help 查看指令)        ║
╚═══════════════════════════════════════════════════════╝`);

  const prompt = () => rl.question('\n🤖 > ', async (line) => {
    const input = line.trim();
    if (!input || input === 'exit' || input === 'quit' || input === 'q') {
      console.log('👋 再見！');
      rl.close();
      return;
    }
    if (input === 'help' || input === 'h') {
      printUsage();
      prompt(); return;
    }
    if (input === 'list' || input === 'ls') {
      printList();
      prompt(); return;
    }
    if (input === 'skills') {
      printSkills();
      prompt(); return;
    }

    const parts = input.split(/\s+/);
    const opts = { verbose: parts.includes('-v') || parts.includes('--verbose'), parallel: parts.includes('-p') || parts.includes('--parallel') };
    const cleanParts = parts.filter(p => !p.startsWith('-'));

    if (cleanParts[0] === 'skill' || cleanParts[0] === 's') {
      await runSkill(cleanParts[1], cleanParts[2], cleanParts[3], opts); // account auto-expands
    } else {
      await runCommand(cleanParts[0], cleanParts[1], cleanParts[2], cleanParts[3], cleanParts[4], opts); // account auto-expands
    }
    prompt();
  });
  prompt();
}

// ══════════════════════════════════════════════════════
// Main entry
// ══════════════════════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const opts = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    parallel: args.includes('--parallel') || args.includes('-p'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    useProxy: args.includes('--proxy'),
  };
  const cleanArgs = args.filter(a => !a.startsWith('-'));

  if (args.includes('--list')) { printList(); return; }
  if (args.includes('--skills')) { printSkills(); return; }
  if (args.includes('--interactive') || args.includes('-i')) { await runInteractive(); return; }

  if (args.includes('--batch')) {
    const idx = args.indexOf('--batch');
    const file = args[idx + 1];
    if (!file) { console.error('❌ 請指定批量檔案路徑'); return; }
    await runBatch(file, opts);
    return;
  }

  if (args.includes('--skill')) {
    const idx = args.indexOf('--skill');
    const skillName = args[idx + 1];
    const account = args[idx + 2];
    const value = args[idx + 3];
    if (!skillName || !account) { console.error('❌ 用法: --skill <skillName> <account> [value]'); return; }
    await runSkill(skillName, account, value, opts);
    return;
  }

  // Direct command: <platform> <account> <action> [value] [extra]
  if (cleanArgs.length < 3) {
    console.error('❌ 至少需要: <platform> <account> <action>');
    printUsage();
    return;
  }

  const startTime = Date.now();
  const ok = await runCommand(cleanArgs[0], cleanArgs[1], cleanArgs[2], cleanArgs[3], cleanArgs[4], opts);
  if (!opts.quiet) {
    console.log(`\n${ok ? '✅ 完成' : '❌ 失敗'} (${Date.now() - startTime}ms)`);
  }
  process.exit(ok ? 0 : 1);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
