"""Seed the database with fictional demo data for one fake restaurant.

ALL DATA HERE IS FICTIONAL. No real stores, people, vendors, costs,
payroll info, or client information. Safe to commit and share.

Run:  python -m src.seed_demo
"""

from __future__ import annotations

from datetime import date, timedelta

from . import db, memory_service as ms


def seed(db_path: str | None = None) -> dict:
    """Create one fully populated fictional store. Returns ids for reference."""
    ms.init_db(db_path)
    conn = db.get_connection(db_path)
    try:
        today = date.today()
        yesterday = (today - timedelta(days=1)).isoformat()
        week_start = (today - timedelta(days=today.weekday())).isoformat()

        store_id = ms.create_store(
            "Demo Bagel Co. #001", location="Faketown, CA", concept_type="qsr_bagel",
            conn=conn,
        )
        gm_id = ms.create_store_user(
            store_id, "Pat Demo", role="gm", contact_hint="telegram:@pat_demo_fake",
            conn=conn,
        )

        ms.add_shift_note(
            store_id, yesterday, "am", "equipment",
            "Espresso machine group head leaking during peak; worked around with pour-over.",
            severity="high", conn=conn,
        )
        ms.add_shift_note(
            store_id, yesterday, "pm", "staffing",
            "PM crew of 3 handled close fine; dish backlog cleared by 8:40pm.",
            severity="low", conn=conn,
        )
        ms.add_shift_note(
            store_id, today.isoformat(), "am", "food_cost",
            "Over-proofed one rack of plain bagels; adjusted proof box timer.",
            severity="medium", conn=conn,
        )

        ms.add_handoff(
            store_id, yesterday, "am", "pm",
            prep_status="Cream cheese portions at 80%; need 2 more tubs whipped before 4pm rush.",
            equipment_issues="Espresso machine leak — vendor ticket pending.",
            followups="Confirm produce credit from yesterday's short case.",
            conn=conn,
        )

        f1 = ms.add_follow_up(
            store_id, "Call espresso machine vendor",
            detail="Group head gasket leak, started yesterday AM.",
            owner_role="gm", due_date=(today + timedelta(days=1)).isoformat(),
            conn=conn,
        )
        ms.add_follow_up(
            store_id, "Retrain PM crew on proof box timer",
            detail="Two over-proof events in two weeks.",
            owner_role="manager", due_date=(today + timedelta(days=3)).isoformat(),
            conn=conn,
        )
        f3 = ms.add_follow_up(
            store_id, "Inventory paper goods", owner_role="manager", conn=conn,
        )
        ms.complete_follow_up(f3, conn=conn)

        ms.add_waste_log(
            store_id, today.isoformat(), "plain bagels", amount="1 rack (24 ct)",
            reason="over-proofed", estimated_cost=18.50, conn=conn,
        )

        ms.add_receiving_issue(
            store_id, yesterday, vendor="Fictional Produce Co.",
            issue_type="short_case", detail="Invoiced 4 cases tomatoes, received 3.",
            estimated_cost=22.00, credit_requested=True, conn=conn,
        )

        ms.add_labor_note(
            store_id, week_start=week_start, note_type="overtime_risk",
            detail="Opener trending toward 4.5 OT hours; adjust Friday schedule.",
            estimated_hours=4.5, estimated_cost=85.00, conn=conn,
        )

        ms.add_pilot_proof_event(
            store_id, yesterday, "credit_recovered",
            "Vendor short-case caught at receiving and credit requested same day.",
            before_after_note="Before: short cases often missed until inventory. After: caught at the door.",
            value_estimate="$22 single event; ~$80/mo pattern", conn=conn,
        )

        ms.create_weekly_summary(
            store_id, week_start,
            "Equipment issue (espresso leak) is the top operational risk; waste trending normal except proofing errors.",
            patterns="Proof box over-proofing recurring on PM-prepped racks.",
            recommended_actions="Vendor call (espresso), PM proof retraining, verify produce credit posts.",
            conn=conn,
        )

        ms.log_agent_event(
            store_id, "demo_seed_complete", skill_name="seed_demo",
            prompt_version="v0", status="ok",
            metadata={"note": "fictional demo data", "open_followup_example": f1},
            conn=conn,
        )

        return {"store_id": store_id, "gm_id": gm_id}
    finally:
        conn.close()


if __name__ == "__main__":
    ids = seed()
    print(f"Seeded fictional store: {ids['store_id']}")
