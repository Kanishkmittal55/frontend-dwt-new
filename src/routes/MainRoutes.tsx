import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import { AuthProvider } from 'contexts/AuthContext';
import { FounderProvider } from 'contexts/FounderContext';
import ProtectedRoute from './ProtectedRoute';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// founder routing
const FounderDashboard = Loadable(lazy(() => import('views/founder/dashboard/FounderDashboard')));
const OnboardingWizard = Loadable(lazy(() => import('views/founder/onboarding/OnboardingWizard')));
const AgentChat = Loadable(lazy(() => import('views/founder/agent/AgentChat')));

// CoFounder (AI partner)
const CoFounderView = Loadable(lazy(() => import('views/founder/assistant/AssistantView')));

// Mission (was Goals)
const MissionDashboard = Loadable(lazy(() => import('views/founder/goals/GoalsDashboard')));

// Course viewers
const CourseViewerSwitch = Loadable(lazy(() => import('views/founder/reader/CourseViewerSwitch')));
const HTILCourseCreator = Loadable(lazy(() => import('views/founder/reader/htil/HTILCourseCreator')));

// Train (daily tasks / revision system)
const DailyTasksDashboard = Loadable(lazy(() => import('views/founder/today/DailyTasksDashboard')));

// Memory (was Knowledge / Memory Matrix)
const KnowledgeDashboard = Loadable(lazy(() => import('views/founder/knowledge/KnowledgeDashboard')));
const PracticeImpact = Loadable(lazy(() => import('views/founder/knowledge/PracticeImpact')));

// Radar (goal-driven signals — replaces Ideas)
const RadarDashboard = Loadable(lazy(() => import('views/founder/radar/RadarDashboard')));

// Intel (was Library / Insights)
const LibraryDashboard = Loadable(lazy(() => import('views/founder/library/LibraryDashboard')));

// Playbook (GTM strategy)
const PlaybookView = Loadable(lazy(() => import('views/founder/playbook/PlaybookView')));

// Shipped (track record)
const ShippedView = Loadable(lazy(() => import('views/founder/shipped/ShippedView')));

// Legacy Ideas (still accessible at old route)
const IdeasDashboard = Loadable(lazy(() => import('views/founder/ideas/IdeasDashboard')));

// utilities routing
const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));

// settings / preferences
const Settings = Loadable(lazy(() => import('views/settings/Settings')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <AuthProvider>
      <ProtectedRoute>
        <FounderProvider>
          <MainLayout />
        </FounderProvider>
      </ProtectedRoute>
    </AuthProvider>
  ),
  children: [
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    // ── Founder OS routes ──
    {
      path: 'founder',
      children: [
        // Founder Persona
        {
          path: 'dashboard',
          element: <FounderDashboard />
        },
        // CoFounder (AI partner)
        {
          path: 'cofounder',
          element: <CoFounderView />
        },
        // Mission
        {
          path: 'mission',
          element: <MissionDashboard />
        },
        // Learn (courses)
        {
          path: 'courses',
          element: <CourseViewerSwitch />
        },
        {
          path: 'courses/create',
          element: <HTILCourseCreator userId={1} onBack={() => window.history.back()} />
        },
        // Train (daily tasks)
        {
          path: 'today',
          element: <DailyTasksDashboard />
        },
        // Radar (opportunity scanner)
        {
          path: 'radar',
          element: <RadarDashboard />
        },
        // Intel (analytics & data sources)
        {
          path: 'intel',
          element: <LibraryDashboard />
        },
        // Playbook (GTM strategy)
        {
          path: 'playbook',
          element: <PlaybookView />
        },
        // Shipped (track record)
        {
          path: 'shipped',
          element: <ShippedView />
        },
        // ── Legacy routes — backward compat ──
        {
          path: 'assistant',
          element: <CoFounderView />
        },
        {
          path: 'goals',
          element: <MissionDashboard />
        },
        {
          path: 'ideas',
          element: <IdeasDashboard />
        },
        {
          path: 'library',
          element: <LibraryDashboard />
        },
        {
          path: 'agent',
          element: <AgentChat />
        },
        {
          path: 'onboarding',
          element: <OnboardingWizard />
        },
        {
          path: 'profile',
          element: <Settings />
        }
      ]
    },
    // ── Memory (was Knowledge / Memory Matrix) ──
    {
      path: 'memory',
      children: [
        {
          index: true,
          element: <KnowledgeDashboard />
        },
        {
          path: 'strength',
          element: <KnowledgeDashboard />
        },
        {
          path: 'retention',
          element: <KnowledgeDashboard />
        },
        {
          path: 'concept/:uuid',
          element: <PracticeImpact />
        }
      ]
    },
    // Legacy /knowledge routes — backward compat
    {
      path: 'knowledge',
      children: [
        {
          index: true,
          element: <KnowledgeDashboard />
        },
        {
          path: 'strength',
          element: <KnowledgeDashboard />
        },
        {
          path: 'retention',
          element: <KnowledgeDashboard />
        },
        {
          path: 'concept/:uuid',
          element: <PracticeImpact />
        }
      ]
    },
    {
      path: 'settings',
      element: <Settings />
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
