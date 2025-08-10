'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processWorkflow } from '@/ai/flows/workflow-processor';

export default function AdminPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione pelo menos um arquivo JSON.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const file = files[0];
      const fileContent = await file.text();
      
      const result = await processWorkflow({ workflowJson: fileContent });

      console.log('AI Processing Result:', result);

      toast({
        title: 'Processamento Concluído!',
        description: `O workflow "${result.name}" foi processado. Verifique o console para detalhes.`,
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Error processing workflow:', error);
      toast({
        title: 'Erro no processamento',
        description: error.message || 'Ocorreu um erro ao processar o workflow.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setFiles(null); 
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Painel do Admin</h1>
        <p className="text-muted-foreground mt-2">
          Faça o upload e gerencie os templates da biblioteca.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Upload de Workflow</CardTitle>
          <CardDescription>
            Selecione um arquivo JSON de workflow do n8n para a IA processar e adicionar à biblioteca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workflow-files">Arquivo de Workflow (.json)</Label>
            <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
              <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Clique para fazer o upload</span> ou arraste e solte
              </p>
              <p className="text-xs text-muted-foreground">JSON (apenas um arquivo por vez)</p>
              <Input 
                id="workflow-files" 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".json"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
             {files && files.length > 0 && (
              <div className="text-sm text-muted-foreground pt-2">
                Arquivo selecionado: {files[0].name}
              </div>
            )}
          </div>
          <Button size="lg" onClick={handleSubmit} disabled={loading || !files}>
            {loading ? <LoaderCircle className="mr-2 animate-spin" /> : <UploadCloud className="mr-2" />}
            {loading ? 'Processando com IA...' : 'Processar com IA'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
