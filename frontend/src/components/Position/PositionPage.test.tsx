import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PositionPage from './PositionPage';
import { InterviewFlowResponse, CandidateItem, InterviewStep } from '../../types/position';
import { buildResponse } from '../../test-utils/fetchMocks';

/**
 * Captura el callback onCandidateMoved que PositionPage pasa a KanbanBoard.
 * Se actualiza en cada render del mock, garantizando que siempre
 * apunta a la versión con el closure más reciente del estado.
 */
let capturedOnCandidateMoved: ((candidateId: number, applicationId: number, targetStepId: number) => void) | null = null;

/**
 * Reemplazamos KanbanBoard con un mock que:
 * 1. Pinta los nombres de steps y candidatos (para los tests de carga)
 * 2. Expone un data-step por candidato (para verificar el optimistic update)
 * 3. Captura onCandidateMoved para dispararlo programáticamente en los tests de DnD
 *
 * De esta forma los tests de PositionPage no dependen de @dnd-kit/core,
 * y los tests de KanbanBoard/KanbanColumn (que sí usan el componente real)
 * siguen cubriendo la lógica interna de DnD.
 */
jest.mock('./KanbanBoard', () => {
    const MockedReact = require('react');
    return {
        __esModule: true,
        default: ({
            interviewSteps,
            candidates,
            onCandidateMoved,
        }: {
            interviewSteps: InterviewStep[];
            candidates: CandidateItem[];
            onCandidateMoved: (candidateId: number, applicationId: number, targetStepId: number) => void;
        }) => {
            capturedOnCandidateMoved = onCandidateMoved;
            return (
                <div data-testid="kanban-board">
                    {interviewSteps.map((s) => (
                        <div key={s.id}>{s.name}</div>
                    ))}
                    {candidates.map((c) => (
                        <div
                            key={c.applicationId}
                            data-testid={`candidate-${c.applicationId}`}
                            data-step={c.currentInterviewStep}
                        >
                            {c.fullName}
                        </div>
                    ))}
                </div>
            );
        },
    };
});

const mockInterviewFlow: InterviewFlowResponse = {
    interviewFlow: {
        positionName: 'Senior Backend Engineer',
        interviewFlow: {
            id: 1,
            description: null,
            interviewSteps: [
                { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'HR Screen', orderIndex: 1 },
                { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical', orderIndex: 2 },
            ],
        },
    },
};

const mockInterviewFlowSinSteps: InterviewFlowResponse = {
    interviewFlow: {
        positionName: 'Posición Sin Fases',
        interviewFlow: {
            id: 2,
            description: null,
            interviewSteps: [],
        },
    },
};

const mockCandidates: CandidateItem[] = [
    { id: 1, applicationId: 10, fullName: 'John Doe', currentInterviewStep: 'HR Screen', averageScore: 8 },
    { id: 2, applicationId: 11, fullName: 'Jane Smith', currentInterviewStep: 'Technical', averageScore: 6 },
];

const mockUpdateResponse = {
    message: 'Candidate updated',
    data: {
        id: 10,
        positionId: 1,
        candidateId: 1,
        applicationDate: '2024-01-15T00:00:00Z',
        currentInterviewStep: 2,
        notes: null,
        interviews: [],
    },
};

const renderPage = (path = '/positions/1') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/positions/:id" element={<PositionPage />} />
                <Route path="/positions" element={<div>Listado de posiciones</div>} />
            </Routes>
        </MemoryRouter>
    );

const mockFetch = (flowData: unknown, candidatesData: unknown): void => {
    global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
        .mockResolvedValueOnce(buildResponse(true, 200, flowData))
        .mockResolvedValueOnce(buildResponse(true, 200, candidatesData));
};

