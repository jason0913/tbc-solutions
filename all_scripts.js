
/* =================================================================
   BUILD-ID AUTO-CLEANUP
   If this page's build differs from what's saved in localStorage,
   wipe every "tbc-*" key so stale profile/welcome-dismissed schemas
   don't leak across deploys. Runs FIRST, before any other script.
   ================================================================= */
(function buildIdGuard(){
  const CURRENT_BUILD = "2026-05-31-R22-mobile-ai";
  // Expose for the freshness probe below
  window.__TBC_BUILD__ = CURRENT_BUILD;
  try{
    const saved = localStorage.getItem("tbc-build-id");
    if(saved !== CURRENT_BUILD){
      // Wipe every tbc-* key (preserves any non-tbc keys other apps stored)
      const toRemove = [];
      for(let i = 0; i < localStorage.length; i++){
        const k = localStorage.key(i);
        if(k && k.startsWith("tbc-") && k !== "tbc-build-id") toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem("tbc-build-id", CURRENT_BUILD);
      if(saved){
        console.info("[TBC] New build detected — cleared stale state:", toRemove);
      }
    }
  }catch(e){}
})();

/* =================================================================
   FRESHNESS PROBE — every 60s, fetch the live page with no-store
   and compare its build tag to ours. If a newer build is live,
   force a hard reload that bypasses the disk cache. Self-healing
   against Chrome's stubborn HTTP cache.
   ================================================================= */
(function freshnessProbe(){
  const RE = /Deploy build tag:\s*([A-Za-z0-9._\-+:]+)/;
  async function check(){
    try{
      const res = await fetch(window.location.pathname + "?_freshprobe=" + Date.now(), {
        cache: "no-store",
        credentials: "omit",
        headers: { "Cache-Control": "no-cache, no-store, max-age=0" },
      });
      if(!res.ok) return;
      const text = await res.text();
      const m = text.match(RE);
      if(!m) return;
      const liveBuild = m[1];
      if(liveBuild && liveBuild !== window.__TBC_BUILD__){
        console.warn("[TBC] Stale HTML detected. Forcing fresh reload.", {running: window.__TBC_BUILD__, live: liveBuild});
        // location.reload(true) is deprecated; force via timestamped query
        const url = new URL(window.location.href);
        url.searchParams.set("_v", String(Date.now()));
        window.location.replace(url.toString());
      }
    }catch(_){/* offline or network blip — try again later */}
  }
  // First check ~5s after load (don't compete with initial render), then every 60s.
  setTimeout(check, 5000);
  setInterval(check, 60000);
  // Also check when tab regains focus — fast catch-up if user came back.
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible") check();
  });
})();

/* =================================================================
   API 設定 — 已改為後端代理模式（Vercel /api/claude）
   API Key 設在 Vercel 環境變數 CLAUDE_API_KEY，前端看不到。
   ================================================================= */
const CLAUDE_ENDPOINT = "/api/claude";               // serverless function (works on Netlify and Vercel)
const CLAUDE_MODEL    = "claude-sonnet-4-6"; // 最新 Claude Sonnet
const CAL_LINK        = "https://cal.com/grouper-shek/30min";

/* ============== i18n ============== */
const I18N = {
  zh:{
    "nav.services":"服務", "nav.demos":"互動 Demo", "nav.impact":"效益", "nav.about":"關於", "nav.process":"流程", "nav.faq":"常見問題", "nav.book":"預約",
    "hero.eyebrow":"自動化 · 預約 · 跟進",
    "hero.title": ["把重複工作","交給系統"],
    "hero.typing":["自動化客戶跟進與預約提醒","為您的網站與內容導入自動化","Transform · Build · Create"],
    "hero.cta":"免費分析您的重複工作", "hero.cta2":"體驗 Demo ↓", "hero.scroll":"向下滾動",
    "hero.descriptor":"把客戶跟進、預約提醒、報表整理交給自動化系統，讓您與員工專注真正帶來收入的工作。",
    "tools.label":"我們熟悉的工具 · POWERED WITH",
    "services.eyebrow":"服務內容",
    "services.title1":"為您打造","services.title2":"智能商業未來",
    "services.desc":"從工作流程自動化到內容生成，我們提供端到端解決方案，協助您與團隊脫離重複事務，專注於真正重要的工作。",
    "services.tag1":"AUTOMATION","services.tag2":"WEB","services.tag3":"CONTENT","services.tag4":"CUSTOM AI",
    "services.s1.title":"AI 自動化工作流程",
    "services.s1.desc":"透過 n8n、Make、Zapier 等工具串聯系統，自動化郵件、CRM、資料同步、報表等重複工作。",
    "services.s2.title":"網頁設計與開發",
    "services.s2.desc":"從品牌官網到電商平台，提供現代感、響應式、SEO 友善的網頁設計與開發。",
    "services.s3.title":"AI 內容創作",
    "services.s3.desc":"運用 Claude / ChatGPT 為您批量生成社交媒體文案、部落格文章、產品描述、廣告素材。",
    "services.s4.title":"客製化 AI 解決方案",
    "services.s4.desc":"針對特定業務需求，打造專屬 AI 助手、知識庫問答、智能客服與決策支援系統。",
    "demos.eyebrow":"互動 DEMO","demos.counterLabel":"DEMOS",
    "demos.title1":"不是說明，","demos.title2":"而是親身體驗",
    "demos.desc":"14 個範例直接在本頁互動，無須下載或註冊。點選上方標籤或左右箭頭切換。",
    "demo1.title":"工作流程拆解工具", "demo1.desc":"輸入您的業務問題，系統即時為您拆解成可執行的自動化流程。",
    "demo1.label":"您的業務問題","demo1.btn":"拆解工作流 →","demo1.save":"平均每月節省 25 小時",
    "demo1.placeholder":"輸入您的問題，系統會動態生成工作流程節點",
    "demo2.title":"客戶聊天助手","demo2.desc":"線上對話助手，可擔任客服、顧問或內部知識助理。",
    "demo2.greet":"您好！我是 TBC Solutions 的線上助手，可為您解答關於服務內容、自動化或網頁開發的任何問題。",
    "demo2.send":"送出","demo2.save":"平均每月節省 40 小時",
    "demo3.title":"網頁生成預覽","demo3.desc":"輸入公司名稱與行業，即時生成標語、Hero 區與三張服務卡片的預覽。",
    "demo3.l1":"公司名稱","demo3.l2":"行業","demo3.btn":"生成預覽 →","demo3.empty":"填入資訊後，這裡會出現預覽","demo3.save":"上線時間縮短 80%",
    "demo4.title":"社交內容草稿生成","demo4.desc":"選擇平台與主題，即時生成符合該平台風格的社交媒體文案草稿。",
    "demo4.l1":"選擇平台","demo4.l2":"主題 / 產品","demo4.btn":"生成文案 →","demo4.empty":"您的文案將顯示在這裡…","demo4.save":"產出速度提升 5 倍",
    "demo5.title":"客戶意圖分析","demo5.desc":"貼上客戶訊息，系統即時判斷緊急度、情緒與類別，並提供建議回覆。",
    "demo5.label":"客戶訊息","demo5.btn":"分析訊息 →","demo5.save":"客服效率提升 3 倍",
    "demo5.urgency":"緊急程度","demo5.mood":"情緒","demo5.category":"類別",
    "demo5.reply":"建議回覆","demo5.replyEmpty":"分析後會即時撰寫專屬回覆…",
    "demo6.title":"銷售跟進信草稿","demo6.desc":"填入客戶資料與上次對話重點，即時撰寫一封專屬跟進電郵。",
    "demo6.l1":"客戶姓名","demo6.l2":"公司 / 行業","demo6.l3":"上次對話重點","demo6.btn":"撰寫跟進信 →",
    "demo6.from":"寄件:","demo6.to":"收件:","demo6.subject":"主旨:","demo6.empty":"填好左側資料，系統即會生成一封跟進信","demo6.save":"成交率提升 2 倍",
    "demo7.title":"會議紀要整理","demo7.desc":"貼上會議筆記或錄音逐字稿，系統自動拆解摘要、行動項目與主要決定。",
    "demo7.label":"會議內容","demo7.btn":"整理紀要 →","demo7.save":"會議筆記速度提升 10 倍",
    "demo7.summary":"摘要","demo7.empty":"分析後將自動產生摘要、行動項目與主要決定。",
    "demo8.title":"翻譯（含語氣與文化備註）","demo8.desc":"不只翻譯 — 系統會根據您選的語氣與文化背景調整表達方式。",
    "demo8.label":"原文","demo8.langLabel":"目標語言","demo8.toneLabel":"語氣",
    "demo8.toneFormal":"正式","demo8.toneCasual":"輕鬆","demo8.toneFriendly":"親切",
    "demo8.btn":"翻譯 →","demo8.empty":"翻譯結果會在這裡顯示…","demo8.save":"支援 30 種以上語言",
    "demo9.title":"評論回覆草稿生成","demo9.desc":"貼上 Google／TripAdvisor／OpenRice 評論，即時生成 3 種不同語氣的回覆供您選擇。",
    "demo9.label":"客戶評論","demo9.bizLabel":"您的業務類型","demo9.btn":"生成 3 個回覆 →",
    "demo9.empty":"分析後會生成 3 種回覆風格","demo9.emptyText":"— 正式專業 ／ 親切溫暖 ／ 真誠致歉（或感謝） —","demo9.save":"每則 30 秒完成",
    "demo10.title":"SEO 標題建議","demo10.desc":"輸入頁面主題與關鍵字，即時生成 5 個 SEO 友善且吸引點擊的標題。",
    "demo10.l1":"頁面主題","demo10.l2":"主要關鍵字","demo10.btn":"生成 5 個標題 →",
    "demo10.empty":"5 個 SEO 標題會在這裡顯示","demo10.emptyText":"— 每個都有不同切入角度 + 點擊吸引力評分 —","demo10.save":"流量平均提升 40%",
    "demo11.title":"電商產品文案草稿","demo11.desc":"輸入產品名稱與主要特色，即時生成符合電商平台風格的完整商品文案。",
    "demo11.l1":"產品名稱","demo11.l2":"主要特色 / 賣點","demo11.btn":"撰寫商品文案 →",
    "demo11.empty":"商品文案會在這裡顯示…","demo11.save":"電商轉換率提升 25%",
    "demo12.title":"多倉庫智能調貨","demo12.desc":"輸入 SKU 與訂購數量，系統即時掌握各倉庫實時庫存，自動推薦最佳出貨點並提示補貨。",
    "demo12.l1":"產品 SKU / 名稱","demo12.l2":"訂購數量","demo12.btn":"智能調貨 →",
    "demo12.empty":"輸入 SKU 與數量後 →","demo12.emptyText":"系統會顯示三個倉庫的實時庫存、運費與預計送達時間，並自動推薦最佳出貨點。",
    "demo12.stockLabel":"件庫存","demo12.save":"調貨成本下降 30%",
    "demo13.title":"業務診斷 + 方案配對","demo13.desc":"三步填寫資料，即時生成屬於您的業務診斷報告與量身打造的自動化方案。",
    "demo13.tabLabel":"業務診斷","demo13.tag":"建議先試","demo13.save":"60 秒取得專屬方案",
    "demo13.s1.label":"公司資料","demo13.s2.label":"痛點","demo13.s3.label":"自動化方案",
    "demo13.s1.title":"請告訴我們您的公司","demo13.s1.sub":"3 項基本資料，30 秒完成。",
    "demo13.s2.title":"您目前最大的挑戰是甚麼？","demo13.s2.sub":"最多選 3 項 — 系統將根據您選的痛點推薦最適合的方案。",
    "demo13.l1":"公司名稱","demo13.l2":"行業","demo13.l3":"員工人數",
    "demo13.p1":"客戶跟進耗時、易遺漏","demo13.p2":"內容產出不夠快","demo13.p3":"報表 / 資料整理太耗時",
    "demo13.p4":"多倉庫 / 庫存管理混亂","demo13.p5":"客服回覆積壓","demo13.p6":"銷售跟進效率低",
    "demo13.p7":"翻譯 / 國際溝通慢","demo13.p8":"多語客戶評論未回",
    "demo13.btnNext":"下一步 →","demo13.btnBack":"← 上一步","demo13.btnGenerate":"生成方案 →",
    "demo13.thinkLabel":"正在分析您的業務、配對方案 …",
    "demo14.tabLabel":"倉庫 Dashboard","demo14.save":"即時可視化與智能警示",
    "demo14.title":"倉庫即時 Dashboard","demo14.desc":"多倉庫實時庫存、智能警示與行動推薦 — 一頁掌握倉儲健康。",
    "demo14.f1":"今日","demo14.f7":"7 日","demo14.f30":"30 日",
    "demo14.kpi1":"總庫存件數","demo14.kpi1d":"↓ 2.3% vs 上週",
    "demo14.kpi2":"今日出貨","demo14.kpi2d":"↑ 18% vs 平均",
    "demo14.kpi3":"低庫存 SKU","demo14.kpi3d":"3 項需補貨",
    "demo14.kpi4":"活躍倉庫","demo14.kpi4d":"北京倉離線",
    "demo14.chartTitle":"各倉庫庫存量（按 SKU 分組）",
    "demo14.sku1":"USB-C 轉接器","demo14.sku2":"無線耳機","demo14.sku3":"行動電源",
    "demo14.wh1":"香港倉","demo14.wh2":"台北倉","demo14.wh3":"廣州倉","demo14.wh4":"上海倉","demo14.wh5":"北京倉",
    "demo14.safety":"安全線 150",
    "demo14.alertsTitle":"即時智能警示","demo14.live":"LIVE",
    "demo14.recsTitle":"智能推薦行動","demo14.recsSub":"一鍵自動建立 n8n 工作流",
    "pain.eyebrow":"日常痛點",
    "pain.title1":"您現在是否有","pain.title2":"以下這些煩惱？",
    "pain.desc":"如果任何一項符合，您就是自動化系統最能受益的對象。",
    "pain.b1":"每日花數小時寫客戶跟進信，最終仍然遺漏部份客戶？","pain.b2":"每星期要產出社交內容，靈感卻一片空白？",
    "pain.b3":"客戶 WhatsApp 訊息回不過來，怕失去新客？","pain.b4":"月底為了報表加班至深夜？",
    "pain.b5":"幾個倉庫庫存對不上、出錯貨？","pain.b6":"外國客的評論與查詢，需要逐則翻譯？",
    "pain.b7":"會議重點寫到手酸，事後仍然遺漏細節？","pain.b8":"員工被重複工作困住，無法處理真正能帶來收入的工作？",
    "pain.tagline":"讓自動化系統為您處理這些工作 — 由今日開始。",
    "pain.cta":"免費分析我哪些工作可自動化","pain.cta2":"先看互動 Demo ↓",
    "pain.peyebrow":"為您度身配對",
    "pain.ptitle1":"我們已為您針對","pain.ptitle2":"配對方案",
    "pain.pdesc":"下方 demo 區只顯示對您行業最有用的工具 — 已為您篩選完成。",
    "pain.pcta":"即試方案 Demo","pain.pcta2":"預約免費諮詢",
    "fy.eyebrow":"為您而設","fy.title1":"最適合這類","fy.title2":"業務",
    "fy.sub":"如果您是以下其中一類，自動化系統可以即時為您節省時間與成本。",
    "ts.hk":"香港本地團隊","ts.personal":"為您度身設計的自動化工作流",
    "ts.demos":"14 個即時互動 Demo","ts.support":"30 日 Bug Fix 保固","ts.free":"免費 30 分鐘諮詢",
    "wf.eyebrow":"哪類業務最合適","wf.title1":"最適合這類","wf.title2":"業務",
    "wf.sub":"如果您是以下其中一類，自動化系統可以即時為您節省時間與成本。",
    "wf.c1.name":"診所 / 醫美","wf.c1.desc":"客戶預約、療程後跟進、漏客重訪自動化",
    "wf.c2.name":"中小企老闆","wf.c2.desc":"人手有限，但要兼顧行銷、客服與報表",
    "wf.c3.name":"初創 / Startup","wf.c3.desc":"以自動化工作流取代部分人手，控制成本並快速擴張",
    "wf.c4.name":"被重複工作困住的團隊","wf.c4.desc":"每日重複處理跟進信、資料輸入與報表",
    "demo.cta.title":"想為您的業務導入這類自動化工作流？","demo.cta.sub":"免費 30 分鐘諮詢，我們會為您的行業度身設計一套工作流。",
    "demo.cta.book":"預約免費諮詢","demo.cta.wa":"WhatsApp","demo.cta.tg":"Telegram",
    "wf2.eyebrow":"真實工作流",
    "wf2.title1":"我們實際","wf2.title2":"為客戶自動化的流程",
    "wf2.desc":"這些不是 Demo — 是我們已為客戶落地的真實自動化流程。每個都可在 2–4 週內接入您的業務。",
    "wf2.c1.title":"預約 · 提醒 · 漏客重訪",
    "wf2.c1.s1":"新預約自動發 WhatsApp 確認訊息",
    "wf2.c1.s2":"前 24 小時自動發送提醒",
    "wf2.c1.s3":"缺席客戶 24 小時內自動重新邀請",
    "wf2.c1.save":"每月節省 8 小時 · 漏客率下降 30%",
    "wf2.c2.title":"WhatsApp 訊息分流",
    "wf2.c2.s1":"新訊息即時分類為查詢 / 預約 / 投訴",
    "wf2.c2.s2":"常見問題自動回覆並附參考資料",
    "wf2.c2.s3":"複雜訊息轉真人並標記緊急程度",
    "wf2.c2.save":"客服回覆速度提升 5 倍",
    "wf2.c3.title":"客戶療程後跟進",
    "wf2.c3.s1":"療程後 24 小時自動發感謝訊息",
    "wf2.c3.s2":"7 日後邀請客戶評分與回饋",
    "wf2.c3.s3":"14 日後個人化續療建議與優惠",
    "wf2.c3.save":"復購率上升 25% · 員工零額外工時",
    "wf2.c4.title":"評論回覆自動草稿",
    "wf2.c4.s1":"即時偵測 Google / OpenRice 新評論",
    "wf2.c4.s2":"自動草擬 3 種語氣（正式 / 親切 / 致歉）",
    "wf2.c4.s3":"您一鍵 approve 即發送，省下草擬時間",
    "wf2.c4.save":"回覆評論時間下降 80%",
    "ba.eyebrow":"效果對比",
    "ba.title1":"同一日 ·","ba.title2":"兩種結果",
    "ba.desc":"同樣 12 個客戶查詢、3 個新預約、2 個評論待回。手動處理 vs 自動化系統的真實差別。",
    "ba.beforeLabel":"手動處理","ba.afterLabel":"自動化系統",
    "ba.bs1":"回覆昨晚 12 個 WhatsApp 查詢",
    "ba.bs2":"手動逐一發送預約確認",
    "ba.bs3":"午餐被新查詢訊息打斷",
    "ba.bs4":"手動寫提醒給明日客戶",
    "ba.bs5":"逐張整理今日預約記錄",
    "ba.bs6":"下班後再回 5 個未處理訊息",
    "ba.bTotalLabel":"花於重複客服","ba.bTotalNum":"約 5 小時",
    "ba.as1":"系統已自動回覆 10 個常見查詢",
    "ba.as2":"查看儀表板：2 個複雜訊息已標記",
    "ba.as3":"午餐安靜，自動提醒已批量發出",
    "ba.as4":"親自處理 1 個高價值客戶會議",
    "ba.as5":"系統已自動整理今日報表",
    "ba.as6":"準時下班",
    "ba.aTotalLabel":"回到真正帶來收入的工作","ba.aTotalNum":"+4 小時",
    "rf.eyebrow":"客戶實況",
    "rf.title1":"不是 demo —","rf.title2":"客戶真實畫面",
    "rf.desc":"以下為客戶實際每日見到的 WhatsApp 對話與後台儀表板示意圖（mockup）。每個行業會根據實際使用情境定制。",
    "rf.wa.inputHint":"輸入訊息",
    "rf.caption":"* 上述畫面為示意 mockup — 實際系統會根據您的品牌、流程與 KPI 度身定製。",
    "ls.v1":"47","ls.u1":"個","ls.l1":"已部署 workflow",
    "ls.v2":"380","ls.u2":"小時 / 月","ls.l2":"客戶累計節省工時",
    "ls.v3":"8","ls.u3":"秒","ls.l3":"AI 客服平均回應",
    "ls.v4":"84","ls.u4":"%","ls.l4":"重複工作自動化處理率",
    "ls.foot":"* 內部現有客戶系統運作中累計數據",
    "msc.text":"免費 30 分鐘 automation 檢查",
    "msc.wa":"WhatsApp","msc.waSub":"即時對話，1 分鐘回覆","msc.tg":"Telegram",
    "fab.ai":"AI 助手 · 即時解答","fab.aiTitle":"TBC AI 助手","fab.aiBook":"想深入傾？預約免費諮詢 →",
    "welcome.tagline":"幫團隊減少重複工作、減少漏單",
    "welcome.askIndustry":"您的公司屬於哪個行業？",
    "welcome.askName":"您的稱呼","welcome.optional":"（選填）",
    "welcome.enter":"進入網站 →","welcome.skip":"跳過 · 查看所有方案 →",
    "welcome.hint":"先選一個行業，AI 即時為您度身打造方案",
    "welcome.hintReady":"已為您配對好行業方案",
    "welcome.i1":"餐飲","welcome.i2":"零售 / 電商","welcome.i3":"專業服務","welcome.i4":"教育培訓",
    "welcome.i5":"科技 / SaaS","welcome.i6":"醫美 / 健康","welcome.i7":"物流 / 倉儲","welcome.i8":"創意 / 設計",
    "nav.reset":"重新診斷","nav.profileFallback":"行業",
    "pain.industryFallback":"以下痛點","stat.permonth":"/月",
    "demos.expand":"查看所有方案","demos.collapse":"只看相關方案",
    "impact.eyebrow":"實際做法 · 真實效益",
    "impact.title1":"六步走完 ·","impact.title2":"可量化的成果",
    "impact.desc":"透明的合作流程，每一步都有清晰 deliverables，落地後即時看到時間與成本的節省。",
    "impact.s1":"重複性工作 ↓","impact.s2":"平均每月節省","impact.s3":"內容產出速度","impact.s4":"不眠不休運作",
    "calc.title":"您能省下多少？立即試算",
    "calc.desc":"選擇您目前最花時間的領域，拉動週工時，立即看到月節省。",
    "calc.l1":"您的業務領域","calc.l2":"每週投入小時","calc.l3":"您的時薪估算",
    "calc.a1":"客戶跟進與郵件","calc.a2":"社交媒體 / 內容","calc.a3":"報表與資料彙整","calc.a4":"客服回覆","calc.a5":"資料研究",
    "calc.a6":"銷售跟進 / 業務開發","calc.a7":"會議紀要 / 行政紀錄","calc.a8":"多語翻譯","calc.a9":"評論回覆 / 聲譽管理","calc.a10":"SEO / 網站維護",
    "calc.hour":"小時","calc.perHour":"/小時","calc.month":"/ 月",
    "calc.resLabel":"每月可節省","calc.resSub":"這些時間可以用來：陪家人、開發新客戶、創造下一個產品。",
    "calc.equals":"≈","calc.cta":"為您打造這個方案",
    "about.eyebrow":"關於創辦人","about.title1":"由我親自打造","about.title2":"為您度身定做",
    "about.intro":"由 <strong>Grouper</strong> 親自打造 — 一位專注於幫中小企自動化重複性工作流程的 AI Creator。",
    "about.p1":"TBC Solutions 由 <strong>Grouper</strong> 一手創立，專注於 <strong>AI 自動化解決方案</strong>。我相信每一間企業都值得擁有屬於自己的智能系統，讓老闆與員工從繁瑣中解放，專注於真正重要的事。",
    "about.p2":"為甚麼我特別熱愛 AI 自動化？因為我親眼見過太多中小企老闆，被重複性工作困住，明明有更高價值的決策要做，卻被 email、報表、客戶跟進拖死。AI 不是要取代人，而是把人從機械工作中釋放出來，讓您專注真正屬於人的事 — 創造、判斷、建立關係。",
    "about.status":"目前接受新客戶合作邀請，協助企業落地 AI 系統與自動化工作流",
    "about.cta":"與我聊聊，免費",
    "about.role":"創辦人 · TBC Solutions",
    "about.stat1":"整合工具","about.stat2":"自動運作","about.stat3":"無限可能",
    "process.eyebrow":"合作流程",
    "process.title1":"六步走完，","process.title2":"從諮詢到交付",
    "process.desc":"透明的合作流程，每一步都有清晰的 deliverables 與時程。",
    "process.s1.tag":"第一步","process.s1.title":"免費諮詢",
    "process.s1.desc":"30 分鐘 Cal.com 視訊，了解您的業務目標、現有系統、痛點。我們會誠實判斷 AI 適不適合您。",
    "process.s1.meta":"1 天內可預約",
    "process.s2.tag":"第二步","process.s2.title":"方案 + 報價",
    "process.s2.desc":"24–48 小時內收到書面方案：包含技術選型、工作流程圖、時程表、明細報價。您決定才收費。",
    "process.s2.meta":"諮詢後 48 小時",
    "process.s3.tag":"第三步","process.s3.title":"啟動專案",
    "process.s3.desc":"簽約後即刻 kickoff：釐清成功指標（KPIs）、開設共享 Notion 看板、訂下每週進度滙報節奏。",
    "process.s3.meta":"簽約後 3 天",
    "process.s4.tag":"第四步","process.s4.title":"開發 + 測試",
    "process.s4.desc":"系統建設、模組整合、自動化流程編寫。每週展示進度，邀請您試用 + 即時回饋調整。",
    "process.s4.meta":"1–6 週（視 scope）",
    "process.s5.tag":"第五步","process.s5.title":"培訓 + 上線",
    "process.s5.desc":"完整文件、操作 SOP、登入資料、流程圖一次過交接。1–2 小時遠端培訓您的團隊正式接手。",
    "process.s5.meta":"上線前 1 週",
    "process.s6.tag":"第六步","process.s6.title":"持續支援",
    "process.s6.desc":"30 天免費 bug 修正期 + KPI 追蹤檢視。後續可選月度 maintenance plan，或按需呼叫支援。",
    "process.s6.meta":"30 天保固期",
    "faq.eyebrow":"常見問題",
    "faq.title1":"你最想問的，","faq.title2":"我們先答",
    "faq.desc":"合作之前你會想到的疑問，我們已經幫你準備好。",
    "faq.q1":"我沒技術背景／公司不大，可以用嗎？",
    "faq.a1":"完全可以。我們會根據您的實際業務需求做完整方案：包括選工具、做 setup、寫工作流、培訓員工。您只需要告訴我們業務目標。其實 AI 自動化最大的紅利往往在小團隊 — 一個 5 人公司每月省下 30 小時，已經抵掉成本好多倍。",
    "faq.q2":"收費如何計算？有沒套餐？",
    "faq.a2":"我們按專案 scope 報價，不收隱藏費用。簡單自動化（如 email 跟進、表單同步）由 HK$ 3,000 起；網站 + AI 內容系統約 HK$ 15,000–30,000；客製化 AI 解決方案視乎複雜度由 HK$ 30,000 起。先免費諮詢了解需求，再給您詳細 quote — 您決定先收費。",
    "faq.q3":"一個 Project 通常要做多久？",
    "faq.a3":"簡單自動化通常 1–2 週；網站 + 內容系統 3–4 週；客製化 AI 解決方案 4–8 週。每個 project 開始前都會給您完整 timeline + 階段性 deliverables，每週滙報進度，您隨時可以提意見。",
    "faq.q4":"預約諮詢真的免費？會 hard sell 嗎？",
    "faq.a4":"30 分鐘免費諮詢沒隱藏條件，亦沒強制購買。我們會誠實了解您的業務、判斷 AI 適不適合您。如果您覺得方案不適合、或者預算未到，我們會直接告訴您，並提供其他建議 — 而不是打 hard sell 電話。",
    "faq.q5":"我的資料和 API Key 安不安全？",
    "faq.a5":"所有 API Key 和密碼存在後端環境變數（Vercel / Netlify 的 secret store），不會出現在前端代碼或 GitHub 公開 repo。客戶資料只儲存在您指定的平台（您的 Notion / Airtable / 自家 server），我們本身不保留任何客戶資料。可以簽 NDA 和保密協議。",
    "faq.q6":"完成後我自己可以維護嗎？",
    "faq.a6":"可以。我們會做完整文件 + handover 培訓 — 將所有登入資料、流程圖、運作邏輯、操作 SOP 都交給您。如果您之後想我們繼續支援，可以選月度 maintenance plan（小事優先處理 + 系統健康監察），或者按次叫 support。",
    "faq.q7":"如果做完沒效果怎麼辦？",
    "faq.a7":"我們每個 project 在 kickoff 時都會釐清成功指標（例如：每月節省 X 小時、回覆速度提升 Y%、訂單轉換率上升 Z%）。如果交付的系統未達標，我們會免費修正直至達標。我們對自己的 deliverables 有信心。",
    "faq.q8":"適合哪些行業？",
    "faq.a8":"我們合作過的行業包括：餐飲、零售電商、教育培訓、專業服務（律師 / 會計 / 顧問）、創意工作室、地產、醫美、SaaS 初創。任何有重複性流程、客戶溝通量大、或需要批量產出內容的業務，都是 AI 可以發揮作用的領域。",
    "faq.q9":"如果找不到與我相關的領域呢？",
    "faq.a9":"完全沒問題！這個網站列出的只是常見行業 — AI 自動化的應用範圍其實遠遠不止這幾個。每個業務都有獨特的流程、痛點和自動化機會，最直接的做法是 <a href=\"#book\" class=\"faq-link\">立即預約一個 30 分鐘免費諮詢</a>，我們一起討論您的情況，看看有沒有合作的可能性。即使最後我們認為 AI 對您的公司還未到最佳時機，我們也會誠實告訴您，絕不會 hard sell。",
    "faq.ctaText":"還有其他問題？最快的方法是直接談。",
    "faq.ctaBtn":"免費諮詢 30 分鐘 →",
    "book.eyebrow":"預約諮詢","book.title1":"準備好了嗎？","book.title2":"預約免費諮詢",
    "book.desc":"30 分鐘的免費諮詢，我們會了解您的業務需求，並提供量身訂製的 AI 自動化建議。",
    "book.altText":"或直接電郵聯絡：",
    "book.loading":"正在載入預約日曆 …",
    "book.fallback1":"Cal.com 預約 widget 預留位置",
    "book.fallback2":"請在原始碼中找到 <code>YOUR_CAL_LINK_HERE</code> 並換成您的 Cal.com 連結，例如：",
    "book.fallback3":"或可直接點擊下方按鈕傳送 Email：",
  },
  en:{
    "nav.services":"Services","nav.demos":"Demos","nav.impact":"Impact","nav.about":"About","nav.process":"Process","nav.faq":"FAQ","nav.book":"Book",
    "hero.eyebrow":"AUTOMATION · BOOKING · FOLLOW-UP",
    "hero.title":["Hand the busywork","off to a system"],
    "hero.typing":["Automated follow-ups and booking reminders","Websites and content built to convert","Transform · Build · Create"],
    "hero.cta":"Free audit: what we'd automate first","hero.cta2":"Try Live Demo ↓","hero.scroll":"SCROLL",
    "hero.descriptor":"Hand client follow-ups, booking reminders and reporting off to an automated system — so you and your team focus on revenue, not busywork.",
    "tools.label":"POWERED WITH",
    "services.eyebrow":"SERVICES",
    "services.title1":"Build the","services.title2":"intelligent business",
    "services.desc":"From workflow automation to content generation, we deliver end-to-end solutions so you and your team focus on what really matters.",
    "services.tag1":"AUTOMATION","services.tag2":"WEB","services.tag3":"CONTENT","services.tag4":"CUSTOM AI",
    "services.s1.title":"AI Workflow Automation",
    "services.s1.desc":"Wire your tools together with n8n, Make and Zapier — emails, CRM, sync, reports, all on autopilot.",
    "services.s2.title":"Web Design & Development",
    "services.s2.desc":"From brand sites to e-commerce — modern, responsive, SEO-friendly websites built to convert.",
    "services.s3.title":"AI Content Creation",
    "services.s3.desc":"Generate social posts, blogs, product copy and ad creatives at scale with Claude / ChatGPT.",
    "services.s4.title":"Custom AI Solutions",
    "services.s4.desc":"Tailored AI assistants, knowledge bases, smart support and decision-support systems for your business.",
    "demos.eyebrow":"INTERACTIVE DEMOS","demos.counterLabel":"DEMOS",
    "demos.title1":"Don't read about it —","demos.title2":"try it",
    "demos.desc":"14 live examples right on this page. No download, no signup. Switch via tabs above or arrows.",
    "demo1.title":"Workflow Breakdown Tool","demo1.desc":"Type a business problem and the tool breaks it into an executable workflow tailored for you.",
    "demo1.label":"Your business problem","demo1.btn":"Break it down →","demo1.save":"Saves 25 hrs / month",
    "demo1.placeholder":"Type your problem and workflow nodes will appear live.",
    "demo2.title":"Customer Chat Assistant","demo2.desc":"Live online assistant — fits as customer support, advisor, or internal knowledge helper.",
    "demo2.greet":"Hi! I'm TBC Solutions' online assistant. Ask me anything about our services, workflow automation or web development.",
    "demo2.send":"Send","demo2.save":"Saves 40 hrs / month",
    "demo3.title":"Website Generator Preview","demo3.desc":"Enter a company name and industry — instantly preview a tagline, hero, and three service cards.",
    "demo3.l1":"Company name","demo3.l2":"Industry","demo3.btn":"Generate preview →","demo3.empty":"Fill in the form to render a preview","demo3.save":"80% faster to launch",
    "demo4.title":"Social Content Drafts","demo4.desc":"Pick a platform and topic — get ready-to-post social copy that matches each platform's style.",
    "demo4.l1":"Choose a platform","demo4.l2":"Topic / Product","demo4.btn":"Generate copy →","demo4.empty":"Your copy will appear here…","demo4.save":"5× faster output",
    "demo5.title":"Customer Intent Analysis","demo5.desc":"Paste a customer message — the tool scores urgency, mood, category and drafts a reply.",
    "demo5.label":"Customer message","demo5.btn":"Analyse message →","demo5.save":"3× support efficiency",
    "demo5.urgency":"Urgency","demo5.mood":"Mood","demo5.category":"Category",
    "demo5.reply":"Suggested reply","demo5.replyEmpty":"A tailored reply will appear here after analysis…",
    "demo6.title":"Sales Follow-up Draft","demo6.desc":"Drop in client info and the last interaction — a personalised follow-up email is drafted instantly.",
    "demo6.l1":"Client name","demo6.l2":"Company / Industry","demo6.l3":"Last interaction","demo6.btn":"Draft email →",
    "demo6.from":"From:","demo6.to":"To:","demo6.subject":"Subject:","demo6.empty":"Fill the form on the left and a follow-up will be drafted.","demo6.save":"2× conversion rate",
    "demo7.title":"Meeting Summary","demo7.desc":"Paste meeting notes or transcripts — summary, action items and key decisions are extracted automatically.",
    "demo7.label":"Meeting content","demo7.btn":"Summarise →","demo7.save":"10× faster notes",
    "demo7.summary":"Summary","demo7.empty":"Summary, action items and key decisions will appear here.",
    "demo8.title":"Translation (with tone & cultural notes)","demo8.desc":"More than translation — tone and cultural nuance are adapted to your target audience.",
    "demo8.label":"Source text","demo8.langLabel":"Target language","demo8.toneLabel":"Tone",
    "demo8.toneFormal":"Formal","demo8.toneCasual":"Casual","demo8.toneFriendly":"Friendly",
    "demo8.btn":"Translate →","demo8.empty":"Translation will appear here…","demo8.save":"30+ languages",
    "demo9.title":"Review Reply Drafts","demo9.desc":"Paste a Google / TripAdvisor / Yelp review — 3 reply styles drafted for you to pick.",
    "demo9.label":"Customer review","demo9.bizLabel":"Your business type","demo9.btn":"Generate 3 replies →",
    "demo9.empty":"3 reply styles will be drafted","demo9.emptyText":"— Formal & professional / Warm & friendly / Sincerely apologetic (or grateful) —","demo9.save":"30 sec per reply",
    "demo10.title":"SEO Title Suggestions","demo10.desc":"Type your topic and keyword — 5 SEO-friendly, click-worthy titles generated instantly.",
    "demo10.l1":"Page topic","demo10.l2":"Primary keyword","demo10.btn":"Generate 5 titles →",
    "demo10.empty":"5 SEO titles will appear here","demo10.emptyText":"— Each takes a different angle + click-attractiveness score —","demo10.save":"+40% traffic avg",
    "demo11.title":"E-commerce Product Copy","demo11.desc":"Type product name and features — a complete product description is written for you.",
    "demo11.l1":"Product name","demo11.l2":"Key features / selling points","demo11.btn":"Write copy →",
    "demo11.empty":"Product copy will appear here…","demo11.save":"+25% conversion",
    "demo12.title":"Warehouse Smart Routing","demo12.desc":"Drop in a SKU and quantity — live stock checked across warehouses, with the best fulfilment point recommended automatically and restock alerts.",
    "demo12.l1":"Product SKU / Name","demo12.l2":"Order quantity","demo12.btn":"Route order →",
    "demo12.empty":"Enter SKU and quantity →","demo12.emptyText":"Live stock, shipping cost and ETA across three warehouses will be shown, with the best fulfilment point auto-recommended.",
    "demo12.stockLabel":"IN STOCK","demo12.save":"−30% fulfilment cost",
    "demo13.title":"Business Diagnosis + Solution Match","demo13.desc":"3-step form — instantly get a personalised business diagnosis and a tailored automation roadmap.",
    "demo13.tabLabel":"Diagnosis","demo13.tag":"Start here","demo13.save":"Personalised plan in 60s",
    "demo13.s1.label":"Company","demo13.s2.label":"Pain points","demo13.s3.label":"Your plan",
    "demo13.s1.title":"Tell us about your company","demo13.s1.sub":"3 quick fields, 30 seconds.",
    "demo13.s2.title":"What's eating your time the most?","demo13.s2.sub":"Pick up to 3 — the best-fit solutions will be matched based on what you choose.",
    "demo13.l1":"Company name","demo13.l2":"Industry","demo13.l3":"Team size",
    "demo13.p1":"Customer follow-up is slow and leaky","demo13.p2":"Content production isn't fast enough","demo13.p3":"Reporting / data ops take too long",
    "demo13.p4":"Multi-warehouse / inventory chaos","demo13.p5":"Customer support backlog","demo13.p6":"Sales follow-up is inefficient",
    "demo13.p7":"Translation / cross-border comms","demo13.p8":"Multi-language reviews piling up",
    "demo13.btnNext":"Next →","demo13.btnBack":"← Back","demo13.btnGenerate":"Generate plan →",
    "demo13.thinkLabel":"Analysing your business and matching solutions…",
    "demo14.tabLabel":"Warehouse Dashboard","demo14.save":"Live visibility + smart alerts",
    "demo14.title":"Real-time Warehouse Dashboard","demo14.desc":"Multi-warehouse live inventory, smart alerts and recommended actions — entire stock health on one page.",
    "demo14.f1":"Today","demo14.f7":"7 days","demo14.f30":"30 days",
    "demo14.kpi1":"Total stock units","demo14.kpi1d":"↓ 2.3% vs last week",
    "demo14.kpi2":"Shipped today","demo14.kpi2d":"↑ 18% vs avg",
    "demo14.kpi3":"Low stock SKUs","demo14.kpi3d":"3 to restock",
    "demo14.kpi4":"Active warehouses","demo14.kpi4d":"Beijing offline",
    "demo14.chartTitle":"Stock by warehouse (grouped by SKU)",
    "demo14.sku1":"USB-C adapter","demo14.sku2":"Wireless headphones","demo14.sku3":"Power bank",
    "demo14.wh1":"HK","demo14.wh2":"Taipei","demo14.wh3":"Guangzhou","demo14.wh4":"Shanghai","demo14.wh5":"Beijing",
    "demo14.safety":"Safety line 150",
    "demo14.alertsTitle":"Real-time Smart Alerts","demo14.live":"LIVE",
    "demo14.recsTitle":"Recommended Actions","demo14.recsSub":"One-click n8n workflow setup",
    "pain.eyebrow":"YOUR DAILY PAIN",
    "pain.title1":"Are you facing","pain.title2":"any of these problems?",
    "pain.desc":"If any of these hit home, automation is built for you.",
    "pain.b1":"Spending hours writing client follow-ups — and still missing some?","pain.b2":"Weekly social content due, with no idea where to start?",
    "pain.b3":"WhatsApp messages piling up, afraid of losing new customers?","pain.b4":"Stuck till midnight every month-end on reports?",
    "pain.b5":"Stock mismatch across warehouses, shipping wrong items?","pain.b6":"Foreign customer reviews and inquiries piling up untranslated?",
    "pain.b7":"Hand-cramping meeting notes — and still missing key points?","pain.b8":"Team drowning in repetitive admin, no time for real revenue work?",
    "pain.tagline":"Let an automated system handle all of this — starting today.",
    "pain.cta":"Free audit: what I'd automate first","pain.cta2":"See Live Demo ↓",
    "pain.peyebrow":"PERSONALISED FOR YOU",
    "pain.ptitle1":"We've matched solutions for","pain.ptitle2":"",
    "pain.pdesc":"The demos below only show tools most useful for your industry — already filtered.",
    "pain.pcta":"Try Live Demo","pain.pcta2":"Book Free Consultation",
    "fy.eyebrow":"BUILT FOR YOU","fy.title1":"Built for","fy.title2":"businesses like yours",
    "fy.sub":"If you fit any of these, an automated system can save you time and money — starting today.",
    "ts.hk":"Hong Kong Based","ts.personal":"Workflows tailored for you",
    "ts.demos":"14 Live Interactive Demos","ts.support":"30-Day Bug Fix Included","ts.free":"Free 30-min Consultation",
    "wf.eyebrow":"WHO THIS IS FOR","wf.title1":"Built for","wf.title2":"businesses like yours",
    "wf.sub":"If you fit any of these, an automated system can save you time and money — starting today.",
    "wf.c1.name":"Clinics / Aesthetics","wf.c1.desc":"Automated bookings, post-treatment follow-ups, no-show prevention and rebooking outreach",
    "wf.c2.name":"SMB Owners","wf.c2.desc":"Small team, but still need to cover marketing, support and reports",
    "wf.c3.name":"Startups","wf.c3.desc":"Replace headcount with automated workflows — scale lean and fast",
    "wf.c4.name":"Teams drowning in repetitive work","wf.c4.desc":"Daily follow-up emails, data entry and reporting",
    "demo.cta.title":"Want this automation workflow for your business?","demo.cta.sub":"Book a free 30-min consultation — we'll tailor a workflow for your industry.",
    "demo.cta.book":"Book Free Consultation","demo.cta.wa":"WhatsApp","demo.cta.tg":"Telegram",
    "wf2.eyebrow":"REAL WORKFLOWS",
    "wf2.title1":"Workflows we've actually","wf2.title2":"automated for clients",
    "wf2.desc":"Not demos — real automation flows we've shipped for clients. Each one can plug into your business in 2–4 weeks.",
    "wf2.c1.title":"Booking · Reminder · No-show recovery",
    "wf2.c1.s1":"New booking auto-sends a WhatsApp confirmation",
    "wf2.c1.s2":"Reminder fires 24 hours before the appointment",
    "wf2.c1.s3":"No-shows get an auto re-invite within 24 hours",
    "wf2.c1.save":"Saves 8 hrs / month · −30% no-show rate",
    "wf2.c2.title":"WhatsApp message triage",
    "wf2.c2.s1":"New messages instantly classified — enquiry / booking / complaint",
    "wf2.c2.s2":"Common questions get an auto-reply with reference links",
    "wf2.c2.s3":"Complex messages route to a human with urgency tagged",
    "wf2.c2.save":"5× faster reply time",
    "wf2.c3.title":"Post-treatment client follow-up",
    "wf2.c3.s1":"Thank-you message 24 hrs after treatment",
    "wf2.c3.s2":"Day 7: invite client to leave a review",
    "wf2.c3.s3":"Day 14: personalised rebooking suggestion with offer",
    "wf2.c3.save":"+25% repeat rate · zero extra staff hours",
    "wf2.c4.title":"Auto-drafted review replies",
    "wf2.c4.s1":"New Google / OpenRice reviews detected instantly",
    "wf2.c4.s2":"3 reply styles auto-drafted (formal / warm / apologetic)",
    "wf2.c4.s3":"You one-click approve and send — no more drafting from scratch",
    "wf2.c4.save":"−80% time spent on review replies",
    "ba.eyebrow":"BEFORE · AFTER",
    "ba.title1":"Same day ·","ba.title2":"two outcomes",
    "ba.desc":"Same 12 WhatsApp enquiries, 3 new bookings, 2 reviews to reply. Manual vs automated — the real difference.",
    "ba.beforeLabel":"Manual","ba.afterLabel":"Automated",
    "ba.bs1":"Reply to 12 WhatsApp enquiries from last night",
    "ba.bs2":"Manually send each booking confirmation",
    "ba.bs3":"Lunch interrupted by new enquiry pings",
    "ba.bs4":"Hand-write reminders for tomorrow's clients",
    "ba.bs5":"Compile today's booking records by hand",
    "ba.bs6":"After hours: reply to 5 messages you missed",
    "ba.bTotalLabel":"Lost to repetitive support","ba.bTotalNum":"≈ 5 hours",
    "ba.as1":"System has auto-replied to 10 common enquiries",
    "ba.as2":"Check dashboard: 2 complex messages flagged",
    "ba.as3":"Quiet lunch — auto-reminders already sent",
    "ba.as4":"Take 1 high-value client meeting in person",
    "ba.as5":"System has auto-compiled today's report",
    "ba.as6":"Clock off on time",
    "ba.aTotalLabel":"Back to revenue-driving work","ba.aTotalNum":"+4 hours",
    "rf.eyebrow":"REAL SCREENS",
    "rf.title1":"Not a demo —","rf.title2":"what your clients actually see",
    "rf.desc":"Below: the WhatsApp conversations and admin dashboards your clients and team actually see day-to-day (mockup). Each industry is tuned to its real usage scenario.",
    "rf.wa.inputHint":"Type a message",
    "rf.caption":"* These are illustrative mockups — the real system is tailored to your brand, flow and KPIs.",
    "ls.v1":"47","ls.u1":"deployed","ls.l1":"Workflows in production",
    "ls.v2":"380","ls.u2":"hrs / month","ls.l2":"Client hours saved (aggregate)",
    "ls.v3":"8","ls.u3":"sec","ls.l3":"Average AI reply time",
    "ls.v4":"84","ls.u4":"%","ls.l4":"Repetitive work auto-handled",
    "ls.foot":"* Aggregated across currently running client systems.",
    "msc.text":"Free 30-min automation audit",
    "msc.wa":"WhatsApp","msc.waSub":"Quick chat, 1-min reply","msc.tg":"Telegram",
    "fab.ai":"AI assistant · instant answers","fab.aiTitle":"TBC AI Assistant","fab.aiBook":"Want to go deeper? Book a free call →",
    "welcome.tagline":"Less repetitive work, fewer dropped leads",
    "welcome.askIndustry":"What industry are you in?",
    "welcome.askName":"What should we call you?","welcome.optional":"(optional)",
    "welcome.enter":"Enter site →","welcome.skip":"Skip · browse all solutions →",
    "welcome.hint":"Pick an industry — AI matches solutions instantly",
    "welcome.hintReady":"Solutions matched for your industry",
    "welcome.i1":"F&B","welcome.i2":"Retail / e-commerce","welcome.i3":"Professional services","welcome.i4":"Education",
    "welcome.i5":"Tech / SaaS","welcome.i6":"Medical / Wellness","welcome.i7":"Logistics","welcome.i8":"Creative / Design",
    "nav.reset":"Re-diagnose","nav.profileFallback":"Industry",
    "pain.industryFallback":"your pain points","stat.permonth":"/mo",
    "demos.expand":"See all solutions","demos.collapse":"Show relevant only",
    "impact.eyebrow":"HOW WE DELIVER · REAL IMPACT",
    "impact.title1":"Six steps to","impact.title2":"measurable savings.",
    "impact.desc":"Transparent six-step process with clear deliverables — landing measurable time + cost savings.",
    "impact.s1":"Less repetitive work","impact.s2":"Hours saved / month","impact.s3":"Faster content output","impact.s4":"Always on",
    "calc.title":"How much could you save? Try it.",
    "calc.desc":"Pick the area eating your time, drag the weekly hours — see your monthly savings instantly.",
    "calc.l1":"Your area of work","calc.l2":"Hours per week","calc.l3":"Your estimated hourly rate",
    "calc.a1":"Customer follow-up & email","calc.a2":"Social / content","calc.a3":"Reports & data ops","calc.a4":"Customer support","calc.a5":"Research",
    "calc.a6":"Sales / biz development","calc.a7":"Meeting notes / admin","calc.a8":"Multi-language translation","calc.a9":"Review replies / reputation","calc.a10":"SEO / website upkeep",
    "calc.hour":"hrs","calc.perHour":"/ hr","calc.month":"/ month",
    "calc.resLabel":"Saved every month","calc.resSub":"Use that time for: family, new clients, building the next thing.",
    "calc.equals":"≈","calc.cta":"Build this for me",
    "about.eyebrow":"ABOUT THE FOUNDER","about.title1":"Built by hand","about.title2":"tailored for you",
    "about.intro":"Built by <strong>Grouper</strong> — an AI creator focused on helping small &amp; medium businesses automate repetitive workflows.",
    "about.p1":"TBC Solutions was founded by <strong>Grouper</strong>, focused on <strong>AI automation solutions</strong>. I believe every business deserves its own intelligent system — freeing owners and staff from busywork so they can focus on what truly matters.",
    "about.p2":"Why am I obsessed with AI automation? Because I've watched too many SME owners get crushed by repetitive work — they have high-value decisions to make, but they're dragged down by email, reports, and follow-ups. AI isn't here to replace people; it's here to free people from the mechanical so we can do what's truly human — create, judge, build relationships.",
    "about.status":"Now taking on new clients — deploying AI systems and automated workflows for businesses",
    "about.cta":"Talk to me, free",
    "about.role":"FOUNDER · TBC Solutions",
    "about.stat1":"Tools integrated","about.stat2":"Always-on","about.stat3":"Possibilities",
    "process.eyebrow":"PROCESS",
    "process.title1":"Six steps,","process.title2":"from call to delivery",
    "process.desc":"Transparent collaboration — clear deliverables and timelines at every step.",
    "process.s1.tag":"Step 1","process.s1.title":"Free consultation",
    "process.s1.desc":"30-minute Cal.com call to understand your goals, current systems and pain points. We'll honestly tell you whether AI fits.",
    "process.s1.meta":"Bookable within 1 day",
    "process.s2.tag":"Step 2","process.s2.title":"Proposal + quote",
    "process.s2.desc":"Within 24–48 hours: written proposal with tech stack, workflow diagrams, timeline, line-item pricing. You only pay after you decide.",
    "process.s2.meta":"48 hrs after consultation",
    "process.s3.tag":"Step 3","process.s3.title":"Project kickoff",
    "process.s3.desc":"Right after signing: define KPIs, set up shared Notion board, agree weekly cadence for progress reports.",
    "process.s3.meta":"3 days after signing",
    "process.s4.tag":"Step 4","process.s4.title":"Build + test",
    "process.s4.desc":"System build, module integration, workflow scripting. Weekly demo and your hands-on testing — feedback baked in continuously.",
    "process.s4.meta":"1–6 weeks (depends on scope)",
    "process.s5.tag":"Step 5","process.s5.title":"Training + launch",
    "process.s5.desc":"Complete docs, SOPs, credentials and flow charts handed over. 1–2 hour remote training to make your team self-sufficient.",
    "process.s5.meta":"1 week before launch",
    "process.s6.tag":"Step 6","process.s6.title":"Ongoing support",
    "process.s6.desc":"30-day free bug-fix + KPI review. Optional monthly maintenance plan, or pay-as-you-go support afterwards.",
    "process.s6.meta":"30-day warranty",
    "faq.eyebrow":"FAQ",
    "faq.title1":"What you'd ask first —","faq.title2":"answered upfront",
    "faq.desc":"The questions you'd raise before working with us. We've answered them already.",
    "faq.q1":"I have no tech background / my company isn't big — can I still use this?",
    "faq.a1":"Absolutely. We deliver end-to-end: tool selection, setup, workflow design, staff training. You only need to share your business goals. In fact, AI automation often pays off most for small teams — a 5-person company saving 30 hours a month covers our cost many times over.",
    "faq.q2":"How is pricing structured? Are there packages?",
    "faq.a2":"We quote per project scope — no hidden fees. Simple automation (e.g., email follow-ups, form sync) starts at HK$ 3,000; website + AI content systems run HK$ 15,000–30,000; custom AI solutions start at HK$ 30,000 depending on complexity. We give you a free consultation first, then a detailed quote — you only pay after you decide.",
    "faq.q3":"How long does a project usually take?",
    "faq.a3":"Simple automation: 1–2 weeks. Website + content systems: 3–4 weeks. Custom AI solutions: 4–8 weeks. Each project starts with a full timeline and milestone deliverables, with weekly progress reports.",
    "faq.q4":"Is the consultation really free? Will you hard-sell?",
    "faq.a4":"The 30-minute consultation is genuinely free, no strings attached. We'll honestly assess your business and tell you whether AI fits. If the solution isn't right for you, or your budget isn't there yet, we'll say so directly and suggest alternatives — not push for a sale.",
    "faq.q5":"Are my data and API keys safe?",
    "faq.a5":"All API keys and secrets live in backend environment variables (Vercel / Netlify secret store) — they never appear in frontend code or public GitHub repos. Customer data only lives in platforms you specify (your Notion / Airtable / own server); we don't retain any client data ourselves. NDAs and confidentiality agreements available.",
    "faq.q6":"Can I maintain it myself after delivery?",
    "faq.a6":"Yes. We provide complete documentation + handover training — credentials, flow diagrams, operational logic, and SOPs all transferred to you. If you'd rather we handle ongoing support, choose a monthly maintenance plan (priority handling + system health monitoring) or pay-as-you-go.",
    "faq.q7":"What if it doesn't work?",
    "faq.a7":"Every project has clear success metrics defined at kickoff (e.g., X hours saved monthly, Y% faster response, Z% conversion lift). If delivery doesn't meet those metrics, we fix it free until it does. We back our work.",
    "faq.q9":"My industry isn't on your list. Can you still help?",
    "faq.a9":"Absolutely. The industries we list are just common ones — AI automation goes far beyond. Every business has unique processes, pain points and automation opportunities. The most direct way to find out: <a href=\"#book\" class=\"faq-link\">book a free 30-minute chat</a> and we'll talk through your situation and see if there's a fit. Even if we feel AI isn't the right move for you yet, we'll tell you honestly — no hard sell.",
    "faq.q8":"Which industries do you work with?",
    "faq.a8":"We've worked across F&B, retail / e-commerce, education, professional services (legal / accounting / consulting), creative studios, real estate, aesthetics, and SaaS startups. Any business with repetitive workflows, high customer-message volume, or content-at-scale needs is a fit for AI.",
    "faq.ctaText":"Got more questions? Quickest way is to talk.",
    "faq.ctaBtn":"Free 30-minute consultation →",
    "book.eyebrow":"BOOK A CALL","book.title1":"Ready?","book.title2":"Book a free consultation",
    "book.desc":"A free 30-minute call to understand your needs and propose tailored AI-automation ideas.",
    "book.altText":"Or email directly:",
    "book.loading":"Loading booking calendar …",
    "book.fallback1":"Cal.com booking widget placeholder",
    "book.fallback2":"Find <code>YOUR_CAL_LINK_HERE</code> in the source and replace it with your Cal.com link, e.g.:",
    "book.fallback3":"Or just send us an email:",
  }
};

