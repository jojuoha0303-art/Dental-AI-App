import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, AreaChart, Area
} from 'recharts';
import { Upload, Bell, Wallet, TrendingUp, Users, Percent, ChevronDown, Check, User } from 'lucide-react';
import { DentalMonthlyData, ViewMode, BranchId, DentalDataMap, ChartType } from '../types/dashboard';
import { parseCSV, generateDemoDataMap } from '../utils/csvParser';
import { KPICard } from '../components/KPICard';

interface DashboardProps {
    onReset?: () => void;
}

const BRANCHES: { id: BranchId; label: string; color: string }[] = [
  { id: 'all', label: '法人全体', color: 'bg-red-600' },
  { id: 'urayasu', label: '浦安院', color: 'bg-red-500' },
  { id: 'marunouchi', label: '丸の内院', color: 'bg-red-500' },
  { id: 'kunisaki', label: '国東院', color: 'bg-red-500' },
];

const CHART_TYPES: { id: ChartType; label: string; category: string }[] = [
    { id: 'revenue', label: '月次売上推移', category: 'General' },
    { id: 'streak', label: 'ストラック図 (経営分析)', category: 'Other' },
    { id: 'unit_utilization', label: 'ユニット稼働率 (個人)', category: 'Individual' },
    { id: 'cancellation_rate', label: 'キャンセル率 (個人)', category: 'Individual' },
    { id: 'individual_self_pay', label: '自費率 (個人)', category: 'Individual' },
    { id: 'patients', label: '患者数内訳 推移', category: 'General' },
    { id: 'hp_visits', label: 'HP訪問者数推移', category: 'Web' },
    { id: 'reserve_visits', label: '予約ページ訪問者数推移', category: 'Web' },
    { id: 'google_visits', label: 'Google map訪問者数推移', category: 'Web' },
];

