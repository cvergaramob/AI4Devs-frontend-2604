import {
    CandidateItem,
    InterviewFlowResponse,
    UpdateStepResponse,
} from '../types/position';

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3010';

export const fetchInterviewFlow = async (positionId: string | number): Promise<InterviewFlowResponse> => {
    const response = await fetch(`${BASE_URL}/position/${positionId}/interviewflow`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('POSITION_NOT_FOUND');
        }
        throw new Error('Error al obtener el flujo de entrevistas');
    }
    return response.json() as Promise<InterviewFlowResponse>;
};

export const fetchCandidatesByPosition = async (positionId: string | number): Promise<CandidateItem[]> => {
    const response = await fetch(`${BASE_URL}/position/${positionId}/candidates`);
    if (!response.ok) {
        throw new Error('Error al obtener los candidatos');
    }
    return response.json() as Promise<CandidateItem[]>;
};

export const updateCandidateStep = async (
    candidateId: number,
    applicationId: number,
    stepId: number
): Promise<UpdateStepResponse> => {
    const response = await fetch(`${BASE_URL}/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, currentInterviewStep: stepId }),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar el paso del candidato');
    }
    return response.json() as Promise<UpdateStepResponse>;
};
