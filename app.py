import os
from typing import Dict, List
import uuid

import requests
import yaml
from flask import (
    Flask,
    render_template,
    redirect,
    url_for,
    request,
    flash,
    jsonify,
)

from . import db, models, payments_square

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGES_PATH = os.path.join(BASE_DIR, "config_packages.yml")
SETTINGS_PATH = os.path.join(BASE_DIR, "config_settings.yml")


def _safe_load_yaml(path: str) -> Dict:
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        return {}
    return data


def load_packages() -> List[Dict]:
    data = _safe_load_yaml(PACKAGES_PATH)
    pkgs = data.get("PACKAGES", [])
    return pkgs if isinstance(pkgs, list) else []


def load_settings() -> Dict:
    return _safe_load_yaml(SETTINGS_PATH)


def _pkg_map(packages: List[Dict]) -> Dict[str, Dict]:
    out: Dict[str, Dict] = {}
    for p in packages or []:
        pid = (p.get("id") or "").strip()
        if pid:
            out[pid] = p
    return out


def _extras_from_package(pkg: Dict) -> Dict:
    return {
        "prints": pkg.get("prints"),
        "gif": bool(pkg.get("gif")),
        "boomerang": bool(pkg.get("boomerang")),
        "digital_access": bool(pkg.get("digital_access")),
    }


def _setting(settings: Dict, name: str, default=None):
    return os.environ.get(name) or settings.get(name) or default


