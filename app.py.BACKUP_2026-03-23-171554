import os
from typing import Dict, List, Optional, Tuple

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


# ----------------------------
# Config loaders (safe)
# ----------------------------

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


# ----------------------------
# Helpers
# ----------------------------

def _pkg_map(packages: List[Dict]) -> Dict[str, Dict]:
    out: Dict[str, Dict] = {}
    for p in packages or []:
        pid = (p.get("id") or "").strip()
        if pid:
            out[pid] = p
    return out


def _extras_from_package(pkg: Dict) -> Dict:
    # Keep exactly the same semantics you already use
    return {
        "prints": pkg.get("prints"),
        "gif": bool(pkg.get("gif")),
        "boomerang": bool(pkg.get("boomerang")),
        "digital_access": bool(pkg.get("digital_access")),
    }


# ----------------------------
# App factory
# ----------------------------

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

    # Bonus storage (files, not DB)
    app.config["BONUS_ROOT"] = os.path.join(BASE_DIR, "static", "bonus")

    # Ensure DB exists
    db.init_db()

    pkgmap = _pkg_map(packages)

    @app.context_processor
    def inject_globals():
        return {
            "SITE_NAME": app.config["SITE_NAME"],
            "PACKAGES": app.config["PACKAGES"],
        }

    # ----------------- Pages -----------------

    @app.route("/")
    def home():
        return render_template("home.html")

    @app.route("/prepay", methods=["GET", "POST"])
    def prepay():
        return render_template("prepay.html", packages=app.config["PACKAGES"])

    @app.route("/payment/dev-complete", methods=["POST"])
    def payment_dev_complete():
        # Dev-only payment completion (no Square)
        package_id = (request.form.get("package_id") or "").strip()
        pkg = pkgmap.get(package_id)
        if not pkg:
            flash("Unknown package.", "error")
            return redirect(url_for("prepay"))

        ticket_code = models.create_ticket(
            package_id=package_id,
            event_code=app.config["DEFAULT_EVENT_CODE"],
            amount_cents=int(pkg.get("amount_cents") or 0),
            square_order_id=None,
        )
        return redirect(url_for("ticket_view", ticket_code=ticket_code))

    @app.route("/payment/complete")
    def payment_complete():
        # Square redirect return
        order_id = request.args.get("order_id") or request.args.get("sq_order_id")
        if not order_id:
            flash("Payment information missing. Ask the attendant for help.", "error")
            return redirect(url_for("home"))

        info = payments_square.verify_square_payment(order_id)
        if info is None:
            flash(
                "Square integration is not configured yet. This is a test environment.",
                "error",
            )
            return redirect(url_for("home"))

        pkg_id = info["package_id"]
        amount_cents = info["amount_cents"]
        event_code = info.get("event_code") or app.config["DEFAULT_EVENT_CODE"]

        ticket_code = models.create_ticket(
            package_id=pkg_id,
            event_code=event_code,
            amount_cents=amount_cents,
            square_order_id=order_id,
        )
        return redirect(url_for("ticket_view", ticket_code=ticket_code))

    @app.route("/ticket/<ticket_code>")
    def ticket_view(ticket_code: str):
        ticket_code = str(ticket_code).strip()
        ticket = models.get_ticket_by_code(ticket_code)
        if not ticket:
            return render_template(
                "error.html",
                title="Ticket not found",
                message="We couldn't find that code. Please check it and try again.",
            ), 404
        return render_template("ticket.html", ticket=ticket)

    @app.route("/code", methods=["GET", "POST"])
    def enter_code():
        ticket = None
        image_url = None
        package = None

        if request.method == "POST":
            code = (request.form.get("ticket_code") or "").strip()
            ticket = models.get_ticket_by_code(code)
            if not ticket:
                flash("We can't find that code. Check it and try again.", "error")
            else:
                image_url = ticket.get("image_url")
                package = pkgmap.get(ticket.get("package_id"))

        return render_template(
            "enter_code.html",
            ticket=ticket,
            image_url=image_url,
            package=package,
        )

    # ----------------- APIs used by the booth -----------------

    @app.post("/api/create-ticket")
    def api_create_ticket():
        """
        Mirror calls this after Square approval to create a ticket in the website DB.
        """
        data = request.get_json(silent=True) or {}
        package_id = (data.get("package_id") or "").strip()
        amount_cents = int(data.get("amount_cents") or 0)
        event_code = (data.get("event_code") or app.config["DEFAULT_EVENT_CODE"])
        # reference_id currently unused (kept for forward compatibility)
        _reference_id = (data.get("reference_id") or "").strip()

        if not package_id or amount_cents <= 0:
            return jsonify({"ok": False, "error": "missing_package_or_amount"}), 400

        try:
            ticket_code = models.create_ticket(
                package_id=package_id,
                event_code=event_code,
                amount_cents=amount_cents,
                square_order_id=None,
            )
            return jsonify({"ok": True, "ticket_code": ticket_code})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 500

    @app.route("/api/validate", methods=["POST"])
    def api_validate():
        """
        Validate a 6-digit code WITHOUT locking it.
        """
        data = request.get_json(silent=True) or {}
        code = str(data.get("ticket_code", "")).strip()
        if not code:
            return {"valid": False, "reason": "missing_code"}, 400

        ticket = models.get_ticket_by_code(code)
        if not ticket:
            return {"valid": False, "reason": "unknown_code"}, 404

        status = (ticket.get("status") or "").upper()
        if status in ("USED", "REDEEMED"):
            return {"valid": False, "reason": "already_used" if status == "USED" else "already_redeemed"}, 409

        pkg = pkgmap.get(ticket.get("package_id"), {}) or {}
        extras = _extras_from_package(pkg)

        return {
            "valid": True,
            "ticket_code": code,
            "package_id": ticket.get("package_id"),
            "event_code": ticket.get("event_code"),
            "status": ticket.get("status"),
            "amount_cents": ticket.get("amount_cents"),
            "extras": extras,
        }

    @app.route("/api/redeem", methods=["POST"])
    def api_redeem():
        """
        Mirror calls this to validate AND lock the code for use.
        """
        data = request.get_json(silent=True) or {}
        code = str(data.get("ticket_code", "")).strip()
        if not code:
            return {"valid": False, "reason": "missing_code"}, 400

        ticket = models.get_ticket_by_code(code)
        if not ticket:
            return {"valid": False, "reason": "unknown_code"}, 404

        status = (ticket.get("status") or "").upper()
        if status in ("USED", "REDEEMED"):
            return {"valid": False, "reason": "already_used" if status == "USED" else "already_redeemed"}, 409

        ok = models.redeem_ticket_atomic(code)
        if not ok:
            return {"valid": False, "reason": "already_redeemed"}, 409

        ticket = models.get_ticket_by_code(code) or ticket
        pkg = pkgmap.get(ticket.get("package_id"), {}) or {}
        extras = _extras_from_package(pkg)

        return {
            "valid": True,
            "ticket_code": code,
            "package_id": ticket.get("package_id"),
            "event_code": ticket.get("event_code"),
            "status": "REDEEMED",
            "amount_cents": ticket.get("amount_cents"),
            "extras": extras,
        }

    @app.route("/api/session-complete", methods=["POST"])
    def api_session_complete():
        """
        Mirror calls this after a session is finished and photos are ready.
        """
        data = request.get_json(silent=True) or {}
        code = str(data.get("ticket_code", "")).strip()
        session_id = data.get("session_id")
        image_url = data.get("image_url")

        if not code:
            return {"ok": False, "reason": "missing_code"}, 400

        ticket = models.get_ticket_by_code(code)
        if not ticket:
            return {"ok": False, "reason": "unknown_code"}, 404

        models.mark_ticket_used(code, session_id=session_id, image_url=image_url)
        return {"ok": True, "status": "USED"}

    # ----------------- Debug -----------------

    @app.route("/debug/tickets")
    def debug_tickets():
        """
        Simple debug view to see recent tickets.
        """
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

    # ----------------- Bonus Hub (MVP) -----------------

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
        ticket = models.get_ticket_by_code(ticket_code)
        if not ticket:
            return render_template(
                "error.html",
                title="Code not found",
                message="We couldn't find that code.",
            ), 404

        pkg = pkgmap.get(ticket.get("package_id"), {}) or {}
        extras = {
            "gif": bool(pkg.get("gif")),
            "boomerang": bool(pkg.get("boomerang")),
            "digital_access": bool(pkg.get("digital_access")),
        }

        paths = bonus_paths(ticket_code)
        assets = {
            "strip_ready": os.path.exists(paths["strip_fs"]),
            "gif_ready": os.path.exists(paths["gif_fs"]),
            "boomerang_ready": os.path.exists(paths["boomerang_fs"]),
            "strip_url": paths["strip_url"],
            "gif_url": paths["gif_url"],
            "boomerang_url": paths["boomerang_url"],
        }

        # This lets your template show "Online gallery coming soon" safely
        # until the booth/mother starts dropping bonus files.
        return render_template("bonus.html", ticket=ticket, extras=extras, assets=assets)

    @app.post("/api/bonus-status")
    def api_bonus_status():
        data = request.get_json(silent=True) or {}
        code = str(data.get("ticket_code", "")).strip()
        if not code:
            return jsonify({"ok": False, "error": "missing_code"}), 400

        ticket = models.get_ticket_by_code(code)
        if not ticket:
            return jsonify({"ok": False, "error": "unknown_code"}), 404

        paths = bonus_paths(code)
        return jsonify({
            "ok": True,
            "strip_ready": os.path.exists(paths["strip_fs"]),
            "gif_ready": os.path.exists(paths["gif_fs"]),
            "boomerang_ready": os.path.exists(paths["boomerang_fs"]),
            "strip_url": paths["strip_url"],
            "gif_url": paths["gif_url"],
            "boomerang_url": paths["boomerang_url"],
        })

    return app


# Optional local run (systemd ignores this)
if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5001, debug=False)
