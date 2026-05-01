/**
 * Machine Learning Service
 * ──────────────────────
 * Predictive analytics for HR insights.
 * ✅ Absenteeism prediction (who will call in sick)
 * ✅ Retention risk (who might leave)
 * ✅ Salary benchmarking (fair compensation)
 * ✅ Talent recommendations (who to promote)
 * 
 * TODO MIGRATION: ML models stay same, data source changes
 */

export class MLService {
  /**
   * Predict absenteeism probability for employee
   * Uses historical absence patterns, date (day of week), seasonality
   */
  async predictAbsenteeism(employeeId: string): Promise<{
    probability: number; // 0-1
    confidence: number; // 0-1
    risk_level: 'low' | 'medium' | 'high';
    factors: string[];
  }> {
    // Get employee history
    const leaveRequests = await this.getEmployeeLeaveHistory(employeeId);
    const timeEntries = await this.getEmployeeAttendanceHistory(employeeId);

    // Features for ML model
    const features = {
      absence_frequency: this.calculateAbsenceFrequency(leaveRequests),
      Monday_effect: this.calculateMondayAbsence(leaveRequests),
      seasonal_pattern: this.getSeasonalTrend(leaveRequests),
      recent_trend: this.getRecentTrend(leaveRequests, 30), // Last 30 days
      days_since_last_absence: this.daysSinceLastAbsence(leaveRequests),
    };

    // TODO: Call ML model API (TensorFlow.js or remote service)
    // const prediction = await mlModel.predict(features);

    // Placeholder prediction
    const probability = Math.random() * 0.3; // 0-30% for demo
    const factors = [];

    if (probability > 0.2) factors.push('High absence frequency');
    if (features.Monday_effect > 0.5) factors.push('Monday absenteeism pattern');
    if (features.seasonal_pattern > 0.5) factors.push('Seasonal absence trend');

    return {
      probability: Math.round(probability * 100) / 100,
      confidence: 0.75,
      risk_level: probability > 0.25 ? 'high' : probability > 0.15 ? 'medium' : 'low',
      factors,
    };
  }

  /**
   * Predict retention risk (probability employee will leave in next 6 months)
   */
  async predictRetentionRisk(employeeId: string): Promise<{
    risk_score: number; // 0-100
    probability_leave: number; // 0-1
    factors: string[];
    recommendations: string[];
  }> {
    // Features: tenure, promotion history, salary growth, engagement, feedback, hours worked
    const features = {
      tenure_years: 3, // TODO: Calculate from hire_date
      promotions_count: 1,
      salary_growth_pct: 5,
      engagement_score: 0.7, // From survey/performance
      feedback_sentiment: 0.65,
      overtime_hours: 20, // Hours/month
      days_until_review: 45,
    };

    // Risk factors
    const factors = [];
    if (features.tenure_years < 2) factors.push('Less than 2 years tenure (high turnover risk)');
    if (features.salary_growth_pct < 3) factors.push('Below-inflation salary growth');
    if (features.engagement_score < 0.6) factors.push('Low engagement score');
    if (features.overtime_hours > 30) factors.push('Excessive overtime (burnout risk)');

    const riskScore = Math.min(100, factors.length * 25);
    const probabilityLeave = riskScore / 100;

    return {
      risk_score: riskScore,
      probability_leave: Math.round(probabilityLeave * 100) / 100,
      factors,
      recommendations: [
        riskScore > 70 ? '🚨 Schedule 1:1 conversation with manager' : '',
        riskScore > 70 ? '💰 Review compensation competitiveness' : '',
        features.overtime_hours > 30 ? '⚖️ Redistribute workload to prevent burnout' : '',
        'Schedule regular check-ins (monthly)' ,
      ].filter(Boolean),
    };
  }

  /**
   * Recommend employees for promotion/advancement
   */
  async getPromotionRecommendations(companyId: string): Promise<
    Array<{
      employee_id: string;
      employee_name: string;
      promotion_score: number; // 0-100
      recommended_role: string;
      readiness_areas: string[];
      development_areas: string[];
    }>
  > {
    // TODO: Get employees with high performance scores
    // Factors: performance rating, tenure, skills match, manager feedback, succession plan alignment

    return [
      {
        employee_id: 'emp_123',
        employee_name: 'John Doe',
        promotion_score: 85,
        recommended_role: 'Team Lead',
        readiness_areas: ['Technical skills', 'Communication', 'Problem-solving'],
        development_areas: ['Strategic planning', 'Budget management'],
      },
    ];
  }

  /**
   * Salary benchmarking - suggest fair compensation
   */
  async getSalaryBenchmark(input: {
    company_id: string;
    job_title: string;
    seniority_level: string;
    location: string;
    industry?: string;
  }): Promise<{
    market_median: number;
    market_25th_percentile: number;
    market_75th_percentile: number;
    recommended_range: { min: number; max: number };
  }> {
    // TODO: Use external data (Glassdoor, Payscale, LinkedIn) or internal benchmarking DB
    // For now, placeholder based on seniority

    const baseSalaries = {
      'Junior': 30000,
      'Mid-level': 50000,
      'Senior': 80000,
      'Lead': 120000,
    };

    const base = baseSalaries[seniority_level] || 50000;

    return {
      market_median: base,
      market_25th_percentile: base * 0.85,
      market_75th_percentile: base * 1.15,
      recommended_range: {
        min: Math.round(base * 0.9),
        max: Math.round(base * 1.1),
      },
    };
  }

  // Private helper methods

  private async getEmployeeLeaveHistory(employeeId: string): Promise<any[]> {
    // TODO: Query leave requests
    return [];
  }

  private async getEmployeeAttendanceHistory(employeeId: string): Promise<any[]> {
    // TODO: Query time entries
    return [];
  }

  private calculateAbsenceFrequency(leaves: any[]): number {
    if (!leaves.length) return 0;
    return leaves.length / 365; // Absences per day on average
  }

  private calculateMondayAbsence(leaves: any[]): number {
    const mondays = leaves.filter(l => new Date(l.start_date).getDay() === 1);
    return mondays.length / Math.max(1, leaves.length);
  }

  private getSeasonalTrend(leaves: any[]): number {
    // Detect if absences cluster in certain seasons
    const months = leaves.map(l => new Date(l.start_date).getMonth());
    const summer = months.filter(m => m >= 5 && m <= 8).length / leaves.length;
    return summer > 0.4 ? 1 : 0;
  }

  private getRecentTrend(leaves: any[], days: number): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recent = leaves.filter(l => new Date(l.start_date) > cutoff);
    return recent.length > 0 ? 1 : 0;
  }

  private daysSinceLastAbsence(leaves: any[]): number {
    if (!leaves.length) return 999;
    const lastLeave = new Date(Math.max(...leaves.map(l => new Date(l.start_date).getTime())));
    return Math.floor((Date.now() - lastLeave.getTime()) / (24 * 60 * 60 * 1000));
  }
}

export const mlService = new MLService();