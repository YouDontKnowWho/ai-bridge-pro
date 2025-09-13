# Acceptance Tests (MVP)

1) Batch Queue (20 jobs)
   - Select region in PS, run 20 queued generations.
   - Expect: UI responsive; finishes; one group with 20 layers.

2) Mask-smart Fill
   - Active selection → Target: New Layer.
   - Feather/Expand produce no visible halos (>2px).

3) Reproducibility
   - Same prompt+seed 3× → identical output (engine determinism).

4) History/Presets
   - After run, history shows entry; "re-run" restores fields.
   - Import/export presets.json works.

5) Error Handling
   - Simulate 429/timeout → dialog + retry/backoff; queue continues.