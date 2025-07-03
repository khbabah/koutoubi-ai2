#!/bin/bash

# Set Python path
export PYTHONPATH=/Users/khaled/Khaled_ALL/INFO_PROJECTS/GitHub-Khbabah/koutoubi-ai2/koutoubi-backend

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000