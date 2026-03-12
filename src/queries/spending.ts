import { query, sql } from '../db';
import { config } from '../config';

export interface SpendingData {
  laborCost: number;
  materialCost: number;
  totalCost: number;
  mileageStart: number | null;
  mileageEnd: number | null;
  mileageDelta: number | null;
  costPerKm: number | null;
}

/**
 * Section E: Customer Spending for a vehicle over a date range.
 * Cost per km is calculated using gb_mileagereading from work orders.
 */
export async function getSpendingData(
  assetnum: string,
  startDate: Date,
  endDate: Date
): Promise<SpendingData> {
  // Chargeable labor cost
  const [labor] = await query<{ total: number }>(`
    SELECT ISNULL(SUM(lt.linecost), 0) AS total
    FROM labtrans lt
    JOIN workorder w ON w.wonum = lt.refwo AND w.siteid = lt.siteid
    WHERE lt.siteid = @siteId
      AND w.assetnum = @assetnum
      AND lt.gb_ischargeable = 1
      AND lt.transdate >= @startDate
      AND lt.transdate < @endDate
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
    endDate: { type: sql.DateTime, value: endDate },
  });

  // Material cost (issued items)
  const [material] = await query<{ total: number }>(`
    SELECT ISNULL(SUM(ABS(mt.linecost)), 0) AS total
    FROM matusetrans mt
    JOIN workorder w ON w.wonum = mt.refwo AND w.siteid = mt.siteid
    WHERE mt.siteid = @siteId
      AND w.assetnum = @assetnum
      AND mt.issuetype = 'ISSUE'
      AND mt.actualdate >= @startDate
      AND mt.actualdate < @endDate
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
    endDate: { type: sql.DateTime, value: endDate },
  });

  // Mileage at start of period (latest completed WO mileage before/at start date)
  const [mileStart] = await query<{ mileage: number | null }>(`
    SELECT TOP 1 CONVERT(NUMERIC, gb_mileagereading) AS mileage
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND gb_mileagereading IS NOT NULL
      AND actfinish IS NOT NULL
      AND actfinish <= @startDate
    ORDER BY actfinish DESC
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
  });

  // Mileage at end of period (latest completed WO mileage before/at end date)
  const [mileEnd] = await query<{ mileage: number | null }>(`
    SELECT TOP 1 CONVERT(NUMERIC, gb_mileagereading) AS mileage
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND gb_mileagereading IS NOT NULL
      AND actfinish IS NOT NULL
      AND actfinish <= @endDate
    ORDER BY actfinish DESC
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    endDate: { type: sql.DateTime, value: endDate },
  });

  const laborCost = labor?.total ?? 0;
  const materialCost = material?.total ?? 0;
  const totalCost = laborCost + materialCost;

  const mileageStart = mileStart?.mileage ?? null;
  const mileageEnd = mileEnd?.mileage ?? null;
  const mileageDelta = (mileageStart !== null && mileageEnd !== null)
    ? mileageEnd - mileageStart
    : null;
  const costPerKm = (mileageDelta && mileageDelta > 0)
    ? Math.round((totalCost / mileageDelta) * 100) / 100
    : null;

  return {
    laborCost: Math.round(laborCost * 100) / 100,
    materialCost: Math.round(materialCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    mileageStart,
    mileageEnd,
    mileageDelta,
    costPerKm,
  };
}
