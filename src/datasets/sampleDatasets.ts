// Predefined Sample Datasets for Market Basket Lab

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultSupport: number;
  defaultConfidence: number;
  defaultLift: number;
  csvContent: string;
}

// 1. Classic Textbook Dataset
const TEXTBOOK_CSV = `Order_ID,Item
T100,I1
T100,I2
T100,I5
T200,I2
T200,I4
T300,I2
T300,I3
T400,I1
T400,I2
T400,I4
T500,I1
T500,I3
T600,I2
T600,I3
T700,I1
T700,I3
T800,I1
T800,I2
T800,I3
T800,I5
T900,I1
T900,I2
T900,I3`;

// Seeded PRNG (mulberry32): sample datasets must be identical on every load so that results,
// pinned rules and tests are reproducible (Math.random made every page load mine different rules).
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generator for synthetic realistic transaction datasets
function generateSupermarketCSV(): string {
  const rand = createRng(8919);
  const items = [
    '鮮奶', '全麥吐司', '雞蛋', '無鹽奶油', '研磨咖啡豆',
    '台灣金牌啤酒', '樂事洋芋片', '統一肉燥泡麵', '洗碗精', '抽取式衛生紙',
    '香蕉', '富士蘋果', '義大利麵條', '蕃茄肉醬罐頭', '起司片',
    '茶葉蛋', '可口可樂', '微波牛肉便當', '堅果綜合包', '優格'
  ];

  const lines = ['OrderID,Product'];
  const totalOrders = 800;

  // Patterns with probabilities
  for (let i = 1; i <= totalOrders; i++) {
    const orderId = `ORD-${String(i).padStart(5, '0')}`;
    const basket = new Set<string>();

    // Rule pattern 1: Breakfast bundle (鮮奶 + 吐司 + 雞蛋)
    if (rand() < 0.35) {
      basket.add('鮮奶');
      basket.add('全麥吐司');
      if (rand() < 0.65) basket.add('雞蛋');
      if (rand() < 0.4) basket.add('無鹽奶油');
    }

    // Rule pattern 2: Beer & Chips (啤酒 + 洋芋片)
    if (rand() < 0.28) {
      basket.add('台灣金牌啤酒');
      basket.add('樂事洋芋片');
      if (rand() < 0.45) basket.add('可口可樂');
      if (rand() < 0.3) basket.add('統一肉燥泡麵');
    }

    // Rule pattern 3: Italian dinner (義大利麵條 + 蕃茄肉醬罐頭 + 起司片)
    if (rand() < 0.22) {
      basket.add('義大利麵條');
      basket.add('蕃茄肉醬罐頭');
      if (rand() < 0.7) basket.add('起司片');
    }

    // Rule pattern 4: Coffee lover (研磨咖啡豆 + 鮮奶)
    if (rand() < 0.25) {
      basket.add('研磨咖啡豆');
      if (rand() < 0.75) basket.add('鮮奶');
    }

    // Rule pattern 5: Daily household (抽取式衛生紙 + 洗碗精)
    if (rand() < 0.2) {
      basket.add('抽取式衛生紙');
      if (rand() < 0.5) basket.add('洗碗精');
    }

    // Add 1-2 random noise items
    const randomCount = Math.floor(rand() * 2) + 1;
    for (let r = 0; r < randomCount; r++) {
      const randomItem = items[Math.floor(rand() * items.length)];
      basket.add(randomItem);
    }

    for (const item of basket) {
      lines.push(`${orderId},${item}`);
    }
  }

  return lines.join('\n');
}

function generateTechStoreCSV(): string {
  const rand = createRng(16838);
  const lines = ['InvoiceNo,ItemDescription'];
  const totalOrders = 600;

  for (let i = 1; i <= totalOrders; i++) {
    const inv = `INV-2026-${String(i).padStart(4, '0')}`;
    const basket = new Set<string>();

    // Bundle 1: iPhone Upgrade Pack
    if (rand() < 0.38) {
      basket.add('iPhone 16 Pro');
      basket.add('滿版防窺玻璃貼');
      if (rand() < 0.8) basket.add('犀牛盾耐衝擊防摔殼');
      if (rand() < 0.6) basket.add('35W雙孔Type-C快充頭');
      if (rand() < 0.45) basket.add('MagSafe磁吸行動電源');
    }

    // Bundle 2: Audio & Watch
    if (rand() < 0.26) {
      basket.add('AirPods Pro 2');
      if (rand() < 0.7) basket.add('AirPods防摔矽膠套');
      if (rand() < 0.35) basket.add('Apple Watch S10');
    }

    // Bundle 3: Work From Home Desk Setup
    if (rand() < 0.22) {
      basket.add('4KType-C外接螢幕');
      basket.add('人體工學垂直滑鼠');
      if (rand() < 0.6) basket.add('多合一擴充底座Hub');
      if (rand() < 0.4) basket.add('鋁合金筆電支架');
    }

    // Bundle 4: Gaming Setup
    if (rand() < 0.18) {
      basket.add('RGB機械式鍵盤');
      basket.add('電競無線滑鼠');
      if (rand() < 0.75) basket.add('加大防滑滑鼠墊');
    }

    // Noise
    const misc = ['編織高速充電線', '螢幕擦拭布', '整線束線帶', '鏡頭保護貼'];
    if (rand() < 0.3) {
      basket.add(misc[Math.floor(rand() * misc.length)]);
    }

    // Ensure order is not empty
    if (basket.size === 0) {
      basket.add('編織高速充電線');
    }

    for (const item of basket) {
      lines.push(`${inv},${item}`);
    }
  }

  return lines.join('\n');
}

