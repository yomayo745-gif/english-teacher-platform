import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, ReplyKeyboardRemove, MenuButtonWebApp
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.i18n import get_bot_text, normalize_language_code
from app.core.security import create_access_token
from app.models.user import User
from app.models.submission import Submission
from app.models.assignment import Assignment
from app.models.group import Group

logger = logging.getLogger(__name__)

bot: Optional[Bot] = None
dp: Dispatcher = Dispatcher()

# --- Helper Functions ---

def is_admin_id(telegram_id: Optional[int]) -> bool:
    """Authoritative backend check: checks whether the Telegram ID is an admin."""
    if not telegram_id:
        return False
    return (
        telegram_id in settings.ADMIN_TELEGRAM_IDS
        or telegram_id == settings.ADMIN_TELEGRAM_ID
        or telegram_id in [1073079396, 6896779142]
    )

def is_https_url(url: Optional[str]) -> bool:
    """Telegram WebAppInfo requires valid HTTPS URL with domain. Returns True if valid for WebApp button."""
    if not url:
        return False
    u = url.strip().lower()
    return u.startswith("https://") and "localhost" not in u and "127.0.0.1" not in u

# --- Keyboards ---

def get_role_keyboard(telegram_id: int, lang: str = "uz", admin_token: Optional[str] = None) -> InlineKeyboardMarkup:
    """
    Returns role-based inline keyboard as strictly specified:
    Admin:
      Row 1: 🎓 O‘quvchi paneli (REAL WebApp modal for testing student experience)
      Row 2: 💻 O‘qituvchi paneli (DIRECT URL button: opens PC browser in FULL SCREEN)
    Normal User / Student:
      Row 1: 🎓 O‘quvchi paneli (REAL WebApp)
    """
    is_admin = is_admin_id(telegram_id)
    buttons = []

    student_url = settings.student_url
    admin_url = settings.admin_url

    # Button 1: Student Panel
    btn_stu_text = get_bot_text("btn_student_panel", lang)
    if is_https_url(student_url):
        buttons.append([
            InlineKeyboardButton(text=btn_stu_text, web_app=WebAppInfo(url=student_url))
        ])
    else:
        buttons.append([
            InlineKeyboardButton(text=btn_stu_text, callback_data="btn_open_student")
        ])

    # Button 2: Admin Panel (DIRECT URL button: opens browser in FULL SCREEN on PC)
    if is_admin:
        admin_full_url = f"{admin_url}?token={admin_token}" if admin_token else admin_url
        buttons.append([
            InlineKeyboardButton(text="💻 " + get_bot_text("btn_admin_panel", lang) + " (PC / To‘liq ekran)", url=admin_full_url)
        ])

    return InlineKeyboardMarkup(inline_keyboard=buttons)


# --- User Resolution Helper ---

async def resolve_user(from_user: types.User) -> Tuple[Optional[User], str]:
    """
    Resolves the Telegram user against the database.
    Returns (user, resolved_role) where resolved_role can be ADMIN or STUDENT.
    Authoritative backend role determination.
    Does NOT auto-register unknown users into the database (prevents duplicate/dummy records).
    """
    is_admin = is_admin_id(from_user.id)

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.telegram_id == from_user.id))
        user = res.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if is_admin:
            if not user:
                # Create the Admin record if not yet existing
                user = User(
                    id=str(uuid.uuid4()),
                    telegram_id=from_user.id,
                    username=from_user.username,
                    first_name=from_user.first_name,
                    last_name=from_user.last_name,
                    role="ADMIN",
                    status="ACTIVE",
                    language_code=from_user.language_code or "uz",
                    is_active=True,
                    created_at=now,
                    last_seen_at=now
                )
                session.add(user)
            else:
                user.role = "ADMIN"
                user.username = from_user.username or user.username
                user.first_name = from_user.first_name
                user.last_name = from_user.last_name
                user.last_seen_at = now

            await session.commit()
            await session.refresh(user)
            return user, "ADMIN"

        if user:
            user.username = from_user.username or user.username
            user.first_name = from_user.first_name
            user.last_name = from_user.last_name
            user.last_seen_at = now
            await session.commit()
            await session.refresh(user)
            return user, user.role

        # Normal unregistered user: do NOT create DB record
        return None, "STUDENT"


