/**
 * AUTH COMPONENTS - USAGE EXAMPLES
 * 
 * This file demonstrates how to use the auth layout components
 * Copy the examples below into your authentication pages
 */

"use client";

import {
  AuthLayout,
  AuthCard,
  AuthCardHeader,
  AuthCardTitle,
  AuthCardDescription,
  AuthCardContent,
  AuthCardFooter,
  AuthHeader,
  AuthFooter,
} from "@/components/auth";
import { Button } from "@/components/ui/button";

/**
 * EXAMPLE 1: Complete Login Page
 */
export function LoginPageExample() {
  return (
    <AuthLayout>
      <AuthHeader />
      
      <AuthCard>
        <AuthCardHeader>
          <AuthCardTitle>Accedi a PulseHR</AuthCardTitle>
          <AuthCardDescription>
            Inserisci le tue credenziali per accedere al tuo account
          </AuthCardDescription>
        </AuthCardHeader>

        <AuthCardContent>
          {/* Your login form goes here */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="nome@azienda.it"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full" size="lg">
              Accedi
            </Button>
          </form>
        </AuthCardContent>

        <AuthCardFooter>
          <p className="text-sm text-muted text-center w-full">
            Non hai un account?{" "}
            <a href="/register" className="text-primary font-medium hover:underline">
              Registrati
            </a>
          </p>
        </AuthCardFooter>
      </AuthCard>

      <AuthFooter />
    </AuthLayout>
  );
}

/**
 * EXAMPLE 2: Registration Page
 */
export function RegisterPageExample() {
  return (
    <AuthLayout>
      <AuthHeader />
      
      <AuthCard>
        <AuthCardHeader>
          <AuthCardTitle>Crea il tuo account</AuthCardTitle>
          <AuthCardDescription>
            Compila i campi per iniziare con PulseHR
          </AuthCardDescription>
        </AuthCardHeader>

        <AuthCardContent>
          {/* Your registration form goes here */}
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cognome</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Aziendale</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="mario.rossi@azienda.it"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Almeno 8 caratteri"
              />
            </div>
            <Button className="w-full" size="lg">
              Registrati
            </Button>
          </form>
        </AuthCardContent>

        <AuthCardFooter>
          <p className="text-sm text-muted text-center w-full">
            Hai già un account?{" "}
            <a href="/login" className="text-primary font-medium hover:underline">
              Accedi
            </a>
          </p>
        </AuthCardFooter>
      </AuthCard>

      <AuthFooter />
    </AuthLayout>
  );
}

/**
 * EXAMPLE 3: Password Reset Page
 */
export function PasswordResetExample() {
  return (
    <AuthLayout>
      <AuthHeader />
      
      <AuthCard>
        <AuthCardHeader>
          <AuthCardTitle>Recupera Password</AuthCardTitle>
          <AuthCardDescription>
            Inserisci la tua email per ricevere il link di reset
          </AuthCardDescription>
        </AuthCardHeader>

        <AuthCardContent>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="nome@azienda.it"
              />
            </div>
            <Button className="w-full" size="lg">
              Invia Link di Reset
            </Button>
          </form>
        </AuthCardContent>

        <AuthCardFooter>
          <p className="text-sm text-muted text-center w-full">
            Ricordi la password?{" "}
            <a href="/login" className="text-primary font-medium hover:underline">
              Torna al login
            </a>
          </p>
        </AuthCardFooter>
      </AuthCard>

      <AuthFooter />
    </AuthLayout>
  );
}

/**
 * EXAMPLE 4: Minimal Layout (without header controls)
 */
export function MinimalAuthExample() {
  return (
    <AuthLayout>
      {/* Use AuthHeaderLogo for a simpler header without controls */}
      <AuthHeader showControls={false} />
      
      <AuthCard>
        <AuthCardContent>
          {/* Your content */}
        </AuthCardContent>
      </AuthCard>
    </AuthLayout>
  );
}
