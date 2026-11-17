import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const DOWNLOADS = process.env.DOWNLOADS_DIR ?? join(homedir(), 'Downloads');
const SELLER = {
  identifier: process.env.SELLER_IDENTIFIER ?? 'seller@sokolink.local',
  password: process.env.SELLER_PASSWORD ?? 'Marketplace#2026',
};
const ADMIN = {
  identifier: process.env.ADMIN_IDENTIFIER ?? 'admin@sokolink.local',
  password: process.env.ADMIN_PASSWORD ?? 'Marketplace#2026',
};

const products = [
  {
    file: 'Black sneakers.jpg',
    name: 'Black Everyday Sneakers',
    category: 'fashion-clothing',
    priceTzs: 45000,
    openingStock: 14,
    brand: 'Campus Style',
    description:
      'Clean black everyday sneakers with a cushioned sole, made for lectures, errands and long walks around campus.',
  },
  {
    file: 'CROCS.jpg',
    name: 'Classic Comfort Clogs',
    category: 'fashion-clothing',
    priceTzs: 38000,
    openingStock: 18,
    brand: 'Crocs',
    description:
      'Lightweight comfort clogs with an easy slip-on fit. Ideal for hostel life, quick errands and rainy-day campus walks.',
  },
  {
    file: 'Nike.jpg',
    name: 'Nike Sport Sneakers',
    category: 'sports-outdoors',
    priceTzs: 85000,
    openingStock: 8,
    brand: 'Nike',
    description:
      'Sporty low-top sneakers with a breathable upper and grippy outsole for training, walking and everyday wear.',
  },
  {
    file: "Litfun Women's Summer Slip On Sandal.jpg",
    name: "Litfun Women's Summer Slip-On Sandals",
    category: 'fashion-clothing',
    priceTzs: 32000,
    openingStock: 22,
    brand: 'Litfun',
    description:
      'Soft summer slip-on sandals with a flexible sole and simple straps for comfortable everyday wear in warm weather.',
  },
  {
    file: 'jpg',
    name: 'Campus Canvas Sneakers',
    category: 'fashion-clothing',
    priceTzs: 42000,
    openingStock: 16,
    brand: 'Soko Select',
    description:
      'Versatile canvas sneakers with a relaxed fit and durable stitching, easy to pair with everyday student outfits.',
  },
  {
    file: 'jpg(1)',
    name: 'Classic Low-Top Trainers',
    category: 'fashion-clothing',
    priceTzs: 48000,
    openingStock: 12,
    brand: 'Soko Select',
    description:
      'Classic low-top trainers with a padded collar and clean silhouette for casual days, campus events and weekends.',
  },
  {
    file: 'jpg(4)',
    name: 'Everyday Street Sneakers',
    category: 'fashion-clothing',
    priceTzs: 52000,
    openingStock: 10,
    brand: 'Street Campus',
    description:
      'Everyday street sneakers built for comfort and grip, with a modern shape that works with jeans, shorts or track pants.',
  },
  {
    file: 'jpg(6)',
    name: 'Comfort Walking Shoes',
    category: 'sports-outdoors',
    priceTzs: 55000,
    openingStock: 13,
    brand: 'Active Campus',
    description:
      'Supportive walking shoes with a soft footbed and stable sole for busy days moving between classes and town.',
  },
  {
    file: 'jpg(7)',
    name: 'Casual Slip-On Shoes',
    category: 'fashion-clothing',
    priceTzs: 39000,
    openingStock: 15,
    brand: 'Soko Select',
    description:
      'Easy casual slip-on shoes with a lightweight feel and simple styling for quick errands and relaxed weekends.',
  },
  {
    file: 'jpg(8)',
    name: 'Sport Runner Sneakers',
    category: 'sports-outdoors',
    priceTzs: 65000,
    openingStock: 9,
    brand: 'Active Campus',
    description:
      'Breathable runner-style sneakers with a responsive sole for gym sessions, jogging and active campus days.',
  },
  {
    file: 'jpg(9)',
    name: 'Minimal Canvas Shoes',
    category: 'fashion-clothing',
    priceTzs: 36000,
    openingStock: 20,
    brand: 'Soko Select',
    description:
      'Minimal canvas shoes with a low-profile design and comfortable lining, a simple staple for everyday outfits.',
  },
  {
    file: 'jpg(10)',
    name: 'Student Everyday Sneakers',
    category: 'fashion-clothing',
    priceTzs: 44000,
    openingStock: 17,
    brand: 'Campus Style',
    description:
      'Practical everyday sneakers with a durable upper and cushioned insole, designed for the pace of student life.',
  },
  {
    file: 'jpg(11)',
    name: 'Soft Knit Trainers',
    category: 'fashion-clothing',
    priceTzs: 47000,
    openingStock: 11,
    brand: 'Street Campus',
    description:
      'Soft knit trainers with a flexible, breathable fit and a clean look for lectures, errands and evenings out.',
  },
  {
    file: 'jpg(12)',
    name: 'Retro Court Sneakers',
    category: 'fashion-clothing',
    priceTzs: 58000,
    openingStock: 7,
    brand: 'Street Campus',
    description:
      'Retro court-inspired sneakers with a classic profile and comfortable sole for a smart-casual campus look.',
  },
  {
    file: 'jpg(13)',
    name: 'Lightweight Casual Shoes',
    category: 'fashion-clothing',
    priceTzs: 41000,
    openingStock: 19,
    brand: 'Soko Select',
    description:
      'Lightweight casual shoes with a simple slip-on feel and reliable grip for everyday movement around campus.',
  },
];

