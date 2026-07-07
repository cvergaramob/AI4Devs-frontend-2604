import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { InterviewStep, CandidateItem } from '../../types/position';
import KanbanBoard from './KanbanBoard';
import {
    fetchInterviewFlow,
    fetchCandidatesByPosition,
    updateCandidateStep,
} from '../../services/positionService';

const PositionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [positionName, setPositionName] = useState<string>('');
    const [interviewSteps, setInterviewSteps] = useState<InterviewStep[]>([]);
    const [candidates, setCandidates] = useState<CandidateItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [canRetry, setCanRetry] = useState<boolean>(false);
    const [moveError, setMoveError] = useState<string | null>(null);

    const loadData = useCallback(async (): Promise<void> => {
        if (!id) {
            setLoadError('La URL no contiene un identificador de posición válido.');
            setCanRetry(false);
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        setCanRetry(false);
        try {
            const [flowData, candidatesData] = await Promise.all([
                fetchInterviewFlow(id),
                fetchCandidatesByPosition(id),
            ]);

            const { positionName: name, interviewFlow: flowDetails } = flowData.interviewFlow;
            setPositionName(name);
            setInterviewSteps(flowDetails.interviewSteps);
            setCandidates(candidatesData);
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'POSITION_NOT_FOUND') {
                setLoadError('La posición no existe.');
                setCanRetry(false);
            } else {
                setLoadError('No se pudo cargar la posición. Verificá tu conexión e intentá de nuevo.');
                setCanRetry(true);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCandidateMoved = useCallback(async (
        candidateId: number,
        applicationId: number,
        targetStepId: number
    ): Promise<void> => {
        const targetStep = interviewSteps.find((s) => s.id === targetStepId);
        if (!targetStep) {
            return;
        }

        const originalStep = candidates.find(
            (c) => c.applicationId === applicationId
        )?.currentInterviewStep;

        setCandidates((prev) =>
            prev.map((c) =>
                c.applicationId === applicationId
                    ? { ...c, currentInterviewStep: targetStep.name }
                    : c
            )
        );

        try {
            await updateCandidateStep(candidateId, applicationId, targetStepId);
        } catch {
            setCandidates((prev) =>
                prev.map((c) =>
                    c.applicationId === applicationId && originalStep !== undefined
                        ? { ...c, currentInterviewStep: originalStep }
                        : c
                )
            );
            setMoveError('No se pudo mover el candidato. El cambio fue revertido.');
            setTimeout(() => setMoveError(null), 4000);
        }
    }, [interviewSteps, candidates]);

    return (
        <Container className="py-4">
            <div className="mb-3">
                <Button
                    variant="link"
                    className="p-0 text-secondary d-flex align-items-center gap-1"
                    onClick={() => navigate('/positions')}
                >
                    <ArrowLeft size={18} />
                    Volver al listado
                </Button>
            </div>

            {loading && (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                </div>
            )}

            {!loading && loadError && (
                <Alert variant="danger">
                    <Alert.Heading>Error al cargar</Alert.Heading>
                    <p>{loadError}</p>
                    {canRetry && (
                        <Button variant="outline-danger" size="sm" onClick={loadData}>
                            Reintentar
                        </Button>
                    )}
                </Alert>
            )}

            {!loading && !loadError && (
                <>
                    <h2 className="h4 mb-4">{positionName}</h2>

                    {moveError && (
                        <Alert
                            variant="danger"
                            dismissible
                            onClose={() => setMoveError(null)}
                            className="mb-3"
                        >
                            {moveError}
                        </Alert>
                    )}

                    {interviewSteps.length === 0 ? (
                        <Alert variant="info">
                            Esta posición no tiene fases de entrevista definidas.
                        </Alert>
                    ) : (
                        <KanbanBoard
                            interviewSteps={interviewSteps}
                            candidates={candidates}
                            onCandidateMoved={handleCandidateMoved}
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export default PositionPage;
