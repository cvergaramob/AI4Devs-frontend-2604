import React from 'react';
import { render, screen } from '@testing-library/react';
import CandidateCard from './CandidateCard';
import { CandidateItem } from '../../types/position';

jest.mock('@dnd-kit/core', () => ({
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        isDragging: false,
    }),
}));

const buildCandidate = (overrides?: Partial<CandidateItem>): CandidateItem => ({
    id: 1,
    applicationId: 10,
    fullName: 'John Doe',
    currentInterviewStep: 'HR Screen',
    averageScore: 7.5,
    ...overrides,
});

describe('CandidateCard', () => {
    it('muestra el nombre completo del candidato', () => {
        render(<CandidateCard candidate={buildCandidate()} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('muestra 8 círculos para un score de 7.5 (redondea al entero más cercano)', () => {
        render(<CandidateCard candidate={buildCandidate({ averageScore: 7.5 })} />);
        expect(screen.getAllByTestId('score-dot')).toHaveLength(8);
    });

    it('muestra "Sin puntuación" cuando el score es 0', () => {
        render(<CandidateCard candidate={buildCandidate({ averageScore: 0 })} />);
        expect(screen.getByText('Sin puntuación')).toBeInTheDocument();
        expect(screen.queryByTestId('score-dot')).toBeNull();
    });

    it('muestra 8 círculos para un score entero de 8', () => {
        render(<CandidateCard candidate={buildCandidate({ averageScore: 8 })} />);
        expect(screen.getAllByTestId('score-dot')).toHaveLength(8);
    });

    it('muestra "Sin puntuación" cuando el score es null', () => {
        render(<CandidateCard candidate={buildCandidate({ averageScore: null })} />);
        expect(screen.getByText('Sin puntuación')).toBeInTheDocument();
        expect(screen.queryByTestId('score-dot')).toBeNull();
    });

    it('muestra 4 círculos para un score de 3.7 (redondea hacia arriba)', () => {
        render(<CandidateCard candidate={buildCandidate({ averageScore: 3.7 })} />);
        expect(screen.getAllByTestId('score-dot')).toHaveLength(4);
    });

    it('muestra 3 círculos para un score de 3.2 (redondea hacia abajo)', () => {
        render(<CandidateCard candidate={buildCandidate({ averageScore: 3.2 })} />);
        expect(screen.getAllByTestId('score-dot')).toHaveLength(3);
    });

    it('el nombre completo de más de 30 caracteres aparece íntegro en el DOM', () => {
        const longName = 'Maximiliano Alejandro Rodríguez García';
        render(<CandidateCard candidate={buildCandidate({ fullName: longName })} />);
        expect(screen.getByText(longName)).toBeInTheDocument();
    });
});
