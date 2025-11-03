# Copilot / AI Agent Instructions for managepetro

Goal: Be productive quickly — understand the system architecture, common workflows, and where to edit AI prompts and integrations.

- Big picture
  - Frontend: React app in `frontend/` (dev server: `npm run dev`, local URL: http://localhost:3000).
  - Backend: FastAPI in `backend/` (entry: `backend/main.py`). Protected endpoints use `auth_service`. DB access uses Async SQLAlchemy (see `database.py` and `models/database_models.py`).
  - Data: MySQL started via `backend/docker-compose.yml` (run from `backend/`: `docker compose up -d`).
  - AI: LLM logic centralized in `backend/services/llm_service.py`. Prompts live in `backend/services/prompt_service.py` and `backend/prompts/*.md`.

- Developer workflows (commands you can run)
  - Start DB (from `backend/`): `docker compose up -d`.
  - Create `.env` from `.env.example` and supply keys: WEATHER_API_KEY, TOMTOM_API_KEY, GEMINI_API_KEY, plus JWT settings in `config.py`.
  - Install backend deps: `pip install -r backend/requirements.txt`.
  - Run backend (development): follow README — `fastapi dev main.py` (the project uses FastAPI dev runner in README). Uvicorn might be used elsewhere; `main.py` exposes an Async FastAPI app.
  - Install frontend deps and run: `npm install` then `npm run dev` in `frontend/`.

- Important code patterns and conventions
  - Async SQLAlchemy 2.0 everywhere: use `AsyncSession` (dependency: `get_db_session` from `backend/database.py`). Use `await session.execute(stmt)` and `session.refresh(...)`.
  - Pydantic v2-style models used for request validation (see `RouteRequest`, `TomTomRouteRequest` in `backend/main.py`). Keep `model_config` and Field validators when adding endpoints.
  - AI integration pattern: build standardized data models with `llm_service._get_database_data_sqlalchemy(...)`, create prompt via `PromptService`, then call `_call_llm(...)` which uses `lc_router.get_chat_model` / LangChain. Edit prompts in `backend/services/prompt_service.py` and `backend/prompts/*.md`.
  - Response sanitization: LLM outputs are normalized and sanitized (script tags removed and angle brackets escaped) in `llm_service._call_llm` / `_call_gemini` — preserve this when changing parsing logic.
  - Serializers: API-facing transformations live in `backend/utils/serializers.py` — use these to keep payloads consistent with the frontend.

- Integration & env specifics
  - External services: TomTom routing, Weather API, Google/Anthropic/OpenAI via LangChain. Keys are read from `.env` (see `config.py`).
  - AI model selection: default controlled by env var `DEFAULT_LLM_MODEL` and passed into endpoints via request fields (e.g., `llm_model`).

- Where to edit for common tasks
  - Change AI prompts: `backend/services/prompt_service.py` and `backend/prompts/*` (update prompt text and unit tests if added).
  - Add/modify API endpoints: `backend/main.py` (follow existing `/api/*` and `/auth/*` patterns and use dependency-injected `session` and `get_current_active_user`).
  - Database schema: `backend/db/schema.sql` and SQLAlchemy models in `backend/models/database_models.py`.

- Debugging tips specific to this repo
  - Logs configured in `backend/logging_config.py`; increase log level to debug to inspect LLM responses and SQL queries.
  - When investigating missing DB records, note `llm_service` often logs available IDs for debugging (e.g., when a truck isn't found it lists available trucks).
  - If endpoints behave differently than expected, confirm the sanitize/normalize logic in `llm_service._call_llm` — frontend expects `ai_analysis` to be plain text.

If any section is unclear or you'd like more examples (typical request payloads, example AI prompt text, or a small unit-test template), tell me which part and I will iterate.
