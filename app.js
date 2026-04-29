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
  aio: { name: '明星3缺1', icon: '⭐', color: '#a78bfa', platform: () => PLATFORM_AIO, inputLabel: '帳號' },
  tmd: { name: '滿貫大亨', icon: '🀄', color: '#fbbf24', platform: () => PLATFORM_TMD, inputLabel: '帳號' },
  vf: { name: 'Vegas Frenzy', icon: '🎰', color: '#f472b6', platform: () => PLATFORM_VF, inputLabel: 'ID' },
};
let selectedGame = null;
let cmdRows = []; // {id, account, actionIdx, actionIdx2, value}
let rowIdCounter = 0;

// ── Actions per game (ep = endpoint, 直接寫死不需查表) ──
const GAME_ACTIONS = {
  aio: [
    { id: 'aio_money', ep: '/ChangeBill', icon: '💰', label: '改金幣', vLabel: '金幣數量', def: 500000, mapFn: (a, v) => ({ userName: a, currencyType: 1, money: v }) },
    { id: 'aio_diamond', ep: '/ChangeBill', icon: '💎', label: '改鑽石', vLabel: '鑽石數量', def: 100000, mapFn: (a, v) => ({ userName: a, currencyType: 2, money: v }) },
    { id: 'aio_vip', ep: '/ChangeVIP', icon: '👑', label: '改VIP', vLabel: 'VIP等級', def: 8, mapFn: (a, v) => ({ userName: a, level: v, tLevel: 0, resetTime: 0 }) },
    { id: 'aio_level', ep: '/TestLevelUp', icon: '📊', label: '改等級', vLabel: '目標等級', def: 10, mapFn: (a, v) => ({ userName: a, targetLevel: v }) },
    { id: 'aio_deposit', ep: '/TestDeposit', icon: '💳', label: '測試儲值', vLabel: '儲值金額', def: 100, mapFn: (a, v) => ({ userName: a, amount: v, currencyType: 1 }) },
    { id: 'aio_refill', ep: '/ResetRefillInfo', icon: '🔄', label: '清除補幣', vLabel: null, noVal: true, mapFn: (a) => ({ userName: a }) },
    { id: 'aio_skill', ep: '/ChangeSkillCard', icon: '🃏', label: '改技能卡', vLabel: '數量', def: 10, mapFn: (a, v) => ({ account: a, itemNo: 20001, amount: v }) },
    { id: 'aio_godsend', ep: '/GodsendGivePrizeToFreeGameCard', icon: '🎁', label: '天降好禮', vLabel: '物品編號', def: 13601001, mapFn: (a, v) => ({ account: a, itemIndex: String(v), amount: 1 }) },
    { id: 'aio_bp_score', ep: '/BattlePassAddScore', icon: '🏅', label: 'BP分數', vLabel: '分數', def: 100, mapFn: (a, v) => ({ account: a, addScore: v }) },
    { id: 'aio_bp_cond', ep: '/BattlePassConditionCount', icon: '✅', label: 'BP條件', vLabel: null, noVal: true, mapFn: (a) => ({ account: a, condition: 1, count: 1 }) },
  ],
  tmd: [
    { id: 'tmd_money', ep: '/UpdatePlayerMoney', icon: '💎', label: '調整紅鑽', vLabel: '紅鑽數量', def: 500000, mapFn: (a, v) => ({ account: a, amount: v }) },
    { id: 'tmd_vip', ep: '/UpdatePlayerVip', icon: '👑', label: '調整VIP', vLabel: 'VIP等級', def: 8, mapFn: (a, v) => ({ account: a, vip: v }) },
    { id: 'tmd_horse', ep: '/Horse_ChangeUserLevel', icon: '🐴', label: '調整金馬', vLabel: '金馬等級', def: 3, mapFn: (a, v) => ({ account: a, level: v }) },
    { id: 'tmd_clearPkg', ep: '/ClearPlayerPackage', icon: '🎒', label: '清空背包', vLabel: null, noVal: true, mapFn: (a) => ({ account: a }) },
    {
      id: 'tmd_singleItem', ep: '/GetSingleForeverItemBySigleAccount', icon: '🎁', label: '單一物品',
      fields: [{ k: 'itemId', lbl: '物品ID', def: 1 }, { k: 'itemId2', lbl: '物品ID2', def: 100 }, { k: 'amount', lbl: '數量', def: 1 }],
      multiVal: true, mapFn: (a, f) => ({ account: a, itemId: f.itemId, itemId2: f.itemId2, amount: f.amount })
    },
    {
      id: 'tmd_contItem', ep: '/GetContinuouslyForeverItemBySigleAccount', icon: '📦', label: '區間物品',
      fields: [{ k: 'itemId', lbl: '物品ID', def: 1 }, { k: 'beginItemId2', lbl: '起始ID2', def: 1 }, { k: 'endItemId2', lbl: '結束ID2', def: 10 }, { k: 'amount', lbl: '數量', def: 1 }],
      multiVal: true, mapFn: (a, f) => ({ account: a, itemId: f.itemId, beginItemId2: f.beginItemId2, endItemId2: f.endItemId2, amount: f.amount })
    },
    { id: 'tmd_score', ep: '/ScoreboardAssignScore', icon: '🏆', label: '排行榜', vLabel: '分數', def: 10000, mapFn: (a, v) => ({ id: 1, account: a, score: v }) },
  ],
  vf: [
    // ── 基本設定 ──
    {
      id: 'vf_money', ep: '/Test_ModifyMoney', icon: '💰', label: '修改財產',
      fields: [{ k: 'currencyType', lbl: '幣別(66=金幣)', def: 66 }, { k: 'amount', lbl: '數量', def: '100000', type: 'text' }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, currencyType: parseInt(f.currencyType, 10) || 66, amount: String(f.amount) })
    },
    {
      id: 'vf_vip', ep: '/Test_ModifyVipInfo', icon: '👑', label: '修改VIP',
      fields: [{ k: 'vipLv', lbl: 'VIP等級', def: 5 }, { k: 'vipExp', lbl: 'VIP經驗值', def: 0 }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, vipLv: parseInt(f.vipLv, 10) || 0, vipExp: parseInt(f.vipExp, 10) || 0 })
    },
    {
      id: 'vf_level', ep: '/Test_ModifyLevelInfo', icon: '📊', label: '修改等級',
      fields: [{ k: 'Level', lbl: '等級', def: 10 }, { k: 'exp', lbl: '經驗值', def: '0', type: 'text' }, { k: 'PercentOfExp', lbl: '經驗%', def: 0 }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, Level: parseInt(f.Level, 10) || 1, exp: String(f.exp || '0'), PercentOfExp: parseInt(f.PercentOfExp, 10) || 0 })
    },
    {
      id: 'vf_bolt', ep: '/Test_ModifyBoltPower', icon: '⚡', label: 'BoltPower + 清賓果', vLabel: '數值', def: 100,
      chainEps: ['/Test_Bingo_ClearPlayerData'],
      mapFn: (a, v) => ({ accountId: parseInt(a, 10) || 0, boltPower: v })
    },
    // ── 道具 / 天降好禮 ──
    {
      id: 'vf_item', ep: '/Test_GoldItem_ModifyPlayerData', icon: '🎁', label: '修改道具',
      fields: [{ k: 'prizeCode', lbl: 'Prize Code', def: '00060066', type: 'text' }, { k: 'modifyAmount', lbl: '增減數量', def: 1 }, { k: 'absoluteAmount', lbl: '絕對數量(0=不用)', def: 0 }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, prizeCode: f.prizeCode, modifyAmount: f.modifyAmount, absoluteAmount: f.absoluteAmount })
    },
    {
      id: 'vf_godsend', ep: '/Test_GodSend_GiveReward', icon: '🎉', label: '天降好禮',
      fields: [
        { k: 'singlePrizeCode', lbl: 'Prize Code', def: '00060066', type: 'text' },
        { k: 'singlePrizeAmount', lbl: '數量', def: '100', type: 'text' },
        { k: 'style', lbl: '樣式(0一般/1登入/2升級/3儲值)', def: 0 },
        { k: 'gainEndTime', lbl: '領取期限', def: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' '), type: 'text' }
      ],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, rewardGroupId: 0, singlePrizeCode: f.singlePrizeCode, singlePrizeAmount: String(f.singlePrizeAmount), levelExtraType: 0, vipExtraType: 0, style: parseInt(f.style, 10) || 0, gainEndTime: f.gainEndTime })
    },
    {
      id: 'vf_inbox', ep: '/Test_Inbox_InsertMail', icon: '📬', label: 'Inbox塞信件',
      fields: [
        { k: 'mailType', lbl: '類型(5系統/20儲值/21其他)', def: 5 },
        { k: 'endTime', lbl: '截止時間', def: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 19).replace('T', ' '), type: 'text' },
        { k: 'prizeCode', lbl: 'Prize Code', def: '00060066', type: 'text' },
        { k: 'amount', lbl: '獎項數量', def: '1000', type: 'text' }
      ],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, mailType: parseInt(f.mailType, 10) || 5, endTime: f.endTime, prizeCode: f.prizeCode, amount: String(f.amount) })
    },
    // ── 儲值 ──
    {
      id: 'vf_deposit', ep: '/Test_Add_UserStoredValueRecord', icon: '💳', label: '新增儲值紀錄',
      fields: [{ k: 'price', lbl: '金額(USD)', def: 4.99 }, { k: 'time', lbl: '時間', def: new Date().toISOString().slice(0, 19).replace('T', ' '), type: 'text' }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, price: f.price, time: f.time })
    },
    { id: 'vf_delDeposit', ep: '/Test_Delete_UserStoredValueRecord', icon: '🗑️', label: '刪除儲值紀錄', vLabel: '近N日(-1全刪)', def: -1, mapFn: (a, v) => ({ accountId: parseInt(a, 10) || 0, days: v }) },
    // ── Battle Pass ──
    { id: 'vf_bpReset', ep: '/Test_BattlePass_PlayerReset', icon: '🏅', label: '重置BP', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_bpV2Reset', ep: '/Test_BattlePassV2_PlayerReset', icon: '🏅', label: '重置BP v2', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_bpType', ep: '/Test_BattlePass_SetPlayerPassType', icon: '🎫', label: '設定BP類型', vLabel: 'Pass Type', def: 1, mapFn: (a, v) => ({ accountId: parseInt(a, 10) || 0, passType: v }) },
    // ── 清除資料 ──
    { id: 'vf_bingo', ep: '/Test_Bingo_ClearPlayerData', icon: '🎱', label: '清除賓果', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_attend', ep: '/Test_AttendBook_ClearPlayerData', icon: '📅', label: '清除簽到簿', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_mission', ep: '/Test_Mission_ClearPlayerData', icon: '📋', label: '清除大廳任務', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_quest', ep: '/Test_QuestGame_ClearPlayerData', icon: '🎯', label: '清除遊戲任務', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_eventMission', ep: '/Test_EventMission_ClearPlayerData', icon: '📝', label: '清除單頁任務', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_tag', ep: '/Test_UserTag_Clear', icon: '🏷️', label: '清空標籤', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_email', ep: '/Test_ClearProfileDataEmail', icon: '📧', label: '清除Email', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_ad', ep: '/Test_AD_ClearPlayerData', icon: '📺', label: '清除廣告資料', vLabel: '類型(0=全部)', def: 0, mapFn: (a, v) => ({ accountId: parseInt(a, 10) || 0, adType: v }) },
    { id: 'vf_offline', ep: '/Test_OfflineBonus_ClearPlayerData', icon: '🌙', label: '清除離線獎勵', vLabel: '類型(0=全部)', def: 0, mapFn: (a, v) => ({ accountId: parseInt(a, 10) || 0, offlineBonusType: v }) },
    { id: 'vf_offlineMul', ep: '/Test_OfflineBonus_ClearPlayerMultipleData', icon: '✖️', label: '清除離線倍率', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_piggy', ep: '/Test_PiggyBank_ClearPlayerData', icon: '🐷', label: '清除小豬撲滿', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_couponAct', ep: '/Test_Coupon_ClearPlayerActivity', icon: '🎟️', label: '清除優惠券活動', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_couponOwn', ep: '/Test_Coupon_ClearPlayerCoupon', icon: '🎫', label: '清除持有優惠券', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_credential', ep: '/Test_Credential_ClearPlayerData', icon: '🔑', label: '清除資格資料', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_liveops', ep: '/Test_LiveOps_ClearUserActivity', icon: '📡', label: '清除LiveOps', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_luckyTrip', ep: '/Test_LuckyTrip_ClearPlayerData', icon: '🎰', label: '清除連續禮包', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_specialSign', ep: '/Test_SpecialSignIn_ClearPlayerData', icon: '📆', label: '清除七日簽', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_groupPrize', ep: '/Test_Clear_Player_GroupingPrizeData', icon: '🎁', label: '清除分群禮包', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    // ── 卡冊 ──
    { id: 'vf_albumAll', ep: '/Test_JourneyAlbum_AllDeletePlayerData', icon: '📕', label: '刪除卡冊全部', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_albumMission', ep: '/Test_JourneyAlbum_DeletePlayerMission', icon: '📗', label: '刪除卡冊任務', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    { id: 'vf_albumFree', ep: '/Test_JourneyAlbum_ReTakeFreePack', icon: '📘', label: '重領免費卡包', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    // ── 其他 ──
    { id: 'vf_dropItem', ep: '/Test_DropItems_FastDrop', icon: '💧', label: '快速掉落', noVal: true, mapFn: (a) => ({ accountId: parseInt(a, 10) || 0 }) },
    {
      id: 'vf_createTime', ep: '/Test_ModifyAccountCreateTime', icon: '🕐', label: '修改建立時間',
      fields: [{ k: 'accountCreateTime', lbl: '時間(YYYY-MM-DD HH:MM:SS)', def: new Date().toISOString().slice(0, 19).replace('T', ' '), type: 'text' }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, accountCreateTime: f.accountCreateTime })
    },
    {
      id: 'vf_region', ep: '/Test_ModifyAccountRegisterAreaCode', icon: '🌍', label: '修改註冊地區',
      fields: [{ k: 'accountRegisterAreaCode', lbl: '地區碼(如US)', def: 'US', type: 'text' }],
      multiVal: true, mapFn: (a, f) => ({ accountId: parseInt(a, 10) || 0, accountRegisterAreaCode: f.accountRegisterAreaCode })
    },
  ],
};