def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    settings = load_settings()
    packages = load_packages()

    app.config["SECRET_KEY"] = settings.get("SECRET_KEY", "change-me")
    app.config["DEFAULT_EVENT_CODE"] = settings.get("DEFAULT_EVENT_CODE", "GLOBAL_EVENT")
    app.config["SITE_NAME"] = settings.get("SITE_NAME", "Instapic")
    app.config["PACKAGES"] = packages
    app.config["BONUS_ROOT"] = os.path.join(BASE_DIR, "static", "bonus")

    db.init_db()
    pkgmap = _pkg_map(packages)

    @app.context_processor
    def inject_globals():
        return {
            "SITE_NAME": app.config["SITE_NAME"],
            "PACKAGES": app.config["PACKAGES"],
        }

    @app.route("/")
    def home():
        return render_template("home.html")

    @app.route("/prepay", methods=["GET", "POST"])
    def prepay():
        return render_template("prepay.html", packages=app.config["PACKAGES"])

    @app.route("/payment/dev-complete", methods=["POST"])
    def payment_dev_complete():
        flash("Website dev payment route is retired. Please use the Prepay page.", "error")
        return redirect(url_for("prepay"))

    @app.route("/payment/complete")
    def payment_complete():
        flash("Website Square return is not active in bridge mode yet.", "error")
        return redirect(url_for("prepay"))

    @app.route("/ticket/<ticket_code>")
    def ticket_view(ticket_code: str):
        ticket_code = str(ticket_code).strip()
        return redirect(url_for("ticket_page", code=ticket_code))

    @app.route("/ticket")
    def ticket_page():
        return render_template("ticket.html")

    @app.route("/code", methods=["GET"])
    def enter_code():
        return render_template("enter_code.html")

    @app.post("/api/create-ticket")
    def api_create_ticket():
        return jsonify({
            "ok": False,
            "error": "local_create_ticket_disabled_use_motherpc"
        }), 410

    @app.post("/api/pay-and-create-ticket")
    def api_pay_and_create_ticket():
        payload = request.get_json(silent=True) or {}

        package_id = str(payload.get("package_id") or "").strip()
        source_id = str(payload.get("source_id") or "").strip()
        verification_token = payload.get("verification_token")
        event_code = str(payload.get("event_code") or app.config["DEFAULT_EVENT_CODE"]).strip()
        requested_amount = int(payload.get("amount_cents") or 0)

        if not package_id:
            return jsonify({"ok": False, "error": "missing_package_id"}), 400
        if not source_id:
            return jsonify({"ok": False, "error": "missing_source_id"}), 400

        pkg = pkgmap.get(package_id)
        if not pkg:
            return jsonify({"ok": False, "error": "unknown_package_id"}), 400

        configured_amount = int(pkg.get("price_cents") or pkg.get("amount_cents") or requested_amount or 0)
        if configured_amount <= 0:
            return jsonify({"ok": False, "error": "invalid_package_amount"}), 400

        if requested_amount and requested_amount != configured_amount:
            return jsonify({
                "ok": False,
                "error": "amount_mismatch",
                "expected_amount_cents": configured_amount,
                "received_amount_cents": requested_amount,
            }), 400

        pay_result = payments_square.create_payment(
            source_id=source_id,
            amount_cents=configured_amount,
            idempotency_key=str(uuid.uuid4()),
            verification_token=verification_token,
            note=f"Instapic {package_id}",
        )

        if not pay_result.get("ok"):
            return jsonify(pay_result), 402

        motherpc_create_ticket_url = _setting(settings, "MOTHERPC_CREATE_TICKET_URL")
        if not motherpc_create_ticket_url:
            return jsonify({
                "ok": False,
                "error": "missing_motherpc_create_ticket_url",
                "payment_id": pay_result.get("payment_id"),
            }), 500

        mother_payload = {
            "package_id": package_id,
            "amount_cents": configured_amount,
            "source": "website_square",
            "event_code": event_code,
            "reference_id": pay_result.get("payment_id"),
            "extras": _extras_from_package(pkg),
        }

        try:
            mother_res = requests.post(
                motherpc_create_ticket_url,
                json=mother_payload,
                timeout=30,
            )
        except Exception as e:
            return jsonify({
                "ok": False,
                "error": f"motherpc_request_failed: {e}",
                "payment_id": pay_result.get("payment_id"),
            }), 502

        try:
            mother_data = mother_res.json()
        except Exception:
            mother_data = {"raw_text": mother_res.text}

        if not mother_res.ok or mother_data.get("ok") is False:
            return jsonify({
                "ok": False,
                "error": mother_data.get("error") or mother_data.get("reason") or f"motherpc_http_{mother_res.status_code}",
                "payment_id": pay_result.get("payment_id"),
                "motherpc": mother_data,
            }), 502

        ticket_code = mother_data.get("ticket_code") or mother_data.get("code")
        if not ticket_code:
            return jsonify({
                "ok": False,
                "error": "motherpc_missing_ticket_code",
                "payment_id": pay_result.get("payment_id"),
                "motherpc": mother_data,
            }), 502

        return jsonify({
            "ok": True,
            "ticket_code": str(ticket_code),
            "payment_id": pay_result.get("payment_id"),
            "order_id": pay_result.get("order_id"),
        })

    @app.route("/api/validate", methods=["POST"])
    def api_validate():
        return jsonify({
            "valid": False,
            "reason": "local_validate_disabled_use_motherpc"
        }), 410

    @app.route("/api/redeem", methods=["POST"])
    def api_redeem():
        return jsonify({
            "valid": False,
            "reason": "local_redeem_disabled_use_motherpc"
        }), 410

    @app.route("/api/session-complete", methods=["POST"])
    def api_session_complete():
        return jsonify({
            "ok": False,
            "reason": "local_session_complete_disabled_use_motherpc"
        }), 410

    @app.route("/debug/tickets")
    def debug_tickets():
        try:
            limit = int(request.args.get("limit", 50))
        except ValueError:
            limit = 50

        with db.db_cursor() as cur:
            cur.execute(
                """
                SELECT ticket_code, package_id, event_code, amount_cents,
                       status, created_at
                FROM tickets
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cur.fetchall()

        tickets = [dict(r) for r in rows]
        for t in tickets:
            pkg = pkgmap.get(t.get("package_id"))
            t["package_name"] = (pkg.get("name") if pkg else t.get("package_id"))
            t["amount_dollars"] = (t.get("amount_cents") or 0) / 100.0

        return render_template("debug_tickets.html", tickets=tickets, limit=limit)

    def bonus_paths(code: str) -> Dict[str, str]:
        root = app.config["BONUS_ROOT"]
        folder = os.path.join(root, code)
        return {
            "folder": folder,
            "strip_fs": os.path.join(folder, "strip.jpg"),
            "gif_fs": os.path.join(folder, "gif.gif"),
            "boomerang_fs": os.path.join(folder, "boomerang.mp4"),
            "strip_url": f"/static/bonus/{code}/strip.jpg",
            "gif_url": f"/static/bonus/{code}/gif.gif",
            "boomerang_url": f"/static/bonus/{code}/boomerang.mp4",
        }

    @app.route("/bonus/<ticket_code>")
    def bonus(ticket_code: str):
        ticket_code = str(ticket_code).strip()
        return redirect(url_for("bonus_page", code=ticket_code))

    @app.route("/bonus")
    def bonus_page():
        return render_template("bonus.html")

    @app.post("/api/bonus-status")
    def api_bonus_status():
        return jsonify({
            "ok": False,
            "error": "local_bonus_status_disabled_use_motherpc"
        }), 410

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5001, debug=False)
