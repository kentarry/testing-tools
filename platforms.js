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
    // 基本設定
    { id:'vf_money', icon:'💰', name:'修改財產 / ModifyMoney', ep:'/Test_ModifyMoney' },
    { id:'vf_vip', icon:'👑', name:'修改VIP / ModifyVipInfo', ep:'/Test_ModifyVipInfo' },
    { id:'vf_level', icon:'📊', name:'修改等級 / ModifyLevelInfo', ep:'/Test_ModifyLevelInfo' },
    { id:'vf_bolt', icon:'⚡', name:'BoltPower + 清賓果', ep:'/Test_ModifyBoltPower' },
    // 道具 / 天降
    { id:'vf_item', icon:'🎁', name:'修改道具 / GoldItem_Modify', ep:'/Test_GoldItem_ModifyPlayerData' },
    { id:'vf_godsend', icon:'🎉', name:'天降好禮 / GodSend', ep:'/Test_GodSend_GiveReward' },
    { id:'vf_inbox', icon:'📬', name:'Inbox塞信件', ep:'/Test_Inbox_InsertMail' },
    // 儲值
    { id:'vf_deposit', icon:'💳', name:'新增儲值紀錄', ep:'/Test_Add_UserStoredValueRecord' },
    { id:'vf_delDeposit', icon:'🗑️', name:'刪除儲值紀錄', ep:'/Test_Delete_UserStoredValueRecord' },
    // Battle Pass
    { id:'vf_bpReset', icon:'🏅', name:'重置BP', ep:'/Test_BattlePass_PlayerReset' },
    { id:'vf_bpV2Reset', icon:'🏅', name:'重置BP v2', ep:'/Test_BattlePassV2_PlayerReset' },
    { id:'vf_bpType', icon:'🎫', name:'設定BP類型', ep:'/Test_BattlePass_SetPlayerPassType' },
    // 清除資料
    { id:'vf_bingo', icon:'🎱', name:'清除賓果', ep:'/Test_Bingo_ClearPlayerData' },
    { id:'vf_attend', icon:'📅', name:'清除簽到簿', ep:'/Test_AttendBook_ClearPlayerData' },
    { id:'vf_mission', icon:'📋', name:'清除大廳任務', ep:'/Test_Mission_ClearPlayerData' },
    { id:'vf_quest', icon:'🎯', name:'清除遊戲任務', ep:'/Test_QuestGame_ClearPlayerData' },
    { id:'vf_eventMission', icon:'📝', name:'清除單頁任務', ep:'/Test_EventMission_ClearPlayerData' },
    { id:'vf_tag', icon:'🏷️', name:'清空標籤', ep:'/Test_UserTag_Clear' },
    { id:'vf_email', icon:'📧', name:'清除Email', ep:'/Test_ClearProfileDataEmail' },
    { id:'vf_ad', icon:'📺', name:'清除廣告資料', ep:'/Test_AD_ClearPlayerData' },
    { id:'vf_offline', icon:'🌙', name:'清除離線獎勵', ep:'/Test_OfflineBonus_ClearPlayerData' },
    { id:'vf_offlineMul', icon:'✖️', name:'清除離線倍率', ep:'/Test_OfflineBonus_ClearPlayerMultipleData' },
    { id:'vf_piggy', icon:'🐷', name:'清除小豬撲滿', ep:'/Test_PiggyBank_ClearPlayerData' },
    { id:'vf_couponAct', icon:'🎟️', name:'清除優惠券活動', ep:'/Test_Coupon_ClearPlayerActivity' },
    { id:'vf_couponOwn', icon:'🎫', name:'清除持有優惠券', ep:'/Test_Coupon_ClearPlayerCoupon' },
    { id:'vf_credential', icon:'🔑', name:'清除資格資料', ep:'/Test_Credential_ClearPlayerData' },
    { id:'vf_liveops', icon:'📡', name:'清除LiveOps', ep:'/Test_LiveOps_ClearUserActivity' },
    { id:'vf_luckyTrip', icon:'🎰', name:'清除連續禮包', ep:'/Test_LuckyTrip_ClearPlayerData' },
    { id:'vf_specialSign', icon:'📆', name:'清除七日簽', ep:'/Test_SpecialSignIn_ClearPlayerData' },
    { id:'vf_groupPrize', icon:'🎁', name:'清除分群禮包', ep:'/Test_Clear_Player_GroupingPrizeData' },
    // 卡冊
    { id:'vf_albumAll', icon:'📕', name:'刪除卡冊全部', ep:'/Test_JourneyAlbum_AllDeletePlayerData' },
    { id:'vf_albumMission', icon:'📗', name:'刪除卡冊任務', ep:'/Test_JourneyAlbum_DeletePlayerMission' },
    { id:'vf_albumFree', icon:'📘', name:'重領免費卡包', ep:'/Test_JourneyAlbum_ReTakeFreePack' },
    // 其他
    { id:'vf_dropItem', icon:'💧', name:'快速掉落', ep:'/Test_DropItems_FastDrop' },
    { id:'vf_createTime', icon:'🕐', name:'修改建立時間', ep:'/Test_ModifyAccountCreateTime' },
    { id:'vf_region', icon:'🌍', name:'修改註冊地區', ep:'/Test_ModifyAccountRegisterAreaCode' },
  ]
};
