import asyncio
import hashlib
import hmac
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
import requests
import resend
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, FastAPI, File, Form, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response as FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field



ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logger = logging.getLogger("atelier")
logging.basicConfig(level=logging.INFO)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
app = FastAPI(title="Atelier Barber API")
api = APIRouter(prefix="/api")

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

# Resend ------------------------------------------------------------------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "")
WEBHOOK_CRON_SECRET = os.environ.get("WEBHOOK_CRON_SECRET", "")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def email_template(title: str, body_html: str, cta_label: str = "", cta_url: str = "") -> str:
    cta_html = ""
    if cta_url and cta_label:
        cta_html = (
            '<p style="margin:28px 0 0;">'
            f'<a href="{cta_url}" style="display:inline-block;padding:12px 24px;background:#d4af37;color:#090909;text-decoration:none;font-weight:700;letter-spacing:0.08em;font-size:12px;">{cta_label}</a>'
            '</p>'
        )
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#090909;padding:40px 20px;font-family:Arial,sans-serif;color:#f7f5f0;">
      <tr><td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#131313;border:1px solid #2c2c2c;max-width:520px;">
          <tr><td style="padding:30px 36px 10px;letter-spacing:0.18em;font-size:11px;color:#d4af37;font-weight:700;">ATELIER BARBER · SÃO PAULO</td></tr>
          <tr><td style="padding:0 36px 20px;"><h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:500;color:#f7f5f0;">{title}</h1></td></tr>
          <tr><td style="padding:0 36px 28px;font-size:14px;line-height:1.7;color:#cfcfcf;">{body_html}{cta_html}</td></tr>
          <tr><td style="padding:20px 36px;border-top:1px solid #2c2c2c;font-size:10px;letter-spacing:0.1em;color:#666;">Atelier Barber · Jardins, São Paulo · atelier.barber</td></tr>
        </table>
      </td></tr>
    </table>
    """


async def send_email(recipient: str, subject: str, html: str) -> None:
    if not RESEND_API_KEY or not recipient:
        logger.info(f"[email dev-mode] to={recipient} subject={subject!r}")
        return
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "subject": subject,
        "html": html,
    }
    if OWNER_EMAIL:
        params["reply_to"] = OWNER_EMAIL
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent id={result.get('id')} to={recipient}")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Resend failed to={recipient}: {exc}")


async def notify_payment_confirmed(booking: dict) -> None:
    user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if not user:
        return
    body = f"""
    <p>Olá, <strong>{user.get('name','')}</strong>!</p>
    <p>Recebemos seu pagamento com sucesso. Seu horário está confirmado:</p>
    <p style="padding:14px 16px;background:#1a1a1a;border-left:3px solid #d4af37;">
      <strong style="color:#f7f5f0;">{booking.get('service','Atendimento')}</strong><br>
      {booking.get('date','')} às {booking.get('time','')} · com <strong>{booking.get('barber_id','').title()}</strong><br>
      Total pago: <strong>R$ {booking.get('price',0)}</strong>
    </p>
    <p>Chegue com 5 minutos de antecedência. Nos vemos em breve.</p>
    """
    await send_email(user["email"], "Reserva confirmada no Atelier Barber", email_template("Pagamento confirmado.", body))


async def notify_cancellation(booking: dict) -> None:
    user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if not user:
        return
    body = f"""
    <p>Olá, <strong>{user.get('name','')}</strong>.</p>
    <p>Seu horário foi cancelado:</p>
    <p style="padding:14px 16px;background:#1a1a1a;border-left:3px solid #d98080;">
      {booking.get('service','Atendimento')} · {booking.get('date','')} às {booking.get('time','')}
    </p>
    <p>Quando quiser remarcar, basta voltar ao app. Estaremos esperando.</p>
    """
    await send_email(user["email"], "Agendamento cancelado · Atelier Barber", email_template("Agendamento cancelado.", body))


async def notify_reminder(booking: dict) -> None:
    user = await db.users.find_one({"user_id": booking["user_id"]}, {"_id": 0})
    if not user:
        return
    body = f"""
    <p>Olá, <strong>{user.get('name','')}</strong>!</p>
    <p>Lembrete amistoso: seu horário é <strong>amanhã</strong>.</p>
    <p style="padding:14px 16px;background:#1a1a1a;border-left:3px solid #d4af37;">
      {booking.get('service','Atendimento')} · {booking.get('date','')} às {booking.get('time','')}<br>
      Com <strong>{booking.get('barber_id','').title()}</strong>
    </p>
    <p>Se precisar remarcar, abra o app com antecedência.</p>
    """
    await send_email(user["email"], "Lembrete: seu horário é amanhã · Atelier Barber", email_template("Até amanhã no Atelier.", body))

# Object storage ------------------------------------------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "https://integrations.emergentagent.com").rstrip("/")
STORAGE_URL = STORAGE_BASE + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "atelier-barber"
_storage_key: str | None = None


def init_storage() -> str | None:
    global _storage_key
    if _storage_key:
        return _storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set; object storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Storage init failed: {exc}")
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(503, "Armazenamento indisponível")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise HTTPException(503, "Armazenamento indisponível")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# Models -------------------------------------------------------------------
class AuthInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = "Cliente Atelier"


class SessionInput(BaseModel):
    session_id: str


class BookingInput(BaseModel):
    barber_id: str
    service: str
    price: float
    date: str
    time: str


class BookingUpdate(BaseModel):
    date: str
    time: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    role: str = "client"
    barber_id: str | None = None
    picture: str | None = None


class CheckoutInput(BaseModel):
    booking_id: str
    origin_url: str


class BarberCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "Barbeiro"
    rating: float = 4.9
    price: float = 90.0
    specialties: list[str] = []
    image: str | None = None


class BarberUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    rating: float | None = None
    price: float | None = None
    specialties: list[str] | None = None
    availability: list[str] | None = None
    image: str | None = None


# Helpers ------------------------------------------------------------------
def password_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


async def issue_session(user_id: str, response: Response) -> str:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
    })
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", path="/", max_age=604800)
    return token


async def current_user(request: Request, session_token: str | None = Cookie(default=None)) -> dict:
    token = session_token or request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Faça login para continuar")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    expires_at = session.get("expires_at") if session else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not session or not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Sessão expirada")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    return user


def require_role(*roles: str):
    async def guard(user: dict = Depends(current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(403, "Acesso restrito")
        return user
    return guard


def clean_user(doc: dict) -> dict:
    return {k: v for k, v in doc.items() if k not in {"_id", "password_hash"}}


# Routes -------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "Atelier Barber API online"}


@api.post("/auth/register", response_model=User)
async def register(data: AuthInput, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": data.email,
            "name": data.name,
            "password_hash": password_hash(data.password),
            "picture": None,
            "role": "client",
            "barber_id": None,
        }
        await db.users.insert_one(user.copy())
    elif user.get("password_hash") != password_hash(data.password):
        raise HTTPException(401, "E-mail ou senha inválidos")
    await issue_session(user["user_id"], response)
    return clean_user(user)


@api.post("/auth/login", response_model=User)
async def login(data: AuthInput, response: Response):
    return await register(data, response)


@api.get("/auth/me", response_model=User)
async def me(user: dict = Depends(current_user)):
    return clean_user(user)


@api.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: str | None = Cookie(default=None)):
    token = session_token or request.headers.get("Authorization", "").replace("Bearer ", "")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@api.post("/auth/google/session", response_model=User)
async def google_session(data: SessionInput, response: Response):
    async with httpx.AsyncClient(timeout=10) as http:
        result = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id},
        )
    if result.status_code != 200:
        raise HTTPException(401, "Não foi possível validar o login Google")
    profile = result.json()
    user = await db.users.find_one({"email": profile["email"]}, {"_id": 0})
    if not user:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": profile["email"],
            "name": profile.get("name", "Cliente Atelier"),
            "picture": profile.get("picture"),
            "role": "client",
            "barber_id": None,
        }
        await db.users.insert_one(user.copy())
    await issue_session(user["user_id"], response)
    return clean_user(user)


# Barbers ------------------------------------------------------------------
@api.get("/barbers")
async def list_barbers():
    docs = await db.barbers.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return docs


@api.get("/barbers/{barber_id}/taken-slots")
async def taken_slots(barber_id: str, date: str):
    cursor = db.appointments.find(
        {"barber_id": barber_id, "date": date, "status": {"$ne": "Cancelado"}},
        {"_id": 0, "time": 1},
    )
    docs = await cursor.to_list(200)
    return {"date": date, "barber_id": barber_id, "taken": sorted({d["time"] for d in docs if d.get("time")})}


@api.get("/barbers/me")
async def get_my_barber(user: dict = Depends(require_role("barber"))):
    doc = await db.barbers.find_one({"barber_id": user["barber_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Perfil de barbeiro não encontrado")
    return doc


@api.patch("/barbers/me")
async def update_my_barber(data: BarberUpdate, user: dict = Depends(require_role("barber"))):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "Nada para atualizar")
    await db.barbers.update_one({"barber_id": user["barber_id"]}, {"$set": update})
    if "name" in update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"name": update["name"]}})
    return await db.barbers.find_one({"barber_id": user["barber_id"]}, {"_id": 0})


@api.post("/barbers/me/photo")
async def upload_my_photo(file: UploadFile = File(...), user: dict = Depends(require_role("barber"))):
    ext = (file.filename or "img.jpg").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        raise HTTPException(400, "Formato de imagem não suportado")
    path = f"{APP_NAME}/barbers/{user['barber_id']}/{uuid.uuid4().hex}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or f"image/{ext}")
    backend_url = os.environ.get("REACT_APP_BACKEND_URL") or ""
    public_url = f"/api/files/{result['path']}"
    await db.barbers.update_one(
        {"barber_id": user["barber_id"]},
        {"$set": {"image": public_url, "storage_path": result["path"]}},
    )
    return {"image": public_url}


@api.get("/files/{path:path}")
async def download_file(path: str):
    data, content_type = get_object(path)
    return FileResponse(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=3600"})


# Admin --------------------------------------------------------------------
@api.get("/admin/barbers")
async def admin_list_barbers(user: dict = Depends(require_role("admin"))):
    return await db.barbers.find({}, {"_id": 0}).to_list(100)


@api.post("/admin/barbers")
async def admin_create_barber(data: BarberCreate, user: dict = Depends(require_role("admin"))):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(400, "E-mail já cadastrado")
    barber_id = f"bb_{uuid.uuid4().hex[:8]}"
    user_doc = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": data.email,
        "name": data.name,
        "password_hash": password_hash(data.password),
        "picture": None,
        "role": "barber",
        "barber_id": barber_id,
    }
    await db.users.insert_one(user_doc.copy())
    barber = {
        "barber_id": barber_id,
        "user_id": user_doc["user_id"],
        "name": data.name,
        "email": data.email,
        "role": data.role,
        "rating": data.rating,
        "price": data.price,
        "specialties": data.specialties,
        "availability": ["09:00", "10:30", "14:00", "16:30"],
        "image": data.image or "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=85",
    }
    await db.barbers.insert_one(barber.copy())
    return barber


@api.delete("/admin/barbers/{barber_id}")
async def admin_delete_barber(barber_id: str, user: dict = Depends(require_role("admin"))):
    barber = await db.barbers.find_one({"barber_id": barber_id})
    if not barber:
        raise HTTPException(404, "Barbeiro não encontrado")
    await db.barbers.delete_one({"barber_id": barber_id})
    await db.users.delete_one({"user_id": barber.get("user_id", "")})
    return {"ok": True}


# Appointments -------------------------------------------------------------
@api.get("/appointments")
async def appointments(user: dict = Depends(current_user)):
    if user.get("role") == "barber":
        return await db.appointments.find({"barber_id": user["barber_id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return await db.appointments.find({"user_id": user["user_id"]}, {"_id": 0}).sort("date", 1).to_list(100)


@api.post("/appointments")
async def create_appointment(data: BookingInput, user: dict = Depends(current_user)):
    conflict = await db.appointments.find_one({
        "barber_id": data.barber_id,
        "date": data.date,
        "time": data.time,
        "status": {"$ne": "Cancelado"},
    })
    if conflict:
        raise HTTPException(409, "Esse horário já foi reservado. Escolha outro.")
    booking = {
        "booking_id": f"book_{uuid.uuid4().hex[:10]}",
        "user_id": user["user_id"],
        "customer_name": user["name"],
        **data.model_dump(),
        "status": "Confirmado",
        "payment_status": "Pendente",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.appointments.insert_one(booking.copy())
    return booking


@api.patch("/appointments/{booking_id}")
async def reschedule(booking_id: str, data: BookingUpdate, user: dict = Depends(current_user)):
    query = {"booking_id": booking_id}
    if user.get("role") != "admin":
        query["user_id"] = user["user_id"]
    result = await db.appointments.update_one(query, {"$set": {"date": data.date, "time": data.time, "status": "Remarcado"}})
    if not result.matched_count:
        raise HTTPException(404, "Agendamento não encontrado")
    return {"ok": True, "status": "Remarcado"}


@api.delete("/appointments/{booking_id}")
async def cancel(booking_id: str, user: dict = Depends(current_user)):
    query = {"booking_id": booking_id}
    if user.get("role") != "admin":
        query["user_id"] = user["user_id"]
    booking = await db.appointments.find_one(query, {"_id": 0})
    if not booking:
        raise HTTPException(404, "Agendamento não encontrado")
    result = await db.appointments.update_one(query, {"$set": {"status": "Cancelado"}})
    if not result.matched_count:
        raise HTTPException(404, "Agendamento não encontrado")
    booking["status"] = "Cancelado"
    asyncio.create_task(notify_cancellation(booking))
    return {"ok": True}


# Payments -----------------------------------------------------------------

class CheckoutSessionRequest(BaseModel):
    amount: float
    currency: str
    success_url: str
    cancel_url: str
    metadata: dict

class DummySession:
    def __init__(self, session_id, url):
        self.session_id = session_id
        self.url = url

class DummyStatus:
    def __init__(self, payment_status, status):
        self.payment_status = payment_status
        self.status = status

class StripeCheckout:
    def __init__(self, **kwargs): pass
    async def create_checkout_session(self, req): return DummySession("mock_sess_" + str(uuid.uuid4()), req.success_url.replace("{CHECKOUT_SESSION_ID}", "mock_sess"))
    async def get_checkout_status(self, session_id): return DummyStatus("paid", "complete")

def stripe_client(request: Request | None = None) -> StripeCheckout:
    host_url = str(request.base_url).rstrip("/") if request else ""
    webhook_url = f"{host_url}/api/webhook/stripe" if host_url else ""
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


@api.post("/payments/checkout")
async def create_checkout(data: CheckoutInput, request: Request, user: dict = Depends(current_user)):
    booking = await db.appointments.find_one({"booking_id": data.booking_id, "user_id": user["user_id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(404, "Agendamento não encontrado")
    if booking.get("payment_status") == "Pago":
        raise HTTPException(400, "Este agendamento já foi pago")

    origin = data.origin_url.rstrip("/")
    checkout = stripe_client(request)
    session_req = CheckoutSessionRequest(
        amount=float(booking["price"]),
        currency="brl",
        success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/payment/cancel",
        metadata={"booking_id": data.booking_id, "user_id": user["user_id"]},
    )
    session = await checkout.create_checkout_session(session_req)

    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "booking_id": data.booking_id,
        "user_id": user["user_id"],
        "amount": float(booking["price"]),
        "currency": "brl",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    return {"checkout_url": session.url, "session_id": session.session_id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Transação não encontrada")
    if record.get("payment_status") != "paid":
        try:
            checkout = stripe_client(request)
            status = await checkout.get_checkout_status(session_id)
            if status.payment_status == "paid" or status.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc),
                    }},
                )
                await db.appointments.update_one(
                    {"booking_id": record["booking_id"]},
                    {"$set": {"payment_status": "Pago"}},
                )
                booking = await db.appointments.find_one({"booking_id": record["booking_id"]}, {"_id": 0})
                if booking:
                    asyncio.create_task(notify_payment_confirmed(booking))
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"Stripe status fallback failed: {exc}")
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
        "booking_id": record.get("booking_id"),
        "amount": record.get("amount"),
    }


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    checkout = stripe_client(request)
    try:
        resp = await checkout.handle_webhook(body, sig)
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Webhook error: {exc}")
        raise HTTPException(400, "Webhook inválido")
    if resp.payment_status in {"paid", "complete"}:
        await db.payment_transactions.update_one(
            {"session_id": resp.session_id, "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc)}},
        )
        booking_id = (resp.metadata or {}).get("booking_id")
        if booking_id:
            await db.appointments.update_one({"booking_id": booking_id}, {"$set": {"payment_status": "Pago"}})
            booking = await db.appointments.find_one({"booking_id": booking_id}, {"_id": 0})
            if booking:
                asyncio.create_task(notify_payment_confirmed(booking))
    return {"status": "ok"}


# Cron: daily reminders --------------------------------------------------
@app.post("/api/cron/reminders")
async def cron_reminders(request: Request, authorization: str | None = Header(default=None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    expected = f"Bearer {WEBHOOK_CRON_SECRET}"
    if not WEBHOOK_CRON_SECRET or not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(401, "Unauthorized")
    asyncio.create_task(_run_daily_reminders())
    return {"status": "accepted"}


async def _run_daily_reminders() -> None:
    try:
        target = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        cursor = db.appointments.find({
            "date": target,
            "status": {"$ne": "Cancelado"},
            "payment_status": "Pago",
            "reminder_sent": {"$ne": True},
        }, {"_id": 0})
        bookings = await cursor.to_list(500)
        for booking in bookings:
            await notify_reminder(booking)
            await db.appointments.update_one(
                {"booking_id": booking["booking_id"]},
                {"$set": {"reminder_sent": True}},
            )
        logger.info(f"Reminders sent for {len(bookings)} bookings on {target}")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Reminder job failed: {exc}")


# Startup ------------------------------------------------------------------
async def seed_admin():
    existing = await db.users.find_one({"email": "admin@atelier.com"})
    if existing:
        return
    await db.users.insert_one({
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": "admin@atelier.com",
        "name": "Equipe Atelier",
        "password_hash": password_hash("admin123"),
        "picture": None,
        "role": "admin",
        "barber_id": None,
    })
    logger.info("Seeded admin user admin@atelier.com")


async def seed_barbers():
    if await db.barbers.count_documents({}) > 0:
        return
    seed = [
        {
            "barber_id": "enzo",
            "name": "Enzo Martins",
            "email": "enzo@atelier.com",
            "role": "Mestre em fades",
            "rating": 4.9,
            "specialties": ["Fade", "Barba clássica"],
            "price": 95,
            "availability": ["09:00", "10:30", "14:00", "16:30"],
            "image": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=85",
        },
        {
            "barber_id": "miguel",
            "name": "Miguel Rocha",
            "email": "miguel@atelier.com",
            "role": "Especialista em tesoura",
            "rating": 4.8,
            "specialties": ["Corte clássico", "Visagismo"],
            "price": 110,
            "availability": ["09:00", "11:00", "15:00", "17:00"],
            "image": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=85",
        },
        {
            "barber_id": "caio",
            "name": "Caio Nunes",
            "email": "caio@atelier.com",
            "role": "Barba & navalha",
            "rating": 5.0,
            "specialties": ["Barba premium", "Hot towel"],
            "price": 85,
            "availability": ["10:00", "12:00", "15:30", "18:00"],
            "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=85",
        },
    ]
    for item in seed:
        user_doc = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": item["email"],
            "name": item["name"],
            "password_hash": password_hash("barber123"),
            "picture": None,
            "role": "barber",
            "barber_id": item["barber_id"],
        }
        await db.users.insert_one(user_doc)
        item["user_id"] = user_doc["user_id"]
        await db.barbers.insert_one(item.copy())
    logger.info("Seeded barbers with login accounts")


@app.on_event("startup")
async def on_startup():
    init_storage()
    await seed_admin()
    await seed_barbers()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
