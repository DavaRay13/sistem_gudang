const fs = require('fs');

const commands = [];

// 1. Root Frame: 1440 x 900, dark background
commands.push({
  command: "frame.create",
  params: {
    name: "Warehouse WMS Redesign - Desktop 1440x900",
    x: 0,
    y: 0,
    width: 1440,
    height: 900,
    props: {
      fill: "#0F172A"
    }
  }
});

// Helper functions for easy element addition
function addRect(name, x, y, width, height, fill, stroke = null, cornerRadius = 0, opacity = 1) {
  const props = { fill, opacity };
  if (stroke) {
    props.stroke = stroke;
    props.strokeWeight = 1;
  }
  if (cornerRadius) {
    props.cornerRadius = cornerRadius;
  }
  commands.push({
    command: "node.create",
    params: {
      type: "rectangle",
      parent: 2,
      name,
      x,
      y,
      width,
      height,
      props
    }
  });
}

function addText(name, x, y, text, fontSize = 12, fill = "#F8FAFC", fontStyle = "Regular") {
  commands.push({
    command: "text.create",
    params: {
      parent: 2,
      name,
      x,
      y,
      text,
      props: {
        fontSize,
        fill,
        fontStyle
      }
    }
  });
}

// ==========================================
// A. SIDEBAR NAVIGATION (w: 250, h: 900)
// ==========================================
addRect("Sidebar_Background", 0, 0, 250, 900, "#111827", "#1E293B");

// Logo & Brand
addRect("Logo_Icon", 20, 20, 36, 36, "#2563EB", null, 8);
addText("Logo_Text", 28, 28, "📦", 18, "#FFFFFF");
addText("App_Title", 66, 22, "Sistem Gudang", 15, "#FFFFFF", "Bold");
addText("App_Subtitle", 66, 40, "Multi-Hub WMS v2.0", 11, "#94A3B8");

// Role Switcher Pill (Support dual users: Admin Gudang & Orang Toko)
addRect("Role_Switcher_Bg", 18, 70, 214, 34, "#1E293B", "#334155", 8);
addRect("Role_Active_Pill", 20, 72, 104, 30, "#2563EB", null, 6);
addText("Role_Gudang_Text", 30, 80, "Admin Gudang", 11, "#FFFFFF", "Bold");
addText("Role_Toko_Text", 140, 80, "Orang Toko", 11, "#94A3B8");

// Navigation Section Label
addText("Nav_Label_Main", 20, 118, "MENU UTAMA", 10, "#64748B", "Bold");

// Nav Items
const navItems = [
  { icon: "📊", label: "Dashboard Utama", active: true, badge: null },
  { icon: "🔄", label: "Pipeline Permintaan", active: false, badge: "5 Baru", badgeColor: "#F59E0B" },
  { icon: "📦", label: "Master Inventaris SKU", active: false, badge: null },
  { icon: "📥", label: "Inbound (Barang Masuk)", active: false, badge: null },
  { icon: "📤", label: "Outbound & Surat Jalan", active: false, badge: null },
  { icon: "🤝", label: "Handshake Toko", active: false, badge: "3 Kirim", badgeColor: "#10B981" },
  { icon: "📑", label: "Buku Mutasi & Ledger", active: false, badge: null },
  { icon: "⚙️", label: "Pengaturan & Cabang", active: false, badge: null },
];

let navY = 136;
navItems.forEach((item, idx) => {
  if (item.active) {
    addRect(`Nav_Active_Bg_${idx}`, 16, navY, 218, 38, "#1E293B", null, 8);
    addRect(`Nav_Active_Bar_${idx}`, 16, navY + 6, 4, 26, "#3B82F6", null, 2);
    addText(`Nav_Icon_${idx}`, 28, navY + 10, item.icon, 14, "#60A5FA");
    addText(`Nav_Label_${idx}`, 52, navY + 11, item.label, 12, "#60A5FA", "Bold");
  } else {
    addText(`Nav_Icon_${idx}`, 28, navY + 10, item.icon, 14, "#94A3B8");
    addText(`Nav_Label_${idx}`, 52, navY + 11, item.label, 12, "#CBD5E1");
    if (item.badge) {
      addRect(`Nav_Badge_Bg_${idx}`, 172, navY + 8, 54, 20, item.badgeColor, null, 10, 0.2);
      addRect(`Nav_Badge_Border_${idx}`, 172, navY + 8, 54, 20, "none", item.badgeColor, 10);
      addText(`Nav_Badge_Text_${idx}`, 178, navY + 12, item.badge, 9, item.badgeColor, "Bold");
    }
  }
  navY += 44;
});

