import { type StageConfig, type FollowUpDecision } from "./types";

export const STAGES: StageConfig[] = [
  {
    stage: 1,
    name: "Friendly Reminder",
    minDaysOverdue: 1,
    maxDaysOverdue: 4,
    escalationLevel: 1,
    toneDescriptions: {
      friendly: "A warm, gentle nudge about the pending invoice",
      professional: "A polite reminder about the outstanding payment",
      firm: "A clear notice about the overdue invoice",
    },
  },
  {
    stage: 2,
    name: "Social Framing",
    minDaysOverdue: 5,
    maxDaysOverdue: 9,
    escalationLevel: 2,
    toneDescriptions: {
      friendly: "Referencing shared relationship and mutual benefit",
      professional: "Emphasizing partnership value and payment norms",
      firm: "Noting industry standards and contractual obligations",
    },
  },
  {
    stage: 3,
    name: "Firm Reminder",
    minDaysOverdue: 10,
    maxDaysOverdue: 14,
    escalationLevel: 3,
    toneDescriptions: {
      friendly: "Expressing concern with understanding tone",
      professional: "Direct reminder with consequences mentioned",
      firm: "Clear statement of overdue status with next steps",
    },
  },
  {
    stage: 4,
    name: "Escalation",
    minDaysOverdue: 15,
    maxDaysOverdue: Infinity,
    escalationLevel: 4,
    toneDescriptions: {
      friendly: "Final friendly notice before formal action",
      professional: "Formal escalation notice with timeline",
      firm: "Final demand with specific consequences and deadlines",
    },
  },
];

export function determineStage(daysOverdue: number): StageConfig | null {
  if (daysOverdue < 1) return null;

  for (const stage of STAGES) {
    if (daysOverdue >= stage.minDaysOverdue && daysOverdue <= stage.maxDaysOverdue) {
      return stage;
    }
  }

  // Default to escalation for anything beyond defined stages
  return STAGES[STAGES.length - 1];
}

export function shouldSendFollowUp(
  daysOverdue: number,
  currentStage: number,
  lastFollowUpSentAt: string | null,
  intervalHours: number
): FollowUpDecision {
  if (daysOverdue < 1) {
    return { shouldSend: false, stage: null, reason: "Invoice is not yet overdue" };
  }

  const stage = determineStage(daysOverdue);

  if (!stage) {
    return { shouldSend: false, stage: null, reason: "No applicable stage found" };
  }

  // Check if we've already sent for this stage
  if (currentStage >= stage.stage && lastFollowUpSentAt) {
    const lastSent = new Date(lastFollowUpSentAt);
    const hoursSinceLastSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

    // Only resend if enough time has passed (for escalation stage)
    if (stage.stage < 4 || hoursSinceLastSent < intervalHours * 2) {
      return {
        shouldSend: false,
        stage,
        reason: `Already sent stage ${stage.stage} follow-up`,
      };
    }
  }

  // New stage to escalate to
  if (stage.stage > currentStage) {
    return {
      shouldSend: true,
      stage,
      reason: `Escalating to stage ${stage.stage}: ${stage.name}`,
    };
  }

  // Check if enough time has passed since last follow-up
  if (lastFollowUpSentAt) {
    const lastSent = new Date(lastFollowUpSentAt);
    const hoursSinceLastSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastSent < intervalHours) {
      return {
        shouldSend: false,
        stage,
        reason: `Waiting for interval (${hoursSinceLastSent.toFixed(1)}h / ${intervalHours}h)`,
      };
    }
  }

  return {
    shouldSend: true,
    stage,
    reason: `Sending stage ${stage.stage}: ${stage.name}`,
  };
}
