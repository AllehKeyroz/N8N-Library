'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, where, doc, deleteDoc, Timestamp } from "firebase/firestore";
import type { ProcessWorkflowOutput } from "@/ai/flows/workflow-types";
import { createHash } from 'crypto';

export type Template = ProcessWorkflowOutput & {
  id: string;
  createdAt: string; // Changed to string to be serializable
  workflowHash: string;
  workflowJson: string;
};

export async function saveTemplate(templateData: ProcessWorkflowOutput & { workflowJson: string }): Promise<string> {
  const { workflowJson, ...restData } = templateData;
  const workflowHash = createHash('sha256').update(workflowJson).digest('hex');

  try {
    const q = query(collection(db, "templates"), where("workflowHash", "==", workflowHash));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      console.log("Duplicate template detected with hash:", workflowHash);
      throw new Error("Este template de workflow já existe na biblioteca.");
    }

    const docRef = await addDoc(collection(db, "templates"), {
      ...restData,
      workflowJson: workflowJson,
      workflowHash: workflowHash,
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
        platforms: data.platforms,
        explanation: data.explanation,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : '',
        workflowHash: data.workflowHash,
        workflowJson: data.workflowJson,
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
