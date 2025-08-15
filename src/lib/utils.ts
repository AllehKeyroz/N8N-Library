import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Bot, Database, File, LucideProps, Mail, MessageSquare, Users } from "lucide-react";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCleanPlatformName(platform: string): string {
    if (!platform) return 'Desconhecido';
    
    // Remove o prefixo @n8n/ se existir
    let cleanName = platform.startsWith('@n8n/') ? platform.substring(5) : platform;
    
    // Remove prefixos comuns como 'n8n-nodes-base.'
    cleanName = cleanName.replace(/^n8n-nodes-base\./, '');
    cleanName = cleanName.replace(/^n8n-nodes-starter\./, '');

    // Capitaliza a primeira letra para um visual melhor
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
}

export function getPlatformIcon(platform: string): React.ComponentType<LucideProps> {
  const p = platform.toLowerCase();
  if (p.includes("telegram")) return MessageSquare;
  if (p.includes("gemini") || p.includes("openai") || p.includes("ollama")) return Bot;
  if (p.includes("database") || p.includes("notion") || p.includes("googlesheets") || p.includes("sheets")) return Database;
  if (p.includes("gmail") || p.includes("email")) return Mail;
  if (p.includes("googledrive") || p.includes("document")) return File;
  return Users;
}
