import React from 'react';
import { Card } from 'react-bootstrap';
import { useDroppable } from '@dnd-kit/core';
import { InterviewStep, CandidateItem } from '../../types/position';
import CandidateCard from './CandidateCard';

type Props = {
    step: InterviewStep;
    candidates: CandidateItem[];
};

const KanbanColumn: React.FC<Props> = ({ step, candidates }) => {
    const { setNodeRef, isOver } = useDroppable({ id: step.id });

    return (
        <Card className={`h-100 ${isOver ? 'border-primary' : ''}`}>
            <Card.Header className="fw-bold bg-light">{step.name}</Card.Header>
            <Card.Body
                ref={setNodeRef}
                className="p-2"
                style={{ minHeight: '120px' }}
                role="list"
                aria-label={`Candidatos en ${step.name}`}
            >
                {candidates.length === 0 ? (
                    <p className="text-muted small text-center mt-2">Sin candidatos</p>
                ) : (
                    candidates.map((candidate) => (
                        <CandidateCard key={candidate.applicationId} candidate={candidate} />
                    ))
                )}
            </Card.Body>
        </Card>
    );
};

export default KanbanColumn;
