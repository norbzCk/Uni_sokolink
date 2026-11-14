import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { CartProvider } from './cart/cart-context';
import { ProtectedRoute } from './components/protected-route';
import { AdminLayout } from './layouts/admin-layout';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { SellerLayout } from './layouts/seller-layout';
import { AccountPage } from './pages/account-page';
import { AdminDashboardPage } from './pages/admin/admin-dashboard-page';
import { AdminProductsPage } from './pages/admin/admin-products-page';
import { AdminSellersPage } from './pages/admin/admin-sellers-page';
import { CartPage } from './pages/cart-page';
import { CheckoutPage } from './pages/checkout-page';
import { ExplorePage } from './pages/explore-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { OrderDetailPage } from './pages/order-detail-page';
import { OrdersPage } from './pages/orders-page';
import { ProductPage } from './pages/product-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { SellPage } from './pages/sell-page';
import { SellerDashboardPage } from './pages/seller/seller-dashboard-page';
import { SellerInventoryPage } from './pages/seller/seller-inventory-page';
import { SellerOrdersPage } from './pages/seller/seller-orders-page';
import { SellerProductFormPage } from './pages/seller/seller-product-form-page';
import { SellerProductsPage } from './pages/seller/seller-products-page';
import { SellerStorefrontPage } from './pages/seller/seller-storefront-page';
import { SignInPage } from './pages/sign-in-page';
import { SignUpPage } from './pages/sign-up-page';
import { StorefrontPage } from './pages/storefront-page';
import { VerifyEmailPage } from './pages/verify-email-page';

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ExplorePage />} />
            <Route path="/products/:slug" element={<ProductPage />} />
            <Route path="/stores/:slug" element={<StorefrontPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route
              path="/seller"
              element={<ProtectedRoute roles={['SELLER']}><SellerLayout /></ProtectedRoute>}
            >
              <Route index element={<SellerDashboardPage />} />
              <Route path="orders" element={<SellerOrdersPage />} />
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
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route element={<AuthLayout />}>
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