// ── NLP 口語化解析規則 ──
const NLP_RULES = [
  // AIO
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['金幣', '錢', 'coin', 'money', '改金', '金'], actionId: 'aio_money', extractVal: true },
  {
    game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['鑽石', 'diamond', '鑽', '改鑽'], actionId: 'aio_diamond', extractVal: true,
    resolve: (a, v) => ({ ep: '/ChangeBill', params: { userName: a, currencyType: 2, money: v || 100000 } })
  },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['vip'], actionId: 'aio_vip', extractVal: true },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['等級', 'level', '升級'], actionId: 'aio_level', extractVal: true },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['儲值', 'deposit', '充值'], actionId: 'aio_deposit', extractVal: true },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['補幣', 'refill'], actionId: 'aio_refill', extractVal: false },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['技能卡', 'skill'], actionId: 'aio_skill', extractVal: true },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['天降', 'godsend'], actionId: 'aio_godsend', extractVal: true },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['bp', 'battlepass', '通行證'], actionId: 'aio_bp_score', extractVal: true },
  { game: 'aio', kw: ['明星', 'aio', 'star'], sub: ['bp條件', '任務條件'], actionId: 'aio_bp_cond', extractVal: false },
  // TMD
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['紅鑽', '錢', '鑽石', 'money', '金'], actionId: 'tmd_money', extractVal: true },
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['vip'], actionId: 'tmd_vip', extractVal: true },
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['金馬', 'horse', '馬'], actionId: 'tmd_horse', extractVal: true },
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['清空背包', '背包', 'clear'], actionId: 'tmd_clearPkg', extractVal: false },
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['單一物品', 'item'], actionId: 'tmd_singleItem', extractVal: true },
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['區間物品', 'continuous'], actionId: 'tmd_contItem', extractVal: true },
  { game: 'tmd', kw: ['滿貫', 'tmd'], sub: ['排行榜', 'score'], actionId: 'tmd_score', extractVal: true },
  // VF
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['錢', '金幣', 'money', '財產', 'gold', '金'], actionId: 'vf_money', extractVal: true },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['vip'], actionId: 'vf_vip', extractVal: true },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['等級', 'level'], actionId: 'vf_level', extractVal: true },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['bolt', 'boltpower', '改bp'], actionId: 'vf_bolt', extractVal: true },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['賓果', 'bingo', '清賓果', '清除賓果'], actionId: 'vf_bingo', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['簽到', 'attend', '簽到簿'], actionId: 'vf_attend', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['大廳任務', 'mission'], actionId: 'vf_mission', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['遊戲任務', 'quest'], actionId: 'vf_quest', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['清bp', '重置bp', 'bp重置'], actionId: 'vf_bpReset', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['bp類型', 'bp type'], actionId: 'vf_bpType', extractVal: true },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['小豬', 'piggy', '撲滿'], actionId: 'vf_piggy', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['卡冊', 'album'], actionId: 'vf_albumAll', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['離線', 'offline'], actionId: 'vf_offline', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['廣告', 'ad'], actionId: 'vf_ad', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['優惠券', 'coupon'], actionId: 'vf_couponAct', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['七日簽', '七日'], actionId: 'vf_specialSign', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['liveops'], actionId: 'vf_liveops', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['標籤', 'tag'], actionId: 'vf_tag', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['email', '信箱'], actionId: 'vf_email', extractVal: false },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['儲值', 'deposit'], actionId: 'vf_deposit', extractVal: true },
  { game: 'vf', kw: ['vf', 'vegas', 'frenzy'], sub: ['刪儲值', '刪除儲值'], actionId: 'vf_delDeposit', extractVal: true },
];

