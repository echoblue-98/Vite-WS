#!/usr/bin/env python3

print("Testing backend startup...")

try:
    from fastapi import FastAPI
    print("FastAPI imported successfully")
except ImportError as e:
    print(f"FastAPI import error: {e}")
    exit(1)

try:
    from backend.main import app
    print("Backend app imported successfully")
    print(f"App routes: {[route.path for route in app.routes]}")
except Exception as e:
    print(f"Backend import error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("All imports successful!")
