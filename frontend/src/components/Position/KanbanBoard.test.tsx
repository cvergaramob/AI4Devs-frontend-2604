import React from 'react';
import { render, screen } from '@testing-library/react';
import KanbanBoard from './KanbanBoard';
import { InterviewStep, CandidateItem } from '../../types/position';

jest.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    PointerSensor: jest.fn(),
    KeyboardSensor: jest.fn(),
    useSensor: jest.fn(),
    useSensors: jest.fn(() => []),
    useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        isDragging: false,
    }),
}));

const steps: InterviewStep[] = [
    { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'HR Screen', orderIndex: 1 },
    { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical', orderIndex: 2 },
    { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Cultural Fit', orderIndex: 3 },
];

const candidates: CandidateItem[] = [
    { id: 1, applicationId: 10, fullName: 'Alice Johnson', currentInterviewStep: 'HR Screen', averageScore: 9 },
    { id: 2, applicationId: 11, fullName: 'Bob Brown', currentInterviewStep: 'Technical', averageScore: 6 },
];

describe('KanbanBoard', () => {
    it('renderiza una columna por cada step', () => {
        render(<KanbanBoard interviewSteps={steps} candidates={candidates} onCandidateMoved={jest.fn()} />);
        expect(screen.getByText('HR Screen')).toBeInTheDocument();
        expect(screen.getByText('Technical')).toBeInTheDocument();
        expect(screen.getByText('Cultural Fit')).toBeInTheDocument();
    });

    it('coloca cada candidato en la columna correcta según currentInterviewStep', () => {
        render(<KanbanBoard interviewSteps={steps} candidates={candidates} onCandidateMoved={jest.fn()} />);
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Brown')).toBeInTheDocument();
    });

    it('muestra "Sin candidatos" en columnas vacías', () => {
        render(<KanbanBoard interviewSteps={steps} candidates={candidates} onCandidateMoved={jest.fn()} />);
        const emptyCells = screen.getAllByText('Sin candidatos');
        expect(emptyCells).toHaveLength(1);
    });

    it('respeta el orden de orderIndex en las columnas renderizadas', () => {
        const stepsDesordenados: InterviewStep[] = [
            { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Cultural Fit', orderIndex: 3 },
            { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'HR Screen', orderIndex: 1 },
            { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical', orderIndex: 2 },
        ];
        render(<KanbanBoard interviewSteps={stepsDesordenados} candidates={[]} onCandidateMoved={jest.fn()} />);
        const headers = screen.getAllByText(/HR Screen|Technical|Cultural Fit/);
        expect(headers[0]).toHaveTextContent('HR Screen');
        expect(headers[1]).toHaveTextContent('Technical');
        expect(headers[2]).toHaveTextContent('Cultural Fit');
    });

    it('muestra aviso para candidatos con etapa no reconocida en el flujo actual', () => {
        const candidateOrfano: CandidateItem = {
            id: 99,
            applicationId: 99,
            fullName: 'Carlos Ruiz',
            currentInterviewStep: 'Etapa Eliminada',
            averageScore: null,
        };
        render(
            <KanbanBoard
                interviewSteps={steps}
                candidates={[...candidates, candidateOrfano]}
                onCandidateMoved={jest.fn()}
            />
        );
        expect(screen.getByText(/Candidatos con etapa no reconocida/)).toBeInTheDocument();
        expect(screen.getByText(/Carlos Ruiz/)).toBeInTheDocument();
        expect(screen.getByText(/Etapa Eliminada/)).toBeInTheDocument();
    });

    it('no muestra el aviso de etapa no reconocida cuando todos los candidatos tienen etapa válida', () => {
        render(<KanbanBoard interviewSteps={steps} candidates={candidates} onCandidateMoved={jest.fn()} />);
        expect(screen.queryByText(/Candidatos con etapa no reconocida/)).not.toBeInTheDocument();
    });
});
