# Marketplace data and ordering/payment/delivery boundary

This application owns campus membership approval, stores, store locations, product names/descriptions/images, PHP prices, available stock, seller plans, messages, and counter POS receipts. It retains the existing online cart/order prototype. Payment capture and delivery dispatch are not connected to external systems.

## Current records

The local `market-data.json` store contains `users`, `stalls`, `products`, `carts`, `orders`, `messages`, `events`, `eventStalls`, `applications`, `behavior`, `posSales`, and `auditLog`.

| Record | Key relationships / important fields |
| --- | --- |
| User | `id`, role, approval status, affiliation, private campus ID, department, review metadata |
| Stall | `id`, `owner_id` → User, name, campus location, approval status, `is_active`, tier |
| Product | `id`, `stall_id` → Stall, name, PHP price, stock, category, image, active flag |
| Cart item | `user_id` → Buyer, `product_id` → Product, quantity |
| Online order | `buyer_id`, `seller_id`, item price snapshots, quantities, total, status |
| POS sale | `buyer_id`, `seller_id`, `stall_id`, item/name/price snapshots, cash, change, `request_id` |
| Message | `sender_id`, `receiver_id`, optional `product_id`, content, sent time |
| Event participation | `event_id`, `seller_id`, `stall_id`, stall number |
| Audit record | actor, action, target, note, timestamp |

The JSON file is not a relational schema with foreign-key constraints. Relationships and critical transaction rules are checked by the application. Move them to database constraints and database transactions when implementing the production persistence layer.

## Available REST interfaces

All paths below begin with `/api`. Protected endpoints take `Authorization: Bearer <accessToken>`. A refresh token is not accepted as an access token. Access checks use the current database role, ban flag, and approval status.

| Interface | Access / purpose |
| --- | --- |
| `GET /stalls`, `GET /stalls/:id` | Public; approved, open stores with approved owners |
| `GET /products`, `GET /products/:id` | Public product discovery; filters include `q`, `category`, `stall_id`, `min_price`, `max_price`, `page`, `limit` |
| `GET /products?featured=true` | Public promotion candidates belonging to active Premium stores |
| `GET /products?mine=true` | Approved seller's own products, including hidden listings |
| `GET /auth/me` | Signed-in member's own profile and approval state; no password hash |
| `PUT /auth/credentials` | Pending/rejected member submits corrected ID, affiliation, and department |
| `POST /auth/start-selling` | Approved member opens a pending store and becomes a Seller |
| `PUT /admin/users/:id/review` | Administrator records approval/correction request with verification note |
| `GET /admin/stalls`, `PUT /admin/stalls/:id/plan` | Administrator manages all stores and Free/Premium plans |
| `POST /orders` | Approved Buyer; existing prototype reserves stock for one store per request; response `{ order }` |
| `PUT /orders/:id/status` | Order participants with enforced transitions; buyers may only cancel pending orders |
| `GET/POST /messages` | Approved participants; sends must be between a Buyer and a Seller |
| `GET /pos/customers?q=<exact-email-or-ID>` | Approved Seller; resolves an approved Buyer without returning campus credentials |
| `POST /pos/sales`, `GET /pos/sales` | Approved Seller; own counter sales and history; new sale requires unique UUID `request_id` |
| `GET /analytics/sales`, `/analytics/products/top`, `/analytics/categories` | Premium Seller or administrator; completed/delivered sales only, `period` in days |

POS totals are calculated from server prices using integer-cent arithmetic. Every item is validated before stock changes. Reusing a successful POS `request_id` for the same seller returns that existing receipt without reducing stock again. An online order is currently limited to one store; multi-store cart requests must be split by the ordering client. Buyers must never provide trusted prices, seller IDs, or approval flags.

## Agreement needed with the other capstone group

Do not let the payment or delivery system write directly into the JSON file or call admin routes with a shared administrator login. Before connecting systems, agree on service authentication, product/store/user UUID mappings, stock-reservation ownership, expiration and cancellation rules, payment confirmation events, idempotency keys, refund behavior, and which group owns each order state.

The future payment integration must distinguish submitted, paid, refunded, and fulfilled states; a buyer clicking a button is not proof of payment. Signed webhook handling, service credentials, delivery tracking, and cross-system transaction reconciliation are not implemented here. The local POS records cash received by a seller; it does not process electronic payments or issue a tax-compliance certification.
