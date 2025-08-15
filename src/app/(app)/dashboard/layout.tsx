'use client';

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { FileText, KeyRound, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
              <Link href="/dashboard/templates" passHref>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/templates')}>
                  <>
                    <FileText />
                    Templates
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/dashboard/credentials" passHref>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/credentials')}>
                  <>
                    <KeyRound />
                    Credenciais
                  </>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </div>
  );
}
