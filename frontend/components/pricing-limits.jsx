"use client";

import { useEffect, useState } from "react";
import { getCompanyLimits } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, Crown, Lock, Zap, HardDrive } from "lucide-react";
import Link from "next/link";

interface StorageUsage {
  current_mb: number;
  max_mb: number;
  max_file_size_mb: number;
  percentage: number;
  can_upload: boolean;
  file_count: number;
}

interface CompanyLimits {
  company: {
    id: string;
    name: string;
    status: string;
    plan: string;
    billing_cycle: string;
  };
  limits: {
    max_employees: number;
    max_companies: number;
    max_storage_mb: number;
    max_file_size_mb: number;
    include_payroll: boolean;
    include_attendance: boolean;
    include_documents: boolean;
    include_safety: boolean;
    include_reports: boolean;
    include_api_access: boolean;
    include_priority_support: boolean;
    include_white_label: boolean;
    extra_employee_price: number;
  };
  usage: {
    employees: {
      current: number;
      max: number;
      percentage: number;
      can_add: boolean;
    };
    module_access: {
      payroll: boolean;
      attendance: boolean;
      documents: boolean;
      safety: boolean;
      reports: boolean;
      api: boolean;
    };
    storage: StorageUsage;
    can_add_employee: boolean;
    employee_limit_info: {
      current: number;
      max: number;
      percentage: number;
      extra_cost_per_employee: number;
    };
  };
  trial: {
    is_trial: boolean;
    days_left: number | null;
    is_expired: boolean;
    end_date?: string;
  };
  pricing: {
    plan_name: string;
    billing_cycle: string;
  };
}

const MODULE_LABELS: Record<string, string> = {
  payroll: "Payroll",
  attendance: "Presenze",
  documents: "Documenti",
  safety: "Sicurezza",
  reports: "Report",
  api: "API",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "text-blue-600",
  professional: "text-purple-600",
  enterprise: "text-amber-600",
  trial: "text-gray-600",
};

export function PricingLimitsCard() {
  const [limits, setLimits] = useState<CompanyLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLimits();
  }, []);

  async function loadLimits() {
    try {
      const data = await getCompanyLimits();
      setLimits(data);
    } catch (error) {
      console.error("Error loading company limits:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Limiti Piano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!limits) return null;

  const employeePercentage = limits.usage.employees.percentage;
  const isNearLimit = employeePercentage >= 80;
  const isAtLimit = employeePercentage >= 100;

  return (
    <Card className={isAtLimit ? "border-red-200 bg-red-50/50" : isNearLimit ? "border-amber-200 bg-amber-50/50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className={`h-4 w-4 ${PLAN_COLORS[limits.pricing.plan_name?.toLowerCase()] || "text-gray-600"}`} />
            Piano {limits.pricing.plan_name}
          </CardTitle>
          <Link 
            href="/pricing" 
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Zap className="h-3 w-3" />
            Upgrade
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Employee Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dipendenti</span>
            <span className={`font-medium ${isNearLimit ? "text-amber-600" : ""} ${isAtLimit ? "text-red-600" : ""}`}>
              {limits.usage.employees.current} / {limits.usage.employees.max}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={Math.min(employeePercentage, 100)} 
              className={`h-2 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : ""}`}
            />
            {isAtLimit && (
              <Lock className="h-3 w-3 absolute right-0 top-1/2 -translate-y-1/2 text-red-500" />
            )}
          </div>
          {isAtLimit && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Limite raggiunto!
            </p>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-amber-600">
              {limits.usage.employees.max - limits.usage.employees.current} dipendenti rimanenti
            </p>
          )}
        </div>

        {/* Storage Limit */}
        {limits.usage.storage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Storage
              </span>
              <span className={`font-medium ${
                limits.usage.storage.percentage >= 90 ? "text-red-600" :
                limits.usage.storage.percentage >= 75 ? "text-amber-600" : ""
              }`}>
                {limits.usage.storage.current_mb.toFixed(1)} / {limits.usage.storage.max_mb} MB
              </span>
            </div>
            <div className="relative">
              <Progress
                value={Math.min(limits.usage.storage.percentage, 100)}
                className={`h-2 ${
                  limits.usage.storage.percentage >= 90 ? "[&>div]:bg-red-500" :
                  limits.usage.storage.percentage >= 75 ? "[&>div]:bg-amber-500" : ""
                }`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{limits.usage.storage.file_count} file</span>
              <span>Max file: {limits.usage.storage.max_file_size_mb} MB</span>
            </div>
          </div>
        )}

        {/* Trial Warning */}
        {limits.trial.is_trial && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Trial: {limits.trial.days_left} giorni rimanenti
            </p>
          </div>
        )}

        {/* Module Access Pills */}
        <div className="flex flex-wrap gap-1">
          {Object.entries(limits.usage.module_access).map(([key, enabled]) => (
            <span
              key={key}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {enabled ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <Lock className="h-3 w-3 mr-1" />
              )}
              {MODULE_LABELS[key] || key}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeeLimitBanner() {
  const [limits, setLimits] = useState<CompanyLimits | null>(null);

  useEffect(() => {
    getCompanyLimits()
      .then(setLimits)
      .catch(console.error);
  }, []);

  if (!limits) return null;

  const { employee_limit_info, can_add_employee } = limits.usage;
  const percentage = employee_limit_info.percentage;
  const isNearLimit = percentage >= 80 && can_add_employee;
  const isAtLimit = !can_add_employee;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <div className={`px-4 py-3 rounded-lg flex items-center justify-between ${
      isAtLimit ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
    }`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-4 w-4 ${isAtLimit ? "text-red-600" : "text-amber-600"}`} />
        <span className={`text-sm ${isAtLimit ? "text-red-700" : "text-amber-700"}`}>
          {isAtLimit 
            ? `Hai raggiunto il limite di ${employee_limit_info.max} dipendenti.`
            : `Stai per raggiungere il limite di ${employee_limit_info.max} dipendenti (${percentage.toFixed(0)}%).`
          }
        </span>
      </div>
      <Link 
        href="/pricing"
        className={`text-sm font-medium ${isAtLimit? "text-red-600 hover:text-red-700" : "text-amber-600 hover:text-amber-700"}`}
      >
        Aggiorna piano →
      </Link>
    </div>
  );
}

export function StorageLimitBanner() {
  const [limits, setLimits] = useState<CompanyLimits | null>(null);

  useEffect(() => {
    getCompanyLimits()
      .then(setLimits)
      .catch(console.error);
  }, []);

  if (!limits || !limits.usage.storage) return null;

  const { storage } = limits.usage;
  const isNearLimit = storage.percentage >= 90;
  const isAtLimit = !storage.can_upload;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <div className={`px-4 py-3 rounded-lg flex items-center justify-between ${
      isAtLimit ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
    }`}>
      <div className="flex items-center gap-2">
        <HardDrive className={`h-4 w-4 ${isAtLimit ? "text-red-600" : "text-amber-600"}`} />
        <span className={`text-sm ${isAtLimit ? "text-red-700" : "text-amber-700"}`}>
          {isAtLimit
            ? `Spazio di archiviazione esaurito (${storage.percentage.toFixed(1)}%).`
            : `Spazio di archiviazione quasi pieno (${storage.percentage.toFixed(1)}%).`
          }
        </span>
      </div>
      <Link
        href="/pricing"
        className={`text-sm font-medium ${isAtLimit ? "text-red-600 hover:text-red-700" : "text-amber-600 hover:text-amber-700"}`}
      >
        Aggiorna piano →
      </Link>
    </div>
  );
}
