import { useState } from 'react';
import { ApiError } from '../../api/client';
import type { SellerApplication } from '../../api/marketplace';
import { useAuth } from '../../auth/auth-context';
import { Alert } from '../../components/alert';
import { ErrorState, LoadingState } from '../../components/async-state';
import { formatDate, statusTone } from '../../lib/format';
import { useApi } from '../../lib/use-api';

export function AdminSellersPage() {
  const { authRequest } = useAuth();
  const applications = useApi(
    () => authRequest<{ applications: SellerApplication[] }>('/seller/admin/applications'),
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function refresh() {
    const result = await authRequest<{ applications: SellerApplication[] }>('/seller/admin/applications');
    applications.setData(result);
  }

  async function approve(application: SellerApplication) {
    setBusy(application.id);
    setError(null);
    try {
      await authRequest('/seller/admin/applications/' + application.id + '/approve', { method: 'POST' });
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The application could not be approved.');
    } finally {
      setBusy(null);
    }
  }

  async function reject(application: SellerApplication) {
    if (reason.trim().length < 3) {
      setError('Enter a rejection reason of at least 3 characters.');
      return;
    }
    setBusy(application.id);
    setError(null);
    try {
      await authRequest('/seller/admin/applications/' + application.id + '/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRejecting(null);
      setReason('');
      await refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The application could not be rejected.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">SELLER REVIEW</p>
          <h1>Seller applications</h1>
          <p className="muted">Approval grants seller access and unlocks the seller workspace.</p>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {applications.loading ? (
        <LoadingState label="Loading applications" />
      ) : applications.error ? (
        <ErrorState message={applications.error} />
      ) : applications.data && applications.data.applications.length > 0 ? (
        <div className="moderation-list">
          {applications.data.applications.map((application) => (
            <article className="moderation-card" key={application.id}>
              <div className="moderation-head">
                <div>
                  <h2>{application.businessName}</h2>
                  <p className="muted">{application.businessCategory} · {application.district}, {application.region}</p>
                  <p className="muted">Submitted {formatDate(application.submittedAt)} · {application.phone}</p>
                </div>
                <span className={'badge ' + statusTone(application.status)}>{application.status}</span>
              </div>
              <p>{application.description}</p>
              {application.rejectionReason && <Alert tone="error">{application.rejectionReason}</Alert>}
              {application.status === 'PENDING' && (
                <div className="moderation-actions">
                  <button className="button button-primary button-small" type="button" disabled={busy === application.id} onClick={() => approve(application)}>
                    Approve seller
                  </button>
                  <button className="button button-outline button-small" type="button" onClick={() => setRejecting(application.id)}>
                    Reject
                  </button>
                </div>
              )}
              {rejecting === application.id && (
                <div className="reject-form">
                  <label className="field">
                    <span>Reason for rejection</span>
                    <textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
                  </label>
                  <div className="row-actions">
                    <button className="button button-primary button-small" type="button" disabled={busy === application.id} onClick={() => reject(application)}>
                      Confirm rejection
                    </button>
                    <button className="link-button" type="button" onClick={() => { setRejecting(null); setReason(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No seller applications.</h2>
          <p className="muted">New applications will appear here for review.</p>
        </div>
      )}
    </div>
  );
}
