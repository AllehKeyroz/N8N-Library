'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import type { ProcessWorkflowOutput } from "@/ai/flows/workflow-types";

export type Template = ProcessWorkflowOutput & {
  id: string;
  createdAt: any;
};

export async function saveTemplate(templateData: ProcessWorkflowOutput): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "templates"), {
      ...templateData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Não foi possível salvar o template no banco de dados.");
  }
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const q = query(collection(db, "templates"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        category: data.category,
        platforms: data.platforms,
        explanation: data.explanation,
        createdAt: data.createdAt,
      } as Template;
    });
    return templates;
  } catch (e) {
    console.error("Error getting documents: ", e);
    throw new Error("Não foi possível buscar os templates do banco de dados.");
  }
}
