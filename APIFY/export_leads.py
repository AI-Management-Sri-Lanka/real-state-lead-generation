"""
export_leads.py
Exports the leads DB to CSV.
"""
import sqlite3
import csv
from db import DB_PATH


def export_to_csv(output_file: str = "leads.csv"):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT platform, username, full_name, profile_url, social_url,
               followers, email, website, bio, fetched_at
        FROM leads
        ORDER BY platform, followers DESC
    """).fetchall()
    conn.close()

    if not rows:
        print("No leads in DB yet.")
        return

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows([dict(r) for r in rows])

    print(f"Exported {len(rows)} leads → {output_file}")


if __name__ == "__main__":
    export_to_csv()