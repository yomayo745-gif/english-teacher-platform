import asyncio
import os
import sys
import urllib.request
import json
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings
from app.bot.telegram_bot import get_role_keyboard, is_admin_id, is_https_url

def test_config_urls():
    print(f"settings.BASE_URL: {settings.BASE_URL}")
    print(f"settings.student_url: {settings.student_url}")
    print(f"settings.admin_url: {settings.admin_url}")
    
    assert "localhost" not in settings.student_url.lower(), "Student URL contains localhost"
    assert "127.0.0.1" not in settings.student_url, "Student URL contains 127.0.0.1"
    assert settings.student_url.startswith("https://"), "Student URL is not HTTPS"
    
    assert "localhost" not in settings.admin_url.lower(), "Admin URL contains localhost"
    assert "127.0.0.1" not in settings.admin_url, "Admin URL contains 127.0.0.1"
    assert settings.admin_url.startswith("https://"), "Admin URL is not HTTPS"

def test_student_keyboard_has_native_webapp():
    # Ordinary user ID
    student_tg_id = 999999999
    assert not is_admin_id(student_tg_id), "Student ID should not be recognized as admin"
    
    kb = get_role_keyboard(student_tg_id, lang="uz")
    assert len(kb.inline_keyboard) == 1, f"Expected 1 button row for student, got {len(kb.inline_keyboard)}"
    
    btn = kb.inline_keyboard[0][0]
    print(f"Student Button: text='{btn.text}', web_app={btn.web_app}")
    assert "O‘quvchi" in btn.text or "Talaba" in btn.text
    assert btn.web_app is not None, "Student button MUST have web_app attribute"
    assert btn.web_app.url == settings.student_url
    assert btn.web_app.url.startswith("https://")
    assert "localhost" not in btn.web_app.url

def test_admin_keyboard_has_both_native_webapps():
    # Admin Telegram IDs: 1073079396, 6896779142
    for admin_id in [1073079396, 6896779142]:
        assert is_admin_id(admin_id), f"ID {admin_id} should be admin"
        kb = get_role_keyboard(admin_id, lang="uz")
        assert len(kb.inline_keyboard) == 2, f"Expected 2 button rows for admin {admin_id}, got {len(kb.inline_keyboard)}"
        
        btn_stu = kb.inline_keyboard[0][0]
        btn_adm = kb.inline_keyboard[1][0]
        
        print(f"Admin {admin_id} - Btn 1: text='{btn_stu.text}', web_app={btn_stu.web_app}")
        print(f"Admin {admin_id} - Btn 2: text='{btn_adm.text}', web_app={btn_adm.web_app}")
        
        assert btn_stu.web_app is not None, "Button 1 must have web_app"
        assert btn_stu.web_app.url == settings.student_url
        assert btn_stu.web_app.url.startswith("https://")
        
        assert btn_adm.web_app is not None, "Button 2 must have web_app"
        assert btn_adm.web_app.url == settings.admin_url
        assert btn_adm.web_app.url.startswith("https://")
        assert "localhost" not in btn_adm.web_app.url

def test_telegram_chat_menu_button():
    token = settings.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{token}/getChatMenuButton"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"Telegram getChatMenuButton response: {data}")
        assert data.get("ok") is True
        menu = data.get("result", {})
        assert menu.get("type") == "web_app"
        assert menu.get("web_app", {}).get("url") == settings.student_url
        assert menu.get("web_app", {}).get("url").startswith("https://")

def test_live_tunnel_endpoints():
    student_url = settings.student_url
    admin_url = settings.admin_url
    health_url = f"{settings.BASE_URL}/api/v1/health"
    
    # 1. Health check
    req = urllib.request.Request(health_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200
        health_data = json.loads(resp.read().decode("utf-8"))
        assert health_data.get("status") == "healthy"
        print(f"Live Health Check: {health_data}")

    # 2. Student WebApp HTML
    req = urllib.request.Request(student_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200
        content = resp.read().decode("utf-8")
        assert "<!doctype html>" in content.lower()
        print("Live Student WebApp: 200 OK (HTML loaded)")

    # 3. Admin WebApp HTML
    req = urllib.request.Request(admin_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.status == 200
        content = resp.read().decode("utf-8")
        assert "<!doctype html>" in content.lower()
        print("Live Admin WebApp: 200 OK (HTML loaded)")

if __name__ == "__main__":
    test_config_urls()
    test_student_keyboard_has_native_webapp()
    test_admin_keyboard_has_both_native_webapps()
    test_telegram_chat_menu_button()
    test_live_tunnel_endpoints()
    print("\nALL TELEGRAM WEBAPP AUDIT TESTS PASSED SUCCESSFULLY!")
