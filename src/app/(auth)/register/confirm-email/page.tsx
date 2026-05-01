import Link from "next/link";

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h1 className="text-2xl font-semibold">Verifique seu email</h1>
        <p className="text-muted-foreground">
          Enviamos um link de confirmação para o seu email.
          Clique no link para ativar sua conta.
        </p>
        <Link href="/login" className="text-sm text-primary underline">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