// All input/textarea placeholders, keyed by element id, per language.
// Updated together with applyLang() so the EN version never leaks Chinese.
const PLACEHOLDERS = {
  zh: {
    "wf-input":      "例如：我想自動發送跟進郵件給 7 天未回覆的客戶",
    "chat-input":    "輸入您的問題…",
    "wg-name":       "例如：晨光咖啡",
    "wg-industry":   "例如：餐飲 / 科技 / 教育",
    "cg-topic":      "例如：宣傳全新推出的咖啡訂閱方案，目標客群是上班族",
    "ia-input":      "例：我訂單已經 7 日仍未收到，再不送到我會投訴！",
    "se-name":       "例：陳先生",
    "se-company":    "例：晨光咖啡 / 餐飲",
    "se-context":    "例：上週談過 AI 自動點餐系統，客戶有興趣但尚未決定",
    "ms-input":      "貼入會議錄音轉文字 / 會議筆記原文…",
    "tr-input":      "輸入要翻譯的句子或段落…",
    "rv-input":      "貼入客戶評論原文…",
    "rv-business":   "例：餐廳、酒店、零售、診所",
    "seo-topic":     "例：企業數位轉型策略指南",
    "seo-keyword":   "例：AI 自動化、digital transformation",
    "pc-name":       "例：極簡陶瓷咖啡杯",
    "pc-features":   "例：手作陶瓷、3 色可選、保溫 4 小時、可進微波爐",
  },
  en: {
    "wf-input":      "e.g., Send follow-up emails automatically to clients who haven't replied in 7 days",
    "chat-input":    "Type your question…",
    "wg-name":       "e.g., Morning Light Coffee",
    "wg-industry":   "e.g., F&B / Tech / Education",
    "cg-topic":      "e.g., Promote our new coffee subscription targeting office workers",
    "ia-input":      "e.g., My order is 7 days late and STILL not here. Filing a complaint!",
    "se-name":       "e.g., Mr. Chan",
    "se-company":    "e.g., Morning Light / F&B",
    "se-context":    "e.g., Discussed AI ordering system last week — interested but undecided",
    "ms-input":      "Paste meeting transcript / notes…",
    "tr-input":      "Enter the sentence or paragraph to translate…",
    "rv-input":      "Paste the customer review…",
    "rv-business":   "e.g., Restaurant, hotel, retail, clinic",
    "seo-topic":     "e.g., Enterprise digital transformation strategy",
    "seo-keyword":   "e.g., AI automation, digital transformation",
    "pc-name":       "e.g., Minimalist ceramic coffee mug",
    "pc-features":   "e.g., Hand-thrown ceramic, 3 colours, 4-hr heat retention, microwave-safe",
  },
};

let currentLang = "zh";

/* Reset every demo's UI back to its empty/default state.
   Called when the user toggles language so that already-rendered demo
   output (which has no data-i18n) doesn't stay stuck in the old language. */
function resetAllDemos(){
  // Clear all input / textarea values
  ["wf-input","chat-input","wg-name","wg-industry","cg-topic","ia-input",
   "se-name","se-company","se-context","ms-input","tr-input","rv-input",
   "rv-business","seo-topic","seo-keyword","pc-name","pc-features",
   "wh-sku","wh-qty"]
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });

  const i18n = I18N[currentLang] || {};
  const txt  = (k, fb="") => (typeof i18n[k] === "string" ? i18n[k] : fb);

  // Demo 1 — workflow
  const wfDyn = document.getElementById("wf-dynamic");
  if(wfDyn){
    wfDyn.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-dim);font-size:13.5px"><div style="font-size:42px;margin-bottom:10px"></div><div data-i18n="demo1.placeholder">${txt("demo1.placeholder")}</div></div>`;
  }
  document.getElementById("wf-result")?.classList.remove("show");

  // Demo 2 — chat (keep only greeting)
  const chatMsgs = document.getElementById("chat-msgs");
  if(chatMsgs){
    chatMsgs.innerHTML = `<div class="chat-msg bot" data-i18n="demo2.greet">${txt("demo2.greet")}</div>`;
  }
  // also clear chat history JS var
  if(typeof chatHistory !== "undefined") chatHistory.length = 0;

  // Demo 3 — webgen
  const wgUrl  = document.getElementById("wg-url");
  if(wgUrl) wgUrl.textContent = "https://your-website.com";
  const wgBody = document.getElementById("wg-body");
  if(wgBody){
    wgBody.style.removeProperty("--pv-accent");
    wgBody.style.removeProperty("--pv-soft");
    wgBody.style.removeProperty("--pv-accent-2");
    wgBody.innerHTML = `<div class="preview-empty" data-i18n="demo3.empty">${txt("demo3.empty")}</div>`;
  }

  // Demo 4 — content (reset platform to Instagram)
  const cgOut = document.getElementById("cg-output");
  if(cgOut) cgOut.innerHTML = `<span class="placeholder" data-i18n="demo4.empty">${txt("demo4.empty")}</span>`;
  document.querySelectorAll("#platform-row .platform-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.platform === "instagram");
  });
  if(typeof activePlatform !== "undefined") activePlatform = "instagram";

  // Demo 5 — intent
  ["ia-urgency","ia-mood","ia-category"].forEach(id => {
    const el = document.getElementById(id); if(el) el.textContent = "—";
  });
  ["ia-chip-urgency","ia-chip-mood","ia-chip-category"].forEach(id => {
    const el = document.getElementById(id); if(el) el.className = "intent-chip";
  });
  const iaReply = document.getElementById("ia-reply");
  if(iaReply){
    iaReply.textContent = txt("demo5.replyEmpty");
    iaReply.setAttribute("data-i18n", "demo5.replyEmpty");
  }

  // Demo 6 — sales email
  const seTo   = document.getElementById("se-to");      if(seTo)   seTo.textContent   = "—";
  const seSubj = document.getElementById("se-subject"); if(seSubj) seSubj.textContent = "—";
  const seBody = document.getElementById("se-body");
  if(seBody) seBody.innerHTML = `<span class="placeholder" data-i18n="demo6.empty">${txt("demo6.empty")}</span>`;

  // Demo 7 — meeting summary
  const msOut = document.getElementById("ms-output");
  if(msOut){
    msOut.innerHTML = `<div class="ms-card empty"><div class="ms-lbl"><span data-i18n="demo7.summary">${txt("demo7.summary")}</span></div><div class="ms-content" data-i18n="demo7.empty">${txt("demo7.empty")}</div></div>`;
  }

  // Demo 8 — translation (reset tone to formal)
  const trOut = document.getElementById("tr-output");
  if(trOut) trOut.innerHTML = `<span class="placeholder" data-i18n="demo8.empty">${txt("demo8.empty")}</span>`;
  document.querySelectorAll("#tr-tone-row .platform-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tone === "formal");
  });
  if(typeof trTone !== "undefined") trTone = "formal";

  // Demo 9 — review reply
  const rvOut = document.getElementById("rv-output");
  if(rvOut){
    rvOut.innerHTML = `<div class="rv-card show"><div class="rv-tone" data-i18n="demo9.empty">${txt("demo9.empty")}</div><div class="rv-text" style="color:var(--text-faint);font-style:italic" data-i18n="demo9.emptyText">${txt("demo9.emptyText")}</div></div>`;
  }

  // Demo 10 — SEO titles
  const seoOut = document.getElementById("seo-output");
  if(seoOut){
    seoOut.innerHTML = `<div class="rv-card show"><div class="rv-tone" data-i18n="demo10.empty">${txt("demo10.empty")}</div><div class="rv-text" style="color:var(--text-faint);font-style:italic" data-i18n="demo10.emptyText">${txt("demo10.emptyText")}</div></div>`;
  }

  // Demo 11 — product copy
  const pcOut = document.getElementById("pc-output");
  if(pcOut) pcOut.innerHTML = `<span class="placeholder" data-i18n="demo11.empty">${txt("demo11.empty")}</span>`;

  // Demo 12 — warehouse routing
  const whOut = document.getElementById("wh-output");
  if(whOut){
    whOut.innerHTML = `<div class="wh-card show"><div class="wh-info"><div class="wh-name" data-i18n="demo12.empty">${txt("demo12.empty")}</div><div class="wh-meta" data-i18n="demo12.emptyText">${txt("demo12.emptyText")}</div></div><div class="wh-stock"><div class="num">—</div><div class="lbl" data-i18n="demo12.stockLabel">${txt("demo12.stockLabel")}</div></div></div>`;
  }

  // Demo 13 — wizard
  if(typeof window.__wizardReset === "function") window.__wizardReset();

  // Demo 14 — dashboard: re-render with new lang strings
  if(typeof window.__renderDashboard14 === "function"){
    const activeRange = document.querySelector("#dash-filter .dash-fseg.active")?.dataset.range || "7";
    window.__renderDashboard14(activeRange, false);
  }

  // Allow previews to replay in the new language
  if(window.__resetPreviews) window.__resetPreviews();
}

