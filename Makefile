SHELL := /bin/bash

BACKEND_DIR = backend
FRONTEND_DIR = frontend

.PHONY: run backend frontend install

run:
	@trap 'kill 0' SIGINT; \
	(cd $(BACKEND_DIR) && source .venv/bin/activate && export $$(grep -v '^\#' .env | xargs) && uvicorn main:app --reload) & \
	(cd $(FRONTEND_DIR) && npm run dev) & \
	wait

backend:
	cd $(BACKEND_DIR) && source .venv/bin/activate && export $$(grep -v '^\#' .env | xargs) && uvicorn main:app --reload

frontend:
	cd $(FRONTEND_DIR) && npm run dev

install:
	cd $(BACKEND_DIR) && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
	cd $(FRONTEND_DIR) && npm install
