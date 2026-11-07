# kbFinance — finance app by kb

## Live demo
- **App**: [kbFinance on Render](https://kbfinance.onrender.com)
- **Repository**: [GitHub Repo](https://github.com/KaranGB83/kbFinance)
- **Video Demo**: [YouTube Video](https://youtu.be/fFUXlzn7RlQ)

## Project Overview

kbFinance is a stock trading simulator that lets users buy and sell stocks, manage a portfolio, and monitor wallet balance across NSE/BSE markets. The application uses live stock quotes to validate trades, calculate portfolio value, and log transaction history.

The project is split into two independent apps that talk over a JSON API:

| Directory   | What it is                                                          |
|-------------|---------------------------------------------------------------------|
| `backend/`  | Django + Django REST Framework API, JWT auth, PostgreSQL, `yfinance` |
| `frontend/` | React single-page app built with Vite (React Router, Bootstrap 4)   |

## Project structure

```
.
├── .github/workflows/supabase-keepalive.yml
├── docker-compose.local.yml      # db + backend + frontend (nginx)
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile / start.sh
│   ├── .env.example
│   ├── kbFinance/                # settings, root urls, wsgi/asgi
│   ├── accounts/                 # custom User model + auth API (register/login/logout/me)
│   └── stocks/                   # models, trading/quote API, yfinance helpers, tests
└── frontend/
    ├── package.json / vite.config.js / index.html
    ├── Dockerfile / nginx.conf
    ├── .env.example
    └── src/
        ├── api/client.js         # fetch wrapper: JWT header + automatic token refresh
        ├── auth/AuthContext.jsx  # login / register / logout state
        ├── components/           # Navbar, ProtectedRoute, QuoteLookup, ...
        ├── pages/                # Dashboard, Portfolio, Transactions, Trade, Profile, Login, Register
        └── styles.css            # theme tokens + dark mode
```

## API

All endpoints live under `/api/` and return JSON. Everything except register/login/refresh/health needs an `Authorization: Bearer <access token>` header.

| Method | Path                    | Purpose                                              |
|--------|-------------------------|------------------------------------------------------|
| GET    | `/api/health/`          | Liveness check                                       |
| POST   | `/api/auth/register/`   | Create account + starting wallet, returns tokens     |
| POST   | `/api/auth/login/`      | Returns `access`, `refresh` and the user             |
| POST   | `/api/auth/refresh/`    | Rotate tokens                                        |
| POST   | `/api/auth/logout/`     | Blacklist the refresh token                          |
| GET    | `/api/auth/me/`         | Current user and wallet balance                      |
| GET    | `/api/dashboard/`       | Wallet, portfolio value, net worth, recent trades    |
| GET    | `/api/portfolio/`       | Holdings with live prices and gain/loss              |
| GET    | `/api/transactions/`    | Full trade history                                   |
| GET    | `/api/quote/?symbol=`   | Live quote (also saved to search history)            |
| GET    | `/api/suggestions/?q=`  | Recent / matching symbols                            |
| POST   | `/api/buy/`, `/api/sell/` | `{symbol, quantity, exchange}` (`NSE`, `BSE`, `OTHER`) |

Errors are returned as `{"error": "message"}`.

## Distinctiveness and Complexity

kbFinance is distinct from the course projects because it is not a generic e-commerce storefront, social network, or portfolio tracker with only static data. Instead, it is a stock trading simulator that integrates live market data, supports exchange-aware NSE/BSE symbol resolution, and manages real trading mechanics such as wallet balance validation, average cost tracking, and position liquidation.

The app is a decoupled architecture: a Django REST API secured with short-lived JWT access tokens (with refresh-token rotation and blacklisting) and a separate Vite + React single-page app that handles routing, auth state, and automatic token refresh on the client.

The complexity of kbFinance comes from its multiple interacting models and business rules. The app tracks users, wallets, portfolios, transactions, and search history; computes portfolio value and gain/loss; handles buy and sell order aggregation inside atomic database transactions; and resolves stock symbols across different exchanges using `yfinance`. It also supports both local development and Docker deployment, including PostgreSQL configuration and secure environment management.

## Features

- User registration, login, logout, and profile page
- Wallet balance tracking and cash validation for trades
- Live NSE/BSE quote lookup and exchange-aware symbol resolution
- Buy and sell operations with order validation and transaction logging
- Portfolio summary with market value and gain/loss calculation
- Transaction history listing all completed trades
- Search suggestions and recent search history
- Light / dark theme, responsive layout
- Docker deployment support and local development support

## Technologies

- **Backend:** Python 3, Django, Django REST Framework, SimpleJWT, django-cors-headers, `yfinance`, Whitenoise, Gunicorn, PostgreSQL
- **Frontend:** React, React Router, Vite, Bootstrap 4, Bootstrap Icons
- **Infra:** Docker, Docker Compose, nginx

## Running locally

### 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edit the values; leave POSTGRES_DB empty to use SQLite
python manage.py migrate
python manage.py runserver
```

Run the tests with `python manage.py test`.

### 2. Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so no CORS setup is needed in development. Use `npm run build` to create a production build in `frontend/dist/`.

### Docker (everything at once)

```bash
cp backend/.env.example backend/.env   # set DB_HOST=db and fill in the secrets
docker compose -f docker-compose.local.yml up --build
```

Open `http://localhost:3000`. nginx serves the React build and proxies `/api` to the Django container (also reachable directly on port 8000).

## Configuration

**Backend (`backend/.env`)**

| Variable               | Purpose                                                           |
|------------------------|-------------------------------------------------------------------|
| `SECRET_KEY`           | Django secret key (required in production)                        |
| `DEBUG`                | `true` / `false`                                                  |
| `ALLOWED_HOSTS`        | Comma separated hostnames                                         |
| `CORS_ALLOWED_ORIGINS` | Origin(s) of the frontend when hosted on a different domain       |
| `CSRF_TRUSTED_ORIGINS` | Only needed for the Django admin over HTTPS                       |
| `POSTGRES_*`, `DB_HOST`, `DB_PORT` | PostgreSQL connection; leave `POSTGRES_DB` unset for SQLite |
| `WEB_CONCURRENCY`      | Gunicorn workers                                                  |

**Frontend (`frontend/.env`)**

| Variable            | Purpose                                                                          |
|---------------------|----------------------------------------------------------------------------------|
| `VITE_API_BASE_URL` | Backend URL when the frontend is hosted separately (empty = same origin / proxy) |

## Deploying the two halves separately

- **Backend** (e.g. Render): root directory `backend/`, uses the `Dockerfile` there. Set `ALLOWED_HOSTS` to the API hostname and `CORS_ALLOWED_ORIGINS` to the frontend's URL.
- **Frontend** (e.g. Vercel / Netlify / Render static site): root directory `frontend/`, build command `npm run build`, publish directory `dist`. Set `VITE_API_BASE_URL` to the backend URL and add a rewrite of all routes to `/index.html` so React Router deep links work.

## Usage

- Create a user account or log in (new accounts start with ₹1,000).
- Search for stock tickers and view quotes.
- Use the buy/sell screen to execute trades.
- Monitor portfolio holdings and wallet balance.
- Review past transactions in the history page.

## Notes

- Use the `OTHER` exchange option for non-Indian stock symbols and enter the full yfinance symbol.
- Keep real secrets out of version control; use the `.env.example` files as templates.
- JWTs are stored in `localStorage`; access tokens last 30 minutes and are refreshed automatically.

## Future improvements

- Add frontend tests and end-to-end test coverage.
- Add stock charts and real-time updates.
- Add limit orders and more advanced trade controls.

## Acknowledgements

This repository documents an end-to-end finance web app with local and Docker deployment options.