// Operator / User Session Card at bottom of Sidebar
addRect("User_Card_Bg", 14, 822, 222, 64, "#1E293B", "#334155", 10);
addRect("User_Avatar", 24, 834, 38, 38, "#3B82F6", null, 19);
addText("User_Avatar_Txt", 33, 843, "BS", 13, "#FFFFFF", "Bold");
addText("User_Name", 70, 835, "Budi Santoso", 12, "#F8FAFC", "Bold");
addText("User_Role", 70, 851, "Admin Gudang Utama", 10, "#38BDF8");
addRect("User_Status_Dot", 70, 868, 6, 6, "#10B981", null, 3);
addText("User_Location", 80, 865, "Gudang Pusat (Online)", 10, "#94A3B8");

// ==========================================
// B. TOP HEADER (x: 250, y: 0, w: 1190, h: 68)
// ==========================================
addRect("Header_Bg", 250, 0, 1190, 68, "#111827", "#1E293B");

// Quick Search Bar
addRect("Search_Bar_Bg", 274, 14, 340, 40, "#1E293B", "#334155", 8);
addText("Search_Placeholder", 290, 26, "🔍  Cari SKU, Nama Barang, No. Surat Jalan... (Ctrl+K)", 11, "#64748B");

// Location Selector Dropdown
addRect("Loc_Selector_Bg", 628, 14, 180, 40, "#1E293B", "#334155", 8);
addText("Loc_Selector_Txt", 642, 26, "📍 Gudang Pusat ▾", 12, "#E2E8F0", "Bold");

// Action Buttons (Workflow-oriented for both roles)
// 1. Button Request Toko (Green/Teal)
addRect("Btn_Request_Toko", 820, 14, 150, 40, "#0D9488", null, 8);
addText("Btn_Request_Txt", 836, 26, "+ Request Toko", 12, "#FFFFFF", "Bold");

// 2. Button Input Inbound (Blue)
addRect("Btn_Inbound_Gudang", 982, 14, 145, 40, "#2563EB", null, 8);
addText("Btn_Inbound_Txt", 996, 26, "+ Terima Inbound", 12, "#FFFFFF", "Bold");

// 3. Notification Icon with Alert Badge
addRect("Btn_Notif", 1138, 14, 40, 40, "#1E293B", "#334155", 8);
addText("Btn_Notif_Icon", 1150, 25, "🔔", 14, "#CBD5E1");
addRect("Notif_Badge_Dot", 1166, 16, 10, 10, "#EF4444", "#111827", 5);

// 4. Quick Help
addRect("Btn_Help", 1188, 14, 40, 40, "#1E293B", "#334155", 8);
addText("Btn_Help_Icon", 1202, 25, "❓", 13, "#94A3B8");

// ==========================================
// C. WORKFLOW / PIPELINE STEPPER BANNER
// ==========================================
// Highlights the integrated end-to-end workflow between Store & Warehouse
addRect("Workflow_Banner_Bg", 274, 80, 1144, 76, "#1E293B", "#334155", 10);
addText("Workflow_Title", 290, 92, "ALUR KERJA INTER-LOKASI GUDANG & CABANG", 10, "#38BDF8", "Bold");

// 4 Step Nodes
// Step 1: Request Toko
addRect("Step1_Bg", 290, 110, 230, 36, "#0F172A", "#38BDF8", 6);
addText("Step1_Num", 300, 121, "1", 11, "#38BDF8", "Bold");
addText("Step1_Title", 316, 115, "Toko Buat Permintaan", 11, "#F8FAFC", "Bold");
addText("Step1_Sub", 316, 129, "3 Permintaan baru draft", 9, "#94A3B8");

addText("Step_Arrow_1", 532, 120, "➔", 14, "#475569");

// Step 2: Gudang Approve
addRect("Step2_Bg", 560, 110, 230, 36, "#0F172A", "#F59E0B", 6);
addText("Step2_Num", 570, 121, "2", 11, "#F59E0B", "Bold");
addText("Step2_Title", 586, 115, "Verifikasi & Approval Gudang", 11, "#F8FAFC", "Bold");
addText("Step2_Sub", 586, 129, "5 Antrean butuh respon", 9, "#FBBF24");

addText("Step_Arrow_2", 802, 120, "➔", 14, "#475569");

