import { Injectable, inject } from '@angular/core';
import { DocumentSnapshot, collection, doc, getDoc, getDocs, getFirestore, limit, query, where } from 'firebase/firestore/lite';
import { FIREBASE_APP } from '../firebase';
import { StudentResult } from './student-result';

@Injectable({ providedIn: 'root' })
export class ResultLookup {
  private readonly results = collection(getFirestore(inject(FIREBASE_APP)), 'results');

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
}

function toStudentResult(snapshot: DocumentSnapshot): StudentResult {
  return { ...(snapshot.data() as Omit<StudentResult, 'verificationCode'>), verificationCode: snapshot.id };
}