// R19: bilingual meta description so EN visitors / share previews
// don't see Chinese. Updated alongside applyLang().
const META_DESC = {
  zh: "TBC Solutions — AI 自動化、網頁設計、AI 內容創作、客製化 AI 解決方案。",
  en: "TBC Solutions — AI workflow automation, web design, AI content and custom AI solutions for SMBs.",
};
function applyLang(lang){
  const langChanged = currentLang !== lang;
  currentLang = lang;
  document.body.classList.toggle("lang-zh", lang === "zh");
  document.body.classList.toggle("lang-en", lang === "en");
  document.documentElement.lang = lang === "zh" ? "zh-TW" : "en";
  // Swap meta description so EN/zh share previews match active lang
  const metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc && META_DESC[lang]) metaDesc.setAttribute("content", META_DESC[lang]);
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    const v = I18N[lang][k];
    if(typeof v === "string"){ el.innerHTML = v; }
  });
  // Translate placeholders too (was missing before — caused EN mode to show Chinese)
  Object.entries(PLACEHOLDERS[lang] || {}).forEach(([id, ph])=>{
    const el = document.getElementById(id);
    if(el) el.placeholder = ph;
  });
  // language toggle UI
  document.querySelectorAll(".lang-switch button").forEach(b=>{
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  // reset hero title + typing for new language
  buildHeroTitle();
  startTyping();

  // Re-apply profile so personalised hero copy / demo dim / ROI prefill
  // get re-translated. (Returns early if no profile.)
  if(typeof applyProfile === "function" && CURRENT_PROFILE){
    applyProfile(CURRENT_PROFILE);
  }

  // When the user actively switches language, reset every demo so that
  // any rendered output (which has no data-i18n) is regenerated in the new
  // language, and re-trigger the auto-play preview for the visible slide.
  if(langChanged){
    setTimeout(() => {
      resetAllDemos();
      const active = document.querySelector(".demo-slide.active");
      const idx = +active?.dataset.slideIdx;
      if(!isNaN(idx) && typeof window.__playSlide === "function"){
        setTimeout(() => window.__playSlide(idx), 150);
      }
    }, 80);
  }
}

document.querySelectorAll(".lang-switch button").forEach(b=>{
  b.addEventListener("click", ()=>{
    applyLang(b.dataset.lang);
    try{ localStorage.setItem("tbc-lang", b.dataset.lang); }catch(e){}
  });
});

/* ============== THEME TOGGLE ============== */
let currentTheme = "dark";
function applyTheme(theme){
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  try{ localStorage.setItem("tbc-theme", theme); }catch(e){}
  // notify particle canvas (set by constellation closure)
  if(window.__onThemeChange) window.__onThemeChange(theme);
}
(function initTheme(){
  let saved = "dark";
  try{ saved = localStorage.getItem("tbc-theme") || "dark"; }catch(e){}
  applyTheme(saved);
})();
document.getElementById("theme-toggle").addEventListener("click", ()=>{
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

/* ===========================================================
   PROFILE STATE + WELCOME PAGE
   First-visit flow: welcome page (logo + industry + name) →
   personalised main site. Skippable. localStorage persists
   profile so returning visitors land directly on personalised state.
   =========================================================== */
const PROFILE_KEY = "tbc-profile-v2";

// Industry key (always stored as zh) → display name per language.
const INDUSTRY_NAME = {
  zh: {
    "餐飲":"餐飲","零售":"零售","專業服務":"專業服務","教育":"教育",
    "科技":"科技","醫美":"醫美","物流":"物流","創意":"創意",
  },
  en: {
    "餐飲":"F&B","零售":"retail & e-commerce","專業服務":"professional services","教育":"education",
    "科技":"tech & SaaS","醫美":"aesthetic clinics","物流":"logistics","創意":"creative & design",
  },
};
function industryLabel(key){
  if(!key) return "";
  const map = INDUSTRY_NAME[currentLang] || INDUSTRY_NAME.zh;
  return map[key] || key;
}

// Industry → personalisation rules
const INDUSTRY_HERO = {
  zh: {
    "餐飲":   ["餐飲業專屬","訂位、跟進與內容自動化"],
    "零售":   ["零售與電商專屬","客服、文案與庫存自動化"],
    "專業服務":["專業服務專屬","客戶跟進與報表自動化"],
    "教育":   ["教育培訓專屬","招生、跟進與內容自動化"],
    "科技":   ["科技與 SaaS 專屬","客服、報表與內容自動化"],
    "醫美":   ["醫美診所專屬","預約、漏客防止與重訪自動化"],
    "物流":   ["物流與倉儲專屬","庫存、調貨與報表自動化"],
    "創意":   ["創意與設計專屬","提案、跟進與內容自動化"],
  },
  en: {
    "餐飲":   ["Built for F&B","reservations, follow-ups and content automated"],
    "零售":   ["Built for retail & e-commerce","support, copy and inventory automated"],
    "專業服務":["Built for professional services","client follow-up and reporting automated"],
    "教育":   ["Built for education","enrolment, follow-up and content automated"],
    "科技":   ["Built for tech & SaaS","support, reporting and content automated"],
    "醫美":   ["Built for aesthetic clinics","bookings, no-show prevention and rebooking automated"],
    "物流":   ["Built for logistics","inventory, routing and reporting automated"],
    "創意":   ["Built for creative & design","pitching, follow-up and content automated"],
  },
};

/* ============================================================
   INDUSTRY_WORKFLOWS / INDUSTRY_BA
   Vertical-specific content for the "Real Workflows" (wf2) and
   "Before / After" (ba) sections. Per the second-phase brief:
   the layout & components stay the same, but every industry gets
   its own card titles, steps, save chips and timeline events so
   the narrative isn't medspa-flavored across the board.
   ============================================================ */

const INDUSTRY_WORKFLOWS = {
  zh:{
    "醫美":{
      "wf2.c1.title":"預約 · 提醒 · 漏客重訪",
      "wf2.c1.s1":"新預約自動發 WhatsApp 確認訊息",
      "wf2.c1.s2":"前 24 小時自動發送提醒",
      "wf2.c1.s3":"缺席客戶 24 小時內自動重新邀請",
      "wf2.c1.save":"每月節省 8 小時 · 漏客率下降 30%",
      "wf2.c2.title":"WhatsApp 訊息分流",
      "wf2.c2.s1":"新訊息即時分類為查詢 / 預約 / 投訴",
      "wf2.c2.s2":"常見問題自動回覆並附參考資料",
      "wf2.c2.s3":"複雜訊息轉真人並標記緊急程度",
      "wf2.c2.save":"客服回覆速度提升 5 倍",
      "wf2.c3.title":"療程後跟進 + 自動 Rebooking",
      "wf2.c3.s1":"療程後 24 小時自動發感謝訊息",
      "wf2.c3.s2":"7 日後邀請客戶評分與回饋",
      "wf2.c3.s3":"14 日後個人化續療建議與優惠",
      "wf2.c3.save":"Rebooking 率上升 25% · 員工零額外工時",
      "wf2.c4.title":"評論回覆自動草稿",
      "wf2.c4.s1":"即時偵測 Google / OpenRice 新評論",
      "wf2.c4.s2":"自動草擬 3 種語氣（正式 / 親切 / 致歉）",
      "wf2.c4.s3":"您一鍵 approve 即發送，省下草擬時間",
      "wf2.c4.save":"回覆評論時間下降 80%",
    },
    "教育":{
      "wf2.c1.title":"家長 WhatsApp 自動分流",
      "wf2.c1.s1":"新訊息按主題分類（試堂 / 補堂 / 收費 / 功課）",
      "wf2.c1.s2":"常見問題自動回覆（時間表 / 收費 / 地址）",
      "wf2.c1.s3":"複雜問題即時轉導師並標記緊急",
      "wf2.c1.save":"家長查詢回覆速度提升 6 倍",
      "wf2.c2.title":"試堂安排自動化",
      "wf2.c2.s1":"表單提交即時確認 + 派發可選時段",
      "wf2.c2.s2":"試堂前 24 小時自動 WhatsApp reminder",
      "wf2.c2.s3":"試堂後自動跟進「正式報讀建議」",
      "wf2.c2.save":"試堂轉化率提升 35%",
      "wf2.c3.title":"上課提醒 + 功課追蹤",
      "wf2.c3.s1":"上課前 2 小時自動 WhatsApp 提醒",
      "wf2.c3.s2":"課後自動發送功課內容與重點",
      "wf2.c3.s3":"未交功課自動提醒家長",
      "wf2.c3.save":"出席率上升 18% · 功課完成率上升 40%",
      "wf2.c4.title":"學期續報自動邀請",
      "wf2.c4.s1":"課程結束前 2 週發送續報邀請",
      "wf2.c4.s2":"按學生表現個人化推薦下個學期課程",
      "wf2.c4.s3":"早鳥優惠自動發放並追蹤回應",
      "wf2.c4.save":"續報率上升 30%",
    },
    "專業服務":{
      "wf2.c1.title":"Lead 跟進自動化（含地產看樓）",
      "wf2.c1.s1":"新 lead 入系統即發確認與可選會議時段",
      "wf2.c1.s2":"7 日後未回覆自動 follow-up + 案例分享",
      "wf2.c1.s3":"14 日後二次 follow-up 邀請短會",
      "wf2.c1.save":"Lead 流失率下降 40%",
      "wf2.c2.title":"客戶會議 / 看樓自動排程",
      "wf2.c2.s1":"客戶點選感興趣項目即發可選時段",
      "wf2.c2.s2":"24 小時前自動確認 + 地址導航",
      "wf2.c2.s3":"缺席自動安排下次並通知同事",
      "wf2.c2.save":"預約安排時間下降 70%",
      "wf2.c3.title":"新項目 / 樓盤自動推送",
      "wf2.c3.s1":"按客戶 budget 與偏好自動分組",
      "wf2.c3.s2":"新項目上架即推送匹配客戶",
      "wf2.c3.s3":"包含詳情、價格、可預約時段",
      "wf2.c3.save":"推廣覆蓋率上升 5 倍",
      "wf2.c4.title":"月度客戶報告自動化",
      "wf2.c4.s1":"每月自動整合所有客戶互動記錄",
      "wf2.c4.s2":"一鍵生成客戶關懷報告",
      "wf2.c4.s3":"重要日子（生日 / 紀念日）自動提醒",
      "wf2.c4.save":"客戶報告整理時間下降 90%",
    },
    "科技":{
      "wf2.c1.title":"Lead Scoring + CRM 自動更新",
      "wf2.c1.s1":"網站表單即時入 CRM（HubSpot / Pipedrive）",
      "wf2.c1.s2":"按行為（試用 / 文檔下載）自動計分",
      "wf2.c1.s3":"高分 lead 自動派 sales rep + Slack 通知",
      "wf2.c1.save":"Lead qualification 時間下降 80%",
      "wf2.c2.title":"用戶 Onboarding 自動化",
      "wf2.c2.s1":"新註冊即發 welcome email + in-app guide",
      "wf2.c2.s2":"Day 1 / 3 / 7 漸進式教學內容",
      "wf2.c2.s3":"未啟動帳戶 7 日後自動 nudge",
      "wf2.c2.save":"新用戶 activation rate 上升 45%",
      "wf2.c3.title":"Support Ticket 智能分流",
      "wf2.c3.s1":"Intercom / Zendesk 新 ticket 即時分類",
      "wf2.c3.s2":"Bug → engineering、Billing → finance、How-to 自動回覆",
      "wf2.c3.s3":"緊急 ticket 即時 Slack notify on-call",
      "wf2.c3.save":"平均回應時間下降 60%",
      "wf2.c4.title":"訂閱續費 + Churn 預警",
      "wf2.c4.s1":"續費前 30 日自動 nudge + 用量報告",
      "wf2.c4.s2":"7 日不登入即標記 at-risk + 自動建 CSM 任務",
      "wf2.c4.s3":"用量增長客戶自動觸發 upsell",
      "wf2.c4.save":"Churn rate 下降 25%",
    },
    "餐飲":{
      "wf2.c1.title":"訂位確認 + 缺席挽回",
      "wf2.c1.s1":"訂位即發 WhatsApp 確認",
      "wf2.c1.s2":"前 2 小時自動發送提醒",
      "wf2.c1.s3":"缺席客 24 小時內自動重新邀請",
      "wf2.c1.save":"缺席率下降 25%",
      "wf2.c2.title":"評論回覆自動草稿",
      "wf2.c2.s1":"即時偵測 OpenRice / Google 新評論",
      "wf2.c2.s2":"自動草擬 3 種語氣回覆",
      "wf2.c2.s3":"您一鍵 approve 即發送",
      "wf2.c2.save":"回覆時間下降 80%",
      "wf2.c3.title":"客戶生日 / 節日推廣",
      "wf2.c3.s1":"自動整理客戶生日資料",
      "wf2.c3.s2":"生日前 1 週自動發優惠 WhatsApp",
      "wf2.c3.s3":"節日前自動派 promo 給活躍客",
      "wf2.c3.save":"回頭客率上升 20%",
      "wf2.c4.title":"員工排班 + 食材報表",
      "wf2.c4.s1":"自動整合每日訂位 → 推薦排班",
      "wf2.c4.s2":"食材消耗自動計算 + 警示補貨",
      "wf2.c4.s3":"月底自動生成損益報表",
      "wf2.c4.save":"行政時間下降 60%",
    },
    "零售":{
      "wf2.c1.title":"多渠道客服合併（WhatsApp / IG / FB）",
      "wf2.c1.s1":"多渠道新訊息合併入一個 inbox",
      "wf2.c1.s2":"常見問題（運費 / 退貨 / 尺寸）自動回覆",
      "wf2.c1.s3":"投訴與大訂單即時 escalate",
      "wf2.c1.save":"客服回覆速度提升 4 倍",
      "wf2.c2.title":"產品文案批量生成",
      "wf2.c2.s1":"上新即時生成中英文商品描述",
      "wf2.c2.s2":"自動適配 Shopify / Shopline 格式",
      "wf2.c2.s3":"SEO 關鍵字自動植入",
      "wf2.c2.save":"上架時間下降 70%",
      "wf2.c3.title":"棄置購物車自動挽回",
      "wf2.c3.s1":"棄置 1 小時自動發提醒",
      "wf2.c3.s2":"24 小時後派優惠碼",
      "wf2.c3.s3":"72 小時後最後召回",
      "wf2.c3.save":"棄車挽回率上升 18%",
      "wf2.c4.title":"庫存警示 + 補貨建議",
      "wf2.c4.s1":"即時監控各 SKU 庫存",
      "wf2.c4.s2":"低庫存自動通知供應商",
      "wf2.c4.s3":"滯銷產品自動 markdown 建議",
      "wf2.c4.save":"庫存周轉率上升 22%",
    },
    "物流":{
      "wf2.c1.title":"多倉智能調貨",
      "wf2.c1.s1":"訂單入系統即計算各倉庫存 + 運費 + ETA",
      "wf2.c1.s2":"自動推薦最佳出貨點",
      "wf2.c1.s3":"低庫存自動向總倉調貨",
      "wf2.c1.save":"缺貨率下降 35%",
      "wf2.c2.title":"物流狀態自動回覆客戶",
      "wf2.c2.s1":"追蹤狀態自動回覆（送出 / 派送中 / 已收）",
      "wf2.c2.s2":"延誤自動發 apology + 預計時間",
      "wf2.c2.s3":"複雜投訴轉真人並標 priority",
      "wf2.c2.save":"客服效率上升 4 倍",
      "wf2.c3.title":"司機路線 + 任務派發",
      "wf2.c3.s1":"每日按地址 cluster 自動規劃路線",
      "wf2.c3.s2":"司機 app 收任務（地址 / 收件人 / 簽收）",
      "wf2.c3.s3":"完成即時更新系統 + 通知客戶",
      "wf2.c3.save":"派送效率上升 30%",
      "wf2.c4.title":"庫存盤點 + 損耗報表",
      "wf2.c4.s1":"每日自動對賬出貨 vs 庫存",
      "wf2.c4.s2":"異常自動標記等審核",
      "wf2.c4.s3":"月底損耗報表一鍵生成",
      "wf2.c4.save":"盤點時間下降 80%",
    },
    "創意":{
      "wf2.c1.title":"提案 + 報價自動化",
      "wf2.c1.s1":"新查詢即發品牌定位問卷",
      "wf2.c1.s2":"收集後自動生成提案草稿",
      "wf2.c1.s3":"報價單一鍵生成（按範圍計）",
      "wf2.c1.save":"提案速度提升 4 倍",
      "wf2.c2.title":"客戶 Feedback 追蹤",
      "wf2.c2.s1":"設計稿上 Figma 即發客戶通知",
      "wf2.c2.s2":"客戶 comment 自動整理入 todo list",
      "wf2.c2.s3":"未回覆 3 日自動 nudge",
      "wf2.c2.save":"修改循環時間下降 40%",
      "wf2.c3.title":"社交內容批量生成",
      "wf2.c3.s1":"客戶提供素材 → 自動生成多平台文案",
      "wf2.c3.s2":"自動適配 IG / FB / 小紅書格式",
      "wf2.c3.s3":"排期自動上載",
      "wf2.c3.save":"內容產出速度上升 5 倍",
      "wf2.c4.title":"月度作品集自動更新",
      "wf2.c4.s1":"完成項目自動歸檔",
      "wf2.c4.s2":"每月自動生成 portfolio update",
      "wf2.c4.s3":"自動推送至社交平台",
      "wf2.c4.save":"品牌曝光上升 3 倍",
    },
  },
  en:{
    "醫美":{
      "wf2.c1.title":"Booking · Reminder · No-show recovery",
      "wf2.c1.s1":"New booking auto-sends a WhatsApp confirmation",
      "wf2.c1.s2":"Reminder fires 24 hours before the appointment",
      "wf2.c1.s3":"No-shows get an auto re-invite within 24 hours",
      "wf2.c1.save":"Saves 8 hrs / month · −30% no-show rate",
      "wf2.c2.title":"WhatsApp message triage",
      "wf2.c2.s1":"New messages instantly classified — enquiry / booking / complaint",
      "wf2.c2.s2":"Common questions get an auto-reply with reference links",
      "wf2.c2.s3":"Complex messages route to a human with urgency tagged",
      "wf2.c2.save":"5× faster reply time",
      "wf2.c3.title":"Post-treatment follow-up + auto-rebooking",
      "wf2.c3.s1":"Thank-you message 24 hrs after treatment",
      "wf2.c3.s2":"Day 7: invite client to leave a review",
      "wf2.c3.s3":"Day 14: personalised rebooking suggestion with offer",
      "wf2.c3.save":"+25% rebooking rate · zero extra staff hours",
      "wf2.c4.title":"Auto-drafted review replies",
      "wf2.c4.s1":"New Google / OpenRice reviews detected instantly",
      "wf2.c4.s2":"3 reply styles auto-drafted (formal / warm / apologetic)",
      "wf2.c4.s3":"You one-click approve and send — no more drafting from scratch",
      "wf2.c4.save":"−80% time spent on review replies",
    },
    "教育":{
      "wf2.c1.title":"Parent WhatsApp triage",
      "wf2.c1.s1":"New messages classified by topic (trial / make-up / fees / homework)",
      "wf2.c1.s2":"FAQs auto-replied (timetable / fees / address)",
      "wf2.c1.s3":"Complex questions route to tutor with urgency flagged",
      "wf2.c1.save":"6× faster parent enquiry reply",
      "wf2.c2.title":"Trial-class booking automation",
      "wf2.c2.s1":"Form submission auto-confirms + sends slot options",
      "wf2.c2.s2":"WhatsApp reminder 24 hours before trial",
      "wf2.c2.s3":"Post-trial auto follow-up with formal enrolment suggestion",
      "wf2.c2.save":"+35% trial-to-enrol conversion",
      "wf2.c3.title":"Class reminders + homework tracking",
      "wf2.c3.s1":"WhatsApp reminder 2 hrs before each class",
      "wf2.c3.s2":"Homework content auto-sent right after class",
      "wf2.c3.s3":"Missed homework auto-flagged to parents",
      "wf2.c3.save":"+18% attendance · +40% homework completion",
      "wf2.c4.title":"Term renewal outreach",
      "wf2.c4.s1":"Renewal invite goes out 2 weeks before term ends",
      "wf2.c4.s2":"Personalised next-term suggestions based on student progress",
      "wf2.c4.s3":"Early-bird offers auto-distributed and tracked",
      "wf2.c4.save":"+30% term renewal rate",
    },
    "專業服務":{
      "wf2.c1.title":"Lead follow-up automation (incl. property viewings)",
      "wf2.c1.s1":"New lead enters CRM → confirmation + meeting slots sent",
      "wf2.c1.s2":"Day 7 auto follow-up if no reply, with case study",
      "wf2.c1.s3":"Day 14 second follow-up inviting a short call",
      "wf2.c1.save":"−40% lead leakage rate",
      "wf2.c2.title":"Client meeting / viewing scheduling",
      "wf2.c2.s1":"Client picks a project / property → time slots sent",
      "wf2.c2.s2":"24-hour confirmation + address & navigation",
      "wf2.c2.s3":"No-shows auto-rescheduled and team notified",
      "wf2.c2.save":"−70% scheduling time",
      "wf2.c3.title":"New project / listing push",
      "wf2.c3.s1":"Clients segmented by budget and preference",
      "wf2.c3.s2":"New listings auto-pushed to matching clients",
      "wf2.c3.s3":"Includes details, price, bookable viewing slots",
      "wf2.c3.save":"5× promotional reach",
      "wf2.c4.title":"Monthly client report automation",
      "wf2.c4.s1":"All client interactions auto-compiled monthly",
      "wf2.c4.s2":"One-click client-care report generation",
      "wf2.c4.s3":"Birthday / anniversary reminders fire automatically",
      "wf2.c4.save":"−90% client report compilation time",
    },
    "科技":{
      "wf2.c1.title":"Lead scoring + CRM auto-update",
      "wf2.c1.s1":"Website form syncs to CRM (HubSpot / Pipedrive) instantly",
      "wf2.c1.s2":"Behaviour-based scoring (trial usage, doc downloads)",
      "wf2.c1.s3":"High-score leads auto-assigned to sales rep with Slack ping",
      "wf2.c1.save":"−80% lead qualification time",
      "wf2.c2.title":"User onboarding automation",
      "wf2.c2.s1":"New signup gets welcome email + in-app guide",
      "wf2.c2.s2":"Day 1 / 3 / 7 progressive education content",
      "wf2.c2.s3":"Inactive accounts auto-nudged after 7 days",
      "wf2.c2.save":"+45% new-user activation rate",
      "wf2.c3.title":"Support ticket smart routing",
      "wf2.c3.s1":"Intercom / Zendesk tickets classified on arrival",
      "wf2.c3.s2":"Bug → engineering / Billing → finance / How-to auto-replied",
      "wf2.c3.s3":"Urgent tickets ping on-call via Slack instantly",
      "wf2.c3.save":"−60% average response time",
      "wf2.c4.title":"Renewal + churn early warning",
      "wf2.c4.s1":"30 days before renewal: auto nudge + usage report",
      "wf2.c4.s2":"7-day inactivity → at-risk flag + auto CSM task",
      "wf2.c4.s3":"Growing-usage accounts auto-trigger upsell flow",
      "wf2.c4.save":"−25% churn rate",
    },
    "餐飲":{
      "wf2.c1.title":"Reservation confirmation + no-show recovery",
      "wf2.c1.s1":"Reservation auto-confirmed via WhatsApp",
      "wf2.c1.s2":"Reminder fires 2 hours before",
      "wf2.c1.s3":"No-shows auto re-invited within 24 hours",
      "wf2.c1.save":"−25% no-show rate",
      "wf2.c2.title":"Auto-drafted review replies",
      "wf2.c2.s1":"New OpenRice / Google reviews detected instantly",
      "wf2.c2.s2":"3 reply styles auto-drafted",
      "wf2.c2.s3":"One-click approve and send",
      "wf2.c2.save":"−80% reply time",
      "wf2.c3.title":"Birthday & seasonal outreach",
      "wf2.c3.s1":"Customer birthdays auto-collated",
      "wf2.c3.s2":"WhatsApp offer goes out 1 week before birthday",
      "wf2.c3.s3":"Seasonal promos auto-sent to active customers",
      "wf2.c3.save":"+20% repeat-visit rate",
      "wf2.c4.title":"Staff scheduling + ingredient reporting",
      "wf2.c4.s1":"Daily reservations auto-feed scheduling recommendations",
      "wf2.c4.s2":"Ingredient consumption auto-calculated with restock alerts",
      "wf2.c4.s3":"Monthly P&L report generated automatically",
      "wf2.c4.save":"−60% admin time",
    },
    "零售":{
      "wf2.c1.title":"Multi-channel support merge (WhatsApp / IG / FB)",
      "wf2.c1.s1":"All new messages merged into one inbox",
      "wf2.c1.s2":"FAQs (shipping / returns / sizing) auto-replied",
      "wf2.c1.s3":"Complaints and large orders escalated instantly",
      "wf2.c1.save":"4× faster support reply",
      "wf2.c2.title":"Bulk product copy generation",
      "wf2.c2.s1":"New SKUs get bilingual product descriptions on the fly",
      "wf2.c2.s2":"Auto-formatted for Shopify / Shopline",
      "wf2.c2.s3":"SEO keywords inserted automatically",
      "wf2.c2.save":"−70% listing time",
      "wf2.c3.title":"Abandoned cart recovery",
      "wf2.c3.s1":"Reminder fires 1 hour after abandonment",
      "wf2.c3.s2":"Day 1: discount code sent",
      "wf2.c3.s3":"Day 3: last-chance recall",
      "wf2.c3.save":"+18% cart recovery rate",
      "wf2.c4.title":"Stock alerts + restock recommendations",
      "wf2.c4.s1":"Each SKU monitored in real time",
      "wf2.c4.s2":"Low stock auto-notifies suppliers",
      "wf2.c4.s3":"Slow-moving items get auto-markdown suggestions",
      "wf2.c4.save":"+22% inventory turnover",
    },
    "物流":{
      "wf2.c1.title":"Multi-warehouse smart routing",
      "wf2.c1.s1":"New order checks stock, freight and ETA across warehouses",
      "wf2.c1.s2":"Best fulfilment point auto-recommended",
      "wf2.c1.s3":"Low stock auto-triggers transfer from main warehouse",
      "wf2.c1.save":"−35% out-of-stock rate",
      "wf2.c2.title":"Auto-reply on shipment status",
      "wf2.c2.s1":"Status updates (shipped / in-transit / delivered) auto-replied",
      "wf2.c2.s2":"Delays trigger apology + revised ETA automatically",
      "wf2.c2.s3":"Complex complaints route to human with priority tag",
      "wf2.c2.save":"4× support efficiency",
      "wf2.c3.title":"Driver routing + task dispatch",
      "wf2.c3.s1":"Daily address clustering auto-plans routes",
      "wf2.c3.s2":"Driver app receives tasks (address / recipient / sign-off)",
      "wf2.c3.s3":"Completion syncs to system + customer notification",
      "wf2.c3.save":"+30% delivery efficiency",
      "wf2.c4.title":"Stock reconciliation + loss reports",
      "wf2.c4.s1":"Daily shipped vs in-stock auto-reconciled",
      "wf2.c4.s2":"Anomalies flagged for review",
      "wf2.c4.s3":"Monthly loss report generated in one click",
      "wf2.c4.save":"−80% stocktake time",
    },
    "創意":{
      "wf2.c1.title":"Proposal + quote automation",
      "wf2.c1.s1":"New enquiry auto-sends brand-positioning questionnaire",
      "wf2.c1.s2":"Replies feed into auto-drafted proposal",
      "wf2.c1.s3":"Quote generated by scope in one click",
      "wf2.c1.save":"4× faster proposal turnaround",
      "wf2.c2.title":"Client feedback tracking",
      "wf2.c2.s1":"Figma uploads auto-notify the client",
      "wf2.c2.s2":"Client comments auto-collated into a todo list",
      "wf2.c2.s3":"No reply in 3 days → auto-nudge",
      "wf2.c2.save":"−40% revision cycle time",
      "wf2.c3.title":"Bulk social content generation",
      "wf2.c3.s1":"Client assets → multi-platform copy auto-generated",
      "wf2.c3.s2":"Auto-formatted for IG / FB / Xiaohongshu",
      "wf2.c3.s3":"Scheduled posts auto-uploaded",
      "wf2.c3.save":"5× content output speed",
      "wf2.c4.title":"Monthly portfolio auto-update",
      "wf2.c4.s1":"Completed projects auto-archived",
      "wf2.c4.s2":"Monthly portfolio update auto-generated",
      "wf2.c4.s3":"Auto-pushed to social platforms",
      "wf2.c4.save":"3× brand exposure",
    },
  },
};

const INDUSTRY_BA = {
  zh:{
    "醫美":{
      "ba.desc":"同樣 12 個客戶查詢、3 個新預約、2 個評論待回。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"回覆昨晚 12 個 WhatsApp 查詢","ba.bs2":"手動逐一發送預約確認",
      "ba.bs3":"午餐被新查詢訊息打斷","ba.bs4":"手動寫提醒給明日客戶",
      "ba.bs5":"逐張整理今日預約記錄","ba.bs6":"下班後再回 5 個未處理訊息",
      "ba.bTotalLabel":"花於重複客服","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動回覆 10 個常見查詢","ba.as2":"查看儀表板：2 個複雜訊息已標記",
      "ba.as3":"午餐安靜，自動提醒已批量發出","ba.as4":"親自處理 1 個高價值客戶會議",
      "ba.as5":"系統已自動整理今日報表","ba.as6":"準時下班",
      "ba.aTotalLabel":"回到真正帶來收入的工作","ba.aTotalNum":"+4 小時",
    },
    "教育":{
      "ba.desc":"同樣 15 個家長查詢、4 個試堂申請、3 班上課提醒。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"處理昨晚 15 個家長 WhatsApp 查詢","ba.bs2":"手動回覆功課與時間表問題",
      "ba.bs3":"午餐被新試堂報名打斷","ba.bs4":"逐個寫今晚上課 WhatsApp 提醒",
      "ba.bs5":"整理今日試堂與正式生記錄","ba.bs6":"課後再回 8 個未處理家長問題",
      "ba.bTotalLabel":"花於家長溝通","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動回覆 12 個家長查詢","ba.as2":"查看儀表板：3 個複雜問題已標記",
      "ba.as3":"午餐安靜，上課提醒已批量發出","ba.as4":"親自跟進 2 個高潛力試堂家庭",
      "ba.as5":"系統已自動生成今日招生報表","ba.as6":"準時收工",
      "ba.aTotalLabel":"用於教學與招生","ba.aTotalNum":"+4 小時",
    },
    "專業服務":{
      "ba.desc":"同樣 10 個新 lead、3 個看樓 / 會議、2 個新項目要推送。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"回覆昨晚 10 個 lead enquiry","ba.bs2":"手動安排今日 3 個看樓 / 會議",
      "ba.bs3":"午餐被新項目通知打斷","ba.bs4":"整理客戶資料 + 寫 follow-up",
      "ba.bs5":"月底報表加班","ba.bs6":"下班後再回 4 個未處理客戶",
      "ba.bTotalLabel":"花於行政工作","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動 qualify 8 個 lead","ba.as2":"查看儀表板：今日所有預約已確認",
      "ba.as3":"午餐安靜，新項目已自動推送匹配客戶","ba.as4":"親自跟進 2 個高價值客戶",
      "ba.as5":"系統已自動整理月度報表","ba.as6":"準時收工",
      "ba.aTotalLabel":"用於真正成交","ba.aTotalNum":"+4 小時",
    },
    "科技":{
      "ba.desc":"同樣 25 個新 lead、5 個 support ticket、3 個 onboarding。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"手動 review 昨晚 25 個新 lead","ba.bs2":"逐個 Slack 派 sales rep",
      "ba.bs3":"午餐被 P1 support ticket 打斷","ba.bs4":"整理本週 churn 風險用戶",
      "ba.bs5":"寫客戶 onboarding email","ba.bs6":"下班後 review 新註冊用戶",
      "ba.bTotalLabel":"花於 admin","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動分流並 score 30 個新 lead","ba.as2":"查看儀表板：3 個高分 lead 已派 rep",
      "ba.as3":"午餐安靜，緊急 ticket 已自動 escalate","ba.as4":"親自跟進 2 個 enterprise lead",
      "ba.as5":"系統已自動發送 onboarding 序列","ba.as6":"準時收工",
      "ba.aTotalLabel":"用於策略性 customer success","ba.aTotalNum":"+4 小時",
    },
    "餐飲":{
      "ba.desc":"同樣 12 個訂位、8 個評論待回、20 個 WhatsApp 查詢。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"處理昨晚 12 個電話訂位 + WhatsApp","ba.bs2":"手動回覆 8 個負評",
      "ba.bs3":"午市忙碌被催單打斷","ba.bs4":"整理員工排班",
      "ba.bs5":"點貨 + 計算明日所需","ba.bs6":"晚市結束後做日報表",
      "ba.bTotalLabel":"花於管理","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動確認 12 個訂位","ba.as2":"評論回覆草稿等您 approve",
      "ba.as3":"午市專注接待 VIP 客","ba.as4":"自動排班建議已生成",
      "ba.as5":"食材警示已自動發出","ba.as6":"準時收工",
      "ba.aTotalLabel":"用於現場服務","ba.aTotalNum":"+4 小時",
    },
    "零售":{
      "ba.desc":"同樣 30 個多渠道客服、10 個新上架、5 個棄置購物車。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"回覆昨晚 30 個 IG / WhatsApp 客服","ba.bs2":"手動 import 新到貨並寫商品描述",
      "ba.bs3":"午餐被退貨爭議打斷","ba.bs4":"跟進棄置購物車（多數已 cold）",
      "ba.bs5":"盤點低庫存 + call 供應商","ba.bs6":"下班後做 daily sales report",
      "ba.bTotalLabel":"花於營運","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動回覆 25 個常見查詢","ba.as2":"商品文案已批量生成等審",
      "ba.as3":"午餐安靜，棄車挽回訊息已發","ba.as4":"親自跟進 5 個 VIP / wholesale enquiry",
      "ba.as5":"庫存警示已自動發供應商","ba.as6":"準時收工，sales report 已自動寄到信箱",
      "ba.aTotalLabel":"用於品牌策略","ba.aTotalNum":"+4 小時",
    },
    "物流":{
      "ba.desc":"同樣 80 張訂單分倉、20 個物流查詢、5 個延誤投訴。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"手動分配今日 80 張單到 5 倉","ba.bs2":"接電話查物流狀態",
      "ba.bs3":"午餐被缺貨警示打斷","ba.bs4":"手動規劃司機路線",
      "ba.bs5":"對賬今日出貨記錄","ba.bs6":"下班後處理延誤客戶投訴",
      "ba.bTotalLabel":"花於調度","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動分倉 + 推薦路線","ba.as2":"儀表板：所有訂單狀態已自動回覆客戶",
      "ba.as3":"午餐安靜，缺貨已自動調貨","ba.as4":"親自處理 1 個大客戶緊急訂單",
      "ba.as5":"系統已自動對賬 + 標記異常","ba.as6":"準時收工",
      "ba.aTotalLabel":"用於業務拓展","ba.aTotalNum":"+4 小時",
    },
    "創意":{
      "ba.desc":"同樣 8 個新查詢、5 個 in-progress 項目、3 個社交內容要出。手動處理 vs 自動化系統的真實差別。",
      "ba.bs1":"回覆昨晚 8 個新查詢","ba.bs2":"手動寫 3 份提案",
      "ba.bs3":"午餐被客戶修改要求打斷","ba.bs4":"寫今週社交媒體文案",
      "ba.bs5":"整理本月作品集","ba.bs6":"下班後回客戶意見回饋",
      "ba.bTotalLabel":"花於行政","ba.bTotalNum":"約 5 小時",
      "ba.as1":"系統已自動發問卷給 6 個新查詢","ba.as2":"提案草稿已生成等審",
      "ba.as3":"午餐安靜，修改要求已自動入 todo","ba.as4":"親自做 1 個重要 brand pitch",
      "ba.as5":"社交內容已批量生成排期","ba.as6":"準時收工",
      "ba.aTotalLabel":"用於真正創作","ba.aTotalNum":"+4 小時",
    },
  },
  en:{
    "醫美":{
      "ba.desc":"Same 12 enquiries, 3 new bookings, 2 reviews to reply. Manual vs automated — the real difference.",
      "ba.bs1":"Reply to 12 WhatsApp enquiries from last night","ba.bs2":"Manually send each booking confirmation",
      "ba.bs3":"Lunch interrupted by new enquiry pings","ba.bs4":"Hand-write reminders for tomorrow's clients",
      "ba.bs5":"Compile today's booking records by hand","ba.bs6":"After hours: reply to 5 messages you missed",
      "ba.bTotalLabel":"Lost to repetitive support","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-replied to 10 common enquiries","ba.as2":"Check dashboard: 2 complex messages flagged",
      "ba.as3":"Quiet lunch — auto-reminders already sent","ba.as4":"Take 1 high-value client meeting in person",
      "ba.as5":"System has auto-compiled today's report","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to revenue-driving work","ba.aTotalNum":"+4 hours",
    },
    "教育":{
      "ba.desc":"Same 15 parent enquiries, 4 trial-class requests, 3 class reminders. Manual vs automated — the real difference.",
      "ba.bs1":"Reply to 15 parent WhatsApps from last night","ba.bs2":"Manually answer homework & timetable questions",
      "ba.bs3":"Lunch interrupted by new trial-class signups","ba.bs4":"Hand-write tonight's class reminders",
      "ba.bs5":"Compile trial and enrolled student records","ba.bs6":"After class, reply to 8 more parent questions",
      "ba.bTotalLabel":"Lost to parent comms","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-replied to 12 parent enquiries","ba.as2":"Dashboard: 3 complex questions flagged",
      "ba.as3":"Quiet lunch — class reminders already sent in bulk","ba.as4":"Follow up with 2 high-potential trial families in person",
      "ba.as5":"System has auto-generated today's enrolment report","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to teaching & enrolment","ba.aTotalNum":"+4 hours",
    },
    "專業服務":{
      "ba.desc":"Same 10 new leads, 3 viewings / meetings, 2 new listings to push. Manual vs automated — the real difference.",
      "ba.bs1":"Reply to 10 new lead enquiries from last night","ba.bs2":"Manually schedule today's 3 viewings / meetings",
      "ba.bs3":"Lunch interrupted by new-listing notifications","ba.bs4":"Compile client data + write follow-ups",
      "ba.bs5":"Month-end report overtime","ba.bs6":"After hours, reply to 4 missed clients",
      "ba.bTotalLabel":"Lost to admin work","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-qualified 8 new leads","ba.as2":"Dashboard: today's appointments all confirmed",
      "ba.as3":"Quiet lunch — new listings auto-pushed to matched clients","ba.as4":"Follow up with 2 high-value clients in person",
      "ba.as5":"System has auto-compiled the monthly report","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to actual closings","ba.aTotalNum":"+4 hours",
    },
    "科技":{
      "ba.desc":"Same 25 new leads, 5 support tickets, 3 onboardings. Manual vs automated — the real difference.",
      "ba.bs1":"Review 25 new leads from last night by hand","ba.bs2":"Manually assign each to a sales rep on Slack",
      "ba.bs3":"Lunch interrupted by a P1 support ticket","ba.bs4":"Compile this week's churn-risk users",
      "ba.bs5":"Write customer onboarding emails","ba.bs6":"After hours, review new signups",
      "ba.bTotalLabel":"Lost to admin","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-triaged and scored 30 new leads","ba.as2":"Dashboard: 3 high-score leads already assigned",
      "ba.as3":"Quiet lunch — urgent tickets auto-escalated","ba.as4":"Follow up with 2 enterprise leads in person",
      "ba.as5":"System has auto-sent the onboarding sequence","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to strategic customer success","ba.aTotalNum":"+4 hours",
    },
    "餐飲":{
      "ba.desc":"Same 12 reservations, 8 reviews to reply, 20 WhatsApp enquiries. Manual vs automated — the real difference.",
      "ba.bs1":"Process 12 phone reservations + WhatsApps from last night","ba.bs2":"Manually reply to 8 negative reviews",
      "ba.bs3":"Lunch rush interrupted by order chasing","ba.bs4":"Hand-build staff rota",
      "ba.bs5":"Stock-check + calculate tomorrow's order","ba.bs6":"After dinner service, do the daily report",
      "ba.bTotalLabel":"Lost to management","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-confirmed 12 reservations","ba.as2":"Review-reply drafts waiting for your approval",
      "ba.as3":"Lunch service: focus on hosting VIP guests","ba.as4":"Auto-generated rota recommendations ready",
      "ba.as5":"Ingredient alerts already sent automatically","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to on-floor service","ba.aTotalNum":"+4 hours",
    },
    "零售":{
      "ba.desc":"Same 30 cross-channel enquiries, 10 new SKUs, 5 abandoned carts. Manual vs automated — the real difference.",
      "ba.bs1":"Reply to 30 IG / WhatsApp messages from last night","ba.bs2":"Manually import new arrivals and write descriptions",
      "ba.bs3":"Lunch interrupted by a return dispute","ba.bs4":"Follow up abandoned carts (mostly cold by now)",
      "ba.bs5":"Stock-check low inventory + call suppliers","ba.bs6":"After hours, write the daily sales report",
      "ba.bTotalLabel":"Lost to operations","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-replied to 25 common enquiries","ba.as2":"Product copy bulk-generated, awaiting review",
      "ba.as3":"Quiet lunch — cart-recovery messages already sent","ba.as4":"Follow up with 5 VIP / wholesale enquiries in person",
      "ba.as5":"Stock alerts already sent to suppliers automatically","ba.as6":"Clock off on time — sales report already in your inbox",
      "ba.aTotalLabel":"Back to brand strategy","ba.aTotalNum":"+4 hours",
    },
    "物流":{
      "ba.desc":"Same 80 orders to route, 20 shipment enquiries, 5 delay complaints. Manual vs automated — the real difference.",
      "ba.bs1":"Manually allocate today's 80 orders across 5 warehouses","ba.bs2":"Take phone calls checking shipment status",
      "ba.bs3":"Lunch interrupted by out-of-stock alerts","ba.bs4":"Hand-plan driver routes",
      "ba.bs5":"Reconcile today's shipment records","ba.bs6":"After hours, handle delayed-delivery complaints",
      "ba.bTotalLabel":"Lost to dispatch","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-allocated warehouses and routed","ba.as2":"Dashboard: all shipment-status replies sent to customers",
      "ba.as3":"Quiet lunch — out-of-stock auto-transferred","ba.as4":"Handle 1 large-client urgent order in person",
      "ba.as5":"System has auto-reconciled and flagged anomalies","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to business development","ba.aTotalNum":"+4 hours",
    },
    "創意":{
      "ba.desc":"Same 8 new enquiries, 5 in-progress projects, 3 social posts to ship. Manual vs automated — the real difference.",
      "ba.bs1":"Reply to 8 new enquiries from last night","ba.bs2":"Hand-write 3 proposals",
      "ba.bs3":"Lunch interrupted by client revision requests","ba.bs4":"Write this week's social media copy",
      "ba.bs5":"Compile this month's portfolio","ba.bs6":"After hours, reply to client feedback",
      "ba.bTotalLabel":"Lost to admin","ba.bTotalNum":"≈ 5 hours",
      "ba.as1":"System has auto-sent questionnaires to 6 new enquiries","ba.as2":"Proposal drafts already generated, awaiting review",
      "ba.as3":"Quiet lunch — revision requests auto-logged in todo","ba.as4":"Run 1 important brand pitch in person","ba.as5":"Social content bulk-generated and scheduled","ba.as6":"Clock off on time",
      "ba.aTotalLabel":"Back to actual creative work","ba.aTotalNum":"+4 hours",
    },
  },
};

/* ============================================================
   INDUSTRY_MOCKUPS
   Real-feel WhatsApp + Dashboard mockup content per vertical.
   Rendered into #rf-wa-body and #rf-dash-kpis / #rf-dash-rows
   by renderMockupsForIndustry() — called from applyProfile.
   Each industry should provide both `wa` and `dash`. Missing
   industries fall back to "醫美" defaults.
   ============================================================ */
const INDUSTRY_MOCKUPS = {
  zh:{
    "醫美":{
      wa:{ avatar:"陳", name:"陳太太", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"你好，想預約 Hydrafacial 療程", time:"09:23"},
          {dir:"in",  text:"下星期三幾點有位？",            time:"09:23"},
          {dir:"out", text:"陳太您好！系統已預留三個時段：14:00 / 15:30 / 17:00 ✨",
            time:"09:23", tag:"自動回覆"},
          {dir:"in",  text:"15:30 唔該晒",                  time:"09:24"},
          {dir:"out", text:"已預約：星期三 03/06 15:30 Hydrafacial 60 分鐘。療程前 24 小時自動提醒",
            time:"09:24", tag:"自動確認"},
        ]},
      dash:{ url:"app.clinic.com/bookings", title:"今日預約管理", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"今日預約",val:"12"},{label:"待確認",val:"3"},
          {label:"新查詢",val:"8"},{label:"本週 Rebooking",val:"18"},
        ],
        rows:[
          {c1:"14:00",c2:"陳太太",c3:"Hydrafacial",      status:"ok",  statusText:"已確認"},
          {c1:"14:30",c2:"Anna L.",c3:"Botox 療程",      status:"wait",statusText:"待確認"},
          {c1:"15:30",c2:"陳太太",c3:"Hydrafacial（新）",status:"ok",  statusText:"已確認"},
          {c1:"16:00",c2:"Mark Y.",c3:"首次諮詢",        status:"wait",statusText:"待確認"},
          {c1:"16:30",c2:"—",     c3:"空檔",            status:"open",statusText:"可預約"},
        ]},
    },
    "教育":{
      wa:{ avatar:"林", name:"林媽媽（家長）", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"老師你好，女兒想試堂 P5 數學", time:"19:12"},
          {dir:"in",  text:"星期六有沒有位？",              time:"19:12"},
          {dir:"out", text:"林媽媽您好！系統已留 3 個試堂時段：星期六 10:00 / 13:30 / 15:00 📅",
            time:"19:13", tag:"自動回覆"},
          {dir:"in",  text:"13:30 OK",                      time:"19:14"},
          {dir:"out", text:"已預留：星期六 30/05 13:30 P5 數學試堂。前一日自動提醒",
            time:"19:14", tag:"自動確認"},
        ]},
      dash:{ url:"app.academy.com/enrolment", title:"招生與試堂管理", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"本週試堂",val:"24"},{label:"待跟進",val:"7"},
          {label:"續報待回",val:"15"},{label:"轉化率",val:"38%"},
        ],
        rows:[
          {c1:"星期六 10:00",c2:"Lucas C.",  c3:"P3 中文 · 試堂",   status:"ok",  statusText:"已確認"},
          {c1:"星期六 13:30",c2:"林媽媽",    c3:"P5 數學 · 試堂",   status:"ok",  statusText:"已確認"},
          {c1:"星期日 14:00",c2:"Sarah Y.",  c3:"F.4 英文 · 試堂",  status:"wait",statusText:"待確認"},
          {c1:"星期日 16:00",c2:"陳同學",    c3:"暑期班續報",       status:"wait",statusText:"待回覆"},
          {c1:"—",          c2:"Top 5 lead",c3:"高潛力試堂家庭",   status:"open",statusText:"待派員"},
        ]},
    },
    "專業服務":{
      wa:{ avatar:"何", name:"何生（地產 lead）", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"想看太古城兩房單位",            time:"14:08"},
          {dir:"in",  text:"預算 1,500 萬左右",              time:"14:08"},
          {dir:"out", text:"何生您好！已為您篩選 3 個合適單位（含照片、近期成交價），看樓時段：明日 11:00 / 16:00 🏠",
            time:"14:09", tag:"自動回覆"},
          {dir:"in",  text:"16:00 麻煩你",                   time:"14:10"},
          {dir:"out", text:"已預約：明日 25/05 16:00 太古城海天閣 D 室看樓。地址導航與聯絡電話將於 24 小時前發送",
            time:"14:10", tag:"自動確認"},
        ]},
      dash:{ url:"app.estate.com/leads", title:"Lead 跟進 · 今日", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"新 Lead",val:"14"},{label:"預約看樓",val:"6"},
          {label:"7 日內跟進",val:"23"},{label:"本月成交",val:"3"},
        ],
        rows:[
          {c1:"11:00",c2:"陳先生",  c3:"康怡花園 3 房 · 第二次看", status:"ok",  statusText:"已確認"},
          {c1:"14:30",c2:"Anna W.", c3:"半山 studio · 首次看",     status:"wait",statusText:"待確認"},
          {c1:"16:00",c2:"何生",   c3:"太古城海天閣 D 室",         status:"ok",  statusText:"已確認"},
          {c1:"Day 7",c2:"林小姐",  c3:"自動 follow-up（無回覆）", status:"wait",statusText:"已派出"},
          {c1:"新",  c2:"3 個新盤",c3:"已自動推送匹配客戶",        status:"open",statusText:"已發送"},
        ]},
    },
    "科技":{
      wa:{ avatar:"陳", name:"陳小姐（Trial 試用客）", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"你好，啱啱註冊咗，點樣 import CSV？", time:"10:15"},
          {dir:"out", text:"陳小姐您好！喺 Settings → Import 入面上載 CSV 即可。90 秒教學：tbc.help/import",
            time:"10:15", tag:"自動回覆"},
          {dir:"in",  text:"明白，多謝！",                          time:"10:18"},
          {dir:"out", text:"無問題。我 2 日後再 check 返你嘅使用情況",
            time:"10:18", tag:"自動跟進"},
          {dir:"out", text:"備註：已標記為高意向 lead — 銷售 Mark 明日會主動聯絡",
            time:"10:18", tag:"內部分流"},
        ]},
      dash:{ url:"app.saas.com/crm", title:"Lead Scoring · CRM", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"新註冊",val:"30"},{label:"高分 Lead",val:"6"},
          {label:"高流失風險",val:"4"},{label:"續費 30d",val:"12"},
        ],
        rows:[
          {c1:"Score 92",c2:"陳小姐",      c3:"Trial · 已試 5/8 功能",  status:"ok",  statusText:"已派 Mark"},
          {c1:"Score 87",c2:"Acme Corp",  c3:"企業 demo 已觀看",   status:"ok",  statusText:"已派 Jenny"},
          {c1:"Score 14",c2:"David L.",   c3:"7 日未登入 · At-risk",     status:"wait",statusText:"已建 CSM 任務"},
          {c1:"Renew",   c2:"Globex Inc.",c3:"續費前 30 日 · 用量 ↑ 25%", status:"ok",  statusText:"自動 upsell"},
          {c1:"P1",      c2:"Ticket #4521",c3:"Bug · API timeout",        status:"open",statusText:"已 Slack on-call"},
        ]},
    },
    "餐飲":{
      wa:{ avatar:"L", name:"Linda（訂位查詢）", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"今晚 7 點 4 位有沒有位？", time:"15:20"},
          {dir:"out", text:"Linda 您好！7:00 已滿 — 6:30 / 7:30 / 8:00 仍有位 🍱",
            time:"15:20", tag:"自動回覆"},
          {dir:"in",  text:"7:30 OK 唔該",          time:"15:21"},
          {dir:"out", text:"已預留：今晚 7:30 · 4 位 · 大廳。前 2 小時會自動提醒",
            time:"15:21", tag:"自動確認"},
          {dir:"out", text:"記得：今日生日優惠 — 蛋糕 9 折 🎂", time:"15:21", tag:"客戶生日"},
        ]},
      dash:{ url:"app.bistro.com/booking", title:"訂位與營運", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"今晚訂位",val:"38"},{label:"待確認",val:"4"},
          {label:"缺席率",val:"6%"},{label:"本週評論",val:"12"},
        ],
        rows:[
          {c1:"18:30",c2:"陳先生", c3:"2 位 · 窗邊",     status:"ok",  statusText:"已確認"},
          {c1:"19:30",c2:"Linda",  c3:"4 位 · 大廳（生日）",status:"ok",  statusText:"已確認"},
          {c1:"20:00",c2:"David",  c3:"6 位 · 包廂",     status:"wait",statusText:"待確認"},
          {c1:"新評論",c2:"OpenRice",c3:"4 星 · 服務好",   status:"open",statusText:"回覆草稿已備"},
          {c1:"庫存", c2:"三文魚",  c3:"剩 8 件 · 低於警戒線",status:"wait",statusText:"已通知供應商"},
        ]},
    },
    "零售":{
      wa:{ avatar:"K", name:"Kelly（網店客戶）", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"想請問黑色短裙 M size 還有沒有貨？", time:"21:45"},
          {dir:"out", text:"Kelly 您好！M size 黑色尚餘 3 件 ✨ 連結：tbc.shop/dress42",
            time:"21:45", tag:"自動回覆"},
          {dir:"in",  text:"運費怎樣計算？",                   time:"21:46"},
          {dir:"out", text:"順豐 $40，滿 $500 免運。Hong Kong 1-2 工作天 📦",
            time:"21:46", tag:"自動回覆"},
          {dir:"out", text:"系統顯示您先前瀏覽過此款，10 分鐘內下單可用優惠碼 SAVE10 即減 $50",
            time:"21:47", tag:"棄車挽回"},
        ]},
      dash:{ url:"app.shop.com/orders", title:"訂單與庫存", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"今日訂單",val:"86"},{label:"客服待回",val:"5"},
          {label:"棄車挽回",val:"+18%"},{label:"低庫存 SKU",val:"7"},
        ],
        rows:[
          {c1:"#4521",c2:"Kelly W.",   c3:"黑色短裙 M · $390",      status:"ok",  statusText:"已確認"},
          {c1:"#4522",c2:"Anna L.",    c3:"白 T-shirt × 2 · $480",  status:"wait",statusText:"等付款"},
          {c1:"棄車",c2:"訪客 #88",   c3:"購物車 $620 · 已發優惠碼",status:"open",statusText:"已發送"},
          {c1:"問", c2:"David C.",    c3:"問運費政策",              status:"wait",statusText:"自動已回覆"},
          {c1:"庫存",c2:"SKU-T-001", c3:"剩 3 件 · 低庫存",         status:"wait",statusText:"已通知供應商"},
        ]},
    },
    "物流":{
      wa:{ avatar:"司", name:"司機阿明", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"今日有幾單？順序點？",          time:"08:10"},
          {dir:"out", text:"阿明早晨！今日 18 單，已按地址 cluster 排好。app 已派出第一張 🚚",
            time:"08:10", tag:"自動派發"},
          {dir:"in",  text:"第一單客沒人簽收",              time:"10:32"},
          {dir:"out", text:"已通知客戶 + 安排明日重派。請繼續下一單 #4502",
            time:"10:32", tag:"自動處理"},
          {dir:"out", text:"#4502 客戶已收到送貨通知，預計到達 11:00", time:"10:33", tag:"自動回覆"},
        ]},
      dash:{ url:"app.logistics.com/dispatch", title:"派遣與庫存", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"今日訂單",val:"80"},{label:"派送中",val:"43"},
          {label:"延誤",val:"2"},{label:"低庫存倉",val:"3"},
        ],
        rows:[
          {c1:"#4521",c2:"陳生 · 沙田", c3:"電子產品 × 2 · 司機阿明",status:"ok",  statusText:"派送中"},
          {c1:"#4522",c2:"Linda · 銅鑼灣",c3:"傢俬 · 司機阿強",       status:"ok",  statusText:"派送中"},
          {c1:"#4523",c2:"陳太 · 沙田",  c3:"日用品 · 簽收失敗",      status:"wait",statusText:"明日重派"},
          {c1:"庫存", c2:"廣州倉",      c3:"USB-C 剩 18 件",          status:"wait",statusText:"自動由港倉調貨"},
          {c1:"客服", c2:"Mark W.",     c3:"查 #4480 物流",            status:"open",statusText:"自動已回覆"},
        ]},
    },
    "創意":{
      wa:{ avatar:"客", name:"客戶 Jenny（餐廳 branding）", status:"在線", inputHint:"輸入訊息",
        messages:[
          {dir:"in",  text:"想請你們做新店 branding，價位如何？",time:"11:05"},
          {dir:"out", text:"Jenny 您好！已發送品牌定位問卷給您（5 分鐘），收到回覆即會生成提案 ✨",
            time:"11:05", tag:"自動回覆"},
          {dir:"in",  text:"問卷填好了",                       time:"14:20"},
          {dir:"out", text:"已生成 3 個方向初步提案 + 報價（HK$ 28K / 48K / 88K）。看完安排短會詳談？",
            time:"14:22", tag:"自動提案"},
          {dir:"in",  text:"中間方向 ok，何時可通話？",       time:"14:35"},
          {dir:"out", text:"明日 15:00 / 16:30 / 後日 11:00 您選哪個？", time:"14:35", tag:"自動排程"},
        ]},
      dash:{ url:"app.studio.com/projects", title:"專案與提案", subtitle:"2026-05-24（星期一）",
        kpis:[
          {label:"新查詢",val:"6"},{label:"進行中",val:"5"},
          {label:"待回饋",val:"3"},{label:"本月已交付",val:"4"},
        ],
        rows:[
          {c1:"#P-21",c2:"Jenny C.",    c3:"餐廳 branding · 提案",   status:"ok",  statusText:"已發出"},
          {c1:"#P-18",c2:"咖啡品牌",    c3:"包裝設計 · 第二輪",      status:"wait",statusText:"待回饋"},
          {c1:"#P-15",c2:"科技初創",    c3:"網站 redesign · 上線",   status:"ok",  statusText:"已交付"},
          {c1:"社交", c2:"IG / 小紅書",  c3:"6 張排期已自動上載",      status:"open",statusText:"自動發布"},
          {c1:"作品集",c2:"月度 update", c3:"已自動生成 · 已推社交",  status:"open",statusText:"自動發布"},
        ]},
    },
  },
  en:{
    "醫美":{
      wa:{ avatar:"M", name:"Mrs Chen", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"Hi, I'd like to book a Hydrafacial", time:"09:23"},
          {dir:"in",  text:"Any slots next Wednesday?",          time:"09:23"},
          {dir:"out", text:"Hi Mrs Chen! Three slots held: 14:00 / 15:30 / 17:00",
            time:"09:23", tag:"AUTO-REPLY"},
          {dir:"in",  text:"15:30 thanks",                       time:"09:24"},
          {dir:"out", text:"Booked: Wed 03/06 15:30 Hydrafacial 60 mins. Auto-reminder 24 hrs prior",
            time:"09:24", tag:"AUTO-CONFIRM"},
        ]},
      dash:{ url:"app.clinic.com/bookings", title:"Today's Bookings", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"Today's bookings",val:"12"},{label:"Pending",val:"3"},
          {label:"New enquiries",val:"8"},{label:"Rebookings this week",val:"18"},
        ],
        rows:[
          {c1:"14:00",c2:"Mrs Chen",c3:"Hydrafacial",       status:"ok",  statusText:"Confirmed"},
          {c1:"14:30",c2:"Anna L.", c3:"Botox",              status:"wait",statusText:"Pending"},
          {c1:"15:30",c2:"Mrs Chen",c3:"Hydrafacial (new)", status:"ok",  statusText:"Confirmed"},
          {c1:"16:00",c2:"Mark Y.", c3:"First consult",      status:"wait",statusText:"Pending"},
          {c1:"16:30",c2:"—",       c3:"Open slot",          status:"open",statusText:"Available"},
        ]},
    },
    "教育":{
      wa:{ avatar:"P", name:"Ms Lam (Parent)", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"My daughter wants to trial the P5 maths class", time:"19:12"},
          {dir:"in",  text:"Any Saturday slots?",                           time:"19:12"},
          {dir:"out", text:"Hi Ms Lam! Three trial slots held: Sat 10:00 / 13:30 / 15:00",
            time:"19:13", tag:"AUTO-REPLY"},
          {dir:"in",  text:"13:30 OK",                                       time:"19:14"},
          {dir:"out", text:"Booked: Sat 30/05 13:30 P5 Maths trial. Auto-reminder the day before",
            time:"19:14", tag:"AUTO-CONFIRM"},
        ]},
      dash:{ url:"app.academy.com/enrolment", title:"Enrolment & Trials", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"Trials this week",val:"24"},{label:"Awaiting follow-up",val:"7"},
          {label:"Renewal pending",val:"15"},{label:"Trial→enrol rate",val:"38%"},
        ],
        rows:[
          {c1:"Sat 10:00",c2:"Lucas C.",  c3:"P3 Chinese · trial",  status:"ok",  statusText:"Confirmed"},
          {c1:"Sat 13:30",c2:"Ms Lam",    c3:"P5 Maths · trial",    status:"ok",  statusText:"Confirmed"},
          {c1:"Sun 14:00",c2:"Sarah Y.",  c3:"F.4 English · trial", status:"wait",statusText:"Pending"},
          {c1:"Sun 16:00",c2:"Chan S.",   c3:"Summer term renewal", status:"wait",statusText:"Awaiting"},
          {c1:"—",       c2:"Top 5 leads",c3:"High-potential trial families",status:"open",statusText:"Assign"},
        ]},
    },
    "專業服務":{
      wa:{ avatar:"H", name:"Mr Ho (Property lead)", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"Interested in 2-bed in Taikoo Shing", time:"14:08"},
          {dir:"in",  text:"Budget ~15M",                          time:"14:08"},
          {dir:"out", text:"Hi Mr Ho! 3 matched units shortlisted (photos + recent comps). Viewing slots: tomorrow 11:00 / 16:00",
            time:"14:09", tag:"AUTO-REPLY"},
          {dir:"in",  text:"16:00 please",                         time:"14:10"},
          {dir:"out", text:"Booked: Tomorrow 25/05 16:00 Taikoo Shing Hoi Tin Mansion Flat D viewing. Address & contact sent 24 hrs prior",
            time:"14:10", tag:"AUTO-CONFIRM"},
        ]},
      dash:{ url:"app.estate.com/leads", title:"Lead Pipeline · Today", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"New leads",val:"14"},{label:"Viewings booked",val:"6"},
          {label:"7-day follow-ups",val:"23"},{label:"Closed this month",val:"3"},
        ],
        rows:[
          {c1:"11:00",c2:"Mr Chan", c3:"Kornhill 3-bed · 2nd viewing", status:"ok",  statusText:"Confirmed"},
          {c1:"14:30",c2:"Anna W.", c3:"Mid-levels studio · 1st",      status:"wait",statusText:"Pending"},
          {c1:"16:00",c2:"Mr Ho",   c3:"Taikoo Shing Hoi Tin D",       status:"ok",  statusText:"Confirmed"},
          {c1:"Day 7",c2:"Ms Lam",  c3:"Auto follow-up (no reply)",    status:"wait",statusText:"Sent"},
          {c1:"New",  c2:"3 listings",c3:"Auto-pushed to matched leads",status:"open",statusText:"Sent"},
        ]},
    },
    "科技":{
      wa:{ avatar:"S", name:"Sarah Chen (Trial user)", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"Hi, just signed up. How do I import my CSV?", time:"10:15"},
          {dir:"out", text:"Hi Sarah! Welcome — Settings → Import. 90-sec walkthrough: tbc.help/import",
            time:"10:15", tag:"AUTO-REPLY"},
          {dir:"in",  text:"Got it, thanks!",                              time:"10:18"},
          {dir:"out", text:"Awesome. I'll check back in 2 days to see how you're settling in",
            time:"10:18", tag:"AUTO-FOLLOWUP"},
          {dir:"out", text:"PS: marked you as high-intent lead — Mark from sales will reach out tomorrow",
            time:"10:18", tag:"INTERNAL"},
        ]},
      dash:{ url:"app.saas.com/crm", title:"Lead Scoring · CRM", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"New signups",val:"30"},{label:"High-score leads",val:"6"},
          {label:"At-risk",val:"4"},{label:"Renewals (30d)",val:"12"},
        ],
        rows:[
          {c1:"Score 92",c2:"Sarah Chen", c3:"Trial · 5/8 features tried", status:"ok",  statusText:"Assigned Mark"},
          {c1:"Score 87",c2:"Acme Corp",  c3:"Enterprise demo viewed",      status:"ok",  statusText:"Assigned Jenny"},
          {c1:"Score 14",c2:"David L.",   c3:"7d inactive · at-risk",      status:"wait",statusText:"CSM task created"},
          {c1:"Renew",   c2:"Globex Inc.",c3:"30d to renew · usage ↑25%",   status:"ok",  statusText:"Auto-upsell"},
          {c1:"P1",      c2:"Ticket #4521",c3:"Bug · API timeout",          status:"open",statusText:"Slack on-call"},
        ]},
    },
    "餐飲":{
      wa:{ avatar:"L", name:"Linda (Booking enquiry)", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"Table for 4 at 7pm tonight?",         time:"15:20"},
          {dir:"out", text:"Hi Linda! 7:00 is full — 6:30 / 7:30 / 8:00 available",
            time:"15:20", tag:"AUTO-REPLY"},
          {dir:"in",  text:"7:30 ok thanks",                       time:"15:21"},
          {dir:"out", text:"Booked: Tonight 7:30 · 4 pax · main floor. Auto-reminder 2 hrs prior",
            time:"15:21", tag:"AUTO-CONFIRM"},
          {dir:"out", text:"Reminder: birthday offer today — 10% off cake", time:"15:21", tag:"BIRTHDAY"},
        ]},
      dash:{ url:"app.bistro.com/booking", title:"Reservations & Ops", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"Tonight's bookings",val:"38"},{label:"Pending",val:"4"},
          {label:"No-show rate",val:"6%"},{label:"Reviews this week",val:"12"},
        ],
        rows:[
          {c1:"18:30",c2:"Mr Chan",c3:"2 pax · window",          status:"ok",  statusText:"Confirmed"},
          {c1:"19:30",c2:"Linda",  c3:"4 pax · main (birthday)",  status:"ok",  statusText:"Confirmed"},
          {c1:"20:00",c2:"David",  c3:"6 pax · private room",     status:"wait",statusText:"Pending"},
          {c1:"Review",c2:"OpenRice",c3:"4-star · good service",    status:"open",statusText:"Reply drafted"},
          {c1:"Stock", c2:"Salmon", c3:"8 left · below threshold",  status:"wait",statusText:"Supplier alerted"},
        ]},
    },
    "零售":{
      wa:{ avatar:"K", name:"Kelly (E-shop customer)", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"Is the black dress M size still in stock?", time:"21:45"},
          {dir:"out", text:"Hi Kelly! 3 in stock — Link: tbc.shop/dress42",
            time:"21:45", tag:"AUTO-REPLY"},
          {dir:"in",  text:"How much is shipping?",                      time:"21:46"},
          {dir:"out", text:"SF Express HK$40, free over HK$500. 1–2 working days",
            time:"21:46", tag:"AUTO-REPLY"},
          {dir:"out", text:"You looked at this dress earlier — use SAVE10 within 10 mins for HK$50 off",
            time:"21:47", tag:"CART RECOVERY"},
        ]},
      dash:{ url:"app.shop.com/orders", title:"Orders & Inventory", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"Today's orders",val:"86"},{label:"Support pending",val:"5"},
          {label:"Cart recovery",val:"+18%"},{label:"Low-stock SKUs",val:"7"},
        ],
        rows:[
          {c1:"#4521",c2:"Kelly W.",   c3:"Black dress M · $390",     status:"ok",  statusText:"Confirmed"},
          {c1:"#4522",c2:"Anna L.",    c3:"White tee × 2 · $480",      status:"wait",statusText:"Awaiting payment"},
          {c1:"Cart",c2:"Visitor #88", c3:"Cart $620 · code sent",      status:"open",statusText:"Sent"},
          {c1:"Q&A", c2:"David C.",    c3:"Asked about shipping",       status:"wait",statusText:"Auto-replied"},
          {c1:"Stock",c2:"SKU-T-001", c3:"3 left · low stock",          status:"wait",statusText:"Supplier alerted"},
        ]},
    },
    "物流":{
      wa:{ avatar:"D", name:"Driver Ming", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"How many drops today and in what order?", time:"08:10"},
          {dir:"out", text:"Morning Ming! 18 drops today, clustered by address. First job already in your app",
            time:"08:10", tag:"AUTO-DISPATCH"},
          {dir:"in",  text:"Job 1 — no one to sign",                  time:"10:32"},
          {dir:"out", text:"Customer notified + tomorrow re-delivery scheduled. Proceed to #4502",
            time:"10:32", tag:"AUTO-HANDLE"},
          {dir:"out", text:"#4502 customer notified, ETA 11:00", time:"10:33", tag:"AUTO-REPLY"},
        ]},
      dash:{ url:"app.logistics.com/dispatch", title:"Dispatch & Inventory", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"Today's orders",val:"80"},{label:"In transit",val:"43"},
          {label:"Delays",val:"2"},{label:"Low-stock WHs",val:"3"},
        ],
        rows:[
          {c1:"#4521",c2:"Chan · Shatin",  c3:"Electronics × 2 · Driver Ming",status:"ok",  statusText:"In transit"},
          {c1:"#4522",c2:"Linda · CWB",    c3:"Furniture · Driver Keung",     status:"ok",  statusText:"In transit"},
          {c1:"#4523",c2:"Mrs Chan · Shatin",c3:"Daily goods · sign failed",   status:"wait",statusText:"Re-deliver"},
          {c1:"Stock", c2:"Guangzhou WH",  c3:"USB-C 18 left",                 status:"wait",statusText:"Auto-transferred"},
          {c1:"Support",c2:"Mark W.",     c3:"Asked about #4480",              status:"open",statusText:"Auto-replied"},
        ]},
    },
    "創意":{
      wa:{ avatar:"J", name:"Jenny (restaurant branding)", status:"online", inputHint:"Type a message",
        messages:[
          {dir:"in",  text:"Want to do branding for our new spot — pricing?", time:"11:05"},
          {dir:"out", text:"Hi Jenny! Just sent you a brand-positioning questionnaire (5 mins). Once back I'll generate a proposal",
            time:"11:05", tag:"AUTO-REPLY"},
          {dir:"in",  text:"Questionnaire done",                              time:"14:20"},
          {dir:"out", text:"3-direction proposal + quote generated (HK$28K / 48K / 88K). Quick call after you've reviewed?",
            time:"14:22", tag:"AUTO-PROPOSAL"},
          {dir:"in",  text:"Middle direction looks good — when can we call?", time:"14:35"},
          {dir:"out", text:"Tomorrow 15:00 / 16:30 or Wed 11:00 — which works?", time:"14:35", tag:"AUTO-SCHEDULE"},
        ]},
      dash:{ url:"app.studio.com/projects", title:"Projects & Proposals", subtitle:"Mon, 2026-05-24",
        kpis:[
          {label:"New enquiries",val:"6"},{label:"In-progress",val:"5"},
          {label:"Awaiting feedback",val:"3"},{label:"Delivered this month",val:"4"},
        ],
        rows:[
          {c1:"#P-21",c2:"Jenny C.",    c3:"Restaurant branding · proposal",  status:"ok",  statusText:"Sent"},
          {c1:"#P-18",c2:"Coffee Co.",  c3:"Packaging design · round 2",      status:"wait",statusText:"Awaiting feedback"},
          {c1:"#P-15",c2:"Tech Startup",c3:"Website redesign · launched",     status:"ok",  statusText:"Delivered"},
          {c1:"Social",c2:"IG / Little Red Book",c3:"6 posts auto-scheduled", status:"open",statusText:"Auto-publish"},
          {c1:"Folio", c2:"Monthly update",c3:"Auto-generated · auto-shared",  status:"open",statusText:"Auto-publish"},
        ]},
    },
  },
};

