import type { Locale } from '../i18n/locale-context';

export type ProductCategoryId = 'all' | 'academic' | 'tech' | 'food' | 'apparel';

export interface ProductCategory {
  id: ProductCategoryId;
  label: Record<Locale, string>;
}

export interface DemoShop {
  slug: string;
  isDemoData: true;
  name: string;
  categoryId: Exclude<ProductCategoryId, 'all'>;
  categoryLabel: Record<Locale, string>;
  image: string;
  tagline: Record<Locale, string>;
  description: Record<Locale, string>;
  pickupLocation: Record<Locale, string>;
  verificationNote: Record<Locale, string>;
}

export interface DemoProduct {
  id: string;
  isDemoData: true;
  name: Record<Locale, string>;
  categoryId: Exclude<ProductCategoryId, 'all'>;
  categoryLabel: Record<Locale, string>;
  priceTzs: number;
  shopSlug: string;
  shopName: string;
  image: string;
  availability: Record<Locale, string>;
  fulfilmentNote: Record<Locale, string>;
  summary: Record<Locale, string>;
  specs: Record<Locale, string[]>;
}

export function formatTzs(amount: number): string {
  return `TZS ${amount.toLocaleString('en-US')}`;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'all',
    label: { en: 'All products', sw: 'Bidhaa zote' },
  },
  {
    id: 'academic',
    label: { en: 'Academic & Stationery', sw: 'Vifaa vya Masomo' },
  },
  {
    id: 'tech',
    label: { en: 'Tech & Study Gear', sw: 'Teknolojia & Taa' },
  },
  {
    id: 'food',
    label: { en: 'Bakes & Refreshments', sw: 'Vitafunwa & Vinywaji' },
  },
  {
    id: 'apparel',
    label: { en: 'Apparel & Carry', sw: 'Mavazi & Mikoba' },
  },
];

/**
 * Sample student-owned shops separated from production backend data.
 * Displayed with transparent sample markers until Seller & Catalogue APIs are populated.
 */
