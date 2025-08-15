'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, getDoc, serverTimestamp, query, orderBy, where, doc, deleteDoc, Timestamp, writeBatch, updateDoc, limit } from "firebase/firestore";
import type { ProcessWorkflowOutput } from "@/ai/flows/workflow-types";
import { createHash } from 'crypto';
import { processWorkflow } from "@/ai/flows/workflow-processor";

export type Template = Omit<ProcessWorkflowOutput, 'originalWorkflowHash' | 'translatedWorkflowHash'> & {
  id: string;
  createdAt: string; 
  workflowJson?: string; // The original, unprocessed JSON
};


export async function savePendingTemplate(workflowJson: string): Promise<string> {
   const originalWorkflowHash = createHash('sha256').update(workflowJson).digest('hex');

   // Check for duplicates based on original hash before saving
    const q = query(
        collection(db, "templates"), 
        where("originalWorkflowHash", "==", originalWorkflowHash)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("Duplicate original template detected with hash:", originalWorkflowHash);
      throw new Error("Este template de workflow (versão original) já existe na biblioteca.");
    }
  
  try {
    const docRef = await addDoc(collection(db, "templates"), {
      status: 'PENDING',
      workflowJson,
      originalWorkflowHash,
      createdAt: serverTimestamp(),
       name: 'Processando...',
       description: 'Este workflow está na fila para ser processado pela IA.',
       category: 'N/A',
       niche: 'N/A',
       platforms: [],
       explanation: '',
       translatedWorkflowJson: '',
       translatedWorkflowHash: '',
    });
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding pending document: ", e);
    throw new Error("Não foi possível salvar o template pendente no banco de dados.");
  }
}

export async function processPendingTemplates(apiKey?: string): Promise<{ processed: number, failed: number }> {
    const q = query(
        collection(db, "templates"), 
        where("status", "==", "PENDING"),
        limit(1) // Process one at a time
    );
    const pendingDocs = await getDocs(q);

    if (pendingDocs.empty) {
        return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const templateDoc of pendingDocs.docs) {
        const templateId = templateDoc.id;
        const templateData = templateDoc.data() as Template;

        try {
            await updateDoc(doc(db, "templates", templateId), { status: 'PROCESSING' });

            const aiResult = await processWorkflow({
                workflowJson: templateData.workflowJson!,
                apiKey: apiKey,
            });

            // Check for translated hash duplicates before finalizing
            const qTranslated = query(
                collection(db, "templates"), 
                where("translatedWorkflowHash", "==", aiResult.translatedWorkflowHash)
            );
            const translatedSnapshot = await getDocs(qTranslated);

            if (!translatedSnapshot.empty) {
                 await updateDoc(doc(db, "templates", templateId), {
                    status: 'FAILED',
                    explanation: 'Erro: Um workflow com conteúdo traduzido idêntico já existe.'
                 });
                 failed++;
                 continue;
            }

            await updateDoc(doc(db, "templates", templateId), {
                ...aiResult,
                workflowJson: '', // Clear original JSON after processing
            });
            processed++;
        } catch (error: any) {
            console.error(`Error processing template ${templateId}:`, error);
            await updateDoc(doc(db, "templates", templateId), {
                status: 'FAILED',
                explanation: `Falha no processamento da IA: ${error.message}`
            });
            failed++;
        }
    }
    return { processed, failed };
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