function generateCafeCSV(): string {
  const rand = createRng(24757);
  const lines = ['TicketID,MenuItem'];
  const totalOrders = 500;

  for (let i = 1; i <= totalOrders; i++) {
    const tid = `TKT-${String(i).padStart(4, '0')}`;
    const basket = new Set<string>();

    // Combo 1: Afternoon Tea - Cinnamon Roll & Latte
    if (rand() < 0.32) {
      basket.add('原味厚焙拿鐵');
      basket.add('焦糖核桃肉桂捲');
    }

    // Combo 2: Boba Milk Tea & Toast
    if (rand() < 0.36) {
      basket.add('黑糖珍珠鮮奶');
      if (rand() < 0.65) basket.add('現烤奶酥厚片');
      if (rand() < 0.4) basket.add('起司火腿可頌');
    }

    // Combo 3: Americano & Basque Cheesecake
    if (rand() < 0.24) {
      basket.add('經典美式黑咖啡');
      basket.add('西班牙巴斯克乳酪');
    }

    // Combo 4: Fresh Fruit Tea & Scone
    if (rand() < 0.22) {
      basket.add('鮮採水果茶');
      basket.add('原味蔓越莓司康');
      if (rand() < 0.5) basket.add('法式檸檬塔');
    }

    // Noise
    const noise = ['宇治抹茶歐蕾', '鐵觀音奶茶', '生巧克力布朗尼', '法式千層蛋糕'];
    if (rand() < 0.3) {
      basket.add(noise[Math.floor(rand() * noise.length)]);
    }

    if (basket.size === 0) {
      basket.add('經典美式黑咖啡');
    }

    for (const item of basket) {
      lines.push(`${tid},${item}`);
    }
  }

  return lines.join('\n');
}

function generateSkincareCSV(): string {
  const rand = createRng(32676);
  const lines = ['Transaction_Code,Item_Name'];
  const totalOrders = 450;

  for (let i = 1; i <= totalOrders; i++) {
    const code = `TXN-SKIN-${String(i).padStart(4, '0')}`;
    const basket = new Set<string>();

    // Routine 1: Hydration routine
    if (rand() < 0.35) {
      basket.add('玻尿酸保濕精華');
      basket.add('深層保濕面膜');
      if (rand() < 0.6) basket.add('角鯊烷修護精華油');
    }

    // Routine 2: Cleansing routine
    if (rand() < 0.32) {
      basket.add('溫和胺基酸洗面乳');
      basket.add('深層潔膚卸妝水');
      if (rand() < 0.7) basket.add('純棉無絮化妝棉');
    }

    // Routine 3: Sun protection & makeup
    if (rand() < 0.28) {
      basket.add('清爽無油防曬乳');
      basket.add('控油定妝蜜粉');
      if (rand() < 0.55) basket.add('水潤光澤氣墊粉餅');
    }

    // Routine 4: Anti-aging
    if (rand() < 0.2) {
      basket.add('多胜肽緊緻眼霜');
      basket.add('A醇抗老修護霜');
    }

    // Noise
    const noise = ['舒緩蘆薈保濕膠', '護手霜', '水楊酸溫和棉片', '潤色護唇膏'];
    if (rand() < 0.25) {
      basket.add(noise[Math.floor(rand() * noise.length)]);
    }

    if (basket.size === 0) {
      basket.add('溫和胺基酸洗面乳');
    }

    for (const item of basket) {
      lines.push(`${code},${item}`);
    }
  }

  return lines.join('\n');
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'supermarket',
    name: '全聯/生鮮超市生活雜貨 (800 筆訂單)',
    description: '包含鮮奶、吐司、雞蛋、啤酒洋芋片、義大利麵等經典零售日常共購模式。',
    category: '零售量販',
    defaultSupport: 0.08,
    defaultConfidence: 0.4,
    defaultLift: 1.2,
    csvContent: generateSupermarketCSV()
  },
  {
    id: 'tech',
    name: 'Apple & 3C 數位周邊配件 (600 筆訂單)',
    description: '手機、防摔殼、保護貼、快充頭、無線耳機與遠端辦公桌搭套組。',
    category: '3C 數位',
    defaultSupport: 0.08,
    defaultConfidence: 0.45,
    defaultLift: 1.3,
    csvContent: generateTechStoreCSV()
  },
  {
    id: 'cafe',
    name: '精品下午茶咖啡館 (500 筆訂單)',
    description: '拿鐵配肉桂捲、珍珠奶茶配厚片、黑咖啡配巴斯克乳酪蛋糕之手搖甜點組合。',
    category: '餐飲咖啡',
    defaultSupport: 0.08,
    defaultConfidence: 0.45,
    defaultLift: 1.3,
    csvContent: generateCafeCSV()
  },
  {
    id: 'skincare',
    name: '美妝護膚藥妝保養品 (450 筆訂單)',
    description: '保濕精華、卸妝水化妝棉、防曬蜜粉與抗老眼霜等保養日常搭售組合。',
    category: '美妝藥妝',
    defaultSupport: 0.08,
    defaultConfidence: 0.45,
    defaultLift: 1.3,
    csvContent: generateSkincareCSV()
  },
  {
    id: 'textbook',
    name: '經典教科書驗證題 (Agrawal 9 筆基準資料)',
    description: '資料探勘領域最經典的 9 筆基準題，數值 100% 可手工推導驗證支持度與提升度。',
    category: '教學基準',
    defaultSupport: 0.22,
    defaultConfidence: 0.5,
    defaultLift: 1.0,
    csvContent: TEXTBOOK_CSV
  }
];
