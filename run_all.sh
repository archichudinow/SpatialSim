#!/bin/bash

# Run backend in background
cd backend
../.venv/bin/python -m uvicorn main:app --reload &

# Run frontend in background
cd ../frontend
npm run dev &