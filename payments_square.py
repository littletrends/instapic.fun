"""
Square integration helpers.

Right now this is mostly a placeholder so you can test the site
without real payments. Later, your Square AI can modify ONLY this
file to hook into real Square Checkout / Web Payments.
"""

from typing import Optional
import yaml
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_PATH = os.path.join(BASE_DIR, "config_settings.yml")


def _load_settings():
    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_checkout_url_for_package(package_id: str) -> Optional[str]:
    settings = _load_settings()
    mapping = settings.get("SQUARE_CHECKOUT_URLS", {})
    return mapping.get(package_id) or None


def verify_square_payment(order_id: str) -> Optional[dict]:
    """
    Placeholder: in production this should call Square APIs to verify
    the order and determine package_id, amount_cents, event_code, etc.

    For now, return None so /payment/complete can show a friendly
    "not configured" message.
    """
    return None
