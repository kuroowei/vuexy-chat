import { Agenda } from 'agenda';
import { MongoBackend } from '@agendajs/mongo-backend';
import { processAgentReply } from '../services/aiAgentService';

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

export async function startAgenda() {
  await agenda.start();
  console.log('Agenda (AI Agent job queue) started');
}