// Industry → hero descriptor override (pain-point oriented, fills in the lead paragraph under the title)
const INDUSTRY_DESCRIPTOR = {
  zh: {
    "餐飲":   "把訂位確認、訂單跟進、社交內容與顧客重訪交給自動化系統 — 讓您與廚房／樓面同事專注真正服務客人的時間。",
    "零售":   "把客服訊息分類、商品文案、評論回覆、庫存警示交給自動化系統 — 讓您與店員專注真正帶來銷售的工作。",
    "專業服務":"把客戶跟進、會議紀要、報表整理交給自動化系統 — 讓您專注真正高價值的諮詢與決策。",
    "教育":   "把招生跟進、家長溝通、課程提醒、教材內容交給自動化系統 — 讓您與老師專注真正教學的時間。",
    "科技":   "把客服分流、用戶 onboarding、報表彙整、內容更新交給自動化系統 — 讓您與工程團隊專注真正交付產品的時間。",
    "醫美":   "預約自動提醒、漏客重訪召回、療程後跟進、評論即時回覆 — 讓您與員工從重複的 WhatsApp 客服訊息中解放。",
    "物流":   "多倉庫實時庫存、智能調貨推薦、出貨警示、客戶查詢回覆 — 讓您與倉管員工專注真正調度物流的決策。",
    "創意":   "把提案跟進、客戶溝通、社交內容草稿、評論回覆交給自動化系統 — 讓您與創作團隊專注真正創作的時間。",
  },
  en: {
    "餐飲":   "Hand reservation confirmations, order follow-ups, social content and rebooking off to an automated system — so your kitchen and floor team focus on real service.",
    "零售":   "Hand support triage, product copy, review replies and stock alerts off to an automated system — so you and your staff focus on what drives sales.",
    "專業服務":"Hand client follow-ups, meeting notes and reporting off to an automated system — so you focus on the high-value advisory work.",
    "教育":   "Hand enrolment follow-up, parent communication, class reminders and course content off to an automated system — so your teachers focus on teaching.",
    "科技":   "Hand support triage, user onboarding, reporting and content updates off to an automated system — so your engineering team ships the product.",
    "醫美":   "Automated booking reminders, no-show recovery, post-treatment follow-up and instant review replies — so you and your staff stop spending the day on repetitive WhatsApp messages.",
    "物流":   "Real-time multi-warehouse inventory, smart routing, shipping alerts and customer-query replies — so your warehouse team focuses on real logistics decisions.",
    "創意":   "Hand pitch follow-ups, client communication, social drafts and review replies off to an automated system — so your creative team focuses on the actual work.",
  },
};

// Pain → demo idx — tight mapping (only highly relevant demos per pain)
const PAIN_DEMO_MAP = {
  "follow-up": [5],         // Demo 6 sales follow-up
  "content":   [3, 10],     // Demo 4 content + Demo 11 product copy
  "report":    [6],         // Demo 7 meeting notes
  "warehouse": [13, 11],    // Dashboard + Demo 12 warehouse routing
  "support":   [1],         // Demo 2 chat
  "sales":     [5, 4],      // Demo 6 follow-up + Demo 5 intent analyser
  "translate": [7],         // Demo 8 translation
  "review":    [8],         // Demo 9 review reply
};

// Industry default pains (used when user only picks industry, skips pain step)
// Brief #3-C: tightened to reduce generic AI toolbox feel.
// Each industry now surfaces 3–4 demos that match the actual vertical
// workflow (WhatsApp triage, booking follow-up, sales follow-up, etc.)
// rather than overlap on generic content/translation/SEO tools.
const INDUSTRY_DEFAULT_PAINS = {
  "餐飲":   ["follow-up","review","translate"],   // 訂位跟進 + 評論回覆 + 多語客評翻譯
  "零售":   ["support","content","review"],       // 客服 + 商品文案 + 評論回覆
  "專業服務":["follow-up","report","sales","support"], // Lead 跟進 + 會議紀要 + 成交 + 客服
  "教育":   ["support","follow-up","content"],    // 家長客服 + 試堂跟進 + 內容
  "科技":   ["sales","report","support"],         // Lead scoring + 會議紀要 + Support
  "醫美":   ["follow-up","support","review"],     // 預約跟進 + WhatsApp 客服 + 評論回覆
  "物流":   ["warehouse","report","support"],     // 倉儲 + 報表 + 客服查物流
  "創意":   ["content","follow-up","translate"],  // 內容 + 提案跟進 + 國際翻譯
};

// Pain → ROI calculator area chip (data-area attr)
const PAIN_TO_CALC_AREA = {
  "follow-up":"email",
  "content":"content",
  "report":"report",
  "warehouse":"report",
  "support":"support",
  "sales":"sales",
  "translate":"translate",
  "review":"review",
};

let CURRENT_PROFILE = null;

function loadProfile(){
  try{
    const raw = localStorage.getItem(PROFILE_KEY);
    if(!raw) return null;
    const p = JSON.parse(raw);
    if(!p || typeof p !== "object") return null;
    return p;
  }catch(e){ return null; }
}
function saveProfile(p){
  try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }catch(e){}
}
function clearProfile(){
  try{ localStorage.removeItem(PROFILE_KEY); }catch(e){}
}

function applyProfile(profile){
  CURRENT_PROFILE = profile;
  const navProfile = document.getElementById("nav-profile");
  const npLabel    = document.getElementById("np-label");

  // Body-level marker so CSS can hide demos / workflows / ba when there is
  // no profile (safety net in case welcome is somehow bypassed — visitor
  // must NOT see any demo content until they pick an industry).
  document.body.classList.toggle("no-profile", !profile || !profile.industry);

  if(!profile || (!profile.industry && (!profile.pains || profile.pains.length === 0))){
    // No profile — reset everything to default
    if(navProfile) navProfile.classList.remove("show");
    resetHeroFromI18N();
    resetDemoTabsFromProfile();
    resetCalcFromProfile();
    resetPainFromProfile();
    // Show For-You for fresh visitors (no profile)
    const foryou = document.getElementById("for-you");
    if(foryou) foryou.hidden = false;
    return;
  }

  // For-You section — already self-identified, hide entire section
  const foryou = document.getElementById("for-you");
  if(foryou) foryou.hidden = true;

  // 1) Update nav badge — "Name · Industry" or "Industry" if no name
  if(navProfile && npLabel){
    const ind = profile.industry ? industryLabel(profile.industry) : (currentLang==="zh"?"已個人化":"Personalised");
    npLabel.textContent = profile.name ? `${profile.name} · ${ind}` : ind;
    navProfile.classList.add("show");
  }

  // 2) Hero copy — industry-specific title
  if(profile.industry){
    const map = INDUSTRY_HERO[currentLang] || INDUSTRY_HERO.zh;
    const words = map[profile.industry];
    if(words){
      const titleEl = document.getElementById("hero-title");
      if(titleEl){
        titleEl.innerHTML = words.map((w,i) => {
          const cls = i === 1 ? "gradient-text" : "";
          return `<span class="word"><span class="${cls}">${w}</span></span>`;
        }).join(" ");
        if(window.gsap){
          gsap.fromTo("#hero-title .word > span",
            {y:"100%",opacity:0,rotate:6},
            {y:"0%",opacity:1,rotate:0,duration:.7,stagger:.06,ease:"power3.out"});
        }
      }
    }
    // 2a) Hero descriptor — industry-specific pain-point lead paragraph
    applyHeroDescriptorForIndustry(profile.industry);
    // 2b) Real Workflows + Before-After — swap to vertical-specific narrative
    //     (addresses brief #2 root cause: "all verticals sharing the same
    //     medspa-flavored workflow narrative")
    applyWorkflowsForIndustry(profile.industry);
    applyBAForIndustry(profile.industry);
    // 2c) Real-feel mockups — WhatsApp + Dashboard rendered per vertical
    renderMockupsForIndustry(profile.industry);
  }

  // 2b) Hero typed subtitle — personalised greeting (overrides the cycling typing)
  if(profile.name){
    try{ clearTimeout(typeTimer); }catch(e){}
    const typedEl = document.getElementById("typed");
    if(typedEl){
      const greeting = currentLang === "zh"
        ? `Hi ${profile.name}，這裡有為您選好的 AI 方案 ↓`
        : `Hi ${profile.name}, here are the AI solutions we picked for you ↓`;
      typedEl.textContent = greeting;
    }
  }

  // 3) Demo tabs — dim non-relevant, surface relevant
  applyDemoTabsForProfile(profile);

  // 4) ROI calculator pre-fill
  applyCalcForProfile(profile);

  // 5) Pain section — switch to personalised confirmation
  applyPainForProfile(profile);
}

const PAIN_LABEL_ZH = {
  "follow-up":"客戶跟進","content":"內容產出","report":"報表整理",
  "warehouse":"倉庫管理","support":"客服回覆","sales":"銷售跟進",
  "translate":"翻譯溝通","review":"評論回覆",
};
const PAIN_LABEL_EN = {
  "follow-up":"Customer follow-up","content":"Content output","report":"Reporting",
  "warehouse":"Warehouse ops","support":"Customer support","sales":"Sales follow-up",
  "translate":"Translation","review":"Review reply",
};
// R17: emoji icons removed for premium positioning. Renderer falls back to "" via PAIN_ICO[p] lookup which returns undefined.
const PAIN_ICO = {};
function applyPainForProfile(profile){
  const hook = document.getElementById("pain-hook");
  const personal = document.getElementById("pain-personal");
  const tagsRoot = document.getElementById("pain-tags");
  const indLabel = document.getElementById("pain-industry-label");
  if(!hook || !personal) return;

  const pains = (profile.pains && profile.pains.length)
    ? profile.pains
    : (INDUSTRY_DEFAULT_PAINS[profile.industry] || []);
  if(!pains.length){
    // No pains derivable — show generic hook
    hook.hidden = false;
    personal.hidden = true;
    return;
  }
  // Show personalised, hide hook
  hook.hidden = true;
  personal.hidden = false;
  // Label industry
  if(indLabel){
    indLabel.textContent = profile.industry
      ? (currentLang === "zh" ? `${profile.industry}業` : industryLabel(profile.industry))
      : (currentLang === "zh" ? "您的業務" : "your business");
  }
  // Render pain tags
  if(tagsRoot){
    const labels = currentLang === "zh" ? PAIN_LABEL_ZH : PAIN_LABEL_EN;
    tagsRoot.innerHTML = pains.map(p => `
      <div class="pain-tag"><span class="ic">${PAIN_ICO[p] || "✓"}</span><span>${labels[p] || p}</span></div>
    `).join("");
  }
}
function resetPainFromProfile(){
  const hook = document.getElementById("pain-hook");
  const personal = document.getElementById("pain-personal");
  if(hook) hook.hidden = false;
  if(personal) personal.hidden = true;
}

function resetHeroFromI18N(){
  // Restore default hero title from I18N
  if(typeof buildHeroTitle === "function") buildHeroTitle();
  // Restore default hero descriptor from I18N
  const descEl = document.getElementById("hero-descriptor");
  if(descEl){
    const dict = I18N[currentLang] || I18N.zh;
    descEl.textContent = dict["hero.descriptor"] || descEl.textContent;
  }
}

function applyHeroDescriptorForIndustry(industry){
  const descEl = document.getElementById("hero-descriptor");
  if(!descEl) return;
  const map = INDUSTRY_DESCRIPTOR[currentLang] || INDUSTRY_DESCRIPTOR.zh;
  const custom = industry ? map[industry] : null;
  if(custom){
    descEl.textContent = custom;
  } else {
    const dict = I18N[currentLang] || I18N.zh;
    descEl.textContent = dict["hero.descriptor"] || descEl.textContent;
  }
}

/* Apply vertical-specific Real Workflows / Before-After content. Walks
   all elements bound to wf2.* or ba.* i18n keys and replaces their text
   from the matching industry map. Falls back to the default i18n value
   when an industry doesn't define that key (or industry is null). */
function applyVerticalContent(industry, prefix, industryMap){
  const map = industryMap[currentLang] || industryMap.zh;
  const industryDict = industry ? (map[industry] || null) : null;
  const fallback = I18N[currentLang] || I18N.zh;
  document.querySelectorAll(`[data-i18n^="${prefix}"]`).forEach(el => {
    const k = el.getAttribute("data-i18n");
    let v;
    if(industryDict && industryDict[k] != null){
      v = industryDict[k];
    } else {
      v = fallback[k];
    }
    if(typeof v === "string"){ el.textContent = v; }
  });
}
function applyWorkflowsForIndustry(industry){
  applyVerticalContent(industry, "wf2.", INDUSTRY_WORKFLOWS);
}
function applyBAForIndustry(industry){
  applyVerticalContent(industry, "ba.", INDUSTRY_BA);
}

/* Renders the WhatsApp + Dashboard mockups inside #real-feel from
   INDUSTRY_MOCKUPS data. Industry-specific content swaps cleanly on
   industry change or language change (driven by applyProfile +
   applyLang). Missing industries fall back to "醫美". */
function renderMockupsForIndustry(industry){
  const lang = INDUSTRY_MOCKUPS[currentLang] ? currentLang : "zh";
  const dict = INDUSTRY_MOCKUPS[lang];
  const data = (industry && dict[industry]) || dict["醫美"];
  if(!data) return;

  // WhatsApp
  const av = document.getElementById("rf-wa-avatar");
  const nm = document.getElementById("rf-wa-name");
  const st = document.getElementById("rf-wa-status");
  const body = document.getElementById("rf-wa-body");
  const inputHintEl = document.querySelector('[data-i18n="rf.wa.inputHint"]');
  if(av) av.textContent = data.wa.avatar || "·";
  if(nm) nm.textContent = data.wa.name || "";
  if(st) st.textContent = data.wa.status || "";
  if(inputHintEl && data.wa.inputHint) inputHintEl.textContent = data.wa.inputHint;
  if(body){
    body.innerHTML = "";
    (data.wa.messages || []).forEach(m => {
      const el = document.createElement("div");
      el.className = "rf-wa-msg " + (m.dir === "out" ? "out" : "in");
      if(m.tag){
        const tag = document.createElement("div");
        tag.className = "rf-tag";
        tag.textContent = m.tag;
        el.appendChild(tag);
      }
      el.appendChild(document.createTextNode(m.text || ""));
      const t = document.createElement("span");
      t.className = "rf-time";
      t.textContent = m.time || "";
      el.appendChild(t);
      body.appendChild(el);
    });
  }

  // Dashboard
  const url = document.getElementById("rf-dash-url");
  const dTitle = document.getElementById("rf-dash-title");
  const dSub = document.getElementById("rf-dash-subtitle");
  const kpisRoot = document.getElementById("rf-dash-kpis");
  const rowsRoot = document.getElementById("rf-dash-rows");
  if(url) url.textContent = data.dash.url || "";
  if(dTitle) dTitle.textContent = data.dash.title || "";
  if(dSub) dSub.textContent = data.dash.subtitle || "";
  if(kpisRoot){
    kpisRoot.innerHTML = (data.dash.kpis || []).map(k =>
      `<div class="rf-kpi"><div class="rf-kpi-val">${k.val}</div><div class="rf-kpi-label">${k.label}</div></div>`
    ).join("");
  }
  if(rowsRoot){
    rowsRoot.innerHTML = (data.dash.rows || []).map(r =>
      `<div class="rf-row">
        <div class="rf-c1">${r.c1 || ""}</div>
        <div class="rf-c2">${r.c2 || ""}</div>
        <div class="rf-c3">${r.c3 || ""}</div>
        <span class="rf-status ${r.status || "open"}">${r.statusText || ""}</span>
      </div>`
    ).join("");
  }
}

function resetDemoTabsFromProfile(){
  document.querySelectorAll(".demo-tab-btn").forEach(t => {
    t.classList.remove("dim","hidden-by-profile");
  });
  document.querySelectorAll(".demo-slide").forEach(s => {
    s.classList.remove("hidden-by-profile");
  });
  const expandBtn = document.getElementById("demos-expand");
  if(expandBtn) expandBtn.classList.remove("show");
  const tabs = document.getElementById("demos-tabs");
  if(tabs) tabs.classList.remove("collapsed");
  // Restore original demo numbering on tabs (clear sequential renumber)
  restoreDemoTabNumbers();
}

