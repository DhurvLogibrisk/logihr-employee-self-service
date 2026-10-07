export interface IntegrationTask {
  id: string;
  source: 'JIRA' | 'GITHUB' | 'INTERNAL';
  taskKey: string;
  title: string;
  project: string;
  suggestedActivity: string;
  status: string;
}

const MOCK_INTEGRATION_TASKS: IntegrationTask[] = [
  {
    id: 't-1',
    source: 'JIRA',
    taskKey: 'LB-402',
    title: 'Finalize Tamper-Proof IST Server Architecture',
    project: 'LogiHR Mobile ESS',
    suggestedActivity: 'Requirements Analysis',
    status: 'IN PROGRESS',
  },
  {
    id: 't-2',
    source: 'JIRA',
    taskKey: 'LB-408',
    title: 'Mobile Geofence & Haversine Distance Optimization',
    project: 'LogiHR Mobile ESS',
    suggestedActivity: 'Mobile App UI',
    status: 'IN PROGRESS',
  },
  {
    id: 't-3',
    source: 'GITHUB',
    taskKey: 'PR-124',
    title: 'Fix Add Timesheet multi-row state calculation and gap detector',
    project: 'LogiBrisk Core',
    suggestedActivity: 'Testing & QA',
    status: 'OPEN',
  },
  {
    id: 't-4',
    source: 'JIRA',
    taskKey: 'LB-420',
    title: 'Vehicle Fleet Master Schema & Rest APIs',
    project: 'LogiTransport',
    suggestedActivity: 'Backend Architecture',
    status: 'TO DO',
  },
  {
    id: 't-5',
    source: 'INTERNAL',
    taskKey: 'LB-399',
    title: 'Client Demo Review & Feedback Integration',
    project: 'LogiHR Mobile ESS',
    suggestedActivity: 'Client Demo Review',
    status: 'COMPLETED',
  },
  {
    id: 't-6',
    source: 'JIRA',
    taskKey: 'LB-510',
    title: 'Biometric Device Binding and Audit Logging',
    project: 'LogiHR Security',
    suggestedActivity: 'Database Optimization',
    status: 'IN PROGRESS',
  },
];

export async function searchIntegrationTasks(query: string): Promise<IntegrationTask[]> {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_INTEGRATION_TASKS.slice(0, 4);

  return MOCK_INTEGRATION_TASKS.filter(
    (t) =>
      t.taskKey.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.project.toLowerCase().includes(q) ||
      t.suggestedActivity.toLowerCase().includes(q)
  );
}
