'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { FileText, KeyRound, Cog, KeySquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const API_KEY_STORAGE_KEY = 'google-ai-api-key';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    toast({
      title: 'Chave de API Salva',
      description: 'Sua chave de API foi salva no seu navegador.',
    });
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex">
      <Sidebar variant="inset">
        <SidebarContent>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">N8N Library</h1>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard/templates">
                <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/templates')}>
                  <span>
                    <FileText />
                    Templates
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/dashboard/credentials">
                <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/credentials')}>
                  <span>
                    <KeyRound />
                    Credenciais
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setIsSettingsOpen(true)}>
             <Cog />
             <span className="group-data-[collapsible=icon]:hidden">Configurações</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações da Aplicação</DialogTitle>
            <DialogDescription>
              Configure sua chave de API para utilizar modelos de IA mais poderosos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right col-span-1">
                <div className="flex items-center justify-end gap-2">
                   <KeySquare className="h-4 w-4" />
                   API Key
                </div>
              </Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-3"
                placeholder="Cole sua chave do Google AI Studio aqui"
              />
            </div>
             <p className="text-xs text-muted-foreground px-1">
                Sua chave é armazenada com segurança no seu navegador e nunca é enviada para nossos servidores. Ela será usada para um modelo de IA mais poderoso (Gemini 1.5 Pro).
             </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveKey}>Salvar Chave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