// Step 3: Packing & Dispatch
addRect("Step3_Bg", 830, 110, 230, 36, "#0F172A", "#6366F1", 6);
addText("Step3_Num", 840, 121, "3", 11, "#6366F1", "Bold");
addText("Step3_Title", 856, 115, "Dispatch DO / Surat Jalan", 11, "#F8FAFC", "Bold");
addText("Step3_Sub", 856, 129, "4 Pengiriman aktif armada", 9, "#A5B4FC");

addText("Step_Arrow_3", 1072, 120, "➔", 14, "#475569");

// Step 4: Handshake Penerimaan Toko
addRect("Step4_Bg", 1100, 110, 230, 36, "#0F172A", "#10B981", 6);
addText("Step4_Num", 1110, 121, "4", 11, "#10B981", "Bold");
addText("Step4_Title", 1126, 115, "Handshake Terima di Toko", 11, "#F8FAFC", "Bold");
addText("Step4_Sub", 1126, 129, "12 Transaksi selesai hari ini", 9, "#34D399");


// ==========================================
// D. 4 SUMMARY METRIC CARDS (w: 268 each)
// ==========================================
const metrics = [
  {
    x: 274,
    accent: "#3B82F6",
    title: "TOTAL SKU AKTIF",
    value: "1,420 SKU",
    sub: "↑ +14 SKU baru terdaftar bulan ini",
    subColor: "#34D399"
  },
  {
    x: 566,
    accent: "#F59E0B",
    title: "PERMINTAAN PERLU APPROVAL",
    value: "5 Antrean",
    sub: "⚡ 2 permintaan status urgent",
    subColor: "#FBBF24"
  },
  {
    x: 858,
    accent: "#6366F1",
    title: "SIAP DISPATCH / SURAT JALAN",
    value: "12 Siap Kirim",
    sub: "🚚 Siap cetak dokumen delivery order",
    subColor: "#A5B4FC"
  },
  {
    x: 1150,
    accent: "#EF4444",
    title: "STOK KRITIS (< SAFETY STOCK)",
    value: "8 Item Kritis",
    sub: "⚠️ Perlu order pembelian / inbound",
    subColor: "#F87171"
  }
];

metrics.forEach((m, idx) => {
  addRect(`Metric_Card_${idx}`, m.x, 168, 268, 96, "#1E293B", "#334155", 10);
  addRect(`Metric_TopBar_${idx}`, m.x, 168, 268, 4, m.accent, null, 2);
  addText(`Metric_Title_${idx}`, m.x + 16, 182, m.title, 10, "#94A3B8", "Bold");
  addText(`Metric_Val_${idx}`, m.x + 16, 202, m.value, 22, "#FFFFFF", "Bold");
  addText(`Metric_Sub_${idx}`, m.x + 16, 238, m.sub, 10, m.subColor);
});

// ==========================================
// E. MAIN CONTENT CONTAINER (w: 1144, h: 608)
// ==========================================
addRect("Main_Container_Bg", 274, 276, 1144, 608, "#1E293B", "#334155", 10);

// Tab Headers
addRect("Tab_1_Active", 292, 290, 168, 34, "#2563EB", null, 6);
addText("Tab_1_Txt", 304, 301, "📦 Daftar Inventaris & Stok", 11, "#FFFFFF", "Bold");

addRect("Tab_2_Bg", 468, 290, 184, 34, "#0F172A", "#334155", 6);
addText("Tab_2_Txt", 480, 301, "⏳ Antrean Request Toko (5)", 11, "#94A3B8");

addRect("Tab_3_Bg", 660, 290, 170, 34, "#0F172A", "#334155", 6);
addText("Tab_3_Txt", 672, 301, "🚚 Jadwal Dispatch DO (12)", 11, "#94A3B8");

addRect("Tab_4_Bg", 838, 290, 150, 34, "#0F172A", "#334155", 6);
addText("Tab_4_Txt", 850, 301, "📑 Buku Mutasi Ledger", 11, "#94A3B8");

// Export & Action Buttons Right
addRect("Btn_Export_Excel", 1180, 290, 116, 34, "#0F172A", "#334155", 6);
addText("Btn_Export_Txt", 1192, 301, "📥 Export Excel", 11, "#CBD5E1");

addRect("Btn_Refresh", 1304, 290, 96, 34, "#0F172A", "#334155", 6);
addText("Btn_Refresh_Txt", 1318, 301, "🔄 Refresh", 11, "#CBD5E1");

