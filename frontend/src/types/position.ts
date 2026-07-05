export type InterviewStep = {
    id: number;
    interviewFlowId: number;
    interviewTypeId: number;
    name: string;
    orderIndex: number;
};

export type InterviewFlowData = {
    id: number;
    description: string | null;
    interviewSteps: InterviewStep[];
};

export type InterviewFlowResponse = {
    interviewFlow: {
        positionName: string;
        interviewFlow: InterviewFlowData;
    };
};

export type CandidateItem = {
    id: number;
    applicationId: number;
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
};

export type UpdateStepResponse = {
    message: string;
    data: {
        id: number;
        positionId: number;
        candidateId: number;
        applicationDate: string;
        currentInterviewStep: number;
        notes: string | null;
        interviews?: Array<{
            interviewDate: string;
            interviewStep: string;
            score: number | null;
        }>;
    };
};
