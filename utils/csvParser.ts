import { DentalMonthlyData, DentalDataMap, BranchId } from '../types/dashboard';

export const parseCSV = (csvContent: string): DentalDataMap => {
  try {
    console.log('parseCSV called, content length:', csvContent.length);
    const lines = csvContent.split('\n').filter(line => line.trim());
    console.log('Total lines:', lines.length);
    if (lines.length < 2) {
      throw new Error('CSVファイルが空です');
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('Headers:', headers.length, 'columns');
    
    // Initialize data structure
    const dataMap: DentalDataMap = {
      all: [],
      urayasu: [],
      marunouchi: [],
      kunisaki: [],
      personnel: []
    };
    
    // Maps to store data temporarily
    const branchDataMap: { [key: string]: DentalMonthlyData[] } = {
      urayasu: [],
      marunouchi: [],
      kunisaki: []
    };
    const personnelDataMap: { [key: string]: { id: string; name: string; branchId: BranchId; data: DentalMonthlyData[] } } = {};
    
    // Parse each data line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      
      // Create object from headers and values
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      
      // Parse monthly data
      const monthlyData: DentalMonthlyData = {
        month: row.month || '',
        totalRevenue: parseFloat(row.totalRevenue) || 0,
        insuranceRevenue: parseFloat(row.insuranceRevenue) || 0,
        selfPayRevenue: parseFloat(row.selfPayRevenue) || 0,
        otherRevenue: parseFloat(row.otherRevenue) || 0,
        targetRevenue: parseFloat(row.targetRevenue) || 0,
        costMaterials: parseFloat(row.costMaterials) || 0,
        costMaterialsSelfPay: parseFloat(row.costMaterialsSelfPay) || 0,
        costLabInsurance: parseFloat(row.costLabInsurance) || 0,
        costLabSelfPay: parseFloat(row.costLabSelfPay) || 0,
        totalCost: parseFloat(row.totalCost) || 0,
        grossProfit: parseFloat(row.grossProfit) || 0,
        expensePersonnel: parseFloat(row.expensePersonnel) || 0,
        expenseSpecialist: parseFloat(row.expenseSpecialist) || 0,
        expenseTraining: parseFloat(row.expenseTraining) || 0,
        expenseAds: parseFloat(row.expenseAds) || 0,
        expenseCommission: parseFloat(row.expenseCommission) || 0,
        expenseDepreciation: parseFloat(row.expenseDepreciation) || 0,
        expenseOtherSGA: parseFloat(row.expenseOtherSGA) || 0,
        totalSGA: parseFloat(row.totalSGA) || 0,
        operatingProfit: parseFloat(row.operatingProfit) || 0,
        profitMargin: parseFloat(row.profitMargin) || 0,
        newPatients: parseInt(row.newPatients) || 0,
        totalPatients: parseInt(row.totalPatients) || 0,
        selfPayRate: parseFloat(row.selfPayRate) || 0,
        unitUtilizationRate: parseFloat(row.unitUtilizationRate) || 0,
        cancellationRate: parseFloat(row.cancellationRate) || 0,
        hpVisits: parseInt(row.hpVisits) || 0,
        reserveVisits: parseInt(row.reserveVisits) || 0,
        googleVisits: parseInt(row.googleVisits) || 0,
      };
      
      // Check if this is staff data (has staffId and staffName)
      if (row.staffId && row.staffName) {
        const staffId = row.staffId;
        const staffName = row.staffName;
        const branchId = row.branchId as BranchId;
        
        if (!personnelDataMap[staffId]) {
          personnelDataMap[staffId] = {
            id: staffId,
            name: staffName,
            branchId: branchId,
            data: []
          };
        }
        personnelDataMap[staffId].data.push(monthlyData);
        
        // Also add staff data to branch aggregation
        if (branchDataMap[branchId]) {
          // Check if this month already exists in branch data
          const existingMonthData = branchDataMap[branchId].find(d => d.month === monthlyData.month);
          if (existingMonthData) {
            // Aggregate with existing data
            existingMonthData.totalRevenue += monthlyData.totalRevenue;
            existingMonthData.insuranceRevenue += monthlyData.insuranceRevenue;
            existingMonthData.selfPayRevenue += monthlyData.selfPayRevenue;
            existingMonthData.otherRevenue += monthlyData.otherRevenue;
            existingMonthData.targetRevenue += monthlyData.targetRevenue;
            existingMonthData.costMaterials += monthlyData.costMaterials;
            existingMonthData.costMaterialsSelfPay += monthlyData.costMaterialsSelfPay;
            existingMonthData.costLabInsurance += monthlyData.costLabInsurance;
            existingMonthData.costLabSelfPay += monthlyData.costLabSelfPay;
            existingMonthData.totalCost += monthlyData.totalCost;
            existingMonthData.grossProfit += monthlyData.grossProfit;
            existingMonthData.expensePersonnel += monthlyData.expensePersonnel;
            existingMonthData.expenseSpecialist += monthlyData.expenseSpecialist;
            existingMonthData.expenseTraining += monthlyData.expenseTraining;
            existingMonthData.expenseAds += monthlyData.expenseAds;
            existingMonthData.expenseCommission += monthlyData.expenseCommission;
            existingMonthData.expenseDepreciation += monthlyData.expenseDepreciation;
            existingMonthData.expenseOtherSGA += monthlyData.expenseOtherSGA;
            existingMonthData.totalSGA += monthlyData.totalSGA;
            existingMonthData.operatingProfit += monthlyData.operatingProfit;
            existingMonthData.newPatients += monthlyData.newPatients;
            existingMonthData.totalPatients += monthlyData.totalPatients;
            // For percentage values, we'll recalculate later
          } else {
            // Add as new month entry
            branchDataMap[branchId].push({...monthlyData});
          }
        }
      }
      // Otherwise it's branch data
      else if (row.branchId) {
        const branchId = row.branchId as string;
        if (branchDataMap[branchId]) {
          branchDataMap[branchId].push(monthlyData);
        }
      }
    }
    
    // Assign branch data and recalculate percentage values for aggregated staff data
    ['urayasu', 'marunouchi', 'kunisaki'].forEach(branchKey => {
      const branchData = branchDataMap[branchKey as keyof typeof branchDataMap];
      branchData.forEach(monthData => {
        // Recalculate percentage values
        if (monthData.totalRevenue > 0) {
          monthData.profitMargin = (monthData.operatingProfit / monthData.totalRevenue) * 100;
          monthData.selfPayRate = (monthData.selfPayRevenue / monthData.totalRevenue) * 100;
        }
      });
    });
    
    dataMap.urayasu = branchDataMap.urayasu.sort((a, b) => a.month.localeCompare(b.month));
    dataMap.marunouchi = branchDataMap.marunouchi.sort((a, b) => a.month.localeCompare(b.month));
    dataMap.kunisaki = branchDataMap.kunisaki.sort((a, b) => a.month.localeCompare(b.month));
    
    console.log('Branch data after assignment:', {
      urayasu: dataMap.urayasu.length,
      marunouchi: dataMap.marunouchi.length,
      kunisaki: dataMap.kunisaki.length
    });
    
    // Calculate 'all' by aggregating all branches
    const allMonths = new Set<string>();
    Object.values(branchDataMap).forEach(branchData => {
      branchData.forEach(d => allMonths.add(d.month));
    });
    
    dataMap.all = Array.from(allMonths).sort().map(month => {
      const monthData = {
        month,
        totalRevenue: 0,
        insuranceRevenue: 0,
        selfPayRevenue: 0,
        otherRevenue: 0,
        targetRevenue: 0,
        costMaterials: 0,
        costMaterialsSelfPay: 0,
        costLabInsurance: 0,
        costLabSelfPay: 0,
        totalCost: 0,
        grossProfit: 0,
        expensePersonnel: 0,
        expenseSpecialist: 0,
        expenseTraining: 0,
        expenseAds: 0,
        expenseCommission: 0,
        expenseDepreciation: 0,
        expenseOtherSGA: 0,
        totalSGA: 0,
        operatingProfit: 0,
        profitMargin: 0,
        newPatients: 0,
        totalPatients: 0,
        selfPayRate: 0,
        unitUtilizationRate: 0,
        cancellationRate: 0,
        hpVisits: 0,
        reserveVisits: 0,
        googleVisits: 0,
      };
      
      let count = 0;
      Object.values(branchDataMap).forEach(branchData => {
        const data = branchData.find(d => d.month === month);
        if (data) {
          monthData.totalRevenue += data.totalRevenue;
          monthData.insuranceRevenue += data.insuranceRevenue;
          monthData.selfPayRevenue += data.selfPayRevenue;
          monthData.otherRevenue += data.otherRevenue;
          monthData.targetRevenue += data.targetRevenue;
          monthData.costMaterials += data.costMaterials;
          monthData.costMaterialsSelfPay += data.costMaterialsSelfPay;
          monthData.costLabInsurance += data.costLabInsurance;
          monthData.costLabSelfPay += data.costLabSelfPay;
          monthData.totalCost += data.totalCost;
          monthData.grossProfit += data.grossProfit;
          monthData.expensePersonnel += data.expensePersonnel;
          monthData.expenseSpecialist += data.expenseSpecialist;
          monthData.expenseTraining += data.expenseTraining;
          monthData.expenseAds += data.expenseAds;
          monthData.expenseCommission += data.expenseCommission;
          monthData.expenseDepreciation += data.expenseDepreciation;
          monthData.expenseOtherSGA += data.expenseOtherSGA;
          monthData.totalSGA += data.totalSGA;
          monthData.operatingProfit += data.operatingProfit;
          monthData.newPatients += data.newPatients;
          monthData.totalPatients += data.totalPatients;
          monthData.selfPayRate += data.selfPayRate;
          monthData.unitUtilizationRate += data.unitUtilizationRate;
          monthData.cancellationRate += data.cancellationRate;
          monthData.hpVisits += data.hpVisits;
          monthData.reserveVisits += data.reserveVisits;
          monthData.googleVisits += data.googleVisits;
          count++;
        }
      });
      
      // Calculate averages for percentage values
      if (count > 0) {
        monthData.profitMargin = monthData.totalRevenue > 0 ? (monthData.operatingProfit / monthData.totalRevenue) * 100 : 0;
        monthData.selfPayRate = monthData.selfPayRate / count;
        monthData.unitUtilizationRate = monthData.unitUtilizationRate / count;
        monthData.cancellationRate = monthData.cancellationRate / count;
      }
      
      return monthData;
    });
    
    // Assign personnel data
    dataMap.personnel = Object.values(personnelDataMap).map(staff => ({
      id: staff.id,
      name: staff.name,
      branchId: staff.branchId,
      monthlyData: staff.data.sort((a, b) => a.month.localeCompare(b.month))
    }));
    
    console.log('parseCSV complete - data counts:', {
      all: dataMap.all.length,
      urayasu: dataMap.urayasu.length,
      marunouchi: dataMap.marunouchi.length,
      kunisaki: dataMap.kunisaki.length,
      personnel: dataMap.personnel.length
    });
    
    return dataMap;
  } catch (error) {
    console.error('CSV parsing error:', error);
    // Return demo data on error
    console.log('Returning demo data due to error');
    return generateDemoDataMap();
  }
};

