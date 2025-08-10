import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';

export default function AdminPage() {
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
            Selecione um ou mais arquivos JSON de workflows do n8n para a IA processar e adicionar à biblioteca.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workflow-files">Arquivos de Workflow (.json)</Label>
            <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary transition-colors">
              <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Clique para fazer o upload</span> ou arraste e solte
              </p>
              <p className="text-xs text-muted-foreground">JSON (múltiplos arquivos permitidos)</p>
              <Input id="workflow-files" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" multiple />
            </div>
          </div>
          <Button size="lg">
            <UploadCloud className="mr-2" />
            Processar com IA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
