# Firestore Security Specification

## 1. Data Invariants
1. **Strict Account Isolation**: Every `/users/{userId}` document and every `/users/{userId}/transactions/{transactionId}` document can only be read, queried, created, updated, or deleted when `request.auth != null && request.auth.uid == userId`.
2. **No Cross-Account Listing or PII Leakage**: `/users` has no `allow list` rule; users can only `get` their own document by UID.
3. **Master Gate on Subcollections**: Transactions under `/users/{userId}/transactions/{transactionId}` require the parent `/users/{userId}` account document to exist on create/update (`exists(...)`), and `ownerId` must always equal both `userId` and `request.auth.uid`.
4. **Immutable Ownership & Timestamps**: `uid`, `ownerId`, `id`, and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
5. **Strict Schema & Bounds**: All documents reject extra/shadow fields via `keys().hasOnly(...)` and `affectedKeys().hasOnly(...)`. Every string has explicit `.size()` bounds, numbers have range bounds, and IDs match `^[a-zA-Z0-9_\-]+$`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read of `/users/userA`.
2. Unauthenticated write to `/users/userA`.
3. Cross-user `get` on `/users/userB` while signed in as `userA`.
4. Collection-wide `list` on `/users` while signed in as `userA`.
5. Cross-user `list` on `/users/userB/transactions` while signed in as `userA`.
6. Identity spoofing on create: `userA` writes `/users/userA` with `{ uid: "userB", ... }`.
7. Shadow field injection on create: `userA` writes `/users/userA` with `{ ..., isAdmin: true }`.
8. Spoofed timestamp on create: `userA` writes `/users/userA` with `createdAt` set to a client timestamp instead of `request.time`.
9. Negative or zero transaction amount: `userA` creates transaction with `amount: -5000` or `amount: 0`.
10. Oversized description poisoning: `userA` creates transaction with 5,000-char `description` (limit 200).
11. Immutable field tampering on update: `userA` updates transaction changing `ownerId` or `createdAt`.
12. Path ID poisoning: `userA` creates document with ID containing spaces or > 128 chars.
