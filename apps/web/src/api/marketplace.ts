export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface ProductStock {
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  unit: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  brand: string | null;
  model: string | null;
  unit: string;
  priceTzs: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  sellerId?: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  seller: { id: string; name: string };
  category: { id: string; slug: string; name: string };
  images: ProductImage[];
  specifications: Array<{ name: string; value: string }>;
  stock: ProductStock | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Storefront {
  id: string;
  userId?: string;
  businessName: string;
  slug: string;
  businessCategory: string;
  region: string;
  district: string;
  phone: string;
  email: string | null;
  description: string;
  logoUrl: string | null;
  status: 'ACTIVE' | 'PAUSED';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerApplication {
  id: string;
  userId: string;
  businessName: string;
  businessCategory: string;
  region: string;
  district: string;
  phone: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MySellerStatus {
  application: SellerApplication | null;
  storefront: Storefront | null;
}

export interface InventoryItem {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  unit: string;
  lowStock: boolean;
  outOfStock: boolean;
}

export interface StockMovement {
  id: string;
  type: 'OPENING' | 'RESERVATION' | 'RELEASE' | 'FULFILMENT' | 'ADJUSTMENT';
  onHandDelta: number;
  reservedDelta: number;
  onHandAfter: number;
  reservedAfter: number;
  reason: string;
  reference: string;
  createdAt: string;
}

export interface PaymentMethod {
  code: string;
  name: string;
  description: string;
  kind: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD';
  instructions: string | null;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  unit: string;
  unitPriceTzs: number;
  quantity: number;
  lineTotalTzs: number;
}

export interface SellerOrder {
  id: string;
  orderId?: string;
  sellerId: string;
  sellerName: string;
  status: OrderStatus;
  subtotalTzs: number;
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNumber: string;
    buyerName: string;
    contactName: string;
    contactPhone: string;
    deliveryMethod: 'DELIVERY' | 'PICKUP';
    region: string | null;
    district: string | null;
    addressLine: string | null;
    landmark: string | null;
    notes: string | null;
    paymentMethodName: string;
    paymentStatus: string;
    totalTzs: number;
    createdAt: string;
  };
  items: OrderItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethodCode: string;
  paymentMethodName: string;
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  contactName: string;
  contactPhone: string;
  region: string | null;
  district: string | null;
  addressLine: string | null;
  landmark: string | null;
  notes: string | null;
  subtotalTzs: number;
  deliveryFeeTzs: number;
  totalTzs: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  sellerOrders: SellerOrder[];
}

export interface SellerStats {
  counts: Record<OrderStatus, number>;
  deliveredSalesTzs: number;
  actionRequired: number;
}

export interface CatalogueSellerStats {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
}

export interface Payment {
  id: string;
  orderId: string;
  buyerId: string;
  amountTzs: number;
  currency: string;
  methodCode: string;
  methodName: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutInput {
  items: Array<{ productId: string; quantity: number }>;
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  contactName: string;
  contactPhone: string;
  region?: string;
  district?: string;
  addressLine?: string;
  landmark?: string;
  notes?: string;
  paymentMethodCode: string;
  idempotencyKey: string;
}
