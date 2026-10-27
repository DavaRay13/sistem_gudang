const fs = require('fs');

const commands = [];

// 1. Root Frame: 390 x 844 (Mobile Viewport)
commands.push({
  command: "frame.create",
  params: {
    name: "Warehouse WMS Mobile - 390x844",
    x: 0,
    y: 0,
    width: 390,
    height: 844,
    props: {
      fill: "#0F172A",
      cornerRadius: 32,
      clip: true
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
// 1. STATUS BAR (y: 0 to 40)
// ==========================================
addText("Status_Time", 28, 14, "09:41", 12, "#FFFFFF", "Bold");
addText("Status_Icons", 312, 14, "📶 🔋", 11, "#FFFFFF");

// ==========================================
// 2. MOBILE TOP APP BAR & LOCATION (y: 40 to 86)
// ==========================================
addRect("Header_Bg", 0, 36, 390, 52, "#111827", "#1E293B");

// Logo Badge
addRect("App_Logo_Bg", 16, 44, 34, 34, "#2563EB", null, 8);
addText("App_Logo_Txt", 23, 51, "📦", 16, "#FFFFFF");

// App Name & Location
addText("App_Title", 58, 45, "WMS Mobile", 13, "#FFFFFF", "Bold");
addText("App_Loc_Badge", 58, 62, "📍 Gudang Pusat ▾", 10, "#38BDF8");

// Notification & Avatar Right
addRect("Btn_Notif", 298, 44, 34, 34, "#1E293B", "#334155", 8);
addText("Btn_Notif_Txt", 308, 52, "🔔", 13, "#CBD5E1");
addRect("Notif_Dot", 322, 46, 7, 7, "#EF4444", null, 4);

addRect("User_Avatar", 340, 44, 34, 34, "#3B82F6", null, 17);
addText("User_Avatar_Txt", 348, 52, "BS", 11, "#FFFFFF", "Bold");

// ==========================================
// 3. ROLE SWITCHER SEGMENTED CONTROL (y: 94 to 128)
// ==========================================
// Dual user support (Admin Gudang & Orang Toko)
addRect("Role_Segment_Bg", 16, 94, 358, 34, "#1E293B", "#334155", 8);
addRect("Role_Active_Gudang", 18, 96, 175, 30, "#2563EB", null, 6);
addText("Role_Gudang_Txt", 64, 104, "Admin Gudang", 11, "#FFFFFF", "Bold");
addText("Role_Toko_Txt", 244, 104, "Orang Toko", 11, "#94A3B8");

// ==========================================
// 4. QUICK INPUT BUTTONS (BARCODE & REQUEST) (y: 136 to 184)
// ==========================================
// Scan Barcode for fast input on mobile
addRect("Btn_Scan", 16, 136, 174, 46, "#2563EB", null, 8);
addText("Btn_Scan_Icon", 28, 148, "📷", 16, "#FFFFFF");
addText("Btn_Scan_Title", 54, 144, "Scan Barcode", 11, "#FFFFFF", "Bold");
addText("Btn_Scan_Sub", 54, 158, "Cek & input SKU", 9, "#BFDBFE");

// Buat Request Toko / Inbound
addRect("Btn_Req_Inbound", 200, 136, 174, 46, "#0D9488", null, 8);
addText("Btn_Req_Icon", 212, 148, "⚡", 16, "#FFFFFF");
addText("Btn_Req_Title", 238, 144, "+ Minta Barang", 11, "#FFFFFF", "Bold");
addText("Btn_Req_Sub", 238, 158, "Alur restock toko", 9, "#CCFBF1");

// ==========================================
// 5. WORKFLOW PIPELINE TRACKER (y: 190 to 264)
// ==========================================
addRect("Pipeline_Card_Bg", 16, 190, 358, 70, "#1E293B", "#334155", 8);
addText("Pipeline_Title", 26, 198, "ALUR KERJA INTER-LOKASI (PIPELINE)", 9, "#38BDF8", "Bold");

// 4 Pipeline Mini Steps
// Step 1
addRect("Pipe_Step1_Bg", 24, 214, 72, 36, "#0F172A", "#38BDF8", 6);
addText("Pipe_Step1_Num", 28, 220, "1. Request", 8, "#38BDF8", "Bold");
addText("Pipe_Step1_Val", 28, 232, "3 Baru", 8, "#94A3B8");

addText("Pipe_Arr1", 100, 224, "➔", 10, "#475569");

// Step 2
addRect("Pipe_Step2_Bg", 114, 214, 72, 36, "#0F172A", "#F59E0B", 6);
addText("Pipe_Step2_Num", 118, 220, "2. Approve", 8, "#F59E0B", "Bold");
addText("Pipe_Step2_Val", 118, 232, "5 Antrean", 8, "#FBBF24");

addText("Pipe_Arr2", 190, 224, "➔", 10, "#475569");

// Step 3
addRect("Pipe_Step3_Bg", 204, 214, 72, 36, "#0F172A", "#6366F1", 6);
addText("Pipe_Step3_Num", 208, 220, "3. Kirim DO", 8, "#6366F1", "Bold");
addText("Pipe_Step3_Val", 208, 232, "4 OTW", 8, "#A5B4FC");

addText("Pipe_Arr3", 280, 224, "➔", 10, "#475569");

// Step 4
addRect("Pipe_Step4_Bg", 294, 214, 72, 36, "#0F172A", "#10B981", 6);
addText("Pipe_Step4_Num", 298, 220, "4. Terima", 8, "#10B981", "Bold");
addText("Pipe_Step4_Val", 298, 232, "12 Sukses", 8, "#34D399");

// ==========================================
// 6. 2x2 METRIC SUMMARY CARDS (y: 268 to 344)
// ==========================================
// Card 1: Total SKU
addRect("Met1_Bg", 16, 268, 174, 52, "#1E293B", "#334155", 8);
addRect("Met1_Bar", 16, 268, 4, 52, "#3B82F6", null, 2);
addText("Met1_Title", 26, 276, "TOTAL SKU", 8, "#94A3B8", "Bold");
addText("Met1_Val", 26, 290, "1,420 SKU", 14, "#FFFFFF", "Bold");
addText("Met1_Sub", 26, 308, "Aktif di gudang", 8, "#34D399");

// Card 2: Permintaan Approval
addRect("Met2_Bg", 200, 268, 174, 52, "#1E293B", "#334155", 8);
addRect("Met2_Bar", 200, 268, 4, 52, "#F59E0B", null, 2);
addText("Met2_Title", 210, 276, "PERLU APPROVAL", 8, "#94A3B8", "Bold");
addText("Met2_Val", 210, 290, "5 Permintaan", 14, "#FBBF24", "Bold");
addText("Met2_Sub", 210, 308, "2 status urgent", 8, "#F59E0B");

// Card 3: Siap Kirim
addRect("Met3_Bg", 16, 326, 174, 52, "#1E293B", "#334155", 8);
addRect("Met3_Bar", 16, 326, 4, 52, "#6366F1", null, 2);
addText("Met3_Title", 26, 334, "SURAT JALAN (DO)", 8, "#94A3B8", "Bold");
addText("Met3_Val", 26, 348, "12 Siap Kirim", 14, "#A5B4FC", "Bold");
addText("Met3_Sub", 26, 366, "4 armada jalan", 8, "#94A3B8");

// Card 4: Stok Kritis
addRect("Met4_Bg", 200, 326, 174, 52, "#1E293B", "#334155", 8);
addRect("Met4_Bar", 200, 326, 4, 52, "#EF4444", null, 2);
addText("Met4_Title", 210, 334, "STOK KRITIS", 8, "#94A3B8", "Bold");
addText("Met4_Val", 210, 348, "8 Item Kritis", 14, "#F87171", "Bold");
addText("Met4_Sub", 210, 366, "< safety stock", 8, "#EF4444");

// ==========================================
// 7. INVENTORY LIST (MOBILE CARDS) (y: 388 to 760)
// ==========================================
addText("List_Section_Title", 16, 388, "Daftar Inventaris Utama", 12, "#FFFFFF", "Bold");
addText("List_Count_Info", 306, 389, "Lihat Semua ▾", 10, "#38BDF8");

// Mobile Search Box
addRect("Search_Mobile_Bg", 16, 408, 358, 34, "#1E293B", "#334155", 8);
addText("Search_Mobile_Txt", 28, 418, "🔍  Cari SKU, nama barang, barcode...", 10, "#64748B");

// Filter Chips
addRect("Chip1_Bg", 16, 448, 64, 24, "#2563EB", null, 12);
addText("Chip1_Txt", 28, 454, "Semua", 9, "#FFFFFF", "Bold");

addRect("Chip2_Bg", 86, 448, 80, 24, "#7F1D1D", "#DC2626", 12);
addText("Chip2_Txt", 96, 454, "Kritis (8)", 9, "#FCA5A5", "Bold");

addRect("Chip3_Bg", 172, 448, 96, 24, "#1E293B", "#334155", 12);
addText("Chip3_Txt", 182, 454, "Low Stock (14)", 9, "#CBD5E1");

addRect("Chip4_Bg", 274, 448, 98, 24, "#1E293B", "#334155", 12);
addText("Chip4_Txt", 284, 454, "Gudang Pusat ▾", 9, "#CBD5E1");

// Mobile Inventory Cards (Touch-friendly cards)
const mobileCards = [
  {
    sku: "SKU-ELC-001",
    name: "Kabel UTP Cat6 305m Belden",
    loc: "Gudang Pusat (Area A-02)",
    stock: "154 Roll",
    safety: "20 Roll",
    badge: "IN STOCK",
    badgeBg: "#064E3B",
    badgeBorder: "#059669",
    badgeColor: "#34D399",
    act1: "+ Inbound",
    act2: "Transfer"
  },
  {
    sku: "SKU-ELC-002",
    name: "Router Gigabit Dual Band Archer C6",
    loc: "Gudang Pusat (Area B-01)",
    stock: "4 Unit",
    safety: "15 Unit",
    badge: "LOW STOCK",
    badgeBg: "#78350F",
    badgeBorder: "#D97706",
    badgeColor: "#FCD34D",
    act1: "+ Inbound",
    act2: "Minta DO"
  },
  {
    sku: "SKU-ATK-001",
    name: "Kertas HVS A4 80gr PaperOne Box",
    loc: "Toko Cabang 1 - Mall A",
    stock: "8 Rim",
    safety: "50 Rim",
    badge: "CRITICAL",
    badgeBg: "#7F1D1D",
    badgeBorder: "#DC2626",
    badgeColor: "#FCA5A5",
    act1: "Minta Kirim",
    act2: "Detail"
  }
];

let cardY = 480;
mobileCards.forEach((c, idx) => {
  addRect(`MobCard_Bg_${idx}`, 16, cardY, 358, 86, "#1E293B", "#334155", 10);

  // Top line: SKU & Badge
  addText(`MobCard_SKU_${idx}`, 26, cardY + 12, c.sku, 10, "#38BDF8", "Bold");
  addRect(`MobCard_Badge_Bg_${idx}`, 286, cardY + 8, 78, 20, c.badgeBg, c.badgeBorder, 10);
  addText(`MobCard_Badge_Txt_${idx}`, 296, cardY + 13, c.badge, 8, c.badgeColor, "Bold");

  // Name
  addText(`MobCard_Name_${idx}`, 26, cardY + 28, c.name, 11, "#F8FAFC", "Bold");

  // Location & Safety Stock
  addText(`MobCard_Loc_${idx}`, 26, cardY + 44, `📍 ${c.loc}`, 9, "#94A3B8");
  addText(`MobCard_Safety_${idx}`, 26, cardY + 58, `Safety: ${c.safety}`, 9, "#64748B");

  // Stock Available (Big)
  addText(`MobCard_Stock_${idx}`, 170, cardY + 56, `Stok: ${c.stock}`, 11, c.badgeColor, "Bold");

  // Action Buttons
  addRect(`MobCard_Btn1_${idx}`, 254, cardY + 50, 56, 24, "#2563EB", null, 6);
  addText(`MobCard_Btn1_Txt_${idx}`, 260, cardY + 56, c.act1, 8, "#FFFFFF", "Bold");

  addRect(`MobCard_Btn2_${idx}`, 316, cardY + 50, 48, 24, "#334155", null, 6);
  addText(`MobCard_Btn2_Txt_${idx}`, 324, cardY + 56, c.act2, 8, "#CBD5E1");

  cardY += 94;
});

// ==========================================
// 8. MOBILE BOTTOM NAVIGATION BAR (y: 770 to 844)
// ==========================================
addRect("BottomNav_Bg", 0, 770, 390, 74, "#111827", "#1E293B");

// 4 Bottom Tabs
const bTabs = [
  { icon: "📊", label: "Beranda", active: true, badge: null },
  { icon: "🔄", label: "Proses", active: false, badge: "5", badgeBg: "#F59E0B" },
  { icon: "📦", label: "Barang", active: false, badge: null },
  { icon: "🤝", label: "Terima", active: false, badge: "3", badgeBg: "#10B981" }
];

bTabs.forEach((tab, i) => {
  const tabX = 18 + i * 90;
  if (tab.active) {
    addText(`BTab_Icon_${i}`, tabX + 30, 782, tab.icon, 16, "#38BDF8");
    addText(`BTab_Txt_${i}`, tabX + 24, 804, tab.label, 9, "#38BDF8", "Bold");
  } else {
    addText(`BTab_Icon_${i}`, tabX + 30, 782, tab.icon, 16, "#94A3B8");
    addText(`BTab_Txt_${i}`, tabX + 24, 804, tab.label, 9, "#94A3B8");
    if (tab.badge) {
      addRect(`BTab_Badge_${i}`, tabX + 44, 776, 14, 14, tab.badgeBg, null, 7);
      addText(`BTab_Badge_Txt_${i}`, tabX + 48, 778, tab.badge, 8, "#FFFFFF", "Bold");
    }
  }
});

// Home indicator bar at bottom
addRect("Home_Indicator", 128, 830, 134, 4, "#64748B", null, 2);

fs.writeFileSync('commands-mobile.json', JSON.stringify(commands, null, 2));
console.log(`Generated ${commands.length} mobile commands.`);
