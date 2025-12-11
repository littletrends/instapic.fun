from typing import Optional, Dict
from . import db
from .codes import generate_code


def create_ticket(
    package_id: str,
    event_code: str,
    amount_cents: int,
    square_order_id: Optional[str] = None,
) -> str:
    ticket_code = generate_code()
    with db.db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO tickets (ticket_code, package_id, event_code,
                                 amount_cents, status, square_order_id)
            VALUES (?, ?, ?, ?, 'ISSUED', ?)
            """,
            (ticket_code, package_id, event_code, amount_cents, square_order_id),
        )
    return ticket_code


def get_ticket_by_code(ticket_code: str) -> Optional[Dict]:
    with db.db_cursor() as cur:
        cur.execute(
            "SELECT * FROM tickets WHERE ticket_code = ? LIMIT 1",
            (ticket_code,),
        )
        row = cur.fetchone()
    if row is None:
        return None
    return dict(row)


def mark_ticket_used(
    ticket_code: str,
    session_id: Optional[str] = None,
    image_url: Optional[str] = None,
) -> None:
    with db.db_cursor() as cur:
        cur.execute(
            """
            UPDATE tickets
            SET status = 'USED',
                session_id = COALESCE(?, session_id),
                image_url = COALESCE(?, image_url)
            WHERE ticket_code = ?
            """,
            (session_id, image_url, ticket_code),
        )
