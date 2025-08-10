'use client';

import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  LoaderCircle,
  UploadCloud,
  Download,
  FileText,
  Trash2,
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


const categories = ["IA", "Vendas", "Operações de TI", "Marketing", "Operações de Documentos", "Outros", "Suporte"];


export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);


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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFiles(event.target.files);
  };

  const handleUploadSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo JSON.',
        variant: 'destructive',
      });
      return;
    }

    const file = uploadFiles[0];
    const originalFileName = file.name;

    // 1. Reset UI and close modal immediately
    setUploadLoading(true);
    setIsUploadDialogOpen(false);
    toast({
      title: 'Upload Iniciado',
      description: `Processando "${originalFileName}" em segundo plano...`,
      variant: 'default',
    });

    // 2. Perform the async operations without blocking the UI thread further
    try {
      const fileContent = await file.text();
      
      const aiResult = await processWorkflow({ workflowJson: fileContent });
      const { translatedWorkflowJson, ...restOfAiResult } = aiResult;
      
      await saveTemplate({ ...restOfAiResult, workflowJson: translatedWorkflowJson });

      toast({
        title: 'Template Salvo!',
        description: `O workflow "${aiResult.name}" foi processado e salvo com sucesso.`,
        variant: 'default',
      });
      
      await loadTemplates(); // Refresh list after success

    } catch (error: any) {
      console.error('Error processing or saving workflow:', error);
      toast({
        title: 'Erro no Upload',
        description: error.message || `Ocorreu um erro ao processar "${originalFileName}".`,
        variant: 'destructive',
      });
    } finally {
       // 3. Reset the form state
       setUploadLoading(false);
       setUploadFiles(null);
    }
  };


  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
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
    a.href = url;
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

  const handleDelete = async (templateId: string) => {
    setIsDeleting(true);
    try {
      await deleteTemplate(templateId);
      toast({
        title: 'Template Excluído',
        description: 'O template foi excluído com sucesso.',
        variant: 'default',
      });
      setSelectedTemplate(null); 
      await loadTemplates(); 
    } catch (error: any) {
      toast({
        title: 'Erro ao Excluir',
        description: error.message || 'Não foi possível excluir o template.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Templates de Automação de Workflow
        </h1>
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar apps, funções, casos de uso..."
              className="pl-12 text-base h-12 rounded-full bg-secondary"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {categories.map((category) => (
             <Button key={category} variant="outline" className="rounded-full">
                {category}
             </Button>
          ))}
        </div>
      </header>
      
      <div className="mb-8 flex items-center justify-between">
         <h2 className="text-2xl font-semibold tracking-tight">Templates de IA em Destaque</h2>
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
      ) : templates.length === 0 ? (
        <div className="text-center col-span-full py-12">
          <p className="text-muted-foreground">
            Nenhum template encontrado. Clique em "Fazer Upload" para adicionar o primeiro!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer bg-secondary border-muted/50"
              onClick={() => handleTemplateClick(template)}
            >
              <CardContent className="p-4 flex flex-col h-full">
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
              Selecione um arquivo JSON de workflow do n8n para a IA processar e
              adicionar à biblioteca.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-files">
                Arquivo de Workflow (.json)
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
                  JSON (apenas um arquivo por vez)
                </p>
                <Input
                  id="workflow-files"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={uploadLoading}
                />
              </div>
              {uploadFiles && uploadFiles.length > 0 && (
                <div className="text-sm text-muted-foreground pt-2">
                  Arquivo selecionado: {uploadFiles[0].name}
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
                {uploadLoading ? 'Processando...' : 'Enviar para Biblioteca'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog
        open={!!selectedTemplate}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedTemplate(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedTemplate.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                  <DialogDescription className="pt-2 text-base">
                    {selectedTemplate.description}
                  </DialogDescription>
                  <div className="py-4 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Plataformas</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.platforms.map((platform) => (
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
                    <Accordion type="single" collapsible>
                      <AccordionItem value="explanation">
                        <AccordionTrigger>
                          <FileText className="mr-2" />
                          Explicação Técnica
                        </AccordionTrigger>
                        <AccordionContent>
                          <ScrollArea className="h-72 w-full">
                             <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap pr-4">
                               {selectedTemplate.explanation}
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
                      <Button variant="destructive">
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
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selectedTemplate.id)}
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
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Fechar
                  </Button>
                  <Button onClick={() => handleDownload(selectedTemplate)}>
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
