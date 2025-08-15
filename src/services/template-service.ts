'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, getDoc, serverTimestamp, query, orderBy, where, doc, deleteDoc, Timestamp, writeBatch, updateDoc, limit } from "firebase/firestore";
import type { ProcessWorkflowOutput } from "@/ai/flows/workflow-types";
import { createHash } from 'crypto';
import { processWorkflow } from "@/ai/flows/workflow-processor";

export type Template = Omit<ProcessWorkflowOutput, 'originalWorkflowHash' | 'translatedWorkflowHash'> & {
  id: string;
  createdAt: string; 
};


export async function processAndSaveTemplate(workflowJson: string, apiKey?: string): Promise<string> {
  // 1. Check for original hash duplicate
  const originalWorkflowHash = createHash('sha256').update(workflowJson).digest('hex');
  const qOriginal = query(
    collection(db, "templates"),
    where("originalWorkflowHash", "==", originalWorkflowHash)
  );
  const originalSnapshot = await getDocs(qOriginal);
  if (!originalSnapshot.empty) {
    throw new Error("Este workflow (versão original) já existe na biblioteca.");
  }

  // 2. Process with AI
  const aiResult = await processWorkflow({
    workflowJson,
    apiKey,
  });

  // 3. Check for translated hash duplicate
  const qTranslated = query(
      collection(db, "templates"), 
      where("translatedWorkflowHash", "==", aiResult.translatedWorkflowHash)
  );
  const translatedSnapshot = await getDocs(qTranslated);
  if (!translatedSnapshot.empty) {
      throw new Error("Um workflow com conteúdo traduzido idêntico já existe.");
  }
  
  // 4. Save the final, processed template
  try {
    const docRef = await addDoc(collection(db, "templates"), {
      ...aiResult,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding final document: ", e);
    throw new Error("Não foi possível salvar o template processado no banco de dados.");
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
        status: data.status || 'PROCESSED', // Default to processed for older items
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
