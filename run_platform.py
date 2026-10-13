import os
import sys
import re
import time
import subprocess
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
CLOUDFLARED = os.path.join(ROOT_DIR, "cloudflared.exe")
ENV_PATH = os.path.join(ROOT_DIR, ".env")

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def update_env(domain):
    if not os.path.exists(ENV_PATH):
        return
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r"BASE_URL=https://[^\r\n]+", f"BASE_URL={domain}", content)
    content = re.sub(r"BACKEND_URL=https://[^\r\n]+", f"BACKEND_URL={domain}", content)
    content = re.sub(r"WEBAPP_URL=https://[^\r\n]+", f"WEBAPP_URL={domain}", content)
    content = re.sub(r"STUDENT_WEBAPP_URL=https://[^\r\n]+", f"STUDENT_WEBAPP_URL={domain}/app", content)
    content = re.sub(r"ADMIN_WEBAPP_URL=https://[^\r\n]+", f"ADMIN_WEBAPP_URL={domain}/admin", content)
    content = re.sub(r"ADMIN_PANEL_URL=https://[^\r\n]+", f"ADMIN_PANEL_URL={domain}/admin", content)
    content = re.sub(r'BACKEND_CORS_ORIGINS=\["https://[^"]+"', f'BACKEND_CORS_ORIGINS=["{domain}"', content)

    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    log(f"Updated .env with active domain: {domain}")

def main():
    log("Starting English Teacher Platform Supervisor...")

    # 1. Start FastAPI backend (port 8000)
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND_DIR
    )
    log(f"FastAPI backend started (PID {backend_proc.pid}) on http://127.0.0.1:8000")

    # 2. Start frontend production server (port 5173)
    frontend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "frontend_server:app", "--host", "0.0.0.0", "--port", "5173"],
        cwd=ROOT_DIR
    )
    log(f"Frontend server started (PID {frontend_proc.pid}) on http://0.0.0.0:5173")

    time.sleep(2)

    # 3. Start cloudflared tunnel
    tunnel_proc = subprocess.Popen(
        [CLOUDFLARED, "tunnel", "--url", "http://127.0.0.1:5173"],
        cwd=ROOT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    log(f"Cloudflared tunnel started (PID {tunnel_proc.pid})")

    active_domain = None

    # Stream tunnel output to find trycloudflare.com
    for line in iter(tunnel_proc.stdout.readline, ""):
        sys.stdout.write(line)
        sys.stdout.flush()
        m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
        if m and not active_domain:
            active_domain = m.group(0)
            log("=" * 60)
            log(f"ACTIVE PRODUCTION DOMAIN: {active_domain}")
            log(f"Student WebApp:  {active_domain}/app")
            log(f"Teacher WebApp:  {active_domain}/admin")
            log("=" * 60)
            update_env(active_domain)

    tunnel_proc.wait()
    backend_proc.terminate()
    frontend_proc.terminate()

if __name__ == "__main__":
    main()