function _extractNumber(text) {
  const m = text.match(/(\d[\d,]*)/);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
}

// ── 拆分多步驟指令（先A再B、然後C） ──
function _splitChainedInput(input) {
  // 分割連接詞：先…再…、然後、接著、之後、並且
  // 「163436 先清除賓果再改BP12」→ [「先清除賓果」, 「改BP12」]
  return input.split(/[，,]|(?:然後|接著|之後|並且)|再(?=[改清設調修重刪])/).map(s => s.trim()).filter(Boolean);
}

// 從口語輸入解析出 [{game, actionId, account, value}]
// 支援多步驟：「163436 先清除賓果再改BP12」→ [{清除賓果}, {改BP 12}]
function _nlpParse(input) {
  const trimmed = input.trim();
  // Step 1: 提取帳號/ID — 開頭的純數字或帳號名
  let account = null;
  let restInput = trimmed;
  const leadMatch = trimmed.match(/^(\S+)\s+/);
  if (leadMatch) {
    const candidate = leadMatch[1];
    // 去掉候選詞中可能的連接詞前綴（如「先」）
    const cleanCandidate = candidate.replace(/^先/, '');
    // 判斷是否為帳號：純數字(VF ID)、或不是操作關鍵字
    const isActionKw = NLP_RULES.some(r => r.sub.some(s => cleanCandidate.toLowerCase().includes(s.toLowerCase())));
    if (!isActionKw) {
      account = candidate;
      restInput = trimmed.slice(leadMatch[0].length);
    }
  }

  // Step 2: 拆分多步驟
  const segments = _splitChainedInput(restInput);
  const results = [];
  const gameScope = selectedGame || null;

  for (const seg of segments) {
    const segLower = seg.toLowerCase().replace(/^先/, '');
    let matched = null;

    // 嘗試帶平台名匹配
    for (const rule of NLP_RULES) {
      if (rule.kw.some(k => segLower.includes(k.toLowerCase())) && rule.sub.some(s => segLower.includes(s.toLowerCase()))) {
        matched = rule; break;
      }
    }
    // 若已選平台，只用 sub 匹配
    if (!matched && gameScope) {
      for (const rule of NLP_RULES.filter(r => r.game === gameScope)) {
        if (rule.sub.some(s => segLower.includes(s.toLowerCase()))) {
          matched = rule; break;
        }
      }
    }
    if (!matched) continue;

    // 從此段落提取數值（排除帳號ID）
    const segClean = seg.replace(/^先/, '');
    const val = matched.extractVal ? _extractNumber(segClean) : null;

    // 帳號：若尚未提取，嘗試從段落中找
    let segAccount = account;
    if (!segAccount) {
      const tokens = seg.split(/\s+/);
      for (const tk of tokens) {
        const tkL = tk.toLowerCase();
        const isKw = [...matched.kw, ...matched.sub].some(k => tkL.includes(k.toLowerCase()) || k.toLowerCase().includes(tkL));
        if (isKw) continue;
        if (['改', '設', '調', '加', '設定', '修改', '調整', '清除', '清', '先'].some(w => tkL === w)) continue;
        segAccount = tk; break;
      }
    }

    results.push({ game: matched.game, actionId: matched.actionId, account: segAccount, value: val });
  }

  // fallback: 原本的單一匹配邏輯（相容舊格式如「ray1 改金幣 500000」）
  if (!results.length) {
    const lower = trimmed.toLowerCase();
    const tokens = trimmed.split(/\s+/);
    for (const rule of NLP_RULES) {
      if (rule.kw.some(k => lower.includes(k.toLowerCase())) && rule.sub.some(s => lower.includes(s.toLowerCase()))) {
        return [_extractMatchLegacy(rule, tokens, trimmed, false)];
      }
    }
    if (gameScope) {
      for (const rule of NLP_RULES.filter(r => r.game === gameScope)) {
        if (rule.sub.some(s => lower.includes(s.toLowerCase()))) {
          return [_extractMatchLegacy(rule, tokens, trimmed, true)];
        }
      }
    }
  }
  return results;
}

