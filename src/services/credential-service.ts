'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
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

export async function updateCredential(id: string, newName: string): Promise<void> {
  try {
    const credentialDocRef = doc(db, "credentials", id);
    await updateDoc(credentialDocRef, {
      credential: newName
    });
  } catch (e) {
    console.error("Error updating credential document: ", e);
    throw new Error("Não foi possível atualizar a credencial.");
  }
}


export async function deleteCredential(id: string): Promise<void> {
  try {
    const credentialDocRef = doc(db, "credentials", id);
    await deleteDoc(credentialDocRef);
  } catch (e) {
    console.error("Error deleting credential document: ", e);
    throw new Error("Não foi possível excluir a credencial.");
  }
}

export async function deleteMultipleCredentials(ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const credentialDocRef = doc(db, "credentials", id);
      batch.delete(credentialDocRef);
    });
    await batch.commit();
  } catch (e) {
    console.error("Error deleting multiple credentials: ", e);
    throw new Error("Não foi possível excluir as credenciais selecionadas.");
  }
}