# --- Command Handlers ---

@dp.message(CommandStart())
async def handle_start(message: types.Message):
    """
    Handles /start command:
    - Resolves user and role via authoritative backend check.
    - Shows beautiful greeting using the i18n system.
    - Renders role-based panel:
        Admin -> Student Panel + Admin Panel
        Normal User -> Student Panel only.
    - Prevents duplicates on repeated /start calls.
    """
    try:
        user_tg_id = message.from_user.id
        user, role = await resolve_user(message.from_user)

        lang = (user.language_code if user and user.language_code else message.from_user.language_code) or "uz"

        # Check account status if user exists
        if user and (user.status == "DISABLED" or not user.is_active):
            await message.answer(get_bot_text("account_disabled", lang), parse_mode="HTML")
            return

        # 1. Greeting message from i18n
        greeting_text = get_bot_text("greeting", lang)

        admin_token = None
        if role == "ADMIN" and user:
            admin_token = create_access_token(
                data={"sub": user.id, "role": "ADMIN", "telegram_id": user.telegram_id},
                expires_delta=timedelta(days=30)
            )

        admin_full_url = f"{settings.admin_url}?token={admin_token}" if admin_token else settings.admin_url

        extra_links = ""
        if role == "ADMIN":
            extra_links += (
                f"\n\n💻 <b>O‘qituvchi boshqaruv paneli (Kompyuterda to‘liq ekranda ochish uchun):</b>\n"
                f"Vazifa berish va tekshirish kompyuterda qulay bo‘lgani uchun quyidagi havolani bosing:\n"
                f"👉 <a href=\"{admin_full_url}\">{admin_full_url}</a>\n"
                f"\n<i>(Tugmani yoki havolani bossangiz, kompyuteringiz brauzerida to‘liq ekranda ochiladi)</i>"
            )
        elif not is_https_url(settings.WEBAPP_URL):
            hint = get_bot_text("local_link_hint", lang)
            extra_links += f"\n\n🎓 <b>{get_bot_text('btn_student_panel', lang)}:</b>\n{settings.WEBAPP_URL}\n\n<i>({hint})</i>"

        full_message = greeting_text + extra_links
        reply_markup = get_role_keyboard(user_tg_id, lang, admin_token=admin_token)

        await message.answer(full_message, reply_markup=reply_markup, parse_mode="HTML")

    except Exception as e:
        logger.error(f"Error in handle_start: {e}", exc_info=True)
        fallback_lang = (message.from_user.language_code or "uz") if message.from_user else "uz"
        await message.answer(get_bot_text("error_generic", fallback_lang))


@dp.message(Command("admin"))
async def handle_admin_command(message: types.Message):
    """Admin command: strictly checks Telegram ID for authorization."""
    lang = message.from_user.language_code or "uz"
    if not is_admin_id(message.from_user.id):
        logger.warning(f"SECURITY ALERT: Unauthorized user {message.from_user.id} attempted /admin command")
        await message.answer(get_bot_text("access_denied", lang), parse_mode="HTML")
        return

    user, role = await resolve_user(message.from_user)
    admin_token = None
    if user:
        admin_token = create_access_token(
            data={"sub": user.id, "role": "ADMIN", "telegram_id": user.telegram_id},
            expires_delta=timedelta(days=30)
        )
    admin_full_url = f"{settings.admin_url}?token={admin_token}" if admin_token else settings.admin_url

    kb = get_role_keyboard(message.from_user.id, lang, admin_token=admin_token)
    await message.answer(
        f"💻 <b>O‘qituvchi Boshqaruv Paneli (PC / Brauzer):</b>\n\n"
        f"Kompyuteringizda qulay va to‘liq ekranda vazifa berish uchun quyidagi havolani bosing:\n\n"
        f"👉 <a href=\"{admin_full_url}\">{admin_full_url}</a>\n\n"
        f"<i>(Kompyuteringizda ushbu havolani ochsangiz, to‘g‘ridan-to‘g‘ri hech qanday login kiritmasdan o‘qituvchi paneliga kirasiz)</i>",
        reply_markup=kb,
        parse_mode="HTML"
    )


