# AI tutor

Status: needs-triage
Type: grilling

From the old phase plan (last phase) and the owner's request: a tutor the learner can ask to create palaces and decks,
edit or search them, change settings and the profile, and generate loci and quizzes. It asks permission before each
action it takes.

1. Every mutation a typed command with a schema, so the tutor calls the same use-cases as the UI. Keeping one use-case
   per feature file is what makes this possible.
2. A permission gate: every tutor command asks for confirmation.
3. A Claude Edge Function: JWT-verified, rate limit and token budget per account, tool use, streaming.
4. A tutor screen and chat widget with a turn machine.

Done when "create a palace called X" runs end to end behind the gate. Never put core CRUD, scheduling or streaks on the
REST path; the tutor calls commands.
