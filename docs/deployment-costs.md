# Deployment and operating budget

Prepared September 8, 2026. All provider figures are USD and exclude taxes, card conversion fees, usage overages, and paid team/workspace upgrades. These are estimates for planning, not purchases or invoices.

## Option A: small capstone pilot using the current implementation

| Item | Monthly base | Annual base | Basis |
| --- | ---: | ---: | --- |
| Static frontend on Cloudflare Pages Free | $0 | $0 | Subject to the [Pages plan](https://www.cloudflare.com/products/pages/) and [Free plan limits](https://developers.cloudflare.com/pages/platform/limits/). |
| Express API on Render Starter compute | $7 | $84 | Starter compute on [Render pricing](https://render.com/pricing). Workspace charges, if selected, are additional. |
| Persistent disk for the current JSON store, assumed 1 GB | $0.25 | $3 | $0.25/GB/month on [Render pricing](https://render.com/pricing). |
| **Base hosting total** | **$7.25** | **$87** | Calculated sum of the above. |

Budget an additional **$20/year allowance** for a custom domain and **$5/month allowance** for independent backups or other operating costs. These are group planning allowances, not verified vendor quotes. A university-provided subdomain may remove the domain expense.

Annual planning subtotal: **$167** ($87 hosting + $20 domain allowance + $60 operations allowance). With a 20% contingency: **$200.40/year**. At an illustrative budgeting rate of **PHP 60/USD**, that is **PHP 12,024/year**. PHP 60 is an assumption, not a live exchange-rate quotation; replace it with the finance office's approved rate before submission.

The current file store requires one backend process and persistent disk. Render Free services cannot attach persistent disks and can lose local file changes; they also sleep after inactivity. Therefore an ephemeral free API is unsuitable for durable registrations and POS records. See [Render free-service limitations](https://render.com/docs/free).

## Option B: institutional database architecture after migration

| Item | Monthly starting estimate |
| --- | ---: |
| Static frontend | $0 |
| API compute | $7 |
| Supabase Pro, one project at included base compute | $25 |
| **Base total** | **$32/month, $384/year** |

Supabase lists Pro from $25/month, including the first project; compute upgrades, extra projects, and usage beyond allowances can add charges. Free has 500 MB database capacity and can pause inactive projects. See [Supabase pricing](https://supabase.com/pricing). Merely entering Supabase environment variables does **not** migrate this application: its current controllers call `marketStore.js`, which reads a JSON file.

Using the same $20 domain and $60 operations allowances gives **$464/year**, or **$556.80/year with 20% contingency**. At the illustrative PHP 60/USD rate, that is **PHP 33,408/year**. Database migration and testing labor are not included in this infrastructure estimate.

## Other expenses to assign before defense

Record named owners and actual quotations for mobile data/internet, electricity, administrator verification time, maintenance labor, a printer and receipt paper if desired, data backup/recovery, domain renewal, and any institution-required security review. Email/SMS charges apply only if those services are added. Payment gateway transaction fees and delivery costs belong to the other group's budget and integration agreement.

## Configuration and rollout

For local mobile testing, run the backend on port 5001 and the frontend with `npm run dev`. The frontend binds to the LAN and forwards `/api` through Vite. Connect the phone to the same network and use `http://<computer-LAN-IP>:5173`. The operating-system firewall must permit that local connection. The development proxy is not part of the production build.

For a deployed split frontend/API, set frontend `VITE_API_URL` to the API's HTTPS URL ending in `/api` **before building**. Set backend `FRONTEND_URL` to the exact frontend HTTPS origin, set a strong private `JWT_SECRET`, and use the host-provided `PORT`. Configure SPA fallback to `index.html` so direct links such as `/stalls/<id>` work. Serve all `frontend/public/images` assets with the built site.

Set `MARKET_DATA_FILE` to an absolute path on the mounted persistent disk, outside the code repository. Seed that file deliberately with a real administrator and no presentation accounts; do not deploy the included fixture accounts with known passwords. Keep only one API process while using the current store. Stop the process for manual file imports; it caches records in memory. Back up the data outside the application disk and test restoration. Never put real campus IDs, password hashes, or server secrets in frontend environment variables or source control.

No hosting services, domains, or subscriptions were created by this implementation.
