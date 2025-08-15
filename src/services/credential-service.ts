'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import type { CredentialInfo, StoredCredential } from "@/ai/flows/workflow-types";


export type NewCredential = CredentialInfo & {
  templateName: string;
}

export async function saveCredential(credentialData: NewCredential): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "credentials"), {
      ...credentialData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding credential document: ", e);
    throw new Error("Não foi possível salvar a credencial no banco de dados.");
  }
}

export async function getCredentials(): Promise<StoredCredential[]> {
  try {
    const q = query(collection(db, "credentials"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const credentials = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        platform: data.platform,
        credential: data.credential,
        templateName: data.templateName,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
      } as StoredCredential;
    });
    return credentials;
  } catch (e) {
    console.error("Error getting credential documents: ", e);
    throw new Error("Não foi possível buscar as credenciais do banco de dados.");
  }
}
