/**
 * Payroll Service Layer
 * ───────────────────
 * Business logic for salary calculations, taxes, deductions.
 * ✅ Multi-country tax rules
 * ✅ Configurable deductions
 * ✅ Batch processing
 * 
 * TODO MIGRATION: Tax rules extracted to config, logic stays same
 */

export class PayrollService {
  /**
   * Calculate salary for employee
   * Accounts for: gross salary, taxes, deductions, benefits
   */
  async calculateSalary(input: {
    employee_id: string;
    gross_salary: number;
    country: string; // IT, DE, UK, FR, ES
    tax_bracket?: string;
    deductions?: { health_insurance: number; pension: number; other: number };
  }): Promise<{
    gross_salary: number;
    taxes: number;
    deductions: number;
    net_salary: number;
    breakdown: Record<string, number>;
  }> {
    // Get tax rules for country
    const taxRules = this.getTaxRules(input.country);

    // Calculate tax based on gross salary
    const taxes = this.calculateTaxes(input.gross_salary, taxRules, input.tax_bracket);

    // Calculate deductions
    const totalDeductions = (input.deductions?.health_insurance || 0) +
      (input.deductions?.pension || 0) +
      (input.deductions?.other || 0);

    const netSalary = input.gross_salary - taxes - totalDeductions;

    return {
      gross_salary: input.gross_salary,
      taxes: Math.round(taxes * 100) / 100,
      deductions: Math.round(totalDeductions * 100) / 100,
      net_salary: Math.round(netSalary * 100) / 100,
      breakdown: {
        gross: input.gross_salary,
        income_tax: Math.round(taxes * 100) / 100,
        health_insurance: input.deductions?.health_insurance || 0,
        pension: input.deductions?.pension || 0,
        other_deductions: input.deductions?.other || 0,
        net: Math.round(netSalary * 100) / 100,
      },
    };
  }

  /**
   * Process monthly payroll for company
   * @param companyId - Company UUID
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Payroll summary with employee calculations
   */
  async processMonthlyPayroll(
    companyId: string,
    year: number,
    month: number
  ): Promise<{
    total_gross: number;
    total_taxes: number;
    total_net: number;
    employee_count: number;
    payroll_date: Date;
  }> {
    // Get all active employees
    const employees = await this.payrollRepository.getActiveEmployees(companyId);

    let totalGross = 0;
    let totalTaxes = 0;
    let totalNet = 0;

    // Calculate each employee
    for (const employee of employees) {
      const salary = await this.calculateSalary({
        employee_id: employee.id,
        gross_salary: employee.monthly_salary || 0,
        country: employee.country || 'IT',
      });

      totalGross += salary.gross_salary;
      totalTaxes += salary.taxes;
      totalNet += salary.net_salary;

      // TODO: Store payroll record
    }

    return {
      total_gross: Math.round(totalGross * 100) / 100,
      total_taxes: Math.round(totalTaxes * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
      employee_count: employees.length,
      payroll_date: new Date(year, month - 1),
    };
  }

  /**
   * Get tax rules by country
   * TODO MIGRATION: Extract to PostgreSQL table `tax_rules`
   * @private
   */
  private getTaxRules(country: string): {
    basic_rate: number;
    brackets?: Array<{ min: number; max?: number; rate: number }>;
    deductions: number;
  } {
    const rules: Record<string, any> = {
      IT: {
        // Italy 2026 rates
        basic_rate: 0.23, // 23% base
        brackets: [
          { min: 0, max: 15000, rate: 0.23 },
          { min: 15000, max: 28000, rate: 0.27 },
          { min: 28000, max: 55000, rate: 0.38 },
          { min: 55000, max: 75000, rate: 0.41 },
          { min: 75000, rate: 0.43 },
        ],
        deductions: 500, // Standard deduction
      },
      DE: {
        // Germany 2026 rates
        basic_rate: 0.42,
        brackets: [
          { min: 0, max: 11600, rate: 0.0 },
          { min: 11600, max: 62810, rate: 0.42 },
          { min: 62810, rate: 0.45 },
        ],
        deductions: 0,
      },
      UK: {
        // UK 2026 rates
        basic_rate: 0.20,
        brackets: [
          { min: 0, max: 12570, rate: 0.0 },
          { min: 12570, max: 50270, rate: 0.20 },
          { min: 50270, max: 125140, rate: 0.40 },
          { min: 125140, rate: 0.45 },
        ],
        deductions: 0,
      },
      FR: {
        // France 2026 rates
        basic_rate: 0.45,
        brackets: [
          { min: 0, max: 10225, rate: 0.0 },
          { min: 10225, max: 26070, rate: 0.11 },
          { min: 26070, max: 74545, rate: 0.30 },
          { min: 74545, max: 160336, rate: 0.41 },
          { min: 160336, rate: 0.45 },
        ],
        deductions: 0,
      },
      ES: {
        // Spain 2026 rates
        basic_rate: 0.45,
        brackets: [
          { min: 0, max: 22000, rate: 0.19 },
          { min: 22000, max: 35200, rate: 0.24 },
          { min: 35200, max: 60000, rate: 0.30 },
          { min: 60000, max: 300000, rate: 0.37 },
          { min: 300000, rate: 0.45 },
        ],
        deductions: 0,
      },
    };

    return rules[country] || rules.IT;
  }

  /**
   * Calculate taxes based on salary and rules
   * @private
   */
  private calculateTaxes(
    salary: number,
    rules: any,
    taxBracket?: string
  ): number {
    if (!rules.brackets) {
      // Simple flat tax
      return salary * rules.basic_rate;
    }

    // Progressive tax brackets
    let tax = 0;
    let prevMax = 0;

    for (const bracket of rules.brackets) {
      if (salary <= bracket.min) break;

      const min = Math.max(bracket.min, prevMax);
      const max = bracket.max || salary;
      const taxableInThisBracket = Math.min(max, salary) - min;

      tax += Math.max(0, taxableInThisBracket * bracket.rate);
      prevMax = max;
    }

    return tax - (rules.deductions || 0);
  }

  /**
   * Repository pattern
   */
  private payrollRepository = {
    getActiveEmployees: async (companyId: string) => {
      const base44 = (await import('@/api/base44Client')).base44;
      return base44.entities.EmployeeProfile.filter({
        company_id: companyId,
        status: 'active',
      });
    },
  };
}

export const payrollService = new PayrollService();