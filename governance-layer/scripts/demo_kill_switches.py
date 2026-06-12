"""Demo: every sensitive action is blocked under default flags, and an
unauthorized actor cannot flip a kill switch."""
import _path  # noqa: F401
from src.control.config import GovernanceConfig
from src.control.blocked_action_log import BlockedActionLog
from src.control.runtime_guard import RuntimeGuard
from src.control.kill_switches import KillSwitchPanel

config = GovernanceConfig()
log = BlockedActionLog()
guard = RuntimeGuard(config, log)
panel = KillSwitchPanel(config, log)

print("Default flags (deny-by-default):")
for k, v in config.as_dict().items():
    print(f"  {k} = {v}")

print("\nAttempting fake actions under defaults:")
for name, check in [
    ("autonomous reply", guard.check_autonomous_reply),
    ("memory write", guard.check_memory_write),
    ("tool execution", guard.check_tool_execution),
    ("outbound action", guard.check_outbound_action),
]:
    d = check(detail=f"fake {name} attempt (demo)")
    print(f"  {name:<18} allowed={d.allowed}  reason={d.reason}")

print("\nAgent tries to flip a kill switch:")
ok = panel.set_flag("ALLOW_OUTBOUND_ACTIONS", True, actor="fake-agent")
print(f"  set_flag by 'fake-agent' -> {ok} (refused)")
print(f"  ALLOW_OUTBOUND_ACTIONS still = {config.get('ALLOW_OUTBOUND_ACTIONS')}")

print("\nBlake flips it (authorized), then emergency stop:")
ok = panel.set_flag("ALLOW_OUTBOUND_ACTIONS", True, actor="blake")
print(f"  set_flag by 'blake' -> {ok}; now = {config.get('ALLOW_OUTBOUND_ACTIONS')}")
panel.emergency_stop(actor="blake")
print(f"  after emergency_stop: ALLOW_OUTBOUND_ACTIONS = {config.get('ALLOW_OUTBOUND_ACTIONS')}")

print(f"\nBlocked action log ({log.count()} entries):")
for e in log.entries:
    print(f"  [{e['ts']}] {e['action_type']} flag={e['flag']} :: {e['detail']}")
