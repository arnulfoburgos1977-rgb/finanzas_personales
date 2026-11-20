// Security verification spec for the Dirty Dozen payloads against firebase-blueprint.json invariants.

export interface DirtyDozenCase {
  id: number;
  name: string;
  actorUid: string | null;
  targetPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
  enforcingGate: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated read on /users/userA',
    actorUid: null,
    targetPath: '/users/userA',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isOwner(userId) -> isSignedIn()',
  },
  {
    id: 2,
    name: 'Unauthenticated write on /users/userA',
    actorUid: null,
    targetPath: '/users/userA',
    operation: 'create',
    payload: { uid: 'userA', monthlyBudget: 1000000, hasCompletedOnboarding: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isOwner(userId) -> isSignedIn()',
  },
  {
    id: 3,
    name: 'Cross-user get on /users/userB',
    actorUid: 'userA',
    targetPath: '/users/userB',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'request.auth.uid == userId',
  },
  {
    id: 4,
    name: 'Collection-wide list on /users',
    actorUid: 'userA',
    targetPath: '/users',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'No allow list on /users; global catch-all denies',
  },
  {
    id: 5,
    name: 'Cross-user list on /users/userB/transactions',
    actorUid: 'userA',
    targetPath: '/users/userB/transactions',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isOwner(userId) && resource.data.ownerId == request.auth.uid',
  },
  {
    id: 6,
    name: 'Identity spoofing on create',
    actorUid: 'userA',
    targetPath: '/users/userA',
    operation: 'create',
    payload: { uid: 'userB', monthlyBudget: 1000000, hasCompletedOnboarding: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'data.uid == userId && data.uid == request.auth.uid',
  },
  {
    id: 7,
    name: 'Shadow field injection on create',
    actorUid: 'userA',
    targetPath: '/users/userA',
    operation: 'create',
    payload: { uid: 'userA', monthlyBudget: 1000000, hasCompletedOnboarding: true, isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'data.keys().hasOnly([...])',
  },
  {
    id: 8,
    name: 'Spoofed createdAt timestamp',
    actorUid: 'userA',
    targetPath: '/users/userA',
    operation: 'create',
    payload: { uid: 'userA', monthlyBudget: 1000000, hasCompletedOnboarding: true, createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().createdAt == request.time',
  },
  {
    id: 9,
    name: 'Negative transaction amount',
    actorUid: 'userA',
    targetPath: '/users/userA/transactions/tx1',
    operation: 'create',
    payload: { id: 'tx1', ownerId: 'userA', type: 'expense', amount: -5000 },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'data.amount > 0',
  },
  {
    id: 10,
    name: 'Oversized description poisoning',
    actorUid: 'userA',
    targetPath: '/users/userA/transactions/tx1',
    operation: 'create',
    payload: { id: 'tx1', ownerId: 'userA', description: 'a'.repeat(5000) },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'data.description.size() <= 200',
  },
  {
    id: 11,
    name: 'Immutable ownerId or createdAt tampering on update',
    actorUid: 'userA',
    targetPath: '/users/userA/transactions/tx1',
    operation: 'update',
    payload: { ownerId: 'userB' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().ownerId == existing().ownerId && affectedKeys().hasOnly([...])',
  },
  {
    id: 12,
    name: 'Path ID poisoning with invalid characters',
    actorUid: 'userA',
    targetPath: '/users/userA/transactions/invalid id with spaces',
    operation: 'create',
    payload: { id: 'invalid id with spaces' },
    expectedResult: 'PERMISSION_DENIED',
    enforcingGate: 'isValidId(transactionId)',
  },
];
