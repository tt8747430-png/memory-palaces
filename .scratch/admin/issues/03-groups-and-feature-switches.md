# 03 — Groups and feature switches

Status: ready-for-agent
Type: task

- Migration: `groups`, `group_members`, `feature_switches`, `admin_log`, `my_features()`, from piano-trainer.
- `FeaturesPort.mine()`, `FeaturesProvider` and `useFeature(key)` (piano-trainer's `shared/lib/features/`), asked at
  start and on each sign-in, the last answer kept on the device so a switch holds offline.
- The Groups tab (create, delete, add and remove members) and the Switches tab (a key, a label, everyone / nobody /
  groups).
- Put the first new feature behind a switch to prove the path, e.g. check-for-updates
  (`.scratch/check-for-updates/`).
