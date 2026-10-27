const fs = require('fs');

const commands = [];

// 1. Root Canvas Frame: 1360 x 940 (presents 3 phones side-by-side like the mockup)
commands.push({
  command: "frame.create",
  params: {
    name: "Warehouse Mobile Design System - 3 Screens",
    x: 0,
    y: 0,
    width: 1360,
    height: 940,
    props: {
      fill: "#F1F5F9" // Soft mockup background
    }
  }
});

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

function addText(name, x, y, text, fontSize = 12, fill = "#0F172A", fontStyle = "Regular") {
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

// Helper for phone shell
function buildPhoneShell(baseX, baseY, title) {
  // Drop shadow simulation
  addRect(`${title}_Shadow`, baseX + 8, baseY + 12, 380, 844, "#000000", null, 46, 0.08);
  // Phone Outer Border
  addRect(`${title}_Border`, baseX, baseY, 380, 844, "#0F172A", null, 46);
  // Phone Screen Frame
  addRect(`${title}_Screen`, baseX + 4, baseY + 4, 372, 836, "#FFFFFF", "#E2E8F0", 42);
  // Dynamic Island
  addRect(`${title}_Island`, baseX + 130, baseY + 12, 120, 26, "#000000", null, 13);
  // Speaker / Camera dot
  addRect(`${title}_Cam`, baseX + 224, baseY + 20, 10, 10, "#1E293B", null, 5);

  // Status Bar
  addText(`${title}_Time`, baseX + 32, baseY + 17, "09:41", 11, "#0F172A", "Bold");
  addText(`${title}_Icons`, baseX + 306, baseY + 17, "📶 🔋", 10, "#0F172A");
}

// =========================================================================
// SCREEN 1: DASHBOARD & ACTIVE SHIPMENTS (baseX: 50, baseY: 48)
// =========================================================================
const s1X = 50;
const s1Y = 48;
buildPhoneShell(s1X, s1Y, "Screen1");

// Brand Header
addRect("S1_Logo_Bg", s1X + 24, s1Y + 52, 28, 28, "#FF5722", null, 6);
addText("S1_Logo_Txt", s1X + 29, s1Y + 58, "📦", 13, "#FFFFFF");
addText("S1_Brand_Name", s1X + 58, s1Y + 56, "FlowShip WMS", 14, "#0F172A", "Bold");

// Header Notif Bell
addRect("S1_Notif_Bg", s1X + 320, s1Y + 50, 32, 32, "#F8FAFC", "#E2E8F0", 16);
addText("S1_Notif_Icon", s1X + 330, s1Y + 58, "🔔", 12, "#475569");
addRect("S1_Notif_Dot", s1X + 342, s1Y + 52, 6, 6, "#FF5722", null, 3);

// Hero Banner Card (Orange themed)
addRect("S1_Hero_Bg", s1X + 20, s1Y + 92, 340, 128, "#FFF7ED", "#FED7AA", 18);
addText("S1_Hero_Greeting", s1X + 34, s1Y + 104, "Selamat pagi, Budi Santoso 👋", 10, "#EA580C", "Bold");
addText("S1_Hero_Headline1", s1X + 34, s1Y + 120, "Ship Smarter,", 17, "#0F172A", "Bold");
addText("S1_Hero_Headline2", s1X + 34, s1Y + 140, "Deliver Faster.", 17, "#FF5722", "Bold");
addText("S1_Hero_Sub", s1X + 34, s1Y + 164, "Kelola mutasi gudang, surat jalan & tracking", 9, "#64748B");
addText("S1_Hero_Sub2", s1X + 34, s1Y + 176, "dalam satu platform terintegrasi.", 9, "#64748B");
// Delivery Van illustration badge
addRect("S1_Hero_Illu_Bg", s1X + 256, s1Y + 112, 88, 88, "#FFFFFF", "#FDBA74", 14);
addText("S1_Hero_Illu_Icon", s1X + 280, s1Y + 132, "🚚", 32, "#FF5722");
addText("S1_Hero_Illu_Txt", s1X + 276, s1Y + 176, "FlowShip Log", 8, "#EA580C", "Bold");

// Active Shipment Card
addRect("S1_Active_Bg", s1X + 20, s1Y + 230, 340, 114, "#FFFFFF", "#E2E8F0", 18);
addRect("S1_Active_Status_Dot", s1X + 34, s1Y + 242, 6, 6, "#10B981", null, 3);
addText("S1_Active_Label", s1X + 44, s1Y + 240, "Pengiriman Aktif", 9, "#10B981", "Bold");
addText("S1_Active_ViewAll", s1X + 300, s1Y + 240, "Lihat Semua", 9, "#64748B");

addText("S1_Active_Code", s1X + 34, s1Y + 258, "#DO-24891", 14, "#0F172A", "Bold");
addText("S1_Active_Route", s1X + 34, s1Y + 276, "Gudang Pusat ➔ Toko Cabang 1 (Mall A)", 10, "#475569");

// Pills for Status & ETA
addRect("S1_Pill_Status_Bg", s1X + 34, s1Y + 296, 76, 22, "#ECFDF5", "#A7F3D0", 6);
addText("S1_Pill_Status_Txt", s1X + 46, s1Y + 302, "In Transit", 9, "#059669", "Bold");

addRect("S1_Pill_ETA_Bg", s1X + 118, s1Y + 296, 114, 22, "#F8FAFC", "#E2E8F0", 6);
addText("S1_Pill_ETA_Txt", s1X + 128, s1Y + 302, "Estimasi: Hari ini 17:30", 9, "#64748B");

// Mini Box visual in card
addRect("S1_Box_Visual", s1X + 266, s1Y + 256, 76, 66, "#FFF7ED", "#FFEDD5", 12);
addText("S1_Box_Icon", s1X + 288, s1Y + 276, "📦", 24, "#EA580C");

// Quick Actions
addText("S1_QA_Title", s1X + 22, s1Y + 356, "Aksi Cepat", 12, "#0F172A", "Bold");

const qaItems = [
  { icon: "📦", label: "Buat Request", color: "#FF5722", bg: "#FFF7ED" },
  { icon: "🔍", label: "Cek Resi / DO", color: "#2563EB", bg: "#EFF6FF" },
  { icon: "📅", label: "Jadwal Kirim", color: "#059669", bg: "#ECFDF5" },
  { icon: "📍", label: "Lokasi Toko", color: "#D97706", bg: "#FFFBEB" },
];

qaItems.forEach((qa, idx) => {
  const qx = s1X + 22 + idx * 86;
  addRect(`S1_QA_Bg_${idx}`, qx, s1Y + 376, 74, 68, "#FFFFFF", "#E2E8F0", 14);
  addRect(`S1_QA_IconBg_${idx}`, qx + 22, s1Y + 386, 30, 30, qa.bg, null, 15);
  addText(`S1_QA_Icon_${idx}`, qx + 29, s1Y + 393, qa.icon, 13, qa.color);
  addText(`S1_QA_Lbl_${idx}`, qx + 7, s1Y + 424, qa.label, 9, "#334155", "Bold");
});

// Recent Shipments
addText("S1_Recent_Title", s1X + 22, s1Y + 458, "Mutasi & Pengiriman Terkini", 12, "#0F172A", "Bold");
addText("S1_Recent_SeeAll", s1X + 314, s1Y + 458, "Semua", 10, "#FF5722", "Bold");

const recentRows = [
  {
    code: "#DO-24890",
    route: "Gudang Pusat ➔ Toko Cabang 2",
    date: "24 Okt 2026",
    status: "Delivered",
    statusBg: "#ECFDF5",
    statusColor: "#059669",
    icon: "📦"
  },
  {
    code: "#DO-24889",
    route: "Gudang Pusat ➔ Cabang Bali Mall",
    date: "23 Okt 2026",
    status: "In Transit",
    statusBg: "#EFF6FF",
    statusColor: "#2563EB",
    icon: "🚚"
  },
  {
    code: "#DO-24885",
    route: "Gudang Pusat ➔ Toko Surabaya",
    date: "22 Okt 2026",
    status: "Delivered",
    statusBg: "#ECFDF5",
    statusColor: "#059669",
    icon: "📦"
  }
];

let rY = s1Y + 478;
recentRows.forEach((r, idx) => {
  addRect(`S1_Row_Bg_${idx}`, s1X + 20, rY, 340, 62, "#FFFFFF", "#F1F5F9", 14);
  addRect(`S1_Row_IconBg_${idx}`, s1X + 30, rY + 12, 38, 38, "#F8FAFC", "#E2E8F0", 10);
  addText(`S1_Row_Icon_${idx}`, s1X + 41, rY + 22, r.icon, 14, "#475569");

  addText(`S1_Row_Code_${idx}`, s1X + 78, rY + 14, r.code, 11, "#0F172A", "Bold");
  addText(`S1_Row_Route_${idx}`, s1X + 78, rY + 28, r.route, 9, "#64748B");
  addText(`S1_Row_Date_${idx}`, s1X + 78, rY + 42, r.date, 8, "#94A3B8");

  addRect(`S1_Row_Badge_${idx}`, s1X + 276, rY + 14, 66, 20, r.statusBg, null, 6);
  addText(`S1_Row_BadgeTxt_${idx}`, s1X + 286, rY + 19, r.status, 8, r.statusColor, "Bold");
  addText(`S1_Row_Arrow_${idx}`, s1X + 348, rY + 36, "›", 14, "#94A3B8");

  rY += 70;
});

// Bottom Navigation Bar S1
addRect("S1_BNav_Bg", s1X + 4, s1Y + 764, 372, 72, "#FFFFFF", "#E2E8F0", 0);
const s1Tabs = [
  { icon: "🏠", label: "Beranda", active: true },
  { icon: "📦", label: "Pengiriman", active: false },
  { icon: "📍", label: "Lokasi", active: false },
  { icon: "💬", label: "Bantuan", active: false },
  { icon: "👤", label: "Akun", active: false }
];
s1Tabs.forEach((tab, i) => {
  const tx = s1X + 18 + i * 72;
  const col = tab.active ? "#FF5722" : "#94A3B8";
  addText(`S1_Tab_Icon_${i}`, tx + 18, s1Y + 778, tab.icon, 14, col);
  addText(`S1_Tab_Txt_${i}`, tx + 12, s1Y + 798, tab.label, 9, col, tab.active ? "Bold" : "Regular");
});


// =========================================================================
// SCREEN 2: SHIPMENT DETAILS & LIVE TRACKING (baseX: 490, baseY: 48)
// =========================================================================
const s2X = 490;
const s2Y = 48;
buildPhoneShell(s2X, s2Y, "Screen2");

// Screen 2 Header Bar
addText("S2_Back_Btn", s2X + 24, s2Y + 54, "←", 16, "#0F172A", "Bold");
addText("S2_Title", s2X + 130, s2Y + 54, "Detail Pengiriman", 13, "#0F172A", "Bold");
addText("S2_Share_Icon", s2X + 312, s2Y + 54, "📤", 12, "#475569");
addText("S2_More_Icon", s2X + 342, s2Y + 54, "⋮", 14, "#475569");

// Package ID Card
addRect("S2_Pkg_Card_Bg", s2X + 20, s2Y + 86, 340, 94, "#FFFFFF", "#E2E8F0", 18);
addText("S2_Pkg_Sub", s2X + 34, s2Y + 98, "Nomor Surat Jalan (DO)", 9, "#64748B");
addText("S2_Pkg_Code", s2X + 34, s2Y + 112, "FS248912938", 14, "#0F172A", "Bold");
addText("S2_Copy_Icon", s2X + 148, s2Y + 114, "❐", 10, "#FF5722");

addRect("S2_Status_Badge", s2X + 266, s2Y + 96, 80, 22, "#ECFDF5", "#A7F3D0", 11);
addRect("S2_Status_Dot", s2X + 276, s2Y + 104, 6, 6, "#10B981", null, 3);
addText("S2_Status_Txt", s2X + 288, s2Y + 102, "In Transit", 9, "#059669", "Bold");

addText("S2_Est_Lbl", s2X + 34, s2Y + 142, "Estimasi Tiba di Toko", 9, "#94A3B8");
addText("S2_Est_Val", s2X + 34, s2Y + 154, "Hari Ini, 17:30", 11, "#FF5722", "Bold");

addText("S2_Svc_Lbl", s2X + 260, s2Y + 142, "Layanan Armada", 9, "#94A3B8");
addText("S2_Svc_Val", s2X + 260, s2Y + 154, "Express ⚡", 11, "#EA580C", "Bold");

// Map Visual Container (Route Jakarta -> Surabaya)
addRect("S2_Map_Bg", s2X + 20, s2Y + 190, 340, 160, "#F8FAFC", "#E2E8F0", 18);

// Road grid simulation
addRect("S2_Map_Grid1", s2X + 40, s2Y + 230, 300, 2, "#E2E8F0");
addRect("S2_Map_Grid2", s2X + 40, s2Y + 290, 300, 2, "#E2E8F0");
addRect("S2_Map_Grid3", s2X + 160, s2Y + 200, 2, 140, "#E2E8F0");
addRect("S2_Map_Grid4", s2X + 260, s2Y + 200, 2, 140, "#E2E8F0");

// Origin Node (Jakarta / Gudang Pusat)
addRect("S2_Node_Orig_Ring", s2X + 46, s2Y + 246, 18, 18, "#FFF7ED", "#FF5722", 9);
addRect("S2_Node_Orig_Dot", s2X + 51, s2Y + 251, 8, 8, "#FF5722", null, 4);
addText("S2_Node_Orig_Txt", s2X + 36, s2Y + 270, "Gudang Pusat", 8, "#0F172A", "Bold");

// Dashed Route Simulation (5 orange line segments)
addRect("S2_Route_Seg1", s2X + 70, s2Y + 254, 24, 3, "#FF5722", null, 1);
addRect("S2_Route_Seg2", s2X + 104, s2Y + 260, 24, 3, "#FF5722", null, 1);
addRect("S2_Route_Seg3", s2X + 138, s2Y + 268, 24, 3, "#FF5722", null, 1);
addRect("S2_Route_Seg4", s2X + 216, s2Y + 278, 24, 3, "#FF5722", null, 1);
addRect("S2_Route_Seg5", s2X + 250, s2Y + 284, 24, 3, "#FF5722", null, 1);

// Moving Truck Marker in Middle
addRect("S2_Truck_Card", s2X + 168, s2Y + 254, 42, 32, "#FFFFFF", "#FED7AA", 8);
addText("S2_Truck_Icon", s2X + 178, s2Y + 262, "🚚", 16, "#FF5722");

// Destination Node (Toko Cabang)
addRect("S2_Node_Dest_Ring", s2X + 284, s2Y + 278, 18, 18, "#FFF7ED", "#EA580C", 9);
addRect("S2_Node_Dest_Dot", s2X + 289, s2Y + 283, 8, 8, "#EA580C", null, 4);
addText("S2_Node_Dest_Txt", s2X + 274, s2Y + 302, "Toko Mall A", 8, "#0F172A", "Bold");

// Crosshair Recenter Button
addRect("S2_Recenter_Btn", s2X + 316, s2Y + 204, 30, 30, "#FFFFFF", "#E2E8F0", 15);
addText("S2_Recenter_Icon", s2X + 324, s2Y + 211, "🎯", 11, "#475569");

// Tracking Timeline Section
addText("S2_Timeline_Title", s2X + 24, s2Y + 364, "Riwayat Perjalanan (Tracking Timeline)", 12, "#0F172A", "Bold");

const timelineEvents = [
  {
    time: "09:12",
    title: "Surat Jalan Dibuat & Terverifikasi",
    sub: "Gudang Pusat - Sorting Center",
    done: true,
    icon: "✓"
  },
  {
    time: "11:40",
    title: "Barang Masuk Truk Ekspedisi",
    sub: "Armada Mobil Box B-9012-GUD",
    done: true,
    icon: "📦"
  },
  {
    time: "14:30",
    title: "Sedang Dalam Perjalanan (In Transit)",
    sub: "Menuju Toko Cabang 1 (Mall A)",
    done: true,
    icon: "🚚"
  },
  {
    time: "17:30",
    title: "Estimasi Tiba & Handshake Toko",
    sub: "Penerima: Staff Store Kasir",
    done: false,
    icon: "○"
  }
];

let tlY = s2Y + 390;
timelineEvents.forEach((ev, idx) => {
  // Time
  addText(`S2_TL_Time_${idx}`, s2X + 24, tlY + 8, ev.time, 10, ev.done ? "#0F172A" : "#94A3B8", "Bold");

  // Icon Node
  const nodeBg = ev.done ? "#FF5722" : "#F1F5F9";
  const nodeStroke = ev.done ? null : "#CBD5E1";
  const nodeTxtCol = ev.done ? "#FFFFFF" : "#94A3B8";

  addRect(`S2_TL_Node_${idx}`, s2X + 68, tlY + 4, 24, 24, nodeBg, nodeStroke, 12);
  addText(`S2_TL_NodeTxt_${idx}`, s2X + 75, tlY + 10, ev.icon, 10, nodeTxtCol, "Bold");

  // Connecting vertical line
  if (idx < timelineEvents.length - 1) {
    const lineCol = ev.done ? "#FF5722" : "#E2E8F0";
    addRect(`S2_TL_Line_${idx}`, s2X + 79, tlY + 30, 2, 38, lineCol);
  }

  // Text Info
  addText(`S2_TL_Title_${idx}`, s2X + 102, tlY + 4, ev.title, 11, ev.done ? "#0F172A" : "#64748B", "Bold");
  addText(`S2_TL_Sub_${idx}`, s2X + 102, tlY + 20, ev.sub, 9, "#94A3B8");

  tlY += 66;
});

// Floating Bottom Action Button (Full Orange)
addRect("S2_Action_Btn", s2X + 24, s2Y + 748, 332, 50, "#FF5722", null, 14);
addText("S2_Action_Txt", s2X + 96, s2Y + 764, "Konfirmasi Terima di Toko (Handshake)", 11, "#FFFFFF", "Bold");


// =========================================================================
// SCREEN 3: CREATE NEW SHIPMENT / PERMINTAAN STOK (baseX: 930, baseY: 48)
// =========================================================================
const s3X = 930;
const s3Y = 48;
buildPhoneShell(s3X, s3Y, "Screen3");

// Screen 3 Header Bar
addText("S3_Back_Btn", s3X + 24, s3Y + 54, "←", 16, "#0F172A", "Bold");
addText("S3_Title", s3X + 120, s3Y + 54, "Buat Permintaan Stok Baru", 13, "#0F172A", "Bold");

// Section 1: Package Information
addText("S3_Sec1_Title", s3X + 24, s3Y + 86, "1. Informasi Lokasi & Barang", 11, "#0F172A", "Bold");

// Pickup (Gudang Asal)
addRect("S3_Input_Origin_Bg", s3X + 20, s3Y + 106, 340, 48, "#FFFFFF", "#E2E8F0", 12);
addText("S3_In_Orig_Icon", s3X + 34, s3Y + 120, "📍", 13, "#FF5722");
addText("S3_In_Orig_Lbl", s3X + 58, s3Y + 114, "Lokasi Asal (Gudang)", 8, "#94A3B8");
addText("S3_In_Orig_Val", s3X + 58, s3Y + 128, "Gudang Pusat (Area Utama)", 11, "#0F172A", "Bold");
addText("S3_In_Orig_Arr", s3X + 340, s3Y + 122, "›", 14, "#94A3B8");

// Delivery (Toko Tujuan)
addRect("S3_Input_Dest_Bg", s3X + 20, s3Y + 160, 340, 48, "#FFFFFF", "#E2E8F0", 12);
addText("S3_In_Dest_Icon", s3X + 34, s3Y + 174, "🏪", 13, "#2563EB");
addText("S3_In_Dest_Lbl", s3X + 58, s3Y + 168, "Lokasi Tujuan (Toko Cabang)", 8, "#94A3B8");
addText("S3_In_Dest_Val", s3X + 58, s3Y + 182, "Toko Cabang 1 - Mall A", 11, "#0F172A", "Bold");
addText("S3_In_Dest_Arr", s3X + 340, s3Y + 176, "›", 14, "#94A3B8");

// Package Type / SKU Dropdown
addRect("S3_Input_SKU_Bg", s3X + 20, s3Y + 214, 340, 48, "#FFFFFF", "#E2E8F0", 12);
addText("S3_In_SKU_Icon", s3X + 34, s3Y + 228, "📦", 13, "#EA580C");
addText("S3_In_SKU_Lbl", s3X + 58, s3Y + 222, "Pilih Item Master SKU", 8, "#94A3B8");
addText("S3_In_SKU_Val", s3X + 58, s3Y + 236, "SKU-ELC-001 (Kabel UTP Cat6 305m)", 11, "#0F172A", "Bold");
addText("S3_In_SKU_Arr", s3X + 338, s3Y + 230, "▾", 12, "#94A3B8");

// Quantity & Safety Stock Info
addRect("S3_Input_Qty_Bg", s3X + 20, s3Y + 268, 164, 46, "#FFFFFF", "#E2E8F0", 12);
addText("S3_In_Qty_Lbl", s3X + 32, s3Y + 276, "Jumlah Permintaan", 8, "#94A3B8");
addText("S3_In_Qty_Val", s3X + 32, s3Y + 292, "25 Roll", 12, "#0F172A", "Bold");
addText("S3_In_Qty_Arr", s3X + 160, s3Y + 286, "▾", 10, "#94A3B8");

addRect("S3_Input_Safe_Bg", s3X + 196, s3Y + 268, 164, 46, "#FFFFFF", "#E2E8F0", 12);
addText("S3_In_Safe_Lbl", s3X + 208, s3Y + 276, "Sisa Stok Gudang Pusat", 8, "#94A3B8");
addText("S3_In_Safe_Val", s3X + 208, s3Y + 292, "154 Roll (Aman)", 12, "#059669", "Bold");

// Section 2: Delivery Options (Priority)
addText("S3_Sec2_Title", s3X + 24, s3Y + 328, "2. Prioritas Pengiriman & Jadwal", 11, "#0F172A", "Bold");

// 3 Selectable Cards
// Option 1: Express (Selected)
addRect("S3_Opt1_Bg", s3X + 20, s3Y + 348, 106, 92, "#FFF7ED", "#FF5722", 14);
addText("S3_Opt1_Icon", s3X + 66, s3Y + 358, "⚡", 16, "#FF5722");
addText("S3_Opt1_Title", s3X + 44, s3Y + 380, "Express", 11, "#FF5722", "Bold");
addText("S3_Opt1_Time", s3X + 48, s3Y + 396, "Hari Ini", 9, "#64748B");
addText("S3_Opt1_Check", s3X + 68, s3Y + 414, "●", 10, "#FF5722");

// Option 2: Regular
addRect("S3_Opt2_Bg", s3X + 137, s3Y + 348, 106, 92, "#FFFFFF", "#E2E8F0", 14);
addText("S3_Opt2_Icon", s3X + 183, s3Y + 358, "🚚", 16, "#475569");
addText("S3_Opt2_Title", s3X + 162, s3Y + 380, "Reguler", 11, "#0F172A", "Bold");
addText("S3_Opt2_Time", s3X + 164, s3Y + 396, "1-2 Hari", 9, "#64748B");
addText("S3_Opt2_Check", s3X + 185, s3Y + 414, "○", 10, "#CBD5E1");

// Option 3: Konsolidasi
addRect("S3_Opt3_Bg", s3X + 254, s3Y + 348, 106, 92, "#FFFFFF", "#E2E8F0", 14);
addText("S3_Opt3_Icon", s3X + 300, s3Y + 358, "🏢", 16, "#475569");
addText("S3_Opt3_Title", s3X + 272, s3Y + 380, "Jadwal Rutin", 10, "#0F172A", "Bold");
addText("S3_Opt3_Time", s3X + 280, s3Y + 396, "Mingguan", 9, "#64748B");
addText("S3_Opt3_Check", s3X + 302, s3Y + 414, "○", 10, "#CBD5E1");

// Section 3: Summary
addText("S3_Sec3_Title", s3X + 24, s3Y + 456, "3. Ringkasan Permintaan Mutasi", 11, "#0F172A", "Bold");

addRect("S3_Summary_Bg", s3X + 20, s3Y + 476, 340, 116, "#FFFFFF", "#E2E8F0", 14);

addText("S3_Sum_Row1_Lbl", s3X + 34, s3Y + 490, "Total Kuantitas Barang", 10, "#64748B");
addText("S3_Sum_Row1_Val", s3X + 288, s3Y + 490, "25 Roll", 10, "#0F172A", "Bold");

addText("S3_Sum_Row2_Lbl", s3X + 34, s3Y + 512, "Estimasi Bobot Muatan", 10, "#64748B");
addText("S3_Sum_Row2_Val", s3X + 286, s3Y + 512, "~125 Kg", 10, "#0F172A", "Bold");

addText("S3_Sum_Row3_Lbl", s3X + 34, s3Y + 534, "Petugas Pemohon", 10, "#64748B");
addText("S3_Sum_Row3_Val", s3X + 262, s3Y + 534, "Staff Toko Mall A", 10, "#0F172A", "Bold");

addRect("S3_Sum_Div", s3X + 34, s3Y + 554, 312, 1, "#E2E8F0");

addText("S3_Sum_Row4_Lbl", s3X + 34, s3Y + 566, "Status Otomatis", 11, "#0F172A", "Bold");
addText("S3_Sum_Row4_Val", s3X + 276, s3Y + 566, "PENDING", 12, "#EA580C", "Bold");

// Note / Alert info callout
addRect("S3_Notice_Bg", s3X + 20, s3Y + 606, 340, 52, "#EFF6FF", "#BFDBFE", 12);
addText("S3_Notice_Icon", s3X + 32, s3Y + 620, "ℹ️", 13, "#2563EB");
addText("S3_Notice_Txt1", s3X + 54, s3Y + 616, "Setelah dikirim, Admin Gudang akan menerima", 9, "#1E40AF");
addText("S3_Notice_Txt2", s3X + 54, s3Y + 630, "notifikasi persetujuan & menyiapkan Surat Jalan (DO).", 9, "#1E40AF");

// Bottom Action Button (Full Orange)
addRect("S3_Submit_Btn", s3X + 20, s3Y + 748, 340, 50, "#FF5722", null, 14);
addText("S3_Submit_Txt", s3X + 116, s3Y + 764, "Kirim Permintaan Stok", 12, "#FFFFFF", "Bold");


fs.writeFileSync('commands-flowship.json', JSON.stringify(commands, null, 2));
console.log(`Generated ${commands.length} FlowShip design commands.`);