export const DEMO_SHOPS: DemoShop[] = [
  {
    slug: 'posta-academic-supply',
    isDemoData: true,
    name: 'Posta Academic Supply',
    categoryId: 'academic',
    categoryLabel: { en: 'Academic & Stationery', sw: 'Vifaa vya Masomo' },
    image: '/images/shops/shop-academic.svg',
    tagline: {
      en: 'Non-programmable scientific calculators, ledger notebooks, and exam stationery.',
      sw: 'Vikokotoo vya kisayansi, madaftari ya uhasibu na vifaa vya mitihani.',
    },
    description: {
      en: 'Curated stationery and quantitative study tools tailored for Accountancy, Banking, Finance, and Insurance coursework at IFM Main Campus.',
      sw: 'Vifaa vya masomo vilivyochaguliwa mahsusi kwa wanafunzi wa Uhasibu, Benki, Fedha na Bima katika Kampasi Kuu ya IFM.',
    },
    pickupLocation: {
      en: 'Campus pickup: IFM Main Campus courtyard (Shaaban Robert St)',
      sw: 'Mahali pa kuchukua: Kampasi Kuu ya IFM (Mtaa wa Shaaban Robert)',
    },
    verificationNote: {
      en: 'Sample storefront preview · Live seller badges require admin review',
      sw: 'Mfano wa duka · Beji rasmi hutolewa baada ya uhakiki wa msimamizi',
    },
  },
  {
    slug: 'swahili-kitchen-bakes',
    isDemoData: true,
    name: 'Swahili Kitchen & Bakes',
    categoryId: 'food',
    categoryLabel: { en: 'Bakes & Refreshments', sw: 'Vitafunwa & Vinywaji' },
    image: '/images/shops/shop-bakery.svg',
    tagline: {
      en: 'Small-batch cardamom mandazi boxes and cold-pressed hibiscus & baobab drinks.',
      sw: 'Mandazi ya iliki na vinywaji baridi vya rozella na ubuyu.',
    },
    description: {
      en: 'Prepared fresh in the morning for break-time pickup between lectures or afternoon study sessions around Posta and hostel blocks.',
      sw: 'Huandaliwa asubuhi kwa ajili ya mapumziko kati ya vipindi vya darasa au wakati wa kujisomea mchana.',
    },
    pickupLocation: {
      en: 'Campus pickup: Morning & midday lecture breaks',
      sw: 'Mahali pa kuchukua: Wakati wa mapumziko ya vipindi',
    },
    verificationNote: {
      en: 'Sample storefront preview · Live seller badges require admin review',
      sw: 'Mfano wa duka · Beji rasmi hutolewa baada ya uhakiki wa msimamizi',
    },
  },
  {
    slug: 'block-b-tech-gear',
    isDemoData: true,
    name: 'Block B Tech & Study Gear',
    categoryId: 'tech',
    categoryLabel: { en: 'Tech & Study Gear', sw: 'Teknolojia & Taa' },
    image: '/images/shops/shop-tech.svg',
    tagline: {
      en: 'High-capacity power banks, rechargeable study lamps, and durable USB-C cables.',
      sw: 'Power bank zenye uwezo mkubwa, taa za kujisomea zinazochajiwa na nyaya imara.',
    },
    description: {
      en: 'Practical study hardware tested for long library sessions and hostel evenings when wall sockets are scarce.',
      sw: 'Vifaa muhimu vya kusomea maktaba na hosteli wakati umeme au soketi za ukutani zinapokuwa chache.',
    },
    pickupLocation: {
      en: 'Campus pickup: IFM Library entrance or seller-arranged delivery',
      sw: 'Mahali pa kuchukua: Lango la Maktaba ya IFM au kuletewa',
    },
    verificationNote: {
      en: 'Sample storefront preview · Live seller badges require admin review',
      sw: 'Mfano wa duka · Beji rasmi hutolewa baada ya uhakiki wa msimamizi',
    },
  },
  {
    slug: 'dar-campus-carry',
    isDemoData: true,
    name: 'Dar Campus Carry & Thrift',
    categoryId: 'apparel',
    categoryLabel: { en: 'Apparel & Carry', sw: 'Mavazi & Mikoba' },
    image: '/images/shops/shop-apparel.svg',
    tagline: {
      en: 'Heavyweight canvas laptop totes and steamed, presentation-ready Oxford shirts.',
      sw: 'Mikoba imara ya kompyuta mpakato na mashati nadhifu kwa ajili ya uwasilishaji darasani.',
    },
    description: {
      en: 'Everyday bags that fit a 15-inch laptop and A4 folders, alongside clean, inspected shirts for seminar presentations.',
      sw: 'Mikoba inayobeba laptop na madaftari ya A4 pamoja na mashati safi yaliyokaguliwa kwa ajili ya semina.',
    },
    pickupLocation: {
      en: 'Campus pickup: IFM Main Campus or Posta area',
      sw: 'Mahali pa kuchukua: Kampasi Kuu ya IFM au eneo la Posta',
    },
    verificationNote: {
      en: 'Sample storefront preview · Live seller badges require admin review',
      sw: 'Mfano wa duka · Beji rasmi hutolewa baada ya uhakiki wa msimamizi',
    },
  },
];

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'casio-fx-991ex-calculator',
    isDemoData: true,
    name: {
      en: 'Scientific Calculator (Non-Programmable ClassWiz)',
      sw: 'Kikokotoo cha Kisayansi (ClassWiz Isiyopangwa)',
    },
    categoryId: 'academic',
    categoryLabel: { en: 'Academic & Stationery', sw: 'Vifaa vya Masomo' },
    priceTzs: 45000,
    shopSlug: 'posta-academic-supply',
    shopName: 'Posta Academic Supply',
    image: '/images/products/calc-fx991ex.svg',
    availability: {
      en: 'Available · Campus pickup',
      sw: 'Inapatikana · Kuchukua chuoni',
    },
    fulfilmentNote: {
      en: 'Handover at IFM Main Campus courtyard between lectures.',
      sw: 'Kukabidhiwa Kampasi Kuu ya IFM kati ya vipindi vya darasa.',
    },
    summary: {
      en: '552-function non-programmable scientific calculator suitable for quantitative finance, statistics, and accounting coursework.',
      sw: 'Kikokotoo chenye uwezo wa mahesabu 552 kinachofaa kwa masomo ya uhasibu, takwimu na fedha bila kukiuka taratibu za chumba cha mtihani.',
    },
    specs: {
      en: [
        'Dual solar and button-cell power with hard slide-on protective case',
        'Natural textbook display for matrices, integrals, and statistical regressions',
        'Non-programmable model compliant with standard university examination rules',
      ],
      sw: [
        'Inatumia mwanga wa jua na betri pamoja na kifuniko kigumu cha ulinzi',
        'Inaonyesha fomula za mahesabu na takwimu kwa mpangilio wa kitabu',
        'Inaruhusiwa kwenye vyumba vya mitihani ya chuo',
      ],
    },
  },
  {
    id: 'cardamom-mandazi-box-12',
    isDemoData: true,
    name: {
      en: 'Fresh Cardamom Mandazi Box (12 Pieces)',
      sw: 'Kisanduku cha Mandazi ya Iliki (Vipande 12)',
    },
    categoryId: 'food',
    categoryLabel: { en: 'Bakes & Refreshments', sw: 'Vitafunwa & Vinywaji' },
    priceTzs: 12000,
    shopSlug: 'swahili-kitchen-bakes',
    shopName: 'Swahili Kitchen & Bakes',
    image: '/images/products/mandazi-box.svg',
    availability: {
      en: 'Pre-order for morning break',
      sw: 'Agiza mapema kwa mapumziko ya asubuhi',
    },
    fulfilmentNote: {
      en: 'Campus pickup during 10:00 AM and 1:00 PM lecture intervals.',
      sw: 'Kuchukua chuoni saa 4:00 asubuhi au saa 7:00 mchana.',
    },
    summary: {
      en: 'Soft coconut-milk and freshly ground green cardamom mandazi packed in a breathable kraft box for study groups or hostel sharing.',
      sw: 'Mandazi laini yaliyopikwa kwa tui la nazi na iliki halisi, yakiwa kwenye kisanduku safi kwa ajili ya kikundi cha masomo.',
    },
    specs: {
      en: [
        '12 medium-large pieces baked the same morning',
        'Made with coconut milk, wheat flour, and whole ground cardamom',
        'Sealed kraft box with parchment liner',
      ],
      sw: [
        'Vipande 12 vilivyokaangwa asubuhi hiyo hiyo',
        'Imepikwa kwa tui la nazi na iliki yenye harufu nzuri',
        'Imefungashwa kwenye kisanduku safi cha karatasi ngumu',
      ],
    },
  },
  {
    id: 'usb-c-power-bank-20000',
    isDemoData: true,
    name: {
      en: '20,000mAh Fast-Charge USB-C Power Bank',
      sw: 'Power Bank ya 20,000mAh yenye USB-C Fast Charge',
    },
    categoryId: 'tech',
    categoryLabel: { en: 'Tech & Study Gear', sw: 'Teknolojia & Taa' },
    priceTzs: 65000,
    shopSlug: 'block-b-tech-gear',
    shopName: 'Block B Tech & Study Gear',
    image: '/images/products/powerbank-20k.svg',
    availability: {
      en: 'Available · Campus pickup or delivery',
      sw: 'Inapatikana · Chuoni au kuletewa',
    },
    fulfilmentNote: {
      en: 'Includes braided USB-C to USB-C cable; inspect on handover.',
      sw: 'Inakuja na waya imara wa USB-C; unakagua wakati wa kupokea.',
    },
    summary: {
      en: 'High-density portable battery with digital percentage readout, two USB-A ports, and bidirectional USB-C PD fast charging.',
      sw: 'Betri ya akiba yenye kioo cha kuonyesha asilimia ya chaji na uwezo wa kuchaji simu haraka mara kadhaa.',
    },
    specs: {
      en: [
        '20,000mAh capacity (charges most smartphones 3.5 to 4 times)',
        'LED digital display showing exact remaining battery percentage',
        'Includes 60cm braided USB-C fast-charge cable',
      ],
      sw: [
        'Uwezo wa 20,000mAh (huchaji simu mara 3 hadi 4)',
        'Kioo cha kidijitali kinachoonyesha kiwango cha chaji kilichobaki',
        'Inajumuisha waya imara wa USB-C',
      ],
    },
  },
  {
    id: 'ifrs-accounting-ledger-set',
    isDemoData: true,
    name: {
      en: 'Financial Accounting A4 Grid Notebook & Tab Set',
      sw: 'Daftari la Uhasibu (A4) na Vibandiko vya Kuweka Alama',
    },
    categoryId: 'academic',
    categoryLabel: { en: 'Academic & Stationery', sw: 'Vifaa vya Masomo' },
    priceTzs: 18500,
    shopSlug: 'posta-academic-supply',
    shopName: 'Posta Academic Supply',
    image: '/images/products/accounting-guide.svg',
    availability: {
      en: 'Available · Campus pickup',
      sw: 'Inapatikana · Kuchukua chuoni',
    },
    fulfilmentNote: {
      en: 'Same-day pickup at IFM Main Campus.',
      sw: 'Kuchukua siku hiyo hiyo Kampasi Kuu ya IFM.',
    },
    summary: {
      en: 'Hardbound A4 accounting & quantitative grid notebook paired with colour-coded repositionable index tabs and a 0.5mm fineliner.',
      sw: 'Daftari gumu la A4 lenye mistari ya mahesabu na uhasibu pamoja na vibandiko vya rangi na kalamu.',
    },
    specs: {
      en: [
        '192 numbered pages of 120gsm bleed-resistant paper',
        'Includes 120 colour-coded index flags for IFRS/tax references',
        'Lay-flat sewn binding built for lecture halls and library desks',
      ],
      sw: [
        'Kurasa 192 zenye namba na karatasi nzito isiyopitisha wino',
        'Vibandiko 120 vya kuwekea alama mada muhimu za masomo',
        'Jalada imara linalofunguka vizuri mezani',
      ],
    },
  },
  {
    id: 'heavyweight-canvas-campus-tote',
    isDemoData: true,
    name: {
      en: 'Heavyweight Canvas Laptop Tote (Fits 15" Laptop)',
      sw: 'Mkoba Imara wa Turubai (Unatosha Laptop ya Inchi 15)',
    },
    categoryId: 'apparel',
    categoryLabel: { en: 'Apparel & Carry', sw: 'Mavazi & Mikoba' },
    priceTzs: 28000,
    shopSlug: 'dar-campus-carry',
    shopName: 'Dar Campus Carry & Thrift',
    image: '/images/products/canvas-tote.svg',
    availability: {
      en: 'Available · Campus pickup',
      sw: 'Inapatikana · Kuchukua chuoni',
    },
    fulfilmentNote: {
      en: 'Campus pickup around IFM or seller-arranged delivery.',
      sw: 'Kuchukua chuoni IFM au kuletewa.',
    },
    summary: {
      en: '16oz cotton canvas tote with reinforced forest-green webbing straps, internal padded laptop divider, and quick-access front pocket.',
      sw: 'Mkoba wa kitambaa kizito wenye mikanda imara, sehemu maalum ya kuweka laptop na mfuko wa mbele.',
    },
    specs: {
      en: [
        'Fits up to a 15.6-inch laptop plus A4 notebooks and water bottle',
        'Reinforced base seam and double-stitched shoulder straps',
        'Top snap closure and interior key clip',
      ],
      sw: [
        'Unabeba laptop hadi inchi 15.6 pamoja na madaftari ya A4',
        'Kitako kilichoimarishwa na mikanda iliyoshonwa mara mbili',
        'Kifungo cha juu na mfuko wa ndani wa funguo',
      ],
    },
  },
  {
    id: 'cold-pressed-rozella-baobab-pack',
    isDemoData: true,
    name: {
      en: 'Chilled Hibiscus (Rozella) & Baobab Drink Pack (3 × 350ml)',
      sw: 'Kifurushi cha Juisi ya Rozella, Ubuyu na Ukwaju (Chupa 3)',
    },
    categoryId: 'food',
    categoryLabel: { en: 'Bakes & Refreshments', sw: 'Vitafunwa & Vinywaji' },
    priceTzs: 9000,
    shopSlug: 'swahili-kitchen-bakes',
    shopName: 'Swahili Kitchen & Bakes',
    image: '/images/products/hibiscus-drink.svg',
    availability: {
      en: 'Prepared daily · Campus pickup',
      sw: 'Huandaliwa kila siku · Kuchukua chuoni',
    },
    fulfilmentNote: {
      en: 'Kept chilled in insulated cooler bags for midday campus pickup.',
      sw: 'Huhifadhiwa kwenye ubaridi kwa ajili ya kuchukua mchana chuoni.',
    },
    summary: {
      en: 'Three 350ml sealed bottles—Hibiscus & Ginger (Rozella), Cold-Pressed Baobab (Ubuyu), and Spiced Tamarind (Ukwaju)—lightly sweetened.',
      sw: 'Chupa tatu za mililita 350—Rozella yenye tangawizi, Ubuyu na Ukwaju—zilizotengenezwa kwa usafi.',
    },
    specs: {
      en: [
        '3 × 350ml tamper-evident recyclable PET bottles',
        'Brewed with natural Tanzanian hibiscus calyces, baobab pulp, and ginger',
        'No artificial colourings or preservatives',
      ],
      sw: [
        'Chupa 3 za mililita 350 zilizofungwa kwa usalama',
        'Imetengenezwa kwa rozella, ubuyu na tangawizi asilia',
        'Bila rangi wala kemikali za viwandani',
      ],
    },
  },
  {
    id: 'cotton-oxford-presentation-shirt',
    isDemoData: true,
    name: {
      en: 'Pressed Cotton Oxford Button-Down Shirt',
      sw: 'Shati la Pamba la Oxford (Kwa Uwasilishaji Darasani)',
    },
    categoryId: 'apparel',
    categoryLabel: { en: 'Apparel & Carry', sw: 'Mavazi & Mikoba' },
    priceTzs: 22000,
    shopSlug: 'dar-campus-carry',
    shopName: 'Dar Campus Carry & Thrift',
    image: '/images/products/oxford-shirt.svg',
    availability: {
      en: 'Available · Sizes S, M, L',
      sw: 'Inapatikana · Saizi S, M, L',
    },
    fulfilmentNote: {
      en: 'Washed, steamed, and packed ready for seminar presentations.',
      sw: 'Imefuliwa na kunyooshwa tayari kwa ajili ya semina darasani.',
    },
    summary: {
      en: 'Breathable 100% cotton Oxford shirt selected for Dar es Salaam weather and formal coursework presentations.',
      sw: 'Shati safi la pamba asilimia 100 linalofaa kwa hali ya hewa ya Dar es Salaam na uwasilishaji wa kazi za darasani.',
    },
    specs: {
      en: [
        '100% woven cotton Oxford cloth in pale sage/ivory tones',
        'Laundered, steam-pressed, and inspected for collar and cuff wear',
        'Exact chest and shoulder measurements listed per piece',
      ],
      sw: [
        'Kitambaa cha pamba asilimia 100 kinachopitisha hewa vizuri',
        'Imefuliwa, imenyooshwa kwa mvuke na kukaguliwa ubora',
        'Vipimo kamili vya kifua na mabega vimewekwa wazi',
      ],
    },
  },
  {
    id: 'rechargeable-led-study-lamp',
    isDemoData: true,
    name: {
      en: 'Rechargeable LED Study Desk Lamp (3 Colour Modes)',
      sw: 'Taa ya Mezani ya Kujisomea Inayochajiwa (LED)',
    },
    categoryId: 'tech',
    categoryLabel: { en: 'Tech & Study Gear', sw: 'Teknolojia & Taa' },
    priceTzs: 32000,
    shopSlug: 'block-b-tech-gear',
    shopName: 'Block B Tech & Study Gear',
    image: '/images/products/desk-lamp.svg',
    availability: {
      en: 'Available · Campus pickup or delivery',
      sw: 'Inapatikana · Chuoni au kuletewa',
    },
    fulfilmentNote: {
      en: 'USB-C rechargeable; up to 8 hours of reading light per charge.',
      sw: 'Inachajiwa kwa USB-C; huwaka hadi saa 8 kwa chaji moja.',
    },
    summary: {
      en: 'Flicker-free desk reading lamp with built-in rechargeable battery, touch dimmer, and warm/neutral/daylight colour temperatures.',
      sw: 'Taa ya mezani isiyoumiza macho yenye betri ya ndani inayodumu muda mrefu wakati wa kujisomea usiku.',
    },
    specs: {
      en: [
        'Built-in 4,000mAh lithium battery (5–8 hours runtime on medium brightness)',
        'Three colour temperatures (3000K warm, 4500K neutral, 6000K daylight)',
        'Foldable head fits easily inside a backpack',
      ],
      sw: [
        'Betri ya ndani ya 4,000mAh inayowaka saa 5 hadi 8',
        'Aina tatu za mwanga kulingana na mazingira ya kusomea',
        'Inakunja kwa urahisi kuingia kwenye begi',
      ],
    },
  },
];