export default function Dashboard({ onReset }: DashboardProps) {
  const [dataMap, setDataMap] = useState<DentalDataMap>(generateDemoDataMap());
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode] = useState<ViewMode>('monthly');
  
  const [selectedBranch, setSelectedBranch] = useState<BranchId>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedChart, setSelectedChart] = useState<ChartType>('revenue');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safety checks for dataMap
  const availableStaff = (dataMap.personnel || []).filter(p => selectedBranch === 'all' ? true : p.branchId === selectedBranch);

  let activeData: DentalMonthlyData[] = [];
  if (selectedStaffId === 'all') {
      activeData = dataMap[selectedBranch] || [];
  } else {
      const staff = (dataMap.personnel || []).find(p => p.id === selectedStaffId);
      activeData = staff ? staff.monthlyData : [];
  }

  if (!activeData || activeData.length === 0) {
      activeData = dataMap[selectedBranch] || [];
  }

  console.log('Dashboard render - selectedBranch:', selectedBranch, 'activeData length:', activeData?.length, 'dataMap keys:', Object.keys(dataMap));

  useEffect(() => {
    console.log('useEffect triggered - activeData.length:', activeData.length, 'selectedBranch:', selectedBranch, 'selectedStaffId:', selectedStaffId);
    if (activeData && activeData.length > 0) {
        const idx = activeData.length - 1;
        console.log('Setting selectedMonthIdx to:', idx);
        setSelectedMonthIdx(idx);
    } else {
        console.log('No activeData available');
        setSelectedMonthIdx(0);
    }
  }, [selectedBranch, selectedStaffId, activeData.length]);

  // Safety check - ensure we have data
  const selectedData = (activeData && activeData.length > 0) 
    ? (activeData[selectedMonthIdx] || activeData[0])
    : null;
  const previousData = (selectedData && selectedMonthIdx > 0) ? activeData[selectedMonthIdx - 1] : null;

  console.log('Render - activeData:', activeData?.length, 'selectedMonthIdx:', selectedMonthIdx, 'selectedData:', selectedData ? 'exists' : 'null');

  const annualTotal = (activeData && activeData.length > 0) ? activeData.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.totalRevenue,
      target: acc.target + curr.targetRevenue,
      patients: acc.patients + curr.newPatients,
      profit: acc.profit + curr.operatingProfit,
      insurance: acc.insurance + curr.insuranceRevenue,
      selfPay: acc.selfPay + curr.selfPayRevenue
  }), { revenue: 0, target: 0, patients: 0, profit: 0, insurance: 0, selfPay: 0 }) : { revenue: 0, target: 0, patients: 0, profit: 0, insurance: 0, selfPay: 0 };

  const annualSelfPayRate = annualTotal.revenue > 0 ? (annualTotal.selfPay / annualTotal.revenue) * 100 : 0;
  const annualProfitMargin = annualTotal.revenue > 0 ? (annualTotal.profit / annualTotal.revenue) * 100 : 0;

  const fmt = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('ja-JP').format(num);
  };
  const calculateGrowth = (current: number, prev: number) => {
    if (!prev) return { value: '0.0%', isPositive: true };
    const diff = ((current - prev) / prev) * 100;
    return {
      value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
      isPositive: diff >= 0
    };
  };

  let kpiData;
  const targetLabel = selectedStaffId === 'all' 
    ? (selectedBranch === 'all' ? '法人全体' : `${BRANCHES.find(b => b.id === selectedBranch)?.label} 計`)
    : availableStaff.find(s => s.id === selectedStaffId)?.name || '個人';

  if (!selectedData) {
    // No data available, use zero values
    kpiData = {
      revenue: 0,
      revenueSub: '円',
      revenueChange: undefined,
      revenueProgress: 0,
      profit: 0,
      profitSub: '円',
      profitChange: undefined,
      profitDesc: '利益率: 0.0%',
      patients: 0,
      patientsSub: '名',
      patientsChange: undefined,
      patientsDesc: '新患数',
      selfPayRate: 0,
      selfPaySub: '%',
      selfPayChange: undefined,
      selfPayDesc: '自費率'
    };
  } else if (viewMode === 'annual') {
      kpiData = {
          revenue: annualTotal.revenue || 0,
          revenueSub: '円 (年間累計)',
          revenueChange: undefined,
          revenueProgress: annualTotal.target > 0 ? (annualTotal.revenue / annualTotal.target) * 100 : 0,
          profit: annualTotal.profit || 0,
          profitSub: '円 (年間累計)',
          profitChange: undefined,
          profitDesc: `利益率: ${annualProfitMargin.toFixed(1)}%`,
          patients: annualTotal.patients || 0,
          patientsSub: '名 (年間新患計)',
          patientsChange: undefined,
          patientsDesc: `${targetLabel}`,
          selfPayRate: annualSelfPayRate || 0,
          selfPaySub: '% (年間平均)',
          selfPayChange: undefined,
          selfPayDesc: '自費率'
      };
  } else if (selectedData) {
      const revGrowth = previousData ? calculateGrowth(selectedData.totalRevenue, previousData.totalRevenue) : undefined;
      const profitGrowth = previousData ? calculateGrowth(selectedData.operatingProfit, previousData.operatingProfit) : undefined;
      const patientGrowth = previousData ? calculateGrowth(selectedData.newPatients, previousData.newPatients) : undefined;
      const selfPayDiff = previousData ? (selectedData.selfPayRate - previousData.selfPayRate) : 0;

      kpiData = {
        revenue: selectedData.totalRevenue || 0,
        revenueSub: '円',
        revenueChange: revGrowth ? { ...revGrowth, label: '前月比' } : undefined,
        revenueProgress: selectedData.targetRevenue ? (selectedData.totalRevenue / selectedData.targetRevenue) * 100 : 0,
        profit: selectedData.operatingProfit || 0,
        profitSub: '円',
        profitChange: profitGrowth ? { ...profitGrowth, label: '前月比' } : undefined,
        profitDesc: `利益率: ${(selectedData.profitMargin || 0).toFixed(1)}%`,
        patients: selectedData.newPatients || 0,
        patientsSub: '名',
        patientsChange: patientGrowth ? { ...patientGrowth, label: '前月比' } : undefined,
        patientsDesc: '新患数',
        selfPayRate: selectedData.selfPayRate || 0,
        selfPaySub: '%',
        selfPayChange: { value: `${selfPayDiff > 0 ? '+' : ''}${selfPayDiff.toFixed(1)}pt`, isPositive: selfPayDiff >= 0, label: '前月差' },
        selfPayDesc: '自費率'
    };
  } else {
      // Fallback to zero values if somehow selectedData is still null
      kpiData = {
        revenue: 0,
        revenueSub: '円',
        revenueChange: undefined,
        revenueProgress: 0,
        profit: 0,
        profitSub: '円',
        profitChange: undefined,
        profitDesc: '利益率: 0.0%',
        patients: 0,
        patientsSub: '名',
        patientsChange: undefined,
        patientsDesc: '新患数',
        selfPayRate: 0,
        selfPaySub: '%',
        selfPayChange: undefined,
        selfPayDesc: '自費率'
      };
  }

  const processCsvContents = (contents: string[]) => {
    try {
      console.log('Processing CSV, contents length:', contents.length);
      const content = contents[contents.length - 1];
      if (!content || content.trim().length === 0) {
        alert('有効なデータが見つかりませんでした。');
        return;
      }
      
      console.log('CSV content length:', content.length);
      const parsedMap = parseCSV(content);
      console.log('Parsed data:', {
        all: parsedMap.all.length,
        urayasu: parsedMap.urayasu.length,
        marunouchi: parsedMap.marunouchi.length,
        kunisaki: parsedMap.kunisaki.length,
        personnel: parsedMap.personnel.length
      });
      
      // Validate parsed data
      const hasData = parsedMap.all.length > 0 || 
                     parsedMap.urayasu.length > 0 || 
                     parsedMap.marunouchi.length > 0 || 
                     parsedMap.kunisaki.length > 0 ||
                     parsedMap.personnel.length > 0;
      
      if (!hasData) {
        alert('CSVファイルからデータを読み込めませんでした。形式を確認してください。');
        return;
      }
      
      console.log('Setting dataMap...');
      setDataMap(parsedMap);
      setIsDemo(false);
      setSelectedStaffId('all');
      setSelectedBranch('all');
      
      // Reset month index to the latest month
      const allData = parsedMap.all;
      if (allData && allData.length > 0) {
        console.log('Setting selectedMonthIdx to:', allData.length - 1);
        setSelectedMonthIdx(allData.length - 1);
      }
      
      console.log('CSV processing complete');
      alert('CSVファイルを正常に読み込みました。');
    } catch (error) {
      console.error('CSV processing error:', error);
      alert('CSVファイルの処理中にエラーが発生しました: ' + (error as Error).message);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsLoading(true);
      const filePromises = Array.from(files).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('ファイルの読み込みに失敗しました'));
            }
          };
          reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました'));
          reader.readAsText(file as Blob, 'UTF-8');
        });
      });

      try {
        const textContents = await Promise.all(filePromises);
        processCsvContents(textContents);
      } catch (error) {
        console.error('File reading error:', error);
        alert('ファイルの読み込みに失敗しました: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const renderChart = () => {
    if (!activeData || activeData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>データがありません</p>
        </div>
      );
    }

    const chartData = activeData.map(d => ({
        ...d,
        hpVisits: d.hpVisits || Math.floor(Math.random() * 5000) + 1000,
        reserveVisits: d.reserveVisits || Math.floor(Math.random() * 500) + 100,
        googleVisits: d.googleVisits || Math.floor(Math.random() * 3000) + 500,
        unitUtilizationRate: d.unitUtilizationRate || (75 + Math.random() * 20),
        cancellationRate: d.cancellationRate || (Math.random() * 5),
    }));

    const CommonGrid = () => <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />;
    const CommonXAxis = () => <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />;
    
    switch (selectedChart) {
        case 'revenue':
            return (
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CommonGrid />
                    <CommonXAxis />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val / 10000}万`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="insuranceRevenue" stackId="a" fill="#3b82f6" name="保険診療" radius={[0, 0, 4, 4]} barSize={40} opacity={viewMode === 'monthly' ? 0.7 : 1} />
                    <Bar yAxisId="left" dataKey="selfPayRevenue" stackId="a" fill="#06b6d4" name="自費診療" radius={[4, 4, 0, 0]} barSize={40} opacity={viewMode === 'monthly' ? 0.7 : 1} />
                    <Line yAxisId="right" type="monotone" dataKey="profitMargin" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} name="利益率" />
                </ComposedChart>
            );
        case 'streak':
            return renderStreakChart();
        case 'unit_utilization':
            return (
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CommonGrid />
                    <CommonXAxis />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="unitUtilizationRate" fill="#8b5cf6" name="ユニット稼働率" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line type="monotone" dataKey="unitUtilizationRate" stroke="#6d28d9" strokeWidth={2} dot={{r: 4}} />
                </ComposedChart>
            );
        case 'cancellation_rate':
            return (
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorCancel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CommonGrid />
                    <CommonXAxis />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}%`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="cancellationRate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCancel)" name="キャンセル率" />
                </AreaChart>
            );
        case 'individual_self_pay':
             return (
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CommonGrid />
                    <CommonXAxis />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="selfPayRate" fill="#f59e0b" name="自費率" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line type="monotone" dataKey="selfPayRate" stroke="#d97706" strokeWidth={2} dot={{r: 4}} />
                </ComposedChart>
             );
        case 'hp_visits':
        case 'reserve_visits':
        case 'google_visits':
             const dataKey = selectedChart === 'hp_visits' ? 'hpVisits' : selectedChart === 'reserve_visits' ? 'reserveVisits' : 'googleVisits';
             const color = selectedChart === 'hp_visits' ? '#8b5cf6' : selectedChart === 'reserve_visits' ? '#ec4899' : '#10b981';
             const label = selectedChart === 'hp_visits' ? 'HP訪問' : selectedChart === 'reserve_visits' ? '予約ページ' : 'Google Map';
             return (
                 <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CommonGrid />
                    <CommonXAxis />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${dataKey})`} name={label} />
                 </AreaChart>
             );
        case 'patients':
            return (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CommonGrid />
                    <CommonXAxis />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="newPatients" fill="#10b981" name="新患数" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="totalPatients" fill="#cbd5e1" name="総患者数(推計)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            );
        default:
            return <div className="flex items-center justify-center h-full text-slate-400">開発中 / データなし</div>;
    }
  };

  const renderStreakChart = () => {
    if (!selectedData || !activeData || activeData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>データがありません</p>
        </div>
      );
    }

    let stracData = selectedData;
    
    if (viewMode === 'annual') {
       const agg = activeData.reduce((acc, curr) => ({
           ...acc,
           totalRevenue: acc.totalRevenue + curr.totalRevenue,
           insuranceRevenue: acc.insuranceRevenue + curr.insuranceRevenue,
           selfPayRevenue: acc.selfPayRevenue + curr.selfPayRevenue,
           otherRevenue: acc.otherRevenue + curr.otherRevenue,
           
           costMaterials: acc.costMaterials + curr.costMaterials,
           costMaterialsSelfPay: acc.costMaterialsSelfPay + curr.costMaterialsSelfPay,
           costLabInsurance: acc.costLabInsurance + curr.costLabInsurance,
           costLabSelfPay: acc.costLabSelfPay + curr.costLabSelfPay,
           totalCost: acc.totalCost + curr.totalCost,
           
           grossProfit: acc.grossProfit + curr.grossProfit,

           expensePersonnel: acc.expensePersonnel + curr.expensePersonnel,
           expenseSpecialist: acc.expenseSpecialist + curr.expenseSpecialist,
           expenseTraining: acc.expenseTraining + curr.expenseTraining,
           expenseAds: acc.expenseAds + curr.expenseAds,
           expenseCommission: acc.expenseCommission + curr.expenseCommission,
           expenseDepreciation: acc.expenseDepreciation + curr.expenseDepreciation,
           expenseOtherSGA: acc.expenseOtherSGA + curr.expenseOtherSGA,
           totalSGA: acc.totalSGA + curr.totalSGA,
           
           operatingProfit: acc.operatingProfit + curr.operatingProfit
       }), {
           totalRevenue: 0, insuranceRevenue: 0, selfPayRevenue: 0, otherRevenue: 0,
           costMaterials: 0, costMaterialsSelfPay: 0, costLabInsurance: 0, costLabSelfPay: 0, totalCost: 0,
           grossProfit: 0,
           expensePersonnel: 0, expenseSpecialist: 0, expenseTraining: 0, expenseAds: 0, expenseCommission: 0, expenseDepreciation: 0, expenseOtherSGA: 0, totalSGA: 0,
           operatingProfit: 0
       } as DentalMonthlyData);
       stracData = agg;
    }

    const pct = (val: number) => stracData.totalRevenue > 0 ? ((val / stracData.totalRevenue) * 100) : 0;
    const PctBar = ({ val, color, label }: { val: number, color: string, label: string }) => {
        const percentage = pct(val);
        if (percentage < 1) return null;
        return (
            <div className={`${color} flex items-center justify-between px-2 text-xs text-white border-b border-white/20`} style={{ height: `${percentage}%` }}>
                <span className="truncate mr-1">{label}</span>
                <span>{fmt(val)}</span>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex p-4 gap-4 bg-slate-50 rounded-lg overflow-hidden relative text-sm">
            <div className="flex-1 flex flex-col h-full rounded-md overflow-hidden shadow-sm relative">
                <div className="absolute top-0 left-0 w-full text-center bg-blue-900 text-white py-1 font-bold z-10 text-xs">売上高合計 {fmt(stracData.totalRevenue)}</div>
                <div className="flex-1 flex flex-col pt-6 bg-blue-50">
                     <div className="flex-1 flex flex-col justify-end">
                         <PctBar val={stracData.insuranceRevenue} color="bg-blue-500" label="保険診療" />
                         <PctBar val={stracData.selfPayRevenue} color="bg-cyan-500" label="自由診療" />
                         <PctBar val={stracData.otherRevenue} color="bg-indigo-400" label="その他" />
                     </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full rounded-md overflow-hidden shadow-sm relative">
                <div className="absolute top-0 left-0 w-full text-center bg-slate-700 text-white py-1 font-bold z-10 text-xs">費用・利益構成</div>
                <div className="flex-1 flex flex-col pt-6 bg-slate-100">
                     <div className="w-full relative group">
                        <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 whitespace-nowrap hidden group-hover:block">売上原価 {pct(stracData.totalCost).toFixed(1)}%</div>
                        <PctBar val={stracData.costMaterials} color="bg-rose-400" label="材料仕入" />
                        <PctBar val={stracData.costMaterialsSelfPay} color="bg-rose-500" label="自費材料" />
                        <PctBar val={stracData.costLabInsurance} color="bg-orange-400" label="保険技工" />
                        <PctBar val={stracData.costLabSelfPay} color="bg-orange-500" label="自費技工" />
                     </div>
                     
                     <div className="w-full relative group">
                        <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 whitespace-nowrap hidden group-hover:block">販管費 {pct(stracData.totalSGA).toFixed(1)}%</div>
                        <PctBar val={stracData.expensePersonnel} color="bg-yellow-500" label="人件費" />
                        <PctBar val={stracData.expenseSpecialist} color="bg-yellow-600" label="専門医" />
                        <PctBar val={stracData.expenseAds} color="bg-lime-500" label="広告費" />
                        <PctBar val={stracData.expenseDepreciation} color="bg-slate-400" label="減価償却" />
                        <div className="flex-1 bg-slate-300 flex items-center justify-between px-2 text-xs text-slate-700 border-b border-white/20" style={{ height: `${pct(stracData.expenseTraining + stracData.expenseCommission + stracData.expenseOtherSGA)}%` }}>
                            <span>その他販管</span>
                            <span>{fmt(stracData.expenseTraining + stracData.expenseCommission + stracData.expenseOtherSGA)}</span>
                        </div>
                     </div>

                     <div className="bg-emerald-500 flex items-center justify-center text-white font-bold flex-col relative" style={{ height: `${pct(stracData.operatingProfit)}%`, minHeight: '24px' }}>
                         <span className="text-xs">営業利益</span>
                         <span className="text-sm">{fmt(stracData.operatingProfit)}</span>
                         <span className="absolute right-1 bottom-1 text-[10px] opacity-80">{pct(stracData.operatingProfit).toFixed(1)}%</span>
                     </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="flex-1 min-w-0 bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center text-sm text-slate-500">
           {onReset && (
             <button onClick={onReset} className="hover:text-blue-600 cursor-pointer mr-2">
               ← メニュー
             </button>
           )}
           <span className="mx-2">›</span>
           <span className="font-medium text-slate-800">
             {viewMode === 'annual' ? '年間サマリー' : `${selectedData?.month || '---'} 経営レポート`}
           </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Current Date</p>
            <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</p>
          </div>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative">
             <Bell size={20} />
             {isDemo && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-8">
           <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-blue-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold">LATEST REPORT</span>
                        <span className="text-blue-200 text-xs">{selectedData?.month || '---'} Data Updated</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                        {selectedData?.month ? selectedData.month.replace('-', '年') : '---'}月期 経営分析サマリー
                    </h2>
                    <p className="text-blue-100/90 text-sm leading-relaxed max-w-xl">
                        {targetLabel}の売上高は{fmt(kpiData.revenue)}円です。
                        {selectedStaffId === 'all' 
                            ? `自費率は${(selectedData?.selfPayRate || 0).toFixed(1)}%を達成し、前月比で改善傾向にあります。` 
                            : '個人の診療実績詳細を確認できます。'}
                        {isDemo && <span className="block mt-2 text-yellow-300 text-xs">※現在はデモデータを表示しています。CSVをアップロードして自院データを分析しましょう。</span>}
                    </p>
                 </div>
                 
                 <div className="flex flex-col items-end gap-4 mt-4 md:mt-0">
                    <div className="flex bg-white/10 p-1 rounded-lg backdrop-blur-sm">
                        {BRANCHES.map((branch) => (
                            <button
                                key={branch.id}
                                onClick={() => { setSelectedBranch(branch.id); setSelectedStaffId('all'); }}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                    selectedBranch === branch.id 
                                    ? 'bg-white text-red-600 shadow-md' 
                                    : 'text-white hover:bg-white/10'
                                }`}
                            >
                                {branch.label}
                            </button>
                        ))}
                    </div>

                    {selectedBranch !== 'all' && (
                        <div className="relative w-full md:w-48">
                            <select 
                                className="w-full appearance-none bg-white/10 border border-white/20 text-white pl-9 pr-8 py-2 rounded-lg text-sm cursor-pointer hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                            >
                                <option value="all" className="text-slate-900 font-bold">全員 (合計)</option>
                                {availableStaff.map((staff) => (
                                    <option key={staff.id} value={staff.id} className="text-slate-900">
                                        {staff.name}
                                    </option>
                                ))}
                            </select>
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-white/70 pointer-events-none" />
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-white/70 pointer-events-none" />
                        </div>
                    )}
                    
                    <div className="flex gap-2 w-full justify-end">
                       <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold text-xs shadow-lg flex items-center transition-all disabled:opacity-70">
                          <Upload size={14} className="mr-2" />
                          CSVインポート
                       </button>
                       <input type="file" accept=".csv" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {viewMode === 'monthly' && activeData && activeData.length > 0 && (
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-700 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${BRANCHES.find(b => b.id === selectedBranch)?.color}`}></span>
                    {targetLabel} レポート
                </h3>
                <div className="relative">
                    <select 
                        className="appearance-none bg-white border border-slate-300 text-slate-700 pl-4 pr-10 py-2 rounded-lg shadow-sm cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={selectedMonthIdx}
                        onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                    >
                        {activeData.map((d, idx) => (
                            <option key={d.month} value={idx}>
                                {d.month}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard 
               title="売上高合計" 
               value={fmt(kpiData.revenue)}
               subValue={kpiData.revenueSub}
               icon={<Wallet size={20} />}
               colorClass="text-blue-600 bg-blue-50"
               change={kpiData.revenueChange}
               progress={kpiData.revenueProgress}
            />
            <KPICard 
               title="医業利益" 
               value={fmt(kpiData.profit)}
               subValue={kpiData.profitSub}
               icon={<TrendingUp size={20} />}
               colorClass="text-indigo-600 bg-indigo-50"
               change={kpiData.profitChange}
               description={kpiData.profitDesc}
            />
            <KPICard 
               title="来院患者数" 
               value={fmt(kpiData.patients)}
               subValue={kpiData.patientsSub}
               icon={<Users size={20} />}
               colorClass="text-emerald-600 bg-emerald-50"
               change={kpiData.patientsChange}
               description={kpiData.patientsDesc}
            />
            <KPICard 
               title="自費率" 
               value={(kpiData.selfPayRate || 0).toFixed(1)}
               subValue={kpiData.selfPaySub}
               icon={<Percent size={20} />}
               colorClass="text-amber-600 bg-amber-50"
               change={kpiData.selfPayChange}
               description={kpiData.selfPayDesc}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                        {CHART_TYPES.find(c => c.id === selectedChart)?.label}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {targetLabel}のデータ推移
                    </p>
                  </div>
                  {selectedChart === 'revenue' && (
                    <div className="flex items-center space-x-2 text-xs">
                         <span className="flex items-center text-slate-500"><span className="w-2 h-2 bg-blue-500 rounded-sm mr-1"></span>保険</span>
                         <span className="flex items-center text-slate-500"><span className="w-2 h-2 bg-cyan-400 rounded-sm mr-1"></span>自費</span>
                    </div>
                  )}
               </div>
               
               <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      {renderChart()}
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <h4 className="font-bold text-slate-700 mb-4 px-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-red-500" />
                    分析項目を選択
                </h4>
                <div className="space-y-1">
                    {['General', 'Individual', 'Web', 'Other'].map(category => {
                         const charts = CHART_TYPES.filter(c => c.category === category);
                         if (charts.length === 0) return null;

                         return (
                            <div key={category} className="mb-4">
                                <div className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2">{category}</div>
                                {charts.map((chart) => (
                                    <button
                                        key={chart.id}
                                        onClick={() => setSelectedChart(chart.id)}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${
                                            selectedChart === chart.id
                                            ? 'bg-red-50 text-red-600'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>{chart.label}</span>
                                        {selectedChart === chart.id && <Check size={16} className="text-red-500" />}
                                    </button>
                                ))}
                            </div>
                         );
                    })}
                </div>
                
                <div className="mt-4 px-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        ※ 一部の項目（稼働率、キャンセル率など）はCSVに含まれないため、デモデータを表示しています。
                    </p>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}