function _extractMatchLegacy(rule, tokens, input, skipGameKw) {
  const allKw = skipGameKw ? [...rule.sub] : [...rule.kw, ...rule.sub];
  let account = null;
  const numericTokens = [];
  for (const tk of tokens) {
    const tkL = tk.toLowerCase();
    if (allKw.some(k => tkL.includes(k.toLowerCase()) || k.toLowerCase().includes(tkL))) continue;
    if (['改', '設', '調', '加', '設定', '修改', '調整'].some(w => tkL === w)) continue;
    if (/^\d+$/.test(tk)) { numericTokens.push(tk); continue; }
    account = tk; break;
  }
  if (!account && numericTokens.length >= 2) account = numericTokens[0];
  if (!account && numericTokens.length === 1 && rule.game === 'vf') account = numericTokens[0];
  const val = rule.extractVal ? _extractNumber(input.replace(account || '', '').trim()) : null;
  return { game: rule.game, actionId: rule.actionId, account, value: val };
}

async function _nlpExec(input) {
  const parsed = _nlpParse(input);
  const hint = selectedGame
    ? '已選' + GAMES[selectedGame].icon + '，直接輸入如：「ray1 改金幣 500000」'
    : '請先選擇平台，或輸入：「明星 ray1 改金幣 500000」';
  if (!parsed.length) return { ok: false, msg: '❌ 無法辨識指令。' + hint };

  // 多步驟依序執行（VF 操作有先後依賴，必須等前一步完成）
  const allResults = [];
  let allOk = true;
  for (const p of parsed) {
    if (!p.account) { allResults.push({ ok: false, msg: '❌ 找不到帳號/ID。' + hint }); allOk = false; continue; }
    const actions = GAME_ACTIONS[p.game];
    if (!actions) { allResults.push({ ok: false, msg: '❌ 未知平台: ' + p.game }); allOk = false; continue; }
    const action = actions.find(a => a.id === p.actionId);
    if (!action) { allResults.push({ ok: false, msg: '❌ 未知操作: ' + p.actionId }); allOk = false; continue; }
    const val = action.noVal ? null : (p.value || action.def);
    const params = action.mapFn(p.account, val);
    const g = GAMES[p.game];
    const platform = g.platform();
    try {
      const r = await _execApi(platform.base, action.ep, params);
      // 執行 chainEps（如 BoltPower 後自動清賓果）
      let chainMsg = '';
      if (r.ok && action.chainEps && action.chainEps.length) {
        const acctId = parseInt(p.account, 10) || 0;
        for (const cep of action.chainEps) {
          try {
            const cr = await _execApi(platform.base, cep, { accountId: acctId });
            chainMsg += ` → ${cr.ok ? '✅' : '❌'} ${cep}`;
          } catch (ce) { chainMsg += ` → ❌ ${cep}: ${ce.message}`; }
        }
      }
      const label = `${g.icon} ${p.account} → ${action.label}${action.noVal ? '' : ' = ' + val}${chainMsg}`;
      allResults.push({ ok: r.ok, msg: r.ok ? `✅ ${label}` : `❌ 失敗 HTTP ${r.status}`, detail: r.text });
      if (!r.ok) allOk = false;
    } catch (e) {
      allResults.push({ ok: false, msg: '❌ 錯誤: ' + e.message });
      allOk = false;
    }
  }

  // 合併多步驟結果
  if (allResults.length === 1) return allResults[0];
  const combinedMsg = allResults.map((r, i) => `步驟${i + 1}: ${r.msg}`).join('\n');
  const combinedDetail = allResults.map(r => r.detail || '').filter(Boolean).join('\n---\n');
  return { ok: allOk, msg: (allOk ? '✅ 全部完成\n' : '⚠️ 部分失敗\n') + combinedMsg, detail: combinedDetail };
}

let _nlpHistory = [];

// ── Proxy 高速引擎 v4 ──
// 設計目標：首次 ~1s、後續 <500ms
// 策略：快取贏家代理 → 直接重用；失敗時才重新競速
const _isGitHubPages = location.hostname.includes('github.io') || location.protocol === 'https:';
let _localProxyOk = false;
let _winnerProxyIdx = -1; // 快取最快代理索引
let _winnerExpiry = 0;    // 快取到期時間
const WINNER_TTL = 5 * 60 * 1000; // 5 分鐘快取

// 開機自動偵測本地 proxy（GitHub Pages 跳過）
async function _detectLocalProxy() {
  if (_isGitHubPages) { _localProxyOk = false; _updateProxyBadge(); return; }
  try {
    await fetch('http://localhost:8787/api/proxy?url=' + encodeURIComponent('https://example.com'), { signal: AbortSignal.timeout(1500) });
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

// 帶超時的 fetch（精簡版）
function _timedFetch(url, ms = 4000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).then(r => { clearTimeout(timer); return r; })
    .catch(e => { clearTimeout(timer); throw e; });
}

// 雲端代理池（精選 4 個最穩定的）
const CLOUD_PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://corsproxy.org/?${encodeURIComponent(u)}`,
];

