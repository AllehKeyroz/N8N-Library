'use client';

import { useEffect, useState } from 'react';
import {
  getCredentials,
  StoredCredential,
} from '@/services/credential-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPlatformIcon } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadCredentials();
  }, []);

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          Gerenciador de Credenciais
        </h1>
        <p className="text-lg text-muted-foreground">
          Aqui estão todas as credenciais que a IA identificou nos seus
          templates de workflow.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais Identificadas</CardTitle>
          <CardDescription>
            Use esta lista para saber quais credenciais você precisa configurar no seu ambiente N8N.
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
              <p className="text-lg font-semibold">Nenhuma credencial encontrada</p>
              <p>Faça o upload de templates para que a IA possa identificar as credenciais necessárias.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Nome da Credencial</TableHead>
                  <TableHead>Encontrada no Template</TableHead>
                  <TableHead className="text-right">Data de Detecção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentials.map((cred) => {
                   const Icon = getPlatformIcon(cred.platform);
                  return (
                    <TableRow key={cred.id}>
                      <TableCell className="font-medium">
                         <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{cred.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cred.credential}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cred.templateName}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(cred.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