// --- Sequential demo numbering helpers ---
// On first call, snapshot every tab's original .num innerHTML into a data attr
// so we can restore later. Then number visible (non-hidden) tabs as 01, 02, 03…
function renumberDemoTabsSequential(){
  const tabs = Array.from(document.querySelectorAll(".demo-tab-btn"));
  if(!tabs.length) return;
  // Snapshot originals once
  tabs.forEach(t => {
    const numEl = t.querySelector(".num");
    if(!numEl) return;
    if(!t.dataset.origNum){
      t.dataset.origNum = numEl.innerHTML;
    }
  });
  // Sequence visible tabs in DOM order
  let seq = 0;
  tabs.forEach(t => {
    const numEl = t.querySelector(".num");
    if(!numEl) return;
    if(t.classList.contains("hidden-by-profile")){
      // Keep original on hidden ones (doesn't matter, but clean)
      return;
    }
    seq += 1;
    numEl.textContent = String(seq).padStart(2,"0");
  });
}
function restoreDemoTabNumbers(){
  document.querySelectorAll(".demo-tab-btn").forEach(t => {
    const numEl = t.querySelector(".num");
    if(!numEl) return;
    if(t.dataset.origNum){
      numEl.innerHTML = t.dataset.origNum;
    }
  });
}

function resetCalcFromProfile(){
  document.querySelectorAll("#area-chips .area-chip").forEach(c => c.classList.remove("hidden-by-profile"));
}

function applyDemoTabsForProfile(profile){
  const pains = (profile.pains && profile.pains.length)
    ? profile.pains
    : (INDUSTRY_DEFAULT_PAINS[profile.industry] || []);
  if(!pains.length){ resetDemoTabsFromProfile(); return; }

  // Build relevance set: demos referenced by any of the user's pains.
  // Wizard (idx 12) is INTENTIONALLY EXCLUDED — user already filled it on welcome page.
  const relevant = new Set();
  pains.forEach(p => {
    (PAIN_DEMO_MAP[p] || []).forEach(idx => relevant.add(idx));
  });

  // Hard-hide non-relevant demos + Wizard (display:none via .hidden-by-profile)
  document.querySelectorAll(".demo-tab-btn").forEach(t => {
    const idx = +t.dataset.slide;
    const visible = relevant.has(idx);
    t.classList.toggle("hidden-by-profile", !visible);
    t.classList.remove("dim"); // legacy class — clear
  });
  document.querySelectorAll(".demo-slide").forEach(s => {
    const idx = +s.dataset.slideIdx;
    const visible = relevant.has(idx);
    s.classList.toggle("hidden-by-profile", !visible);
  });

  // Hide the legacy expand button (no longer used in welcome flow)
  const expandBtn = document.getElementById("demos-expand");
  if(expandBtn) expandBtn.classList.remove("show");
  const tabsContainer = document.getElementById("demos-tabs");
  if(tabsContainer) tabsContainer.classList.remove("collapsed");

  // Pick the first relevant demo as the active one (welcome-flow visitors should
  // land directly on a demo that solves their problem). Use carousel's
  // go() helper so counters stay in sync.
  const firstPain = pains[0];
  const firstDemoIdx = (PAIN_DEMO_MAP[firstPain] || []).find(i => relevant.has(i));
  if(typeof firstDemoIdx === "number"){
    window.__profileFirstDemo = firstDemoIdx;
    if(typeof window.__carouselSetActive === "function"){
      window.__carouselSetActive(firstDemoIdx);
    } else {
      // Fallback: set active manually (carousel IIFE hasn't run yet)
      document.querySelectorAll(".demo-slide").forEach(s => {
        s.classList.toggle("active", +s.dataset.slideIdx === firstDemoIdx);
      });
      document.querySelectorAll(".demo-tab-btn").forEach(t => {
        t.classList.toggle("active", +t.dataset.slide === firstDemoIdx);
      });
    }
  }
  // Refresh carousel total counter (excludes hidden slides)
  if(typeof window.__carouselSyncTotal === "function") window.__carouselSyncTotal();
  // Renumber visible tabs as 01, 02, 03, … so users see sequential digits
  // instead of jumping (e.g. 02, 04, 06, 13).
  renumberDemoTabsSequential();
}

function resetCalcChips(){
  document.querySelectorAll("#area-chips .area-chip").forEach(c => c.classList.remove("hidden-by-profile"));
}

function applyCalcForProfile(profile){
  const pains = (profile.pains && profile.pains.length)
    ? profile.pains
    : (INDUSTRY_DEFAULT_PAINS[profile.industry] || []);
  if(!pains.length){ resetCalcChips(); return; }

  // Build the set of calc areas relevant to this profile's pains
  const relevantAreas = new Set();
  pains.forEach(p => {
    const a = PAIN_TO_CALC_AREA[p];
    if(a) relevantAreas.add(a);
  });
  if(!relevantAreas.size){ resetCalcChips(); return; }

  // Hide non-relevant area chips
  document.querySelectorAll("#area-chips .area-chip").forEach(c => {
    c.classList.toggle("hidden-by-profile", !relevantAreas.has(c.dataset.area));
  });

  // Make the top-pain area the active one
  const topArea = PAIN_TO_CALC_AREA[pains[0]] || Array.from(relevantAreas)[0];
  const chips = document.querySelectorAll("#area-chips .area-chip");
  chips.forEach(c => c.classList.toggle("active", c.dataset.area === topArea));

  const activeChip = document.querySelector(`#area-chips .area-chip[data-area="${topArea}"]`);
  if(activeChip){
    const hoursInput = document.getElementById("calc-hours");
    if(hoursInput && +hoursInput.value < 5){
      hoursInput.value = 10;
      const hoursLbl = document.getElementById("calc-hours-val");
      if(hoursLbl) hoursLbl.textContent = "10";
    }
    activeChip.dispatchEvent(new Event("click", {bubbles:true}));
  }
}

/* ----------------- WELCOME CONTROLLER ----------------- */
let __welState = { industry:null };

function showWelcome(){
  const w = document.getElementById("welcome");
  if(!w) return;
  w.classList.remove("hidden","leaving");
  w.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  // Reset selections
  document.querySelectorAll("#welcome-industries .wel-chip").forEach(c => c.classList.remove("checked"));
  __welState = { industry:null };
  updateWelcomeEnter();
}

function hideWelcome(){
  const w = document.getElementById("welcome");
  if(!w) return;
  w.classList.add("leaving");
  document.body.style.overflow = "";
  setTimeout(() => { w.classList.add("hidden"); w.setAttribute("aria-hidden", "true"); }, 600);
}

function updateWelcomeEnter(){
  const enter = document.getElementById("welcome-enter");
  const hint  = document.getElementById("welcome-hint");
  if(!enter) return;
  const ok = !!__welState.industry;
  enter.disabled = !ok;
  if(hint){
    if(ok){
      hint.textContent = I18N[currentLang]["welcome.hintReady"] || "✓ 已為您配對好行業方案";
      hint.classList.add("ready");
    } else {
      hint.textContent = I18N[currentLang]["welcome.hint"] || "先選一個行業，AI 即時為您度身打造方案";
      hint.classList.remove("ready");
    }
  }
}

function submitWelcome(){
  if(!__welState.industry) return;
  const profile = {
    industry: __welState.industry,
    // Derive pains from industry default (we don't ask pains on welcome page)
    pains: (INDUSTRY_DEFAULT_PAINS[__welState.industry] || []).slice(),
    lang: currentLang,
    ts: Date.now(),
  };
  saveProfile(profile);
  hideWelcome();
  setTimeout(() => applyProfile(profile), 400);
}

(function bindWelcome(){
  // Industry chips
  document.querySelectorAll("#welcome-industries .wel-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#welcome-industries .wel-chip").forEach(c => c.classList.remove("checked"));
      chip.classList.add("checked");
      __welState.industry = chip.dataset.ind;
      updateWelcomeEnter();
    });
  });
  // Enter button
  const enter = document.getElementById("welcome-enter");
  if(enter) enter.addEventListener("click", submitWelcome);
  // NOTE: Welcome page is intentionally UNSKIPPABLE.
  // The skip button, Esc key dismiss, and "tbc-welcome-dismissed" flag
  // have all been removed so visitors must pick an industry before
  // they can see the main page or any demos. This prevents the
  // "accidental bypass → customer loss" failure mode.
})();

/* ----------------- NAV PROFILE BADGE ----------------- */
(function bindNavProfile(){
  const btn = document.getElementById("nav-profile");
  if(!btn) return;
  btn.addEventListener("click", () => {
    clearProfile();
    try{ localStorage.removeItem("tbc-welcome-dismissed"); }catch(e){}
    applyProfile(null);
    showWelcome();
  });
})();

/* ----------------- BACK-TO-TOP FAB -----------------
   Only shows once the visitor has scrolled past the hero. Clicking
   smoothly scrolls to the top — replaces the old anchor-driven
   "click logo to go to #top" behavior, so the URL stays clean and
   there is no logo-based bypass surface. */
