import { AuthForm } from "@/components/auth-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <AuthForm />
    </main>
  );
}
