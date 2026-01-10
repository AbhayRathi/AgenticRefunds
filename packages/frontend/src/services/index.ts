// import { mockService } from './mock';
import { realService } from './real';

// SWAP POINT: Now using real backend services
export const agentService = realService;

// Export AgentService type from real.ts (avoid duplicate export from mock.ts)
export type { AgentService } from './real';
