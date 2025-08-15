'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, where, doc, deleteDoc, Timestamp, writeBatch } from "firebase/firestore";
import type { ProcessWorkflowOutput } from "@/ai/flows/workflow-types";
import { createHash } from 'crypto';

export type Template = Omit<ProcessWorkflowOutput, 'originalWorkflowHash' | 'translatedWorkflowHash'> & {
  id: string;
  createdAt: string; 
};

export async function saveTemplate(templateData: ProcessWorkflowOutput): Promise<string> {
  const { translatedWorkflowJson, ...restData } = templateData;

  try {
    const q = query(
        collection(db, "templates"), 
        where("originalWorkflowHash", "==", templateData.originalWorkflowHash)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("Duplicate original template detected with hash:", templateData.originalWorkflowHash);
      throw new Error("Este template de workflow (versão original) já existe na biblioteca.");
    }
    
    const qTranslated = query(
        collection(db, "templates"), 
        where("translatedWorkflowHash", "==", templateData.translatedWorkflowHash)
    );
    const querySnapshotTranslated = await getDocs(qTranslated);

    if (!querySnapshotTranslated.empty) {
      console.log("Duplicate translated template detected with hash:", templateData.translatedWorkflowHash);
      throw new Error("Este template de workflow (versão traduzida) já existe na biblioteca.");
    }


    const docRef = await addDoc(collection(db, "templates"), {
      ...restData,
      translatedWorkflowJson, // Storing the translated JSON
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding document: ", e);
    if (e.message.includes("Este template de workflow")) {
      throw e;
    }
    throw new Error("Não foi possível salvar o template no banco de dados.");
  }
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const q = query(collection(db, "templates"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        category: data.category,
        niche: data.niche || 'N/A',
        platforms: data.platforms,
        explanation: data.explanation,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : '',
        translatedWorkflowJson: data.translatedWorkflowJson,
      } as Template;
    });
    return templates;
  } catch (e) {
    console.error("Error getting documents: ", e);
    throw new Error("Não foi possível buscar os templates do banco de dados.");
  }
}

export async function deleteTemplate(id: string): Promise<void> {
    try {
        const templateDocRef = doc(db, "templates", id);
        await deleteDoc(templateDocRef);
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw new Error("Não foi possível excluir o template do banco de dados.");
    }
}