// Filter Row
addRect("Filter_Row_Bg", 292, 336, 1108, 40, "#0F172A", "#334155", 6);
addText("Filter_Cat_Txt", 306, 349, "Kategori: Semua ▾", 11, "#94A3B8");
addText("Filter_Loc_Txt", 450, 349, "Lokasi: Gudang Pusat ▾", 11, "#94A3B8");
addText("Filter_Status_Txt", 620, 349, "Status Stok: Semua Status ▾", 11, "#94A3B8");

addRect("Filter_Search_Input", 880, 342, 280, 28, "#1E293B", "#334155", 4);
addText("Filter_Search_Txt", 894, 350, "Cari barang dalam tabel...", 10, "#64748B");
addRect("Filter_Reset_Btn", 1170, 342, 70, 28, "#1E293B", "#334155", 4);
addText("Filter_Reset_Txt", 1184, 350, "Reset", 10, "#94A3B8");

// ==========================================
// F. DATA TABLE
// ==========================================
// Table Header
addRect("Th_Bg", 292, 386, 1108, 36, "#111827", "#334155", 4);
addText("Th_SKU", 306, 398, "KODE SKU", 10, "#94A3B8", "Bold");
addText("Th_Name", 420, 398, "NAMA BARANG & KATEGORI", 10, "#94A3B8", "Bold");
addText("Th_Loc", 680, 398, "LOKASI PENYIMPANAN", 10, "#94A3B8", "Bold");
addText("Th_Safety", 850, 398, "SAFETY STOCK", 10, "#94A3B8", "Bold");
addText("Th_Stock", 960, 398, "STOK TERSEDIA", 10, "#94A3B8", "Bold");
addText("Th_Status", 1090, 398, "STATUS", 10, "#94A3B8", "Bold");
addText("Th_Action", 1230, 398, "AKSI CEPAT", 10, "#94A3B8", "Bold");

// Table Rows (Data matching the repository's real domain data)
const rows = [
  {
    sku: "SKU-ELC-001",
    name: "Kabel UTP Cat6 305m Belden High Speed",
    cat: "Elektronik & Jaringan",
    location: "Gudang Pusat (Area A-02)",
    safety: "20 Roll",
    stock: "154 Roll",
    stockColor: "#34D399",
    statusText: "IN STOCK",
    statusBg: "#064E3B",
    statusBorder: "#059669",
    statusColor: "#34D399",
    actions: ["+ Inbound", "Transfer"]
  },
  {
    sku: "SKU-ELC-002",
    name: "Router Gigabit Dual Band Archer C6",
    cat: "Networking / Perangkat Aktif",
    location: "Gudang Pusat (Area B-01)",
    safety: "15 Unit",
    stock: "4 Unit",
    stockColor: "#FBBF24",
    statusText: "LOW STOCK",
    statusBg: "#78350F",
    statusBorder: "#D97706",
    statusColor: "#FCD34D",
    actions: ["+ Inbound", "Transfer"]
  },
  {
    sku: "SKU-ATK-001",
    name: "Kertas HVS A4 80gr PaperOne Box (5 Rim)",
    cat: "Alat Tulis Kantor & Kertas",
    location: "Toko Cabang 1 - Mall A",
    safety: "50 Rim",
    stock: "8 Rim",
    stockColor: "#F87171",
    statusText: "CRITICAL",
    statusBg: "#7F1D1D",
    statusBorder: "#DC2626",
    statusColor: "#FCA5A5",
    actions: ["Minta Kirim", "Detail"]
  },
  {
    sku: "SKU-PRN-001",
    name: "Ribbon Barcode Wax-Resin 110mm x 300m",
    cat: "Perlengkapan Packaging & Barcode",
    location: "Gudang Pusat (Area C-04)",
    safety: "25 Roll",
    stock: "92 Roll",
    stockColor: "#34D399",
    statusText: "IN STOCK",
    statusBg: "#064E3B",
    statusBorder: "#059669",
    statusColor: "#34D399",
    actions: ["+ Inbound", "Transfer"]
  },
  {
    sku: "SKU-ELC-003",
    name: "Switch Managed 24-Port Gigabit Rackmount",
    cat: "Networking / Infrastruktur",
    location: "Toko Cabang 2 - Mega Mall",
    safety: "10 Unit",
    stock: "0 Unit",
    stockColor: "#EF4444",
    statusText: "OUT OF STOCK",
    statusBg: "#374151",
    statusBorder: "#6B7280",
    statusColor: "#E5E7EB",
    actions: ["Minta Kirim", "Detail"]
  },
  {
    sku: "SKU-LOG-004",
    name: "Label Thermal Barcode 100x150mm (500 Pcs)",
    cat: "Perlengkapan Surat Jalan",
    location: "Gudang Pusat (Area C-01)",
    safety: "30 Roll",
    stock: "18 Roll",
    stockColor: "#FBBF24",
    statusText: "LOW STOCK",
    statusBg: "#78350F",
    statusBorder: "#D97706",
    statusColor: "#FCD34D",
    actions: ["+ Inbound", "Transfer"]
  }
];

