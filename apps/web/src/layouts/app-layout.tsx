import { Outlet } from 'react-router-dom';
import { Footer } from '../components/footer';
import { Header } from '../components/header';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
