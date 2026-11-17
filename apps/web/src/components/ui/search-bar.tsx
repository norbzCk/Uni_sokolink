import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { apiRequest } from '../../api/client';
import type { Category, ProductList } from '../../api/marketplace';

export function SearchBar({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductList['items']>([]);
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<Category[]>('/catalogue/categories')
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      apiRequest<ProductList>('/catalogue/products?pageSize=5&q=' + encodeURIComponent(term))
        .then((result) => setSuggestions(result.items))
        .catch(() => setSuggestions([]));
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    navigate('/search' + (params.toString() ? '?' + params.toString() : ''));
    setOpen(false);
  }

  function chooseProduct(slug: string) {
    setOpen(false);
    navigate('/p/' + slug);
  }

  return (
    <div ref={wrapper} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <form className="search-form" role="search" onSubmit={submit}>
        <label className="sr-only" htmlFor={mobile ? 'mobile-search-category' : 'search-category'}>
          Search category
        </label>
        <select
          id={mobile ? 'mobile-search-category' : 'search-category'}
          className="search-select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={mobile ? 'mobile-search-input' : 'search-input'}>
          Search SokoLink
        </label>
        <input
          id={mobile ? 'mobile-search-input' : 'search-input'}
          className="search-input"
          type="search"
          placeholder="Search products, brands and student stores"
          value={query}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button className="search-button" type="submit" aria-label="Search">
          <Search size={20} strokeWidth={2} />
        </button>
      </form>
      {open && query.trim().length >= 2 && suggestions.length > 0 ? (
        <div className="search-suggestions" role="listbox" aria-label="Search suggestions">
          {suggestions.map((product) => (
            <button
              className="search-suggestion"
              key={product.id}
              type="button"
              role="option"
              onClick={() => chooseProduct(product.slug)}
            >
              <Search size={14} aria-hidden="true" />
              <span>{product.name}</span>
              <small>{product.seller.name}</small>
            </button>
          ))}
          <button
            className="search-suggestion"
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/search?q=' + encodeURIComponent(query.trim()));
            }}
          >
            <Search size={14} aria-hidden="true" />
            <span>See all results for “{query.trim()}”</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