async function _fetchViaProxy(url) {
  // 策略 1：本地 proxy 可用 → 直接走（最快）
  if (_localProxyOk) {
    try {
      return await _timedFetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`, 3000);
    } catch {
      _localProxyOk = false;
      _updateProxyBadge();
    }
  }

  // 策略 2：有快取贏家 → 直接用（<200ms 省略競速）
  if (_winnerProxyIdx >= 0 && Date.now() < _winnerExpiry) {
    try {
      const r = await _timedFetch(CLOUD_PROXIES[_winnerProxyIdx](url), 4000);
      if (r.ok || r.status < 500) return r;
    } catch { /* 贏家失效，重新競速 */ }
    _winnerProxyIdx = -1;
  }

  // 策略 3：全部代理同時競速（4秒超時）— 最快的勝出並快取
  const racePromises = CLOUD_PROXIES.map((fn, idx) => {
    return _timedFetch(fn(url), 4000)
      .then(r => {
        if (!r.ok && r.status >= 500) throw new Error('5xx');
        // 記錄贏家
        _winnerProxyIdx = idx;
        _winnerExpiry = Date.now() + WINNER_TTL;
        return r;
      });
  });

  // GitHub Pages 不嘗試 localhost
  if (!_isGitHubPages) {
    racePromises.push(
      _timedFetch(`http://localhost:8787/api/proxy?url=${encodeURIComponent(url)}`, 2000)
        .then(r => { _localProxyOk = true; _updateProxyBadge(); return r; })
        .catch(() => { throw new Error('local'); })
    );
  }

  try { return await Promise.any(racePromises); } catch { /* 全部失敗 */ }

  // 策略 4：最後手段 — 逐一重試前 2 個（6秒超時）
  for (let i = 0; i < Math.min(2, CLOUD_PROXIES.length); i++) {
    try {
      const r = await _timedFetch(CLOUD_PROXIES[i](url), 6000);
      if (r.ok || r.status < 500) {
        _winnerProxyIdx = i;
        _winnerExpiry = Date.now() + WINNER_TTL;
        return r;
      }
    } catch { /* next */ }
  }

  throw new Error('所有代理均無法連線，請稍後再試');
}

async function _execApi(base, ep, params) {
  const qs = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => qs.append(k, v));
  const url = base + ep + (qs.toString() ? '?' + qs.toString() : '');

  // 策略：先嘗試直連（VF 有 CORS headers）→ 失敗才走代理
  try {
    const directRes = await _timedFetch(url, 4000);
    if (directRes.ok || directRes.status < 500) {
      return { ok: directRes.ok, status: directRes.status, text: await directRes.text(), url };
    }
  } catch { /* 直連失敗（CORS 或超時），走代理 */ }

  const res = await _fetchViaProxy(url);
  return { ok: res.ok, status: res.status, text: await res.text(), url };
}

