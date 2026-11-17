import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { CartProvider } from './cart/cart-context';
import { ProtectedRoute } from './components/protected-route';
import { AdminLayout } from './layouts/admin-layout';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { DeliveryLayout } from './layouts/delivery-layout';
import { SellerLayout } from './layouts/seller-layout';
import { AccountPage } from './pages/account-page';
import { AdminDashboardPage } from './pages/admin/admin-dashboard-page';
import { AdminProductsPage } from './pages/admin/admin-products-page';
import { AdminSellersPage } from './pages/admin/admin-sellers-page';
import { CartPage } from './pages/cart-page';
import { CheckoutPage } from './pages/checkout-page';
import { DeliveryDashboardPage } from './pages/delivery/delivery-dashboard-page';
import { ExplorePage } from './pages/explore-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { OrderDetailPage } from './pages/order-detail-page';
import { OrdersPage } from './pages/orders-page';
import { PaymentPage } from './pages/payment-page';
import { ProductPage } from './pages/product-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { SellPage } from './pages/sell-page';
import { SellerDashboardPage } from './pages/seller/seller-dashboard-page';
import { SellerInventoryPage } from './pages/seller/seller-inventory-page';
import { SellerOrderDetailPage } from './pages/seller/seller-order-detail-page';
import { SellerOrdersPage } from './pages/seller/seller-orders-page';
import { SellerProductFormPage } from './pages/seller/seller-product-form-page';
import { SellerProductsPage } from './pages/seller/seller-products-page';
import { SellerStorefrontPage } from './pages/seller/seller-storefront-page';
import { SignInPage } from './pages/sign-in-page';
import { SignUpPage } from './pages/sign-up-page';
import {
  AboutPage,
  CampusPage,
  CategoryPage,
  ContactPage,
  DealsPage,
  HelpPage,
  PoliciesPage,
} from './pages/static-pages';
import { StorefrontPage } from './pages/storefront-page';
import { VerifyEmailPage } from './pages/verify-email-page';

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<ExplorePage />} />
            <Route path="/c/:slug" element={<CategoryPage />} />
            <Route path="/p/:slug" element={<ProductPage />} />
            <Route path="/s/:slug" element={<StorefrontPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/campus" element={<CampusPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/policies/refunds" element={<PoliciesPage />} />
            <Route path="/contact" element={<ContactPage />} />

            <Route path="/products" element={<Navigate to="/search" replace />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/stores/:slug" element={<StorefrontPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/order-confirmed/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/payment/:orderId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/seller/apply" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route
              path="/seller"
              element={<ProtectedRoute roles={['SELLER']}><SellerLayout /></ProtectedRoute>}
            >
              <Route index element={<SellerDashboardPage />} />
              <Route path="orders" element={<SellerOrdersPage />} />
              <Route path="orders/:id" element={<SellerOrderDetailPage />} />
              <Route path="products" element={<SellerProductsPage />} />
              <Route path="products/new" element={<SellerProductFormPage />} />
              <Route path="products/:id" element={<SellerProductFormPage />} />
              <Route path="inventory" element={<SellerInventoryPage />} />
              <Route path="storefront" element={<SellerStorefrontPage />} />
            </Route>
            <Route
              path="/admin"
              element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="sellers" element={<AdminSellersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
            </Route>
            <Route
              path="/delivery"
              element={
                <ProtectedRoute roles={['DELIVERY_PARTNER']}>
                  <DeliveryLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DeliveryDashboardPage />} />
              <Route path="assignments" element={<DeliveryDashboardPage />} />
              <Route path="coverage" element={<DeliveryDashboardPage />} />
              <Route path="earnings" element={<DeliveryDashboardPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Navigate to="/sign-in" replace />} />
            <Route path="/register" element={<Navigate to="/sign-up" replace />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
