import { query, sql } from '../db';
import { config } from '../config';

export interface ScheduleData {
  serviceOverdue: boolean;
  nextServiceDate: Date | null;
  pmDetails: PMDetail[];
}

export interface PMDetail {
  pmnum: string;
  description: string;
  servicePkgType: string;
  wonum: string | null;
  woStatus: string | null;
  nextDueDate: Date | null;
  lastCompDate: Date | null;
  mileageReading: number | null;
  expiryDate: Date | null;
  isOverdue: boolean;
}

/**
 * Section C: Vehicle Schedule — based on Servicing_Schedule-GBE.rptdesign logic.
 * Uses pm.gb_assetregistrationno (vehicle no) to match, falls back to pm.assetnum.
 * Next due date cascade:
 *   1. If latest WO not completed & a completed WO has pmnextduedate → use that
 *   2. Else if latest WO has pmnextduedate → use that
 *   3. Else if pm.nextdate exists → use that
 *   4. Else if pm.lastcompdate exists → lastcompdate + frequency
 *   5. Else pm.laststartdate
 */
export async function getScheduleData(assetnum: string): Promise<ScheduleData> {
  const pms = await query<{
    pmnum: string;
    description: string | null;
    servicePkgType: string | null;
    wonum: string | null;
    woStatus: string | null;
    nextDueDate: Date | null;
    lastCompDate: Date | null;
    mileageReading: number | null;
    expiryDate: Date | null;
  }>(`
    SELECT DISTINCT
      pm.pmnum,
      pm.description,
      pm.gb_servicepkgtype AS servicePkgType,
      workorder.wonum,
      workorder.status AS woStatus,
      pm.lastcompdate AS lastCompDate,
      pm.GB_EXPIRYDATE AS expiryDate,
      ISNULL(
        (SELECT convert(NUMERIC, workorder2.gb_mileagereading)
         FROM workorder workorder2
         WHERE workorder2.actfinish IS NOT NULL
           AND workorder2.pmnum = pm.pmnum
           AND workorder2.siteid = pm.siteid
           AND workorder2.workorderid = (
             SELECT MAX(w.workorderid) FROM workorder w
             WHERE w.pmnum = pm.pmnum AND w.siteid = pm.siteid AND w.actfinish IS NOT NULL
           )
        ), 0
      ) AS mileageReading,
      (CASE
        WHEN workorder.status NOT IN ('JOBCOMPLETED','VEHCOLLECTED','CLOSED','CLOSE')
          AND (SELECT pmnextduedate FROM workorder WHERE workorderid IN (
                SELECT MAX(wo.workorderid) FROM workorder wo
                WHERE wo.pmnum = pm.pmnum AND wo.siteid = pm.siteid
                  AND wo.status IN ('JOBCOMPLETED','VEHCOLLECTED','CLOSED','CLOSE')
              )) IS NOT NULL
        THEN (SELECT pmnextduedate FROM workorder WHERE workorderid IN (
                SELECT MAX(wo.workorderid) FROM workorder wo
                WHERE wo.pmnum = pm.pmnum AND wo.siteid = pm.siteid
                  AND wo.status IN ('JOBCOMPLETED','VEHCOLLECTED','CLOSED','CLOSE')
              ))
        ELSE (CASE
          WHEN workorder.pmnextduedate IS NOT NULL THEN workorder.pmnextduedate
          ELSE (CASE
            WHEN pm.nextdate IS NOT NULL THEN pm.nextdate
            ELSE (CASE
              WHEN pm.lastcompdate IS NOT NULL THEN (
                CASE pm.frequnit
                  WHEN 'MONTHS' THEN DATEADD(MONTH, pm.frequency, pm.lastcompdate)
                  WHEN 'WEEKS'  THEN DATEADD(WEEK, pm.frequency, pm.lastcompdate)
                  WHEN 'DAYS'   THEN DATEADD(DAY, pm.frequency, pm.lastcompdate)
                  WHEN 'YEARS'  THEN DATEADD(YEAR, pm.frequency, pm.lastcompdate)
                  ELSE NULL
                END)
              ELSE pm.laststartdate
            END)
          END)
        END)
      END) AS nextDueDate
    FROM pm
    LEFT OUTER JOIN workorder ON workorder.pmnum = pm.pmnum
      AND workorder.siteid = pm.siteid
      AND workorder.workorderid IN (
        SELECT MAX(workorderid) FROM workorder WHERE pmnum = pm.pmnum AND siteid = pm.siteid
      )
    WHERE pm.siteid = @siteId
      AND pm.assetnum = @assetnum
      AND pm.assetnum IS NOT NULL
      AND pm.status = 'ACTIVE'
    ORDER BY pm.pmnum
  `, {
    siteId: { type: sql.VarChar, value: config.siteId },
    assetnum: { type: sql.VarChar, value: assetnum },
  });

  const now = new Date();
  const pmDetails: PMDetail[] = pms.map(pm => ({
    pmnum: pm.pmnum,
    description: pm.description ?? '',
    servicePkgType: pm.servicePkgType ?? '',
    wonum: pm.wonum,
    woStatus: pm.woStatus,
    nextDueDate: pm.nextDueDate,
    lastCompDate: pm.lastCompDate,
    mileageReading: pm.mileageReading,
    expiryDate: pm.expiryDate,
    isOverdue: pm.nextDueDate ? new Date(pm.nextDueDate) < now : false,
  }));

  const serviceOverdue = pmDetails.some(pm => pm.isOverdue);

  const nextServicePm = pmDetails
    .filter(pm => !pm.isOverdue && pm.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime())[0];

  return {
    serviceOverdue,
    nextServiceDate: nextServicePm?.nextDueDate ?? null,
    pmDetails,
  };
}