// ── Helpers ──
let _resultHistory = [];
function _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'); }
function toast(msg, type = 'ok') {
  const box = document.getElementById('toastBox'); const el = document.createElement('div');
  el.className = 'toast ' + type; el.textContent = msg; box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

// _findToolEntry removed — endpoints are now embedded directly in GAME_ACTIONS

function _renderResults() {
  const c = document.getElementById('resultMessages'); if (!c) return;
  if (!_resultHistory.length) { c.innerHTML = `<div class="results-empty"><span class="empty-icon">📋</span><span>執行結果將顯示在這裡</span></div>`; return; }
  c.innerHTML = '<div class="result-list">' + _resultHistory.map(msg => {
    if (msg.role === 'user') return `<div class="result-item user"><div class="result-header">👤 ${_esc(msg.label)}</div><div class="result-body">${_esc(msg.text)}</div></div>`;
    const cls = msg.ok ? 'ok' : 'err';
    return `<div class="result-item bot ${cls}"><div class="result-header">🤖 ${_esc(msg.label)}</div><div class="result-body">${_esc(msg.text)}</div>${msg.detail ? `<div class="result-detail">${_esc(msg.detail)}</div>` : ''}</div>`;
  }).join('') + '</div>';
  c.scrollTop = c.scrollHeight;
}

// ══════════════════════════════════════
// SELECT GAME
// ══════════════════════════════════════
function selectGame(gameKey) {
  selectedGame = gameKey;
  document.querySelectorAll('.game-card').forEach(b => b.classList.remove('active'));
  document.getElementById('game-' + gameKey)?.classList.add('active');
  // Show command table
  document.getElementById('cmdTableArea').style.display = 'block';
  document.getElementById('btnExec').disabled = false;
  const g = GAMES[gameKey];
  // Update table header label (帳號 vs ID)
  const thAcct = document.getElementById('thAccount');
  if (thAcct) thAcct.textContent = g.inputLabel || '帳號';
  // Reset rows and add one empty row
  cmdRows = [];
  addRow();
  toast(`已選擇 ${g.icon} ${g.name}`, 'info');
}

// ══════════════════════════════════════
// COMMAND ROW MANAGEMENT
// ══════════════════════════════════════
function addRow(account = '', actionIdx = 0, value = null, actionIdx2 = -1) {
  const id = rowIdCounter++;
  cmdRows.push({ id, account, actionIdx, actionIdx2, value });
  _renderTable();
  // Focus the new row's account input after render
  setTimeout(() => { const el = document.getElementById('acc-' + id); if (el && !account) el.focus(); }, 50);
}

function removeRow(id) {
  cmdRows = cmdRows.filter(r => r.id !== id);
  if (!cmdRows.length) addRow();
  else _renderTable();
}

// 清除所有欄位資料（帳號/ID + 數值），保留行數
function clearAllData() {
  cmdRows.forEach(row => {
    row.account = '';
    row.value = null;
    row.value2 = undefined;
    row.valueB = '';
    row.valueB2 = undefined;
    row.actionIdx = 0;
    row.actionIdx2 = -1;
    row.fieldValues = {};
    row.fieldValuesB = {};
  });
  _renderTable();
  // 清除行狀態
  cmdRows.forEach(row => {
    const rowEl = document.getElementById('row-' + row.id);
    if (rowEl) rowEl.classList.remove('row-ok', 'row-err');
  });
  toast('🧹 已清除所有欄位資料', 'info');
}

function duplicateRow(id) {
  const src = cmdRows.find(r => r.id === id);
  if (!src) return;
  // Read current DOM values
  _syncRowFromDom(id);
  addRow(src.account, src.actionIdx, src.value, src.actionIdx2 || -1);
}

function _syncRowFromDom(id) {
  const row = cmdRows.find(r => r.id === id); if (!row) return;
  const accEl = document.getElementById('acc-' + id);
  const actEl = document.getElementById('act-' + id);
  const act2El = document.getElementById('act2-' + id);
  if (accEl) row.account = accEl.value.trim();
  if (actEl) row.actionIdx = parseInt(actEl.value, 10);
  if (act2El) row.actionIdx2 = parseInt(act2El.value, 10);

  if (selectedGame) {
    // Action A
    const action = GAME_ACTIONS[selectedGame][row.actionIdx];
    if (action && action.multiVal && action.fields) {
      if (!row.fieldValues) row.fieldValues = {};
      action.fields.forEach(f => {
        const el = document.getElementById('mf-' + f.k + '-' + id);
        if (el) row.fieldValues[f.k] = el.value;
      });
    } else {
      const valEl = document.getElementById('val-' + id);
      const val2El = document.getElementById('val2-' + id);
      if (valEl) row.value = valEl.value;
      if (val2El) row.value2 = val2El.value;
    }

    // Action B
    const action2 = row.actionIdx2 >= 0 ? GAME_ACTIONS[selectedGame][row.actionIdx2] : null;
    if (action2 && action2.multiVal && action2.fields) {
      if (!row.fieldValuesB) row.fieldValuesB = {};
      action2.fields.forEach(f => {
        const el = document.getElementById('mfB-' + f.k + '-' + id);
        if (el) row.fieldValuesB[f.k] = el.value;
      });
    } else if (action2 && action2.dualVal) {
      const valBEl = document.getElementById('valB-' + id);
      const valB2El = document.getElementById('valB2-' + id);
      if (valBEl) row.valueB = valBEl.value;
      if (valB2El) row.valueB2 = valB2El.value;
    } else {
      const valBEl = document.getElementById('valB-' + id);
      if (valBEl) row.valueB = valBEl.value;
    }
  }
}

function _syncAllRows() {
  cmdRows.forEach(r => _syncRowFromDom(r.id));
}

function onActionChange(id) {
  _syncRowFromDom(id);
  const row = cmdRows.find(r => r.id === id);
  if (!row || !selectedGame) return;
  const actions = GAME_ACTIONS[selectedGame];
  const action = actions[row.actionIdx];
  row.value = action.noVal ? '' : String(action.def || '');
  if (action.dualVal) row.value2 = String(action.def2 || '');
  if (action.multiVal && action.fields) {
    row.fieldValues = {};
    action.fields.forEach(f => row.fieldValues[f.k] = String(f.def));
  }
  // Re-render just the value cell
  const valCell = document.getElementById('valcell-' + id);
  if (valCell) valCell.innerHTML = _buildValHtml(action, row);
  // 同步更新操作B的數值欄
  const valBCell = document.getElementById('valBcell-' + id);
  if (valBCell) {
    const act2Idx = row.actionIdx2 !== undefined ? row.actionIdx2 : -1;
    valBCell.innerHTML = _buildValBHtml(act2Idx, row);
  }
}

// 生成數值欄位 HTML（預設不填寫，placeholder 顯示預設值）
function _buildValHtml(action, row) {
  if (action.noVal) return `<span class="no-val-tag">無需數值</span>`;
  if (action.multiVal && action.fields) {
    const fv = row.fieldValues || {};
    return `<div style="display:flex;gap:6px">${action.fields.map(f => {
      const hasVal = fv[f.k] !== undefined && fv[f.k] !== '';
      return `<div style="flex:1;min-width:0"><div style="font-size:10px;color:var(--t3);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.lbl}</div><input class="fi row-val" type="${f.type === 'text' ? 'text' : 'number'}" id="mf-${f.k}-${row.id}" value="${hasVal ? fv[f.k] : ''}" placeholder="${f.def}" title="${f.lbl}（預設：${f.def}）" style="width:100%"></div>`;
    }).join('')}</div>`;
  }
  if (action.dualVal) {
    const hasV1 = row.value !== null && row.value !== '' && row.value !== undefined;
    const hasV2 = row.value2 !== undefined && row.value2 !== '' && row.value2 !== null;
    return `<div style="display:flex;gap:4px"><input class="fi row-val" type="number" id="val-${row.id}" value="${hasV1 ? row.value : ''}" placeholder="${action.def}" title="${action.vLabel}（預設：${action.def}）" style="flex:1"><input class="fi row-val" type="number" id="val2-${row.id}" value="${hasV2 ? row.value2 : ''}" placeholder="${action.def2}" title="${action.vLabel2}（預設：${action.def2}）" style="flex:1"></div>`;
  }
  const hasVal = row.value !== null && row.value !== '' && row.value !== undefined;
  return `<input class="fi row-val" type="number" id="val-${row.id}" value="${hasVal ? row.value : ''}" placeholder="${action.def}" title="${action.vLabel}（預設：${action.def}）">`;
}

// 操作B 數值欄位 HTML
function _buildValBHtml(act2Idx, row) {
  if (!selectedGame || act2Idx < 0) return '';
  const actions = GAME_ACTIONS[selectedGame];
  const action = actions[act2Idx];
  if (!action) return '';
  if (action.noVal) return `<span class="no-val-tag">無需數值</span>`;
  if (action.multiVal && action.fields) {
    const fv = row.fieldValuesB || {};
    return `<div style="display:flex;gap:6px">${action.fields.map(f => {
      const hasVal = fv[f.k] !== undefined && fv[f.k] !== '';
      return `<div style="flex:1;min-width:0"><div style="font-size:10px;color:var(--t3);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.lbl}</div><input class="fi row-val" type="${f.type === 'text' ? 'text' : 'number'}" id="mfB-${f.k}-${row.id}" value="${hasVal ? fv[f.k] : ''}" placeholder="${f.def}" title="${f.lbl}（預設：${f.def}）" style="width:100%"></div>`;
    }).join('')}</div>`;
  }
  if (action.dualVal) {
    const hasV1 = row.valueB !== null && row.valueB !== '' && row.valueB !== undefined;
    const hasV2 = row.valueB2 !== undefined && row.valueB2 !== '' && row.valueB2 !== null;
    return `<div style="display:flex;gap:4px"><input class="fi row-val" type="number" id="valB-${row.id}" value="${hasV1 ? row.valueB : ''}" placeholder="${action.def}" title="${action.vLabel}（預設：${action.def}）" style="flex:1"><input class="fi row-val" type="number" id="valB2-${row.id}" value="${hasV2 ? row.valueB2 : ''}" placeholder="${action.def2}" title="${action.vLabel2}（預設：${action.def2}）" style="flex:1"></div>`;
  }
  const hasVal = row.valueB !== undefined && row.valueB !== '';
  return `<input class="fi row-val" type="number" id="valB-${row.id}" value="${hasVal ? row.valueB : ''}" placeholder="${action.def || '數值'}" title="${action.vLabel || '數值'}（預設：${action.def || ''}）" style="width:100%">`;
}

function onAction2Change(id) {
  _syncRowFromDom(id);
  const row = cmdRows.find(r => r.id === id);
  if (!row || !selectedGame) return;
  const actions = GAME_ACTIONS[selectedGame];
  const act2Idx = row.actionIdx2;
  // 重設 valueB
  if (act2Idx >= 0 && actions[act2Idx]) {
    const action2 = actions[act2Idx];
    row.valueB = action2.noVal ? '' : String(action2.def || '');
    if (action2.dualVal) row.valueB2 = String(action2.def2 || '');
    if (action2.multiVal && action2.fields) {
      row.fieldValuesB = {};
      action2.fields.forEach(f => row.fieldValuesB[f.k] = String(f.def));
    }
  } else {
    row.valueB = '';
    row.valueB2 = '';
    row.fieldValuesB = {};
  }
  const valBCell = document.getElementById('valBcell-' + id);
  if (valBCell) valBCell.innerHTML = _buildValBHtml(act2Idx, row);
}

function _renderTable() {
  if (!selectedGame) return;
  const actions = GAME_ACTIONS[selectedGame];
  const g = GAMES[selectedGame];
  const tbody = document.getElementById('cmdTbody');
  tbody.innerHTML = cmdRows.map(row => {
    const action = actions[row.actionIdx] || actions[0];
    const inputLabel = g.inputLabel || '帳號';
    const act2Val = row.actionIdx2 !== undefined ? row.actionIdx2 : -1;
    return `<tr class="cmd-row" id="row-${row.id}">
      <td><input class="fi row-acc" type="text" id="acc-${row.id}" value="${_esc(row.account)}" placeholder="${inputLabel}" autocomplete="off"></td>
      <td><select class="fi row-act" id="act-${row.id}" onchange="onActionChange(${row.id})">
        ${actions.map((a, i) => `<option value="${i}" ${i === row.actionIdx ? 'selected' : ''}>${a.icon} ${a.label}</option>`).join('')}
      </select></td>
      <td id="valcell-${row.id}">${_buildValHtml(action, row)}</td>
      <td>
        <select class="fi row-act row-act2" id="act2-${row.id}" onchange="onAction2Change(${row.id})" title="操作B（可選，預設無）">
          <option value="-1" ${act2Val === -1 ? 'selected' : ''}>— 無 —</option>
          ${actions.map((a, i) => `<option value="${i}" ${i === act2Val ? 'selected' : ''}>${a.icon} ${a.label}</option>`).join('')}
        </select>
      </td>
      <td id="valBcell-${row.id}">${_buildValBHtml(act2Val, row)}</td>
      <td class="row-actions">
        <button class="row-btn row-btn-dup" onclick="duplicateRow(${row.id})" title="複製此行">📋</button>
        <button class="row-btn row-btn-del" onclick="removeRow(${row.id})" title="刪除此行">✕</button>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('rowCount').textContent = cmdRows.length;
}

