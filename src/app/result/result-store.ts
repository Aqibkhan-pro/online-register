import { Injectable, inject } from '@angular/core';
import { DocumentSnapshot, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, query, runTransaction, setDoc, where, writeBatch } from 'firebase/firestore/lite';
import { FIREBASE_APP } from '../firebase';
import { StudentResult } from './student-result';

@Injectable({ providedIn: 'root' })
export class ResultStore {
  private readonly db = getFirestore(inject(FIREBASE_APP));
  private readonly results = collection(this.db, 'results');

  /** Finds results by verification code (the document ID), falling back to registration number. Both are stored upper-case. */
  async find(term: string): Promise<StudentResult[]> {
    const key = term.trim().toUpperCase();

    // Document IDs cannot contain "/", so such input can only be a registration number.
    if (!key.includes('/')) {
      const byCode = await getDoc(doc(this.results, key));
      if (byCode.exists()) return [toStudentResult(byCode)];
    }

    // A student has one result per semester, so a registration number can match several documents.
    const byRegistration = await getDocs(query(this.results, where('registrationNo', '==', key), limit(10)));
    return byRegistration.docs.map((snapshot) => toStudentResult(snapshot));
  }

  /** All results, ordered by verification code. Firestore rules only allow this unlimited read for admins. */
  async listAll(): Promise<StudentResult[]> {
    const all = await getDocs(this.results);
    return all.docs.map((snapshot) => toStudentResult(snapshot));
  }

  /** Creates a result unless its verification code is already taken; resolves to false in that case. */
  async add(result: StudentResult): Promise<boolean> {
    const { verificationCode, ...data } = result;
    const ref = doc(this.results, verificationCode);
    return runTransaction(this.db, async (transaction) => {
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, data);
      return true;
    });
  }

  /** Replaces an existing record after an admin edits it. */
  async update(result: StudentResult): Promise<void> {
    const { verificationCode, ...data } = result;
    await setDoc(doc(this.results, verificationCode), data);
  }

  /** Removes one verified transcript. Firestore rules restrict this operation to admins. */
  async delete(verificationCode: string): Promise<void> {
    await deleteDoc(doc(this.results, verificationCode));
  }

  /** Writes results keyed by verification code, overwriting any existing document with the same code. */
  async save(results: StudentResult[]): Promise<void> {
    const batch = writeBatch(this.db);
    for (const { verificationCode, ...data } of results) batch.set(doc(this.results, verificationCode), data);
    await batch.commit();
  }
}

function toStudentResult(snapshot: DocumentSnapshot): StudentResult {
  return { ...(snapshot.data() as Omit<StudentResult, 'verificationCode'>), verificationCode: snapshot.id };
}
