import { query, sql } from '../db';
import { config } from '../config';

export interface MaintenanceData {
  serviceCount: number;
  lastServiceDate: Date | null;
  repairCount: number;
  lastRepairDate: Date | null;
  outstandingJobs: OutstandingJob[];
  outstandingRecalls: OutstandingRecall[];
}

export interface OutstandingJob {
  wonum: string;
  description: string;
  status: string;
  reportdate: Date | null;
  worktype: string;
}

export interface OutstandingRecall {
  recallnumber: string;
  campaigncode: string;
  campaignstatus: string;
  gb_vehiclemodel: string;
}

/**
 * Section B: Vehicle Maintenance data for a vehicle over a date range.
 */
export async function getMaintenanceData(
  assetnum: string,
  startDate: Date,
  endDate: Date
): Promise<MaintenanceData> {
  const COMPLETED_STATUSES = "('CLOSED','CAN','JOBCOMPLETED','WORKCOMPLETED','COMP')";

  // Service count in period
  const [svcCount] = await query<{ cnt: number }>(`
    SELECT COUNT(*) AS cnt
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND worktype = 'SERVICE'
      AND reportdate >= @startDate
      AND reportdate < @endDate
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
    endDate: { type: sql.DateTime, value: endDate },
  });

  // Last service date (within period)
  const [lastSvc] = await query<{ lastDate: Date | null }>(`
    SELECT MAX(statusdate) AS lastDate
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND worktype = 'SERVICE'
      AND status IN ${COMPLETED_STATUSES}
      AND reportdate >= @startDate
      AND reportdate < @endDate
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
    endDate: { type: sql.DateTime, value: endDate },
  });

  // Repair count in period
  const [repCount] = await query<{ cnt: number }>(`
    SELECT COUNT(*) AS cnt
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND worktype = 'REPAIR'
      AND reportdate >= @startDate
      AND reportdate < @endDate
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
    endDate: { type: sql.DateTime, value: endDate },
  });

  // Last repair date (within period)
  const [lastRep] = await query<{ lastDate: Date | null }>(`
    SELECT MAX(statusdate) AS lastDate
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND worktype = 'REPAIR'
      AND status IN ${COMPLETED_STATUSES}
      AND reportdate >= @startDate
      AND reportdate < @endDate
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
    startDate: { type: sql.DateTime, value: startDate },
    endDate: { type: sql.DateTime, value: endDate },
  });

  // Outstanding jobs (not completed/cancelled)
  const outstandingJobs = await query<OutstandingJob>(`
    SELECT TOP 20
      wonum, description, status, reportdate, worktype
    FROM workorder
    WHERE siteid = @siteId
      AND assetnum = @assetnum
      AND status NOT IN ${COMPLETED_STATUSES}
    ORDER BY reportdate DESC
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
  });

  // Outstanding recalls (gb_vehicle_recall uses recallnumber, campaigncode, campaignstatus)
  let outstandingRecalls: OutstandingRecall[] = [];
  try {
    outstandingRecalls = await query<OutstandingRecall>(`
      SELECT
        recallnumber,
        campaigncode,
        campaignstatus,
        ISNULL(gb_vehiclemodel, '') AS gb_vehiclemodel
      FROM gb_vehicle_recall
      WHERE siteid = @siteId
        AND assetnum = @assetnum
        AND ISNULL(campaignstatus, '') NOT IN ('COMP','CLOSED')
    `, {
      siteId: { type: sql.VarChar, value: config.siteId },
      assetnum: { type: sql.VarChar, value: assetnum },
    });
  } catch {
    // Table may not exist in all environments
  }

  return {
    serviceCount: svcCount?.cnt ?? 0,
    lastServiceDate: lastSvc?.lastDate ?? null,
    repairCount: repCount?.cnt ?? 0,
    lastRepairDate: lastRep?.lastDate ?? null,
    outstandingJobs,
    outstandingRecalls,
  };
}
