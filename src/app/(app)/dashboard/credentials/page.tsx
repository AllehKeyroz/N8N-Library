'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  getCredentials,
  StoredCredential,
  updateCredential,
  deleteCredential,
  deleteMultipleCredentials,
} from '@/services/credential-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  LoaderCircle,
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPlatformIcon } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from 'framer-motion';


type GroupedCredentials = {
  [platform: string]: StoredCredential[];
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<StoredCredential | null>(null);
  const [newCredentialName, setNewCredentialName] = useState('');

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingCredentialId, setDeletingCredentialId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [selectedCredentialIds, setSelectedCredentialIds] = useState<string[]>([]);


  async function loadCredentials() {
    try {
      setLoading(true);
      const fetchedCredentials = await getCredentials();
      setCredentials(fetchedCredentials);
      setError(null);
    } catch (err: any) {
      setError(
        err.message || 'Falha ao carregar as credenciais do banco de dados.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  const groupedCredentials = useMemo(() => {
    return credentials.reduce((acc, cred) => {
      const { platform } = cred;
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(cred);
      return acc;
    }, {} as GroupedCredentials);
  }, [credentials]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = (credential: StoredCredential) => {
    setEditingCredential(credential);
    setNewCredentialName(credential.credential);
    setIsEditModalOpen(true);
  };

  const handleUpdateCredential = async () => {
    if (!editingCredential || !newCredentialName.trim()) return;

    try {
      await updateCredential(editingCredential.id, newCredentialName.trim());
      toast({
        title: 'Credencial Atualizada',
        description: 'O nome da credencial foi alterado com sucesso.',
      });
      loadCredentials(); // Refresh data
      setIsEditModalOpen(false);
      setEditingCredential(null);
    } catch (err: any) {
      toast({
        title: 'Erro ao Atualizar',
        description: err.message,
        variant: 'destructive',
      });
    }
  };
  
  const openDeleteAlert = (id: string) => {
    setDeletingCredentialId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const idsToDelete = deletingCredentialId ? [deletingCredentialId] : selectedCredentialIds;
    if (idsToDelete.length === 0) return;
    
    setIsDeleting(true);
    try {
        if (idsToDelete.length > 1) {
            await deleteMultipleCredentials(idsToDelete);
        } else {
            await deleteCredential(idsToDelete[0]);
        }
        toast({
            title: 'Credencial(is) Excluída(s)',
            description: `${idsToDelete.length} credencial(is) foram removida(s) com sucesso.`,
        });
        loadCredentials();
        setSelectedCredentialIds([]);
    } catch (err: any) {
        toast({
            title: 'Erro ao Excluir',
            description: err.message,
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteAlertOpen(false);
        setDeletingCredentialId(null);
    }
};

  const toggleCredentialSelection = (id: string) => {
    setSelectedCredentialIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllPlatform = (platform: string) => {
    const platformCredIds = groupedCredentials[platform].map(c => c.id);
    const allSelected = platformCredIds.every(id => selectedCredentialIds.includes(id));

    if (allSelected) {
      setSelectedCredentialIds(prev => prev.filter(id => !platformCredIds.includes(id)));
    } else {
      setSelectedCredentialIds(prev => [...new Set([...prev, ...platformCredIds])]);
    }
  };

  const platformOrder = Object.keys(groupedCredentials).sort((a, b) => a.localeCompare(b));

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Gerenciador de Credenciais
          </h1>
          <p className="text-lg text-muted-foreground">
            Visualize, copie e gerencie as credenciais identificadas nos seus templates.
          </p>
        </div>
      </header>

       <AnimatePresence>
        {selectedCredentialIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-4 bg-secondary p-2 rounded-lg mb-8"
          >
            <Label className="text-sm font-medium">
              {selectedCredentialIds.length} selecionado(s)
            </Label>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" onClick={() => setDeletingCredentialId(null)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Selecionados
                    </Button>
                </AlertDialogTrigger>
            </AlertDialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCredentialIds([])}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>


      <Card>
        <CardHeader>
          <CardTitle>Credenciais Agrupadas por Plataforma</CardTitle>
          <CardDescription>
            Encontre aqui todas as credenciais necessárias para configurar seu ambiente N8N.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">
                Carregando credenciais...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive flex flex-col items-center gap-4">
              <AlertTriangle className="h-10 w-10" />
              <p className="text-lg font-semibold">Ocorreu um erro</p>
              <p>{error}</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
              <KeyRound className="h-10 w-10" />
              <p className="text-lg font-semibold">
                Nenhuma credencial encontrada
              </p>
              <p>
                Faça o upload de templates para que a IA possa identificar as
                credenciais.
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {platformOrder.map((platform) => {
                const Icon = getPlatformIcon(platform);
                const creds = groupedCredentials[platform];
                const areAllInPlatformSelected = creds.every(c => selectedCredentialIds.includes(c.id));
                return (
                  <AccordionItem value={platform} key={platform}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <span className="text-lg font-semibold">
                          {platform}
                        </span>
                        <Badge variant="secondary">{creds.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                               <Checkbox
                                checked={areAllInPlatformSelected}
                                onCheckedChange={() => toggleSelectAllPlatform(platform)}
                                aria-label={`Selecionar todas as credenciais para ${platform}`}
                               />
                            </TableHead>
                            <TableHead>Nome da Credencial</TableHead>
                            <TableHead>Encontrada no Template</TableHead>
                            <TableHead>Data de Detecção</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creds.map((cred) => (
                            <TableRow key={cred.id} data-state={selectedCredentialIds.includes(cred.id) ? 'selected' : 'unselected'}>
                              <TableCell>
                                 <Checkbox
                                  checked={selectedCredentialIds.includes(cred.id)}
                                  onCheckedChange={() => toggleCredentialSelection(cred.id)}
                                  aria-label={`Selecionar credencial ${cred.credential}`}
                                 />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {cred.credential}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {cred.templateName}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(
                                  new Date(cred.createdAt),
                                  "dd/MM/yyyy 'às' HH:mm",
                                  { locale: ptBR }
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleCopy(cred.credential, cred.id)
                                    }
                                  >
                                    {copiedId === cred.id ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditModal(cred)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                   <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                     onClick={() => openDeleteAlert(cred.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
      
       {/* Edit Credential Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome da Credencial</DialogTitle>
            <DialogDescription>
              Altere o nome da credencial. Isso será atualizado apenas no banco de dados para sua organização.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credential-name" className="text-right">
                    Nome
                </Label>
                 <Input
                    id="credential-name"
                    value={newCredentialName}
                    onChange={(e) => setNewCredentialName(e.target.value)}
                    className="col-span-3"
                />
             </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
             </DialogClose>
             <Button onClick={handleUpdateCredential}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Alert */}
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                 Esta ação não pode ser desfeita. Isso excluirá permanentemente a(s) credencial(is) selecionada(s) do banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingCredentialId(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
