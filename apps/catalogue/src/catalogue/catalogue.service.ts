import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma, type ProductStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { loadEnvironment } from '../environment';
import type { ServiceUser } from '@sokolink/platform';
import type {
  AddProductImageDto,
  CreateProductDto,
  ListProductsQuery,
  SellerProductQuery,
  UpdateProductDto,
} from './catalogue.dto';

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; specifications: true; category: true };
}>;

type StockLevel = {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  unit: string;
};

const PRODUCT_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  specifications: { orderBy: { sortOrder: 'asc' as const } },
  category: true,
} satisfies Prisma.ProductInclude;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function parseImageDataUrl(dataUrl: string): { data: Uint8Array<ArrayBuffer>; contentType: string } {
  const match = DATA_URL.exec(dataUrl);
  if (!match?.[1] || !match[2]) {
    throw new BadRequestException({
      code: 'INVALID_IMAGE',
      message: 'Upload a JPEG, PNG or WebP image.',
      fieldErrors: { images: 'Upload a JPEG, PNG or WebP image.' },
    });
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.byteLength > 2_000_000) {
    throw new BadRequestException({
      code: 'IMAGE_TOO_LARGE',
      message: 'Each product image must be 2 MB or smaller.',
      fieldErrors: { images: 'Each product image must be 2 MB or smaller.' },
    });
  }
  return { data: new Uint8Array(buffer), contentType: match[1] };
}

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { status: 'APPROVED' } } } } },
    });
    return categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: category._count.products,
    }));
  }

  async listProducts(query: ListProductsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const category = await this.resolveCategory(query.category);
    if (query.category && !category) {
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const where: Prisma.ProductWhereInput = {
      status: 'APPROVED',
      ...(category ? { categoryId: category.id } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            priceTzs: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { sellerName: { contains: query.q, mode: 'insensitive' } },
              { brand: { contains: query.q, mode: 'insensitive' } },
              { model: { contains: query.q, mode: 'insensitive' } },
              { category: { name: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { priceTzs: 'asc' }
        : query.sort === 'price_desc'
          ? { priceTzs: 'desc' }
          : { createdAt: 'desc' };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PRODUCT_INCLUDE,
      }),
    ]);
    const stock = await this.fetchStockLevels(products.map((product) => product.id));

    return {
      items: products.map((product) => this.presentProduct(product, stock[product.id])),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getProduct(id: string) {
    const product = await this.findPublicProduct(id);
    const stock = await this.fetchStockLevels([product.id]);
    return this.presentProduct(product, stock[product.id]);
  }

  async getRelatedProducts(id: string) {
    const product = await this.findPublicProduct(id);
    const related = await this.prisma.product.findMany({
      where: { status: 'APPROVED', categoryId: product.categoryId, id: { not: product.id } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: PRODUCT_INCLUDE,
    });
    const stock = await this.fetchStockLevels(related.map((item) => item.id));
    return related.map((item) => this.presentProduct(item, stock[item.id]));
  }

  async listSellerProducts(userId: string, query: SellerProductQuery) {
    const where: Prisma.ProductWhereInput = {
      sellerId: userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: PRODUCT_INCLUDE,
      take: 200,
    });
    const stock = await this.fetchStockLevels(products.map((product) => product.id));
    return {
      items: products.map((product) =>
        this.presentProduct(product, stock[product.id], { includeModeration: true }),
      ),
    };
  }

  async getSellerProduct(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: userId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    const stock = await this.fetchStockLevels([product.id]);
    return this.presentProduct(product, stock[product.id], { includeModeration: true });
  }

  async sellerStats(userId: string) {
    const grouped = await this.prisma.product.groupBy({
      by: ['status'],
      where: { sellerId: userId },
      _count: { _all: true },
    });
    const counts: Record<ProductStatus, number> = {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    };
    for (const group of grouped) {
      counts[group.status] = group._count._all;
    }
    return counts;
  }

  async createProduct(user: ServiceUser, dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new BadRequestException({
        code: 'CATEGORY_INVALID',
        message: 'Choose a valid product category.',
        fieldErrors: { categoryId: 'Choose a valid product category.' },
      });
    }
    const sellerName = await this.fetchSellerName(user.id, user.fullName);
    const images = (dto.images ?? []).map(parseImageDataUrl);
    if (images.length > 6) {
      throw new BadRequestException({
        code: 'TOO_MANY_IMAGES',
        message: 'Add up to 6 product images.',
      });
    }
    const slug = slugify(dto.name) + '-' + randomBytes(3).toString('hex');

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sellerId: user.id,
          sellerName,
          categoryId: dto.categoryId,
          name: dto.name,
          slug,
          description: dto.description,
          condition: dto.condition ?? 'NEW',
          brand: dto.brand ?? null,
          model: dto.model ?? null,
          unit: dto.unit ?? 'piece',
          priceTzs: dto.priceTzs,
          status: 'DRAFT',
          images: {
            create: images.map((image, index) => ({
              data: image.data,
              contentType: image.contentType,
              alt: dto.name,
              sortOrder: index,
            })),
          },
          specifications: {
            create: (dto.specifications ?? []).map((spec, index) => ({
              name: spec.name,
              value: spec.value,
              sortOrder: index,
            })),
          },
        },
        include: PRODUCT_INCLUDE,
      });
      return created as ProductWithRelations;
    });

    try {
      await this.initializeStock(
        product.id,
        user.id,
        dto.openingStock,
        dto.lowStockThreshold ?? 5,
        dto.unit ?? 'piece',
      );
    } catch {
      await this.prisma.product.delete({ where: { id: product.id } }).catch(() => undefined);
      throw new BadGatewayException({
        code: 'STOCK_SETUP_FAILED',
        message: 'The product could not be saved because inventory is unavailable. Try again.',
      });
    }

    return this.presentProduct(product, {
      productId: product.id,
      onHand: dto.openingStock,
      reserved: 0,
      available: dto.openingStock,
      lowStockThreshold: dto.lowStockThreshold ?? 5,
      unit: dto.unit ?? 'piece',
    }, { includeModeration: true });
  }

  async updateProduct(user: ServiceUser, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, sellerId: user.id },
      include: { images: true },
    });
    if (!existing) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    if (existing.status === 'ARCHIVED') {
      throw new ConflictException({
        code: 'PRODUCT_ARCHIVED',
        message: 'Restore this product before editing it.',
      });
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new BadRequestException({
          code: 'CATEGORY_INVALID',
          message: 'Choose a valid product category.',
          fieldErrors: { categoryId: 'Choose a valid product category.' },
        });
      }
    }

    const requiresReview = existing.status === 'APPROVED';
    const product = await this.prisma.$transaction(async (tx) => {
      if (dto.specifications) {
        await tx.productSpecification.deleteMany({ where: { productId: id } });
        await tx.productSpecification.createMany({
          data: dto.specifications.map((spec, index) => ({
            productId: id,
            name: spec.name,
            value: spec.value,
            sortOrder: index,
          })),
        });
      }
      return tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
          ...(dto.brand !== undefined ? { brand: dto.brand || null } : {}),
          ...(dto.model !== undefined ? { model: dto.model || null } : {}),
          ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
          ...(dto.priceTzs !== undefined ? { priceTzs: dto.priceTzs } : {}),
          ...(requiresReview
            ? {
                status: 'PENDING' as const,
                submittedAt: new Date(),
                approvedAt: null,
                approvedBy: null,
                rejectionReason: null,
              }
            : {}),
        },
        include: PRODUCT_INCLUDE,
      });
    });
    const stock = await this.fetchStockLevels([product.id]);
    return this.presentProduct(product, stock[product.id], { includeModeration: true });
  }

  async submitProduct(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: userId },
      include: { images: true },
    });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    if (product.status === 'ARCHIVED') {
      throw new ConflictException({
        code: 'PRODUCT_ARCHIVED',
        message: 'Restore this product before submitting it for review.',
      });
    }
    if (product.status === 'APPROVED' || product.status === 'PENDING') {
      return this.getSellerProduct(userId, id);
    }
    if (product.images.length === 0) {
      throw new BadRequestException({
        code: 'PRODUCT_IMAGE_REQUIRED',
        message: 'Add at least one product photo before submitting for review.',
      });
    }
    await this.prisma.product.update({
      where: { id },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
        rejectionReason: null,
        archivedAt: null,
      },
    });
    return this.getSellerProduct(userId, id);
  }

  async archiveProduct(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, sellerId: userId } });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    if (product.status === 'ARCHIVED') {
      return this.getSellerProduct(userId, id);
    }
    await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    return this.getSellerProduct(userId, id);
  }

  async restoreProduct(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, sellerId: userId } });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    if (product.status !== 'ARCHIVED') {
      throw new ConflictException({
        code: 'PRODUCT_NOT_ARCHIVED',
        message: 'Only archived products can be restored.',
      });
    }
    await this.prisma.product.update({
      where: { id },
      data: { status: 'DRAFT', archivedAt: null },
    });
    return this.getSellerProduct(userId, id);
  }

  async addImage(userId: string, id: string, dto: AddProductImageDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: userId },
      include: { images: true },
    });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    if (product.images.length >= 6) {
      throw new BadRequestException({
        code: 'TOO_MANY_IMAGES',
        message: 'A product can have up to 6 images.',
      });
    }
    const image = parseImageDataUrl(dto.dataUrl);
    const nextOrder =
      product.images.reduce((highest, item) => Math.max(highest, item.sortOrder), -1) + 1;
    await this.prisma.productImage.create({
      data: {
        productId: id,
        data: image.data,
        contentType: image.contentType,
        alt: dto.alt ?? product.name,
        sortOrder: nextOrder,
      },
    });
    return this.getSellerProduct(userId, id);
  }

  async removeImage(userId: string, productId: string, imageId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId: userId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    await this.prisma.productImage.deleteMany({ where: { id: imageId, productId } });
    return this.getSellerProduct(userId, productId);
  }

  async getImage(id: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException({ code: 'IMAGE_NOT_FOUND', message: 'Image not found.' });
    }
    return { data: Buffer.from(image.data), contentType: image.contentType };
  }

  async adminListProducts(status?: ProductStatus) {
    const products = await this.prisma.product.findMany({
      where: { status: status ?? 'PENDING' },
      orderBy: { submittedAt: 'asc' },
      take: 100,
      include: PRODUCT_INCLUDE,
    });
    const stock = await this.fetchStockLevels(products.map((product) => product.id));
    return products.map((product) =>
      this.presentProduct(product, stock[product.id], { includeModeration: true }),
    );
  }

  async adminApproveProduct(adminId: string, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    if (product.status === 'ARCHIVED') {
      throw new ConflictException({
        code: 'PRODUCT_ARCHIVED',
        message: 'Archived products cannot be approved.',
      });
    }
    await this.prisma.product.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
      },
    });
    return this.getProduct(id);
  }

  async adminRejectProduct(adminId: string, id: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    await this.prisma.product.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: adminId,
      },
    });
    return this.getSellerProductForAdmin(id);
  }

  async internalProductBatch(ids: string[]) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, status: 'APPROVED' },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    return products.map((product) => ({
      id: product.id,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      name: product.name,
      slug: product.slug,
      unit: product.unit,
      priceTzs: product.priceTzs,
      currency: product.currency,
      imageUrl: product.images[0] ? '/catalogue/images/' + product.images[0].id : null,
    }));
  }

  private async findPublicProduct(idOrSlug: string): Promise<ProductWithRelations> {
    const isUuid = UUID.test(idOrSlug);
    const product = await this.prisma.product.findFirst({
      where: {
        status: 'APPROVED',
        ...(isUuid ? { id: idOrSlug } : { slug: idOrSlug }),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'This product is not available.',
      });
    }
    return product;
  }

  private async getSellerProductForAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        specifications: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
    }
    const stock = await this.fetchStockLevels([product.id]);
    return this.presentProduct(product, stock[product.id], { includeModeration: true });
  }

  private async resolveCategory(value?: string) {
    if (!value) return undefined;
    return this.prisma.category.findFirst({
      where: UUID.test(value) ? { id: value } : { slug: value },
      select: { id: true, slug: true, name: true },
    });
  }

  private presentProduct(
    product: ProductWithRelations,
    stock?: StockLevel,
    options: { includeModeration?: boolean } = {},
  ) {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      condition: product.condition,
      brand: product.brand,
      model: product.model,
      unit: product.unit,
      priceTzs: product.priceTzs,
      currency: product.currency,
      status: product.status,
      ...(options.includeModeration
        ? {
            sellerId: product.sellerId,
            rejectionReason: product.rejectionReason,
            submittedAt: product.submittedAt?.toISOString() ?? null,
            approvedAt: product.approvedAt?.toISOString() ?? null,
          }
        : {}),
      seller: { id: product.sellerId, name: product.sellerName },
      category: { id: product.category.id, slug: product.category.slug, name: product.category.name },
      images: product.images.map((image) => ({
        id: image.id,
        url: '/catalogue/images/' + image.id,
        alt: image.alt ?? product.name,
      })),
      specifications: product.specifications.map((spec) => ({ name: spec.name, value: spec.value })),
      stock: stock
        ? {
            onHand: stock.onHand,
            reserved: stock.reserved,
            available: stock.available,
            lowStockThreshold: stock.lowStockThreshold,
            unit: stock.unit,
            inStock: stock.available > 0,
          }
        : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private async fetchStockLevels(ids: string[]): Promise<Record<string, StockLevel>> {
    if (ids.length === 0) return {};
    const env = loadEnvironment();
    try {
      const response = await fetch(env.INVENTORY_SERVICE_URL + '/api/v1/inventory/internal/levels', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({ productIds: ids }),
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return {};
      const body = (await response.json()) as { items?: StockLevel[] };
      const result: Record<string, StockLevel> = {};
      for (const item of body.items ?? []) {
        result[item.productId] = item;
      }
      return result;
    } catch {
      return {};
    }
  }

  private async initializeStock(
    productId: string,
    sellerId: string,
    quantity: number,
    lowStockThreshold: number,
    unit: string,
  ): Promise<void> {
    const env = loadEnvironment();
    let response: Response;
    try {
      response = await fetch(env.INVENTORY_SERVICE_URL + '/api/v1/inventory/internal/initialize', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({ productId, sellerId, quantity, lowStockThreshold, unit }),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      throw new BadGatewayException({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory unavailable.' });
    }
    if (!response.ok) {
      throw new BadGatewayException({ code: 'INVENTORY_UNAVAILABLE', message: 'Inventory unavailable.' });
    }
  }

  private async fetchSellerName(userId: string, fallback: string): Promise<string> {
    const env = loadEnvironment();
    try {
      const response = await fetch(
        env.SELLER_SERVICE_URL + '/api/v1/seller/internal/users/' + userId + '/summary',
        {
          headers: { 'x-internal-token': env.INTERNAL_SERVICE_TOKEN },
          signal: AbortSignal.timeout(2000),
        },
      );
      if (!response.ok) return fallback;
      const body = (await response.json()) as { businessName?: string | null };
      return body.businessName ?? fallback;
    } catch {
      return fallback;
    }
  }
}
