import os
from typing import Dict, List

from flask import (
    Flask,
    render_template,
    redirect,
    url_for,
    request,
    flash,
    jsonify,
)
import yaml

from . import db, models, payments_square

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGES_PATH = os.path.join(BASE_DIR, "config_packages.yml")
SETTINGS_PATH = os.path.join(BASE_DIR, "config_settings.yml")


def load_packages() -> List[Dict]:
    with open(PACKAGES_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("PACKAGES", [])


def load_settings() -> Dict:
    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def create_app():
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    settings = load_settings()
    app.config["SECRET_KEY"] = settings.get("SECRET_KEY", "change-me")
    app.config["DEFAULT_EVENT_CODE"] = settings.get(
        "DEFAULT_EVENT_CODE", "GLOBAL_EVENT"
    )

    app.config["PACKAGES"] = load_packages()
    app.config["SITE_NAME"] = settings.get("SITE_NAME", "Instapic")

    # Ensure DB exists
    db.init_db()

    @app.context_processor
    def inject_globals():
        return {
            "SITE_NAME": app.config["SITE_NAME"],
            "PACKAGES": app.config["PACKAGES"],
        }

    # ----------------- Routes -----------------

    @app.route("/")
    def home():
        return render_template("home.html")

    @app.route("/prepay", methods=["GET", "POST"])
    def prepay():
        packages = app.config["PACKAGES"]
        return render_template("prepay.html", packages=packages)

    @app.route("/payment/dev-complete", methods=["POST"])
    def payment_dev_complete():
        package_id = request.form.get("package_id")
        packages = {p["id"]: p for p in app.config["PACKAGES"]}
        pkg = packages.get(package_id)
        if not pkg:
            flash("Unknown package.", "error")
            return redirect(url_for("prepay"))

        default_event = app.config["DEFAULT_EVENT_CODE"]
        ticket_code = models.create_ticket(
            package_id=package_id,
            event_code=default_event,
            amount_cents=pkg["amount_cents"],
            square_order_id=None,
        )
        return redirect(url_for("ticket_view", ticket_code=ticket_code))

    @app.route("/payment/complete")
    def payment_complete():
        order_id = request.args.get("order_id") or request.args.get("sq_order_id")
        if not order_id:
            flash("Payment information missing. Ask the attendant for help.", "error")
            return redirect(url_for("home"))

        info = payments_square.verify_square_payment(order_id)
        if info is None:
            flash(
                "Square integration is not configured yet. "
                "This is a test environment.",
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
    def ticket_view(ticket_code):
        ticket = models.get_ticket_by_code(ticket_code)
        if not ticket:
            return render_template(
                "error.html",
                title="Ticket not found",
                message="We couldn't find that code. Please check it and try again.",
            )
        return render_template("ticket.html", ticket=ticket)

    @app.route("/code", methods=["GET", "POST"])
    def enter_code():
        ticket = None
        image_url = None
        package = None

        pkg_map = {p["id"]: p for p in app.config["PACKAGES"]}

        if request.method == "POST":
            code = request.form.get("ticket_code", "").strip()
            ticket = models.get_ticket_by_code(code)
            if not ticket:
                flash("We can't find that code. Check it and try again.", "error")
            else:
                image_url = ticket.get("image_url")
                package = pkg_map.get(ticket["package_id"])

        return render_template(
            "enter_code.html",
            ticket=ticket,
            image_url=image_url,
            package=package,
        )

    @app.route("/api/redeem", methods=["POST"])
    def api_redeem():
        """
        Mirror calls this to check if a 6-digit code is valid.
        """
        data = request.get_json(silent=True) or {}
        code = str(data.get("ticket_code", "")).strip()
        if not code:
            return {"valid": False, "reason": "missing_code"}, 400

        ticket = models.get_ticket_by_code(code)
        if not ticket:
            return {"valid": False, "reason": "unknown_code"}, 404

        pkg_map = {p["id"]: p for p in app.config["PACKAGES"]}
        pkg = pkg_map.get(ticket["package_id"], {})

        extras = {
            "prints": pkg.get("prints"),
            "gif": bool(pkg.get("gif")),
            "boomerang": bool(pkg.get("boomerang")),
            "digital_access": bool(pkg.get("digital_access")),
        }

        return {
            "valid": True,
            "ticket_code": code,
            "package_id": ticket["package_id"],
            "event_code": ticket["event_code"],
            "status": ticket["status"],
            "amount_cents": ticket["amount_cents"],
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

        pkg_map = {p["id"]: p for p in app.config["PACKAGES"]}
        for t in tickets:
            pkg = pkg_map.get(t["package_id"])
            t["package_name"] = pkg["name"] if pkg else t["package_id"]
            t["amount_dollars"] = t["amount_cents"] / 100.0

        return render_template("debug_tickets.html", tickets=tickets, limit=limit)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)
