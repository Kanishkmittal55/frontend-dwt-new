import { lazy } from 'react';
import { Outlet } from 'react-router-dom';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import { WorkspaceProvider } from 'contexts/WorkspaceContext';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));

// knowledge graph routing
const WorkspaceList = Loadable(lazy(() => import('views/knowledge-graph/WorkspaceList')));
const WorkspaceDetail = Loadable(lazy(() => import('views/knowledge-graph/WorkspaceDetail')));
const SchemaList = Loadable(lazy(() => import('views/knowledge-graph/SchemaList')));
const SchemaVisualization = Loadable(lazy(() => import('views/knowledge-graph/SchemaVisualization')));
const GraphList = Loadable(lazy(() => import('views/knowledge-graph/GraphList')));
const GraphVisualization = Loadable(lazy(() => import('views/knowledge-graph/GraphVisualization')));
const NodeList = Loadable(lazy(() => import('views/knowledge-graph/NodeList')));
const ChunkList = Loadable(lazy(() => import('views/knowledge-graph/ChunkList')));
const TripleList = Loadable(lazy(() => import('views/knowledge-graph/TripleList')));
const DocumentList = Loadable(lazy(() => import('views/knowledge-graph/DocumentList')));
const QueryHistory = Loadable(lazy(() => import('views/knowledge-graph/QueryHistory')));
const RulesList = Loadable(lazy(() => import('views/knowledge-graph/RulesList')));

// settings
const Settings = Loadable(lazy(() => import('views/settings/Settings')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'settings',
      element: <Settings />
    },
    {
      path: 'knowledge-graph',
      children: [
        {
          path: 'workspaces',
          element: <WorkspaceList />
        },
        {
          path: 'workspaces/:workspaceId',
          element: (
            <WorkspaceProvider>
              <Outlet />
            </WorkspaceProvider>
          ),
          children: [
            {
              index: true,
              element: <WorkspaceDetail />
            },
            {
              path: 'documents',
              element: <DocumentList />
            },
            {
              path: 'chunks',
              element: <ChunkList />
            },
            {
              path: 'schemas',
              element: <SchemaList />
            },
            {
              path: 'schemas/:schemaId',
              element: <SchemaVisualization />
            },
            {
              path: 'graphs',
              element: <GraphList />
            },
            {
              path: 'graphs/:graphId',
              element: <GraphVisualization />
            },
            {
              path: 'nodes',
              element: <NodeList />
            },
            {
              path: 'triples',
              element: <TripleList />
            },
            {
              path: 'queries',
              element: <QueryHistory />
            },
            {
              path: 'rules',
              element: <RulesList />
            }
          ]
        }
      ]
    },
    {
      path: 'typography',
      element: <UtilsTypography />
    },
    {
      path: 'color',
      element: <UtilsColor />
    },
    {
      path: 'shadow',
      element: <UtilsShadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;