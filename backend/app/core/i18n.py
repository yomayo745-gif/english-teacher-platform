"""
i18n / Internationalization system for Telegram Bot and backend services.
Supports 'uz' (Uzbek), 'en' (English), and 'bi' (Bilingual 50/50).
"""
from typing import Dict, Any, Optional

BOT_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "greeting": {
        "uz": "Assalomu alaykum! 👋\n\nEnglish Teacher platformasiga xush kelibsiz.\n\nQuyidagi panel orqali kerakli bo‘limni tanlang.",
        "en": "Hello and welcome! 👋\n\nWelcome to English Teacher platform.\n\nPlease select the desired section using the panel below.",
        "bi": "Assalomu alaykum! 👋 / Welcome!\n\nEnglish Teacher platformasiga xush kelibsiz.\nWelcome to English Teacher platform.\n\nQuyidagi panel orqali kerakli bo‘limni tanlang. / Please select the desired section below."
    },
    "btn_student_panel": {
        "uz": "🎓 O‘quvchi paneli",
        "en": "🎓 Student Panel",
        "bi": "🎓 O‘quvchi paneli / Student Panel"
    },
    "btn_admin_panel": {
        "uz": "⚙️ Admin paneli",
        "en": "⚙️ Admin Panel",
        "bi": "⚙️ Admin paneli / Admin Panel"
    },
    "access_denied": {
        "uz": "⛔️ Kirish taqiqlangan! Ushbu bo‘lim faqat administratorlar uchun mo‘ljallangan.",
        "en": "⛔️ Access Denied! This section is reserved for administrators only.",
        "bi": "⛔️ Kirish taqiqlangan! / Access Denied! (403 Forbidden)"
    },
    "student_not_found": {
        "uz": "Sizga hali o‘quvchi profili yaratilmagan. O‘qituvchingiz bilan bog‘laning.",
        "en": "No student profile has been created for you yet. Please contact your teacher.",
        "bi": "Sizga hali o‘quvchi profili yaratilmagan. / No student profile found. Please contact your teacher."
    },
    "account_disabled": {
        "uz": "⚠️ Hisobingiz vaqtincha bloklangan. Iltimos, o‘qituvchingiz bilan bog‘laning.",
        "en": "⚠️ Your account is temporarily disabled. Please contact your teacher.",
        "bi": "⚠️ Hisobingiz bloklangan. / Account disabled. Contact your teacher."
    },
    "error_generic": {
        "uz": "Tizimda xatolik yuz berdi. Iltimos, birozdan so‘ng qayta urinib ko‘ring.",
        "en": "A system error occurred. Please try again in a few moments.",
        "bi": "Tizimda xatolik yuz berdi / A system error occurred. Please try again."
    },
    "loading": {
        "uz": "Yuklanmoqda...",
        "en": "Loading...",
        "bi": "Yuklanmoqda... / Loading..."
    },
    "admin_info": {
        "uz": "⚙️ <b>Admin paneli:</b>\n\nPlatformani boshqarish uchun quyidagi havola orqali kiring:\n{url}",
        "en": "⚙️ <b>Admin Panel:</b>\n\nAccess the administration panel via the link below:\n{url}",
        "bi": "⚙️ <b>Admin paneli / Admin Panel:</b>\n\n{url}"
    },
    "student_info": {
        "uz": "🎓 <b>O‘quvchi paneli:</b>\n\nDarslar va uy vazifalarini bajarish uchun quyidagi havola orqali kiring:\n{url}",
        "en": "🎓 <b>Student Panel:</b>\n\nAccess lessons and homework assignments via the link below:\n{url}",
        "bi": "🎓 <b>O‘quvchi paneli / Student Panel:</b>\n\n{url}"
    },
    "local_link_hint": {
        "uz": "Brauzeringizda ochish uchun quyidagi havolani bosing:",
        "en": "Click the link below to open in your browser:",
        "bi": "Brauzerda ochish / Open in browser:"
    },
    "clean_keyboard": {
        "uz": "Eski klaviatura tozalandi ✅",
        "en": "Old keyboard cleared ✅",
        "bi": "Klaviatura tozalandi / Keyboard cleared ✅"
    }
}

def normalize_language_code(code: Optional[str]) -> str:
    """Normalizes Telegram or DB language code to 'uz', 'en', or 'bi'."""
    if not code:
        return "uz"
    c = code.strip().lower()
    if c.startswith("uz"):
        return "uz"
    if c.startswith("en"):
        return "en"
    if c.startswith("bi") or "bilingual" in c:
        return "bi"
    return "uz"

def get_bot_text(key: str, lang_code: Optional[str] = "uz") -> str:
    """Retrieves localized text for the bot."""
    lang = normalize_language_code(lang_code)
    item = BOT_TRANSLATIONS.get(key)
    if not item:
        return key
    return item.get(lang) or item.get("uz") or key
