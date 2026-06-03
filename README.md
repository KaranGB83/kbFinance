# kbFinance — finance app by kb

## Live demo
- **App**: [kbFinance on Render](https://kbfinance.onrender.com)
- **Repository**: [GitHub Repo](https://github.com/KaranGB83/kbFinance)
- **Video Demo**: [YouTube Video](https://youtu.be/fFUXlzn7RlQ)

## Project Overview

kbFinance is a stock trading simulator that lets users buy and sell stocks, manage a portfolio, and monitor wallet balance across NSE/BSE markets. The application uses live stock quotes to validate trades, calculate portfolio value, and log transaction history.

The backend is built with Django, and the app includes an embedded React buy/sell interface component. It supports deployment with Docker and PostgreSQL while also allowing local Python development.

## Project structure

```
.
├── .dockerignore
├── .env
├── .env.example
├── .git
├── .gitignore
├── Dockerfile
├── README.md
├── db.sqlite3
├── docker-compose.local.yml
├── manage.py
├── requirements.txt
├── start.sh
├── accounts/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   │   ├── __init__.py
│   │   └── 0001_initial.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   ├── views.py
│   ├── static/accounts/
│   └── templates/accounts/
├── kbFinance/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── stocks/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── migrations/
    │   ├── __init__.py
    │   ├── 0001_initial.py
    │   └── 0002_searchhistory.py
    ├── models.py
    ├── tests.py
    ├── urls.py
    ├── util.py
    ├── views.py
    ├── static/stocks/
    │   ├── buysell.js
    │   ├── scripts.js
    │   └── styles.css
    └── templates/stocks/
        ├── buysell.html
        ├── index.html
        ├── layout.html
        ├── portfolio.html
        └── transactions.html
```

## File descriptions

- `.dockerignore`: Docker ignore rules for the build context.
- `.env`: deployment/local environment variables for Django and Docker.
- `.env.example`: sample environment variable template for creating a local `.env` file.
- `.git`: Git metadata and repository history.
- `.gitignore`: files excluded from version control.
- `Dockerfile`: instructions to build the Docker image for the app.
- `README.md`: project documentation and usage instructions.
- `db.sqlite3`: local SQLite database file used for development.
- `docker-compose.local.yml`: local Docker Compose service definitions for web and database.
- `manage.py`: Django management command launcher.
- `requirements.txt`: Python package requirements for the project.
- `start.sh`: Docker entrypoint script used to launch Gunicorn.
- `accounts/__init__.py`: package marker for the accounts app.
- `accounts/admin.py`: registers account-related models with Django admin.
- `accounts/apps.py`: Django app configuration for accounts.
- `accounts/migrations/__init__.py`: migrations package marker.
- `accounts/migrations/0001_initial.py`: initial database migration for accounts.
- `accounts/models.py`: custom user model and related account models.
- `accounts/tests.py`: placeholder for account app tests.
- `accounts/urls.py`: authentication-related URL routes.
- `accounts/views.py`: login, logout, register, and profile views.
- `accounts/static/accounts/`: static assets for account templates.
- `accounts/templates/accounts/`: HTML templates for auth-related pages.
- `kbFinance/__init__.py`: package marker for the Django project.
- `kbFinance/asgi.py`: ASGI application entrypoint.
- `kbFinance/settings.py`: Django configuration and environment settings.
- `kbFinance/urls.py`: root URL router for the Django project.
- `kbFinance/wsgi.py`: WSGI application entrypoint.
- `stocks/__init__.py`: package marker for the stocks app.
- `stocks/admin.py`: registers stock-related models with Django admin.
- `stocks/apps.py`: Django app configuration for stocks.
- `stocks/migrations/__init__.py`: migrations package marker.
- `stocks/migrations/0001_initial.py`: initial database migration for stocks.
- `stocks/migrations/0002_searchhistory.py`: adds search history model migration.
- `stocks/models.py`: models for stocks, portfolio, wallet, transactions, and search history.
- `stocks/tests.py`: placeholder for stocks app tests.
- `stocks/urls.py`: URL routing for stock pages and APIs.
- `stocks/util.py`: symbol resolution and stock quote helper functions.
- `stocks/views.py`: dashboard, portfolio, trade, quote, and suggestion views.
- `stocks/static/stocks/buysell.js`: React-based buy/sell interface.
- `stocks/static/stocks/scripts.js`: client-side JavaScript for stock search and page behavior.
- `stocks/static/stocks/styles.css`: CSS styles for stocks pages.
- `stocks/templates/stocks/buysell.html`: trade page template with React mount node.
- `stocks/templates/stocks/index.html`: main dashboard template.
- `stocks/templates/stocks/layout.html`: shared base template.
- `stocks/templates/stocks/portfolio.html`: portfolio summary template.
- `stocks/templates/stocks/transactions.html`: transaction history template.

## Distinctiveness and Complexity

kbFinance is distinct from the course projects because it is not a generic e-commerce storefront, social network, or portfolio tracker with only static data. Instead, it is a stock trading simulator that integrates live market data, supports exchange-aware NSE/BSE symbol resolution, and manages real trading mechanics such as wallet balance validation, average cost tracking, and position liquidation.

This project combines traditional Django server-rendered pages with an embedded React trading experience. The buy/sell interface uses JWT-authenticated API calls, while the rest of the site remains classic Django with template rendering, demonstrating a hybrid front-end/back-end architecture.

The complexity of kbFinance comes from its multiple interacting models and business rules. The app tracks users, wallets, portfolios, transactions, and search history; computes portfolio value and gain/loss; handles buy and sell order aggregation; and resolves stock symbols across different exchanges using `yfinance`. It also supports both local Python development and Docker deployment, including PostgreSQL configuration and secure environment management.

## Features

- User registration, login, logout, and profile management
- Wallet balance tracking and cash validation for trades
- Live NSE/BSE quote lookup and exchange-aware symbol resolution
- Buy and sell operations with order validation and transaction logging
- Portfolio summary with market value and gain/loss calculation
- Transaction history listing all completed trades
- Search suggestions and recent search history
- Docker deployment support and local Python development support

## Technologies

- Python 3 / Django
- Django REST Framework
- PostgreSQL-ready database configuration
- `yfinance` for stock quotes and symbol lookup
- React for the buy/sell trading UI component
- HTML, CSS, and JavaScript
- Whitenoise for static asset serving

## Installation

### Local Python development

1. Clone the repository:
   ```bash
   git clone https://github.com/KaranGB83/kbFinance.git
   cd kbFinance
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and update the values for your environment:
   ```bash
   cp .env.example .env
   ```
5. Update `.env` with values for:
   - `SECRET_KEY`
   - `DEBUG`
   - `ALLOWED_HOSTS`
   - `CSRF_TRUSTED_ORIGINS`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `DB_HOST`
   - `DB_PORT`
   - `WEB_CONCURRENCY`
6. Run migrations:
   ```bash
   python manage.py migrate
   ```
7. Start the development server:
   ```bash
   python manage.py runserver
   ```
   ```bash
   python manage.py migrate
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Docker deployment

1. Start the Docker Compose stack:
   ```bash
   docker compose -f docker-compose.local.yml up --build
   ```
2. This launches:
   - `db` service running PostgreSQL
   - `web` service running Django on port `8000`
3. Visit `http://localhost:8000` in your browser.

## Usage

- Create a user account or log in.
- Search for stock tickers and view quotes.
- Use the buy/sell screen to execute trades.
- Monitor portfolio holdings and wallet balance.
- Review past transactions in the history page.

## Notes

- Use the `OTHER` exchange option for non-Indian stock symbols.
- Use `.env.example` to create your own `.env` file and keep production secrets out of version control.
- `db.sqlite3` is included for quick local development, while Docker uses PostgreSQL.

## Future improvements

- Add a dedicated standalone React frontend.
- Add API and end-to-end test coverage.
- Add stock charts and real-time updates.
- Add limit orders and more advanced trade controls.

## Acknowledgements

This repository documents an end-to-end finance web app with local and Docker deployment options.