(function bindBackToTop(){
  const btn = document.getElementById("back-to-top");
  if(!btn) return;
  const threshold = 480;
  let ticking = false;
  const update = () => {
    ticking = false;
    btn.classList.toggle("show", window.scrollY > threshold);
  };
  window.addEventListener("scroll", () => {
    if(!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* ----------------- DEMOS EXPAND BUTTON ----------------- */
(function bindDemosExpand(){
  const btn = document.getElementById("demos-expand");
  const tabs = document.getElementById("demos-tabs");
  if(!btn || !tabs) return;
  btn.addEventListener("click", () => {
    const collapsed = tabs.classList.toggle("collapsed");
    const span = btn.querySelector("[data-i18n='demos.expand']");
    if(span){
      span.textContent = collapsed
        ? I18N[currentLang]["demos.expand"]
        : I18N[currentLang]["demos.collapse"];
    }
    btn.querySelector("span:last-child").textContent = collapsed ? "↓" : "↑";
  });
})();

/* ----------------- CONTACT CHANNELS (single source of truth) ----------------- */
// TODO: 石斑 commit 前手動填返真實 WhatsApp 號碼（去除 +、空格、dash）
// 例：+852 1234 5678 → "85212345678"
const CONTACT_WHATSAPP = "85267028853"; // ⬅️ REPLACE WITH REAL HK NUMBER
const CONTACT_TG_HANDLE = "grouper0913";
const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent("您好 TBC，我想了解 AI 自動化方案")}`;
const CONTACT_TG_URL = `https://t.me/${CONTACT_TG_HANDLE}`;

/* ----------------- DEMO END CTA INJECTION ----------------- */
(function injectDemoEndCta(){
  const slides = document.querySelectorAll(".demo-slide");
  if(!slides.length) return;
  slides.forEach(slide => {
    const idx = +slide.dataset.slideIdx;
    // Skip wizard demo (idx 12) — it has its own report CTA
    if(idx === 12) return;
    // Avoid double-injection on hot reloads
    if(slide.querySelector(":scope > .demo-end-cta")) return;
    const cta = document.createElement("div");
    cta.className = "demo-end-cta";
    cta.innerHTML = `
      <div class="dec-text">
        <div class="dec-title" data-i18n="demo.cta.title">想將這類 AI 自動化引入您的業務？</div>
        <div class="dec-sub" data-i18n="demo.cta.sub">免費 30 分鐘諮詢，我們會為您的行業度身設計一套 workflow。</div>
      </div>
      <div class="dec-actions">
        <a href="#book" class="dec-btn primary" data-cta-source="demo-end">
          <span data-i18n="demo.cta.book">預約免費諮詢</span> →
        </a>
        <a href="${CONTACT_WHATSAPP_URL}" target="_blank" rel="noopener" class="dec-btn ghost wa" data-cta-source="demo-end-wa">
          <span>💬</span> <span data-i18n="demo.cta.wa">WhatsApp</span>
        </a>
        <a href="${CONTACT_TG_URL}" target="_blank" rel="noopener" class="dec-btn ghost tg" data-cta-source="demo-end-tg">
          <span>✈️</span> <span data-i18n="demo.cta.tg">Telegram</span>
        </a>
      </div>
    `;
    slide.appendChild(cta);
  });
  // Defer i18n re-apply until after the script finishes parsing — calling
  // applyLang() synchronously here triggers a TDZ ReferenceError because
  // `typeTimer` (let-declared later in the file) hasn't been initialized yet.
  // The injected default text is already in zh which matches the default
  // body.lang-zh, so visual correctness is preserved on first paint.
  setTimeout(() => {
    if(typeof applyLang === "function") applyLang(currentLang);
  }, 0);
})();

/* ----------------- MOBILE STICKY CTA ----------------- */
(function bindMobileSticky(){
  const cta = document.getElementById("mobile-cta");
  if(!cta) return;
  cta.hidden = false; // CSS media query gates desktop hide

  // Wire quick-contact channel links to the constants defined above
  const waLink = document.getElementById("msc-wa");
  const tgLink = document.getElementById("msc-tg");
  if(waLink) waLink.href = CONTACT_WHATSAPP_URL;
  if(tgLink) tgLink.href = CONTACT_TG_URL;
  // Also wire the in-book quick-contact chips (visible on desktop too)
  const bWa = document.getElementById("book-chip-wa");
  const bTg = document.getElementById("book-chip-tg");
  if(bWa) bWa.href = CONTACT_WHATSAPP_URL;
  if(bTg) bTg.href = CONTACT_TG_URL;

  // Speed-dial expand / collapse
  const fabToggle = document.getElementById("mfab-toggle");
  function closeFab(){ cta.classList.remove("open"); if(fabToggle) fabToggle.setAttribute("aria-expanded","false"); }
  if(fabToggle){
    fabToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = cta.classList.toggle("open");
      fabToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    cta.querySelectorAll(".mfab-action").forEach(a => a.addEventListener("click", closeFab));
    document.addEventListener("click", (e) => { if(cta.classList.contains("open") && !cta.contains(e.target)) closeFab(); });
    document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeFab(); });
  }

  let isShown = false;
  function update(){
    const isMobile = window.matchMedia("(max-width: 780px)").matches;
    if(!isMobile){
      if(isShown){ cta.classList.remove("show"); isShown = false; }
      return;
    }
    const scrollY = window.scrollY || window.pageYOffset;
    const hero = document.getElementById("top");
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 600;
    const book = document.getElementById("book");
    const bookTop = book ? book.getBoundingClientRect().top + scrollY : Infinity;
    // Show when scrolled past hero AND book section not yet in viewport
    const viewportBottom = scrollY + window.innerHeight;
    const shouldShow = scrollY > heroBottom * 0.6 && viewportBottom < bookTop + 200;
    if(shouldShow !== isShown){
      cta.classList.toggle("show", shouldShow);
      isShown = shouldShow;
    }
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if(!ticking){
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, {passive:true});
  window.addEventListener("resize", update, {passive:true});
  setTimeout(update, 300);
})();

/* ----------------- MOBILE AI ASSISTANT PANEL ----------------- */
(function mobileAIAssistant(){
  const openBtn = document.getElementById("mfab-ai-open");
  const panel   = document.getElementById("mai-panel");
  if(!openBtn || !panel) return;
  const closeBtn = document.getElementById("mai-close");
  const msgsEl   = document.getElementById("mai-msgs");
  const inputEl  = document.getElementById("mai-input");
  const sendBtn  = document.getElementById("mai-send");
  const fab      = document.getElementById("mobile-cta");

  const MAX_MSGS = 8;      // per-session cap (cost guard)
  const MIN_GAP  = 1200;   // ms between sends (debounce)
  let history = [], userCount = 0, lastSend = 0, seeded = false, busy = false;

  const T = () => (currentLang === "zh") ? {
    greet:"您好！我是 TBC 的 AI 助手，可即時解答 AI 自動化、網頁設計或 AI 內容的問題。想了解費用或合作，隨時可預約免費諮詢。",
    ph:"輸入您的問題…",
    limit:"今日傾咗唔少 — 想深入討論方案同報價，直接預約 15 分鐘免費諮詢最快 👇",
    err:"⚠️ 連接 AI 服務失敗，請稍後再試，或直接 WhatsApp 我們。"
  } : {
    greet:"Hi! I'm TBC's AI assistant. Ask me about AI automation, web design or AI content. For pricing or collaboration, book a free call anytime.",
    ph:"Type your question…",
    limit:"Good chat — for a deeper look at solutions and pricing, booking a free 15-min call is fastest 👇",
    err:"⚠️ Couldn't reach the AI service. Please try again later or WhatsApp us."
  };

  function add(role, text, opts={}){
    const d = document.createElement("div");
    d.className = "chat-msg " + role + (opts.thinking ? " thinking" : "");
    if(opts.thinking){ d.innerHTML = '<span class="dot-typing"><span></span><span></span><span></span></span>'; }
    else { d.textContent = text; }
    msgsEl.appendChild(d); msgsEl.scrollTop = msgsEl.scrollHeight;
    return d;
  }
  function openPanel(){
    inputEl.placeholder = T().ph;
    if(!seeded){ add("bot", T().greet); seeded = true; }
    panel.hidden = false; panel.setAttribute("aria-hidden","false");
    requestAnimationFrame(()=>panel.classList.add("open"));
    if(fab) fab.classList.remove("open");
    setTimeout(()=>inputEl.focus(), 60);
  }
  function closePanel(){
    panel.classList.remove("open"); panel.setAttribute("aria-hidden","true");
    setTimeout(()=>{ panel.hidden = true; }, 250);
  }
  async function send(){
    if(busy) return;
    const text = (inputEl.value || "").trim();
    if(!text) return;
    const now = Date.now();
    if(now - lastSend < MIN_GAP) return;
    if(userCount >= MAX_MSGS){
      add("bot", T().limit);
      inputEl.disabled = true; sendBtn.disabled = true;
      return;
    }
    lastSend = now; userCount++; busy = true;
    inputEl.value = ""; sendBtn.disabled = true;
    add("user", text);
    history.push({role:"user", content:text});
    const thinking = add("bot","",{thinking:true});
    try{
      const reply = await callClaude({
        system: currentLang === "zh"
          ? "你是 TBC Solutions 的 AI 助手。TBC Solutions 由 Grouper 創立，專注 AI 自動化、網頁設計與 AI 內容創作，服務香港中小企。請用友善、專業、簡潔的繁體中文回答，每次 80 字內。不要自行報出具體價錢；若問及報價、方案或合作，請邀請對方預約免費諮詢。"
          : "You are TBC Solutions' AI assistant. TBC Solutions, founded by Grouper, focuses on AI automation, web design and AI content for Hong Kong SMBs. Reply in friendly, professional, concise English (under 70 words). Do not quote specific prices; if asked about pricing, scope or collaboration, invite them to book a free call.",
        messages: history,
      });
      thinking.classList.remove("thinking"); thinking.innerHTML=""; thinking.textContent = reply;
      history.push({role:"assistant", content:reply});
    }catch(e){
      thinking.classList.remove("thinking"); thinking.textContent = T().err;
    }finally{
      busy = false;
      if(userCount < MAX_MSGS){ sendBtn.disabled = false; inputEl.focus(); }
    }
  }
  openBtn.addEventListener("click", e=>{ e.stopPropagation(); openPanel(); });
  closeBtn.addEventListener("click", closePanel);
  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", e=>{ if(e.key==="Enter") send(); });
  const bookLink = document.getElementById("mai-book");
  if(bookLink) bookLink.addEventListener("click", closePanel);
  document.addEventListener("keydown", e=>{ if(e.key==="Escape" && panel.classList.contains("open")) closePanel(); });
})();

/* ----------------- COLD-EMAIL DEEP LINKS -----------------
   Cold-email recipients land on industry-specific URLs like
   ?ind=fnb / ?ind=retail / etc. Welcome page is bypassed and
   the personalised view applies immediately.

   Organic visitors (no ?ind param) still see welcome page.
   --------------------------------------------------------- */
const URL_INDUSTRY_MAP = {
  // Cold-email friendly short keys → internal zh industry key
  "fnb":        "餐飲",
  "restaurant": "餐飲",
  "retail":     "零售",
  "ecommerce":  "零售",
  "pro":        "專業服務",
  "services":   "專業服務",
  "edu":        "教育",
  "education":  "教育",
  "tech":       "科技",
  "saas":       "科技",
  "medical":    "醫美",
  "clinic":     "醫美",
  "logistics":  "物流",
  "warehouse":  "物流",
  "creative":   "創意",
  "design":     "創意",
};
function getIndustryFromURL(){
  try{
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("ind") || params.get("industry") || "").trim().toLowerCase();
    return URL_INDUSTRY_MAP[raw] || null;
  }catch(_){ return null; }
}

/* ----------------- BOOT: decide initial flow ----------------- */
(function bootProfileFlow(){
  setTimeout(() => {
    const urlIndustry = getIndustryFromURL();
    if(urlIndustry){
      // Cold-email recipient — URL overrides any saved profile.
      // Build minimal profile, save it (so subsequent visits keep the
      // industry without needing the param), apply directly, skip welcome.
      const profile = { industry: urlIndustry, pains: [], lang: currentLang, ts: Date.now() };
      saveProfile(profile);
      applyProfile(profile);
      // Flag the body so we can hide the "重新診斷" / Re-diagnose
      // button — cold-email recipients shouldn't see a "reset" option
      // (they never went through the welcome flow themselves).
      document.body.classList.add("from-cold-email");
      return;
    }
    const saved = loadProfile();
    if(saved){
      // Returning visitor — apply directly, no welcome page
      applyProfile(saved);
    } else {
      // No profile = welcome page is mandatory. Always show, regardless of
      // any stale "dismissed" flag (we no longer write that flag) or URL
      // hash. The only way out of welcome is to pick an industry + Enter.
      // Clean up any legacy dismissed flag so older sessions also see welcome.
      try{ localStorage.removeItem("tbc-welcome-dismissed"); }catch(e){}
      showWelcome();
    }
  }, 200);
})();

/* ============== HERO TITLE ANIMATION ============== */
function buildHeroTitle(){
  const el = document.getElementById("hero-title");
  const words = I18N[currentLang]["hero.title"];
  el.innerHTML = words.map((w,i)=>{
    const cls = i === 1 ? "gradient-text" : "";
    return `<span class="word"><span class="${cls}">${w}</span></span>`;
  }).join(" ");
  // animate
  if(window.gsap){
    gsap.to("#hero-title .word > span", {
      y:"0%", duration:1.1, ease:"expo.out", stagger:.12, delay:.2
    });
  }
}

/* ============== TYPING EFFECT ============== */
let typeTimer;
function startTyping(){
  clearTimeout(typeTimer);
  const el = document.getElementById("typed");
  const lines = I18N[currentLang]["hero.typing"];
  let li = 0, ci = 0, deleting = false;
  el.textContent = "";
  function tick(){
    const cur = lines[li];
    if(!deleting){
      el.textContent = cur.slice(0, ++ci);
      if(ci === cur.length){ deleting = true; typeTimer = setTimeout(tick, 1700); return; }
    } else {
      el.textContent = cur.slice(0, --ci);
      if(ci === 0){ deleting = false; li = (li+1) % lines.length; }
    }
    typeTimer = setTimeout(tick, deleting ? 28 : 60);
  }
  tick();
}

/* ============== TOOLS MARQUEE — inline brand SVGs (no network deps) ============== */
/* Each TOOL has a brand color (chip background) and a clean original geometric
   SVG icon (white, single well-formed shape) representing its category.
   Clean / no overlapping paths / no clumping. */
const ICONS = {
  // 4 nodes connected in diamond — represents workflow / automation
  workflow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="6.5" y1="10.5" x2="10.5" y2="6.5"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5"/>
    <line x1="17.5" y1="13.5" x2="13.5" y2="17.5"/><line x1="10.5" y1="17.5" x2="6.5" y2="13.5"/>
    <circle cx="5" cy="12" r="2.2" fill="currentColor"/><circle cx="19" cy="12" r="2.2" fill="currentColor"/>
    <circle cx="12" cy="5" r="2.2" fill="currentColor"/><circle cx="12" cy="19" r="2.2" fill="currentColor"/>
  </svg>`,
  // 4-point sparkle — represents AI / generation
  sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z"/></svg>`,
  // chat bubble — represents AI chat
  bubble:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round">
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="currentColor" fill-opacity=".15"/>
    <circle cx="9" cy="11" r="1.1" fill="currentColor"/><circle cx="12" cy="11" r="1.1" fill="currentColor"/><circle cx="15" cy="11" r="1.1" fill="currentColor"/>
  </svg>`,
  // 3 linked rings — represents make / connecting modules
  rings:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="6.5" cy="12" r="3.5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="12" r="3.5"/>
  </svg>`,
  // lightning bolt — represents instant automation / Zapier
  bolt:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2L4 14h6l-1 8 11-13h-7z"/></svg>`,
  // 3x3 grid (centre highlight) — represents tabular database
  grid3:   `<svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3"  width="5.3" height="5.3" rx="1"/><rect x="9.35" y="3"  width="5.3" height="5.3" rx="1"/><rect x="15.7" y="3"  width="5.3" height="5.3" rx="1"/>
    <rect x="3" y="9.35" width="5.3" height="5.3" rx="1"/><rect x="9.35" y="9.35" width="5.3" height="5.3" rx="1" opacity=".75"/><rect x="15.7" y="9.35" width="5.3" height="5.3" rx="1"/>
    <rect x="3" y="15.7" width="5.3" height="5.3" rx="1"/><rect x="9.35" y="15.7" width="5.3" height="5.3" rx="1"/><rect x="15.7" y="15.7" width="5.3" height="5.3" rx="1"/>
  </svg>`,
  // document — represents notes / Notion
  doc:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round">
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11A1.5 1.5 0 0 0 19 19.5V8z" fill="currentColor" fill-opacity=".15"/>
    <polyline points="14 3 14 8 19 8"/>
    <line x1="8.5" y1="13" x2="15.5" y2="13"/><line x1="8.5" y1="16.5" x2="13" y2="16.5"/>
  </svg>`,
  // 9-dot app launcher — represents productivity suite
  apps:    `<svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="6" r="1.8"/><circle cx="12" cy="6" r="1.8"/><circle cx="18" cy="6" r="1.8"/>
    <circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/>
    <circle cx="6" cy="18" r="1.8"/><circle cx="12" cy="18" r="1.8"/><circle cx="18" cy="18" r="1.8"/>
  </svg>`,
  // globe — represents publishing / web
  globe:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
    <circle cx="12" cy="12" r="9"/>
    <ellipse cx="12" cy="12" rx="4" ry="9"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>`,
  // flowing wave — represents web design / flow
  wave:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9c3-4 6-4 9 0s6 4 9 0"/>
    <path d="M3 15c3-4 6-4 9 0s6 4 9 0" opacity=".55"/>
  </svg>`,
};

const TOOLS = [
  {name:"n8n",              color:"#EA4B71", icon:"workflow"},  // workflow automation
  {name:"Claude AI",        color:"#CC785C", icon:"sparkle"},   // AI assistant
  {name:"ChatGPT",          color:"#10A37F", icon:"bubble"},    // AI chat
  {name:"Make",             color:"#6D00CC", icon:"rings"},     // visual automation
  {name:"Zapier",           color:"#FF4F00", icon:"bolt"},      // instant automation
  {name:"Airtable",         color:"#F82B60", icon:"grid3"},     // database
  {name:"Notion",           color:"#0A0A14", icon:"doc"},       // notes / docs
  {name:"Google Workspace", color:"#4285F4", icon:"apps"},      // productivity suite
  {name:"WordPress",        color:"#21759B", icon:"globe"},     // CMS / web
  {name:"Webflow",          color:"#146EF5", icon:"wave"},      // web design / flow
];

function buildMarquee(){
  const html = TOOLS.map(t => `
    <div class="tool" title="${t.name}">
      <div class="tool-icon" style="background:${t.color}">${ICONS[t.icon] || ""}</div>
      <div class="tool-name">${t.name}</div>
    </div>`).join("");
  document.getElementById("marquee-track").innerHTML  = html;
  document.getElementById("marquee-track-2").innerHTML = html;
}

/* ============== CUSTOM CURSOR ============== */
(function customCursor(){
  if(matchMedia('(pointer:coarse)').matches) return;
  const dot  = document.createElement('div'); dot.className  = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  document.body.classList.add('has-cursor');

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
  });
  document.addEventListener('mousedown', ()=>ring.classList.add('click'));
  document.addEventListener('mouseup',   ()=>ring.classList.remove('click'));

  function loop(){
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  // hover state — re-bind on dynamic content too
  function bindHover(){
    document.querySelectorAll('a, button, .tool, [data-mouse], input, textarea, select, .platform-btn, .lang-switch button')
      .forEach(el => {
        if(el.dataset.cursorBound) return;
        el.dataset.cursorBound = '1';
        el.addEventListener('mouseenter', ()=>ring.classList.add('hover'));
        el.addEventListener('mouseleave', ()=>ring.classList.remove('hover'));
      });
  }
  bindHover();
  // re-bind whenever new chat/marquee items get added
  const mo = new MutationObserver(bindHover);
  mo.observe(document.body, {childList:true, subtree:true});
})();

/* ============== CONSTELLATION BG (stars + light filaments + cursor pull) ============== */
(function constellation(){
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  let w, h, dpr = Math.min(window.devicePixelRatio||1, 2);
  let stars = [];
  let mouse = {x:-9999,y:-9999, active:false};

  // theme-aware palette
  let palette = paletteFor(document.documentElement.dataset.theme || "dark");
  function paletteFor(theme){
    if(theme === "light"){
      return {
        coreA:   a => `rgba(40,30,90,${Math.min(1,a*1.4)})`,
        glow0:   a => `rgba(80,60,180,${a*.85})`,
        glow1:   a => `rgba(124,92,255,${a*.5})`,
        glow2:   _ => `rgba(124,92,255,0)`,
        link1:   t => `rgba(110,80,220,${t*.35})`,
        link2:   t => `rgba(60,140,200,${t*.35})`,
        cursorL: t => `rgba(40,30,90,${t*.5})`,
      };
    }
    return {
      coreA:   a => `rgba(255,255,255,${Math.min(1,a*1.6)})`,
      glow0:   a => `rgba(255,255,255,${a})`,
      glow1:   a => `rgba(200,190,255,${a*.45})`,
      glow2:   _ => `rgba(124,92,255,0)`,
      link1:   t => `rgba(180,150,255,${t*.45})`,
      link2:   t => `rgba(140,210,255,${t*.45})`,
      cursorL: t => `rgba(255,255,255,${t*.55})`,
    };
  }
  // Expose hook for theme toggle
  window.__onThemeChange = (theme) => { palette = paletteFor(theme); };

  function resize(){
    w = window.innerWidth; h = window.innerHeight;
    canvas.width  = w*dpr; canvas.height = h*dpr;
    canvas.style.width = w+"px"; canvas.style.height = h+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener("resize", ()=>{ resize(); seed(); });

  // mouse follows for cursor-pull effect
  window.addEventListener("mousemove", e=>{ mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  window.addEventListener("mouseleave",()=>{ mouse.active = false; });

  function seed(){
    const N = Math.round(Math.min(160, w/9));   // density
    stars = [];
    for(let i=0;i<N;i++){
      stars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        vx:(Math.random()-.5)*.18,
        vy:(Math.random()-.5)*.18,
        r: Math.random()*1.2 + .35,             // small star size
        baseAlpha: Math.random()*.5 + .35,
        twPhase: Math.random()*Math.PI*2,
        twSpeed: .015 + Math.random()*.025,
      });
    }
  }
  seed();

  const LINK_DIST = 130;     // how far stars connect
  const MOUSE_RADIUS = 180;  // cursor pull radius

  function tick(){
    ctx.clearRect(0,0,w,h);

    // update + draw stars
    for(const s of stars){
      // mouse subtle pull
      if(mouse.active){
        const dx = mouse.x - s.x, dy = mouse.y - s.y;
        const d = Math.hypot(dx,dy);
        if(d < MOUSE_RADIUS){
          const f = (1 - d/MOUSE_RADIUS) * .04;
          s.vx += (dx/d) * f;
          s.vy += (dy/d) * f;
        }
      }
      // gentle damping so they don't run away
      s.vx *= .992; s.vy *= .992;
      s.x += s.vx; s.y += s.vy;
      // wrap edges
      if(s.x < -10) s.x = w+10;
      if(s.x > w+10) s.x = -10;
      if(s.y < -10) s.y = h+10;
      if(s.y > h+10) s.y = -10;

      // twinkle
      s.twPhase += s.twSpeed;
      const tw = .55 + .45 * Math.sin(s.twPhase);
      const a = s.baseAlpha * tw;

      // soft glow
      const grd = ctx.createRadialGradient(s.x,s.y,0, s.x,s.y, s.r*5);
      grd.addColorStop(0,  palette.glow0(a));
      grd.addColorStop(.4, palette.glow1(a));
      grd.addColorStop(1,  palette.glow2(a));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(s.x,s.y, s.r*5, 0, Math.PI*2);
      ctx.fill();

      // crisp core
      ctx.fillStyle = palette.coreA(a);
      ctx.beginPath();
      ctx.arc(s.x,s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // light filaments between nearby stars
    for(let i=0;i<stars.length;i++){
      for(let j=i+1;j<stars.length;j++){
        const a = stars[i], b = stars[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d = Math.hypot(dx,dy);
        if(d < LINK_DIST){
          const t = 1 - d/LINK_DIST;
          const grad = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          grad.addColorStop(0, palette.link1(t));
          grad.addColorStop(1, palette.link2(t));
          ctx.strokeStyle = grad;
          ctx.lineWidth = .7;
          ctx.beginPath();
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
      // bright link from cursor
      if(mouse.active){
        const dx = stars[i].x - mouse.x, dy = stars[i].y - mouse.y;
        const d = Math.hypot(dx,dy);
        if(d < MOUSE_RADIUS){
          const t = 1 - d/MOUSE_RADIUS;
          ctx.strokeStyle = palette.cursorL(t);
          ctx.lineWidth = .9;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ============== ANIMATED COUNTERS ============== */
(function counters(){
  function animate(el, target, duration=1700){
    const start = performance.now();
    function step(now){
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el = e.target;
        const n  = el.querySelector("[data-target]");
        const n2 = el.querySelector("[data-target-2]");
        if(n && !n.dataset.done){ n.dataset.done = "1"; animate(n, +n.dataset.target); }
        if(n2 && !n2.dataset.done){ n2.dataset.done = "1"; animate(n2, +n2.dataset.target2 || +n2.getAttribute("data-target-2")); }
        io.unobserve(el);
      }
    });
  }, {threshold:.4});
  document.querySelectorAll(".stat-big").forEach(el=>io.observe(el));
})();

/* ============== FAQ ACCORDION ============== */
(function faq(){
  document.querySelectorAll(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    if(!q) return;
    q.addEventListener("click", () => {
      item.classList.toggle("open");
    });
  });
})();

/* ============== ROI CALCULATOR ============== */
(function calculator(){
  const chips     = document.querySelectorAll(".area-chip");
  const hours     = document.getElementById("calc-hours");
  const hoursVal  = document.getElementById("calc-hours-val");
  const rate      = document.getElementById("calc-rate");
  const currency  = document.getElementById("calc-currency");
  const savedH    = document.getElementById("calc-saved-h");
  const savedM    = document.getElementById("calc-saved-money");
  if(!chips.length || !hours) return;

  // Sensible default hourly rate per currency + locale + display symbol.
  // Keep currency code short & visible.
  const CURRENCIES = {
    HKD:{ sym:"HK$", default:300,  locale:"en-HK", decimals:0 },
    USD:{ sym:"US$", default:50,   locale:"en-US", decimals:0 },
    EUR:{ sym:"€",   default:45,   locale:"de-DE", decimals:0 },
    GBP:{ sym:"£",   default:40,   locale:"en-GB", decimals:0 },
    JPY:{ sym:"¥",   default:5000, locale:"ja-JP", decimals:0 },
    CNY:{ sym:"¥",   default:200,  locale:"zh-CN", decimals:0 },
    TWD:{ sym:"NT$", default:1500, locale:"zh-TW", decimals:0 },
    SGD:{ sym:"S$",  default:60,   locale:"en-SG", decimals:0 },
    AUD:{ sym:"A$",  default:70,   locale:"en-AU", decimals:0 },
    CAD:{ sym:"C$",  default:65,   locale:"en-CA", decimals:0 },
    KRW:{ sym:"₩",   default:60000,locale:"ko-KR", decimals:0 },
    MYR:{ sym:"RM",  default:200,  locale:"ms-MY", decimals:0 },
    THB:{ sym:"฿",   default:1500, locale:"th-TH", decimals:0 },
    PHP:{ sym:"₱",   default:2000, locale:"en-PH", decimals:0 },
    INR:{ sym:"₹",   default:3000, locale:"en-IN", decimals:0 },
  };

  let mult = .70; // default for "email"
  let userTouchedRate = false; // don't override rate if user manually edited

  function fmt(v, code){
    const c = CURRENCIES[code] || CURRENCIES.HKD;
    try{
      return c.sym + " " + Math.round(v).toLocaleString(c.locale, {maximumFractionDigits:0});
    }catch(e){
      return c.sym + " " + Math.round(v).toLocaleString();
    }
  }

  function update(){
    const wHrs = +hours.value;
    const monthly = wHrs * mult * 4.33;       // weeks per month
    const hRate   = +rate.value || 0;
    const cost    = monthly * hRate;
    const code    = currency.value;

    animateText(savedH, +savedH.textContent || 0, Math.round(monthly), 600);
    animateText(savedM, parseInt((savedM.textContent.replace(/[^\d]/g,"")||"0"),10), Math.round(cost), 700,
      v => fmt(v, code));

    hoursVal.textContent = wHrs;
    const pct = ((wHrs - hours.min) / (hours.max - hours.min)) * 100;
    hours.style.setProperty("--pct", pct + "%");
  }

  function animateText(el, from, to, dur=600, fn = v=>v){
    const start = performance.now();
    function step(now){
      const t = Math.min(1,(now-start)/dur);
      const eased = 1 - Math.pow(1-t, 3);
      const v = Math.round(from + (to-from)*eased);
      el.textContent = fn(v);
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  chips.forEach(c=>{
    c.addEventListener("click", ()=>{
      chips.forEach(x=>x.classList.remove("active"));
      c.classList.add("active");
      mult = parseFloat(c.dataset.rate) || .7;
      update();
    });
  });

  hours.addEventListener("input", update);
  rate.addEventListener("input",  ()=>{ userTouchedRate = true; update(); });

  // when user picks a different currency, swap to that currency's sensible default
  // (unless they manually overrode the rate already — then keep their value)
  currency.addEventListener("change", ()=>{
    const c = CURRENCIES[currency.value] || CURRENCIES.HKD;
    if(!userTouchedRate){
      rate.value = c.default;
    }
    update();
  });

  update();
})();

/* ============== REVEAL ON SCROLL ============== */
(function reveal(){
  const els = document.querySelectorAll(".reveal");
  if(!("IntersectionObserver" in window)){
    // Old browser: just show everything
    els.forEach(el=>el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.05, rootMargin:"0px 0px -5% 0px"});
  els.forEach(el=>io.observe(el));

  // Safety net: if anything is still hidden after 2s, force-show it.
  // Prevents the page from ever appearing blank due to layout/timing issues.
  setTimeout(()=>{
    document.querySelectorAll(".reveal:not(.in)").forEach(el=>el.classList.add("in"));
  }, 2000);
})();

/* ============== NAV SCROLLED ============== */
window.addEventListener("scroll", ()=>{
  document.getElementById("nav").classList.toggle("scrolled", window.scrollY > 30);
});

/* ============== SERVICE CARD MOUSE GLOW ============== */
document.querySelectorAll("[data-mouse]").forEach(card=>{
  card.addEventListener("mousemove", e=>{
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", (e.clientX-r.left)+"px");
    card.style.setProperty("--my", (e.clientY-r.top)+"px");
  });
});

function wait(ms){ return new Promise(r=>setTimeout(r,ms)) }

/* ===========================================================
   CAROUSEL — tabs + arrows + counter
   =========================================================== */
(function carousel(){
  const slides = document.querySelectorAll(".demo-slide");
  const tabs   = document.querySelectorAll(".demo-tab-btn");
  const prev   = document.getElementById("carousel-prev");
  const next   = document.getElementById("carousel-next");
  const cur    = document.getElementById("carousel-current");
  const total  = document.getElementById("carousel-total");
  if(!slides.length) return;

  // Default visual order (no profile): Wizard first, then 01..12, then Dashboard
  const DEFAULT_ORDER = [12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13];

  // Visible order = profile-filtered list if profile is active, else DEFAULT_ORDER
  function visibleOrder(){
    return DEFAULT_ORDER.filter(i => {
      const slide = document.querySelector(`.demo-slide[data-slide-idx="${i}"]`);
      return slide && !slide.classList.contains("hidden-by-profile");
    });
  }
  function displayPos(i){
    const order = visibleOrder();
    const p = order.indexOf(i);
    return p === -1 ? 1 : p + 1;
  }
  function syncTotal(){
    total.textContent = String(visibleOrder().length);
  }
  function nextVisible(curIdx){
    const order = visibleOrder();
    if(!order.length) return curIdx;
    const p = order.indexOf(curIdx);
    return order[(p + 1 + order.length) % order.length];
  }
  function prevVisible(curIdx){
    const order = visibleOrder();
    if(!order.length) return curIdx;
    const p = order.indexOf(curIdx);
    return order[(p - 1 + order.length) % order.length];
  }
  syncTotal();

  // initial idx = the slide that currently has .active (so we honour HTML default)
  const initActive = document.querySelector(".demo-slide.active");
  let idx = initActive ? +initActive.dataset.slideIdx : 0;
  if(isNaN(idx)) idx = 0;

  function go(i){
    // Don't navigate to a hidden slide — fall back to next visible
    const target = document.querySelector(`.demo-slide[data-slide-idx="${i}"]`);
    if(target && target.classList.contains("hidden-by-profile")){
      i = nextVisible(idx);
    }
    idx = i;
    slides.forEach(s => s.classList.toggle("active", +s.dataset.slideIdx === idx));
    tabs  .forEach(t => t.classList.toggle("active", +t.dataset.slide === idx));
    cur.textContent = displayPos(idx);
  }
  // sync counter to initial active slide
  cur.textContent = displayPos(idx);
  tabs.forEach(t => t.addEventListener("click", ()=>go(+t.dataset.slide)));
  prev.addEventListener("click", ()=>go(prevVisible(idx)));
  next.addEventListener("click", ()=>go(nextVisible(idx)));
  // keyboard arrows when carousel area is in view
  document.addEventListener("keydown", e=>{
    if(["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if(e.key === "ArrowLeft")  go(prevVisible(idx));
    if(e.key === "ArrowRight") go(nextVisible(idx));
  });

  // Expose so applyProfile can refresh counter after hiding slides
  window.__carouselSyncTotal = syncTotal;
  window.__carouselSetActive = (i) => go(i);
})();

/* ===========================================================
   DEMO PREVIEW ANIMATIONS — auto-play sample on first view
   per slide (no API spend; cancelled if user interacts)
   =========================================================== */
(function previews(){
  const playedSlides = new Set();
  let playToken = 0;

  function cancelPreview(){ playToken++; }
  async function gate(ms, token){ await wait(ms); return token === playToken; }
  async function typeInput(el, text, token, speed=22){
    el.value = "";
    for(const ch of text){ if(token !== playToken) return false; el.value += ch; await wait(speed); }
    return true;
  }
  async function typeText(el, text, token, speed=14){
    el.textContent = "";
    for(const ch of text){ if(token !== playToken) return false; el.textContent += ch; await wait(speed); }
    return true;
  }

  // ----- sample data per demo (zh / en) -----
  function S1(){
    return currentLang === "zh" ? {
      input:"我想自動發送跟進郵件給未回覆的客戶",
      nodes:[
        {icon:"⚡", title:"觸發監測", desc:"每日掃描 CRM 中 7 天未回覆的客戶"},
        {icon:"🔍", title:"篩選條件", desc:"排除已回覆或標記不聯絡的紀錄"},
        {icon:"🤖", title:"AI 個人化", desc:"根據過往互動產生專屬跟進內容"},
        {icon:"✉️", title:"發送郵件", desc:"經 Gmail / Outlook 自動分批寄出"},
        {icon:"📊", title:"成果記錄", desc:"開信、點擊率自動同步至 Notion"},
      ], hours:32,
      thinkLabel:"AI 正在拆解您的工作流程…",
      doneLine:`✅ <strong>5 步流程設計完成</strong> · 預估每月節省 <strong>32 小時</strong>。<br><span style="color:var(--text-dim);font-size:13px">↑ 這是範例。輸入您自己的業務問題，AI 會即時為您拆解。</span>`,
    } : {
      input:"Auto follow-up emails to clients silent for 7+ days",
      nodes:[
        {icon:"⚡", title:"Trigger", desc:"Scan CRM daily for clients silent 7+ days"},
        {icon:"🔍", title:"Filter", desc:"Exclude already-replied or do-not-contact"},
        {icon:"🤖", title:"AI personalize", desc:"Generate tailored copy from past context"},
        {icon:"✉️", title:"Send", desc:"Auto-send via Gmail / Outlook in batches"},
        {icon:"📊", title:"Track", desc:"Open & click rates pushed to Notion"},
      ], hours:32,
      thinkLabel:"AI is breaking down your workflow…",
      doneLine:`✅ <strong>5-step workflow ready</strong> · estimated savings: <strong>32 hrs / month</strong>.<br><span style="color:var(--text-dim);font-size:13px">↑ Sample. Enter your own problem and AI will tailor the workflow.</span>`,
    };
  }
  function S2(){
    return currentLang === "zh" ? {
      q:"請問你們的 AI 自動化方案大約多少錢？",
      a:"謝謝您的查詢！我們按專案 scope 報價：簡單自動化由 HK$ 3,000 起，完整 AI 系統視乎複雜度由 HK$ 30,000 起。歡迎預約 30 分鐘免費諮詢，我會根據您的業務給出詳細估算 ☕",
    } : {
      q:"How much does your AI automation cost?",
      a:"Thanks for asking! We quote per project scope: simple automation starts at HK$ 3,000; full AI systems start at HK$ 30,000 depending on complexity. Book a free 30-min consultation and I'll give you a tailored estimate ☕",
    };
  }
  function S3(){
    return currentLang === "zh" ? {
      name:"晨光咖啡", industry:"餐飲", slug:"morning-light",
      hero_title:"從一杯咖啡開始，喚醒你的早晨",
      hero_sub:"精選莊園豆，現場手沖，為都市人帶來慢生活儀式感。",
      cta_primary:"立即訂閱",
      stats:[
        {n:"5+", l:"年烘焙經驗"},
        {n:"200+", l:"訂閱客戶"},
        {n:"4.9★", l:"客戶評價"},
      ],
      services:[
        {icon:"☕", title:"門市直送", desc:"凌晨烘焙、當日送達，鮮度滿分"},
        {icon:"📦", title:"月度訂閱", desc:"每月精選 3 款莊園豆"},
        {icon:"🎓", title:"咖啡課程", desc:"週末小班授課，從入門到杯測"},
      ],
      testimonial:{
        quote:"咖啡香氣濃郁但不苦澀，每月都有驚喜。送禮自用都得體，已介紹同事一起訂。",
        author:"Anna 陳 · 廣告公司創意總監",
      },
      final_title:"今日就讓咖啡香喚醒你",
      final_sub:"首月訂閱限時 8 折，隨時可暫停或取消。",
      final_btn:"開始訂閱",
      color:"#a8552d",
      thinkLabel:"AI 正在生成完整網頁設計…",
    } : {
      name:"Morning Light", industry:"F&B", slug:"morning-light",
      hero_title:"Start your day with a perfect cup",
      hero_sub:"Hand-poured single-origin beans, roasted daily — a slower morning ritual.",
      cta_primary:"Subscribe now",
      stats:[
        {n:"5+", l:"Years roasting"},
        {n:"200+", l:"Subscribers"},
        {n:"4.9★", l:"Customer rating"},
      ],
      services:[
        {icon:"☕", title:"Same-day delivery", desc:"Roasted at dawn, in your hands by noon"},
        {icon:"📦", title:"Monthly subscription", desc:"3 curated single-origin beans every month"},
        {icon:"🎓", title:"Coffee classes", desc:"Weekend small-group sessions, basics to cupping"},
      ],
      testimonial:{
        quote:"Rich aroma without the bitter edge — every month brings a new surprise. Already got my whole team subscribed.",
        author:"Anna Chan · Creative Director, Kindred Agency",
      },
      final_title:"Wake up to better coffee today",
      final_sub:"First month 20% off. Pause or cancel anytime.",
      final_btn:"Get started",
      color:"#a8552d",
      thinkLabel:"AI is designing the full homepage…",
    };
  }
  function S4(){
    return currentLang === "zh" ? {
      platform:"instagram",
      topic:"宣傳新推出的咖啡訂閱方案，目標客群是上班族",
      output:`☕ 還在每朝為了一杯好咖啡排隊嗎？\n\n我們全新推出的訂閱方案幫你解決早晨煩惱 — 每月精選 3 款莊園豆，直送辦公室或家中。\n\n🔸 自動配送，無需操心\n🔸 每月限量莊園豆\n🔸 隨時可暫停 / 取消\n\n首月 8 折，立即試試 → 連結在 bio\n\n#訂閱咖啡 #手沖咖啡 #上班族日常 #SlowMorning`,
    } : {
      platform:"instagram",
      topic:"Promote our new coffee subscription for office workers",
      output:`☕ Tired of queuing every morning?\n\nOur new subscription drops 3 single-origin beans to your office every month — no more morning stress.\n\n🔸 Auto delivery, zero hassle\n🔸 Limited monthly farms\n🔸 Pause or cancel anytime\n\nFirst month 20% off — link in bio\n\n#CoffeeSubscription #PourOver #SlowMorning #OfficeLife`,
    };
  }
  function S5(){
    return currentLang === "zh" ? {
      input:"我訂單已經 7 日仍未收到，再不送到我會投訴！",
      urgency:"高", mood:"負面", category:"投訴",
      reply:"陳先生您好，非常抱歉讓您久等。我已即時為您查詢訂單狀態，並會於 1 小時內提供確切送達時間。對於延誤造成的不便，我們會主動補償，並全程跟進確保您今日能收到包裹。",
    } : {
      input:"My order is 7 days late and STILL not here. I'm filing a complaint if it doesn't arrive!",
      urgency:"High", mood:"Negative", category:"Complaint",
      reply:"Hi Mr. Chan, sincere apologies for the long wait. I'm checking your order status now and will confirm a delivery time within the hour. We'll proactively compensate for the delay and personally track this until your package arrives today.",
    };
  }
  function S6(){
    return currentLang === "zh" ? {
      name:"陳先生",
      company:"晨光咖啡 / 餐飲",
      ctx:"上週談過 AI 自動點餐系統，客戶有興趣但尚未決定",
      to:"陳先生 <morning-light@coffee.com>",
      subject:"為晨光咖啡準備了一份點餐系統試算 ☕",
      body:"陳先生您好，\n\n感謝上週撥冗交流晨光咖啡的點餐流程。我特別針對您門市規模準備了一份試算：估計每月可節省 28 小時人手、訂單錯誤率下降約 65%。\n\n如果這個方向可行，下週方便安排一次 30 分鐘 demo 嗎？只需 demo 完，您就可以判斷是否值得進一步討論。\n\n期待您的回覆。\n\nGrouper｜TBC Solutions",
    } : {
      name:"Mr. Chan",
      company:"Morning Light / F&B",
      ctx:"Discussed AI ordering system last week; interested but undecided",
      to:"Mr. Chan <morning-light@coffee.com>",
      subject:"A quick ROI sketch for Morning Light's ordering system ☕",
      body:"Hi Mr. Chan,\n\nThanks for the chat last week about Morning Light's ordering flow. I put together a quick estimate based on your shop size: ~28 staff-hours saved per month and ~65% fewer order errors.\n\nIf this looks worthwhile, can we set up a 30-min demo next week? After the demo you can decide whether it's worth exploring further.\n\nLooking forward to hearing from you.\n\nGrouper | TBC Solutions",
    };
  }

  // ----- play functions -----
  async function playDemo1(token){
    const inEl = document.getElementById("wf-input");
    const dyEl = document.getElementById("wf-dynamic");
    const reEl = document.getElementById("wf-result");
    if(!inEl || !dyEl) return;
    const s = S1();
    reEl.classList.remove("show");
    if(!await typeInput(inEl, s.input, token)) return;
    if(!await gate(400, token)) return;
    dyEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-dim);font-size:13.5px"><div class="dot-typing" style="justify-content:center"><span></span><span></span><span></span></div><div style="margin-top:12px">${s.thinkLabel}</div></div>`;
    if(!await gate(1100, token)) return;
    dyEl.innerHTML = s.nodes.map((n,i)=>`
      <div class="wf-step-card">
        <span class="step-num">${String(i+1).padStart(2,"0")}</span>
        <div class="icon">${n.icon}</div>
        <div class="title">${n.title}</div>
        <div class="desc">${n.desc}</div>
      </div>`).join("");
    const cards = dyEl.querySelectorAll(".wf-step-card");
    for(const c of cards){
      if(token !== playToken) return;
      await wait(200);
      c.classList.add("show");
    }
    if(!await gate(300, token)) return;
    reEl.innerHTML = s.doneLine;
    reEl.classList.add("show");
  }

  async function playDemo2(token){
    const msgs = document.getElementById("chat-msgs");
    if(!msgs) return;
    const s = S2();
    if(!await gate(700, token)) return;
    const userBubble = document.createElement("div");
    userBubble.className = "chat-msg user";
    msgs.appendChild(userBubble);
    msgs.scrollTop = msgs.scrollHeight;
    if(!await typeText(userBubble, s.q, token, 22)) return;
    if(!await gate(500, token)) return;
    const botBubble = document.createElement("div");
    botBubble.className = "chat-msg bot thinking";
    botBubble.innerHTML = `<span class="dot-typing"><span></span><span></span><span></span></span>`;
    msgs.appendChild(botBubble);
    msgs.scrollTop = msgs.scrollHeight;
    if(!await gate(1100, token)) return;
    botBubble.classList.remove("thinking");
    botBubble.innerHTML = "";
    if(!await typeText(botBubble, s.a, token, 14)) return;
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function playDemo3(token){
    const nameEl = document.getElementById("wg-name");
    const indEl  = document.getElementById("wg-industry");
    const urlEl  = document.getElementById("wg-url");
    const bodyEl = document.getElementById("wg-body");
    if(!nameEl) return;
    const s = S3();
    if(!await typeInput(nameEl, s.name, token, 26)) return;
    if(!await gate(280, token)) return;
    if(!await typeInput(indEl, s.industry, token, 26)) return;
    if(!await gate(400, token)) return;
    // url typing
    const target = `https://${s.slug}.com`;
    urlEl.textContent = "https://";
    for(let i=0;i<target.length-8;i++){
      if(token !== playToken) return;
      await wait(35);
      urlEl.textContent = "https://" + target.slice(8, 8+i+1);
    }
    bodyEl.innerHTML = `<div class="preview-empty"><div class="dot-typing" style="justify-content:center"><span></span><span></span><span></span></div><div style="margin-top:12px">${s.thinkLabel}</div></div>`;
    if(!await gate(1300, token)) return;
    if(typeof renderRichPreview === "function"){
      renderRichPreview(bodyEl, {
        name: s.name, industry: s.industry,
        heroTitle: s.hero_title, heroSub: s.hero_sub,
        ctaPrimary: s.cta_primary,
        stats: s.stats, services: s.services,
        testimonial: s.testimonial,
        finalTitle: s.final_title, finalSub: s.final_sub, finalBtn: s.final_btn,
        color: s.color, lang: currentLang,
      });
    }
  }

  async function playDemo4(token){
    const topEl = document.getElementById("cg-topic");
    const outEl = document.getElementById("cg-output");
    if(!topEl) return;
    const s = S4();
    // platform already 'instagram' by default
    if(!await typeInput(topEl, s.topic, token, 22)) return;
    if(!await gate(500, token)) return;
    outEl.innerHTML = `<span class="placeholder">${currentLang==="zh"?"AI 生成中…":"AI is writing…"}</span>`;
    if(!await gate(1200, token)) return;
    outEl.innerHTML = `<div class="platform-tag instagram">Instagram</div><span id="cg-stream"></span>`;
    const stream = document.getElementById("cg-stream");
    if(!await typeText(stream, s.output, token, 12)) return;
  }

  async function playDemo5(token){
    const inEl = document.getElementById("ia-input");
    if(!inEl) return;
    const s = S5();
    const setText = (id,v)=>{ const e=document.getElementById(id); if(e) e.textContent = v; };
    setText("ia-urgency","—"); setText("ia-mood","—"); setText("ia-category","—");
    setText("ia-reply", currentLang==="zh"?"分析後 AI 會撰寫專屬回覆…":"AI will draft a tailored reply here…");
    if(!await typeInput(inEl, s.input, token, 22)) return;
    if(!await gate(450, token)) return;
    setText("ia-urgency","…"); setText("ia-mood","…"); setText("ia-category","…");
    if(!await gate(900, token)) return;
    setText("ia-urgency", s.urgency);
    setText("ia-mood",    s.mood);
    setText("ia-category",s.category);
    document.getElementById("ia-chip-urgency").className = "intent-chip " + (
      /高|high/i.test(s.urgency) ? "urgency-high" : /中|med/i.test(s.urgency) ? "urgency-medium" : "urgency-low"
    );
    document.getElementById("ia-chip-mood").className = "intent-chip " + (
      /正|pos/i.test(s.mood) ? "mood-positive" : /負|neg/i.test(s.mood) ? "mood-negative" : "mood-neutral"
    );
    if(!await gate(400, token)) return;
    const replyEl = document.getElementById("ia-reply");
    if(replyEl) await typeText(replyEl, s.reply, token, 14);
  }

  async function playDemo6(token){
    const nameEl = document.getElementById("se-name");
    const compEl = document.getElementById("se-company");
    const ctxEl  = document.getElementById("se-context");
    if(!nameEl) return;
    const s = S6();
    if(!await typeInput(nameEl, s.name, token, 30)) return;
    if(!await gate(220, token)) return;
    if(!await typeInput(compEl, s.company, token, 24)) return;
    if(!await gate(220, token)) return;
    if(!await typeInput(ctxEl, s.ctx, token, 18)) return;
    if(!await gate(450, token)) return;
    document.getElementById("se-to").textContent = s.to;
    document.getElementById("se-subject").textContent = currentLang==="zh"?"AI 撰寫中…":"AI drafting…";
    document.getElementById("se-body").innerHTML = `<div class="dot-typing"><span></span><span></span><span></span></div>`;
    if(!await gate(1200, token)) return;
    document.getElementById("se-subject").textContent = s.subject;
    const bodyEl = document.getElementById("se-body");
    bodyEl.innerHTML = "";
    await typeText(bodyEl, s.body, token, 9);
  }

  // ----- additional sample data (Demo 7-11) -----
  function S7(){
    return currentLang === "zh" ? {
      input:"今日會議 Sarah 主持，討論 Q4 行銷計劃。預算 50 萬，重點推社交媒體投放。John 提到 11 月底前要完成新網站，Mary 負責 KPI 追蹤。下次會議定在下週三。",
      summary:"Q4 行銷計劃會議：預算 50 萬，重點推社交媒體，網站 11 月底完成，下週三再開。",
      actions:["John 在 11 月底前完成新網站", "Mary 設定 KPI 追蹤儀表板", "Sarah 草擬社交媒體投放計劃"],
      decisions:["Q4 預算定為 50 萬", "主力投放社交媒體", "下次會議：下週三"],
      thinkLabel:"AI 整理中…",
    } : {
      input:"Today's meeting was led by Sarah on Q4 marketing. Budget set at $500k, focus on social media. John to deliver new website by end of November. Mary handles KPI tracking. Next meeting: next Wednesday.",
      summary:"Q4 marketing meeting: $500k budget, social-first, website due Nov, follow-up next Wed.",
      actions:["John ships new website by end of November", "Mary sets up KPI tracking dashboard", "Sarah drafts social media campaign plan"],
      decisions:["Q4 budget set at $500k", "Primary channel: social media", "Next meeting: next Wednesday"],
      thinkLabel:"AI is summarising…",
    };
  }
  function S8(){
    return currentLang === "zh" ? {
      input:"我們下星期三可以開個會討論項目進度嗎？",
      lang:"English", tone:"formal",
      translation:"Could we schedule a meeting next Wednesday to review project progress?",
      note:"使用 \"Could we\" 比直譯 \"Can we\" 更顯禮貌，適合商務情境。",
      thinkLabel:"AI 翻譯中…",
    } : {
      input:"Could we set a quick sync next Wednesday to review project status?",
      lang:"日本語", tone:"formal",
      translation:"来週水曜日に簡単な打ち合わせを設定し、プロジェクトの状況を確認することは可能でしょうか？",
      note:"Japanese business communication favours longer, more polite phrasing — note the use of でしょうか for softening.",
      thinkLabel:"Translating…",
    };
  }
  function S9(){
    return currentLang === "zh" ? {
      input:"餐廳食物美味但服務員態度好差，等位等了 30 分鐘無人理。再不會來。",
      biz:"餐廳",
      replies:[
        {tone:"正式專業", text:"感謝您的反饋。對於服務上的不足，我們深表歉意。已將您的意見轉達相關主管，並會立即加強員工培訓。希望能有機會讓我們重新為您服務。"},
        {tone:"親切溫暖", text:"先生／小姐您好，看到您的留言我們真的很心痛 💔 等了 30 分鐘還沒人招呼確實不應該。下次光臨可以告訴我們嗎？我們親自為您安排座位，請給我們一次補償的機會 🙏"},
        {tone:"真誠致歉", text:"非常抱歉讓您有這樣不愉快的經歷。對食物的肯定我們由衷感謝，但服務未達標準是我們的責任。已即時檢討當值流程，誠摯邀請您再次光臨，由我親自為您服務。— 店長 Grouper"},
      ],
      thinkLabel:"AI 撰寫中…",
    } : {
      input:"Food was great but the service was awful. Waited 30 minutes for seating with no one acknowledging us. Won't be back.",
      biz:"restaurant",
      replies:[
        {tone:"Formal & professional", text:"Thank you for your feedback. We sincerely apologise for the service shortfall and have escalated your comments to our floor manager. Staff training will be reinforced immediately. We would welcome the chance to serve you better."},
        {tone:"Warm & friendly", text:"Hi there — reading this honestly broke our hearts 💔 30 minutes ignored at the door is not okay. Could you let us know next time you're nearby? I'd love to seat you personally and make it up to you 🙏"},
        {tone:"Sincerely apologetic", text:"I'm truly sorry your visit ended this way. We're grateful you enjoyed the food, but the service was on us — and that's unacceptable. I've reviewed our floor process and would personally welcome you back any time. — Grouper, Restaurant Manager"},
      ],
      thinkLabel:"AI drafting replies…",
    };
  }
  function S10(){
    return currentLang === "zh" ? {
      topic:"企業數位轉型策略指南",
      keyword:"AI 自動化",
      titles:[
        {angle:"How-to 教學", title:"如何用 AI 自動化推動企業數位轉型：5 步實戰指南", score:88},
        {angle:"數字列表", title:"7 個 AI 自動化案例證明數位轉型沒想像中難", score:84},
        {angle:"問題式", title:"為什麼您的數位轉型失敗？關鍵在 AI 自動化", score:90},
        {angle:"懸念式", title:"頂尖企業正用 AI 自動化做這件事 — 您還在等？", score:86},
        {angle:"直接利益", title:"AI 自動化：3 個月內完成數位轉型的最快路徑", score:82},
      ],
      thinkLabel:"AI 生成中…",
    } : {
      topic:"Enterprise digital transformation strategy",
      keyword:"AI automation",
      titles:[
        {angle:"How-to", title:"How to Drive Digital Transformation with AI Automation: 5 Steps", score:88},
        {angle:"Listicle", title:"7 AI Automation Wins That Made Digital Transformation Easy", score:84},
        {angle:"Question", title:"Why Does Digital Transformation Fail? AI Automation Holds the Key", score:90},
        {angle:"Curiosity", title:"What Leading Companies Are Doing with AI Automation Right Now", score:86},
        {angle:"Direct benefit", title:"AI Automation: The Fastest Path to Digital Transformation in 90 Days", score:82},
      ],
      thinkLabel:"AI generating…",
    };
  }
  function S11(){
    return currentLang === "zh" ? {
      name:"極簡陶瓷咖啡杯",
      features:"手作陶瓷、3 色可選、保溫 4 小時、可進微波爐",
      output:`為日常一杯咖啡，留住溫度與儀式感。\n\n☕ 手作陶瓷杯壁，每一只都有獨特紋路\n🌡️ 雙層真空設計，咖啡保溫 4 小時不變涼\n🎨 經典米白、深炭、霧粉 3 色，搭配任何空間都耐看\n\n微波爐安全，輕鬆熱奶咖、煮巧克力。今日下單，享首次購入限定 8 折優惠。`,
      thinkLabel:"AI 撰寫中…",
    } : {
      name:"Minimalist Ceramic Mug",
      features:"Hand-thrown ceramic, 3 colours, keeps heat 4 hrs, microwave-safe",
      output:`Slow down your morning, one cup at a time.\n\n☕ Hand-thrown ceramic walls — each piece uniquely textured\n🌡️ Double-wall design holds heat for 4 full hours\n🎨 Off-white, charcoal, dusty pink — built to live in any space\n\nMicrowave-safe for warm milk and lazy mornings. Order today and get 20% off your first.`,
      thinkLabel:"AI writing…",
    };
  }

  // ----- new play functions -----
  async function playDemo7(token){
    const inEl = document.getElementById("ms-input");
    const out  = document.getElementById("ms-output");
    if(!inEl) return;
    const s = S7();
    if(!await typeInput(inEl, s.input, token, 12)) return;
    if(!await gate(450, token)) return;
    out.innerHTML = `<div class="ms-card show"><div class="ms-content"><div class="dot-typing"><span></span><span></span><span></span></div> ${s.thinkLabel}</div></div>`;
    if(!await gate(1200, token)) return;
    const labels = currentLang === "zh"
      ? {summary:"摘要", actions:"行動項目", decisions:"主要決定"}
      : {summary:"Summary", actions:"Action items", decisions:"Key decisions"};
    out.innerHTML = `
      <div class="ms-card"><div class="ms-lbl"><span class="ico">📋</span> ${labels.summary}</div><div class="ms-content">${s.summary}</div></div>
      <div class="ms-card"><div class="ms-lbl"><span class="ico">✅</span> ${labels.actions}</div><ul class="ms-list">${s.actions.map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="ms-card"><div class="ms-lbl"><span class="ico">🎯</span> ${labels.decisions}</div><ul class="ms-list">${s.decisions.map(x=>`<li>${x}</li>`).join("")}</ul></div>`;
    out.querySelectorAll(".ms-card").forEach((c,i)=>{
      setTimeout(()=>{ if(token === playToken) c.classList.add("show"); }, i*200);
    });
  }

  async function playDemo8(token){
    const inEl = document.getElementById("tr-input");
    const langEl = document.getElementById("tr-lang");
    const out  = document.getElementById("tr-output");
    if(!inEl) return;
    const s = S8();
    langEl.value = s.lang;
    if(!await typeInput(inEl, s.input, token, 22)) return;
    if(!await gate(400, token)) return;
    out.innerHTML = `<span class="placeholder"><div class="dot-typing"><span></span><span></span><span></span></div> ${s.thinkLabel}</span>`;
    if(!await gate(1100, token)) return;
    const noteLabel = currentLang === "zh" ? "文化備註" : "Cultural note";
    out.innerHTML = `<div class="tr-text" id="tr-stream"></div><div class="tr-note"><strong>${noteLabel}</strong>${s.note}</div>`;
    const stream = document.getElementById("tr-stream");
    if(!await typeText(stream, s.translation, token, 14)) return;
  }

  async function playDemo9(token){
    const inEl = document.getElementById("rv-input");
    const bizEl = document.getElementById("rv-business");
    const out  = document.getElementById("rv-output");
    if(!inEl) return;
    const s = S9();
    if(!await typeInput(inEl, s.input, token, 16)) return;
    if(!await gate(220, token)) return;
    if(!await typeInput(bizEl, s.biz, token, 30)) return;
    if(!await gate(450, token)) return;
    out.innerHTML = `<div class="rv-card show"><div class="rv-text"><div class="dot-typing"><span></span><span></span><span></span></div> ${s.thinkLabel}</div></div>`;
    if(!await gate(1200, token)) return;
    out.innerHTML = s.replies.map(r=>`
      <div class="rv-card">
        <div class="rv-tone">${r.tone}</div>
        <div class="rv-text">${r.text}</div>
      </div>`).join("");
    out.querySelectorAll(".rv-card").forEach((c,i)=>{
      setTimeout(()=>{ if(token === playToken) c.classList.add("show"); }, i*220);
    });
  }

  async function playDemo10(token){
    const topEl = document.getElementById("seo-topic");
    const kwEl  = document.getElementById("seo-keyword");
    const out   = document.getElementById("seo-output");
    if(!topEl) return;
    const s = S10();
    if(!await typeInput(topEl, s.topic, token, 26)) return;
    if(!await gate(220, token)) return;
    if(!await typeInput(kwEl, s.keyword, token, 30)) return;
    if(!await gate(450, token)) return;
    out.innerHTML = `<div class="rv-card show"><div class="rv-text"><div class="dot-typing"><span></span><span></span><span></span></div> ${s.thinkLabel}</div></div>`;
    if(!await gate(1100, token)) return;
    const scoreLabel = currentLang === "zh" ? "評分" : "Score";
    out.innerHTML = s.titles.map(t=>`
      <div class="rv-card">
        <div class="rv-tone">${t.angle} · ${scoreLabel} ${t.score}/100</div>
        <div class="rv-text" style="font-weight:600;font-size:15px">${t.title}</div>
      </div>`).join("");
    out.querySelectorAll(".rv-card").forEach((c,i)=>{
      setTimeout(()=>{ if(token === playToken) c.classList.add("show"); }, i*150);
    });
  }

  async function playDemo11(token){
    const nameEl = document.getElementById("pc-name");
    const featEl = document.getElementById("pc-features");
    const out  = document.getElementById("pc-output");
    if(!nameEl) return;
    const s = S11();
    if(!await typeInput(nameEl, s.name, token, 30)) return;
    if(!await gate(250, token)) return;
    if(!await typeInput(featEl, s.features, token, 18)) return;
    if(!await gate(450, token)) return;
    out.innerHTML = `<span class="placeholder"><div class="dot-typing"><span></span><span></span><span></span></div> ${s.thinkLabel}</span>`;
    if(!await gate(1100, token)) return;
    out.textContent = "";
    if(!await typeText(out, s.output, token, 11)) return;
  }

  function S12(){
    return currentLang === "zh" ? {
      sku:"USB-C 多功能轉接器",
      qty:200,
      warehouses:[
        {name:"🇭🇰 香港中央倉",   stock:850,  delivery:"1-2 日", shipping:"HK$ 80",  status:"normal"},
        {name:"🇨🇳 深圳跨境倉",   stock:1240, delivery:"2-3 日", shipping:"HK$ 320", status:"normal"},
        {name:"🇹🇼 台北倉",       stock:95,   delivery:"3-4 日", shipping:"HK$ 480", status:"low"},
      ],
      recommended_index:0,
      reason:"庫存充足、最快送達、運費最低",
      insights:[
        {type:"warning",    ico:"⚠️", text:"台北倉庫存低於安全水位（剩 95 件，閾值 150 件）"},
        {type:"suggestion", ico:"📦", text:"建議下次補貨 600 件 — 過去 30 日銷量趨勢顯示需求穩定上升"},
        {type:"saving",    ico:"💸", text:"本次調貨節省 HK$ 240 運費 + 縮短 2 日交付時間"},
      ],
      thinkLabel:"AI 正在分析三個倉庫的庫存與運費…",
    } : {
      sku:"USB-C Multi Adapter",
      qty:200,
      warehouses:[
        {name:"🇭🇰 HK Central",      stock:850,  delivery:"1-2 days", shipping:"HK$ 80",  status:"normal"},
        {name:"🇨🇳 Shenzhen Cross-border", stock:1240, delivery:"2-3 days", shipping:"HK$ 320", status:"normal"},
        {name:"🇹🇼 Taipei",          stock:95,   delivery:"3-4 days", shipping:"HK$ 480", status:"low"},
      ],
      recommended_index:0,
      reason:"Highest stock, fastest delivery, lowest shipping cost",
      insights:[
        {type:"warning",    ico:"⚠️", text:"Taipei stock below safety threshold (95 units, threshold 150)"},
        {type:"suggestion", ico:"📦", text:"Suggest reordering 600 units — 30-day sales trend shows rising demand"},
        {type:"saving",    ico:"💸", text:"This route saves HK$ 240 shipping and 2 days of delivery time"},
      ],
      thinkLabel:"AI is checking stock and routing across warehouses…",
    };
  }

  async function playDemo12(token){
    const skuEl = document.getElementById("wh-sku");
    const qtyEl = document.getElementById("wh-qty");
    const out   = document.getElementById("wh-output");
    if(!skuEl) return;
    const s = S12();
    if(!await typeInput(skuEl, s.sku, token, 26)) return;
    if(!await gate(220, token)) return;
    qtyEl.value = "";
    const qtyStr = String(s.qty);
    for(const ch of qtyStr){
      if(token !== playToken) return;
      qtyEl.value += ch;
      await wait(60);
    }
    if(!await gate(450, token)) return;
    out.innerHTML = `<div class="wh-card show"><div class="wh-info"><div class="wh-name"><div class="dot-typing"><span></span><span></span><span></span></div></div><div class="wh-meta">${s.thinkLabel}</div></div></div>`;
    if(!await gate(1300, token)) return;
    if(typeof renderWarehouseResult === "function"){
      renderWarehouseResult(out, {
        warehouses: s.warehouses,
        recommended_index: s.recommended_index,
        reason: s.reason,
        insights: s.insights,
      });
    }
  }

  function S13(){
    return currentLang === "zh" ? {
      company:"晨光咖啡",
      industry:"餐飲",
      headcount:"6-20",
      pains:["follow-up","content","review"],
      thinkLabel:"AI 正在分析您的業務、配對方案 …",
      diagnosis:{
        score:62,
        industry_benchmark:"餐飲業 AI 採用率約 28%，多數仍停留在 POS 系統",
        gap_summary:"您的團隊規模適合啟動 AI 自動化，主要 gap 在客戶溝通同內容產出環節",
      },
      solutions:[
        {icon:"✉️", title:"AI 客戶跟進自動化", demo_ref:6, desc:"自動跟進未回覆客戶，個人化內容",  monthly_hours_saved:22},
        {icon:"📱", title:"AI 社交內容生成",   demo_ref:4, desc:"每週批量生成 IG / FB 貼文文案", monthly_hours_saved:18},
        {icon:"💬", title:"AI 評論回覆助手",   demo_ref:9, desc:"OpenRice / Google 評論 30 秒回覆", monthly_hours_saved:10},
      ],
      roi:{ total_hours:50, estimated_savings_hkd:15000, payback_months:3 },
    } : {
      company:"Morning Light",
      industry:"F&B",
      headcount:"6-20",
      pains:["follow-up","content","review"],
      thinkLabel:"AI is analysing your business and matching solutions…",
      diagnosis:{
        score:62,
        industry_benchmark:"F&B AI adoption sits around 28% — most still on POS only",
        gap_summary:"Your team size is right to start AI automation; biggest gaps in customer comms and content",
      },
      solutions:[
        {icon:"✉️", title:"AI customer follow-up",  demo_ref:6, desc:"Auto-personalised follow-ups for silent leads", monthly_hours_saved:22},
        {icon:"📱", title:"AI social content",      demo_ref:4, desc:"Batch IG / FB posts every week",              monthly_hours_saved:18},
        {icon:"💬", title:"AI review replies",      demo_ref:9, desc:"Reply to Google / Yelp reviews in 30 sec",    monthly_hours_saved:10},
      ],
      roi:{ total_hours:50, estimated_savings_hkd:15000, payback_months:3 },
    };
  }

  async function playDemo13(token){
    if(typeof window.__wizardReset === "function") window.__wizardReset();
    const companyEl   = document.getElementById("wz-company");
    const industryEl  = document.getElementById("wz-industry");
    const segs        = document.querySelectorAll("#wz-headcount .wz-seg");
    const chips       = document.querySelectorAll("#wz-pains .wz-chip");
    if(!companyEl) return;
    const s = S13();
    // Step 1 typing
    if(!await typeInput(companyEl, s.company, token, 26)) return;
    if(!await gate(200, token)) return;
    if(!await typeInput(industryEl, s.industry, token, 28)) return;
    if(!await gate(280, token)) return;
    // headcount segment
    if(token !== playToken) return;
    const seg = Array.from(segs).find(s2 => s2.dataset.val === s.headcount);
    if(seg){ seg.click(); }
    if(!await gate(450, token)) return;
    // Move to step 2
    if(token !== playToken) return;
    if(typeof window.__wizardGoto === "function") window.__wizardGoto(2);
    if(!await gate(600, token)) return;
    // Toggle pain chips one by one
    for(const pain of s.pains){
      if(token !== playToken) return;
      const chip = Array.from(chips).find(c => c.dataset.pain === pain);
      if(chip){ chip.click(); }
      await wait(280);
    }
    if(!await gate(500, token)) return;
    // Move to step 3 and render report directly with sample
    if(token !== playToken) return;
    if(typeof window.__wizardGoto === "function") window.__wizardGoto(3);
    if(!await gate(400, token)) return;
    // Inject sample report (skip API for preview)
    const container = document.getElementById("wz-report-container");
    if(!container) return;
    container.innerHTML = `<div class="wz-loading"><div class="dot-typing"><span></span><span></span><span></span></div><div>${s.thinkLabel}</div></div>`;
    if(!await gate(1300, token)) return;
    if(token !== playToken) return;
    // Render the same way real handler does, but flag as preview so banner shows
    if(typeof window.__renderWizardReport === "function"){
      window.__renderWizardReport(
        container,
        {diagnosis:s.diagnosis, solutions:s.solutions, roi:s.roi, _industry:s.industry},
        s.company,
        true  // isPreview
      );
    }
  }

  // ---------------- DEMO 14: WAREHOUSE DASHBOARD ----------------
  function S14(){
    // 5 warehouses × 3 SKUs (USB-C / Headphones / PowerBank) — values per filter range
    const wh_zh = ["香港倉","台北倉","廣州倉","上海倉","北京倉"];
    const wh_en = ["HK","Taipei","Guangzhou","Shanghai","Beijing"];
    const sku = ["USB-C","Headphones","PowerBank"];
    const colors = ["#7c5cff","#ff5cb1","#5cd7ff"];
    // Stock numbers (USB-C, Headphones, PowerBank) per warehouse per range
    const stockByRange = {
      "1":[ [420,310,280],[ 95,260,310],[680,520,440],[510,390,350],[  0,  0,  0] ],
      "7":[ [380,290,260],[ 80,240,290],[640,490,420],[490,370,330],[  0,  0,  0] ],
      "30":[[340,270,240],[120,260,300],[600,460,400],[460,350,310],[  0,  0,  0] ],
    };
    return currentLang === "zh" ? {
      warehouses:wh_zh, sku, colors, stockByRange,
      kpis:{
        "1":  {stock:12480, shipping:248, lowstock:3, warehouses:4, stockDelta:"↓ 2.3% vs 上週", shippingDelta:"↑ 18% vs 平均", lowstockDelta:"3 項需補貨", whDelta:"北京倉離線"},
        "7":  {stock:12860, shipping:1620,lowstock:5, warehouses:4, stockDelta:"↓ 1.8% vs 上月", shippingDelta:"↑ 9% vs 上週",  lowstockDelta:"5 項需補貨", whDelta:"北京倉離線"},
        "30": {stock:13420, shipping:7850,lowstock:7, warehouses:4, stockDelta:"↑ 4.5% vs 季度", shippingDelta:"↑ 12% vs 季度",  lowstockDelta:"7 項需補貨", whDelta:"北京倉離線"},
      },
      alerts:[
        {sev:"critical", ico:"🚨", title:"北京倉離線中",     time:"08 分鐘前", desc:"心跳監測中斷 8 分鐘 — 已自動轉發訂單到上海倉"},
        {sev:"critical", ico:"⚠️", title:"USB-C 轉接器低庫存", time:"23 分鐘前", desc:"台北倉 80 件 < 安全線 150 — 建議由廣州倉調 200 件"},
        {sev:"warning",  ico:"📉", title:"無線耳機售出加速",   time:"1 小時前",  desc:"7 日銷量 +42%，預計 5 日後台北倉缺貨"},
        {sev:"info",     ico:"🚚", title:"今日大宗出貨完成",   time:"2 小時前",  desc:"248 件已分批寄出 — 比平均提早 1.5 小時"},
        {sev:"info",     ico:"✨", title:"AI 模型更新完成",   time:"5 小時前",  desc:"新的銷量預測模型上線，準確度提升 8%"},
      ],
      recs:[
        {ico:"🔄", text:"自動由廣州倉調 200 件 USB-C 轉接器去台北倉，預計 2 日到貨", save:"節省 HK$ 240 + 避免缺貨", btn:"一鍵執行 →"},
        {ico:"📦", text:"補貨：無線耳機 × 500，由深圳工廠下單", save:"基於 30 日銷量預測", btn:"生成採購單 →"},
        {ico:"💸", text:"重新分配 7 月出貨：香港倉 → 廣州倉中轉", save:"節省 HK$ 8,400 / 月", btn:"查看詳情 →"},
      ],
      toast:"✓ 已自動建立 n8n 工作流",
    } : {
      warehouses:wh_en, sku, colors, stockByRange,
      kpis:{
        "1":  {stock:12480, shipping:248, lowstock:3, warehouses:4, stockDelta:"↓ 2.3% vs last week",  shippingDelta:"↑ 18% vs avg",    lowstockDelta:"3 to restock", whDelta:"Beijing offline"},
        "7":  {stock:12860, shipping:1620,lowstock:5, warehouses:4, stockDelta:"↓ 1.8% vs last month", shippingDelta:"↑ 9% vs last wk", lowstockDelta:"5 to restock", whDelta:"Beijing offline"},
        "30": {stock:13420, shipping:7850,lowstock:7, warehouses:4, stockDelta:"↑ 4.5% vs quarter",   shippingDelta:"↑ 12% vs quarter",lowstockDelta:"7 to restock", whDelta:"Beijing offline"},
      },
      alerts:[
        {sev:"critical", ico:"🚨", title:"Beijing warehouse offline", time:"8 min ago",  desc:"Heartbeat lost — orders auto-rerouted to Shanghai"},
        {sev:"critical", ico:"⚠️", title:"USB-C adapter low stock",   time:"23 min ago", desc:"Taipei 80 < safety 150 — recommend pulling 200 from Guangzhou"},
        {sev:"warning",  ico:"📉", title:"Headphones sales surge",    time:"1 hr ago",   desc:"7-day sales +42% — Taipei stock-out predicted in 5 days"},
        {sev:"info",     ico:"🚚", title:"Bulk shipment completed",   time:"2 hr ago",   desc:"248 units shipped — 1.5 hr ahead of avg"},
        {sev:"info",     ico:"✨", title:"AI model updated",          time:"5 hr ago",   desc:"New forecast model live — accuracy +8%"},
      ],
      recs:[
        {ico:"🔄", text:"Auto-transfer 200 USB-C adapters from Guangzhou to Taipei, ETA 2 days", save:"Save HK$ 240 + avoid stockout", btn:"Execute →"},
        {ico:"📦", text:"Restock: 500 wireless headphones, order from Shenzhen factory",        save:"Based on 30-day forecast",     btn:"Generate PO →"},
        {ico:"💸", text:"Reroute July shipments: HK → Guangzhou transit hub",                   save:"Save HK$ 8,400 / month",       btn:"View details →"},
      ],
      toast:"✓ n8n workflow created automatically",
    };
  }

  function renderDashboard14(range, animate){
    const data = S14();
    const k = data.kpis[range] || data.kpis["7"];
    // KPIs — set targets + delta texts
    const root = document.getElementById("demo14");
    if(!root) return;
    const setKpi = (sel, target, delta) => {
      const el = root.querySelector(sel);
      if(!el) return;
      const numEl = el.querySelector(".dash-kpi-num [data-target]") || el.querySelector(".dash-kpi-num");
      const deltaEl = el.querySelector(".dash-kpi-delta");
      if(numEl){
        numEl.dataset.target = String(target);
        animateNumber(numEl, target, animate ? 900 : 0);
      }
      if(deltaEl && delta != null) deltaEl.textContent = delta;
    };
    setKpi('[data-kpi="stock"]',      k.stock,    k.stockDelta);
    setKpi('[data-kpi="shipping"]',   k.shipping, k.shippingDelta);
    setKpi('[data-kpi="lowstock"]',   k.lowstock, k.lowstockDelta);
    setKpi('[data-kpi="warehouses"]', k.warehouses, k.whDelta);

    // Chart bars
    const barsRoot = document.getElementById("dash-bars");
    if(barsRoot){
      const stocks = data.stockByRange[range] || data.stockByRange["7"];
      const max = 800;
      barsRoot.innerHTML = "";
      stocks.forEach((whVals, whIdx) => {
        const group = document.createElement("div");
        group.className = "dash-bar-group";
        whVals.forEach((v, sIdx) => {
          const pct = Math.max(0, Math.min(100, (v / max) * 100));
          const low = v > 0 && v < 150;
          const bar = document.createElement("div");
          bar.className = "dash-bar" + (low ? " low" : "");
          bar.style.setProperty("--bar-grad", `linear-gradient(180deg,${data.colors[sIdx]},${data.colors[sIdx]}55)`);
          bar.innerHTML = `<div class="dash-bar-tip">${data.sku[sIdx]} · ${v}${currentLang==="zh"?" 件":""}${low?` · ${currentLang==="zh"?"低於安全線":"below safety"}`:""}</div>`;
          group.appendChild(bar);
          // animate height
          requestAnimationFrame(() => {
            setTimeout(() => { bar.style.height = pct + "%"; }, animate ? (whIdx * 80 + sIdx * 50) : 0);
          });
        });
        barsRoot.appendChild(group);
      });
    }

    // Alerts feed
    const feedRoot = document.getElementById("dash-alerts-feed");
    if(feedRoot){
      feedRoot.innerHTML = "";
      data.alerts.forEach((a, i) => {
        const el = document.createElement("div");
        el.className = `dash-alert ${a.sev}`;
        el.innerHTML = `
          <div class="dash-alert-ico">${a.ico}</div>
          <div class="dash-alert-body">
            <div class="dash-alert-head">
              <div class="dash-alert-title">${a.title}</div>
              <div class="dash-alert-time">${a.time}</div>
            </div>
            <div class="dash-alert-desc">${a.desc}</div>
          </div>`;
        feedRoot.appendChild(el);
        if(animate){
          setTimeout(() => el.classList.add("show"), 200 + i * 140);
        } else {
          el.classList.add("show");
        }
      });
    }

    // AI Recommendations
    const recsRoot = document.getElementById("dash-recs-grid");
    if(recsRoot){
      recsRoot.innerHTML = "";
      data.recs.forEach((r, i) => {
        const el = document.createElement("div");
        el.className = "dash-rec";
        el.innerHTML = `
          <div class="dash-rec-body">
            <div class="dash-rec-ico">${r.ico}</div>
            <div class="dash-rec-text">${r.text}<div class="dash-rec-save">${r.save}</div></div>
          </div>
          <button class="dash-rec-btn" type="button">${r.btn}</button>`;
        const btn = el.querySelector(".dash-rec-btn");
        btn.addEventListener("click", () => {
          el.classList.add("done");
          btn.textContent = currentLang==="zh" ? "✓ 已執行" : "✓ Executed";
          showDashToast(data.toast);
        });
        recsRoot.appendChild(el);
        if(animate){
          setTimeout(() => el.classList.add("show"), 700 + i * 160);
        } else {
          el.classList.add("show");
        }
      });
    }
  }

  function animateNumber(el, target, durationMs){
    if(!el) return;
    if(!durationMs){ el.textContent = target.toLocaleString(); return; }
    const start = 0;
    const startTime = performance.now();
    function tick(now){
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(start + (target - start) * eased);
      el.textContent = val.toLocaleString();
      if(t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function showDashToast(msg){
    const root = document.getElementById("demo14");
    if(!root) return;
    let t = root.querySelector(".dash-toast");
    if(!t){
      t = document.createElement("div");
      t.className = "dash-toast";
      root.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  async function playDemo14(token){
    // Pre-warm: reset filter to default "1" (今日) — matches HTML default active
    const filterRoot = document.getElementById("dash-filter");
    if(filterRoot){
      filterRoot.querySelectorAll(".dash-fseg").forEach(b => b.classList.toggle("active", b.dataset.range === "1"));
    }
    if(token !== playToken) return;
    renderDashboard14("1", true);
    // Mid-preview: switch to "7 日" to demonstrate filter interaction
    if(!await gate(3400, token)) return;
    if(filterRoot){
      const btn = filterRoot.querySelector('.dash-fseg[data-range="7"]');
      if(btn) btn.click();
    }
  }

  // Filter switch wiring (once)
  (function dashboardWiring(){
    const filterRoot = document.getElementById("dash-filter");
    if(filterRoot){
      filterRoot.addEventListener("click", e => {
        const btn = e.target.closest(".dash-fseg");
        if(!btn) return;
        filterRoot.querySelectorAll(".dash-fseg").forEach(b => b.classList.toggle("active", b === btn));
        renderDashboard14(btn.dataset.range, true);
      });
    }
    // Initial silent render so the dashboard isn't empty if user manually navigates here
    setTimeout(() => {
      if(!playedSlides.has(13)){
        const activeBtn = filterRoot?.querySelector(".dash-fseg.active");
        renderDashboard14(activeBtn?.dataset.range || "7", false);
      }
    }, 0);
  })();

  function playSlide(idx){
    if(playedSlides.has(idx)) return;
    playedSlides.add(idx);
    const token = ++playToken;
    const fns = [playDemo1, playDemo2, playDemo3, playDemo4, playDemo5, playDemo6,
                 playDemo7, playDemo8, playDemo9, playDemo10, playDemo11, playDemo12,
                 playDemo13, playDemo14];
    fns[idx]?.(token).catch(()=>{});
  }

  // Expose for external use (e.g. applyLang re-triggers after language switch)
  window.__playSlide        = playSlide;
  window.__resetPreviews    = () => { playedSlides.clear(); playToken++; };
  window.__renderDashboard14 = renderDashboard14;

  // Watch slides — when one becomes .active for the first time, play it.
  const slides = document.querySelectorAll(".demo-slide");
  if(slides.length){
    const obs = new MutationObserver(muts => {
      muts.forEach(m => {
        if(m.attributeName === "class" && m.target.classList.contains("active")){
          const idx = +m.target.dataset.slideIdx;
          if(!isNaN(idx)) setTimeout(()=>playSlide(idx), 350);
        }
      });
    });
    slides.forEach(s => obs.observe(s, {attributes:true, attributeFilter:["class"]}));
  }

  // Trigger the visually-first (current .active) slide on viewport entry.
  // Eager: fire as soon as any pixel of the demos section enters viewport
  // (rootMargin extends bottom by 300px so it pre-warms before user scrolls in).
  const demosSection = document.getElementById("demos") || document.getElementById("demos-carousel");
  if(demosSection){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          const initialActive = document.querySelector(".demo-slide.active");
          const initialIdx = initialActive ? +initialActive.dataset.slideIdx : 0;
          setTimeout(()=>playSlide(isNaN(initialIdx) ? 0 : initialIdx), 400);
          io.disconnect();
        }
      });
    }, {threshold:0.01, rootMargin:"0px 0px 300px 0px"});
    io.observe(demosSection);
  }

  // User interaction → cancel any running preview
  ["wf-input","wf-run","chat-input","chat-send","wg-name","wg-industry","wg-run",
   "cg-topic","cg-run","ia-input","ia-run","se-name","se-company","se-context","se-run",
   "ms-input","ms-run","tr-input","tr-lang","tr-run","rv-input","rv-business","rv-run",
   "seo-topic","seo-keyword","seo-run","pc-name","pc-features","pc-run",
   "wh-sku","wh-qty","wh-run",
   "wz-company","wz-industry","wz-next-1","wz-back-2","wz-generate",
   "dash-filter"]
    .forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener("focus", cancelPreview, {passive:true});
      el.addEventListener("mousedown", cancelPreview, {passive:true});
    });
})();

