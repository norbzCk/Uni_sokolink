import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

export function HomePage() {
  const { user } = useAuth();
  return (
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A MARKETPLACE FOR WHAT'S NEXT</p>
          <h1>Good ideas deserve a place to grow.</h1>
          <p className="lead">Discover student-led businesses and find the people building something of their own.</p>
          <div className="hero-actions">
            {user ? (
              <Link className="button button-primary" to="/account">Go to your account</Link>
            ) : (
              <Link className="button button-primary" to="/sign-up">Create an account</Link>
            )}
            <Link className="text-link" to={user?.roles.includes('SELLER') ? '/seller' : '/sign-up'}>
              {user?.roles.includes('SELLER') ? 'Open seller workspace' : 'Become a seller'} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="trust-note">
            <span className="trust-dot" />A community marketplace shaped around student enterprise
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="art-card">
            <span className="art-kicker">MADE HERE</span>
            <div className="art-shape"><i /><b /><em /></div>
            <span className="art-caption">Ideas into livelihoods.</span>
          </div>
          <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
        </div>
      </section>
      <section className="intro-strip">
        <span>One account. Room to grow.</span>
        <span>Shop local talent&nbsp; · &nbsp;Build with confidence</span>
      </section>
    </div>
  );
}
