import cron from 'node-cron';

/**
 * Schedule a 6-monthly report generation.
 * Runs on 1st of January and July at 6:00 AM SGT.
 */
export function startScheduler(generateFn: () => Promise<void>): void {
  // Cron: At 06:00 on day 1 of January and July
  const schedule = '0 6 1 1,7 *';

  cron.schedule(schedule, async () => {
    console.log(`[Scheduler] Starting 6-monthly report generation at ${new Date().toISOString()}`);
    try {
      await generateFn();
      console.log(`[Scheduler] Report generation completed successfully`);
    } catch (error) {
      console.error(`[Scheduler] Report generation failed:`, error);
    }
  }, {
    timezone: 'Asia/Singapore',
  });

  console.log(`[Scheduler] 6-monthly reports scheduled (Jan 1 & Jul 1, 06:00 SGT)`);
}
