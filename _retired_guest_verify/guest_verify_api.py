#!/usr/bin/env python3
import json
import os
import random
import time
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

PENDING_FILE = DATA_DIR / "guest_verifications.json"
PROFILES_FILE = DATA_DIR / "guest_profiles.json"

VERIFY_CODE_TTL_SECONDS = 15 * 60  # 15 minutes

SMS_MODE = os.environ.get("INSTAPIC_SMS_MODE", "console").strip().lower()
SMS_FROM = os.environ.get("INSTAPIC_SMS_FROM", "").strip()

app = Flask(__name__)
CORS(app)


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(path: Path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in str(phone or "") if ch.isdigit())
    if digits.startswith("61") and len(digits) >= 11:
        return "+" + digits
    if digits.startswith("0") and len(digits) == 10:
        return "+61" + digits[1:]
    if digits.startswith("4") and len(digits) == 9:
        return "+61" + digits
    return "+" + digits if digits else ""


def make_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def send_sms(phone: str, code: str):
    # Safe starter mode: log to console until provider creds are added.
    # Later we can replace this with Twilio / MessageBird / etc.
    msg = f"[instapic guest verify] phone={phone} code={code}"
    print(msg, flush=True)

    if SMS_MODE == "console":
        return {"ok": True, "mode": "console"}

    return {"ok": False, "error": "sms_provider_not_configured"}


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "guest_verify_api"})


@app.post("/api/guest/start-verification")
def start_verification():
    payload = request.get_json(silent=True) or {}
    raw_phone = str(payload.get("phone") or "").strip()
    phone = normalize_phone(raw_phone)

    if not phone:
        return jsonify({"ok": False, "error": "missing_phone"}), 400

    code = make_code()
    now = int(time.time())

    pending = load_json(PENDING_FILE, {})
    pending[phone] = {
        "phone": phone,
        "code": code,
        "created_at": now,
        "expires_at": now + VERIFY_CODE_TTL_SECONDS,
        "verified": False,
    }
    save_json(PENDING_FILE, pending)

    sms_result = send_sms(phone, code)
    if not sms_result.get("ok"):
        return jsonify({
            "ok": False,
            "error": sms_result.get("error", "sms_send_failed"),
        }), 502

    return jsonify({
        "ok": True,
        "phone": phone,
        "mode": sms_result.get("mode", "unknown"),
    })


@app.post("/api/guest/verify-code")
def verify_code():
    payload = request.get_json(silent=True) or {}
    raw_phone = str(payload.get("phone") or "").strip()
    code = str(payload.get("code") or "").strip()

    phone = normalize_phone(raw_phone)

    if not phone:
        return jsonify({"ok": False, "error": "missing_phone"}), 400
    if not code or not code.isdigit():
        return jsonify({"ok": False, "error": "invalid_code"}), 400

    pending = load_json(PENDING_FILE, {})
    rec = pending.get(phone)
    now = int(time.time())

    if not rec:
        return jsonify({"ok": False, "error": "verification_not_found"}), 404
    if now > int(rec.get("expires_at") or 0):
        return jsonify({"ok": False, "error": "verification_expired"}), 410
    if str(rec.get("code")) != code:
        return jsonify({"ok": False, "error": "verification_code_mismatch"}), 401

    rec["verified"] = True
    rec["verified_at"] = now
    pending[phone] = rec
    save_json(PENDING_FILE, pending)

    profiles = load_json(PROFILES_FILE, {})
    profile = profiles.get(phone, {
        "phone": phone,
        "created_at": now,
        "sessions": [],
    })
    profile["last_verified_at"] = now
    profiles[phone] = profile
    save_json(PROFILES_FILE, profiles)

    return jsonify({
        "ok": True,
        "phone": phone,
        "guest_profile": profile,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5051, debug=False)