export const generateDemoDataMap = (): DentalDataMap => {
  const months = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
  ];
  
  const generateMonthlyData = (baseRevenue: number): DentalMonthlyData[] => {
    return months.map(month => {
      const variance = 0.8 + Math.random() * 0.4; // 80-120% variance
      const totalRevenue = Math.floor(baseRevenue * variance);
      const insuranceRevenue = Math.floor(totalRevenue * 0.6);
      const selfPayRevenue = Math.floor(totalRevenue * 0.35);
      const otherRevenue = totalRevenue - insuranceRevenue - selfPayRevenue;
      
      const totalCost = Math.floor(totalRevenue * 0.25);
      const grossProfit = totalRevenue - totalCost;
      
      const totalSGA = Math.floor(totalRevenue * 0.45);
      const operatingProfit = grossProfit - totalSGA;
      const profitMargin = (operatingProfit / totalRevenue) * 100;
      
      return {
        month,
        totalRevenue,
        insuranceRevenue,
        selfPayRevenue,
        otherRevenue,
        targetRevenue: Math.floor(baseRevenue * 1.05),
        
        costMaterials: Math.floor(totalCost * 0.4),
        costMaterialsSelfPay: Math.floor(totalCost * 0.2),
        costLabInsurance: Math.floor(totalCost * 0.25),
        costLabSelfPay: Math.floor(totalCost * 0.15),
        totalCost,
        
        grossProfit,
        
        expensePersonnel: Math.floor(totalSGA * 0.6),
        expenseSpecialist: Math.floor(totalSGA * 0.1),
        expenseTraining: Math.floor(totalSGA * 0.05),
        expenseAds: Math.floor(totalSGA * 0.1),
        expenseCommission: Math.floor(totalSGA * 0.05),
        expenseDepreciation: Math.floor(totalSGA * 0.05),
        expenseOtherSGA: Math.floor(totalSGA * 0.05),
        totalSGA,
        
        operatingProfit,
        profitMargin,
        
        newPatients: Math.floor(50 + Math.random() * 30),
        totalPatients: Math.floor(300 + Math.random() * 100),
        
        selfPayRate: (selfPayRevenue / totalRevenue) * 100,
        
        unitUtilizationRate: 75 + Math.random() * 20,
        cancellationRate: Math.random() * 5,
        
        hpVisits: Math.floor(1000 + Math.random() * 4000),
        reserveVisits: Math.floor(100 + Math.random() * 400),
        googleVisits: Math.floor(500 + Math.random() * 2500)
      };
    });
  };
  
  // Generate branch data
  const urayasuData = generateMonthlyData(15000000);
  const marunouchiData = generateMonthlyData(12000000);
  const kunisakiData = generateMonthlyData(8000000);
  
  // Calculate "all" data by aggregating branches
  const allData: DentalMonthlyData[] = months.map((month, idx) => {
    const u = urayasuData[idx];
    const m = marunouchiData[idx];
    const k = kunisakiData[idx];
    
    const totalRevenue = u.totalRevenue + m.totalRevenue + k.totalRevenue;
    const insuranceRevenue = u.insuranceRevenue + m.insuranceRevenue + k.insuranceRevenue;
    const selfPayRevenue = u.selfPayRevenue + m.selfPayRevenue + k.selfPayRevenue;
    const otherRevenue = u.otherRevenue + m.otherRevenue + k.otherRevenue;
    const totalCost = u.totalCost + m.totalCost + k.totalCost;
    const grossProfit = u.grossProfit + m.grossProfit + k.grossProfit;
    const totalSGA = u.totalSGA + m.totalSGA + k.totalSGA;
    const operatingProfit = u.operatingProfit + m.operatingProfit + k.operatingProfit;
    
    return {
      month,
      totalRevenue,
      insuranceRevenue,
      selfPayRevenue,
      otherRevenue,
      targetRevenue: u.targetRevenue + m.targetRevenue + k.targetRevenue,
      
      costMaterials: u.costMaterials + m.costMaterials + k.costMaterials,
      costMaterialsSelfPay: u.costMaterialsSelfPay + m.costMaterialsSelfPay + k.costMaterialsSelfPay,
      costLabInsurance: u.costLabInsurance + m.costLabInsurance + k.costLabInsurance,
      costLabSelfPay: u.costLabSelfPay + m.costLabSelfPay + k.costLabSelfPay,
      totalCost,
      
      grossProfit,
      
      expensePersonnel: u.expensePersonnel + m.expensePersonnel + k.expensePersonnel,
      expenseSpecialist: u.expenseSpecialist + m.expenseSpecialist + k.expenseSpecialist,
      expenseTraining: u.expenseTraining + m.expenseTraining + k.expenseTraining,
      expenseAds: u.expenseAds + m.expenseAds + k.expenseAds,
      expenseCommission: u.expenseCommission + m.expenseCommission + k.expenseCommission,
      expenseDepreciation: u.expenseDepreciation + m.expenseDepreciation + k.expenseDepreciation,
      expenseOtherSGA: u.expenseOtherSGA + m.expenseOtherSGA + k.expenseOtherSGA,
      totalSGA,
      
      operatingProfit,
      profitMargin: (operatingProfit / totalRevenue) * 100,
      
      newPatients: u.newPatients + m.newPatients + k.newPatients,
      totalPatients: u.totalPatients + m.totalPatients + k.totalPatients,
      
      selfPayRate: (selfPayRevenue / totalRevenue) * 100,
      
      unitUtilizationRate: (u.unitUtilizationRate! + m.unitUtilizationRate! + k.unitUtilizationRate!) / 3,
      cancellationRate: (u.cancellationRate! + m.cancellationRate! + k.cancellationRate!) / 3,
      
      hpVisits: u.hpVisits! + m.hpVisits! + k.hpVisits!,
      reserveVisits: u.reserveVisits! + m.reserveVisits! + k.reserveVisits!,
      googleVisits: u.googleVisits! + m.googleVisits! + k.googleVisits!
    };
  });
  
  // Generate personnel data
  const personnel = [
    { id: 'dr_tanaka', name: '田中 太郎', branchId: 'urayasu' as BranchId, monthlyData: generateMonthlyData(5000000) },
    { id: 'dr_sato', name: '佐藤 花子', branchId: 'urayasu' as BranchId, monthlyData: generateMonthlyData(4500000) },
    { id: 'dr_suzuki', name: '鈴木 一郎', branchId: 'marunouchi' as BranchId, monthlyData: generateMonthlyData(4000000) },
    { id: 'dr_yamada', name: '山田 美咲', branchId: 'marunouchi' as BranchId, monthlyData: generateMonthlyData(3800000) },
    { id: 'dr_watanabe', name: '渡辺 健', branchId: 'kunisaki' as BranchId, monthlyData: generateMonthlyData(3000000) }
  ];
  
  return {
    all: allData,
    urayasu: urayasuData,
    marunouchi: marunouchiData,
    kunisaki: kunisakiData,
    personnel
  };
};