async function request(path, init = {}, token) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  const response = await fetch(API_BASE + path, { ...init, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(path + ' failed (' + response.status + '): ' + (body?.message ?? text));
  }
  return body;
}

async function login(credentials) {
  const session = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return session.accessToken;
}

function dataUrl(buffer, file) {
  const type = file.toLowerCase().endsWith('.png')
    ? 'image/png'
    : file.toLowerCase().endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';
  return 'data:' + type + ';base64,' + buffer.toString('base64');
}

const sellerToken = await login(SELLER);
const adminToken = await login(ADMIN);
const categories = await request('/catalogue/categories');
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const sellerProducts = await request('/catalogue/seller/products', {}, sellerToken);
const existing = new Set(sellerProducts.items.map((product) => product.name));

let created = 0;
let skipped = 0;

for (const definition of products) {
  if (existing.has(definition.name)) {
    console.log('skip  ' + definition.name + ' (already exists)');
    skipped += 1;
    continue;
  }
  const category = categoryBySlug.get(definition.category);
  if (!category) throw new Error('Missing category ' + definition.category);
  const buffer = await readFile(join(DOWNLOADS, definition.file));
  const product = await request(
    '/catalogue/seller/products',
    {
      method: 'POST',
      body: JSON.stringify({
        name: definition.name,
        categoryId: category.id,
        description: definition.description,
        condition: 'NEW',
        brand: definition.brand,
        unit: 'pair',
        priceTzs: definition.priceTzs,
        openingStock: definition.openingStock,
        lowStockThreshold: 3,
        specifications: [
          { name: 'Category', value: category.name },
          { name: 'Condition', value: 'New' },
          { name: 'Brand', value: definition.brand },
        ],
        images: [dataUrl(buffer, definition.file)],
      }),
    },
    sellerToken,
  );
  await request('/catalogue/seller/products/' + product.id + '/submit', { method: 'POST' }, sellerToken);
  await request('/catalogue/admin/products/' + product.id + '/approve', { method: 'POST' }, adminToken);
  created += 1;
  console.log('seed  ' + definition.name + ' -> /p/' + product.slug);
}

console.log('\nSeeded ' + created + ' products, skipped ' + skipped + '.');
