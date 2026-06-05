# TBC Solutions — Deploy Checklist

> 內部文件,唔會 deploy(`build-deploy.js` 只 copy 指定 public 檔)。
> 最後更新對應 build tag:**R28-trust-copy**

---

## 1. Deploy 前(Pre-deploy)

- [ ] **Env vars 已設**(Netlify 或 Vercel,揀你 deploy 嗰個平台)
  - [ ] `CLAUDE_API_KEY`(OpenRouter / relay key)
  - [ ] `CLAUDE_MODEL` = 一個**確定 relay(catcats.net)收嘅** model 名
    - ⚠️ 唔好淨係靠 frontend 預設 `claude-sonnet-4-6` — relay 未必收。Function 已 wire 成優先用呢個 env。
- [ ] **Build 跑得過**:`node scripts/build-deploy.js` → 應該見 `[TBC] Built clean deploy folder`
  - 如果 forbidden-check 報錯,代表有敏感檔走入 dist,要清返。
- [ ] **netlify.toml 確認**:`command = "node scripts/build-deploy.js"` / `publish = "dist"`
- [ ] **dist/index.html build tag** = 最新(同 root 一致)

---

## 2. Deploy 後 Smoke Test(逐項真測)

### 轉化關鍵
- [ ] **Cal.com** widget 載到(`https://cal.com/grouper-shek/30min`)— 唔好得個 fallback
- [ ] **WhatsApp** link 撳到、開到對話
- [ ] **Telegram** link 撳到、開到
- [ ] **8 條 cold-email deep link** 逐條開:
  `?ind=fnb` `retail` `pro` `edu` `tech` `medical` `logistics` `creative`
  - 每條:welcome 跳過、hero 痛點標題正確、demo 已 filter

### Mobile(實機或 390px 模擬)
- [ ] **Floating CTA**(左下💬)scroll 過 hero 後有 show
- [ ] **Impact KPI** 顯示 **80 / 40 / 5 / 24-7**(唔再停 0)
- [ ] 冇橫向爆版(scrollWidth ≈ 螢幕闊度)
- [ ] 語言切換「繁中 / EN」唔斷行

### AI Demo(信任關鍵)
- [ ] `/api/claude` live 真測:打一句,**真係答到**
- [ ] FAB 「🤖 AI 助手」開到 panel、答到、rate-limit work
- [ ] ❌ 第一個互動唔好見「連接 AI 服務失敗」

### 安全(應該全部 404)
- [ ] `/.env.local`
- [ ] `/.git/config`
- [ ] `/cold-email-tool.html`
- [ ] `/tbc-chief-of-staff.skill`
- [ ] `/index.html.bak.colloquial`

---

## 3. 之後再諗(Nice-to-have)

- [ ] **Data handling 一句**:若 demo / 測試會留 log、或收客戶 sample data,喺 FAQ(faq.a5)補一句「demo 互動經第三方 AI API 處理、唔儲存」會更滴水不漏。
- [ ] **第一個真 case study**:落到第一個真客之後,KPI 區可以由「示意數據」轉返真實數字 + 加 case study,信任度大升。
- [ ] **`public/` 重構**(可選):若想 root 永遠唔會誤 share 敏感檔,可考慮將 source 放入子資料夾。目前 `dist/` build + forbidden-check 已足夠擋。

---

## 已知狀態(分布同事已確認 OK)
- Cal.com live URL:200 ✅
- WhatsApp:302 → 200 ✅ ·  Telegram:200 ✅
- dist 已 rebuild ✅ ·  主 email 已統一 `shek0913@tbchk.com` ✅
- 8 條 cold-email mapping:pass ✅
