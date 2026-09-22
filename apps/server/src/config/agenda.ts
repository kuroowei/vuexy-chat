import { Agenda } from 'agenda';
import { MongoBackend } from '@agendajs/mongo-backend';
import { processAgentReply } from '../services/aiAgentService';
import { calculateVideoEarnings } from '../services/monetizationService';

const backend = new MongoBackend({
  address: process.env.MONGODB_URI || '',
  collection: 'agentJobs',
});

export const agenda = new Agenda({
  backend,
  processEvery: '5 seconds',
});

/**
 * Wires up the job processor. Takes small callback functions rather than the
 * raw `io`/`userSockets` objects directly, so this file stays decoupled from
 * Socket.io's internals — app.ts owns those and just hands us what we need.
 */
export function defineAgentJobs(
  emitToUser: (userId: string, event: string, payload: any) => void,
  isUserOnline: (userId: string) => boolean
) {
  agenda.define('generate-ai-reply', async (job) => {
    try {
      await processAgentReply(job.attrs.data as any, emitToUser, isUserOnline, agenda);
    } catch (err) {
      console.error('AI Agent job failed:', err);
      throw err;
    }
  });
}

/**
 * The video-monetization earnings calculation, run on a recurring schedule
 * (see startAgenda below) rather than triggered per-event — it's cheap to
 * scan all video posts periodically rather than reacting to every view.
 */
export function defineMonetizationJob() {
  agenda.define('calculate-video-earnings', async () => {
    try {
      const result = await calculateVideoEarnings();
      console.log(`Video earnings calculated for ${result.processed} post(s)`);
    } catch (err) {
      console.error('Video earnings calculation job failed:', err);
      throw err;
    }
  });
}

export async function startAgenda() {
  await agenda.start();
  console.log('Agenda (AI Agent job queue) started');
  await agenda.every('24 hours', 'calculate-video-earnings');
}