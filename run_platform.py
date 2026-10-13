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

    # 1. Start frontend production server (port 5173)
    frontend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "frontend_server:app", "--host", "0.0.0.0", "--port", "5173"],
        cwd=ROOT_DIR
    )
    log(f"Frontend server started (PID {frontend_proc.pid}) on http://0.0.0.0:5173")

    time.sleep(1)

    # 2. Start cloudflared tunnel
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

    # Read tunnel output until active_domain is captured
    for line in iter(tunnel_proc.stdout.readline, ""):
        sys.stdout.write(line)
        sys.stdout.flush()
        m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
        if m:
            active_domain = m.group(0)
            break

    if not active_domain:
        log("ERROR: Could not obtain Cloudflare Tunnel domain!")
        tunnel_proc.terminate()
        frontend_proc.terminate()
        return

    log("=" * 60)
    log(f"ACTIVE PRODUCTION DOMAIN: {active_domain}")
    log(f"Student WebApp:  {active_domain}/app")
    log(f"Teacher WebApp:  {active_domain}/admin")
    log("=" * 60)

    # Update .env
    update_env(active_domain)

    # 3. Start FastAPI backend (port 8000) WITH fresh domain in env
    backend_env = os.environ.copy()
    backend_env["BASE_URL"] = active_domain
    backend_env["BACKEND_URL"] = active_domain
    backend_env["WEBAPP_URL"] = active_domain
    backend_env["STUDENT_WEBAPP_URL"] = f"{active_domain}/app"
    backend_env["ADMIN_WEBAPP_URL"] = f"{active_domain}/admin"
    backend_env["ADMIN_PANEL_URL"] = f"{active_domain}/admin"

    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND_DIR,
        env=backend_env
    )
    log(f"FastAPI backend started (PID {backend_proc.pid}) on http://127.0.0.1:8000")

    # Continue streaming tunnel logs in background
    def stream_tunnel():
        for line in iter(tunnel_proc.stdout.readline, ""):
            sys.stdout.write(line)
            sys.stdout.flush()

    t = threading.Thread(target=stream_tunnel, daemon=True)
    t.start()

    try:
        tunnel_proc.wait()
    except KeyboardInterrupt:
        pass
    finally:
        log("Stopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
