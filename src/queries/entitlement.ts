import { query, sql } from '../db';
import { config } from '../config';

export interface EntitlementItem {
  agreement: string;
  opsCode: string;
  opsDesc: string;
  quantity: number;
  usedQty: number;
  balanceQty: number;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Section D: Parts entitlement balance for a vehicle.
 * Uses caentitle.gb_vehiclenum to match the asset.
 */
export async function getEntitlementData(assetnum: string): Promise<EntitlementItem[]> {
  return query<EntitlementItem>(`
    SELECT
      ce.agreement,
      ISNULL(ce.craft, '') AS opsCode,
      ISNULL(cr.description, '') AS opsDesc,
      MAX(ISNULL(ce.quantity, 0)) AS quantity,
      ISNULL(SUM(ce.usedqty), 0) AS usedQty,
      MAX(ISNULL(ce.balanceqty, 0)) AS balanceQty,
      MIN(ce.startdate) AS startDate,
      MAX(ce.enddate) AS endDate
    FROM caentitle ce
    LEFT JOIN craft cr ON cr.craft = ce.craft AND cr.orgid = ce.orgid
    WHERE ce.siteid = @siteId
      AND ce.gb_vehiclenum = @assetnum
    GROUP BY ce.agreement, ce.craft, cr.description
    ORDER BY ce.agreement, ce.craft
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
  });
}