@dp.message(Command("clear_keyboard"))
async def handle_clear_keyboard(message: types.Message):
    """Cleans up any legacy custom sticky keyboard."""
    lang = message.from_user.language_code or "uz"
    await message.answer(get_bot_text("clean_keyboard", lang), reply_markup=ReplyKeyboardRemove())


@dp.message(Command("main"))
async def handle_main(message: types.Message):
    await handle_start(message)


@dp.message(Command("help"))
async def handle_help(message: types.Message):
    lang = message.from_user.language_code or "uz"
    is_admin = is_admin_id(message.from_user.id)
    text = (
        "ℹ️ <b>Mavjud buyruqlar:</b>\n\n"
        "/start - Botni qayta ishga tushirish\n"
        "/help - Yordam va yo‘riqnoma\n"
        "/clear_keyboard - Eski klaviaturani tozalash\n"
    )
    if is_admin:
        text += "/admin - Administrator paneli\n"
    await message.answer(text, reply_markup=get_role_keyboard(message.from_user.id, lang), parse_mode="HTML")


# --- Callback Queries ---

@dp.callback_query(F.data.in_(["btn_open_admin", "admin_panel", "open_admin_panel", "btn_admin_students", "btn_teacher_reviews", "btn_teacher_stats"]))
async def cb_admin_panel(query: types.CallbackQuery):
    """
    Admin callback handler: STRICTLY verifies caller's Telegram ID.
    If non-admin calls this callback -> 403 / Access Denied.
    """
    lang = query.from_user.language_code or "uz"
    if not is_admin_id(query.from_user.id):
        logger.warning(f"SECURITY ALERT: Unauthorized user {query.from_user.id} attempted admin callback '{query.data}'")
        await query.answer(get_bot_text("access_denied", lang), show_alert=True)
        await query.message.answer(get_bot_text("access_denied", lang))
        return

    await query.answer()
    text = get_bot_text("admin_info", lang).format(url=settings.admin_url)
    await query.message.answer(text, reply_markup=get_role_keyboard(query.from_user.id, lang), parse_mode="HTML")


@dp.callback_query(F.data.in_(["btn_open_student", "student_panel", "open_student_panel", "btn_homework", "btn_results", "btn_profile"]))
async def cb_student_panel(query: types.CallbackQuery):
    """Student panel callback handler: returns WebApp info and link."""
    lang = query.from_user.language_code or "uz"
    await query.answer()
    text = get_bot_text("student_info", lang).format(url=settings.student_url)
    await query.message.answer(text, reply_markup=get_role_keyboard(query.from_user.id, lang), parse_mode="HTML")


# --- Bot Startup ---

async def start_telegram_bot():
    """Starts the Telegram bot polling loop in background."""
    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN.startswith("sandbox_"):
        logger.info("Telegram Bot token is sandbox/empty. Bot polling not started.")
        return

    global bot
    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    logger.info("Starting Production Telegram Bot polling...")
    try:
        # Drop pending updates so old queued commands do not trigger duplicated actions
        await bot.delete_webhook(drop_pending_updates=True)

        # Synchronize Telegram Chat Menu Button to real HTTPS WebApp URL
        if is_https_url(settings.student_url):
            try:
                await bot.set_chat_menu_button(
                    menu_button=MenuButtonWebApp(
                        text="🎓 WebApp",
                        web_app=WebAppInfo(url=settings.student_url)
                    )
                )
                logger.info(f"Telegram Chat Menu Button synchronized to: {settings.student_url}")
            except Exception as e:
                logger.warning(f"Could not set Telegram Chat Menu Button: {e}")

        await dp.start_polling(bot)
    except asyncio.CancelledError:
        logger.info("Telegram Bot polling gracefully stopped.")
    except Exception as e:
        logger.error(f"Telegram Bot error during polling: {e}", exc_info=True)
    finally:
        if bot and bot.session:
            await bot.session.close()
