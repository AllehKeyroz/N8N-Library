import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

const templates: any[] = [];

export default function TemplatesPage() {
  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Biblioteca de Templates</h1>
        <p className="text-muted-foreground mt-2">
          Encontre, filtre e utilize os melhores workflows do N8N para automatizar suas tarefas.
        </p>
      </header>
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar por nome, categoria ou plataforma..." className="pl-12 text-base h-12" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.name} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Image 
              src={template.image} 
              width={600} 
              height={400} 
              alt={template.name} 
              className="w-full h-48 object-cover" 
              data-ai-hint={template.hint}
            />
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {template.platforms.map(platform => (
                  <span key={platform} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    {platform}
                  </span>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
       {templates.length === 0 && (
        <div className="text-center col-span-full py-12">
          <p className="text-muted-foreground">Nenhum template encontrado.</p>
        </div>
      )}
    </div>
  );
}