/* ===========================================================
   DEMO 1 — WORKFLOW SIMULATOR (AI-generated dynamic steps)
   =========================================================== */
const wfRunBtn = document.getElementById("wf-run");
const wfDynamic = document.getElementById("wf-dynamic");
const wfResult = document.getElementById("wf-result");

wfRunBtn.addEventListener("click", async ()=>{
  const txt = (document.getElementById("wf-input").value || "").trim();
  if(!txt){
    wfDynamic.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-faint);font-size:13.5px">${currentLang==="zh"?"請先輸入您的業務問題":"Please enter a business problem first."}</div>`;
    return;
  }
  wfRunBtn.disabled = true;
  wfResult.classList.remove("show");
  wfDynamic.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-dim);font-size:13.5px"><div class="dot-typing" style="justify-content:center"><span></span><span></span><span></span></div><div style="margin-top:12px">${currentLang==="zh"?"AI 正在拆解您的工作流程…":"AI is breaking down your workflow…"}</div></div>`;

  const lang = currentLang;
  const sysPrompt = lang === "zh"
    ? `你是一個工作流程自動化專家。用戶會描述一個業務問題，請你拆解成 5 至 6 個自動化步驟（節點）。
每個節點包含：icon (一個 emoji)、title (短標題，4-8 字)、desc (一句描述，10-25 字)。
最後估算每月節省幾多小時 (savings_hours)。
**只回覆 JSON**，格式：{"nodes":[{"icon":"⚡","title":"...","desc":"..."}], "savings_hours":N}`
    : `You are a workflow automation expert. Given a business problem, break it into 5-6 automated steps (nodes).
Each node has: icon (an emoji), title (short, 2-5 words), desc (1 sentence, 8-15 words).
Then estimate monthly hours saved (savings_hours).
**Reply ONLY with JSON**: {"nodes":[{"icon":"⚡","title":"...","desc":"..."}], "savings_hours":N}`;

  try{
    const reply = await callClaude({
      system: sysPrompt,
      messages: [{role:"user", content: txt}],
    });
    // try to parse JSON (model may wrap in code fence)
    const json = extractJSON(reply);
    if(!json || !Array.isArray(json.nodes)) throw new Error("Invalid JSON from AI");

    // render dynamically
    wfDynamic.innerHTML = json.nodes.map((n,i)=>`
      <div class="wf-step-card">
        <span class="step-num">${String(i+1).padStart(2,"0")}</span>
        <div class="icon">${escapeHtml(n.icon || "⚙️")}</div>
        <div class="title">${escapeHtml(n.title || "")}</div>
        <div class="desc">${escapeHtml(n.desc || "")}</div>
      </div>`).join("");

    // animate
    const cards = wfDynamic.querySelectorAll(".wf-step-card");
    for(let i=0;i<cards.length;i++){
      await wait(220);
      cards[i].classList.add("show");
    }
    await wait(300);
    const hrs = json.savings_hours || Math.max(8, Math.round(json.nodes.length * 6));
    wfResult.innerHTML = lang === "zh"
      ? `✅ <strong>${json.nodes.length} 步流程設計完成</strong> · 預估每月節省 <strong>${hrs} 小時</strong>。<br><span style="color:var(--text-dim);font-size:13px">交給 TBC Solutions 為您打造完整自動化系統。</span>`
      : `✅ <strong>${json.nodes.length}-step workflow ready</strong> · estimated savings: <strong>${hrs} hrs / month</strong>.<br><span style="color:var(--text-dim);font-size:13px">Let TBC Solutions build the full automation for you.</span>`;
    wfResult.classList.add("show");
  }catch(e){
    wfDynamic.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px 20px;color:#ff8c8c;font-size:13px">⚠️ ${e.message || e}</div>`;
  }finally{
    wfRunBtn.disabled = false;
  }
});

function extractJSON(txt){
  if(!txt) return null;
  // strip ```json ... ``` if present
  const cleaned = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try{ return JSON.parse(cleaned); }catch(e){}
  // fallback: find first { ... last }
  const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
  if(a >= 0 && b > a){
    try{ return JSON.parse(cleaned.slice(a, b+1)); }catch(e){}
  }
  return null;
}

/* ===========================================================
   DEMO 2 — CHAT (Claude API)
   =========================================================== */
const chatMsgs = document.getElementById("chat-msgs");
const chatInput = document.getElementById("chat-input");
const chatSend  = document.getElementById("chat-send");
let chatHistory = [];

function addMsg(role, text, opts={}){
  const div = document.createElement("div");
  div.className = "chat-msg " + role + (opts.thinking ? " thinking" : "");
  if(opts.thinking){
    div.innerHTML = `<span class="dot-typing"><span></span><span></span><span></span></span>`;
  } else {
    div.textContent = text;
  }
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

async function sendChat(){
  const text = chatInput.value.trim();
  if(!text) return;
  chatInput.value = "";
  chatSend.disabled = true;
  addMsg("user", text);
  chatHistory.push({role:"user", content:text});
  const thinking = addMsg("bot","",{thinking:true});

  try{
    const reply = await callClaude({
      system: currentLang === "zh"
        ? "你是 TBC Solutions 的 AI 助手。TBC Solutions 由 Grouper 創立，專注於 AI 自動化、網頁設計與 AI 內容創作。請以友善、專業、簡潔的繁體中文回答，回覆控制在 100 字內。若使用者詢問報價或合作，建議他們點擊頁面下方的「預約免費諮詢」。"
        : "You are TBC Solutions' AI assistant. TBC Solutions, founded by Grouper, specialises in AI automation, web design and AI content creation. Reply in friendly, professional and concise English (under 90 words). If the user asks about pricing or collaboration, invite them to click the 'Book a free call' section at the bottom of the page.",
      messages: chatHistory,
    });
    thinking.classList.remove("thinking");
    thinking.innerHTML = "";
    thinking.textContent = reply;
    chatHistory.push({role:"assistant", content:reply});
  }catch(e){
    thinking.classList.remove("thinking");
    thinking.textContent = (currentLang==="zh"
      ? "⚠️ 連接 AI 服務失敗。\n錯誤："
      : "⚠️ Failed to reach AI service.\nError: ") + (e.message || e);
  }finally{
    chatSend.disabled = false;
    chatInput.focus();
  }
}
chatSend.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", e=>{ if(e.key==="Enter") sendChat(); });

/* ===========================================================
   DEMO 3 — WEBSITE PREVIEW (AI-generated content)
   =========================================================== */
const wgRun = document.getElementById("wg-run");
wgRun.addEventListener("click", async ()=>{
  const name = (document.getElementById("wg-name").value || "").trim();
  const ind  = (document.getElementById("wg-industry").value || "").trim();
  if(!name || !ind){
    document.getElementById("wg-body").innerHTML = `<div class="preview-empty">${currentLang==="zh"?"請填入公司名與行業":"Please fill in name and industry."}</div>`;
    return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9一-龥]+/g,"-").replace(/^-|-$/g,"") || "your-brand";
  const urlEl = document.getElementById("wg-url");
  const body  = document.getElementById("wg-body");
  wgRun.disabled = true;

  // animate URL typing
  const targetUrl = `https://${slug}.com`;
  urlEl.textContent = "https://";
  for(let i=0;i<targetUrl.length-8;i++){
    await wait(35);
    urlEl.textContent = "https://" + targetUrl.slice(8, 8+i+1);
  }

  body.innerHTML = `<div class="preview-empty"><div class="dot-typing" style="justify-content:center"><span></span><span></span><span></span></div><div style="margin-top:12px">${currentLang==="zh"?"AI 正在生成完整網頁設計…":"AI is designing full homepage…"}</div></div>`;

  const lang = currentLang;
  const sysPrompt = lang === "zh"
    ? `你是品牌設計師加文案專家。根據公司名與行業，為其生成一個現代、有質感、有 wow factor 的網站首頁完整內容。
**只回覆 JSON**：
{
  "hero_title": "10-18 字 Hero 大標題",
  "hero_sub": "20-35 字副標題，講解品牌價值",
  "cta_primary": "主 CTA 按鈕文字（3-6 字，如：立即預約 / 開始體驗 / 聯絡我們）",
  "stats": [
    {"n": "短數字（如 5+ / 200+ / 4.9★）", "l": "短標籤（4-8 字）"},
    {"n": "...", "l": "..."},
    {"n": "...", "l": "..."}
  ],
  "services": [
    {"icon": "一個 emoji", "title": "服務名稱（4-6 字）", "desc": "簡短描述（10-18 字）"},
    {"icon": "...", "title": "...", "desc": "..."},
    {"icon": "...", "title": "...", "desc": "..."}
  ],
  "testimonial": {
    "quote": "客戶評語，要 specific 且真實感（25-45 字）",
    "author": "姓名 / 職稱（如：Anna 陳 · 創辦人）"
  },
  "final_title": "底部 CTA 標題（10-15 字）",
  "final_sub": "底部副標（15-25 字）",
  "final_btn": "底部按鈕（3-5 字）",
  "color": "一個品牌主色 hex code（配合行業氛圍，避免過於灰暗或刺眼，例如餐飲用暖色 / 科技用藍紫 / 教育用穩重）"
}`
    : `You are a brand designer and copywriter. Given a company name and industry, generate a complete, modern homepage with wow factor.
**Reply ONLY with JSON**:
{
  "hero_title": "5-9 word hero headline",
  "hero_sub": "12-22 word subheadline explaining brand value",
  "cta_primary": "primary CTA button (2-4 words, e.g., Get started / Book a call)",
  "stats": [
    {"n": "short number (e.g., 5+ / 200+ / 4.9★)", "l": "short label (1-3 words)"},
    {"n": "...", "l": "..."},
    {"n": "...", "l": "..."}
  ],
  "services": [
    {"icon": "one emoji", "title": "service name (2-4 words)", "desc": "short description (8-15 words)"},
    {"icon": "...", "title": "...", "desc": "..."},
    {"icon": "...", "title": "...", "desc": "..."}
  ],
  "testimonial": {
    "quote": "specific, authentic-sounding customer quote (15-30 words)",
    "author": "Name · Title (e.g., Anna Chan · Founder)"
  },
  "final_title": "bottom CTA headline (5-9 words)",
  "final_sub": "bottom CTA subline (8-15 words)",
  "final_btn": "bottom CTA button (2-3 words)",
  "color": "brand primary hex code (matches industry vibe — warm for F&B, blue/purple for tech, etc.)"
}`;

  try{
    const reply = await callClaude({
      system: sysPrompt,
      messages: [{role:"user", content: `Company: ${name}\nIndustry: ${ind}\nLanguage: ${lang}`}],
      max_tokens: 1200,
    });
    const json = extractJSON(reply);
    if(!json || !json.hero_title) throw new Error("Invalid JSON from AI");

    renderRichPreview(body, {
      name, industry: ind,
      heroTitle: json.hero_title,
      heroSub: json.hero_sub || "",
      ctaPrimary: json.cta_primary || (lang==="zh"?"立即預約":"Get started"),
      stats: Array.isArray(json.stats) ? json.stats.slice(0,3) : [],
      services: Array.isArray(json.services) ? json.services.slice(0,3) : [],
      testimonial: json.testimonial || {quote:"", author:""},
      finalTitle: json.final_title || "",
      finalSub: json.final_sub || "",
      finalBtn: json.final_btn || (lang==="zh"?"開始":"Start"),
      color: validHex(json.color) || "#7c5cff",
      lang,
    });
  }catch(e){
    body.innerHTML = `<div class="preview-empty" style="color:#cc4444">⚠️ ${e.message || e}</div>`;
  }finally{
    wgRun.disabled = false;
  }
});

/* ---- Demo 3 helpers ---- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[c]); }
function validHex(s){
  if(!s) return null;
  s = String(s).trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) ? s : null;
}
function hexLighten(hex, percent){
  hex = hex.replace("#","");
  if(hex.length===3) hex = hex.split("").map(c=>c+c).join("");
  let r = parseInt(hex.substr(0,2),16),
      g = parseInt(hex.substr(2,2),16),
      b = parseInt(hex.substr(4,2),16);
  r = Math.min(255, Math.round(r + (255-r)*percent/100));
  g = Math.min(255, Math.round(g + (255-g)*percent/100));
  b = Math.min(255, Math.round(b + (255-b)*percent/100));
  return `rgb(${r}, ${g}, ${b})`;
}
function renderRichPreview(body, d){
  const navAbout = d.lang==="zh"?"關於":"About";
  const navServices = d.lang==="zh"?"服務":"Services";
  const navContact = d.lang==="zh"?"聯絡":"Contact";
  const learnMore = d.lang==="zh"?"了解更多":"Learn more";
  body.style.setProperty("--pv-accent", d.color);
  body.style.setProperty("--pv-soft",   hexLighten(d.color, 92));
  // Pick complementary accent-2 (shifted hue) — keep it simple by mixing with pink
  body.style.setProperty("--pv-accent-2", hexLighten(d.color, 35).replace("rgb","rgba").replace(")", ", 0.85)"));

  body.innerHTML = `
    <div class="pv-header pv-section">
      <strong>${escapeHtml(d.name)}</strong>
      <div class="nav-mini"><span>${navAbout}</span><span>${navServices}</span><span>${navContact}</span></div>
      <button class="cta-mini">${escapeHtml(d.ctaPrimary)}</button>
    </div>
    <div class="pv-hero pv-section">
      <span class="pill">${escapeHtml(d.industry).toUpperCase()}</span>
      <h4>${escapeHtml(d.heroTitle)}</h4>
      <p>${escapeHtml(d.heroSub)}</p>
      <div class="cta-row">
        <button class="btn-p">${escapeHtml(d.ctaPrimary)} →</button>
        <button class="btn-s">${learnMore}</button>
      </div>
    </div>
    ${d.stats.length ? `<div class="pv-stats pv-section">
      ${d.stats.map(s=>`<div class="pv-stat"><div class="n">${escapeHtml(String(s.n||""))}</div><div class="l">${escapeHtml(String(s.l||""))}</div></div>`).join("")}
    </div>` : ""}
    ${d.services.length ? `<div class="pv-features pv-section">
      ${d.services.map(s=>`<div class="pv-feature"><div class="ico">${escapeHtml(String(s.icon||"✨"))}</div><strong>${escapeHtml(s.title||"")}</strong><span>${escapeHtml(s.desc||"")}</span></div>`).join("")}
    </div>` : ""}
    ${d.testimonial.quote ? `<div class="pv-testimonial pv-section">
      <div class="pv-quote">${escapeHtml(d.testimonial.quote)}</div>
      <div class="pv-author">— ${escapeHtml(d.testimonial.author||"")}</div>
    </div>` : ""}
    ${d.finalTitle ? `<div class="pv-final pv-section">
      <h5>${escapeHtml(d.finalTitle)}</h5>
      <p>${escapeHtml(d.finalSub)}</p>
      <button>${escapeHtml(d.finalBtn)}</button>
    </div>` : ""}
  `;
  // animate sections in sequence
  body.querySelectorAll(".pv-section").forEach((el,i)=>{
    setTimeout(()=>el.classList.add("show"), 180 + i*140);
  });
}

/* ===========================================================
   DEMO 4 — CONTENT GENERATOR (Claude API)
   =========================================================== */
let activePlatform = "instagram";
document.querySelectorAll(".platform-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".platform-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activePlatform = btn.dataset.platform;
  });
});

