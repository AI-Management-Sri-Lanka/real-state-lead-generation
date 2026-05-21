# Backend: FastAPI & AI Lead Generation API

This directory contains the FastAPI application that powers the AI-driven Real Estate Lead Generation platform. It handles API requests, interacts with the database, orchestrates AI services (OpenAI, pgvector), and manages social media scraping (Apify).

## 🚀 Getting Started

Follow these steps to set up your backend development environment, including the database with Docker.

### 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Python 3.10+**: [Download Python](https://www.python.org/downloads/)
*   **pip**: Python package installer (comes with Python)
*   **Docker Desktop**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
    *   **IMPORTANT:** After installation, ensure Docker Desktop is running and stable before proceeding.

### 2. Clone the Repository (if you haven't already)

If you're starting fresh, clone the entire monorepo:

```bash
git clone https://github.com/AsinduDeSilva/real-state-lead-generation.git
cd real-state-lead-generation
git checkout develop # Switch to the development branch
```

### 3. Backend Setup

Navigate into the `Backend` directory:

```bash
cd Backend
```

#### 3.1. Create & Activate Python Virtual Environment

It's crucial to use a virtual environment to manage project dependencies.

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate

# On macOS / Linux:
# source venv/bin/activate
```

#### 3.2. Install Python Dependencies

Install all necessary packages using pip:

```bash
pip install -r requirements.txt
```

#### 3.3. Configure VS Code Python Interpreter

If VS Code is showing import errors (`sqlalchemy`, `asyncpg`, etc.), it's likely using the wrong Python interpreter.

1. Press `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (macOS) to open the Command Palette.
2. Type "Python: Select Interpreter" and press Enter.
3. Select the interpreter that points to your virtual environment (it will usually contain `venv` in its path, e.g., `.\venv\Scripts\python.exe`).

### 4. Database Setup with Docker

We use Docker to run a PostgreSQL database with the `pgvector` extension locally, ensuring everyone on the team has an identical database environment.

#### 4.1. Start the PostgreSQL Database Container

Navigate to the root directory of your entire project (one level up from this `Backend` folder, where `docker-compose.yml` is located).

```bash
cd .. # Go back to the real-state-lead-generation root folder
docker-compose up -d
```

This will download the `ankane/pgvector:latest` image (first time only) and start your database container in the background.

You can verify it's running with `docker ps`.

#### 4.2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.sample .env
```

Open the newly created `.env` file in this `Backend` directory.

Crucially, set your `DATABASE_URL`:

```env
# --- Database Connection ---
# Make sure this matches your docker-compose.yml for username, password, db name
DATABASE_URL=postgresql+asyncpg://your_username:your_password@localhost:5432/real_estate_dev_db

# --- OpenAI API Key ---
OPENAI_API_KEY=sk-... # Replace with your actual OpenAI API key

# --- Apify API Token ---
APIFY_API_TOKEN=apify_... # Replace with your actual Apify API token
```

> [!IMPORTANT]
> Replace `your_username`, `your_password`, `sk-...`, and `apify_...` with your actual credentials. The username, password, and database name for `DATABASE_URL` must match what's in your `docker-compose.yml`.

### 5. Database Migrations (Creating Your Tables)

Alembic is used to manage your database schema. This step creates your users and leads tables in the Docker database.

#### 5.1. Generate the Initial Migration Script

Ensure you are in the `/Backend` directory with your `venv` activated.

```bash
# This command compares your Python models with the empty database
# and generates the SQL statements needed to create your tables.
alembic revision --autogenerate -m "Create initial user and lead tables"
```

A new Python file will be created in `alembic/versions/` (e.g., `xxxxxxxxxxxx_create_initial_user_and_lead_tables.py`).

#### 5.2. Apply the Migration to Your Database

```bash
# This command executes the generated migration script against your
# running Docker PostgreSQL database, creating the actual tables.
alembic upgrade head
```

You should see output confirming the upgrade.

**Verification (Optional):** You can use a database tool like DBeaver or pgAdmin (connect to `localhost:5432` with your `docker-compose.yml` credentials) to confirm the `users` and `leads` tables now exist in `real_estate_dev_db`.

### 6. Running the FastAPI Application

Once all the above steps are complete, you can start your FastAPI server:

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000.

You can access the interactive API documentation (Swagger UI) at http://localhost:8000/docs.
