export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center p-8 md:p-24 bg-background">
      {children}
    </main>
  );
}
