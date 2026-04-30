"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { clearSessionStorage, getStoredUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  ChevronDown,
  Fingerprint,
  Building2
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function UserMenu() {
  const router = useRouter();
  const { language } = useLanguage();
  const [user] = useState(() => getStoredUser());
  
  const initials = user?.first_name && user?.last_name 
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();
  
  const fullName = user?.full_name || user?.email || "Utente";
  const roleLabel = {
    super_admin: language === "it" ? "Amministratore" : "Administrator",
    company_owner: language === "it" ? "Titolare" : "Owner",
    company_admin: language === "it" ? "Amministratore" : "Admin",
    hr_manager: language === "it" ? "HR Manager" : "HR Manager",
    manager: language === "it" ? "Manager" : "Manager",
    labor_consultant: language === "it" ? "Consulente" : "Consultant",
    external_consultant: language === "it" ? "Consulente" : "Consultant",
    safety_consultant: language === "it" ? "Consulente Sicurezza" : "Safety Consultant",
    employee: language === "it" ? "Dipendente" : "Employee",
  }[user?.role] || user?.role;

  function handleLogout() {
    clearSessionStorage();
    router.push("/login");
  }

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {fullName}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {roleLabel}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
        </button>
      }
    >
      {/* User Info Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="font-semibold text-sm text-foreground truncate">{fullName}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        <Badge className="mt-2" variant="outline">
          {roleLabel}
        </Badge>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          className="dropdown-item w-full text-left"
          onClick={() => router.push("/settings/profile")}
          type="button"
        >
          <span className="dropdown-item-leading">
            <User className="h-4 w-4" />
          </span>
          <span>{language === "it" ? "Profilo" : "Profile"}</span>
        </button>
        
        <button
          className="dropdown-item w-full text-left"
          onClick={() => router.push("/settings/security")}
          type="button"
        >
          <span className="dropdown-item-leading">
            <Fingerprint className="h-4 w-4" />
          </span>
          <span>{language === "it" ? "Sicurezza" : "Security"}</span>
        </button>

        {user?.company && (
          <button
            className="dropdown-item w-full text-left"
            onClick={() => router.push("/company/users")}
            type="button"
          >
            <span className="dropdown-item-leading">
              <Building2 className="h-4 w-4" />
            </span>
            <span>{language === "it" ? "Azienda" : "Company"}</span>
          </button>
        )}
      </div>

      {/* Logout */}
      <div className="py-1 border-t border-border">
        <button
          className="dropdown-item w-full text-left text-danger hover:bg-danger/10"
          onClick={handleLogout}
          type="button"
        >
          <span className="dropdown-item-leading">
            <LogOut className="h-4 w-4" />
          </span>
          <span>{language === "it" ? "Esci" : "Logout"}</span>
        </button>
      </div>
    </Dropdown>
  );
}