const cgRun = document.getElementById("cg-run");
const cgOut = document.getElementById("cg-output");
cgRun.addEventListener("click", async ()=>{
  const topic = (document.getElementById("cg-topic").value || "").trim();
  if(!topic){
    cgOut.innerHTML = `<span class="placeholder">${currentLang==="zh"?"請先輸入主題":"Please enter a topic first."}</span>`;
    return;
  }
  cgRun.disabled = true;
  cgOut.innerHTML = `<span class="placeholder">${currentLang==="zh"?"AI 生成中…":"AI is writing…"}</span>`;

  const platformLabel = {instagram:"Instagram",facebook:"Facebook",linkedin:"LinkedIn"}[activePlatform];
  const styleHints = {
    instagram: currentLang==="zh"
      ? "風格：年輕、生活感、重視視覺。大量使用 emoji，3–5 個 hashtag，分段乾淨、節奏明快。控制在 80 字內。"
      : "Style: young, lifestyle-driven, visual. Plenty of emojis, 3–5 hashtags, snappy paragraphs. Under 70 words.",
    facebook: currentLang==="zh"
      ? "風格：偏對話式、像跟朋友分享。可使用少量 emoji，輕鬆但帶有 CTA。控制在 100 字內。"
      : "Style: conversational, like sharing with friends. Light emojis, easy CTA. Under 80 words.",
    linkedin: currentLang==="zh"
      ? "風格：專業、富洞察、針對企業 / 上班族受眾。少量或不使用 emoji，結構清楚（鉤子 → 觀點 → 行動）。控制在 130 字內。"
      : "Style: professional, insight-driven, for executives. Minimal emojis. Hook → insight → CTA. Under 110 words.",
  }[activePlatform];

  const sysPrompt = (currentLang==="zh"
    ? `你是專業的社交媒體文案寫手。請為 ${platformLabel} 平台撰寫一則貼文。${styleHints} 直接輸出貼文內容即可，不需要前言或說明。`
    : `You are a senior social media copywriter. Write one post for ${platformLabel}. ${styleHints} Output the post only — no preface or commentary.`);

  try{
    const reply = await callClaude({
      system: sysPrompt,
      messages: [{role:"user", content: topic}],
    });
    cgOut.innerHTML = `<div class="platform-tag ${activePlatform}">${platformLabel}</div>${escapeHtml(reply)}`;
  }catch(e){
    cgOut.innerHTML = `<span class="placeholder">⚠️ ${currentLang==="zh"?"連接 AI 服務失敗。":"Failed to reach AI service."}\n${e.message||e}</span>`;
  }finally{
    cgRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 5 — CUSTOMER INTENT ANALYZER
   =========================================================== */
const iaRun = document.getElementById("ia-run");
iaRun.addEventListener("click", async ()=>{
  const text = (document.getElementById("ia-input").value || "").trim();
  if(!text){
    document.getElementById("ia-reply").textContent = currentLang==="zh"?"請先貼入客戶訊息":"Please paste a customer message.";
    return;
  }
  iaRun.disabled = true;
  const lang = currentLang;
  const setVal = (id,v)=>{ document.getElementById(id).textContent = v; };
  setVal("ia-urgency","…"); setVal("ia-mood","…"); setVal("ia-category","…");
  setVal("ia-reply", lang==="zh" ? "AI 分析中…" : "Analyzing…");

  const sysPrompt = lang === "zh"
    ? `你是客服分析師。用戶會貼一段客戶訊息，請分析並**只回覆 JSON**：
{
  "urgency": "高 | 中 | 低",
  "mood": "正面 | 中性 | 負面",
  "category": "查詢 / 投訴 / 銷售 / 售後 / 退款 / 其他 的其中一個",
  "reply": "用同樣語氣寫一封專業、有同理心的回覆，2-4 句"
}`
    : `You are a customer-care analyst. Given a customer message, reply ONLY with JSON:
{
  "urgency": "High | Medium | Low",
  "mood": "Positive | Neutral | Negative",
  "category": "one of: Inquiry / Complaint / Sales / Support / Refund / Other",
  "reply": "a professional, empathetic 2-4 sentence reply"
}`;

  try{
    const reply = await callClaude({
      system: sysPrompt,
      messages: [{role:"user", content:text}],
    });
    const json = extractJSON(reply);
    if(!json) throw new Error("Invalid JSON from AI");

    setVal("ia-urgency", json.urgency || "—");
    setVal("ia-mood",    json.mood    || "—");
    setVal("ia-category",json.category|| "—");
    setVal("ia-reply",   json.reply   || "—");

    // colour the urgency / mood chips
    const urgencyChip = document.getElementById("ia-chip-urgency");
    const moodChip    = document.getElementById("ia-chip-mood");
    urgencyChip.className = "intent-chip " + urgencyClass(json.urgency);
    moodChip.className    = "intent-chip " + moodClass(json.mood);
  }catch(e){
    setVal("ia-reply", "⚠️ " + (e.message || e));
  }finally{
    iaRun.disabled = false;
  }
});
function urgencyClass(v){
  if(!v) return "";
  const s = String(v).toLowerCase();
  if(s.includes("高")||s.includes("high"))   return "urgency-high";
  if(s.includes("中")||s.includes("med"))    return "urgency-medium";
  if(s.includes("低")||s.includes("low"))    return "urgency-low";
  return "";
}
function moodClass(v){
  if(!v) return "";
  const s = String(v).toLowerCase();
  if(s.includes("正")||s.includes("pos")) return "mood-positive";
  if(s.includes("負")||s.includes("neg")) return "mood-negative";
  return "mood-neutral";
}

/* ===========================================================
   DEMO 6 — SALES FOLLOW-UP EMAIL
   =========================================================== */
const seRun = document.getElementById("se-run");
seRun.addEventListener("click", async ()=>{
  const name    = (document.getElementById("se-name").value    || "").trim();
  const company = (document.getElementById("se-company").value || "").trim();
  const ctx     = (document.getElementById("se-context").value || "").trim();
  if(!name || !company){
    document.getElementById("se-body").innerHTML = `<span class="placeholder">${currentLang==="zh"?"請填客戶姓名和公司":"Please fill in name and company."}</span>`;
    return;
  }
  seRun.disabled = true;
  const lang = currentLang;
  document.getElementById("se-to").textContent = `${name} <${name.toLowerCase().replace(/\s+/g,".")}@${company.split(/[\s\/]/)[0].toLowerCase().replace(/[^a-z]/g,"")}.com>`;
  document.getElementById("se-subject").textContent = lang==="zh"?"AI 撰寫中…":"AI drafting…";
  document.getElementById("se-body").innerHTML = `<div class="dot-typing"><span></span><span></span><span></span></div>`;

  const sysPrompt = lang === "zh"
    ? `你是資深 B2B 銷售。為 TBC Solutions（一間提供 AI 自動化 + 網頁開發的顧問公司）撰寫一封專業、簡潔、有溫度的跟進電郵。
**只回覆 JSON**，格式：
{
  "subject": "8-15 字的吸引主旨",
  "body": "150-220 字的完整郵件內文（包含問候 → 提及上次重點 → 呼應客戶需求 → 提出下一步 → 結尾）。署名請用『Grouper｜TBC Solutions』。"
}`
    : `You are a senior B2B sales rep. Write a professional, concise, warm follow-up email for TBC Solutions (a consultancy offering AI automation + web development).
**Reply ONLY with JSON**:
{
  "subject": "5-9 word compelling subject line",
  "body": "120-180 word full email body (greeting → reference last interaction → echo client needs → propose next step → sign-off). Sign as 'Grouper | TBC Solutions'."
}`;

  const userMsg = lang === "zh"
    ? `客戶姓名：${name}\n公司／行業：${company}\n上次重點：${ctx || "未提供"}`
    : `Client name: ${name}\nCompany / Industry: ${company}\nLast interaction: ${ctx || "Not provided"}`;

  try{
    const reply = await callClaude({
      system: sysPrompt,
      messages: [{role:"user", content:userMsg}],
    });
    const json = extractJSON(reply);
    if(!json) throw new Error("Invalid JSON from AI");
    document.getElementById("se-subject").textContent = json.subject || "—";
    document.getElementById("se-body").textContent    = json.body    || "—";
  }catch(e){
    document.getElementById("se-subject").textContent = lang==="zh"?"⚠️ 失敗":"⚠️ Failed";
    document.getElementById("se-body").innerHTML = `<span class="placeholder">${e.message || e}</span>`;
  }finally{
    seRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 7 — MEETING SUMMARY
   =========================================================== */
const msRun = document.getElementById("ms-run");
msRun?.addEventListener("click", async ()=>{
  const text = (document.getElementById("ms-input").value || "").trim();
  const out  = document.getElementById("ms-output");
  if(!text){
    out.innerHTML = `<div class="ms-card empty show"><div class="ms-content">${currentLang==="zh"?"請先貼入會議內容":"Please paste meeting content first."}</div></div>`;
    return;
  }
  msRun.disabled = true;
  out.innerHTML = `<div class="ms-card show"><div class="ms-content"><div class="dot-typing"><span></span><span></span><span></span></div> ${currentLang==="zh"?"AI 整理中…":"AI is summarising…"}</div></div>`;

  const sysPrompt = currentLang === "zh"
    ? `你是專業會議速記員。根據用戶貼入的會議內容，提取以下三項。**只回覆 JSON**：
{
  "summary": "2-3 句綜合摘要",
  "actions": ["具體行動項目（含負責人/截止日期 if mentioned）", "..."],
  "decisions": ["主要決定（清晰列出）", "..."]
}`
    : `You are a meeting note-taker. Given a transcript, extract the three sections. **Reply ONLY with JSON**:
{
  "summary": "2-3 sentence overview",
  "actions": ["concrete action items (with owner/deadline if mentioned)", "..."],
  "decisions": ["clear key decisions", "..."]
}`;

  try{
    const reply = await callClaude({system:sysPrompt, messages:[{role:"user", content:text}]});
    const json = extractJSON(reply);
    if(!json) throw new Error("Invalid JSON from AI");
    const labels = currentLang === "zh"
      ? {summary:"摘要", actions:"行動項目", decisions:"主要決定"}
      : {summary:"Summary", actions:"Action items", decisions:"Key decisions"};

    const renderList = arr => Array.isArray(arr) && arr.length
      ? `<ul class="ms-list">${arr.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : `<div class="ms-content" style="color:var(--text-faint);font-style:italic">—</div>`;

    out.innerHTML = `
      <div class="ms-card"><div class="ms-lbl"><span class="ico">📋</span> ${labels.summary}</div><div class="ms-content">${escapeHtml(json.summary || "—")}</div></div>
      <div class="ms-card"><div class="ms-lbl"><span class="ico">✅</span> ${labels.actions}</div>${renderList(json.actions)}</div>
      <div class="ms-card"><div class="ms-lbl"><span class="ico">🎯</span> ${labels.decisions}</div>${renderList(json.decisions)}</div>
    `;
    out.querySelectorAll(".ms-card").forEach((c,i)=>setTimeout(()=>c.classList.add("show"), i*150));
  }catch(e){
    out.innerHTML = `<div class="ms-card show"><div class="ms-content">⚠️ ${e.message || e}</div></div>`;
  }finally{
    msRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 8 — MULTI-LANG TRANSLATION
   =========================================================== */
let trTone = "formal";
document.querySelectorAll("#tr-tone-row .platform-btn").forEach(b=>{
  b.addEventListener("click", ()=>{
    document.querySelectorAll("#tr-tone-row .platform-btn").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    trTone = b.dataset.tone;
  });
});
const trRun = document.getElementById("tr-run");
trRun?.addEventListener("click", async ()=>{
  const text = (document.getElementById("tr-input").value || "").trim();
  const lang = document.getElementById("tr-lang").value;
  const out  = document.getElementById("tr-output");
  if(!text){
    out.innerHTML = `<span class="placeholder">${currentLang==="zh"?"請先輸入要翻譯的文字":"Please enter text to translate."}</span>`;
    return;
  }
  trRun.disabled = true;
  out.innerHTML = `<span class="placeholder"><div class="dot-typing"><span></span><span></span><span></span></div> ${currentLang==="zh"?"AI 翻譯中…":"Translating…"}</span>`;

  const sysPrompt = `You are a professional translator. Translate the source text into ${lang} with a ${trTone} tone. Preserve meaning and adapt to the target culture. **Reply ONLY with JSON**:
{
  "translation": "the translated text",
  "note": "1 short cultural / contextual note explaining a key choice (or null)"
}`;
  try{
    const reply = await callClaude({system:sysPrompt, messages:[{role:"user", content:text}]});
    const json = extractJSON(reply);
    if(!json || !json.translation) throw new Error("Invalid JSON from AI");
    const noteLabel = currentLang === "zh" ? "文化備註" : "Cultural note";
    out.innerHTML = `<div class="tr-text">${escapeHtml(json.translation)}</div>` +
      (json.note ? `<div class="tr-note"><strong>${noteLabel}</strong>${escapeHtml(json.note)}</div>` : "");
  }catch(e){
    out.innerHTML = `<span class="placeholder">⚠️ ${e.message || e}</span>`;
  }finally{
    trRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 9 — REVIEW REPLY GENERATOR
   =========================================================== */
const rvRun = document.getElementById("rv-run");
rvRun?.addEventListener("click", async ()=>{
  const text = (document.getElementById("rv-input").value || "").trim();
  const biz  = (document.getElementById("rv-business").value || "").trim() || (currentLang==="zh"?"我們公司":"our business");
  const out  = document.getElementById("rv-output");
  if(!text){
    out.innerHTML = `<div class="rv-card show"><div class="rv-text">${currentLang==="zh"?"請先貼入評論":"Please paste a review."}</div></div>`;
    return;
  }
  rvRun.disabled = true;
  out.innerHTML = `<div class="rv-card show"><div class="rv-text"><div class="dot-typing"><span></span><span></span><span></span></div> ${currentLang==="zh"?"AI 撰寫中…":"AI drafting replies…"}</div></div>`;

  const sysPrompt = currentLang === "zh"
    ? `你是品牌客戶關係專家。根據用戶提供的客戶評論，為「${biz}」撰寫 3 個不同風格的回覆。判斷評論是正面/負面，調整語氣。**只回覆 JSON**：
{
  "replies": [
    {"tone": "正式專業", "text": "..."},
    {"tone": "親切溫暖", "text": "..."},
    {"tone": "真誠致歉/感謝", "text": "..."}
  ]
}`
    : `You are a brand customer relations expert. Given a review for "${biz}", write 3 distinct reply styles. Detect tone (positive/negative) and adapt accordingly. **Reply ONLY with JSON**:
{
  "replies": [
    {"tone": "Formal & professional", "text": "..."},
    {"tone": "Warm & friendly", "text": "..."},
    {"tone": "Sincerely apologetic/grateful", "text": "..."}
  ]
}`;
  try{
    const reply = await callClaude({system:sysPrompt, messages:[{role:"user", content:text}]});
    const json = extractJSON(reply);
    if(!json || !Array.isArray(json.replies)) throw new Error("Invalid JSON from AI");
    out.innerHTML = json.replies.slice(0,3).map(r=>`
      <div class="rv-card">
        <div class="rv-tone">${escapeHtml(r.tone || "")}</div>
        <div class="rv-text">${escapeHtml(r.text || "")}</div>
      </div>`).join("");
    out.querySelectorAll(".rv-card").forEach((c,i)=>setTimeout(()=>c.classList.add("show"), i*180));
  }catch(e){
    out.innerHTML = `<div class="rv-card show"><div class="rv-text">⚠️ ${e.message || e}</div></div>`;
  }finally{
    rvRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 10 — SEO TITLE GENERATOR
   =========================================================== */
const seoRun = document.getElementById("seo-run");
seoRun?.addEventListener("click", async ()=>{
  const topic = (document.getElementById("seo-topic").value || "").trim();
  const kw    = (document.getElementById("seo-keyword").value || "").trim();
  const out   = document.getElementById("seo-output");
  if(!topic || !kw){
    out.innerHTML = `<div class="rv-card show"><div class="rv-text">${currentLang==="zh"?"請填入主題和關鍵字":"Please fill in topic and keyword."}</div></div>`;
    return;
  }
  seoRun.disabled = true;
  out.innerHTML = `<div class="rv-card show"><div class="rv-text"><div class="dot-typing"><span></span><span></span><span></span></div> ${currentLang==="zh"?"AI 生成中…":"AI generating…"}</div></div>`;

  const sysPrompt = currentLang === "zh"
    ? `你是 SEO 文案專家。根據用戶提供的主題和關鍵字，生成 5 個 SEO 標題。每個不同切入角度（懸念式 / 數字列表 / How-to / 問題式 / 直接利益）。每個標題長度 30-60 字元，自然嵌入關鍵字。
**只回覆 JSON**：
{
  "titles": [
    {"angle": "切入角度（4-6 字描述）", "title": "標題", "score": 1-100 點擊吸引力評分},
    ...共 5 個
  ]
}`
    : `You are an SEO copywriter. Given a topic and primary keyword, generate 5 SEO-optimized titles. Each takes a different angle (curiosity / list / how-to / question / direct benefit). 30-60 chars, keyword embedded naturally.
**Reply ONLY with JSON**:
{
  "titles": [
    {"angle": "angle (2-3 words)", "title": "the title", "score": 1-100 click attractiveness},
    ...5 total
  ]
}`;
  try{
    const reply = await callClaude({system:sysPrompt, messages:[{role:"user", content:`Topic: ${topic}\nKeyword: ${kw}`}]});
    const json = extractJSON(reply);
    if(!json || !Array.isArray(json.titles)) throw new Error("Invalid JSON from AI");
    out.innerHTML = json.titles.slice(0,5).map(t=>`
      <div class="rv-card">
        <div class="rv-tone">${escapeHtml(t.angle || "")} · ${currentLang==="zh"?"評分":"Score"} ${t.score ?? "—"}/100</div>
        <div class="rv-text" style="font-weight:600;font-size:15px">${escapeHtml(t.title || "")}</div>
      </div>`).join("");
    out.querySelectorAll(".rv-card").forEach((c,i)=>setTimeout(()=>c.classList.add("show"), i*140));
  }catch(e){
    out.innerHTML = `<div class="rv-card show"><div class="rv-text">⚠️ ${e.message || e}</div></div>`;
  }finally{
    seoRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 11 — PRODUCT COPY (E-COMMERCE)
   =========================================================== */
const pcRun = document.getElementById("pc-run");
pcRun?.addEventListener("click", async ()=>{
  const name = (document.getElementById("pc-name").value || "").trim();
  const feat = (document.getElementById("pc-features").value || "").trim();
  const out  = document.getElementById("pc-output");
  if(!name || !feat){
    out.innerHTML = `<span class="placeholder">${currentLang==="zh"?"請填入產品名和特色":"Please fill in product name and features."}</span>`;
    return;
  }
  pcRun.disabled = true;
  out.innerHTML = `<span class="placeholder"><div class="dot-typing"><span></span><span></span><span></span></div> ${currentLang==="zh"?"AI 撰寫中…":"AI writing…"}</span>`;

  const sysPrompt = currentLang === "zh"
    ? `你是電商文案專家。根據產品名和特色，撰寫一段適合上架的完整商品文案。包含：
1. 一句吸引人的開場（喚起需求或情感）
2. 3 個 bullet point 列出核心賣點（用 emoji 開頭）
3. 一句 closing CTA

控制 100-150 字。直接輸出文案，不需要前言。`
    : `You are an e-commerce copywriter. Given a product name and features, write complete product page copy. Include:
1. A compelling one-line opener (evoking need or emotion)
2. 3 bulleted key benefits (each starting with an emoji)
3. A closing CTA line

Keep to 90-130 words. Output only the copy, no preamble.`;
  try{
    const reply = await callClaude({system:sysPrompt, messages:[{role:"user", content:`產品: ${name}\n特色: ${feat}`}]});
    out.textContent = reply.trim();
  }catch(e){
    out.innerHTML = `<span class="placeholder">⚠️ ${e.message || e}</span>`;
  }finally{
    pcRun.disabled = false;
  }
});

/* ===========================================================
   DEMO 12 — WAREHOUSE SMART ROUTING
   =========================================================== */
const whRun = document.getElementById("wh-run");
whRun?.addEventListener("click", async ()=>{
  const sku = (document.getElementById("wh-sku").value || "").trim();
  const qty = +(document.getElementById("wh-qty").value || 0);
  const out = document.getElementById("wh-output");
  if(!sku || !qty){
    out.innerHTML = `<div class="wh-card show"><div class="wh-info"><div class="wh-name">${currentLang==="zh"?"請填入 SKU 與訂購數量":"Please fill in SKU and quantity."}</div></div></div>`;
    return;
  }
  whRun.disabled = true;
  out.innerHTML = `<div class="wh-card show"><div class="wh-info"><div class="wh-name"><div class="dot-typing"><span></span><span></span><span></span></div></div><div class="wh-meta">${currentLang==="zh"?"AI 正在分析三個倉庫的庫存與運費…":"AI is checking stock and routing across warehouses…"}</div></div></div>`;

  const sysPrompt = currentLang === "zh"
    ? `你是 B2B 倉儲調貨 AI 顧問。用戶提供產品 SKU 與訂購數量，請模擬一個跨地區倉庫網絡（3 個倉庫，含旗幟 emoji，地點可在亞太地區），根據產品類型估算合理庫存數字、預計送達時間、運費、庫存狀態，並推薦最佳出貨倉。

**只回覆 JSON**，不要其他文字：
{
  "warehouses": [
    {
      "name": "倉庫名稱 (含旗幟 emoji，如：🇭🇰 香港中央倉)",
      "stock": 整數庫存數字,
      "delivery": "預計送達 (例：1-2 日)",
      "shipping": "運費 (例：HK$ 80)",
      "status": "normal | low | out"
    },
    第二個倉庫,
    第三個倉庫
  ],
  "recommended_index": 0,
  "reason": "推薦原因 (15-30 字)",
  "insights": [
    {"type": "warning|suggestion|saving", "ico": "emoji", "text": "洞察文字 (15-35 字)"},
    再來 1-2 個洞察
  ]
}`
    : `You are a B2B warehouse routing AI advisor. Given a product SKU and order quantity, simulate a 3-warehouse network (with flag emojis, Asia-Pacific locations), estimate realistic stock counts, delivery times, shipping costs and stock status, then recommend the best warehouse.

**Reply ONLY with JSON**, no other text:
{
  "warehouses": [
    {
      "name": "Warehouse name (with flag emoji, e.g., 🇭🇰 HK Central)",
      "stock": integer,
      "delivery": "Estimated delivery (e.g., 1-2 days)",
      "shipping": "Shipping cost (e.g., HK$ 80)",
      "status": "normal | low | out"
    },
    second warehouse,
    third warehouse
  ],
  "recommended_index": 0,
  "reason": "Why this warehouse (10-20 words)",
  "insights": [
    {"type": "warning|suggestion|saving", "ico": "emoji", "text": "Insight text (10-25 words)"},
    1-2 more insights
  ]
}`;

  try{
    const reply = await callClaude({
      system: sysPrompt,
      messages: [{role:"user", content:`SKU: ${sku}\nQuantity: ${qty}`}],
      max_tokens: 900,
    });
    const json = extractJSON(reply);
    if(!json || !Array.isArray(json.warehouses)) throw new Error("Invalid JSON from AI");
    renderWarehouseResult(out, json);
  }catch(e){
    out.innerHTML = `<div class="wh-card show"><div class="wh-info"><div class="wh-name">⚠️ ${e.message || e}</div></div></div>`;
  }finally{
    whRun.disabled = false;
  }
});

function renderWarehouseResult(out, json){
  const recIdx = typeof json.recommended_index === "number" ? json.recommended_index : 0;
  const stockLabel = currentLang === "zh" ? "件庫存" : "IN STOCK";
  const cards = json.warehouses.map((w,i)=>{
    const statusClass = w.status === "low" ? "lowstock" : w.status === "out" ? "outofstock" : "";
    const recClass = i === recIdx ? "recommended" : "";
    return `<div class="wh-card ${recClass} ${statusClass}">
      <div class="wh-info">
        <div class="wh-name">${escapeHtml(w.name || "")}</div>
        <div class="wh-meta">
          <span>🚚 ${escapeHtml(w.delivery || "")}</span>
          <span>💰 ${escapeHtml(w.shipping || "")}</span>
        </div>
        ${i===recIdx && json.reason ? `<div class="wh-reason">${escapeHtml(json.reason)}</div>` : ""}
      </div>
      <div class="wh-stock">
        <div class="num">${Number(w.stock||0).toLocaleString()}</div>
        <div class="lbl">${stockLabel}</div>
      </div>
    </div>`;
  }).join("");

  const insights = Array.isArray(json.insights) ? json.insights : [];
  const insightsHTML = insights.length
    ? `<div class="wh-insights">${insights.map(i=>`
        <div class="wh-insight ${escapeHtml(i.type||"")}">
          <div class="ico">${escapeHtml(i.ico||"💡")}</div>
          <div>${escapeHtml(i.text||"")}</div>
        </div>`).join("")}</div>`
    : "";

  out.innerHTML = cards + insightsHTML;
  out.querySelectorAll(".wh-card").forEach((c,i)=>setTimeout(()=>c.classList.add("show"), i*180));
  out.querySelectorAll(".wh-insight").forEach((c,i)=>setTimeout(()=>c.classList.add("show"), 600 + i*150));
}

/* ===========================================================
   DEMO 13 — BUSINESS DIAGNOSIS WIZARD
   =========================================================== */
(function wizard(){
  const state = { step:1, company:"", industry:"", headcount:"", pains:[] };

  // segmented control — headcount
  const segs = document.querySelectorAll("#wz-headcount .wz-seg");
  segs.forEach(s => s.addEventListener("click", ()=>{
    segs.forEach(x => x.classList.remove("active"));
    s.classList.add("active");
    state.headcount = s.dataset.val;
  }));

  // pain chips (max 3)
  const chips = document.querySelectorAll("#wz-pains .wz-chip");
  chips.forEach(c => c.addEventListener("click", ()=>{
    const v = c.dataset.pain;
    if(c.classList.contains("checked")){
      c.classList.remove("checked");
      state.pains = state.pains.filter(x => x !== v);
    } else {
      if(state.pains.length >= 3){
        // shake animation feedback
        c.animate([{transform:"translateX(0)"},{transform:"translateX(-4px)"},{transform:"translateX(4px)"},{transform:"translateX(0)"}], {duration:240});
        return;
      }
      c.classList.add("checked");
      state.pains.push(v);
    }
  }));

  function gotoStep(n){
    state.step = n;
    document.querySelectorAll(".wizard-pane").forEach(p => p.classList.remove("active"));
    document.getElementById("wz-pane-"+n).classList.add("active");
    document.querySelectorAll(".wz-step-pill").forEach(p => {
      const s = +p.dataset.step;
      p.classList.toggle("current", s === n);
      p.classList.toggle("done", s < n);
    });
    document.getElementById("wz-dash").style.setProperty("--fill", n >= 2 ? "100%" : "0%");
    document.getElementById("wz-dash-2").style.setProperty("--fill", n >= 3 ? "100%" : "0%");
  }

  // Step 1 → 2
  document.getElementById("wz-next-1")?.addEventListener("click", ()=>{
    state.company  = (document.getElementById("wz-company").value || "").trim();
    state.industry = (document.getElementById("wz-industry").value || "").trim();
    if(!state.company || !state.industry || !state.headcount){
      const msg = currentLang === "zh" ? "請填齊公司名、行業同員工人數" : "Please fill in company, industry and team size.";
      const tip = document.createElement("div");
      tip.style.cssText = "padding:10px 14px;border-radius:10px;background:rgba(255,140,140,.10);border:1px solid rgba(255,140,140,.32);color:#ffd1d1;font-size:13px;margin-top:10px";
      tip.textContent = msg;
      const old = document.querySelector("#wz-pane-1 .wz-validation");
      if(old) old.remove();
      tip.className = "wz-validation";
      document.querySelector("#wz-pane-1 .wz-actions").after(tip);
      setTimeout(()=>tip.remove(), 3500);
      return;
    }
    gotoStep(2);
  });

  // Step 2 back / generate
  document.getElementById("wz-back-2")?.addEventListener("click", ()=> gotoStep(1));
  document.getElementById("wz-generate")?.addEventListener("click", async ()=>{
    if(state.pains.length === 0){
      const c = document.querySelectorAll("#wz-pains .wz-chip")[0];
      c.animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}], {duration:280});
      return;
    }
    gotoStep(3);
    await runWizardAI();
  });

  // SVG path constant for score ring (r=45 circumference ≈ 283)
  async function runWizardAI(){
    const container = document.getElementById("wz-report-container");
    container.innerHTML = `<div class="wz-loading"><div class="dot-typing"><span></span><span></span><span></span></div><div>${currentLang==="zh"?"AI 正在分析您的業務、配對方案 …":"AI is analysing your business and matching solutions…"}</div></div>`;

    const PAIN_LABELS = currentLang === "zh" ? {
      "follow-up":"客戶跟進", "content":"內容產出", "report":"報表彙整",
      "warehouse":"多倉庫管理", "support":"客服回覆", "sales":"銷售跟進",
      "translate":"多語翻譯", "review":"客戶評論回覆",
    } : {
      "follow-up":"Customer follow-up", "content":"Content production", "report":"Reporting",
      "warehouse":"Multi-warehouse", "support":"Customer support", "sales":"Sales follow-up",
      "translate":"Translation", "review":"Review replies",
    };

    const sysPrompt = currentLang === "zh"
      ? `你是 AI 自動化策略顧問。根據用戶的公司資料 + 痛點，為佢生成一份個人化的商業診斷報告。

可用的 AI 解決方案（demo_ref 對應 demo 編號）：
1=AI 工作流程自動化、2=AI 聊天助手、3=AI 網頁/品牌內容、4=AI 社交媒體內容、5=AI 客戶意圖分析、6=AI 銷售跟進信、7=AI 會議紀要、8=AI 多語翻譯、9=AI 評論回覆、10=AI SEO 標題、11=AI 電商產品文案、12=AI 多倉庫智能調貨

**只回覆 JSON**：
{
  "diagnosis": {
    "score": 30-90 的整數（根據員工人數 × 痛點數量 × 行業 AI 成熟度）,
    "industry_benchmark": "用戶行業的自動化程度描述（15-25 字）",
    "gap_summary": "用戶 vs 行業差距總結（20-35 字）"
  },
  "solutions": [
    {"icon":"emoji","title":"方案名（6-12 字）","demo_ref":1-12 整數,"desc":"方案如何解決痛點（15-25 字）","monthly_hours_saved":整數 8-50},
    再來 2 個
  ],
  "roi": {
    "total_hours": 三個方案小時數總和,
    "estimated_savings_hkd": total_hours × 300,
    "payback_months": 2-6 整數
  }
}`
      : `You are an AI automation strategy advisor. Generate a personalised business diagnosis report based on the user's company info + pain points.

Available AI solutions (demo_ref maps to demo number):
1=AI Workflow Automation, 2=AI Chat Assistant, 3=AI Web/Brand Copy, 4=AI Social Content, 5=Customer Intent, 6=Sales Follow-up, 7=Meeting Summary, 8=Translation, 9=Review Reply, 10=SEO Title, 11=Product Copy, 12=Warehouse Routing

**Reply ONLY with JSON**:
{
  "diagnosis": {
    "score": integer 30-90 (based on team size × pain count × industry AI maturity),
    "industry_benchmark": "describe automation maturity of user's industry (10-18 words)",
    "gap_summary": "user vs industry gap summary (12-20 words)"
  },
  "solutions": [
    {"icon":"emoji","title":"solution name (2-5 words)","demo_ref":1-12 int,"desc":"how it solves the pain (8-15 words)","monthly_hours_saved":int 8-50},
    2 more
  ],
  "roi": {
    "total_hours": sum of three hours,
    "estimated_savings_hkd": total_hours × 300,
    "payback_months": int 2-6
  }
}`;

    const painList = state.pains.map(p => PAIN_LABELS[p] || p).join(", ");
    const userMsg = currentLang === "zh"
      ? `公司：${state.company}\n行業：${state.industry}\n員工人數：${state.headcount}\n痛點：${painList}`
      : `Company: ${state.company}\nIndustry: ${state.industry}\nHeadcount: ${state.headcount}\nPain points: ${painList}`;

    try{
      const reply = await callClaude({system:sysPrompt, messages:[{role:"user", content:userMsg}], max_tokens:900});
      const json = extractJSON(reply);
      if(!json || !json.diagnosis) throw new Error("Invalid JSON from AI");
      renderWizardReport(container, json);
    }catch(e){
      container.innerHTML = `<div class="wz-card show"><div class="wz-card-head"><span class="ico">⚠️</span> Error</div><div>${e.message || e}</div></div>`;
    }
  }

  function renderWizardReport(container, json, overrideCompany, isPreview){
    const lang = currentLang;
    const company = overrideCompany || state.company || (lang==="zh"?"您的公司":"your company");
    const industry = json._industry || state.industry || "";
    const L_DIAGNOSIS = lang==="zh" ? "公司診斷" : "Diagnosis";
    const L_BENCH     = lang==="zh" ? "行業 benchmark：" : "Industry benchmark: ";
    const L_SOLUTIONS = lang==="zh" ? "為您推薦的 3 個方案" : "3 recommended solutions";
    const L_ROI       = lang==="zh" ? "預估 ROI" : "Estimated ROI";
    const L_HOURS     = lang==="zh" ? "節省 {n} 小時/月" : "Saves {n} hrs/month";
    const L_R1        = lang==="zh" ? "每月節省小時" : "Hours saved / mo";
    const L_R2        = lang==="zh" ? "估算月省金額" : "Monthly savings";
    const L_R3        = lang==="zh" ? "預估回本月數" : "Payback months";
    const L_CTA_TITLE = lang==="zh" ? `為「${company}」打造這套方案` : `Build this for ${company}`;
    const L_CTA_SUB   = lang==="zh" ? "留低聯絡，30 秒安排免費策略諮詢，幫您落地呢份報告。" : "Leave your details — we'll set up a free strategy call to put this report into action.";
    const L_CTA_BTN   = lang==="zh" ? `為「${company}」預約免費諮詢 →` : `Get my personalised AI consultation →`;
    const L_FORM_NAME    = lang==="zh" ? "您的名" : "Your name";
    const L_FORM_EMAIL   = lang==="zh" ? "Email" : "Email";
    const L_FORM_BIZ     = lang==="zh" ? "業務類型 (例：診所 / 物流 / 餐廳…)" : "Business type (e.g., Clinic / Logistics / Restaurant…)";
    const L_FORM_PHONE   = lang==="zh" ? "WhatsApp / 電話（可選）" : "WhatsApp / phone (optional)";
    const L_FORM_THANKS  = lang==="zh" ? "✅ 收到！正在為您安排預約 …" : "✅ Got it — taking you to booking…";
    const L_FORM_ALT     = lang==="zh" ? "或者用 Cal.com 直接選時間 ↓" : "Or pick a time on Cal.com ↓";
    const L_BANNER_TAG  = lang==="zh" ? "範例" : "EXAMPLE";
    const L_BANNER_TEXT = lang==="zh"
      ? `這份是 <strong>${escapeHtml(company)}</strong>${industry?` · ${escapeHtml(industry)}`:""} 的範例報告 — 想看您自己公司的？`
      : `This is a sample report for <strong>${escapeHtml(company)}</strong>${industry?` · ${escapeHtml(industry)}`:""}. Want one for your own?`;
    const L_BANNER_BTN  = lang==="zh" ? "✏️ 用您的公司試一次 →" : "✏️ Try with your company →";
    const L_JUMP_TIP    = lang==="zh" ? "撳卡片即試 →" : "Click to try →";

    const d = json.diagnosis;
    const score = Math.max(0, Math.min(100, +d.score || 0));
    const dashOffset = 283 - (283 * score / 100);

    const solutionsHtml = (json.solutions || []).slice(0,3).map(s => {
      const demoRef = +s.demo_ref || 0;
      const slideIdx = (demoRef >= 1 && demoRef <= 12) ? (demoRef - 1) : null;
      return `<div class="wz-solution" ${slideIdx !== null ? `data-jump-slide="${slideIdx}"` : ""}>
        <div class="ico-row"><div class="ico">${escapeHtml(s.icon||"✨")}</div>${slideIdx !== null ? `<span class="jump-arrow">→</span>` : ""}</div>
        <h5>${escapeHtml(s.title||"")}</h5>
        <p>${escapeHtml(s.desc||"")}</p>
        <span class="hours">${escapeHtml(L_HOURS.replace("{n}", String(s.monthly_hours_saved||0)))}</span>
      </div>`;
    }).join("");

    // Build preview banner HTML if needed
    const bannerHtml = isPreview ? `
      <div class="wz-preview-banner">
        <span class="wz-banner-tag">📋 ${L_BANNER_TAG}</span>
        <div class="wz-banner-text">${L_BANNER_TEXT}</div>
        <button class="wz-reset-btn">${L_BANNER_BTN}</button>
      </div>` : "";

    const r = json.roi || {};
    const totalHrs = +r.total_hours || 0;
    const savings  = (+r.estimated_savings_hkd || 0).toLocaleString();
    const payback  = +r.payback_months || 0;

    container.innerHTML = `
      ${bannerHtml}
      <div class="wz-card wz-diagnosis">
        <div class="wz-card-head"><span class="ico">📊</span> ${L_DIAGNOSIS}</div>
        <div class="wz-diagnosis-row">
          <div class="wz-score-ring">
            <svg viewBox="0 0 100 100" width="104" height="104">
              <circle class="ring-bg" cx="50" cy="50" r="45"/>
              <circle class="ring-fg" cx="50" cy="50" r="45" style="stroke-dashoffset:283"/>
            </svg>
            <div class="num" id="wz-score">0</div>
          </div>
          <div class="wz-score-meta">
            <div class="gap-summary">${escapeHtml(d.gap_summary||"")}</div>
            <div class="bench">${L_BENCH}${escapeHtml(d.industry_benchmark||"")}</div>
          </div>
        </div>
      </div>

      <div class="wz-card">
        <div class="wz-card-head"><span class="ico">🎯</span> ${L_SOLUTIONS}</div>
        <div class="wz-solutions">${solutionsHtml}</div>
      </div>

      <div class="wz-card wz-roi">
        <div class="item"><div class="num">${totalHrs}<span style="font-size:.55em;color:var(--text-dim);margin-left:3px">h</span></div><div class="label">${L_R1}</div></div>
        <div class="item"><div class="num">HK$ ${savings}</div><div class="label">${L_R2}</div></div>
        <div class="item"><div class="num">${payback}<span style="font-size:.55em;color:var(--text-dim);margin-left:3px">${lang==="zh"?"月":"mo"}</span></div><div class="label">${L_R3}</div></div>
      </div>

      <div class="wz-card wz-cta wz-leadform" id="wizard-end-form">
        <h5>${L_CTA_TITLE}</h5>
        <p>${L_CTA_SUB}</p>
        <form class="wz-lead-form" id="wz-lead-form" novalidate>
          <div class="wz-lead-row">
            <input type="text" name="name" required placeholder="${L_FORM_NAME}" autocomplete="name" />
            <input type="email" name="email" required placeholder="${L_FORM_EMAIL}" autocomplete="email" />
          </div>
          <div class="wz-lead-row">
            <input type="text" name="business" placeholder="${L_FORM_BIZ}" value="${escapeHtml(industry||"")}" />
            <input type="tel" name="phone" placeholder="${L_FORM_PHONE}" autocomplete="tel" />
          </div>
          <button type="submit" class="wz-lead-submit">
            <span>${L_CTA_BTN}</span>
          </button>
          <div class="wz-lead-alt">${L_FORM_ALT}</div>
        </form>
        <div class="wz-lead-thanks" id="wz-lead-thanks" hidden>${L_FORM_THANKS}</div>
      </div>
    `;

    // Animate banner + cards in
    const banner = container.querySelector(".wz-preview-banner");
    if(banner) setTimeout(()=>banner.classList.add("show"), 100);
    const cards = container.querySelectorAll(".wz-card");
    cards.forEach((c,i)=>setTimeout(()=>c.classList.add("show"), 200 + i*220));

    // Reset button — restart wizard with user's own data
    const resetBtn = container.querySelector(".wz-reset-btn");
    if(resetBtn){
      resetBtn.addEventListener("click", () => {
        if(window.__wizardReset) window.__wizardReset();
        const demoEl = document.getElementById("demo13");
        if(demoEl) demoEl.scrollIntoView({behavior:"smooth", block:"start"});
        setTimeout(() => {
          const c = document.getElementById("wz-company");
          if(c) c.focus();
        }, 600);
      });
    }

    // Lead capture form — save + auto-scroll to #book
    const leadForm = container.querySelector("#wz-lead-form");
    if(leadForm){
      leadForm.addEventListener("submit", e => {
        e.preventDefault();
        const fd = new FormData(leadForm);
        const lead = {
          name:     (fd.get("name")||"").toString().trim(),
          email:    (fd.get("email")||"").toString().trim(),
          business: (fd.get("business")||"").toString().trim(),
          phone:    (fd.get("phone")||"").toString().trim(),
          company:  company,
          industry: industry,
          source:   "wizard-end",
          ts:       new Date().toISOString(),
        };
        // Basic validation
        if(!lead.name || !lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)){
          leadForm.classList.add("invalid");
          setTimeout(()=>leadForm.classList.remove("invalid"), 400);
          return;
        }
        // Persist (multiple leads — append to array)
        try{
          const key = "tbc-leads";
          const prev = JSON.parse(localStorage.getItem(key) || "[]");
          prev.push(lead);
          localStorage.setItem(key, JSON.stringify(prev));
        }catch(_){}
        // UI feedback
        leadForm.hidden = true;
        const thanks = container.querySelector("#wz-lead-thanks");
        if(thanks) thanks.hidden = false;
        // Auto-scroll to #book after 700ms
        setTimeout(() => {
          const bookEl = document.getElementById("book");
          if(bookEl) bookEl.scrollIntoView({behavior:"smooth", block:"start"});
        }, 700);
      });
    }

    // Solution card — click to jump to corresponding demo
    container.querySelectorAll(".wz-solution[data-jump-slide]").forEach(card => {
      card.addEventListener("click", () => {
        const targetIdx = +card.dataset.jumpSlide;
        if(isNaN(targetIdx)) return;
        const targetTab = document.querySelector(`.demo-tab-btn[data-slide="${targetIdx}"]`);
        if(targetTab){
          targetTab.click();
          const demosEl = document.getElementById("demos");
          if(demosEl) demosEl.scrollIntoView({behavior:"smooth", block:"start"});
        }
      });
    });

    // Animate score ring + number
    setTimeout(()=>{
      const ring = container.querySelector(".ring-fg");
      if(ring) ring.style.strokeDashoffset = dashOffset;
      const scoreEl = container.querySelector("#wz-score");
      if(scoreEl){
        const start = performance.now();
        const dur = 1300;
        (function tick(now){
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1-t, 3);
          scoreEl.textContent = Math.round(score * eased);
          if(t < 1) requestAnimationFrame(tick);
        })(start);
      }
    }, 400);
  }

  // Expose for preview replay
  window.__wizardGoto = gotoStep;
  window.__wizardState = state;
  window.__renderWizardReport = renderWizardReport;
  window.__wizardReset = function(){
    state.step = 1;
    state.company = state.industry = state.headcount = "";
    state.pains = [];
    document.getElementById("wz-company").value = "";
    document.getElementById("wz-industry").value = "";
    document.querySelectorAll("#wz-headcount .wz-seg").forEach(s => s.classList.remove("active"));
    document.querySelectorAll("#wz-pains .wz-chip").forEach(c => c.classList.remove("checked"));
    gotoStep(1);
    const c = document.getElementById("wz-report-container");
    if(c) c.innerHTML = `<div class="wz-loading"><div class="dot-typing"><span></span><span></span><span></span></div><div>${currentLang==="zh"?"AI 正在分析您的業務、配對方案 …":"AI is analysing your business and matching solutions…"}</div></div>`;
  };
})();

/* ===========================================================
   AI BACKEND CALL — via serverless proxy (/api/claude)
   API Key 由後端持有，前端無法看到。
   =========================================================== */
async function callClaude({system, messages}){
  const res = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      system,
      messages: messages.map(m=>({role:m.role, content:m.content})),
    }),
  });
  const data = await res.json().catch(()=>({error:"Invalid JSON from /api/claude"}));
  if(!res.ok){
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return (data.reply || "").trim() || "(empty response)";
}

/* ===========================================================
   CAL.COM IFRAME LOAD
   =========================================================== */
(function loadCal(){
  const frame = document.getElementById("cal-frame");
  const fb = document.getElementById("book-fallback");
  if(!CAL_LINK || CAL_LINK === "YOUR_CAL_LINK_HERE"){
    frame.style.display = "none";
    fb.style.display = "block";
    return;
  }
  const url = CAL_LINK.startsWith("http") ? CAL_LINK : `https://cal.com/${CAL_LINK}`;
  frame.src = `${url}?embed=true&theme=dark`;
  fb.style.display = "none";
})();

/* ============== INIT ============== */
document.getElementById("yr").textContent = new Date().getFullYear();
buildMarquee();
(function initLang(){
  let saved = "zh";
  try{ saved = localStorage.getItem("tbc-lang") || "zh"; }catch(e){}
  if(saved !== "zh" && saved !== "en") saved = "zh";
  applyLang(saved);
})();

/* NOTE: We intentionally do NOT use gsap.from on .service-card / .demo-block
   because those elements also carry the .reveal class. gsap.from writes an
   inline opacity:0, which beats the .in class — if the ScrollTrigger never
   fires (initial layout race, etc.), the element stays invisible.
   The IntersectionObserver-based .reveal system above already handles them. */
