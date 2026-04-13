"""
Square integration helpers for Web Payments -> website backend -> MotherPC ticket generation.
"""

from typing import Optional, Dict, Any
import os
import uuid

import requests
import yaml

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_PATH = os.path.join(BASE_DIR, "config_settings.yml")


def _load_settings() -> Dict[str, Any]:
    if not os.path.exists(SETTINGS_PATH):
      return {}
    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data if isinstance(data, dict) else {}


def _setting(name: str, default=None):
    settings = _load_settings()
    return os.environ.get(name) or settings.get(name) or default


def get_checkout_url_for_package(package_id: str) -> Optional[str]:
    settings = _load_settings()
    mapping = settings.get("SQUARE_CHECKOUT_URLS", {})
    return mapping.get(package_id) or None


def _square_base_url() -> str:
    env = str(_setting("SQUARE_ENV", "production")).strip().lower()
    if env == "sandbox":
        return "https://connect.squareupsandbox.com"
    return "https://connect.squareup.com"


def create_payment(
    *,
    source_id: str,
    amount_cents: int,
    idempotency_key: Optional[str] = None,
    verification_token: Optional[str] = None,
    note: Optional[str] = None,
) -> Dict[str, Any]:
    access_token = _setting("SQUARE_ACCESS_TOKEN")
    location_id = _setting("SQUARE_LOCATION_ID")

    if not access_token:
        return {"ok": False, "error": "missing_square_access_token"}
    if not location_id:
        return {"ok": False, "error": "missing_square_location_id"}
    if not source_id:
        return {"ok": False, "error": "missing_source_id"}
    if not amount_cents or int(amount_cents) <= 0:
        return {"ok": False, "error": "invalid_amount_cents"}

    payload: Dict[str, Any] = {
        "source_id": str(source_id),
        "idempotency_key": idempotency_key or str(uuid.uuid4()),
        "amount_money": {
            "amount": int(amount_cents),
            "currency": "AUD",
        },
        "autocomplete": True,
        "location_id": str(location_id),
    }

    if verification_token:
        payload["verification_token"] = str(verification_token)

    if note:
        payload["note"] = str(note)[:500]

    try:
        res = requests.post(
            f"{_square_base_url()}/v2/payments",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=30,
        )
    except Exception as e:
        return {"ok": False, "error": f"square_request_failed: {e}"}

    try:
        data = res.json()
    except Exception:
        data = {"raw_text": res.text}

    if not res.ok:
        return {
            "ok": False,
            "error": "square_payment_failed",
            "status_code": res.status_code,
            "details": data,
        }

    payment = (data or {}).get("payment") or {}
    status = str(payment.get("status") or "").upper()

    if status not in {"COMPLETED", "APPROVED"}:
        return {
            "ok": False,
            "error": f"square_payment_not_completed:{status or 'UNKNOWN'}",
            "details": data,
        }

    return {
        "ok": True,
        "payment_id": payment.get("id"),
        "order_id": payment.get("order_id"),
        "status": status,
        "receipt_url": payment.get("receipt_url"),
        "amount_cents": int(amount_cents),
        "raw": data,
    }


def verify_square_payment(order_id: str) -> Optional[dict]:
    """
    Legacy placeholder kept for compatibility with older flows.
    """
    return None
