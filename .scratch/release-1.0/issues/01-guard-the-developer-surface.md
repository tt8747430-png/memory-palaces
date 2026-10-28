# 01 — Guard the developer surface

Status: ready-for-agent
Type: task

Settings → Developer (kitchen sink link, dev mode, probe overlay) and `/dev/kitchen-sink` render for everyone today, on
purpose: the keyboard bugs behind ADR 0002 only reproduce in the installed PWA. That trade ends at 1.0.

- Wrap the Developer section in `selectDevMode`.
- Give dev mode an unadvertised way in: tap the version on Settings → About seven times.
- Keep `/dev/kitchen-sink` reachable by URL but listed nowhere without dev mode. Don't delete it.
- Test: a fresh install shows no Developer section; seven taps on the version switches dev mode on.
- Update ADR 0002's Consequences once done.
