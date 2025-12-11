import random
from . import db


def generate_code():
    """
    Generate a 6-digit numeric code as a string, ensuring it is not
    already used in the tickets table.
    """
    while True:
        code = f"{random.randint(0, 999999):06d}"
        with db.db_cursor() as cur:
            cur.execute(
                "SELECT 1 FROM tickets WHERE ticket_code = ? LIMIT 1", (code,)
            )
            row = cur.fetchone()
        if row is None:
            return code
