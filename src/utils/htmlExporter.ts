import { AppState } from '../types';
import { today } from './helpers';

export function generateStandaloneHTML(state: AppState, isViewOnlySnapshot = false): string {
  const safeJson = JSON.stringify(state).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const escapedForJs = JSON.stringify(safeJson);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<title>${state.settings.org || 'Brigade Eldorado'} — Ganeshotsava 2026${isViewOnlySnapshot ? ' (View Only Snapshot)' : ''}</title>
<meta name="description" content="Brigade Eldorado Ganeshotsava 2026 Event Planner & Financial Ledger">
<meta name="theme-color" content="#991b1b">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="GaneshaNamah">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js"></script>
<script id="initData">window.__E__=JSON.parse(${escapedForJs});</script>
<style>
/* ===== EDITORIAL RESET & TYPOGRAPHY ===== */
*{box-sizing:border-box;margin:0;padding:0}
html{width:100%;height:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{width:100%;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;background:#FDF8F3;color:#1A1A1A;font-size:14px;line-height:1.5;overflow-x:hidden;-webkit-tap-highlight-color:transparent;position:relative}
h1,h2,h3,.font-serif{font-family:'Playfair Display','Cinzel',Georgia,serif}
.font-mono{font-family:'JetBrains Mono',monospace}

/* ===== EDITORIAL HEADER ===== */
.header{background:#FFFFFF;border-bottom:1px solid #E7E5E4;border-top:6px solid #991B1B;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;box-sizing:border-box}
.header-left{display:flex;align-items:center;gap:14px}
.header-logo{width:56px;height:56px;object-fit:contain;border-radius:6px;border:1px solid #E7E5E4;display:none}
.header-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#991B1B;margin-bottom:2px}
.header h1{font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;margin:0}
.header p{font-size:12px;color:#78716C;margin:2px 0 0;letter-spacing:0.04em}
.header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ===== BADGES & CONTROLS ===== */
.admin-badge{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:700;display:none;white-space:nowrap;letter-spacing:0.05em;text-transform:uppercase}
.view-only-badge{background:#FEF3C7;border:1px solid #FDE68A;color:#92400E;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:700;display:none;white-space:nowrap;letter-spacing:0.05em;text-transform:uppercase}
.save-status{font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;display:none;white-space:nowrap}
.save-status.unsaved{background:#FFFBEB;border:1px solid #FDE68A;color:#B45309}
.save-status.saved{background:#ECFDF5;border:1px solid #A7F3D0;color:#047857}

/* ===== BUTTONS ===== */
.btn{border:none;padding:7px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;user-select:none;touch-action:manipulation;min-height:38px}
.btn:active{opacity:.8}
.btn-primary{background:#991B1B;color:#FFFFFF}
.btn-primary:hover{background:#7F1D1D}
.btn-dark{background:#1A1A1A;color:#FFFFFF}
.btn-dark:hover{background:#292524}
.btn-outline{background:#FFFFFF;border:1px solid #1A1A1A;color:#1A1A1A}
.btn-outline:hover{background:#1A1A1A;color:#FFFFFF}
.btn-success{background:#15803D;color:#FFFFFF}
.btn-success:hover{background:#166534}
.btn-ghost{background:#F5F5F4;border:1px solid #E7E5E4;color:#44403C}
.btn-ghost:hover{background:#E7E5E4}
.btn-danger{background:#DC2626;color:#FFFFFF}
.btn-wa{background:#25D366;color:#FFFFFF}
.btn-sm{padding:4px 9px;font-size:11px;min-height:32px}

/* ===== TABS ===== */
.tab-bar{display:flex;gap:24px;padding:0 24px;background:#FFFFFF;border-bottom:1px solid #E7E5E4;overflow-x:auto;-webkit-overflow-scrolling:touch}
.tab{background:none;border:none;border-bottom:2px solid transparent;padding:14px 0;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#78716C;white-space:nowrap;transition:all .18s;user-select:none}
.tab:hover{color:#1A1A1A}
.tab.active{border-bottom-color:#991B1B;color:#991B1B}

/* ===== MAIN CONTAINER ===== */
.main-wrap{max-width:1240px;margin:0 auto;padding:24px}
.section{display:none}.section.active{display:block}
.card{background:#FFFFFF;border:1px solid #E7E5E4;border-radius:6px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-bottom:20px}
.card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #F5F5F4}
.card-hdr h2{font-size:18px;font-weight:700;color:#1A1A1A}

/* ===== KPI STATS GRID ===== */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px}
.kpi{background:#FFFFFF;border:1px solid #E7E5E4;border-radius:6px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.03)}
.kpi-label{font-size:10px;font-weight:700;color:#78716C;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.15em}
.kpi-value{font-size:28px;font-weight:600;font-family:'JetBrains Mono',monospace;color:#1A1A1A}
.kpi.income .kpi-value{color:#15803D}
.kpi.expense .kpi-value{color:#DC2626}
.kpi.net .kpi-value{color:#991B1B;font-weight:700}

/* ===== TABLES ===== */
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;border:1px solid #E7E5E4;border-radius:6px;background:#FFFFFF}
table{width:100%;border-collapse:collapse;font-size:13px;user-select:none}
th{background:#FDF8F3;color:#57534E;padding:11px 16px;text-align:left;white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-bottom:1px solid #E7E5E4}
td{padding:12px 16px;border-bottom:1px solid #F5F5F4;vertical-align:middle}
tr:hover td{background:#FAFAF9}
.total-row td{background:#FEF2F2;font-weight:700;color:#7F1D1D;border-top:2px solid #991B1B;font-family:'JetBrains Mono',monospace}
.actions-cell{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.search-input{padding:7px 12px;border:1px solid #D6D3D1;border-radius:4px;font-size:13px;outline:none;background:#FFFFFF;width:240px}
.search-input:focus{border-color:#991B1B}

/* ===== BUDGET REPORT ===== */
.budget-table{width:100%;border-collapse:collapse;font-size:13px}
.budget-table tr{border-bottom:1px solid #F5F5F4}
.budget-table td{padding:11px 16px}
.budget-table td:last-child{text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600}
.budget-table .sec-hdr td{background:#FDF8F3;font-size:10px;font-weight:700;color:#78716C;text-transform:uppercase;letter-spacing:0.15em}
.budget-table .subtotal td{background:#FEF2F2;font-weight:700;color:#7F1D1D}
.budget-table .net-pos td{background:#ECFDF5;color:#047857;font-weight:700;font-size:15px}
.budget-table .net-neg td{background:#FEF2F2;color:#DC2626;font-weight:700;font-size:15px}

/* ===== MODALS ===== */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(26,26,26,.65);z-index:1000;justify-content:center;align-items:center;padding:16px;backdrop-filter:blur(2px)}
.modal-overlay.open{display:flex}
.modal{background:#FFFFFF;border:1px solid #E7E5E4;border-radius:8px;padding:24px;width:94%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 12px 40px rgba(0,0,0,.25)}
.modal-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #E7E5E4}
.modal-hdr h3{font-size:18px;font-weight:700;color:#991B1B}
.modal-close{background:none;border:none;font-size:24px;cursor:pointer;color:#78716C;line-height:1;padding:4px}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-grid .full{grid-column:1/-1}
.field{display:flex;flex-direction:column;gap:5px}
.field label{font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#44403C}
.field input,.field select,.field textarea{padding:8px 11px;border:1px solid #D6D3D1;border-radius:4px;font-size:13px;outline:none;background:#FFFFFF;color:#1A1A1A}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#991B1B}
.modal-footer{display:flex;gap:8px;justify-content:flex-end;margin-top:20px;padding-top:14px;border-top:1px solid #F5F5F4}

/* ===== SETTINGS ===== */
.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.settings-grid .full{grid-column:1/-1}
.logo-upload{border:1px dashed #D6D3D1;background:#FAFAF9;padding:16px;text-align:center;border-radius:4px;cursor:pointer}
.logo-upload:hover{border-color:#991B1B}
.logo-preview{max-width:90px;max-height:90px;margin:8px auto;display:none}
.danger-zone{border:1px solid #FECACA;border-radius:6px;padding:16px;background:#FFF5F5;margin-top:16px}
.danger-zone h3{color:#DC2626;font-size:14px;margin-bottom:4px}

/* ===== PRINT MEDIA ===== */
@media print{
  body>*:not(#billContainer){display:none!important}
  #billContainer{display:block!important;position:absolute;left:0;top:0;width:100%}
  .receipt,.invoice{border:2px solid #991B1B!important;background:#FFF!important;color:#000!important}
  @page{size:A4;margin:10mm}
}

/* ===== RECEIPT & INVOICE ===== */
.bill-container{display:none}
.receipt{width:100%;max-width:800px;margin:0 auto;border:2px solid #991B1B;padding:26px;font-family:'Plus Jakarta Sans',sans-serif;background:#FFF}
.rcp-top{display:flex;align-items:center;gap:16px;border-bottom:2px solid #991B1B;padding-bottom:14px;margin-bottom:14px}
.rcp-logo{width:70px;height:70px;object-fit:contain}
.rcp-heading{flex:1;text-align:center}
.rcp-heading h2{color:#991B1B;font-family:'Playfair Display',serif;font-size:22px;margin:0}
.rcp-heading h3{font-size:15px;margin:4px 0}
.rcp-heading p{font-size:11px;color:#57534E;margin:2px 0}
.rcp-meta{display:flex;justify-content:space-between;font-size:12px;margin:10px 0;padding:6px 0;border-bottom:1px solid #E7E5E4}
.rcp-row{display:flex;border-bottom:1px solid #F5F5F4;padding:8px 0;font-size:13px}
.rcp-lbl{width:36%;font-weight:700;color:#57534E;text-transform:uppercase;font-size:11px;letter-spacing:0.06em}
.rcp-val{width:64%}
.rcp-amt{text-align:center;margin:16px 0;padding:14px;border:1px solid #FDE68A;background:#FFFBEB;border-radius:6px}
.rcp-amt-title{font-size:10px;font-weight:700;color:#78716C;text-transform:uppercase;letter-spacing:0.1em}
.rcp-amt-num{font-size:26px;font-weight:700;font-family:'JetBrains Mono',monospace;color:#991B1B;margin:4px 0}
.rcp-amt-words{font-style:italic;font-size:11px;color:#57534E}
.rcp-qr{text-align:center;margin-top:14px}
.rcp-disc{border-top:1px solid #E7E5E4;margin-top:16px;padding-top:8px;font-size:10px;color:#78716C;line-height:1.4}
.rcp-footer{text-align:center;margin-top:14px;font-size:11px;color:#78716C;padding-top:10px;border-top:1px solid #E7E5E4}

/* INVOICE */
.invoice{width:100%;max-width:800px;margin:0 auto;padding:26px;font-family:'Plus Jakarta Sans',sans-serif;border:1px solid #D6D3D1;background:#FFF}
.inv-hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;margin-bottom:18px;border-bottom:3px solid #991B1B}
.inv-brand h2{color:#991B1B;font-family:'Playfair Display',serif;font-size:22px;margin-bottom:3px}
.inv-brand p{font-size:11px;color:#57534E;margin:2px 0}
.inv-meta{text-align:right;font-size:12px}
.inv-meta .inv-no{font-size:16px;font-weight:700;color:#991B1B;margin-bottom:4px;letter-spacing:0.05em}
.inv-to{background:#FAFAF9;border:1px solid #E7E5E4;padding:12px 14px;border-radius:4px;margin-bottom:16px;font-size:12px}
.inv-to-lbl{font-size:10px;font-weight:700;color:#78716C;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px}
.inv-items{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px}
.inv-items th{background:#991B1B;color:#FFF;padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.08em;text-transform:uppercase}
.inv-items td{padding:9px 10px;border-bottom:1px solid #F5F5F4}
.inv-items .inv-total-row td{border-top:2px solid #991B1B;font-weight:700;font-size:13px;padding-top:10px;font-family:'JetBrains Mono',monospace}
.inv-amt-words{text-align:right;font-style:italic;font-size:11px;color:#78716C;margin:4px 0 14px}
.inv-note{padding:12px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:4px;font-size:11px;color:#57534E;margin-bottom:18px}
.inv-footer{display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #E7E5E4;font-size:11px;color:#78716C;align-items:flex-end}
.inv-sig-line{width:140px;border-top:1px solid #1A1A1A;margin:24px 0 4px auto}

/* ===== MOBILE CARD VIEW ===== */
@media(max-width:768px){
  .header{flex-direction:column;align-items:flex-start;padding:14px 16px}
  .header-right{width:100%;justify-content:flex-start}
  .tab-bar{padding:0 16px;gap:16px}
  .main-wrap{padding:14px}
  .search-input{width:100%}
  .kpi-grid{grid-template-columns:1fr}
  .form-grid,.settings-grid{grid-template-columns:1fr}
}
</style>
</head>
<body>

<!-- HEADER -->
<div class="header no-print">
  <div class="header-left">
    <img id="headerLogo" class="header-logo" alt="Logo">
    <div>
      <div class="header-eyebrow">Brigade Eldorado Residents Association</div>
      <h1>🪔 Ganeshotsava 2026</h1>
      <p>3rd Year Celebration • 14th September – 18th September 2026</p>
    </div>
  </div>
  <div class="header-right">
    <span id="viewOnlyBadge" class="view-only-badge">👁 View Only</span>
    <button id="shareBtn" class="btn btn-outline" style="display:none" onclick="openShareModal()">📲 Share Snapshot</button>
    <span id="saveStatus" class="save-status unsaved"></span>
    <button id="connectBtn" class="btn btn-dark" onclick="connectActiveFile()">⚡ Connect File</button>
    <button id="saveHtmlBtn" class="btn btn-primary" onclick="saveAsHTML()">💾 Save HTML</button>
    <span id="adminBadge" class="admin-badge">🔓 Admin Active</span>
    <button id="adminToggleBtn" class="btn btn-ghost" onclick="toggleAdmin()" title="Admin Mode">🔓</button>
  </div>
</div>

<!-- TABS -->
<div class="tab-bar no-print">
  <button class="tab active" onclick="showTab('reportTab',this)">📊 Budget Report</button>
  <button class="tab" onclick="showTab('expensesTab',this)">💰 Expenses</button>
  <button class="tab" onclick="showTab('contributionsTab',this)">👥 Contributions</button>
  <button class="tab" onclick="showTab('sponsorsTab',this)">🏢 Sponsors</button>
  <button class="tab" onclick="showTab('sevasTab',this)">🙏 Sevas</button>
  <button id="settingsTab_btn" class="tab" onclick="showTab('settingsTab',this)">⚙️ Settings</button>
</div>

<div class="main-wrap">
  <!-- TAB: BUDGET REPORT -->
  <div id="reportTab" class="section active">
    <div class="kpi-grid">
      <div class="kpi income"><div class="kpi-label">Sponsor Contributions</div><div class="kpi-value" id="kpi_sp">₹ 0</div></div>
      <div class="kpi income"><div class="kpi-label">Resident Contributions</div><div class="kpi-value" id="kpi_ct">₹ 0</div></div>
      <div class="kpi income"><div class="kpi-label">Seva Bookings</div><div class="kpi-value" id="kpi_sv">₹ 0</div></div>
      <div class="kpi expense"><div class="kpi-label">Total Expenses (Actual)</div><div class="kpi-value" id="kpi_ex">₹ 0</div></div>
      <div class="kpi net"><div class="kpi-label">Net Balance</div><div class="kpi-value" id="kpi_net">₹ 0</div></div>
    </div>
    <div class="card">
      <div class="card-hdr"><h2>Editorial Financial Ledger Summary</h2></div>
      <table class="budget-table">
        <tbody>
          <tr class="sec-hdr"><td colspan="2">Income Sources</td></tr>
          <tr><td>Sponsor Contributions (Actual)</td><td id="bs_sp">₹ 0</td></tr>
          <tr><td>Resident Contributions</td><td id="bs_ct">₹ 0</td></tr>
          <tr><td>Seva Bookings</td><td id="bs_sv">₹ 0</td></tr>
          <tr class="subtotal"><td>Total Income</td><td id="bs_income">₹ 0</td></tr>
          <tr class="sec-hdr"><td colspan="2">Expenditure</td></tr>
          <tr><td>Expenses (Actual)</td><td id="bs_ex">₹ 0</td></tr>
          <tr class="subtotal"><td>Total Expenditure</td><td id="bs_expend">₹ 0</td></tr>
          <tr id="bs_netRow" class="net-pos"><td><strong>Net Balance</strong></td><td id="bs_net">₹ 0</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB: EXPENSES -->
  <div id="expensesTab" class="section">
    <div class="card">
      <div class="card-hdr">
        <h2>Estimated Expenses</h2>
        <div id="expToolbar"></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th style="width:40px">#</th>
            <th>Item / Description</th>
            <th>Estimated (₹)</th>
            <th>Advance (₹)</th>
            <th>Balance (₹)</th>
            <th>Actual (₹)</th>
            <th id="expActionsHdr" style="text-align:right">Actions</th>
          </tr></thead>
          <tbody id="expTbody"></tbody>
          <tfoot><tr class="total-row">
            <td colspan="2">Total</td>
            <td id="expTotEst">₹ 0</td>
            <td id="expTotAdv">₹ 0</td>
            <td id="expTotBal">₹ 0</td>
            <td id="expTotAct">₹ 0</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  </div>

  <!-- TAB: CONTRIBUTIONS -->
  <div id="contributionsTab" class="section">
    <div class="card">
      <div class="card-hdr" style="flex-wrap:wrap;gap:10px">
        <div>
          <h2>Resident Contributions</h2>
          <span style="font-size:12px;color:#78716C">Total: <strong id="ctTotalBar" style="color:#15803D">₹ 0</strong></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" class="search-input" id="ctSearch" placeholder="🔍 Search name, flat, receipt…" oninput="renderContributions()">
          <span id="ctToolbar"></span>
          <input type="file" id="ctImportFile" accept=".xlsx,.xls" style="display:none" onchange="importContributions(event)">
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Receipt No</th><th>Date</th><th>Name</th><th>Flat No</th>
            <th>Amount (₹)</th><th>Payment</th><th>Transaction Ref</th><th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody id="ctTbody"></tbody>
          <tfoot><tr class="total-row">
            <td colspan="4">Total Contributions</td>
            <td id="ctTotFoot">₹ 0</td><td colspan="3"></td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  </div>

  <!-- TAB: SPONSORS -->
  <div id="sponsorsTab" class="section">
    <div class="card">
      <div class="card-hdr">
        <h2>Sponsors</h2>
        <div id="spToolbar"></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Invoice No</th><th>Sponsor Details</th>
            <th>Estimated (₹)</th><th>Actual (₹)</th><th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody id="spTbody"></tbody>
          <tfoot><tr class="total-row">
            <td colspan="2">Total</td>
            <td id="spTotEst">₹ 0</td>
            <td id="spTotAct">₹ 0</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  </div>

  <!-- TAB: SEVAS -->
  <div id="sevasTab" class="section">
    <div class="card">
      <div class="card-hdr">
        <h2>Available Sevas Catalogue</h2>
        <div id="sevaCatToolbar"></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th style="width:40px">#</th>
            <th>Seva Name</th>
            <th>Suggested Amount (₹)</th>
            <th id="sevaCatActHdr" style="text-align:right">Actions</th>
          </tr></thead>
          <tbody id="sevaCatTbody"></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-hdr" style="flex-wrap:wrap;gap:10px">
        <h2>Seva Bookings</h2>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" class="search-input" id="svSearch" placeholder="🔍 Search seva, resident, flat…" oninput="renderSevas()">
          <span id="svToolbar"></span>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Token No</th><th>Seva Name</th><th>Resident Name</th>
            <th>Flat No</th><th>Amount (₹)</th><th>Date</th><th style="text-align:right">Actions</th>
          </tr></thead>
          <tbody id="svTbody"></tbody>
          <tfoot><tr class="total-row">
            <td colspan="4">Total Sevas</td>
            <td id="svTotFoot">₹ 0</td><td colspan="2"></td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  </div>

  <!-- TAB: SETTINGS -->
  <div id="settingsTab" class="section">
    <div class="card">
      <div class="card-hdr"><h2>Organization Settings</h2></div>
      <div class="settings-grid">
        <div class="field"><label>Organization Name</label><input id="set_org" value="Brigade Eldorado"></div>
        <div class="field"><label>Event Location</label><input id="set_location" value="Amphitheatre, Brigade Eldorado"></div>
        <div class="field"><label>UPI ID</label><input id="set_upi" placeholder="yourname@upi"><small style="color:#78716C;font-size:11px">Generates instant UPI QR code on receipts</small></div>
        <div class="field"><label>UPI Payee Name</label><input id="set_payee" value="Brigade Eldorado Ganeshotsava"></div>
        <div class="field full">
          <label>Event Logo</label>
          <div class="logo-upload" onclick="document.getElementById('logoFile').click()">
            <input type="file" id="logoFile" accept="image/*" style="display:none" onchange="loadLogo(event)">
            <img id="logoPreview" class="logo-preview" alt="Preview">
            <p id="logoTxt" style="font-size:12px;color:#78716C;margin-top:6px">Click to upload PNG/JPG logo</p>
          </div>
        </div>
      </div>
      <div style="margin-top:16px"><button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button></div>
    </div>

    <div class="card">
      <div class="card-hdr"><h2>Admin Security &amp; Password</h2></div>
      <p style="font-size:12px;color:#78716C;margin-bottom:12px">Set or change the master password required to access admin mode.</p>
      <div class="form-grid">
        <div class="field"><label>New Password</label><input type="password" id="set_pwd1" placeholder="Enter new password"></div>
        <div class="field"><label>Confirm Password</label><input type="password" id="set_pwd2" placeholder="Confirm new password"></div>
      </div>
      <div style="margin-top:14px"><button class="btn btn-dark" onclick="changePassword()">🔑 Set Password</button></div>
    </div>

    <div class="card">
      <div class="card-hdr"><h2>Data Backup &amp; Synchronization</h2></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-success" onclick="exportExcel()">📊 Export to Excel</button>
        <button class="btn btn-outline" onclick="document.getElementById('importFile').click()">📂 Import Excel</button>
        <input type="file" id="importFile" accept=".xlsx,.xls" style="display:none" onchange="importExcel(event)">
        <button class="btn btn-primary" onclick="saveAsHTML()">💾 Download Self-Contained HTML</button>
        <button class="btn btn-ghost" onclick="document.getElementById('restoreFile').click()">♻️ Restore Backup (JSON)</button>
        <input type="file" id="restoreFile" accept=".json" style="display:none" onchange="restoreJSON(event)">
      </div>
      <div class="danger-zone">
        <h3>⚠️ Danger Zone</h3>
        <p style="font-size:12px;color:#78716C;margin-bottom:10px">Permanently deletes ALL records from browser cache and reset ledger. Cannot be undone.</p>
        <button class="btn btn-danger" onclick="clearAllData()">🗑️ Clear All Data</button>
      </div>
    </div>
  </div>
</div>

<!-- MODALS -->
<!-- Expense Modal -->
<div id="mExp" class="modal-overlay" onclick="closeOnBg(event,'mExp')">
  <div class="modal">
    <div class="modal-hdr"><h3 id="mExpTitle">Add Expense</h3><button class="modal-close" onclick="closeModal('mExp')">×</button></div>
    <input type="hidden" id="eId">
    <div class="form-grid">
      <div class="field full"><label>Item / Description *</label><input id="eItem" placeholder="e.g. Decoration, Sound System"></div>
      <div class="field"><label>Estimated (₹)</label><input id="eEst" type="number" min="0" step="0.01" placeholder="0"></div>
      <div class="field"><label>Advance (₹)</label><input id="eAdv" type="number" min="0" step="0.01" placeholder="0"></div>
      <div class="field"><label>Balance (₹)</label><input id="eBal" type="number" min="0" step="0.01" placeholder="0"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mExp')">Cancel</button>
      <button class="btn btn-primary" onclick="saveExpense()">Save Expense</button>
    </div>
  </div>
</div>

<!-- Contribution Modal -->
<div id="mCt" class="modal-overlay" onclick="closeOnBg(event,'mCt')">
  <div class="modal">
    <div class="modal-hdr"><h3 id="mCtTitle">Add Contribution</h3><button class="modal-close" onclick="closeModal('mCt')">×</button></div>
    <input type="hidden" id="cId">
    <div class="form-grid">
      <div class="field"><label>Contributor Name *</label><input id="cName" placeholder="Full name"></div>
      <div class="field"><label>Flat Number *</label><input id="cFlat" placeholder="e.g. B-1254"></div>
      <div class="field"><label>Amount (₹) *</label><input id="cAmt" type="number" min="1" placeholder="e.g. 1000"></div>
      <div class="field"><label>Date *</label><input id="cDate" type="date"></div>
      <div class="field"><label>Payment Mode</label>
        <select id="cPay"><option>UPI</option><option>Bank Transfer</option><option>Cash</option><option>Other</option></select>
      </div>
      <div class="field"><label>Transaction Reference</label><input id="cTxn" placeholder="UPI / Bank ref ID"></div>
      <div class="field full"><label>Notes</label><textarea id="cNotes" placeholder="Optional notes"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mCt')">Cancel</button>
      <button class="btn btn-primary" onclick="saveContribution()">Save Contribution</button>
    </div>
  </div>
</div>

<!-- Sponsor Modal -->
<div id="mSp" class="modal-overlay" onclick="closeOnBg(event,'mSp')">
  <div class="modal">
    <div class="modal-hdr"><h3 id="mSpTitle">Add Sponsor</h3><button class="modal-close" onclick="closeModal('mSp')">×</button></div>
    <input type="hidden" id="sId">
    <div class="form-grid">
      <div class="field full"><label>Sponsor Details *</label><textarea id="sDet" placeholder="Sponsor name, organization, contact…"></textarea></div>
      <div class="field"><label>Estimated (₹)</label><input id="sEst" type="number" min="0" step="0.01" placeholder="0"></div>
      <div class="field"><label>Actual (₹)</label><input id="sAct" type="number" min="0" step="0.01" placeholder="0"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mSp')">Cancel</button>
      <button class="btn btn-primary" onclick="saveSponsor()">Save Sponsor</button>
    </div>
  </div>
</div>

<!-- Seva Modal -->
<div id="mSv" class="modal-overlay" onclick="closeOnBg(event,'mSv')">
  <div class="modal">
    <div class="modal-hdr"><h3 id="mSvTitle">Add Seva Booking</h3><button class="modal-close" onclick="closeModal('mSv')">×</button></div>
    <input type="hidden" id="vId">
    <div class="form-grid">
      <div class="field full">
        <label>Seva Name *</label>
        <select id="vSeva" onchange="onSevaCatSelect()"><option value="">-- Select a Seva --</option></select>
        <input id="vSevaCustom" placeholder="Enter custom seva name" style="display:none;margin-top:6px">
      </div>
      <div class="field"><label>Resident Name *</label><input id="vName" placeholder="Full name"></div>
      <div class="field"><label>Flat Number *</label><input id="vFlat" placeholder="e.g. A-101"></div>
      <div class="field"><label>Amount (₹) *</label><input id="vAmt" type="number" min="1" placeholder="e.g. 500"></div>
      <div class="field full"><label>Date *</label><input id="vDate" type="date"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mSv')">Cancel</button>
      <button class="btn btn-primary" onclick="saveSeva()">Save Booking</button>
    </div>
  </div>
</div>

<!-- Seva Catalogue Modal -->
<div id="mSevaCat" class="modal-overlay" onclick="closeOnBg(event,'mSevaCat')">
  <div class="modal">
    <div class="modal-hdr"><h3 id="mSevaCatTitle">Add Seva</h3><button class="modal-close" onclick="closeModal('mSevaCat')">×</button></div>
    <input type="hidden" id="scId">
    <div class="form-grid">
      <div class="field full"><label>Seva Name *</label><input id="scName" placeholder="e.g. Flower Seva, Abhishek Puja"></div>
      <div class="field full"><label>Suggested Amount (₹)</label><input id="scAmt" type="number" min="0" placeholder="0"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mSevaCat')">Cancel</button>
      <button class="btn btn-primary" onclick="saveSevaCat()">Save Catalogue Item</button>
    </div>
  </div>
</div>

<!-- Share Modal (Universal Mobile Snapshot + Live QR Scanner) -->
<div id="mShare" class="modal-overlay" onclick="closeOnBg(event,'mShare')">
  <div class="modal" style="max-width:480px">
    <div class="modal-hdr"><h3>📲 Universal Mobile Snapshot</h3><button class="modal-close" onclick="closeModal('mShare')">×</button></div>
    
    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:14px;margin-bottom:14px">
      <p style="font-weight:700;color:#047857;font-size:13px;margin-bottom:4px">✅ Works 100% on Android &amp; iPhone</p>
      <p style="color:#065F46;font-size:12px;line-height:1.4">Share a self-contained snapshot file directly via WhatsApp, AirDrop, or Drive without URL length restrictions.</p>
      <div style="margin-top:10px">
        <button class="btn btn-success" style="width:100%" onclick="shareSnapshotFile()">📤 Send / Share Snapshot File</button>
      </div>
    </div>

    <!-- Live QR Code Section for Camera Scans -->
    <div style="text-align:center;padding:14px;background:#FAFAF9;border-radius:6px;border:1px solid #E7E5E4;margin-bottom:14px">
      <p style="font-size:11px;font-weight:700;color:#44403C;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em">📷 Scan with Phone Camera (Instant View):</p>
      <div id="shareModalQr" style="display:inline-block;padding:8px;background:#FFF;border-radius:6px;border:1px solid #D6D3D1"></div>
    </div>

    <div style="border-top:1px solid #F5F5F4;padding-top:10px">
      <p style="font-size:11px;font-weight:700;color:#78716C;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.08em">Snapshot Web Link</p>
      <textarea id="shareUrl" rows="2" style="width:100%;font-size:11px;font-family:'JetBrains Mono',monospace;word-break:break-all;resize:none;background:#FAFAF9;border:1px solid #E7E5E4;border-radius:4px;padding:8px" readonly onclick="this.select()"></textarea>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('mShare')">Close</button>
      <button class="btn btn-primary" onclick="copyShareUrl(event)">📋 Copy Link</button>
    </div>
  </div>
</div>

<!-- BILL PRINT AREA -->
<div class="bill-container" id="billContainer">
  <!-- RECEIPT -->
  <div id="rcpPrint" style="display:none">
    <div class="receipt">
      <div class="rcp-top">
        <img id="rcpLogo" class="rcp-logo" style="display:none" alt="">
        <div class="rcp-heading">
          <h2 id="rcpOrg">Brigade Eldorado</h2>
          <h3>3rd Year Ganeshotsava</h3>
          <p>14th September – 18th September 2026</p>
          <p id="rcpLoc">Amphitheatre, Brigade Eldorado</p>
        </div>
      </div>
      <div class="rcp-meta">
        <span><strong>Receipt No:</strong> <span id="rcpNo">—</span></span>
        <span><strong>Date:</strong> <span id="rcpDate">—</span></span>
      </div>
      <div class="rcp-row"><div class="rcp-lbl">Name</div><div class="rcp-val" id="rcpName">—</div></div>
      <div class="rcp-row"><div class="rcp-lbl">Flat / Unit</div><div class="rcp-val" id="rcpFlat">—</div></div>
      <div class="rcp-row"><div class="rcp-lbl">Type</div><div class="rcp-val" id="rcpType">Contribution</div></div>
      <div class="rcp-row"><div class="rcp-lbl">Payment / Ref</div><div class="rcp-val" id="rcpPay">—</div></div>
      <div class="rcp-amt">
        <div class="rcp-amt-title">Amount Received</div>
        <div class="rcp-amt-num">₹ <span id="rcpAmt">0</span></div>
        <div class="rcp-amt-words" id="rcpAmtW">—</div>
      </div>
      <div class="rcp-row"><div class="rcp-lbl">Notes</div><div class="rcp-val" id="rcpNotes">—</div></div>
      <div class="rcp-qr" id="rcpQrArea">
        <div id="rcpQrCode"></div>
        <div style="font-size:10px;color:#78716C;margin-top:4px">Scan to contribute via UPI</div>
      </div>
      <div class="rcp-disc">
        <strong>Disclaimer:</strong> Funds are collected into a dedicated account solely for Ganesha Chaturthi expenses. Any contribution is voluntary.
      </div>

      <!-- DIGITAL SIGNATURE BLOCK -->
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #E7E5E4;display:flex;justify-content:flex-end;align-items:flex-end">
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;flex-shrink:0">
          <div style="font-family:'Great Vibes','Dancing Script',cursive;font-size:24px;color:#991B1B;line-height:1;margin-bottom:4px;white-space:nowrap;padding:0 2px">Ganeshotsava Samithi</div>
          <div style="width:160px;border-top:1px solid #1C1917;margin-top:2px;margin-bottom:4px"></div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1C1917;white-space:nowrap">Authorized Signatory</div>
          <div style="font-size:9px;color:#78716C;white-space:nowrap">Ganeshotsava Samithi 2026</div>
        </div>
      </div>

      <div class="rcp-footer">Thank you for your generous contribution and support 🙏<br><br><strong>Ganapati Bappa Morya!</strong></div>
    </div>
  </div>

  <!-- INVOICE -->
  <div id="invPrint" style="display:none">
    <div class="invoice">
      <div class="inv-hdr">
        <div class="inv-brand">
          <img id="invLogo" style="width:64px;height:64px;object-fit:contain;display:none;margin-bottom:8px" alt="">
          <h2 id="invOrg">Brigade Eldorado</h2>
          <p>3rd Year Ganeshotsava</p>
          <p>14th September – 18th September 2026</p>
          <p id="invLoc">Amphitheatre, Brigade Eldorado</p>
        </div>
        <div class="inv-meta">
          <div class="inv-no">SPONSORSHIP INVOICE</div>
          <div>Invoice No: <strong id="invNo">—</strong></div>
          <div>Date: <span id="invDate">—</span></div>
        </div>
      </div>
      <div class="inv-to">
        <div class="inv-to-lbl">Sponsor Details</div>
        <div id="invDet" style="white-space:pre-line;font-size:13px">—</div>
      </div>
      <table class="inv-items">
        <thead><tr><th>#</th><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead>
        <tbody><tr>
          <td>1</td>
          <td>Sponsorship — Brigade Eldorado Ganeshotsava 2026</td>
          <td style="text-align:right" id="invAmt">0</td>
        </tr></tbody>
        <tfoot><tr class="inv-total-row">
          <td colspan="2"><strong>Total Amount</strong></td>
          <td style="text-align:right" id="invTot"><strong>0</strong></td>
        </tr></tfoot>
      </table>
      <div class="inv-amt-words" id="invAmtW">—</div>
      <div class="inv-note">
        <strong>Thank you for your generous sponsorship! 🙏</strong><br>
        Your contribution supports the Ganeshotsava celebrations.<br>
        <em>Ganapati Bappa Morya!</em>
      </div>

      <!-- DIGITAL SIGNATURE BLOCK -->
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #E7E5E4;display:flex;justify-content:flex-end;align-items:flex-end">
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;flex-shrink:0">
          <div style="font-family:'Great Vibes','Dancing Script',cursive;font-size:24px;color:#991B1B;line-height:1;margin-bottom:4px;white-space:nowrap;padding:0 2px">Ganeshotsava Samithi</div>
          <div style="width:160px;border-top:1px solid #1C1917;margin-top:2px;margin-bottom:4px"></div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#1C1917;white-space:nowrap">Authorized Signatory</div>
          <div style="font-size:9px;color:#78716C;white-space:nowrap">Ganeshotsava Samithi 2026</div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
'use strict';
const K = {
  exp: 'eg_expenses', ct: 'eg_contributions', sp: 'eg_sponsors', sv: 'eg_sevas',
  sevacat: 'eg_seva_catalogue', cfg: 'eg_settings', rcN: 'eg_rc_num', spN: 'eg_sp_num', svN: 'eg_sv_num'
};
let viewOnly = false, sharedData = null, activeFileHandle = null, _autoSaveTimer = null, _saveTimer = null, isAdmin = false;

const dbLoad = k => {
  if (viewOnly && sharedData && k in sharedData) { const v = sharedData[k]; return Array.isArray(v) ? v : []; }
  try {
    const s = localStorage.getItem(k);
    if (s) return JSON.parse(s);
  } catch(e){}
  if (window.__E__ && k in window.__E__) {
    const v = window.__E__[k];
    return Array.isArray(v) ? v : [];
  }
  return [];
};

const dbSave = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){}
  syncEmbeddedMemory();
  markUnsaved();
  autoSaveToActiveFile();
};

function cfgLoad() {
  const def = {
    org: 'Brigade Eldorado', location: 'Amphitheatre, Brigade Eldorado',
    upi: '', payee: 'Brigade Eldorado Ganeshotsava', logo: '', adminHash: ''
  };
  if (viewOnly && sharedData) return { ...def, org: sharedData.org || def.org, location: sharedData.location || def.location };
  try { return { ...def, ...JSON.parse(localStorage.getItem(K.cfg) || '{}') }; } catch { return def; }
}

const cfgSave = v => {
  try { localStorage.setItem(K.cfg, JSON.stringify(v)); } catch(e){}
  syncEmbeddedMemory();
  markUnsaved();
  autoSaveToActiveFile();
};

function getFullAppState() {
  return {
    expenses: dbLoad(K.exp),
    contributions: dbLoad(K.ct),
    sponsors: dbLoad(K.sp),
    sevas: dbLoad(K.sv),
    sevaCatalogue: dbLoad(K.sevacat),
    settings: cfgLoad(),
    counters: { rc: localStorage.getItem(K.rcN), sp: localStorage.getItem(K.spN), sv: localStorage.getItem(K.svN) }
  };
}

function syncEmbeddedMemory() { window.__E__ = getFullAppState(); }

const DEFAULT_SEVAS = [
  { id:'ds1', name:'Flower Seva', amt:15000 }, { id:'ds2', name:'One Day Prasadam', amt:20000 },
  { id:'ds3', name:'Priest Fee', amt:10000 }, { id:'ds4', name:'Pooja Items', amt:15000 },
  { id:'ds5', name:'Event Contributions', amt:10000 }, { id:'ds6', name:'Transports', amt:10000 }, { id:'ds7', name:'Dhol', amt:75000 }
];

function initSevaCatalogue() {
  if (!dbLoad(K.sevacat).length) {
    try { localStorage.setItem(K.sevacat, JSON.stringify(DEFAULT_SEVAS)); } catch(e){}
  }
}

async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('');
}

async function toggleAdmin() {
  if (viewOnly) { alert('👁 View-only snapshot. Admin features are disabled.'); return; }
  if (isAdmin) { isAdmin = false; refreshAdminUI(); return; }
  const cfg = cfgLoad();
  if (!cfg.adminHash) {
    const p1 = prompt('No admin password set.\\nEnter a new password:');
    if (!p1) return;
    const p2 = prompt('Confirm password:');
    if (p1 !== p2) { alert('Passwords do not match.'); return; }
    cfg.adminHash = await sha256(p1);
    cfgSave(cfg);
    isAdmin = true;
    refreshAdminUI();
    alert('Admin password set! You are now in admin mode.');
    return;
  }
  const pwd = prompt('Enter admin password:');
  if (!pwd) return;
  if (await sha256(pwd) === cfg.adminHash) { isAdmin = true; refreshAdminUI(); }
  else alert('Incorrect password.');
}

function refreshAdminUI() {
  document.getElementById('adminBadge').style.display = isAdmin ? 'inline-flex' : 'none';
  document.getElementById('adminToggleBtn').textContent = isAdmin ? '🔓' : '🔒';
  document.getElementById('shareBtn').style.display = isAdmin ? 'inline-flex' : 'none';
  document.getElementById('saveHtmlBtn').style.display = isAdmin ? 'inline-flex' : 'none';
  document.getElementById('connectBtn').style.display = (isAdmin && 'showOpenFilePicker' in window) ? 'inline-flex' : 'none';
  document.getElementById('settingsTab_btn').style.display = isAdmin ? '' : 'none';
  if (!isAdmin && document.getElementById('settingsTab').classList.contains('active')) showTab('reportTab', document.querySelector('.tab'));
  renderAll();
}

async function changePassword() {
  if (!isAdmin) { alert('Admin mode required.'); return; }
  const p1 = document.getElementById('set_pwd1').value;
  const p2 = document.getElementById('set_pwd2').value;
  if (!p1) { alert('Please enter a new password.'); return; }
  if (p1 !== p2) { alert('Passwords do not match.'); return; }
  const cfg = cfgLoad();
  cfg.adminHash = await sha256(p1);
  cfgSave(cfg);
  document.getElementById('set_pwd1').value = '';
  document.getElementById('set_pwd2').value = '';
  alert('Password updated successfully.');
}

function showTab(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) btn.classList.add('active');
  if (id === 'reportTab') renderReport();
  if (id === 'settingsTab') applySettingsToForm(cfgLoad());
}

const openModal = id => document.getElementById(id).classList.add('open');
const closeModal = id => document.getElementById(id).classList.remove('open');
function closeOnBg(e, id) { if (e && e.target && e.target.id === id) closeModal(id); }

const fmt = n => Number(n || 0).toLocaleString('en-IN');
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return isNaN(d) ? s : \`\${String(d.getDate()).padStart(2,'0')}/\${String(d.getMonth()+1).padStart(2,'0')}/\${d.getFullYear()}\`;
}
function esc(v) { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function nextNum(key, prefix) {
  const n = parseInt(localStorage.getItem(key) || '0') + 1;
  try { localStorage.setItem(key, n); } catch(e){}
  return prefix + String(n).padStart(4, '0');
}
function numWords(n) {
  n = Math.floor(n); if (!n) return 'Zero Rupees Only';
  const o = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function c(x) {
    if (x < 20) return o[x];
    if (x < 100) return t[Math.floor(x/10)] + (x%10 ? ' '+o[x%10] : '');
    if (x < 1000) {
      const h = Math.floor(x / 100), rem = x % 100;
      return o[h] + ' Hundred' + (rem ? ' and ' + c(rem) : '');
    }
    if (x < 100000) {
      const th = Math.floor(x / 1000), rem = x % 1000;
      if (!rem) return c(th) + ' Thousand';
      if (rem < 100) return c(th) + ' Thousand and ' + c(rem);
      return c(th) + ' Thousand ' + c(rem);
    }
    if (x < 10000000) {
      const lk = Math.floor(x / 100000), rem = x % 100000;
      if (!rem) return c(lk) + ' Lakh';
      if (rem < 100) return c(lk) + ' Lakh and ' + c(rem);
      return c(lk) + ' Lakh ' + c(rem);
    }
    const cr = Math.floor(x / 10000000), rem = x % 10000000;
    if (!rem) return c(cr) + ' Crore';
    if (rem < 100) return c(cr) + ' Crore and ' + c(rem);
    return c(cr) + ' Crore ' + c(rem);
  }
  return c(n) + ' Rupees Only';
}
const today = () => new Date().toISOString().split('T')[0];

/* EXPENSES */
function openExpenseModal(id = null) {
  document.getElementById('eId').value = id || '';
  document.getElementById('mExpTitle').textContent = id ? 'Edit Expense' : 'Add Expense';
  if (id) {
    const r = dbLoad(K.exp).find(e => e.id === id);
    if (r) {
      document.getElementById('eItem').value = r.item;
      document.getElementById('eEst').value = r.est || '';
      document.getElementById('eAdv').value = r.adv || '';
      document.getElementById('eBal').value = r.bal || '';
    }
  } else { ['eItem','eEst','eAdv','eBal'].forEach(x => document.getElementById(x).value = ''); }
  openModal('mExp');
}

function saveExpense() {
  const item = document.getElementById('eItem').value.trim();
  if (!item) { alert('Please enter an item description.'); return; }
  const data = dbLoad(K.exp);
  const existing = document.getElementById('eId').value;
  const est = parseFloat(document.getElementById('eEst').value) || 0;
  const adv = parseFloat(document.getElementById('eAdv').value) || 0;
  const bal = Math.max(0, est - adv);
  const act = adv + bal;
  const row = { id: existing || Date.now().toString(), item, est, adv, bal, act };
  if (existing) { const i = data.findIndex(e => e.id === existing); if (i >= 0) data[i] = row; else data.push(row); }
  else data.push(row);
  dbSave(K.exp, data);
  closeModal('mExp');
  renderExpenses(); renderReport();
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  dbSave(K.exp, dbLoad(K.exp).filter(e => e.id !== id));
  renderExpenses(); renderReport();
}

function renderExpenses() {
  const data = dbLoad(K.exp);
  let totEst = 0, totAdv = 0, totBal = 0, totAct = 0;
  document.getElementById('expToolbar').innerHTML = isAdmin ? '<button class="btn btn-primary btn-sm" onclick="openExpenseModal()">+ Add Expense</button>' : '';
  document.getElementById('expActionsHdr').style.display = isAdmin ? '' : 'none';
  document.getElementById('expTbody').innerHTML = data.map((r, i) => {
    const est = Number(r.est || 0), adv = Number(r.adv || 0), bal = Math.max(0, est - adv), act = Math.max(est, adv);
    totEst += est; totAdv += adv; totBal += bal; totAct += act;
    return \`<tr>
      <td>\${i+1}</td>
      <td><strong>\${esc(r.item)}</strong></td>
      <td class="font-mono">₹ \${fmt(est)}</td>
      <td class="font-mono" style="color:#15803D">₹ \${fmt(adv)}</td>
      <td class="font-mono">₹ \${fmt(bal)}</td>
      <td class="font-mono" style="font-weight:700">₹ \${fmt(act)}</td>
      <td style="\${isAdmin ? '' : 'display:none'}">
        <div class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="openExpenseModal('\${r.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteExpense('\${r.id}')">🗑️</button>
        </div>
      </td>
    </tr>\`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#78716C;padding:24px">No expenses recorded yet.</td></tr>';
  document.getElementById('expTotEst').textContent = '₹ ' + fmt(totEst);
  document.getElementById('expTotAdv').textContent = '₹ ' + fmt(totAdv);
  document.getElementById('expTotBal').textContent = '₹ ' + fmt(totBal);
  document.getElementById('expTotAct').textContent = '₹ ' + fmt(totAct);
}

/* CONTRIBUTIONS */
function openContributionModal(id = null) {
  document.getElementById('cId').value = id || '';
  document.getElementById('mCtTitle').textContent = id ? 'Edit Contribution' : 'Add Contribution';
  if (id) {
    const r = dbLoad(K.ct).find(c => c.id === id);
    if (r) {
      document.getElementById('cName').value = r.name; document.getElementById('cFlat').value = r.flat;
      document.getElementById('cAmt').value = r.amt; document.getElementById('cDate').value = r.date;
      document.getElementById('cPay').value = r.pay; document.getElementById('cTxn').value = r.txn || '';
      document.getElementById('cNotes').value = r.notes || '';
    }
  } else {
    ['cName','cFlat','cAmt','cTxn','cNotes'].forEach(x => document.getElementById(x).value = '');
    document.getElementById('cDate').value = today();
    document.getElementById('cPay').value = 'UPI';
  }
  openModal('mCt');
}

function saveContribution() {
  const name = document.getElementById('cName').value.trim();
  const flat = document.getElementById('cFlat').value.trim();
  const amt = parseFloat(document.getElementById('cAmt').value);
  const date = document.getElementById('cDate').value;
  if (!name || !flat || !amt || amt <= 0 || !date) { alert('Please fill in required contribution fields.'); return; }
  const data = dbLoad(K.ct);
  const existing = document.getElementById('cId').value;
  const existingRow = existing ? data.find(c => c.id === existing) : null;
  const row = {
    id: existing || Date.now().toString(),
    rcptNo: existingRow?.rcptNo || nextNum(K.rcN, 'GE-2026-'),
    name, flat, amt, date, pay: document.getElementById('cPay').value,
    txn: document.getElementById('cTxn').value.trim(), notes: document.getElementById('cNotes').value.trim()
  };
  if (existing) { const i = data.findIndex(c => c.id === existing); if (i >= 0) data[i] = row; else data.push(row); }
  else data.push(row);
  dbSave(K.ct, data);
  closeModal('mCt');
  renderContributions(); renderReport();
}

function deleteContribution(id) {
  if (!confirm('Delete this contribution?')) return;
  dbSave(K.ct, dbLoad(K.ct).filter(c => c.id !== id));
  renderContributions(); renderReport();
}

function renderContributions() {
  const q = (document.getElementById('ctSearch')?.value || '').toLowerCase();
  const all = dbLoad(K.ct);
  const data = all.filter(r => r.name.toLowerCase().includes(q) || (r.flat||'').toLowerCase().includes(q) || (r.rcptNo||'').toLowerCase().includes(q));
  document.getElementById('ctToolbar').innerHTML = isAdmin
    ? \`<button class="btn btn-success btn-sm" onclick="exportContributions()">📊 Export</button>
       <button class="btn btn-outline btn-sm" onclick="document.getElementById('ctImportFile').click()">📂 Import</button>
       <button class="btn btn-primary btn-sm" onclick="openContributionModal()">+ Add</button>\`
    : '';
  const allTotal = all.reduce((s, r) => s + Number(r.amt || 0), 0);
  document.getElementById('ctTotalBar').textContent = '₹ ' + fmt(allTotal);
  let filtTotal = 0;
  document.getElementById('ctTbody').innerHTML = data.map(r => {
    filtTotal += Number(r.amt || 0);
    const adminBtns = isAdmin
      ? \`<button class="btn btn-ghost btn-sm" onclick="openContributionModal('\${r.id}')">✏️</button>
         <button class="btn btn-danger btn-sm" onclick="deleteContribution('\${r.id}')">🗑️</button>\`
      : '';
    return \`<tr>
      <td class="font-mono"><strong>\${esc(r.rcptNo)}</strong></td>
      <td>\${fmtDate(r.date)}</td>
      <td><strong>\${esc(r.name)}</strong></td>
      <td><span style="background:#F5F5F4;padding:2px 6px;border-radius:3px;font-size:11px">\${esc(r.flat)}</span></td>
      <td class="font-mono" style="font-weight:700;color:#15803D">₹ \${fmt(r.amt)}</td>
      <td>\${esc(r.pay || '')}</td>
      <td class="font-mono" style="font-size:11px">\${esc(r.txn || '—')}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="doPrintReceipt('ct','\${r.id}')">🧾 Receipt</button>
          <button class="btn btn-wa btn-sm" onclick="doWhatsApp('ct','\${r.id}')">📱</button>
          \${adminBtns}
        </div>
      </td>
    </tr>\`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#78716C;padding:24px">No contributions found.</td></tr>';
  document.getElementById('ctTotFoot').textContent = '₹ ' + fmt(filtTotal);
}

function exportContributions() {
  const ct = dbLoad(K.ct);
  if (!ct.length) { alert('No contributions to export.'); return; }
  const wb = XLSX.utils.book_new();
  const rows = [
    ['Receipt No', 'Date', 'Name', 'Flat No', 'Amount (₹)', 'Payment Mode', 'Transaction Ref', 'Notes'],
    ...ct.map(r => [r.rcptNo, r.date, r.name, r.flat, Number(r.amt)||0, r.pay||'', r.txn||'', r.notes||'']),
    ['', '', '', 'TOTAL', ct.reduce((s,r)=>s+Number(r.amt||0),0), '', '', '']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Contributions');
  XLSX.writeFile(wb, \`Ganeshotsava_Contributions_\${today()}.xlsx\`);
}

function importContributions(event) {
  const file = event?.target?.files?.[0]; if (!file) return;
  if (!isAdmin) { alert('Admin mode required.'); event.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
      const dataRows = rows.slice(1).filter(r => r[0] && String(r[0]).startsWith('GE-') && !String(r[2]).toUpperCase().includes('TOTAL'));
      if (!dataRows.length) { alert('No valid rows found.'); event.target.value = ''; return; }
      const existing = dbLoad(K.ct);
      const existingNos = new Set(existing.map(c => c.rcptNo));
      let maxN = parseInt(localStorage.getItem(K.rcN) || '0');
      let added = 0;
      const newRows = dataRows.reduce((acc, r, i) => {
        const rcptNo = String(r[0]);
        if (existingNos.has(rcptNo)) return acc;
        const n = parseInt(rcptNo.split('-').pop()) || 0;
        if (n > maxN) maxN = n;
        acc.push({ id:'imp'+Date.now()+i, rcptNo, date:String(r[1]||''), name:String(r[2]||''), flat:String(r[3]||''), amt:Number(r[4])||0, pay:String(r[5]||'UPI'), txn:String(r[6]||''), notes:String(r[7]||'') });
        added++; return acc;
      }, []);
      if (!added) { alert('No new rows added.'); event.target.value = ''; return; }
      dbSave(K.ct, [...existing, ...newRows]);
      try { localStorage.setItem(K.rcN, maxN); } catch(err){}
      renderContributions(); renderReport();
      alert(\`✅ \${added} contribution(s) added successfully.\`);
    } catch (err) { alert('Import failed: ' + err.message); }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

/* SPONSORS */
function openSponsorModal(id = null) {
  document.getElementById('sId').value = id || '';
  document.getElementById('mSpTitle').textContent = id ? 'Edit Sponsor' : 'Add Sponsor';
  if (id) {
    const r = dbLoad(K.sp).find(s => s.id === id);
    if (r) { document.getElementById('sDet').value = r.det; document.getElementById('sEst').value = r.est || ''; document.getElementById('sAct').value = r.act || ''; }
  } else { ['sDet','sEst','sAct'].forEach(x => document.getElementById(x).value = ''); }
  openModal('mSp');
}

function saveSponsor() {
  const det = document.getElementById('sDet').value.trim();
  if (!det) { alert('Please enter sponsor details.'); return; }
  const data = dbLoad(K.sp);
  const existing = document.getElementById('sId').value;
  const existingRow = existing ? data.find(s => s.id === existing) : null;
  const row = {
    id: existing || Date.now().toString(),
    invNo: existingRow?.invNo || nextNum(K.spN, 'SP-2026-'),
    det, est: parseFloat(document.getElementById('sEst').value) || 0, act: parseFloat(document.getElementById('sAct').value) || 0
  };
  if (existing) { const i = data.findIndex(s => s.id === existing); if (i >= 0) data[i] = row; else data.push(row); }
  else data.push(row);
  dbSave(K.sp, data);
  closeModal('mSp');
  renderSponsors(); renderReport();
}

function deleteSponsor(id) {
  if (!confirm('Delete this sponsor?')) return;
  dbSave(K.sp, dbLoad(K.sp).filter(s => s.id !== id));
  renderSponsors(); renderReport();
}

function renderSponsors() {
  const data = dbLoad(K.sp);
  let totEst = 0, totAct = 0;
  document.getElementById('spToolbar').innerHTML = isAdmin ? '<button class="btn btn-primary btn-sm" onclick="openSponsorModal()">+ Add Sponsor</button>' : '';
  document.getElementById('spTbody').innerHTML = data.map(r => {
    totEst += Number(r.est || 0); totAct += Number(r.act || 0);
    const adminBtns = isAdmin
      ? \`<button class="btn btn-ghost btn-sm" onclick="openSponsorModal('\${r.id}')">✏️</button>
         <button class="btn btn-danger btn-sm" onclick="deleteSponsor('\${r.id}')">🗑️</button>\`
      : '';
    return \`<tr>
      <td class="font-mono"><strong>\${esc(r.invNo)}</strong></td>
      <td style="white-space:pre-line"><strong>\${esc(r.det)}</strong></td>
      <td class="font-mono">₹ \${fmt(r.est)}</td>
      <td class="font-mono" style="font-weight:700;color:#15803D">₹ \${fmt(r.act)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-outline btn-sm" onclick="doPrintInvoice('\${r.id}')">📄 Invoice</button>
          <button class="btn btn-wa btn-sm" onclick="doWhatsApp('sp','\${r.id}')">📱</button>
          \${adminBtns}
        </div>
      </td>
    </tr>\`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:#78716C;padding:24px">No sponsors added yet.</td></tr>';
  document.getElementById('spTotEst').textContent = '₹ ' + fmt(totEst);
  document.getElementById('spTotAct').textContent = '₹ ' + fmt(totAct);
}

/* SEVAS */
function openSevaModal(id = null) {
  document.getElementById('vId').value = id || '';
  document.getElementById('mSvTitle').textContent = id ? 'Edit Seva Booking' : 'Add Seva Booking';
  const catalogue = dbLoad(K.sevacat);
  const selSeva = document.getElementById('vSeva');
  selSeva.innerHTML = '<option value="">-- Select a Seva --</option>' +
    catalogue.map(s => \`<option value="\${esc(s.name)}">\${esc(s.name)} — ₹\${fmt(s.amt)}</option>\`).join('') +
    '<option value="__other__">Other (custom)…</option>';
  const customInput = document.getElementById('vSevaCustom');
  if (id) {
    const r = dbLoad(K.sv).find(s => s.id === id);
    if (r) {
      const catMatch = catalogue.find(c => c.name === r.seva);
      if (catMatch) { selSeva.value = r.seva; customInput.style.display = 'none'; }
      else { selSeva.value = '__other__'; customInput.value = r.seva; customInput.style.display = ''; }
      document.getElementById('vName').value = r.name; document.getElementById('vFlat').value = r.flat;
      document.getElementById('vAmt').value = r.amt; document.getElementById('vDate').value = r.date;
    }
  } else {
    selSeva.value = ''; customInput.value = ''; customInput.style.display = 'none';
    ['vName','vFlat','vAmt'].forEach(x => document.getElementById(x).value = '');
    document.getElementById('vDate').value = today();
  }
  openModal('mSv');
}

function saveSeva() {
  const sevaSelect = document.getElementById('vSeva').value;
  const seva = sevaSelect === '__other__' ? document.getElementById('vSevaCustom').value.trim() : sevaSelect;
  const name = document.getElementById('vName').value.trim();
  const flat = document.getElementById('vFlat').value.trim();
  const amt = parseFloat(document.getElementById('vAmt').value);
  const date = document.getElementById('vDate').value;
  if (!seva || !name || !flat || !amt || amt <= 0 || !date) { alert('Please fill in required seva booking fields.'); return; }
  const data = dbLoad(K.sv);
  const existing = document.getElementById('vId').value;
  const existingRow = existing ? data.find(s => s.id === existing) : null;
  const row = { id: existing || Date.now().toString(), tokNo: existingRow?.tokNo || nextNum(K.svN, 'SV-2026-'), seva, name, flat, amt, date };
  if (existing) { const i = data.findIndex(s => s.id === existing); if (i >= 0) data[i] = row; else data.push(row); }
  else data.push(row);
  dbSave(K.sv, data);
  closeModal('mSv');
  renderSevas(); renderReport();
}

function deleteSeva(id) {
  if (!confirm('Delete this seva booking?')) return;
  dbSave(K.sv, dbLoad(K.sv).filter(s => s.id !== id));
  renderSevas(); renderReport();
}

function renderSevas() {
  const q = (document.getElementById('svSearch')?.value || '').toLowerCase();
  const all = dbLoad(K.sv);
  const data = all.filter(r => r.seva.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || (r.flat||'').toLowerCase().includes(q));
  document.getElementById('svToolbar').innerHTML = isAdmin ? '<button class="btn btn-primary btn-sm" onclick="openSevaModal()">+ Add Seva</button>' : '';
  let total = 0;
  document.getElementById('svTbody').innerHTML = data.map(r => {
    total += Number(r.amt || 0);
    const adminBtns = isAdmin
      ? \`<button class="btn btn-ghost btn-sm" onclick="openSevaModal('\${r.id}')">✏️</button>
         <button class="btn btn-danger btn-sm" onclick="deleteSeva('\${r.id}')">🗑️</button>\`
      : '';
    return \`<tr>
      <td class="font-mono"><strong>\${esc(r.tokNo)}</strong></td>
      <td><strong>\${esc(r.seva)}</strong></td>
      <td>\${esc(r.name)}</td>
      <td><span style="background:#F5F5F4;padding:2px 6px;border-radius:3px;font-size:11px">\${esc(r.flat)}</span></td>
      <td class="font-mono" style="font-weight:700;color:#15803D">₹ \${fmt(r.amt)}</td>
      <td>\${fmtDate(r.date)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="doPrintReceipt('sv','\${r.id}')">🧾 Receipt</button>
          <button class="btn btn-wa btn-sm" onclick="doWhatsApp('sv','\${r.id}')">📱</button>
          \${adminBtns}
        </div>
      </td>
    </tr>\`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#78716C;padding:24px">No seva bookings found.</td></tr>';
  document.getElementById('svTotFoot').textContent = '₹ ' + fmt(total);
}

function renderSevaCatalogue() {
  const data = dbLoad(K.sevacat);
  document.getElementById('sevaCatToolbar').innerHTML = isAdmin ? '<button class="btn btn-primary btn-sm" onclick="openSevaCatModal()">+ Add Seva</button>' : '';
  document.getElementById('sevaCatActHdr').style.display = isAdmin ? '' : 'none';
  document.getElementById('sevaCatTbody').innerHTML = data.map((r, i) => \`<tr>
    <td>\${i+1}</td>
    <td><strong>\${esc(r.name)}</strong></td>
    <td class="font-mono">₹ \${fmt(r.amt)}</td>
    <td style="\${isAdmin ? '' : 'display:none'}">
      <div class="actions-cell">
        <button class="btn btn-ghost btn-sm" onclick="openSevaCatModal('\${r.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteSevaCat('\${r.id}')">🗑️</button>
      </div>
    </td>
  </tr>\`).join('') || '<tr><td colspan="4" style="text-align:center;color:#78716C;padding:20px">No sevas defined.</td></tr>';
}

function openSevaCatModal(id = null) {
  document.getElementById('scId').value = id || '';
  document.getElementById('mSevaCatTitle').textContent = id ? 'Edit Seva' : 'Add Seva';
  if (id) {
    const r = dbLoad(K.sevacat).find(s => s.id === id);
    if (r) { document.getElementById('scName').value = r.name; document.getElementById('scAmt').value = r.amt; }
  } else { document.getElementById('scName').value = ''; document.getElementById('scAmt').value = ''; }
  openModal('mSevaCat');
}

function saveSevaCat() {
  const name = document.getElementById('scName').value.trim();
  if (!name) { alert('Please enter a seva name.'); return; }
  const data = dbLoad(K.sevacat);
  const existing = document.getElementById('scId').value;
  const row = { id: existing || Date.now().toString(), name, amt: parseFloat(document.getElementById('scAmt').value) || 0 };
  if (existing) { const i = data.findIndex(s => s.id === existing); if (i >= 0) data[i] = row; else data.push(row); }
  else data.push(row);
  dbSave(K.sevacat, data);
  closeModal('mSevaCat');
  renderSevaCatalogue();
}

function deleteSevaCat(id) {
  if (!confirm('Remove this seva from the catalogue?')) return;
  dbSave(K.sevacat, dbLoad(K.sevacat).filter(s => s.id !== id));
  renderSevaCatalogue();
}

function onSevaCatSelect() {
  const sel = document.getElementById('vSeva');
  const custom = document.getElementById('vSevaCustom');
  const isOther = sel.value === '__other__';
  custom.style.display = isOther ? '' : 'none';
  if (!isOther && sel.value) {
    const cat = dbLoad(K.sevacat).find(s => s.name === sel.value);
    if (cat) document.getElementById('vAmt').value = cat.amt;
  }
}

/* HTML FILE SAVE & ACTIVE CONNECTION */
async function connectActiveFile() {
  if (!('showOpenFilePicker' in window)) {
    alert('Direct file connection is supported on Chrome, Edge, and Android Chrome. Use "Save HTML" instead.');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'HTML File', accept: { 'text/html': ['.html', '.htm'] } }]
    });
    activeFileHandle = handle;
    const btn = document.getElementById('connectBtn');
    btn.textContent = '⚡ Connected (' + handle.name + ')';
    btn.style.background = '#047857';
    markSaved();
    alert(\`✅ Connected to "\${handle.name}". Updates will auto-save directly into this HTML file!\`);
    autoSaveToActiveFile();
  } catch (err) { if (err.name !== 'AbortError') console.error(err); }
}

function autoSaveToActiveFile() {
  if (!isAdmin || !activeFileHandle) return;
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async () => {
    try {
      const htmlContent = generateHTMLDoc(false);
      const writable = await activeFileHandle.createWritable();
      await writable.write(htmlContent);
      await writable.close();
      markSaved();
    } catch(e) {
      console.warn('Auto-save error', e);
      activeFileHandle = null;
      document.getElementById('connectBtn').textContent = '⚡ Connect File';
      document.getElementById('connectBtn').style.background = '';
    }
  }, 600);
}

function generateHTMLDoc(isViewOnlySnapshot = false) {
  const state = getFullAppState();
  const safeJson = JSON.stringify(state).replace(/</g, '\\\\u003c').replace(/>/g, '\\\\u003e');
  const escapedForJs = JSON.stringify(safeJson);
  let html = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
  html = html.replace(/window\\.__E__=[^;]*;/, \`window.__E__=JSON.parse(\${escapedForJs});\`);
  if (isViewOnlySnapshot) {
    html = html.replace(/id="adminToggleBtn"[^>]*style="[^"]*"/g, 'id="adminToggleBtn" style="display:none"');
    html = html.replace(/id="shareBtn"[^>]*style="[^"]*"/g, 'id="shareBtn" style="display:none"');
    html = html.replace(/id="viewOnlyBadge"[^>]*style="[^"]*"/g, 'id="viewOnlyBadge" style="display:inline-flex"');
  }
  return html;
}

async function saveAsHTML() {
  if (!isAdmin) return;
  const htmlContent = generateHTMLDoc(false);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = \`GaneshaNamah_\${today()}.html\`;
  if ('showSaveFilePicker' in window) {
    try {
      const fh = await window.showSaveFilePicker({
        suggestedName: filename, types: [{ description: 'HTML File', accept: { 'text/html': ['.html'] } }]
      });
      const w = await fh.createWritable(); await w.write(blob); await w.close();
      activeFileHandle = fh;
      document.getElementById('connectBtn').textContent = '⚡ Connected';
      document.getElementById('connectBtn').style.background = '#047857';
      markSaved();
      alert('✅ HTML file saved with all your latest data baked in!');
      return;
    } catch(err){ if (err.name === 'AbortError') return; }
  }
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl; link.download = filename; link.click();
  URL.revokeObjectURL(blobUrl);
  markSaved();
  alert('✅ HTML file downloaded with all latest data stored inside.');
}

async function shareSnapshotFile() {
  const snapshotHtml = generateHTMLDoc(true);
  const filename = \`Ganeshotsava_Snapshot_\${today()}.html\`;
  const file = new File([snapshotHtml], filename, { type: 'text/html' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file], title: 'Brigade Eldorado Ganeshotsava 2026', text: 'Here is the latest Ganeshotsava 2026 Budget & Contributions snapshot.'
      });
      return;
    } catch(err){ if (err.name === 'AbortError') return; }
  }
  const blob = new Blob([snapshotHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = blobUrl; a.download = filename; a.click();
  URL.revokeObjectURL(blobUrl);
  alert('📱 Snapshot file ready! Share this file via WhatsApp, AirDrop, or Drive to open on iPhone & Android.');
}

function openShareModal() {
  const cfg = cfgLoad();
  const payload = {
    [K.exp]: dbLoad(K.exp), [K.ct]: dbLoad(K.ct), [K.sp]: dbLoad(K.sp), [K.sv]: dbLoad(K.sv),
    [K.sevacat]: dbLoad(K.sevacat), org: cfg.org, location: cfg.location
  };
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = window.location.href.split('#')[0] + '#share=' + compressed;
  document.getElementById('shareUrl').value = url;
  const qrBox = document.getElementById('shareModalQr');
  qrBox.innerHTML = '';
  try { new QRCode(qrBox, { text: url, width: 140, height: 140, correctLevel: QRCode.CorrectLevel.M }); } catch(e){}
  openModal('mShare');
}

async function copyShareUrl(event) {
  const btn = event?.currentTarget || document.querySelector('#mShare .btn-primary');
  const url = document.getElementById('shareUrl').value;
  try { await navigator.clipboard.writeText(url); } catch {
    document.getElementById('shareUrl').select(); document.execCommand('copy');
  }
  if (btn) { const orig = btn.innerHTML; btn.innerHTML = '✓ Copied!'; setTimeout(() => btn.innerHTML = orig, 2000); }
}

function initFromHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return;
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash.slice(7));
    if (!json) throw new Error('empty');
    sharedData = JSON.parse(json);
    viewOnly = true;
    document.getElementById('viewOnlyBadge').style.display = 'inline-flex';
    document.getElementById('adminToggleBtn').style.display = 'none';
    document.getElementById('shareBtn').style.display = 'none';
    document.getElementById('saveHtmlBtn').style.display = 'none';
    document.getElementById('connectBtn').style.display = 'none';
    document.getElementById('saveStatus').style.display = 'none';
    document.querySelectorAll('.tab').forEach(t => { if (t.textContent.includes('Settings')) t.style.display = 'none'; });
    if (sharedData.org) document.title = sharedData.org + ' — Ganeshotsava 2026 (View Only)';
  } catch { alert('Corrupted share link. Loading local data.'); }
}

function loadEmbeddedData() {
  if (!window.__E__) return;
  const d = window.__E__;
  try {
    if (d.contributions) localStorage.setItem(K.ct, JSON.stringify(d.contributions));
    if (d.expenses) localStorage.setItem(K.exp, JSON.stringify(d.expenses));
    if (d.sponsors) localStorage.setItem(K.sp, JSON.stringify(d.sponsors));
    if (d.sevas) localStorage.setItem(K.sv, JSON.stringify(d.sevas));
    if (d.sevaCatalogue) localStorage.setItem(K.sevacat, JSON.stringify(d.sevaCatalogue));
    if (d.settings) localStorage.setItem(K.cfg, JSON.stringify(d.settings));
    if (d.counters) {
      if (d.counters.rc) localStorage.setItem(K.rcN, String(d.counters.rc));
      if (d.counters.sp) localStorage.setItem(K.spN, String(d.counters.sp));
      if (d.counters.sv) localStorage.setItem(K.svN, String(d.counters.sv));
    }
  } catch(e){}
}

function markUnsaved() {
  if (!isAdmin) return;
  const el = document.getElementById('saveStatus');
  el.textContent = '⏺ Unsaved'; el.className = 'save-status unsaved'; el.style.display = 'inline-flex';
}

function markSaved() {
  const el = document.getElementById('saveStatus');
  el.textContent = '✓ Saved'; el.className = 'save-status saved'; el.style.display = 'inline-flex';
  clearTimeout(_saveTimer); _saveTimer = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function waOpen(text) { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); }

function doWhatsApp(type, id) {
  const cfg = cfgLoad();
  const org = cfg.org || 'Brigade Eldorado';
  let msg = '';
  if (type === 'ct') {
    const r = dbLoad(K.ct).find(x => x.id === id); if (!r) return;
    msg = \`🪔 *Ganeshotsava Contribution Receipt*\\n\\n*\${org}*\\n3rd Year Ganeshotsava\\n14th September – 18th September 2026\\n\\n📋 Receipt No: \${r.rcptNo}\\n📅 Date: \${fmtDate(r.date)}\\n👤 Contributor: \${r.name}\\n🏠 Flat: \${r.flat}\\n💳 Payment: \${r.pay || ''}\${r.txn ? ' — ' + r.txn : ''}\\n💰 Amount: ₹\${fmt(r.amt)}\\n    (\${numWords(r.amt)})\${r.notes ? '\\n📝 Notes: ' + r.notes : ''}\\n\\nThank you for your generous contribution and support 🙏\\n*Ganapati Bappa Morya!*\`;
  } else if (type === 'sv') {
    const r = dbLoad(K.sv).find(x => x.id === id); if (!r) return;
    msg = \`🙏 *Seva Booking Confirmation*\\n\\n*\${org}*\\n3rd Year Ganeshotsava\\n14th September – 18th September 2026\\n\\n🎟️ Token No: \${r.tokNo}\\n🪔 Seva: \${r.seva}\\n📅 Date: \${fmtDate(r.date)}\\n👤 Resident: \${r.name}\\n🏠 Flat: \${r.flat}\\n💰 Amount: ₹\${fmt(r.amt)}\\n    (\${numWords(r.amt)})\\n\\nThank you for your participation 🙏\\n*Ganapati Bappa Morya!*\`;
  } else if (type === 'sp') {
    const r = dbLoad(K.sp).find(x => x.id === id); if (!r) return;
    msg = \`📄 *Sponsorship Invoice*\\n\\n*\${org}*\\n3rd Year Ganeshotsava\\n14th September – 18th September 2026\\n\\n🔖 Invoice No: \${r.invNo}\\n📅 Date: \${new Date().toLocaleDateString('en-IN')}\\n🏢 Sponsor: \${r.det}\\n💰 Amount: ₹\${fmt(r.act)}\\n    (\${numWords(r.act)})\\n\\nThank you for your generous sponsorship! 🙏\\n*Ganapati Bappa Morya!*\`;
  }
  if (msg) waOpen(msg);
}

function doWhatsAppReport() {
  const cfg = cfgLoad();
  const org = cfg.org || 'Brigade Eldorado';
  const spAct = dbLoad(K.sp).reduce((s,r) => s + Number(r.act || 0), 0);
  const ctTot = dbLoad(K.ct).reduce((s,r) => s + Number(r.amt || 0), 0);
  const svTot = dbLoad(K.sv).reduce((s,r) => s + Number(r.amt || 0), 0);
  const exAct = dbLoad(K.exp).reduce((s,r) => s + Number(r.act || 0), 0);
  const income = spAct + ctTot + svTot;
  const net = income - exAct;
  const msg = \`📊 *Ganeshotsava 2026 — Budget Summary*\\n*\${org}*\\n\\n💰 *INCOME*\\n• Sponsor Contributions: ₹\${fmt(spAct)}\\n• Resident Contributions: ₹\${fmt(ctTot)}\\n• Seva Bookings: ₹\${fmt(svTot)}\\n▶ *Total Income: ₹\${fmt(income)}*\\n\\n📤 *EXPENDITURE*\\n• Expenses (Actual): ₹\${fmt(exAct)}\\n▶ *Total Expenditure: ₹\${fmt(exAct)}*\\n\\n\${net >= 0 ? '✅' : '⚠️'} *Net Balance: ₹\${fmt(Math.abs(net))}\${net < 0 ? ' (Deficit)' : ''}*\\n\\n_Ganapati Bappa Morya!_ 🪔\`;
  waOpen(msg);
}

function renderReport() {
  const spAct = dbLoad(K.sp).reduce((s,r) => s + Number(r.act || 0), 0);
  const ctTot = dbLoad(K.ct).reduce((s,r) => s + Number(r.amt || 0), 0);
  const svTot = dbLoad(K.sv).reduce((s,r) => s + Number(r.amt || 0), 0);
  const exAct = dbLoad(K.exp).reduce((s,r) => s + Number(r.act || 0), 0);
  const income = spAct + ctTot + svTot;
  const net = income - exAct;
  const f = n => '₹ ' + fmt(n);
  document.getElementById('kpi_sp').textContent = f(spAct);
  document.getElementById('kpi_ct').textContent = f(ctTot);
  document.getElementById('kpi_sv').textContent = f(svTot);
  document.getElementById('kpi_ex').textContent = f(exAct);
  document.getElementById('kpi_net').textContent = f(Math.abs(net)) + (net < 0 ? ' (Deficit)' : '');
  document.getElementById('bs_sp').textContent = f(spAct);
  document.getElementById('bs_ct').textContent = f(ctTot);
  document.getElementById('bs_sv').textContent = f(svTot);
  document.getElementById('bs_income').textContent = f(income);
  document.getElementById('bs_ex').textContent = f(exAct);
  document.getElementById('bs_expend').textContent = f(exAct);
  document.getElementById('bs_net').textContent = f(Math.abs(net)) + (net < 0 ? ' (Deficit)' : '');
  document.getElementById('bs_netRow').className = net >= 0 ? 'net-pos' : 'net-neg';
}

function doPrintReceipt(type, id) {
  const cfg = cfgLoad();
  let r = (type === 'ct') ? dbLoad(K.ct).find(x => x.id === id) : dbLoad(K.sv).find(x => x.id === id);
  if (!r) return;
  const logo = document.getElementById('rcpLogo');
  if (cfg.logo) { logo.src = cfg.logo; logo.style.display = ''; } else logo.style.display = 'none';
  document.getElementById('rcpOrg').textContent = cfg.org || 'Brigade Eldorado';
  document.getElementById('rcpLoc').textContent = cfg.location;
  if (type === 'ct') {
    document.getElementById('rcpNo').textContent = r.rcptNo;
    document.getElementById('rcpDate').textContent = fmtDate(r.date);
    document.getElementById('rcpName').textContent = r.name;
    document.getElementById('rcpFlat').textContent = r.flat;
    document.getElementById('rcpType').textContent = 'Resident Contribution';
    document.getElementById('rcpPay').textContent = (r.pay || '') + (r.txn ? ' — ' + r.txn : '');
    document.getElementById('rcpAmt').textContent = fmt(r.amt);
    document.getElementById('rcpAmtW').textContent = numWords(r.amt);
    document.getElementById('rcpNotes').textContent = r.notes || '—';
  } else {
    document.getElementById('rcpNo').textContent = r.tokNo;
    document.getElementById('rcpDate').textContent = fmtDate(r.date);
    document.getElementById('rcpName').textContent = r.name;
    document.getElementById('rcpFlat').textContent = r.flat;
    document.getElementById('rcpType').textContent = 'Seva Booking — ' + r.seva;
    document.getElementById('rcpPay').textContent = '—';
    document.getElementById('rcpAmt').textContent = fmt(r.amt);
    document.getElementById('rcpAmtW').textContent = numWords(r.amt);
    document.getElementById('rcpNotes').textContent = '—';
  }
  const qrArea = document.getElementById('rcpQrArea');
  const qrBox = document.getElementById('rcpQrCode');
  qrBox.innerHTML = '';
  if (cfg.upi) {
    qrArea.style.display = '';
    const upiUrl = \`upi://pay?pa=\${encodeURIComponent(cfg.upi)}&pn=\${encodeURIComponent(cfg.payee)}&am=\${encodeURIComponent(r.amt || 0)}&cu=INR\`;
    new QRCode(qrBox, { text: upiUrl, width: 100, height: 100, correctLevel: QRCode.CorrectLevel.H });
  } else { qrArea.style.display = 'none'; }
  document.getElementById('rcpPrint').style.display = '';
  document.getElementById('invPrint').style.display = 'none';
  setTimeout(() => window.print(), 250);
}

function doPrintInvoice(id) {
  const cfg = cfgLoad();
  const r = dbLoad(K.sp).find(s => s.id === id);
  if (!r) return;
  const logo = document.getElementById('invLogo');
  if (cfg.logo) { logo.src = cfg.logo; logo.style.display = ''; } else logo.style.display = 'none';
  document.getElementById('invOrg').textContent = cfg.org || 'Brigade Eldorado';
  document.getElementById('invLoc').textContent = cfg.location;
  document.getElementById('invNo').textContent = r.invNo;
  document.getElementById('invDate').textContent = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
  document.getElementById('invDet').textContent = r.det;
  document.getElementById('invAmt').textContent = '₹ ' + fmt(r.act);
  document.getElementById('invTot').innerHTML = '<strong>₹ ' + fmt(r.act) + '</strong>';
  document.getElementById('invAmtW').textContent = numWords(r.act);
  document.getElementById('rcpPrint').style.display = 'none';
  document.getElementById('invPrint').style.display = '';
  setTimeout(() => window.print(), 250);
}

function loadLogo(event) {
  const file = event?.target?.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    const lp = document.getElementById('logoPreview');
    lp.src = src; lp.style.display = 'block';
    document.getElementById('logoTxt').textContent = '✓ Logo uploaded';
    document.getElementById('headerLogo').src = src;
    document.getElementById('headerLogo').style.display = '';
  };
  reader.readAsDataURL(file);
}

function saveSettings() {
  const cfg = cfgLoad();
  cfg.org = document.getElementById('set_org').value.trim();
  cfg.location = document.getElementById('set_location').value.trim();
  cfg.upi = document.getElementById('set_upi').value.trim();
  cfg.payee = document.getElementById('set_payee').value.trim();
  const lp = document.getElementById('logoPreview');
  if (lp.src && lp.src !== window.location.href && !lp.src.endsWith('/')) cfg.logo = lp.src;
  cfgSave(cfg);
  applySettingsBanner(cfg);
  alert('Settings saved successfully.');
}

function applySettingsToForm(cfg) {
  document.getElementById('set_org').value = cfg.org || 'Brigade Eldorado';
  document.getElementById('set_location').value = cfg.location || 'Amphitheatre, Brigade Eldorado';
  document.getElementById('set_upi').value = cfg.upi || '';
  document.getElementById('set_payee').value = cfg.payee || 'Brigade Eldorado Ganeshotsava';
  if (cfg.logo) {
    const lp = document.getElementById('logoPreview');
    lp.src = cfg.logo; lp.style.display = 'block';
    document.getElementById('logoTxt').textContent = '✓ Logo uploaded';
  }
}

function applySettingsBanner(cfg) {
  if (cfg.logo) {
    document.getElementById('headerLogo').src = cfg.logo;
    document.getElementById('headerLogo').style.display = '';
  }
}

function exportExcel() {
  const wb = XLSX.utils.book_new();
  const exp = dbLoad(K.exp);
  const expRows = [
    ['#', 'Item / Description', 'Estimated Amount (₹)', 'Advance (₹)', 'Balance (₹)', 'Actual Amount (₹)'],
    ...exp.map((r,i) => [i+1, r.item, Number(r.est)||0, Number(r.adv)||0, Number(r.bal)||0, Number(r.adv||0) + Number(r.bal||0)]),
    ['', 'TOTAL', exp.reduce((s,r)=>s+Number(r.est||0),0), exp.reduce((s,r)=>s+Number(r.adv||0),0), exp.reduce((s,r)=>s+Number(r.bal||0),0), exp.reduce((s,r)=>s+(Number(r.adv||0)+Number(r.bal||0)),0)]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expRows), 'Estimated Expenses');
  const ct = dbLoad(K.ct);
  const ctRows = [
    ['Receipt No', 'Date', 'Name', 'Flat No', 'Amount (₹)', 'Payment Mode', 'Transaction Ref', 'Notes'],
    ...ct.map(r => [r.rcptNo, r.date, r.name, r.flat, Number(r.amt)||0, r.pay||'', r.txn||'', r.notes||'']),
    ['', '', '', 'TOTAL', ct.reduce((s,r)=>s+Number(r.amt||0),0), '', '', '']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ctRows), 'Contributions');
  const sp = dbLoad(K.sp);
  const spRows = [
    ['Invoice No', 'Sponsor Details', 'Estimated Amount (₹)', 'Actual Amount (₹)'],
    ...sp.map(r => [r.invNo, r.det, Number(r.est)||0, Number(r.act)||0]),
    ['', 'TOTAL', sp.reduce((s,r)=>s+Number(r.est||0),0), sp.reduce((s,r)=>s+Number(r.act||0),0)]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(spRows), 'Sponsors');
  const sv = dbLoad(K.sv);
  const svRows = [
    ['Token No', 'Seva Name', 'Resident Name', 'Flat No', 'Amount (₹)', 'Date'],
    ...sv.map(r => [r.tokNo, r.seva, r.name, r.flat, Number(r.amt)||0, r.date]),
    ['', '', '', 'TOTAL', sv.reduce((s,r)=>s+Number(r.amt||0),0), '']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(svRows), 'Seva Bookings');
  const spAct = sp.reduce((s,r)=>s+Number(r.act||0),0), ctTot = ct.reduce((s,r)=>s+Number(r.amt||0),0), svTot = sv.reduce((s,r)=>s+Number(r.amt||0),0), exAct = exp.reduce((s,r)=>s+Number(r.act||0),0);
  const income = spAct + ctTot + svTot, net = income - exAct;
  const rptRows = [
    ['Particulars', 'Amount (₹)'], ['─── INCOME ───', ''], ['Sponsor Contributions (Actual)', spAct],
    ['Resident Contributions', ctTot], ['Seva Bookings', svTot], ['Total Income', income],
    ['─── EXPENDITURE ───', ''], ['Expenses (Actual)', exAct], ['Total Expenditure', exAct], ['Net Balance', net]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rptRows), 'Budget Report');
  XLSX.writeFile(wb, 'Brigade_Eldorado_Ganeshotsava_2026.xlsx');
}

function importExcel(event) {
  const file = event?.target?.files?.[0]; if (!file) return;
  if (!isAdmin) { alert('Admin mode required to import.'); event.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const getSheet = (...names) => {
        for (const n of names) { const s = wb.Sheets[n]; if (s) return XLSX.utils.sheet_to_json(s, { header: 1, defval: '' }); }
        return null;
      };
      let imported = 0;
      const es = getSheet('Estimated Expenses', 'Sheet1', 'Expenses');
      if (es) {
        const rows = es.slice(1).filter(r => r[1] && String(r[1]).toUpperCase() !== 'TOTAL');
        if (rows.length) {
          dbSave(K.exp, rows.map((r,i)=>({ id:'imp'+Date.now()+i, item:String(r[1]||''), est:Number(r[2])||0, adv:Number(r[3])||0, bal:Number(r[4])||0, act:Number(r[3]||0)+Number(r[4]||0) })));
          imported++;
        }
      }
      const cs = getSheet('Contributions', 'Sheet2');
      if (cs) {
        const rows = cs.slice(1).filter(r => r[0] && !String(r[2]).toUpperCase().includes('TOTAL'));
        if (rows.length) {
          let maxN = 0;
          const data = rows.map((r,i) => {
            const n = parseInt(String(r[0]).split('-').pop()) || 0;
            if (n > maxN) maxN = n;
            return { id:'imp'+Date.now()+i, rcptNo:String(r[0]), date:String(r[1]||''), name:String(r[2]||''), flat:String(r[3]||''), amt:Number(r[4])||0, pay:String(r[5]||'UPI'), txn:String(r[6]||''), notes:String(r[7]||'') };
          });
          dbSave(K.ct, data);
          try { if (maxN > parseInt(localStorage.getItem(K.rcN)||'0')) localStorage.setItem(K.rcN, maxN); } catch(err){}
          imported++;
        }
      }
      const ss = getSheet('Sponsors', 'Sheet3');
      if (ss) {
        const rows = ss.slice(1).filter(r => r[0] && !String(r[1]).toUpperCase().includes('TOTAL'));
        if (rows.length) {
          let maxN = 0;
          const data = rows.map((r,i) => {
            const n = parseInt(String(r[0]).split('-').pop()) || 0;
            if (n > maxN) maxN = n;
            return { id:'imp'+Date.now()+i, invNo:String(r[0]), det:String(r[1]||''), est:Number(r[2])||0, act:Number(r[3])||0 };
          });
          dbSave(K.sp, data);
          try { if (maxN > parseInt(localStorage.getItem(K.spN)||'0')) localStorage.setItem(K.spN, maxN); } catch(err){}
          imported++;
        }
      }
      const vs = getSheet('Seva Bookings', 'Sheet4', 'Sevas');
      if (vs) {
        const rows = vs.slice(1).filter(r => r[0] && !String(r[2]).toUpperCase().includes('TOTAL'));
        if (rows.length) {
          let maxN = 0;
          const data = rows.map((r,i) => {
            const n = parseInt(String(r[0]).split('-').pop()) || 0;
            if (n > maxN) maxN = n;
            return { id:'imp'+Date.now()+i, tokNo:String(r[0]), seva:String(r[1]||''), name:String(r[2]||''), flat:String(r[3]||''), amt:Number(r[4])||0, date:String(r[5]||'') };
          });
          dbSave(K.sv, data);
          try { if (maxN > parseInt(localStorage.getItem(K.svN)||'0')) localStorage.setItem(K.svN, maxN); } catch(err){}
          imported++;
        }
      }
      renderAll();
      alert(\`✅ Import complete! \${imported} sheet(s) imported.\`);
    } catch(err) { alert('Failed to import: ' + err.message); }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

function restoreJSON(event) {
  const file = event?.target?.files?.[0]; if (!file) return;
  if (!isAdmin) { alert('Admin mode required.'); event.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const b = JSON.parse(e.target.result);
      if (b.expenses) dbSave(K.exp, b.expenses);
      if (b.contributions) dbSave(K.ct, b.contributions);
      if (b.sponsors) dbSave(K.sp, b.sponsors);
      if (b.sevas) dbSave(K.sv, b.sevas);
      if (b.sevaCatalogue) dbSave(K.sevacat, b.sevaCatalogue);
      if (b.settings) cfgSave(b.settings);
      if (b.counters) {
        try {
          if (b.counters.rc) localStorage.setItem(K.rcN, b.counters.rc);
          if (b.counters.sp) localStorage.setItem(K.spN, b.counters.sp);
          if (b.counters.sv) localStorage.setItem(K.svN, b.counters.sv);
        } catch(err){}
      }
      applySettingsBanner(cfgLoad());
      renderAll();
      alert('✅ Backup restored successfully!');
    } catch { alert('Invalid or corrupted backup file.'); }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!isAdmin) { alert('Admin mode required.'); return; }
  const ans = prompt('Type DELETE to permanently clear ALL records:');
  if (ans !== 'DELETE') { alert('Operation cancelled.'); return; }
  [K.exp, K.ct, K.sp, K.sv, K.rcN, K.spN, K.svN].forEach(k => {
    try { localStorage.removeItem(k); } catch(e){}
  });
  syncEmbeddedMemory();
  renderAll();
  alert('All data cleared.');
}

function renderAll() {
  renderExpenses(); renderContributions(); renderSponsors(); renderSevaCatalogue(); renderSevas(); renderReport();
}

(function init() {
  try {
    initFromHash(); loadEmbeddedData(); initSevaCatalogue(); syncEmbeddedMemory();
    const cfg = cfgLoad(); applySettingsBanner(cfg); refreshAdminUI(); renderAll();
  } catch(err) {
    console.error('Init error', err);
    try { renderAll(); } catch(e){}
  }
})();
</script>
</body>
</html>`;
}
