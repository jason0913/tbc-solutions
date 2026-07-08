# TBC Solutions — Deploy Checklist

> 內部文件,唔會 deploy(`build-deploy.js` 只 copy 指定 public 檔)。
> 最後更新對應 build tag:**R33.1-livedemo-reset**
> 部署平台:**Vercel 為主**(Netlify 係 parity fallback)。詳見 `DEPLOY.md`。
> ⚠️ Serverless function(`/api/claude`、`/api/lead`)**唔喺 dist**;Vercel 要 Git 部署整個 project + Output Directory = `dist`,唔好淨係 static-upload dist,否則兩個 API 都 404。

---

## 1. Deploy 前(Pre-deploy)

- [ ] **Env vars 已設**(Netlify 或 Vercel,揀你 deploy 嗰個平台)
  - [ ] `CLAUDE_API_KEY`(OpenRouter / relay key)
  - [ ] `CLAUDE_MODEL` = 一個**確定 relay(catcats.net)收嘅** model 名
    - ⚠️ 唔好淨係靠 frontend 預設 `claude-sonnet-4-6` — relay 未必收。Function 已 wire 成優先用呢個 env。
  - [ ] **Lead capture(`/api/lead`)env**:
    - [ ] `RESEND_API_KEY`(resend.com)
    - [ ] `LEAD_NOTIFY_TO`(lead 收件,例 `shek0913@tbchk.com`)
    - [ ] `LEAD_FROM`(**要 Resend 驗證咗嘅 sender/domain**,例 `hello@tbchk.com`)
  - [ ] **Blog gated resource(`/api/leads/base`)Google Sheet env**:
    - [ ] `GOOGLE_SHEETS_CLIENT_EMAIL`
    - [ ] `GOOGLE_SHEETS_PRIVATE_KEY`(Vercel 用 `\n` 保留換行)
    - [ ] `GOOGLE_SHEETS_BASE_LEADS_SPREADSHEET_ID`
    - [ ] `GOOGLE_SHEETS_BASE_LEADS_RANGE`(可選,預設 `base_leads!A:I`)
    - [ ] Sheet 已 share 畀 service account email,首行欄位齊:`created_at,email,name,source,resource_slug,resource_title,page_url,user_agent,status`
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
- [ ] **Email lead capture**:預約區之前個 form 填 email 提交 → inbox 收到「🟢 New lead」(未設 env 會出友善錯誤,唔白頁)
  - [ ] (上線前)`/api/lead` 加 Vercel Firewall / rate limit 防 spam 燒 Resend quota
- [ ] **Blog gated resource**:`/blog/base` 開到
  - [ ] 無效 Email 顯示錯誤,唔解鎖
  - [ ] 有效 Email 經 `/api/leads/base` 成功寫入 Google Sheet
  - [ ] API 成功後先同頁解鎖完整內容,唔跳頁
  - [ ] 手機版資源 preview / email form / 解鎖內容無橫向爆版
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
