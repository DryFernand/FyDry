import calendar
import json
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.financial import Account, Budget, Expense, EmailIntegration, PendingNotification
from app.services.ledger import money, budget_period, LIABILITY_TYPES
from app.schemas.financial import (
    NotificationResponse,
    EmailIntegrationResponse,
    EmailSyncConnectRequest,
    EmailScanResult,
)

router = APIRouter()


def _to_response(n: PendingNotification) -> NotificationResponse:
    try:
        draft = json.loads(n.draft_data) if n.draft_data else {}
    except ValueError:
        draft = {}
    return NotificationResponse(
        id=n.id,
        title=n.title,
        message=n.message,
        source=n.source,
        target_type=n.target_type,
        draft_data=draft,
        is_read=n.is_read,
        is_processed=n.is_processed,
        created_at=n.created_at,
    )


def _active_notifications(db: Session, user_id: str) -> List[NotificationResponse]:
    notifs = db.query(PendingNotification).filter(
        PendingNotification.user_id == user_id,
        PendingNotification.is_dismissed == False,
        PendingNotification.is_processed == False,
    ).order_by(PendingNotification.created_at.desc()).all()
    return [_to_response(n) for n in notifs]


def _get_notification(db: Session, user_id: str, notif_id: str) -> PendingNotification:
    notif = db.query(PendingNotification).filter(
        PendingNotification.id == notif_id,
        PendingNotification.user_id == user_id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada.")
    return notif


# ==========================================
# NOTIFICATIONS CRUD
# ==========================================
@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all active pending notifications & draft transactions."""
    return _active_notifications(db, current_user.id)


@router.put("/notifications/{notif_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notif = _get_notification(db, current_user.id, notif_id)
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return _to_response(notif)


@router.put("/notifications/{notif_id}/process", response_model=NotificationResponse)
def mark_notification_processed(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification draft as converted into real transaction."""
    notif = _get_notification(db, current_user.id, notif_id)
    notif.is_read = True
    notif.is_processed = True
    db.commit()
    db.refresh(notif)
    return _to_response(notif)


@router.delete("/notifications/{notif_id}")
def delete_notification(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dismiss a pending notification without allowing it to regenerate."""
    notif = _get_notification(db, current_user.id, notif_id)
    notif.is_dismissed = True
    notif.is_read = True
    db.commit()
    return {"status": "success", "message": "Notificación descartada permanentemente."}


# ==========================================
# EMAIL SYNC INTEGRATION (lectura de Gmail: próximamente)
# ==========================================
@router.get("/email-sync/status", response_model=Optional[EmailIntegrationResponse])
def get_email_sync_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current email sync integration status."""
    return db.query(EmailIntegration).filter(EmailIntegration.user_id == current_user.id).first()


@router.post("/email-sync/connect", response_model=EmailIntegrationResponse)
def connect_email_sync(
    req: EmailSyncConnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra el correo a sincronizar. No se almacenan tokens de Google hasta que la lectura real esté disponible."""
    integration = db.query(EmailIntegration).filter(EmailIntegration.user_id == current_user.id).first()
    if not integration:
        integration = EmailIntegration(user_id=current_user.id, provider="google")
        db.add(integration)
    integration.email = req.email.strip().lower()
    integration.is_active = True

    db.commit()
    db.refresh(integration)
    return integration


@router.post("/email-sync/disconnect")
def disconnect_email_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disconnect Gmail integration."""
    integration = db.query(EmailIntegration).filter(EmailIntegration.user_id == current_user.id).first()
    if integration:
        db.delete(integration)
        db.commit()

    return {"status": "success", "message": "Integración de correo desvinculada exitosamente."}


@router.post("/email-sync/scan-now", response_model=EmailScanResult)
def scan_emails_now(
    current_user: User = Depends(get_current_user),
):
    """La lectura automática de correos bancarios aún no está disponible; no se generan datos de ejemplo."""
    return EmailScanResult(
        scanned_count=0,
        new_found=0,
        message="La lectura automática de correos bancarios estará disponible próximamente.",
    )


# ==========================================
# MOTOR DE ALERTAS AUTOMÁTICAS (CORTE, PAGO, SOBREGIRO, MÍNIMO, PRESUPUESTO >80%)
# ==========================================
def _day_in_month(year: int, month: int, day: int) -> date:
    return date(year, month, min(day, calendar.monthrange(year, month)[1]))


def _last_cutoff(today: date, cutoff_day: int) -> date:
    """Fecha de corte más reciente (hoy o antes)."""
    this_month = _day_in_month(today.year, today.month, cutoff_day)
    if this_month <= today:
        return this_month
    prev_year, prev_month = (today.year - 1, 12) if today.month == 1 else (today.year, today.month - 1)
    return _day_in_month(prev_year, prev_month, cutoff_day)


@router.post("/notifications/check-alerts", response_model=List[NotificationResponse])
def check_financial_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evalúa las reglas financieras y emite alertas (una por regla y día)."""
    today = date.today()
    today_str = today.isoformat()

    existing_keys = {
        key for (key,) in db.query(PendingNotification.email_message_id).filter(
            PendingNotification.user_id == current_user.id,
            PendingNotification.email_message_id.like(f"alert-%-{today_str}"),
        )
    }

    def emit(key: str, title: str, message: str, target_type: str, draft: dict) -> None:
        alert_key = f"{key}-{today_str}"
        if alert_key in existing_keys:
            return
        existing_keys.add(alert_key)
        db.add(PendingNotification(
            user_id=current_user.id,
            title=title,
            message=message,
            source="system",
            target_type=target_type,
            draft_data=json.dumps(draft),
            email_message_id=alert_key,
        ))

    # 1. Cuentas y tarjetas de crédito
    for acc in db.query(Account).filter(Account.user_id == current_user.id).all():
        balance = money(acc.balance)
        draft = {"account_id": acc.id, "account_name": acc.name, "type": acc.type, "balance": float(balance)}

        if acc.type in LIABILITY_TYPES:
            if acc.cutoff_day:
                cutoff = _last_cutoff(today, acc.cutoff_day)
                next_cutoff = _last_cutoff(today + timedelta(days=1), acc.cutoff_day)
                if cutoff == today or next_cutoff == today + timedelta(days=1):
                    emit(f"alert-cutoff-{acc.id}", f"📅 Día de corte: {acc.name}",
                         f"El corte de tu tarjeta es el {next_cutoff.strftime('%d/%m')}. Revisa tus consumos de este periodo.",
                         "account", draft)
                if acc.grace_days:
                    pay_date = cutoff + timedelta(days=acc.grace_days)
                    if 0 <= (pay_date - today).days <= 2:
                        emit(f"alert-payment-{acc.id}", f"⏰ Fecha límite de pago: {acc.name}",
                             f"El pago de tu tarjeta vence el {pay_date.strftime('%d/%m')}. Paga a tiempo para evitar intereses y mora.",
                             "account", draft)

            credit_limit = money(acc.credit_limit)
            if credit_limit > 0 and balance > credit_limit:
                used = balance - credit_limit
                remaining = max(money(0), money(acc.overdraft_limit) - used)
                emit(f"alert-overdraft-{acc.id}", f"🚨 Alerta de Sobregiro: {acc.name}",
                     f"Tu tarjeta superó el límite por {acc.currency} {used:,.2f}. Margen de sobregiro restante: {acc.currency} {remaining:,.2f}.",
                     "account", draft)
        else:
            if balance < 0:
                emit(f"alert-overdraft-{acc.id}", f"🚨 Saldo negativo: {acc.name}",
                     f"Tu cuenta está en {acc.currency} {balance:,.2f}.", "account", draft)
            min_b = money(acc.min_balance)
            if min_b > 0 and balance <= min_b:
                emit(f"alert-minbal-{acc.id}", f"📉 Saldo mínimo alcanzado: {acc.name}",
                     f"El saldo de tu cuenta ({acc.currency} {balance:,.2f}) bajó de tu mínimo aceptado ({acc.currency} {min_b:,.2f}).",
                     "account", draft)

    # 2. Presupuestos >= 80% en el periodo actual (inicia en el día de reinicio del perfil)
    reset_day = current_user.profile.budget_reset_day if current_user.profile else 1
    start, end = budget_period(today, reset_day)
    spent_by_category = dict(
        db.query(func.lower(Expense.category), func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            Expense.date >= start,
            Expense.date <= end,
        ).group_by(func.lower(Expense.category)).all()
    )
    for b in db.query(Budget).filter(Budget.user_id == current_user.id).all():
        allocated = money(b.allocated_amount)
        if allocated <= 0:
            continue
        spent = money(spent_by_category.get(b.category.strip().lower()))
        pct = spent / allocated * 100
        if pct >= 80:
            emit(f"alert-budget80-{b.id}", f"📊 Presupuesto al {pct:.0f}%: {b.category}",
                 f"Has consumido {spent:,.2f} de tu límite de {allocated:,.2f} ({pct:.0f}%).",
                 "budget", {"budget_id": b.id, "category": b.category, "spent": float(spent), "allocated": float(allocated)})

    db.commit()
    return _active_notifications(db, current_user.id)
