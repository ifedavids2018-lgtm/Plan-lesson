# Security Specification: AI Lesson Planner ABAC & Zero-Trust Rules

## 1. Data Invariants
1. **Teacher Profile Invariant**: A `/teachers/{teacherId}` profile can only be read, created, or updated by the authenticated user whose `request.auth.uid == teacherId`. Blanket collection listing is disabled (`allow list: if false`) to prevent PII harvesting.
2. **Sub-Collection Ownership Invariant**: Any document in `/teachers/{teacherId}/lessons/{lessonId}`, `/quizzes/{quizId}`, `/homework/{homeworkId}`, and `/timetable/{slotId}` can strictly and exclusively be accessed and modified by the matching authenticated teacher (`request.auth.uid == teacherId`).
3. **Identity Immutability**: The `teacher_id` inside any saved document must match `teacherId` and `request.auth.uid`. During updates, the owner ID cannot be modified or transferred to another user.
4. **Volumetric & Type Integrity**: String lengths, IDs, and array sizes must remain within bounded limits to prevent denial-of-wallet resource exhaustion.
5. **Verified Auth Guarantee**: Writes require active authenticated credentials (`request.auth != null`).

---

## 2. The "Dirty Dozen" Adversarial Payloads
Below are the 12 attack vectors designed to challenge Identity, Integrity, and State:

1. **Payload 1 (Cross-User Read Attack)**: User B attempts `get` on `/teachers/userA_123`.
   - *Expected*: `PERMISSION_DENIED`
2. **Payload 2 (PII Harvester List Attack)**: User B attempts `list` on `/teachers`.
   - *Expected*: `PERMISSION_DENIED`
3. **Payload 3 (Cross-User Lesson Injection)**: User B attempts `create` on `/teachers/userA_123/lessons/lesson_999`.
   - *Expected*: `PERMISSION_DENIED`
4. **Payload 4 (Ghost Identity Infiltration)**: Unauthenticated user (`request.auth == null`) attempts `create` on `/teachers/anon/lessons/lesson_1`.
   - *Expected*: `PERMISSION_DENIED`
5. **Payload 5 (Teacher ID Hijack On Update)**: User A attempts `update` on `/teachers/userA_123/lessons/lesson_1` changing `teacher_id: "userB_456"`.
   - *Expected*: `PERMISSION_DENIED`
6. **Payload 6 (Oversized Topic Denial-of-Wallet)**: User A attempts `create` on `/teachers/userA_123/lessons/lesson_1` with a 2MB `topic` string.
   - *Expected*: `PERMISSION_DENIED`
7. **Payload 7 (Cross-User Quiz Delete Attack)**: User B attempts `delete` on `/teachers/userA_123/quizzes/quiz_1`.
   - *Expected*: `PERMISSION_DENIED`
8. **Payload 8 (Cross-User Homework Sniffing)**: User B attempts `get` on `/teachers/userA_123/homework/hw_1`.
   - *Expected*: `PERMISSION_DENIED`
9. **Payload 9 (Cross-User Timetable Tampering)**: User B attempts `update` on `/teachers/userA_123/timetable/slot_1`.
   - *Expected*: `PERMISSION_DENIED`
10. **Payload 10 (Malformed Document ID Attack)**: User A attempts `create` on `/teachers/userA_123/lessons/../../../system_doc`.
    - *Expected*: `PERMISSION_DENIED`
11. **Payload 11 (Unauthenticated Probe Attack)**: Unauthenticated visitor attempts `list` on `/teachers/userA_123/lessons`.
    - *Expected*: `PERMISSION_DENIED`
12. **Payload 12 (Self-Assigned Admin Escalation Attack)**: User A attempts `create` or `update` on `/teachers/userA_123` setting `role: "super_admin"`.
    - *Expected*: `PERMISSION_DENIED` (role is constrained or locked to teacher)

---

## 3. Threat Assessment Summary
All 12 adversarial vectors fail immediately at the top-level path match and helper evaluations before performing expensive state evaluations.