// Batch add: modal with textarea for multi-line paste
function batchAddAccounts() {
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
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function _doBatchAdd() {
  const ta = document.getElementById('batchTextarea');
  const text = ta?.value || '';
  document.getElementById('batchModal')?.remove();
  if (!text.trim()) return;
  _syncAllRows();
  const accounts = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  if (!accounts.length) return;
  // If only 1 empty row exists, replace it
  if (cmdRows.length === 1 && !cmdRows[0].account) {
    cmdRows[0].account = accounts[0];
    accounts.slice(1).forEach(a => { const id = rowIdCounter++; cmdRows.push({ id, account: a, actionIdx: cmdRows[0].actionIdx, actionIdx2: cmdRows[0].actionIdx2 || -1, value: null }); });
  } else {
    accounts.forEach(a => { const id = rowIdCounter++; cmdRows.push({ id, account: a, actionIdx: 0, actionIdx2: -1, value: null }); });
  }
  _renderTable();
  toast(`已新增 ${accounts.length} 個帳號`, 'info');
}

// Apply same action+value to all rows
function applyToAll() {
  _syncAllRows();
  if (!cmdRows.length) return;
  const first = cmdRows[0];
  cmdRows.forEach(r => { r.actionIdx = first.actionIdx; r.actionIdx2 = first.actionIdx2 !== undefined ? first.actionIdx2 : -1; r.value = first.value; });
  _renderTable();
  toast('已套用第一行設定到所有行', 'info');
}

// ══════════════════════════════════════
// EXECUTE
// ══════════════════════════════════════
async function execSubmit() {
  if (!selectedGame) { toast('⚠️ 請先選擇遊戲平台', 'err'); return; }
  _syncAllRows();
  const g = GAMES[selectedGame];
  const actions = GAME_ACTIONS[selectedGame];
  const platform = g.platform();

  // Validate
  const validRows = cmdRows.filter(r => r.account);
  if (!validRows.length) { toast('請至少輸入一個帳號', 'err'); return; }

  const btn = document.getElementById('btnExec');
  btn.classList.add('loading'); btn.disabled = true;

  // Build summary
  const summary = validRows.map(r => {
    const act = actions[r.actionIdx] || actions[0];
    return `${r.account} → ${act.label}${act.noVal ? '' : ' ' + r.value}`;
  }).join('、');
  _resultHistory.push({ role: 'user', label: `${validRows.length} 筆指令`, text: `[${g.icon} ${g.name}] ${summary}` });
  _renderResults();

  const startTime = Date.now();
  // Execute all rows in parallel
  const results = await Promise.all(validRows.map(async row => {
    const action = actions[row.actionIdx] || actions[0];
    let params;
    if (action.multiVal && action.fields) {
      const fv = row.fieldValues || {};
      const fieldObj = {};
      action.fields.forEach(f => {
        if (f.type === 'text') fieldObj[f.k] = fv[f.k] !== undefined ? String(fv[f.k]) : String(f.def);
        else fieldObj[f.k] = parseInt(fv[f.k], 10) || f.def;
      });
      params = action.mapFn(row.account, fieldObj);
    } else if (action.dualVal) {
      const val = parseInt(row.value, 10) || action.def;
      const val2 = parseInt(row.value2, 10) || action.def2;
      params = action.mapFn(row.account, val, val2);
    } else {
      const val = action.noVal ? null : (parseInt(row.value, 10) || action.def);
      params = action.mapFn(row.account, val);
    }
    try {
      const r = await _execApi(platform.base, action.ep, params);
      let chainResults = [];
      // 執行 chainEps（例如 BoltPower 後自動清賓果）
      if (action.chainEps && action.chainEps.length) {
        const acctId = parseInt(row.account, 10) || 0;
        chainResults = await Promise.all(action.chainEps.map(async cep => {
          try {
            const cr = await _execApi(platform.base, cep, { accountId: acctId });
            return { ep: cep, ok: cr.ok, text: cr.text };
          } catch (e) { return { ep: cep, ok: false, text: e.message }; }
        }));
      }
      // 執行操作B（若有設定）
      let action2Result = null;
      const act2Idx = row.actionIdx2 !== undefined ? row.actionIdx2 : -1;
      if (act2Idx >= 0 && actions[act2Idx]) {
        const action2 = actions[act2Idx];
        let params2;
        if (action2.multiVal && action2.fields) {
          const fvB = row.fieldValuesB || {};
          const fieldObjB = {};
          action2.fields.forEach(f => {
            if (f.type === 'text') fieldObjB[f.k] = fvB[f.k] !== undefined ? String(fvB[f.k]) : String(f.def);
            else fieldObjB[f.k] = parseInt(fvB[f.k], 10) || f.def;
          });
          params2 = action2.mapFn(row.account, fieldObjB);
        } else if (action2.dualVal) {
          const valB = parseInt(row.valueB, 10) || action2.def;
          const valB2 = parseInt(row.valueB2, 10) || action2.def2;
          params2 = action2.mapFn(row.account, valB, valB2);
        } else if (action2.noVal) {
          params2 = action2.mapFn(row.account, null);
        } else {
          const valB = (row.valueB !== undefined && row.valueB !== '') ? (parseInt(row.valueB, 10) || action2.def) : action2.def;
          params2 = action2.mapFn(row.account, valB);
        }
        try {
          const r2 = await _execApi(platform.base, action2.ep, params2);
          action2Result = { label: action2.label, ok: r2.ok, text: r2.text };
        } catch (e2) {
          action2Result = { label: action2.label, ok: false, text: e2.message };
        }
      }
      const chainOk = chainResults.every(c => c.ok);
      const chainDetail = chainResults.map(c => `${c.ok ? '✅' : '❌'} ${c.ep}`).join(', ');
      const act2Ok = action2Result ? action2Result.ok : true;
      const act2Detail = action2Result ? ` | 操作B: ${action2Result.ok ? '✅' : '❌'} ${action2Result.label}` : '';
      return { account: row.account, action: action.label + (action2Result ? ' → ' + action2Result.label : ''), ok: r.ok && chainOk && act2Ok, status: r.status, text: r.text + (chainResults.length ? ` | 連鎖: ${chainDetail}` : '') + act2Detail };
    } catch (e) { return { account: row.account, action: action.label, ok: false, status: 0, text: e.message }; }
  }));

  const elapsed = Date.now() - startTime;
  const okCnt = results.filter(r => r.ok).length;
  const allOk = okCnt === results.length;
  _resultHistory.push({
    role: 'bot', ok: allOk, label: `${g.name} 批次執行`,
    text: allOk ? `✅ 全部成功！(${results.length} 筆，${elapsed}ms)` : `⚠️ 部分失敗 (${okCnt}/${results.length}，${elapsed}ms)`,
    detail: results.map(r => `${r.ok ? '✅' : '❌'} ${r.account} → ${r.action}`).join('\n')
  });
  _renderResults();
  btn.classList.remove('loading'); btn.disabled = false;
  // Mark row results
  results.forEach((r, i) => {
    const rowEl = document.getElementById('row-' + validRows[i].id);
    if (rowEl) { rowEl.classList.remove('row-ok', 'row-err'); rowEl.classList.add(r.ok ? 'row-ok' : 'row-err'); }
  });
  toast(allOk ? `✅ ${results.length} 筆完成 (${elapsed}ms)` : `⚠️ 失敗 ${results.length - okCnt} 筆`, allOk ? 'ok' : 'err');
}

// ── NLP chat submit ──
async function nlpSubmit() {
  const el = document.getElementById('nlpInput');
  const input = el.value.trim();
  if (!input) { toast('請輸入指令', 'err'); return; }
  _nlpHistory.push({ role: 'user', text: input });
  _renderNlpChat();
  el.value = '';
  const r = await _nlpExec(input);
  _nlpHistory.push({ role: 'bot', ok: r.ok, text: r.msg, detail: r.detail || '' });
  _renderNlpChat();
  toast(r.ok ? '✅ 執行成功' : '❌ 執行失敗', r.ok ? 'ok' : 'err');
}

function _renderNlpChat() {
  const c = document.getElementById('nlpMessages'); if (!c) return;
  if (!_nlpHistory.length) { c.innerHTML = '<div class="results-empty"><span class="empty-icon">💬</span><span>在下方輸入口語指令，例如：「明星 ray1 改金幣 500000」</span></div>'; return; }
  c.innerHTML = '<div class="result-list">' + _nlpHistory.map(msg => {
    if (msg.role === 'user') return `<div class="result-item user"><div class="result-header">👤 你</div><div class="result-body">${_esc(msg.text)}</div></div>`;
    const cls = msg.ok ? 'ok' : 'err';
    return `<div class="result-item bot ${cls}"><div class="result-header">🤖 AI</div><div class="result-body">${_esc(msg.text)}</div>${msg.detail ? `<div class="result-detail">${_esc(msg.detail)}</div>` : ''}</div>`;
  }).join('') + '</div>';
  c.scrollTop = c.scrollHeight;
}

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
function renderApp() {
  if (!AI_TOOL_REGISTRY.length) _registerAiTools();
  document.getElementById('main').innerHTML = `
    <div class="app-container">
      <!-- STEP 1: Game -->
      <div class="section-card">
        <div class="section-title"><span class="step-num">1</span> 選擇遊戲平台</div>
        <div class="game-grid">
          ${Object.entries(GAMES).map(([k, g]) => `<button class="game-card" id="game-${k}" onclick="selectGame('${k}')" style="--gc:${g.color}"><span class="game-icon">${g.icon}</span><span class="game-name">${g.name}</span></button>`).join('')}
        </div>
      </div>

      <!-- COMMAND TABLE -->
      <div class="section-card" id="cmdTableArea" style="display:none">
        <div class="section-title"><span class="step-num">2</span> 設定指令 <span class="row-count-badge"><span id="rowCount">0</span> 筆</span></div>
        <div class="table-toolbar">
          <button class="tb-btn" onclick="addRow()">➕ 新增一行</button>
          <button class="tb-btn" onclick="batchAddAccounts()">📋 批次貼上帳號</button>
          <button class="tb-btn" onclick="applyToAll()">🔄 套用第一行設定到全部</button>
          <button class="tb-btn" onclick="clearAllData()" style="margin-left:auto;color:#ff6b6b">🧹 清除資料</button>
        </div>
        <div class="table-wrap">
          <table class="cmd-table">
            <thead><tr><th id="thAccount">帳號</th><th>操作A</th><th>數值</th><th>操作B（選填）</th><th>B數值</th><th style="width:70px"></th></tr></thead>
            <tbody id="cmdTbody"></tbody>
          </table>
        </div>
      </div>

      <!-- NLP Chat -->
      <div class="section-card">
        <div class="section-title"><span class="step-num">💬</span> 口語化指令（直接輸入即執行）</div>
        <div style="font-size:12px;color:var(--t3);margin-bottom:12px;line-height:1.8">
          上方已選平台時，直接輸入帳號/編號＋操作＋數值即可<br>
          🎰 VF 範例：「163436 改金幣 500000」「163436 先清除賓果再改BP12」<br>
          ⭐ AIO 範例：「ray1 改金幣 500000」「明星 ray1 vip 8」<br>
          💡 多步驟：用「先…再…」或「然後」串接，如「163436 先清除賓果再改BP12」
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
