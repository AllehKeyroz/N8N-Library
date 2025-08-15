'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  LoaderCircle,
  UploadCloud,
  Download,
  FileText,
  Trash2,
  Tag,
  Server,
  ArrowDownToLine,
  ArrowUpFromLine,
  Briefcase,
  X,
  Workflow,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTemplates, Template, deleteTemplate } from '@/services/template-service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { processWorkflow } from '@/ai/flows/workflow-processor';
import { saveTemplate } from '@/services/template-service';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPlatformIcon } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from 'framer-motion';


const categories = ["IA", "Vendas", "Operações de TI", "Marketing", "Operações de Documentos", "Suporte", "Finanças", "RH", "Produtividade"];
const API_KEY_STORAGE_KEY = 'google-ai-api-key';


export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const { toast } = useToast();

  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(
    null
  );
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);


  async function loadTemplates() {
    try {
      setLoading(true);
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar templates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = templates.filter((template) => {
      const { name, description, category, platforms, niche } = template;
      return (
        (name?.toLowerCase() ?? '').includes(lowercasedQuery) ||
        (description?.toLowerCase() ?? '').includes(lowercasedQuery) ||
        (category?.toLowerCase() ?? '').includes(lowercasedQuery) ||
        (niche?.toLowerCase() ?? '').includes(lowercasedQuery) ||
        platforms.some((p) => p.toLowerCase().includes(lowercasedQuery))
      );
    });
    setFilteredTemplates(filtered);
  }, [searchQuery, templates]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFiles(event.target.files);
  };
  
  const processFileWithRetry = async (file: File, maxRetries = 5, initialDelay = 10000, delayIncrement = 30000) => {
    let attempt = 0;
    let currentDelay = initialDelay;
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || undefined;

    while (attempt <= maxRetries) {
      try {
        const fileContent = await file.text();
        const aiResult = await processWorkflow({ workflowJson: fileContent, apiKey });
        const { translatedWorkflowJson, ...restOfAiResult } = aiResult;
        
        await saveTemplate({ ...restOfAiResult, workflowJson: translatedWorkflowJson });
        
        toast({
          title: `Sucesso: "${file.name}"`,
          description: `O workflow "${aiResult.name}" foi salvo.`,
          variant: 'default',
        });
        
        return; // Success, exit the loop
      } catch (error: any) {
        // Check if it's a rate limit error (429)
        if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
          attempt++;
          if (attempt <= maxRetries) {
            toast({
              title: `Limite de requisições atingido para "${file.name}"`,
              description: `Tentando novamente em ${currentDelay / 1000} segundos... (tentativa ${attempt} de ${maxRetries})`,
              variant: 'default',
            });
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay += delayIncrement; // Increase delay for next attempt
          } else {
            console.error(`Error processing ${file.name} after ${maxRetries} retries:`, error);
            toast({
              title: `Erro Final em "${file.name}"`,
              description: 'Não foi possível processar o arquivo após várias tentativas devido a limites de requisição.',
              variant: 'destructive',
            });
          }
        } else {
          // It's a different error, fail immediately
          console.error(`Error processing ${file.name}:`, error);
          toast({
            title: `Erro em "${file.name}"`,
            description: error.message || 'Ocorreu um erro ao processar este arquivo.',
            variant: 'destructive',
          });
          return; // Exit loop for non-retryable errors
        }
      }
    }
  };


  const handleUploadSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um ou mais arquivos JSON.',
        variant: 'destructive',
      });
      return;
    }

    const filesToProcess = Array.from(uploadFiles);
    
    // 1. Reset UI and close modal immediately
    setUploadLoading(true);
    setIsUploadDialogOpen(false);
    toast({
      title: 'Upload em Massa Iniciado',
      description: `${filesToProcess.length} arquivo(s) na fila para processamento.`,
      variant: 'default',
    });

    // 2. Start processing loop without blocking UI
    (async () => {
      for (const file of filesToProcess) {
        await processFileWithRetry(file);
        await loadTemplates(); // Refresh list after each attempt (success or final failure)
      }

      // 3. Reset the form state after loop finishes
      setUploadLoading(false);
      setUploadFiles(null);
       toast({
        title: 'Processamento em Massa Concluído',
        description: 'Todos os arquivos foram processados.',
        variant: 'default',
      });
    })();
  };


  const handleTemplateClick = (template: Template, e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Prevent opening the dialog if the checkbox or its label is clicked
    if (target.closest('[data-role="selection-checkbox"]')) {
      return;
    }
    setViewingTemplate(template);
  };

  const handleDownload = (template: Template) => {
    let jsonString = template.workflowJson;
    try {
      // Try to parse and re-stringify to format it nicely
      jsonString = JSON.stringify(JSON.parse(template.workflowJson), null, 2);
    } catch (e) {
      console.warn("Could not parse and re-stringify the workflow JSON. Using original string.", e);
      // If it fails, use the raw string from the DB.
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${template.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Iniciado',
      description: `O download do template "${template.name}" foi iniciado.`,
    });
  };

  const handleDeleteConfirm = async () => {
    const idsToDelete = deletingTemplateId ? [deletingTemplateId] : selectedTemplateIds;
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(idsToDelete.map(id => deleteTemplate(id)));
      
      toast({
        title: `Template(s) Excluído(s)`,
        description: `${idsToDelete.length} template(s) foram excluídos com sucesso.`,
        variant: 'default',
      });

      await loadTemplates(); // Refresh list
      setSelectedTemplateIds([]); // Clear selection
      
    } catch (error: any) {
      toast({
        title: 'Erro ao Excluir',
        description: error.message || 'Não foi possível excluir o(s) template(s).',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingTemplateId(null);
    }
  };

  const toggleTemplateSelection = (id: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedTemplateIds.length === templatesToDisplay.length) {
      setSelectedTemplateIds([]);
    } else {
      setSelectedTemplateIds(templatesToDisplay.map(t => t.id));
    }
  };


  const templatesToDisplay = searchQuery ? filteredTemplates : templates;

  return (
    <div className="p-4 md:p-8">
      <header className="mb-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-center">
          {!loading && templates.length > 0 ? `${templates.length} ` : ''}Templates de Automação de Workflow
        </h1>
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar apps, funções, casos de uso..."
              className="pl-12 text-base h-12 rounded-full bg-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="mb-8 flex items-center justify-between min-h-[52px]">
        <AnimatePresence>
          {selectedTemplateIds.length > 0 && (
             <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-4 bg-secondary p-2 rounded-lg"
            >
              <div className="flex items-center gap-2">
                 <Checkbox 
                   id="select-all"
                   checked={selectedTemplateIds.length === templatesToDisplay.length && templatesToDisplay.length > 0}
                   onCheckedChange={toggleSelectAll}
                 />
                 <Label htmlFor="select-all" className="text-sm font-medium">
                   {selectedTemplateIds.length} selecionado(s)
                 </Label>
               </div>
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" size="sm">
                     <Trash2 className="mr-2 h-4 w-4" />
                     Excluir
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                     <AlertDialogDescription>
                       Esta ação não pode ser desfeita. Isso excluirá permanentemente os {selectedTemplateIds.length} templates selecionados.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>Cancelar</AlertDialogCancel>
                     <AlertDialogAction
                       onClick={handleDeleteConfirm}
                       disabled={isDeleting}
                     >
                       {isDeleting ? 'Excluindo...' : `Sim, Excluir ${selectedTemplateIds.length} Itens`}
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
               <Button variant="ghost" size="icon" onClick={() => setSelectedTemplateIds([])} className="h-8 w-8">
                 <X className="h-4 w-4" />
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {selectedTemplateIds.length === 0 && (
          <h2 className="text-2xl font-semibold tracking-tight">Templates em Destaque</h2>
        )}

        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <UploadCloud className="mr-2" />
          Fazer Upload
        </Button>
      </div>


      {loading ? (
        <div className="flex justify-center items-center col-span-full py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Carregando templates...</p>
        </div>
      ) : error ? (
        <div className="text-center col-span-full py-12 text-destructive">
          <p>{error}</p>
        </div>
      ) : templatesToDisplay.length === 0 ? (
        <div className="text-center col-span-full py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhum template encontrado para sua busca.' : 'Nenhum template encontrado. Clique em "Fazer Upload" para adicionar o primeiro!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templatesToDisplay.map((template) => (
            <Card
              key={template.id}
              className={`flex flex-col hover:shadow-lg transition-shadow cursor-pointer bg-secondary/50 border-transparent hover:border-primary/50 ${selectedTemplateIds.includes(template.id) ? 'border-primary shadow-lg' : ''}`}
              onClick={(e) => handleTemplateClick(template, e)}
            >
              <CardContent className="p-4 flex flex-col h-full relative">
                 <div data-role="selection-checkbox" className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTemplateIds.includes(template.id)}
                      onCheckedChange={() => toggleTemplateSelection(template.id)}
                      aria-label={`Selecionar template ${template.name}`}
                    />
                 </div>
                 <div className="flex items-center gap-2 mb-4">
                    {template.platforms.slice(0, 5).map((platform) => {
                      const Icon = getPlatformIcon(platform);
                      return <Icon key={platform} className="h-5 w-5 text-muted-foreground" />;
                    })}
                 </div>
                 <h3 className="font-semibold text-lg mb-2 flex-grow">{template.name}</h3>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
                   <Avatar className="h-6 w-6">
                     <AvatarImage src={`https://placehold.co/32x32.png`} alt="Author" />
                     <AvatarFallback>A</AvatarFallback>
                   </Avatar>
                   <span>N8N Community</span>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Upload de Workflow</DialogTitle>
            <DialogDescription>
              Selecione um ou mais arquivos JSON de workflow do n8n para a IA processar e
              adicionar à biblioteca.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-files">
                Arquivo(s) de Workflow (.json)
              </Label>
              <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    Clique para fazer o upload
                  </span>{' '}
                  ou arraste e solte
                </p>
                <p className="text-xs text-muted-foreground">
                  Arquivos JSON
                </p>
                <Input
                  id="workflow-files"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".json"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploadLoading}
                />
              </div>
              {uploadFiles && uploadFiles.length > 0 && (
                 <div className="text-sm text-muted-foreground pt-2">
                   {uploadFiles.length} arquivo(s) selecionado(s):{' '}
                   <ul>
                     {Array.from(uploadFiles).slice(0, 5).map(file => <li key={file.name}>- {file.name}</li>)}
                     {uploadFiles.length > 5 && <li>...e mais {uploadFiles.length - 5}</li>}
                   </ul>
                 </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={uploadLoading || !uploadFiles}>
                {uploadLoading ? (
                  <LoaderCircle className="mr-2 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2" />
                )}
                {uploadLoading ? 'Processando...' : `Enviar ${uploadFiles?.length || 0} Arquivo(s)`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog
        open={!!viewingTemplate}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewingTemplate(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          {viewingTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {viewingTemplate.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                  <DialogDescription className="pt-2 text-base">
                    {viewingTemplate.description}
                  </DialogDescription>
                  <div className="py-4 space-y-4">
                    <div className="flex items-start gap-8">
                        <div>
                          <h3 className="font-semibold mb-2">Plataformas</h3>
                          <div className="flex flex-wrap gap-2">
                            {viewingTemplate.platforms.map((platform) => (
                              <span
                                key={platform}
                                className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                              >
                               {React.createElement(getPlatformIcon(platform), {className: "h-4 w-4"})}
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                         <div className="flex-shrink-0">
                            <h3 className="font-semibold mb-2">Nicho</h3>
                             <span
                                className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                              >
                               <Briefcase className="h-4 w-4" />
                                {viewingTemplate.niche}
                              </span>
                          </div>
                         <div className="flex-shrink-0">
                            <h3 className="font-semibold mb-2">Categoria</h3>
                             <span
                                className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                              >
                               <Tag className="h-4 w-4" />
                                {viewingTemplate.category}
                              </span>
                          </div>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="explanation">
                        <AccordionTrigger>
                          <FileText className="mr-2" />
                          Explicação Técnica
                        </AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-72 w-full">
                             <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap pr-4">
                               {viewingTemplate.explanation}
                             </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
              </div>
              <DialogFooter className="pt-4 flex-shrink-0 sm:justify-between">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" onClick={() => setDeletingTemplateId(viewingTemplate.id)}>
                        <Trash2 className="mr-2" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o template
                          da biblioteca.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingTemplateId(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteConfirm}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewingTemplate(null)}
                  >
                    Fechar
                  </Button>
                  <Button onClick={() => handleDownload(viewingTemplate)}>
                    <Download className="mr-2" />
                    Baixar Template
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
