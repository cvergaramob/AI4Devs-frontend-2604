import {
    fetchInterviewFlow,
    fetchCandidatesByPosition,
    updateCandidateStep,
} from './positionService';
import { InterviewFlowResponse, CandidateItem, UpdateStepResponse } from '../types/position';
import { buildResponse } from '../test-utils/fetchMocks';

const mockFlow: InterviewFlowResponse = {
    interviewFlow: {
        positionName: 'Senior Backend Engineer',
        interviewFlow: {
            id: 1,
            description: null,
            interviewSteps: [
                { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'HR Screen', orderIndex: 1 },
            ],
        },
    },
};

const mockCandidates: CandidateItem[] = [
    { id: 1, applicationId: 10, fullName: 'John Doe', currentInterviewStep: 'HR Screen', averageScore: 8 },
];

const mockUpdateResponse: UpdateStepResponse = {
    message: 'Candidate updated',
    data: {
        id: 10,
        positionId: 1,
        candidateId: 1,
        applicationDate: '2024-01-15T00:00:00Z',
        currentInterviewStep: 2,
        notes: null,
    },
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe('positionService', () => {
    describe('fetchInterviewFlow', () => {
        it('devuelve los datos del flujo cuando la respuesta es exitosa', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockFlow));

            const result = await fetchInterviewFlow(1);

            expect(result).toEqual(mockFlow);
        });

        it('llama a fetch con la URL correcta', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockFlow));

            await fetchInterviewFlow(1);

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3010/position/1/interviewflow');
        });

        it('lanza POSITION_NOT_FOUND cuando la respuesta es 404', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(false, 404, {}));

            await expect(fetchInterviewFlow(1)).rejects.toThrow('POSITION_NOT_FOUND');
        });

        it('lanza un error genérico cuando la respuesta no es ok y no es 404', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(false, 500, {}));

            await expect(fetchInterviewFlow(1)).rejects.toThrow(
                'Error al obtener el flujo de entrevistas'
            );
        });

        it('lanza error genérico para respuesta 400 (positionId inválido)', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(false, 400, {}));

            await expect(fetchInterviewFlow('abc')).rejects.toThrow(
                'Error al obtener el flujo de entrevistas'
            );
        });

        it('propaga el error de red cuando fetch rechaza', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchInterviewFlow(1)).rejects.toThrow('Network error');
        });
    });

    describe('fetchCandidatesByPosition', () => {
        it('devuelve la lista de candidatos cuando la respuesta es exitosa', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockCandidates));

            const result = await fetchCandidatesByPosition(1);

            expect(result).toEqual(mockCandidates);
        });

        it('llama a fetch con la URL correcta', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockCandidates));

            await fetchCandidatesByPosition(1);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3010/position/1/candidates'
            );
        });

        it('lanza un error cuando la respuesta no es ok', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(false, 500, {}));

            await expect(fetchCandidatesByPosition(1)).rejects.toThrow(
                'Error al obtener los candidatos'
            );
        });

        it('propaga el error de red cuando fetch rechaza', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchCandidatesByPosition(1)).rejects.toThrow('Network error');
        });
    });

    describe('updateCandidateStep', () => {
        it('devuelve la respuesta de actualización cuando es exitosa', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockUpdateResponse));

            const result = await updateCandidateStep(1, 10, 2);

            expect(result).toEqual(mockUpdateResponse);
        });

        it('llama a fetch con la URL correcta y method PUT', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockUpdateResponse));

            await updateCandidateStep(1, 10, 2);

            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3010/candidates/1',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ applicationId: 10, currentInterviewStep: 2 }),
                })
            );
        });

        it('lanza un error cuando la respuesta no es ok', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(false, 400, {}));

            await expect(updateCandidateStep(1, 10, 2)).rejects.toThrow(
                'Error al actualizar el paso del candidato'
            );
        });

        it('propaga el error de red cuando fetch rechaza', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockRejectedValueOnce(new Error('Network error'));

            await expect(updateCandidateStep(1, 10, 2)).rejects.toThrow('Network error');
        });
    });
});
