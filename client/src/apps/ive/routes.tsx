import React from 'react';
import { Route, useParams, useSearchParams } from 'react-router-dom';
import IVeLayout from './index';
import Workspace from './pages/Workspace';
import Search from './pages/Search';
import CohortView from './pages/Cohort';
import WaveformView from './pages/Waveform';
import ImagingView from './pages/Imaging';
import AgentView from './pages/Agent';
import EndpointsView from './pages/Endpoints';
import CohortDetail from './components/CohortDetail';
import ClinicalTablesOverview from './components/ClinicalTablesOverview';
import ClinicalTablesDetail from './components/ClinicalTablesDetail';
import PersonDataView from './components/PersonDataView';
import VisitDataView from './components/VisitDataView';
import ProtectedRoute from '../../common/ProtectedRoute';

// Dispatches to the correct detail view based on :tableKey URL param
const TableDetailRoute: React.FC = () => {
  const { tableKey } = useParams<{ tableKey: string }>();
  const [searchParams] = useSearchParams();
  const key = decodeURIComponent(tableKey ?? '');
  if (key === 'waveform') return <WaveformView />;
  if (key === 'dicom') return <ImagingView />;

  const externalFilters: Record<string, unknown> = {};
  const personId = searchParams.get('person_id');
  if (personId) externalFilters.person_id = personId;
  const visitId = searchParams.get('visit_occurrence_id');
  if (visitId) externalFilters.visit_occurrence_id = visitId;

  return (
    <ClinicalTablesDetail
      tableKey={key}
      externalFilters={Object.keys(externalFilters).length ? externalFilters : undefined}
    />
  );
};

const iveRoutes = [
  <Route
    key="ive-root"
    path="/ive"
    element={
      <ProtectedRoute>
        <IVeLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<Search />} />
    <Route path="cohort" element={<CohortView />} />
    <Route path="cohort/:cohortDefinitionId" element={<CohortDetail />} />
    <Route path="workspace" element={<Workspace />} />
    <Route path="endpoints" element={<EndpointsView />} />
    <Route path="agent" element={<AgentView />} />
    <Route path="tables" element={<ClinicalTablesOverview />} />
    <Route path="table/:tableKey" element={<TableDetailRoute />} />
    <Route path="person/:personId" element={<PersonDataView />} />
    <Route path="visit/:visitId" element={<VisitDataView />} />
  </Route>,
];

export default iveRoutes;
