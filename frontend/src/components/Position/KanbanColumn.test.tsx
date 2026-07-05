import React from 'react';
import { render, screen } from '@testing-library/react';
import KanbanColumn from './KanbanColumn';
import { InterviewStep, CandidateItem } from '../../types/position';

jest.mock('@dnd-kit/core', () => ({
    useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        isDragging: false,
    }),
}));

const buildStep = (overrides?: Partial<InterviewStep>): InterviewStep => ({
    id: 1,
    interviewFlowId: 1,
    interviewTypeId: 1,
    name: 'HR Screen',
    orderIndex: 1,
    ...overrides,
});

const buildCandidate = (overrides?: Partial<CandidateItem>): CandidateItem => ({
    id: 1,
    applicationId: 10,
    fullName: 'Jane Smith',
    currentInterviewStep: 'HR Screen',
    averageScore: 5,
    ...overrides,
});

describe('KanbanColumn', () => {
    it('muestra el nombre del step en el header', () => {
        render(<KanbanColumn step={buildStep()} candidates={[]} />);
        expect(screen.getByText('HR Screen')).toBeInTheDocument();
    });

    it('muestra "Sin candidatos" cuando la lista está vacía', () => {
        render(<KanbanColumn step={buildStep()} candidates={[]} />);
        expect(screen.getByText('Sin candidatos')).toBeInTheDocument();
    });

    it('renderiza una tarjeta por cada candidato', () => {
        const candidates = [
            buildCandidate({ applicationId: 10, fullName: 'Jane Smith' }),
            buildCandidate({ applicationId: 11, fullName: 'Bob Brown' }),
        ];
        render(<KanbanColumn step={buildStep()} candidates={candidates} />);
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Brown')).toBeInTheDocument();
    });

    it('no muestra "Sin candidatos" cuando hay candidatos', () => {
        const candidates = [buildCandidate()];
        render(<KanbanColumn step={buildStep()} candidates={candidates} />);
        expect(screen.queryByText('Sin candidatos')).not.toBeInTheDocument();
    });
});