let rowY = 430;
rows.forEach((r, idx) => {
  const rowBg = idx % 2 === 0 ? "#1E293B" : "#192231";
  addRect(`Row_Bg_${idx}`, 292, rowY, 1108, 54, rowBg, "#334155", 0);

  // SKU
  addText(`Row_SKU_${idx}`, 306, rowY + 20, r.sku, 11, "#38BDF8", "Bold");

  // Name & Category
  addText(`Row_Name_${idx}`, 420, rowY + 12, r.name, 11, "#F8FAFC", "Bold");
  addText(`Row_Cat_${idx}`, 420, rowY + 28, r.cat, 9, "#64748B");

  // Location
  addText(`Row_Loc_${idx}`, 680, rowY + 20, r.location, 11, "#CBD5E1");

  // Safety Stock
  addText(`Row_Safety_${idx}`, 850, rowY + 20, r.safety, 11, "#94A3B8");

  // Available Stock
  addText(`Row_Stock_${idx}`, 960, rowY + 20, r.stock, 12, r.stockColor, "Bold");

  // Status Badge
  addRect(`Row_Status_Bg_${idx}`, 1085, rowY + 14, 95, 24, r.statusBg, r.statusBorder, 12);
  addText(`Row_Status_Txt_${idx}`, 1098, rowY + 21, r.statusText, 9, r.statusColor, "Bold");

  // Quick Action Buttons
  addRect(`Row_Act1_Bg_${idx}`, 1215, rowY + 14, 70, 24, "#2563EB", null, 4);
  addText(`Row_Act1_Txt_${idx}`, 1222, rowY + 21, r.actions[0], 9, "#FFFFFF", "Bold");

  addRect(`Row_Act2_Bg_${idx}`, 1292, rowY + 14, 60, 24, "#334155", null, 4);
  addText(`Row_Act2_Txt_${idx}`, 1300, rowY + 21, r.actions[1], 9, "#CBD5E1");

  rowY += 56;
});

// Table Footer & Pagination
addRect("Table_Footer_Bg", 292, rowY + 6, 1108, 36, "#111827", "#334155", 4);
addText("Table_Footer_Info", 306, rowY + 18, "Menampilkan 1 - 6 dari 1,420 total SKU aktif inventaris", 10, "#94A3B8");

// Page buttons
addRect("Page_Prev", 1140, rowY + 11, 60, 26, "#1E293B", "#334155", 4);
addText("Page_Prev_Txt", 1150, rowY + 18, "Kembali", 9, "#94A3B8");

addRect("Page_1", 1206, rowY + 11, 26, 26, "#2563EB", null, 4);
addText("Page_1_Txt", 1215, rowY + 18, "1", 9, "#FFFFFF", "Bold");

addRect("Page_2", 1238, rowY + 11, 26, 26, "#1E293B", "#334155", 4);
addText("Page_2_Txt", 1247, rowY + 18, "2", 9, "#94A3B8");

addRect("Page_3", 1270, rowY + 11, 26, 26, "#1E293B", "#334155", 4);
addText("Page_3_Txt", 1279, rowY + 18, "3", 9, "#94A3B8");

addRect("Page_Next", 1302, rowY + 11, 60, 26, "#1E293B", "#334155", 4);
addText("Page_Next_Txt", 1312, rowY + 18, "Lanjut", 9, "#CBD5E1");

// Bottom Workflow Helper Callout
addRect("Bottom_Hint_Bg", 292, 814, 1108, 54, "#0F172A", "#1E3A8A", 8);
addText("Bottom_Hint_Icon", 308, 832, "💡", 16, "#60A5FA");
addText("Bottom_Hint_Title", 336, 826, "Panduan Cepat Alur Antar-User:", 11, "#60A5FA", "Bold");
addText("Bottom_Hint_Desc", 336, 842, "Toko dapat langsung klik '+ Request Toko' untuk meminta restock. Admin Gudang menerima notifikasi real-time di pipeline untuk verifikasi & cetak Surat Jalan (DO).", 10, "#94A3B8");

fs.writeFileSync('commands.json', JSON.stringify(commands, null, 2));
console.log(`Generated ${commands.length} commands.`);
