import React from 'react';
import { Card } from 'react-bootstrap';
import { useDraggable } from '@dnd-kit/core';
import { CandidateItem } from '../../types/position';

type Props = {
    candidate: CandidateItem;
};

const DOT_STYLE: React.CSSProperties = {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#198754',
    marginRight: 3,
};

const ScoreDots: React.FC<{ score: number | null }> = ({ score }) => {
    const rounded = score != null ? Math.round(score) : 0;

    if (rounded <= 0) {
        return <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>Sin puntuación</span>;
    }

    return (
        <span aria-label={`Score: ${rounded}`}>
            {Array.from({ length: rounded }).map((_, i) => (
                <span key={i} style={DOT_STYLE} data-testid="score-dot" />
            ))}
        </span>
    );
};

const CandidateCard: React.FC<Props> = ({ candidate }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: candidate.applicationId,
    });

    return (
        <Card
            ref={setNodeRef}
            className="mb-2"
            style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
            {...listeners}
            {...attributes}
            role="listitem"
        >
            <Card.Body className="py-2 px-3">
                <div className="fw-semibold">{candidate.fullName || '(Sin nombre)'}</div>
                <div className="mt-1">
                    <ScoreDots score={candidate.averageScore} />
                </div>
            </Card.Body>
        </Card>
    );
};

export default CandidateCard;
