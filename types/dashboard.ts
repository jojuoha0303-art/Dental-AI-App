// Dashboard specific types
export type ViewMode = 'monthly' | 'annual';
export type BranchId = 'all' | 'urayasu' | 'marunouchi' | 'kunisaki';
export type ChartType = 
  | 'revenue'
  | 'streak'
  | 'unit_utilization'
  | 'cancellation_rate'
  | 'individual_self_pay'
  | 'patients'
  | 'hp_visits'
  | 'reserve_visits'
  | 'google_visits';

export interface DentalMonthlyData {
  month: string;
  
  // Revenue
  totalRevenue: number;
  insuranceRevenue: number;
  selfPayRevenue: number;
  otherRevenue: number;
  targetRevenue: number;
  
  // Costs
  costMaterials: number;
  costMaterialsSelfPay: number;
  costLabInsurance: number;
  costLabSelfPay: number;
  totalCost: number;
  
  // Gross Profit
  grossProfit: number;
  
  // SG&A Expenses
  expensePersonnel: number;
  expenseSpecialist: number;
  expenseTraining: number;
  expenseAds: number;
  expenseCommission: number;
  expenseDepreciation: number;
  expenseOtherSGA: number;
  totalSGA: number;
  
  // Operating Profit
  operatingProfit: number;
  profitMargin: number;
  
  // Patients
  newPatients: number;
  totalPatients: number;
  
  // Rates
  selfPayRate: number;
  
  // Individual Stats (optional)
  unitUtilizationRate?: number;
  cancellationRate?: number;
  
  // Web Stats (optional)
  hpVisits?: number;
  reserveVisits?: number;
  googleVisits?: number;
}

export interface PersonnelData {
  id: string;
  name: string;
  branchId: BranchId;
  monthlyData: DentalMonthlyData[];
}

export interface DentalDataMap {
  all: DentalMonthlyData[];
  urayasu: DentalMonthlyData[];
  marunouchi: DentalMonthlyData[];
  kunisaki: DentalMonthlyData[];
  personnel: PersonnelData[];
}
