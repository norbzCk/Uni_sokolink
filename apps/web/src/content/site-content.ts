import type { Locale } from '../i18n/locale-context';

export type FaqCategory = 'Buyers' | 'Sellers' | 'Payments' | 'Delivery' | 'Safety';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  featuredOnHome?: boolean;
  question: Record<Locale, string>;
  answer: Record<Locale, string>;
}

export interface WorkflowStep {
  number: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export interface TrustEvidence {
  id: string;
  badge: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const contactDetails = {
  email: 'hello@sokolink.co.tz',
  whatsappDisplay: 'To be announced before launch',
  campusArea: 'IFM Main Campus community · Shaaban Robert St, Posta, Dar es Salaam',
} as const;

export const buyerSteps: WorkflowStep[] = [
  {
    number: '01',
    title: {
      en: 'Discover products and student-owned shops',
      sw: 'Gundua bidhaa na maduka ya wanafunzi',
    },
    description: {
      en: 'Browse structured product listings by category or open student-owned storefronts directly—with transparent prices in TZS and clear item details instead of scattered status updates.',
      sw: 'Tazama orodha ya bidhaa kwa kategoria au fungua maduka ya wanafunzi moja kwa moja—ukiwa na bei zilizo wazi kwa TZS badala ya kutafuta kwenye status za WhatsApp.',
    },
  },
  {
    number: '02',
    title: {
      en: 'Place an order and follow the purchasing process',
      sw: 'Weka oda na fuata mchakato wa manunuzi',
    },
    description: {
      en: 'Order through a structured checkout flow designed to keep item selection, stock reservation, and order status in one record for both buyer and seller.',
      sw: 'Weka oda kupitia mfumo unaohifadhi kumbukumbu za bidhaa ulizochagua na hatua iliyofikia kwa mnunuzi na muuzaji.',
    },
  },
  {
    number: '03',
    title: {
      en: 'Arrange campus pickup or delivery',
      sw: 'Panga kuchukua chuoni au usafirishaji',
    },
    description: {
      en: 'Collect your order at an agreed IFM campus pickup point between lectures or use available delivery options according to the seller’s fulfilment settings.',
      sw: 'Chukua oda yako katika eneo mlilokubaliana chuoni IFM kati ya vipindi vya darasa au tumia huduma ya usafirishaji inayopatikana kwenye duka husika.',
    },
  },
];

export const sellerSteps: WorkflowStep[] = [
  {
    number: '01',
    title: {
      en: 'Register your SokoLink customer account',
      sw: 'Fungua akaunti yako ya SokoLink',
    },
    description: {
      en: 'Every student entrepreneur starts with a verified SokoLink account using their full name, email address, and phone number.',
      sw: 'Kila mwanafunzi mjasiriamali huanza kwa kufungua akaunti yenye jina kamili, barua pepe na namba ya simu iliyohakikiwa.',
    },
  },
  {
    number: '02',
    title: {
      en: 'Submit your seller application for review',
      sw: 'Wasilisha ombi la uuzaji kwa uhakiki',
    },
    description: {
      en: 'Provide your IFM student and business details. Seller access is granted only after an explicit administrator review—never automatically.',
      sw: 'Wasilisha taarifa zako za uanafunzi wa IFM na maelezo ya duka lako. Uuzaji unaruhusiwa tu baada ya uhakiki wa msimamizi.',
    },
  },
  {
    number: '03',
    title: {
      en: 'Publish products and manage campus orders',
      sw: 'Weka bidhaa na simamia oda za chuoni',
    },
    description: {
      en: 'Once approved, organize your catalogue, set prices in TZS, specify campus pickup or delivery availability, and manage incoming orders in one workspace.',
      sw: 'Ukishaidhinishwa, panga bidhaa zako, weka bei kwa TZS, bainisha utaratibu wa kuchukua chuoni na simamia oda zako sehemu moja.',
    },
  },
];

export const trustEvidenceItems: TrustEvidence[] = [
  {
    id: 'account-verification',
    badge: {
      en: 'LIVE IN FOUNDATION',
      sw: 'tayari KWENYE MFUMO',
    },
    title: {
      en: 'Verified accounts and role-based permissions',
      sw: 'Akaunti zilizohakikiwa na udhibiti wa majukumu',
    },
    description: {
      en: 'SokoLink’s identity service enforces Argon2id password hashing, email and phone verification codes, and strict role separation between customers, sellers, and administrators.',
      sw: 'Mfumo wa utambulisho wa SokoLink unahakiki barua pepe na namba ya simu pamoja na kutenganisha majukumu ya mteja, muuzaji na msimamizi.',
    },
  },
  {
    id: 'manual-seller-review',
    badge: {
      en: 'GOVERNANCE RULE',
      sw: 'KANUNI YA USALAMA',
    },
    title: {
      en: 'Manual IFM seller eligibility review',
      sw: 'Uhakiki wa wauzaji wanafunzi wa IFM kwa mkono',
    },
    description: {
      en: 'Submitting a seller application does not automatically open a storefront. A named administrator reviews student and shop information and records an auditable decision.',
      sw: 'Kutuma ombi hakufungui duka moja kwa moja. Msimamizi anakagua taarifa za mwanafunzi wa IFM kabla ya kutoa idhini ya kuuza.',
    },
  },
  {
    id: 'structured-campus-trade',
    badge: {
      en: 'CAMPUS-FIRST DESIGN',
      sw: 'IMEUNDWA KWA IFM',
    },
    title: {
      en: 'Built around real IFM campus pickup & local commerce',
      sw: 'Imezingatia mazingira halisi ya IFM Dar es Salaam',
    },
    description: {
      en: 'Instead of generic shipping assumptions, SokoLink is designed for how students actually trade at IFM—between lectures at Posta, around campus blocks, or via local delivery.',
      sw: 'Badala ya mifumo isiyoendana na mazingira yetu, SokoLink imezingatia jinsi wanafunzi wanavyouziana bidhaa chuoni IFM Posta na maeneo ya jirani.',
    },
  },
];

export const faqItems: FaqItem[] = [
  {
    id: 'what-is-sokolink',
    category: 'Buyers',
    featuredOnHome: true,
    question: {
      en: 'What is SokoLink?',
      sw: 'SokoLink ni nini?',
    },
    answer: {
      en: 'SokoLink is a student-focused marketplace initially built for students at the Institute of Finance Management (IFM) in Dar es Salaam. It connects student entrepreneurs operating their own shops with fellow students who want to discover products and order in a structured environment.',
      sw: 'SokoLink ni soko la mtandaoni lililoundwa kwa ajili ya wanafunzi wa Chuo cha Usimamizi wa Fedha (IFM) jijini Dar es Salaam. Linawaunganisha wanafunzi wenye maduka yao na wanunuzi ndani ya jumuiya ya chuo.',
    },
  },
  {
    id: 'who-can-sell',
    category: 'Sellers',
    featuredOnHome: true,
    question: {
      en: 'Who can open a shop on SokoLink?',
      sw: 'Nani anaweza kufungua duka kwenye SokoLink?',
    },
    answer: {
      en: 'Initially, active IFM students in Dar es Salaam who register a customer account, submit a seller application, and pass manual administrator review can operate a shop on SokoLink.',
      sw: 'Kwa kuanzia, wanafunzi hai wa IFM jijini Dar es Salaam wanaofungua akaunti, kuwasilisha ombi la uuzaji na kupitishwa na msimamizi ndio wanaoweza kufungua duka.',
    },
  },
  {
    id: 'who-can-buy',
    category: 'Buyers',
    featuredOnHome: false,
    question: {
      en: 'Who can buy from student shops?',
      sw: 'Nani anaweza kununua kutoka kwenye maduka ya wanafunzi?',
    },
    answer: {
      en: 'IFM students and campus community members in Dar es Salaam can browse the marketplace and create a customer account to place orders as ordering workflows open.',
      sw: 'Wanafunzi wa IFM na wanajumuiya wa chuo jijini Dar es Salaam wanaweza kutazama bidhaa na kufungua akaunti ya mteja.',
    },
  },
  {
    id: 'are-displayed-products-live',
    category: 'Buyers',
    featuredOnHome: true,
    question: {
      en: 'Are the products shown on the homepage live inventory?',
      sw: 'Je, bidhaa zinazoonekana sasa ni za moja kwa moja?',
    },
    answer: {
      en: 'The products and shops displayed in the discovery preview are clearly marked sample listings that show how student storefronts and TZS pricing work on SokoLink while the first cohort of IFM sellers is onboarded.',
      sw: 'Bidhaa na maduka yanayoonekana kwenye sehemu ya mfano yamewekewa alama wazi ili kuonyesha jinsi maduka ya wanafunzi yanavyofanya kazi wakati wauzaji wa kwanza wanaendelea kusajiliwa.',
    },
  },
  {
    id: 'how-do-i-pay',
    category: 'Payments',
    featuredOnHome: true,
    question: {
      en: 'How will payments and mobile money work?',
      sw: 'Malipo ya pesa mtandao yatafanyikaje?',
    },
    answer: {
      en: 'SokoLink’s payment architecture is built around provider-neutral mobile money integration with server-side payment verification. Final supported mobile money providers, transaction fees, and payout schedules: To be announced before launch.',
      sw: 'Mfumo wa malipo wa SokoLink umeandaliwa kuhakiki miamala ya pesa mtandao moja kwa moja. Mitandao rasmi ya malipo, ada na ratiba za malipo kwa wauzaji: To be announced before launch.',
    },
  },
  {
    id: 'how-does-delivery-or-pickup-work',
    category: 'Delivery',
    featuredOnHome: true,
    question: {
      en: 'How does campus pickup or delivery work?',
      sw: 'Utaratibu wa kuchukua chuoni au kuletewa ukoje?',
    },
    answer: {
      en: 'Orders support agreed IFM campus pickup points (such as between lectures at Main Campus) or seller-arranged delivery around Dar es Salaam. Delivery pricing and optional delivery partner rules: To be announced before launch.',
      sw: 'Oda zinaweza kuchukuliwa katika maeneo yaliyokubaliwa chuoni IFM au kusafirishwa kwa uratibu wa muuzaji. Gharama za usafirishaji: To be announced before launch.',
    },
  },
  {
    id: 'is-it-free-to-join',
    category: 'Sellers',
    featuredOnHome: false,
    question: {
      en: 'Is it free to create an account and apply as a seller?',
      sw: 'Je, kufungua akaunti na kuomba uuzaji ni bure?',
    },
    answer: {
      en: 'Creating a customer account and submitting an early seller onboarding request is free. Marketplace commission rates and settlement terms: To be announced before launch.',
      sw: 'Kufungua akaunti ya mteja na kutuma ombi la awali la uuzaji ni bure. Viwango vya kamisheni na masharti ya malipo: To be announced before launch.',
    },
  },
  {
    id: 'how-are-sellers-verified',
    category: 'Safety',
    featuredOnHome: false,
    question: {
      en: 'How are student sellers verified?',
      sw: 'Wauzaji wanafunzi wanahakikiwa vipi?',
    },
    answer: {
      en: 'Seller applications are reviewed manually by an administrator before the SELLER role is granted. If an application is incomplete, the applicant receives a reason and can correct and resubmit. Student evidence retention policy: To be announced before launch.',
      sw: 'Maombi ya uuzaji yanakaguliwa kwa mkono na msimamizi kabla ya kupewa ruhusa ya kufungua duka. Sera ya muda wa kuhifadhi nyaraka: To be announced before launch.',
    },
  },
  {
    id: 'what-if-something-goes-wrong',
    category: 'Safety',
    featuredOnHome: false,
    question: {
      en: 'What happens if there is an issue with an order?',
      sw: 'Nini kinafanyika ikiwa kuna changamoto kwenye oda?',
    },
    answer: {
      en: 'Every order and seller account on SokoLink has an auditable record rather than disappearing chat messages. Formal cancellation, refund, and dispute policies: To be announced before launch.',
      sw: 'Kila oda na muuzaji ana kumbukumbu inayofuatiliwa kwenye mfumo. Sera rasmi ya kufuta oda na marejesho ya pesa (refunds): To be announced before launch.',
    },
  },
];

export const uiCopy = {
  en: {
    nav: {
      exploreProducts: 'Explore products',
      discoverShops: 'Discover shops',
      howItWorks: 'How it works',
      faq: 'FAQ',
      signIn: 'Sign in',
      join: 'Join SokoLink',
      account: 'Account',
      languageLabel: 'English',
      switchToSw: 'Swahili',
      switchToEn: 'English',
    },
    hero: {
      badge: 'IFM Campus Marketplace · Dar es Salaam',
      headline: 'Discover great finds from fellow IFM students.',
      subheadline:
        'Explore student-owned shops, discover everyday products and shop confidently within your campus community.',
      primaryCta: 'Explore marketplace',
      secondaryCta: 'Open your shop',
      previewHeader: 'Campus Marketplace Preview',
      previewNotice: 'Sample catalogue preview',
      featuredShopLabel: 'Featured Student Storefront',
    },
    discovery: {
      eyebrow: 'Marketplace Discovery',
      heading: 'Everyday essentials from student-owned shops',
      description:
        'Browse calculators, coursework stationery, fresh campus bakes, study electronics, and everyday carry—organized by category with transparent pricing in TZS.',
      demoBanner:
        'Sample catalogue data — shown to preview marketplace browsing while the founding cohort of IFM student sellers completes onboarding.',
      searchPlaceholder: 'Search products or student shops…',
      viewProduct: 'View details',
      viewAllProducts: 'Browse full marketplace',
      noResults: 'No sample products match your filter. Try selecting another category.',
    },
    shops: {
      eyebrow: 'Student-Owned Shops',
      heading: 'Meet the student storefronts building on campus',
      description:
        'Instead of hunting through disappearing WhatsApp statuses, browse structured storefronts operated by fellow IFM students with clear pickup routines.',
      viewShop: 'View shop',
      allShopsCta: 'Explore all student shops',
    },
    howItWorks: {
      eyebrow: 'How SokoLink Works',
      heading: 'Structured commerce for buyers and student sellers',
      description:
        'Clear steps from product discovery to campus handover—backed by verified accounts and manual seller approval.',
      buyerTab: 'For Buyers (3 Steps)',
      sellerTab: 'For Student Sellers (3 Steps)',
      buyerCta: 'Learn more about buying',
      sellerCta: 'Seller onboarding guide',
    },
    trust: {
      eyebrow: 'Trust & Community',
      heading: 'Designed around the IFM community—built on verifiable rules',
      description:
        'Trust on SokoLink comes from real platform architecture and transparent governance—never inflated numbers, fake reviews, or unverified claims.',
    },
    sellerCta: {
      eyebrow: 'For Student Entrepreneurs',
      heading: 'Turn your student business into a shop everyone can discover.',
      description:
        'Replace scattered DMs and daily status reposts with a structured online storefront. Present your products clearly, set prices in TZS, and serve buyers across the IFM campus community.',
      benefits: [
        'One structured storefront link for your entire product catalogue and TZS pricing',
        'Clear campus pickup and local delivery options tailored to your lecture schedule',
        'Single SokoLink account for personal buying and—after admin approval—managing your shop',
      ],
      primaryButton: 'Become a seller',
      secondaryButton: 'Seller requirements & application',
    },
    faq: {
      eyebrow: 'Frequently Asked Questions',
      heading: 'Straightforward answers about SokoLink',
      description:
        'Everything about how the marketplace works today and what is being finalized before public transactions launch.',
      viewAllFaq: 'View full FAQ & search',
    },
    footer: {
      description:
        'A student-focused multi-vendor marketplace and business operations platform initially built for the IFM community in Dar es Salaam, Tanzania.',
      marketplaceHeading: 'Marketplace',
      buyersHeading: 'Buyer Information',
      sellersHeading: 'Seller Information',
      legalHeading: 'Legal & Contact',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      contact: 'Contact Us',
      languageHeading: 'Language',
      builtIn: 'Built in Dar es Salaam for the IFM student community.',
    },
  },
  sw: {
    nav: {
      exploreProducts: 'Bidhaa Sokoni',
      discoverShops: 'Maduka ya Wanafunzi',
      howItWorks: 'Jinsi Inavyofanya Kazi',
      faq: 'Maswali (FAQ)',
      signIn: 'Ingia',
      join: 'Jiunge na SokoLink',
      account: 'Akaunti',
      languageLabel: 'Kiswahili',
      switchToSw: 'Kiswahili',
      switchToEn: 'English',
    },
    hero: {
      badge: 'Soko la Wanafunzi wa IFM · Dar es Salaam',
      headline: 'Gundua bidhaa bora kutoka kwa wanafunzi wenzako wa IFM.',
      subheadline:
        'Tembelea maduka yanayomilikiwa na wanafunzi, pata bidhaa za kila siku na fanya manunuzi kwa uaminifu ndani ya jumuiya ya chuo chako.',
      primaryCta: 'Tembelea soko',
      secondaryCta: 'Fungua duka lako',
      previewHeader: 'Mwonekano wa Soko la Chuoni',
      previewNotice: 'Mfano wa bidhaa sokoni',
      featuredShopLabel: 'Mfano wa Duka la Mwanafunzi',
    },
    discovery: {
      eyebrow: 'Ugunduzi wa Bidhaa',
      heading: 'Bidhaa muhimu za kila siku kutoka maduka ya wanafunzi',
      description:
        'Tazama vikokotoo, madaftari ya uhasibu, vitafunwa, vifaa vya teknolojia na mikoba—kwa mpangilio wa kategoria na bei zilizo wazi kwa TZS.',
      demoBanner:
        'Bidhaa za mfano — zinaonyesha jinsi soko linavyofanya kazi wakati kundi la kwanza la wauzaji wanafunzi wa IFM linakamilisha usajili.',
      searchPlaceholder: 'Tafuta bidhaa au duka la mwanafunzi…',
      viewProduct: 'Tazama maelezo',
      viewAllProducts: 'Tazama bidhaa zote sokoni',
      noResults: 'Hakuna bidhaa za mfano zinazolingana na utafutaji wako.',
    },
    shops: {
      eyebrow: 'Maduka ya Wanafunzi',
      heading: 'Kutana na maduka ya wanafunzi yanayojengwa chuoni',
      description:
        'Badala ya kutafuta status za WhatsApp zinazopotea, tembelea maduka yaliyopangwa vizuri yanayoendeshwa na wanafunzi wenzako wa IFM.',
      viewShop: 'Fungua duka',
      allShopsCta: 'Tazama maduka yote ya wanafunzi',
    },
    howItWorks: {
      eyebrow: 'Jinsi SokoLink Inavyofanya Kazi',
      heading: 'Biashara iliyopangwa kwa wanunuzi na wauzaji wanafunzi',
      description:
        'Hatua rahisi kuanzia kutafuta bidhaa hadi kukabidhiwa chuoni—zikiungwa mkono na akaunti zilizohakikiwa.',
      buyerTab: 'Kwa Wanunuzi (Hatua 3)',
      sellerTab: 'Kwa Wauzaji Wanafunzi (Hatua 3)',
      buyerCta: 'Maelezo zaidi kwa wanunuzi',
      sellerCta: 'Mwongozo wa kuwa muuzaji',
    },
    trust: {
      eyebrow: 'Uaminifu na Jumuiya',
      heading: 'Imeundwa kwa ajili ya jumuiya ya IFM—kwa misingi ya ukweli',
      description:
        'Uaminifu ndani ya SokoLink unatokana na mfumo halisi wa utambulisho na uhakiki—bila takwimu za kutunga wala maoni ya uongo.',
    },
    sellerCta: {
      eyebrow: 'Kwa Wanafunzi Wajasiriamali',
      heading: 'Badilisha biashara yako ya chuoni kuwa duka ambalo kila mtu anaweza kulipata.',
      description:
        'Ondokana na usumbufu wa DM nyingi na kuposti status kila saa. Weka bidhaa zako kwa mpangilio, weka bei kwa TZS, na wahudumie wateja wa IFM kwa urahisi.',
      benefits: [
        'Kiungo kimoja cha duka lako lenye bidhaa zote na bei kwa TZS',
        'Utaratibu wazi wa kuchukua mzigo chuoni IFM kulingana na ratiba yako ya vipindi',
        'Akaunti moja ya SokoLink kwa manunuzi binafsi na kusimamia duka baada ya kuidhinishwa',
      ],
      primaryButton: 'Kuwa muuzaji',
      secondaryButton: 'Masharti na fomu ya muuzaji',
    },
    faq: {
      eyebrow: 'Maswali ya Mara kwa Mara',
      heading: 'Majibu ya moja kwa moja kuhusu SokoLink',
      description:
        'Kila kitu kuhusu jinsi soko linavyofanya kazi sasa na mambo yanayokamilishwa kabla ya uzinduzi rasmi.',
      viewAllFaq: 'Maswali yote & utafutaji',
    },
    footer: {
      description:
        'Soko la mtandaoni na mfumo wa uendeshaji biashara kwa wanafunzi uliojengwa ukianza na jumuiya ya IFM jijini Dar es Salaam, Tanzania.',
      marketplaceHeading: 'Soko (Marketplace)',
      buyersHeading: 'Taarifa kwa Wanunuzi',
      sellersHeading: 'Taarifa kwa Wauzaji',
      legalHeading: 'Sheria & Mawasiliano',
      privacy: 'Sera ya Faragha',
      terms: 'Masharti ya Matumizi',
      contact: 'Wasiliana Nasi',
      languageHeading: 'Lugha',
      builtIn: 'Imeundwa Dar es Salaam kwa ajili ya jumuiya ya wanafunzi wa IFM.',
    },
  },
} as const;
