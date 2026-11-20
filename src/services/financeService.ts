import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, UserAccount } from '../types';

// Validation constants synced verbatim with firebase-blueprint.json
const MAX_EMAIL_LEN = 256;
const MAX_DISPLAY_NAME_LEN = 120;
const MAX_CATEGORY_LEN = 80;
const MAX_DATE_LEN = 40;
const MAX_TIME_LEN = 30;
const MAX_DESCRIPTION_LEN = 200;
const MAX_ICON_LEN = 40;
const MAX_NOTES_LEN = 500;
const MAX_PAYMENT_METHOD_LEN = 50;
const MAX_AMOUNT = 100_000_000_000;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function clampText(value: string | undefined | null, maxLen: number): string {
  if (!value) return '';
  return value.trim().slice(0, maxLen);
}

function normalizeIsoDate(isoDate?: string): string {
  if (isoDate && ISO_DATE_REGEX.test(isoDate)) {
    return isoDate;
  }
  return new Date().toISOString().split('T')[0];
}

function generateValidId(prefix: string): string {
  const rand = Math.random().toString(36).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `${prefix}_${Date.now()}_${rand || 'item'}`.slice(0, 128);
}

export function subscribeUserAccount(
  uid: string,
  onData: (account: UserAccount | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const data = snapshot.data();
      onData({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        monthlyBudget: typeof data.monthlyBudget === 'number' ? data.monthlyBudget : 0,
        hasCompletedOnboarding: Boolean(data.hasCompletedOnboarding),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveInitialMonthlyBudget(
  user: User,
  monthlyBudget: number,
  displayNameOverride?: string
): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const safeBudget = Math.max(0, Math.min(MAX_AMOUNT, Math.round(Number(monthlyBudget) || 0)));
  const cleanEmail = clampText(user.email, MAX_EMAIL_LEN);
  const cleanDisplayName = clampText(
    displayNameOverride || user.displayName || user.email?.split('@')[0],
    MAX_DISPLAY_NAME_LEN
  );

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      const payload: Record<string, unknown> = {
        uid: user.uid,
        monthlyBudget: safeBudget,
        hasCompletedOnboarding: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (cleanEmail) payload.email = cleanEmail;
      if (cleanDisplayName) payload.displayName = cleanDisplayName;
      await setDoc(ref, payload);
    } else {
      const updates: Record<string, unknown> = {
        monthlyBudget: safeBudget,
        hasCompletedOnboarding: true,
        updatedAt: serverTimestamp(),
      };
      if (cleanEmail) updates.email = cleanEmail;
      if (cleanDisplayName) updates.displayName = cleanDisplayName;
      await updateDoc(ref, updates);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateMonthlyBudget(uid: string, monthlyBudget: number): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  const safeBudget = Math.max(0, Math.min(MAX_AMOUNT, Math.round(Number(monthlyBudget) || 0)));

  try {
    await updateDoc(ref, {
      monthlyBudget: safeBudget,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserTransactions(
  uid: string,
  onData: (transactions: Transaction[]) => void
): Unsubscribe {
  const path = `users/${uid}/transactions`;
  const q = query(collection(db, 'users', uid, 'transactions'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const createdAtTs = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
        return {
          id: data.id || docSnap.id,
          ownerId: data.ownerId,
          type: data.type === 'income' ? 'income' : 'expense',
          amount: Number(data.amount) || 0,
          category: data.category || 'Otro',
          date: data.date || '',
          isoDate: data.isoDate,
          time: data.time,
          description: data.description || '',
          icon: data.icon || 'ShoppingBag',
          notes: data.notes,
          paymentMethod: data.paymentMethod,
          createdAtMs: createdAtTs,
        };
      });

      items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addUserTransaction(
  uid: string,
  tx: Omit<Transaction, 'id' | 'ownerId' | 'createdAtMs'>
): Promise<void> {
  const txId = generateValidId(tx.type === 'income' ? 'inc' : 'exp');
  const path = `users/${uid}/transactions/${txId}`;
  const ref = doc(db, 'users', uid, 'transactions', txId);

  const safeAmount = Math.max(1, Math.min(MAX_AMOUNT, Number(tx.amount) || 0));
  const safeCategory = clampText(tx.category, MAX_CATEGORY_LEN) || 'Otro';
  const safeDate =
    clampText(tx.date, MAX_DATE_LEN) ||
    new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const safeIsoDate = normalizeIsoDate(tx.isoDate);
  const safeDescription = clampText(tx.description, MAX_DESCRIPTION_LEN) || 'Movimiento';
  const safeIcon = clampText(tx.icon, MAX_ICON_LEN) || 'ShoppingBag';
  const safeTime = clampText(tx.time, MAX_TIME_LEN);
  const safeNotes = clampText(tx.notes, MAX_NOTES_LEN);
  const safePaymentMethod = clampText(tx.paymentMethod, MAX_PAYMENT_METHOD_LEN);

  const payload: Record<string, unknown> = {
    id: txId,
    ownerId: uid,
    type: tx.type === 'income' ? 'income' : 'expense',
    amount: safeAmount,
    category: safeCategory,
    date: safeDate,
    isoDate: safeIsoDate,
    description: safeDescription,
    icon: safeIcon,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (safeTime) payload.time = safeTime;
  if (safeNotes) payload.notes = safeNotes;
  if (safePaymentMethod) payload.paymentMethod = safePaymentMethod;

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserTransaction(
  uid: string,
  transactionId: string,
  updates: Partial<Omit<Transaction, 'id' | 'ownerId' | 'createdAtMs'>>
): Promise<void> {
  const path = `users/${uid}/transactions/${transactionId}`;
  const ref = doc(db, 'users', uid, 'transactions', transactionId);

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.type !== undefined) {
    payload.type = updates.type === 'income' ? 'income' : 'expense';
  }
  if (updates.amount !== undefined) {
    payload.amount = Math.max(1, Math.min(MAX_AMOUNT, Number(updates.amount) || 0));
  }
  if (updates.category !== undefined) {
    payload.category = clampText(updates.category, MAX_CATEGORY_LEN) || 'Otro';
  }
  if (updates.date !== undefined) {
    payload.date =
      clampText(updates.date, MAX_DATE_LEN) ||
      new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (updates.isoDate !== undefined) {
    payload.isoDate = normalizeIsoDate(updates.isoDate);
  }
  if (updates.time !== undefined) {
    payload.time = clampText(updates.time, MAX_TIME_LEN);
  }
  if (updates.description !== undefined) {
    payload.description = clampText(updates.description, MAX_DESCRIPTION_LEN) || 'Movimiento';
  }
  if (updates.icon !== undefined) {
    payload.icon = clampText(updates.icon, MAX_ICON_LEN) || 'ShoppingBag';
  }
  if (updates.notes !== undefined) {
    payload.notes = clampText(updates.notes, MAX_NOTES_LEN);
  }
  if (updates.paymentMethod !== undefined) {
    payload.paymentMethod = clampText(updates.paymentMethod, MAX_PAYMENT_METHOD_LEN);
  }

  try {
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserTransaction(uid: string, transactionId: string): Promise<void> {
  const path = `users/${uid}/transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
