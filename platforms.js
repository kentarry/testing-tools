// ═══════════════════════════════════════════════════
// Standalone Platform Definitions (AIO + TMD + VF)
// No dependency on parent project
// ═══════════════════════════════════════════════════

const PLATFORM_AIO = {
  id: 'aio', name: '明星3缺1', icon: '⭐', color: '#8b5cf6',
  base: 'http://34.80.13.113/InnerService/Service.asmx',
  tools: [
    { id:'aio_money', icon:'💰', name:'改錢 / ChangeBill', ep:'/ChangeBill' },
    { id:'aio_vip', icon:'👑', name:'改VIP / ChangeVIP', ep:'/ChangeVIP' },
    { id:'aio_level', icon:'📊', name:'等級測試 / TestLevelUp', ep:'/TestLevelUp' },
    { id:'aio_deposit', icon:'💳', name:'測試儲值 / TestDeposit', ep:'/TestDeposit' },
    { id:'aio_refill', icon:'🔄', name:'清除補幣 / ResetRefillInfo', ep:'/ResetRefillInfo' },
    { id:'aio_skill', icon:'🃏', name:'改技能卡 / ChangeSkillCard', ep:'/ChangeSkillCard' },
    { id:'aio_godsend', icon:'🎁', name:'天降好禮 / GodsendGiveGameCard', ep:'/GodsendGivePrizeToFreeGameCard' },
    { id:'aio_bp_score', icon:'🏅', name:'BP增加分數 / BattlePassAddScore', ep:'/BattlePassAddScore' },
    { id:'aio_bp_condition', icon:'✅', name:'BP完成條件 / BattlePassConditionCount', ep:'/BattlePassConditionCount' },
  ]
};

const PLATFORM_TMD = {
  id: 'tmd', name: '滿貫大亨', icon: '🀄', color: '#f59e0b',
  base: 'https://tmd.towergame.com/TMD/TestEnvironment/Service.asmx',
  tools: [
    { id:'tmd_money', icon:'💎', name:'調整紅鑽 / UpdatePlayerMoney', ep:'/UpdatePlayerMoney' },
    { id:'tmd_vip', icon:'👑', name:'調整VIP / UpdatePlayerVip', ep:'/UpdatePlayerVip' },
    { id:'tmd_horse', icon:'🐴', name:'調整金馬 / Horse_ChangeUserLevel', ep:'/Horse_ChangeUserLevel' },
    { id:'tmd_clearPkg', icon:'🎒', name:'清空背包 / ClearPlayerPackage', ep:'/ClearPlayerPackage' },
    { id:'tmd_singleItem', icon:'🎁', name:'取得單一物品 / GetSingleForeverItem', ep:'/GetSingleForeverItemBySigleAccount' },
    { id:'tmd_contItem', icon:'📦', name:'取得區間物品 / GetContinuousForeverItem', ep:'/GetContinuouslyForeverItemBySigleAccount' },
    { id:'tmd_score', icon:'🏆', name:'調整排行榜 / ScoreboardAssignScore', ep:'/ScoreboardAssignScore' },
  ]
};

const PLATFORM_VF = {
  id: 'vf', name: 'Vegas Frenzy', icon: '🎰', color: '#ec4899',
  base: 'https://test-vegasfrenzy.towergame.com/service/1999',
  tools: [
    { id:'vf_money', icon:'💰', name:'修改財產 / ModifyMoney', ep:'/Test_ModifyMoney' },
    { id:'vf_vip', icon:'👑', name:'修改VIP / ModifyVipInfo', ep:'/Test_ModifyVipInfo' },
    { id:'vf_level', icon:'📊', name:'修改等級 / ModifyLevelInfo', ep:'/Test_ModifyLevelInfo' },
    { id:'vf_bolt', icon:'⚡', name:'修改BoltPower', ep:'/Test_ModifyBoltPower' },
  ]
};
