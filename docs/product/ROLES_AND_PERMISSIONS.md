# Roles and permissions

Authorization uses backend-enforced permissions and resource ownership. Roles are assignments, not UI labels. A principal can hold multiple roles; CUSTOMER access is available to all registered users. Seller approval gates seller grants. Administrators can grant only capabilities within their own authority; SUPER_ADMIN use is exceptional and audited.

| Capability | CUSTOMER | SELLER (approved) | DELIVERY_PARTNER | ADMIN | SUPER_ADMIN |
|---|---:|---:|---:|---:|---:|
| Browse public listings/storefronts | Yes | Yes | Yes | Yes | Yes |
| Manage own profile, sessions, contact verification | Yes | Yes | Yes | Yes | Yes |
| Submit/view own student or seller application | Yes | Yes | No | Review only | Review only |
| Manage own storefront/catalogue/inventory | No | Yes, own resources | No | Moderation only | Platform override, audited |
| Place/view own orders and payments | Yes | Yes | No | Support view, restricted | Restricted, audited |
| Process seller orders and fulfilment | No | Yes, own seller orders | Assigned tasks only | Support/override, audited | Restricted, audited |
| View/update assigned delivery | No | Own deliveries | Assigned deliveries | Operational review | Restricted, audited |
| Review/approve seller applications | No | No | No | Explicit permission | Yes |
| Moderate catalogue/content | No | Own content only | No | Explicit permission | Yes |
| Manage roles/platform policy | No | No | No | Limited grants | Yes |
| View platform analytics/audit | Own business scope later | Own business scope | Assigned scope | Explicit permission | Yes |

## Permission model

Use permission identifiers such as `seller.application.submit`, `seller.application.review`, `storefront.update`, `catalogue.product.publish`, `inventory.adjust`, `order.read.own`, `order.process.seller`, `payment.refund.request`, `fulfilment.update.assigned`, `moderation.review`, and `platform.roles.manage`. Authorization evaluates actor, permission, resource owner/assignment, state and relevant approval status. APIs return denial consistently without leaking whether protected resources exist.

Seller application states: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `NEEDS_INFORMATION`, `APPROVED`, `REJECTED`, `WITHDRAWN`. Store the reviewer, timestamps, reason code and human-readable reason, evidence references, and append-only state history. Resubmission creates a new review cycle linked to prior history. Only explicit approval grants seller permissions; rejection and needs-information never do.