beforeEach(() => {
    capturedOnCandidateMoved = null;
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('PositionPage', () => {
    it('muestra el spinner durante la carga', async () => {
        mockFetch(mockInterviewFlow, mockCandidates);
        renderPage();

        expect(screen.getByRole('status')).toBeInTheDocument();

        await screen.findByText('Senior Backend Engineer');
    });

    it('muestra el título de la posición tras la carga exitosa', async () => {
        mockFetch(mockInterviewFlow, mockCandidates);
        renderPage();

        await screen.findByText('Senior Backend Engineer');
    });

    it('muestra las columnas del flujo de entrevistas', async () => {
        mockFetch(mockInterviewFlow, mockCandidates);
        renderPage();

        await screen.findByText('HR Screen');
        await screen.findByText('Technical');
    });

    it('ubica los candidatos según su fase actual', async () => {
        mockFetch(mockInterviewFlow, mockCandidates);
        renderPage();

        await screen.findByText('John Doe');
        await screen.findByText('Jane Smith');

        expect(screen.getByTestId('candidate-10')).toHaveAttribute('data-step', 'HR Screen');
        expect(screen.getByTestId('candidate-11')).toHaveAttribute('data-step', 'Technical');
    });

    it('muestra aviso informativo cuando la posición no tiene fases definidas', async () => {
        mockFetch(mockInterviewFlowSinSteps, []);
        renderPage();

        await screen.findByText(/Esta posición no tiene fases de entrevista definidas/);
        expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
    });

    it('muestra el board cuando la posición no tiene candidatos aún', async () => {
        mockFetch(mockInterviewFlow, []);
        renderPage();

        await screen.findByText('Senior Backend Engineer');
        expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    it('muestra alerta de error cuando falla la carga inicial', async () => {
        global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
            .mockResolvedValue(buildResponse(false, 500, {}));

        renderPage();

        await screen.findByText(/No se pudo cargar la posición/);
    });

    it('muestra botón Reintentar cuando el error es de red', async () => {
        global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
            .mockResolvedValue(buildResponse(false, 500, {}));

        renderPage();

        await screen.findByText('Reintentar');
    });

    it('muestra alerta de error cuando solo falla el fetch de candidatos', async () => {
        global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
            .mockResolvedValueOnce(buildResponse(true, 200, mockInterviewFlow))
            .mockResolvedValueOnce(buildResponse(false, 500, {}));

        renderPage();

        await screen.findByText(/No se pudo cargar la posición/);
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('muestra mensaje específico cuando la posición no existe (404)', async () => {
        global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
            .mockResolvedValue(buildResponse(false, 404, {}));

        renderPage();

        await screen.findByText(/La posición no existe/);
    });

    it('no muestra botón Reintentar cuando la posición no existe (404)', async () => {
        global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
            .mockResolvedValue(buildResponse(false, 404, {}));

        renderPage();

        await screen.findByText(/La posición no existe/);
        expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
    });

    it('muestra error genérico cuando el positionId es inválido (no numérico)', async () => {
        global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
            .mockResolvedValue(buildResponse(false, 400, {}));

        renderPage('/positions/abc-invalido');

        await screen.findByText(/No se pudo cargar la posición/);
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('navega a /positions al hacer clic en "Volver al listado"', async () => {
        mockFetch(mockInterviewFlow, mockCandidates);
        renderPage();
        await screen.findByText('Senior Backend Engineer');

        await act(async () => {
            userEvent.click(screen.getByText('Volver al listado'));
        });

        await screen.findByText('Listado de posiciones');
    });

    describe('drag & drop', () => {
        it('llama a fetch PUT con los parámetros correctos al soltar en otra columna', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockInterviewFlow))
                .mockResolvedValueOnce(buildResponse(true, 200, mockCandidates))
                .mockResolvedValueOnce(buildResponse(true, 200, mockUpdateResponse));

            renderPage();
            await screen.findByText('Senior Backend Engineer');

            await act(async () => {
                capturedOnCandidateMoved!(1, 10, 2);
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    'http://localhost:3010/candidates/1',
                    expect.objectContaining({
                        method: 'PUT',
                        body: JSON.stringify({ applicationId: 10, currentInterviewStep: 2 }),
                    })
                );
            });

            expect(screen.getByTestId('candidate-10')).toHaveAttribute('data-step', 'Technical');
        });

        it('revierte el optimistic update si el PUT falla', async () => {
            global.fetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
                .mockResolvedValueOnce(buildResponse(true, 200, mockInterviewFlow))
                .mockResolvedValueOnce(buildResponse(true, 200, mockCandidates))
                .mockResolvedValueOnce(buildResponse(false, 500, {}));

            renderPage();
            await screen.findByText('John Doe');

            expect(screen.getByTestId('candidate-10')).toHaveAttribute('data-step', 'HR Screen');

            await act(async () => {
                capturedOnCandidateMoved!(1, 10, 2);
            });

            await waitFor(() => {
                expect(
                    screen.getByText(/No se pudo mover el candidato/)
                ).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.getByTestId('candidate-10')).toHaveAttribute('data-step', 'HR Screen');
            });
        });
    });
});
