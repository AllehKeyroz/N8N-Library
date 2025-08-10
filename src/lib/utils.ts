import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Bot, Database, File, LucideProps, Mail, MessageSquare, Users } from "lucide-react";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPlatformIcon(platform: string): React.ComponentType<LucideProps> {
  const p = platform.toLowerCase();
  if (p.includes("telegram")) return MessageSquare;
  if (p.includes("gemini") || p.includes("openai") || p.includes("ollama")) return Bot;
  if (p.includes("database") || p.includes("notion") || p.includes("google sheets")) return Database;
  if (p.includes("gmail") || p.includes("email")) return Mail;
  if (p.includes("google drive") || p.includes("document")) return File;
  return Users;
}
