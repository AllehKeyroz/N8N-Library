'use client';

import {
  Card,
  CardContent,
  CardDescription,
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
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTemplates, Template } from '@/services/template-service';
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

    setUploadLoading(true);
    try {
      const file = uploadFiles[0];
      const fileContent = await file.text();

      const result = await processWorkflow({ workflowJson: fileContent });
      await saveTemplate(result);

      toast({
        title: 'Template Salvo!',
        description: `O workflow "${result.name}" foi processado e salvo com sucesso.`,
        variant: 'default',
      });

      await loadTemplates();
      setIsUploadDialogOpen(false);
      setUploadFiles(null);
    } catch (error: any) {
      console.error('Error processing or saving workflow:', error);
      toast({
        title: 'Erro no processamento',
        description:
          error.message ||
          'Ocorreu um erro ao processar e salvar o workflow.',
        variant: 'destructive',
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleDownload = (template: Template) => {
    // Placeholder for download logic
    toast({
      title: 'Download iniciado (simulação)',
      description: `O download do template "${template.name}" começaria agora.`,
    });
  };

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Biblioteca de Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Encontre, filtre e utilize os melhores workflows do N8N para
            automatizar suas tarefas.
          </p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <UploadCloud className="mr-2" />
          Fazer Upload
        </Button>
      </header>
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, categoria ou plataforma..."
            className="pl-12 text-base h-12"
          />
        </div>
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
              className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTemplateClick(template)}
            >
              <CardHeader className="flex-grow">
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {template.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                    >
                      {platform}
                    </span>
                  ))}
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
              <ScrollArea className="flex-grow pr-6 -mr-6">
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
                            className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                          >
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
                        <AccordionContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                          {selectedTemplate.explanation}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
              </ScrollArea>
              <DialogFooter className="pt-4 flex-shrink-0">
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
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
