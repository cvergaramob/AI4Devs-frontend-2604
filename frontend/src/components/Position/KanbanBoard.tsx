import React, { useMemo, useCallback } from 'react';
import { Alert } from 'react-bootstrap';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { InterviewStep, CandidateItem } from '../../types/position';
import KanbanColumn from './KanbanColumn';

type Props = {
    interviewSteps: InterviewStep[];
    candidates: CandidateItem[];
    onCandidateMoved: (candidateId: number, applicationId: number, targetStepId: number) => void;
};

const KanbanBoard: React.FC<Props> = ({ interviewSteps, candidates, onCandidateMoved }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor)
    );

    const sortedSteps = useMemo(
        () => [...interviewSteps].sort((a, b) => a.orderIndex - b.orderIndex),
        [interviewSteps]
    );

    const stepNames = useMemo(
        () => new Set(sortedSteps.map((s) => s.name)),
        [sortedSteps]
    );

    const orphaned = useMemo(
        () => candidates.filter((c) => !stepNames.has(c.currentInterviewStep)),
        [candidates, stepNames]
    );

    const handleDragEnd = useCallback((event: DragEndEvent): void => {
        const { active, over } = event;
        if (!over) {
            return;
        }

        const applicationId = active.id as number;
        const targetStepId = over.id as number;

        const candidate = candidates.find((c) => c.applicationId === applicationId);
        if (!candidate) {
            return;
        }

        const targetStep = interviewSteps.find((s) => s.id === targetStepId);
        if (!targetStep) {
            return;
        }

        const currentStep = interviewSteps.find((s) => s.name === candidate.currentInterviewStep);
        if (currentStep && currentStep.id === targetStepId) {
            return;
        }

        onCandidateMoved(candidate.id, applicationId, targetStepId);
    }, [interviewSteps, candidates, onCandidateMoved]);

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div style={{ overflowX: 'auto' }}>
                <div className="row g-3 align-items-start">
                    {sortedSteps.map((step) => {
                        const columnCandidates = candidates.filter(
                            (c) => c.currentInterviewStep === step.name
                        );
                        return (
                            <div
                                key={step.id}
                                className="col-12 col-sm"
                                style={{ minWidth: '220px' }}
                            >
                                <KanbanColumn step={step} candidates={columnCandidates} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {orphaned.length > 0 && (
                <div className="mt-3">
                    <Alert variant="warning" className="mb-0">
                        <Alert.Heading className="h6">
                            Candidatos con etapa no reconocida
                        </Alert.Heading>
                        <ul className="mb-0 small">
                            {orphaned.map((c) => (
                                <li key={c.applicationId}>
                                    {c.fullName} — etapa: &ldquo;{c.currentInterviewStep}&rdquo;
                                </li>
                            ))}
                        </ul>
                    </Alert>
                </div>
            )}
        </DndContext>
    );
};

export default KanbanBoard;
