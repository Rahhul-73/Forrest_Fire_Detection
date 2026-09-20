import uvicorn

if __name__ == "__main__":
    print("Starting FireSense Command Center Backend Server on http://0.0.0.0:8000 ...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
