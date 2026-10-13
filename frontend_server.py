import os
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Frontend Production Server")

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "dist"))
ASSETS_DIR = os.path.join(DIST_DIR, "assets")
BACKEND_URL = "http://127.0.0.1:8000"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

client = httpx.AsyncClient(base_url=BACKEND_URL, timeout=60.0)

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy_api(path: str, request: Request):
    content = await request.body()
    url = f"/api/{path}"
    if request.url.query:
        url += f"?{request.url.query}"
    
    headers = dict(request.headers)
    headers.pop("host", None)
    
    try:
        rp = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=content
        )
        return Response(
            content=rp.content,
            status_code=rp.status_code,
            headers=dict(rp.headers)
        )
    except Exception as e:
        return Response(content=f'{{"detail": "Proxy error: {str(e)}"}}', status_code=502, media_type="application/json")

@app.api_route("/static/uploads/{path:path}", methods=["GET", "HEAD"])
async def proxy_uploads(path: str, request: Request):
    url = f"/static/uploads/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    try:
        rp = await client.request(method=request.method, url=url, headers=headers)
        return Response(content=rp.content, status_code=rp.status_code, headers=dict(rp.headers))
    except Exception as e:
        return Response(content=str(e), status_code=502)

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = os.path.join(DIST_DIR, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(DIST_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("frontend_server:app", host="0.0.0.0", port=5173)
