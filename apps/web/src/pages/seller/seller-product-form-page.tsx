import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, resolveMediaUrl } from '../../api/client';
import type { Category, Product } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { FormField } from '../../components/form-field';
import { useApi } from '../../lib/use-api';

const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'] as const;

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
}

export function SellerProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { authRequest } = useAuth();
  const categories = useApi(() => authRequest<Category[]>('/catalogue/categories'), []);
  const existing = useApi(
    () => (id ? authRequest<Product>('/catalogue/seller/products/' + id) : Promise.resolve(null)),
    [id],
  );
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    condition: 'NEW',
    brand: '',
    model: '',
    unit: 'piece',
    priceTzs: '',
    openingStock: '0',
    lowStockThreshold: '5',
  });
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(!editing);

  useEffect(() => {
    if (!editing || !existing.data) return;
    const product = existing.data;
    setForm({
      name: product.name,
      categoryId: product.category.id,
      description: product.description,
      condition: product.condition,
      brand: product.brand ?? '',
      model: product.model ?? '',
      unit: product.unit,
      priceTzs: String(product.priceTzs),
      openingStock: String(product.stock?.onHand ?? 0),
      lowStockThreshold: String(product.stock?.lowStockThreshold ?? 5),
    });
    setLoaded(true);
  }, [editing, existing.data]);

  if (editing && existing.loading) return <LoadingState label="Loading product" />;
  if (editing && existing.error) return <ErrorState message={existing.error} />;
  if (!loaded) return <LoadingState label="Preparing product" />;

  const product = existing.data;

  function field(name: keyof typeof form) {
    return {
      value: form[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((current) => ({ ...current, [name]: event.target.value })),
    };
  }

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    setError(null);
    const accepted: string[] = [];
    const currentCount = editing ? (product?.images.length ?? 0) : images.length;
    for (const file of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setError('Upload JPEG, PNG or WebP images only.');
        continue;
      }
      if (file.size > 2_000_000) {
        setError('Each image must be 2 MB or smaller.');
        continue;
      }
      if (currentCount + accepted.length >= 6) {
        setError('A product can have at most 6 images.');
        break;
      }
      try {
        accepted.push(await readFile(file));
      } catch {
        setError('The image could not be read. Try another file.');
      }
    }
    if (editing && product) {
      for (const dataUrl of accepted) {
        try {
          await authRequest('/catalogue/seller/products/' + product.id + '/images', {
            method: 'POST',
            body: JSON.stringify({ dataUrl }),
          });
        } catch (caught) {
          setError(caught instanceof ApiError ? caught.message : 'The image could not be uploaded.');
        }
      }
      const refreshed = await authRequest<Product>('/catalogue/seller/products/' + product.id);
      existing.setData(refreshed);
    } else {
      setImages((current) => [...current, ...accepted].slice(0, 6));
    }
  }

  async function removeImage(imageId: string) {
    if (!product) return;
    try {
      await authRequest('/catalogue/seller/products/' + product.id + '/images/' + imageId, {
        method: 'DELETE',
      });
      existing.setData({
        ...product,
        images: product.images.filter((image) => image.id !== imageId),
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The image could not be removed.');
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      description: form.description.trim(),
      condition: form.condition,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      unit: form.unit.trim(),
      priceTzs: Number(form.priceTzs),
      ...(editing
        ? {}
        : {
            openingStock: Number(form.openingStock),
            lowStockThreshold: Number(form.lowStockThreshold),
            images,
          }),
    };
    try {
      const saved = await authRequest<Product>(
        editing ? '/catalogue/seller/products/' + id : '/catalogue/seller/products',
        { method: 'POST', body: JSON.stringify(payload) },
      );
      navigate('/seller/products', {
        state: { message: editing ? 'Product updated.' : 'Draft created. Submit it for review when ready.' },
      });
      return saved;
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message + (caught.fieldErrors?.length ? ' ' + caught.fieldErrors.join(' ') : ''));
      } else {
        setError('The product could not be saved.');
      }
    } finally {
      setPending(false);
    }
  }

  const imageItems = editing
    ? (product?.images ?? []).map((image) => ({ id: image.id, url: image.url, remote: true }))
    : images.map((url, index) => ({ id: String(index), url, remote: false }));

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">{editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</p>
          <h1>{editing ? 'Update your listing' : 'Create a listing'}</h1>
          <p className="muted">
            {editing
              ? 'Saving changes to an approved product returns it to review.'
              : 'Save as a draft, then submit for administrator review.'}
          </p>
        </div>
        <Link className="text-link" to="/seller/products">Back to products</Link>
      </div>

      <form className="account-card product-form" onSubmit={submit}>
        {error && <Alert tone="error">{error}</Alert>}
        <FormField label="Product name" name="name" minLength={3} maxLength={200} required {...field('name')} />
        <label className="field">
          <span>Category</span>
          <select name="categoryId" required value={form.categoryId} onChange={field('categoryId').onChange}>
            <option value="">Choose a category</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Description</span>
          <textarea rows={6} minLength={20} maxLength={5000} required value={form.description} onChange={field('description').onChange} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Condition</span>
            <select value={form.condition} onChange={field('condition').onChange}>
              {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
            </select>
          </label>
          <FormField label="Unit" name="unit" maxLength={30} required {...field('unit')} />
          <FormField label="Brand (optional)" name="brand" maxLength={120} {...field('brand')} />
          <FormField label="Model (optional)" name="model" maxLength={120} {...field('model')} />
          <FormField label="Price (TZS)" name="priceTzs" type="number" min={100} step={1} required {...field('priceTzs')} />
          {!editing && (
            <>
              <FormField label="Opening stock" name="openingStock" type="number" min={0} step={1} required {...field('openingStock')} />
              <FormField label="Low stock alert at" name="lowStockThreshold" type="number" min={0} step={1} required {...field('lowStockThreshold')} />
            </>
          )}
        </div>

        <div className="field">
          <span>Images ({imageItems.length}/6)</span>
          <div className="image-upload-grid">
            {imageItems.map((image) => (
              <div className="image-upload-item" key={image.id}>
                <img src={image.remote ? resolveMediaUrl(image.url) ?? '' : image.url} alt="" />
                <button
                  className="link-button"
                  type="button"
                  onClick={() =>
                    image.remote
                      ? removeImage(image.id)
                      : setImages((current) => current.filter((_, index) => String(index) !== image.id))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            {imageItems.length < 6 && (
              <label className="image-upload-add">
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} />
                <span>Add image</span>
              </label>
            )}
          </div>
          <span className="field-hint">
            JPEG, PNG or WebP up to 2 MB each. The first image is used on product cards.
            {editing ? ' Image changes are saved as soon as you add or remove them.' : ''}
          </span>
        </div>

        <div className="inline-actions">
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Save draft'}
          </button>
          <Link className="text-link" to="/seller/products">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
