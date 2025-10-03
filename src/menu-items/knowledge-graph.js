// assets
import { IconDatabase, IconSchema, IconNetwork, IconFileText, IconCube, IconLink, IconFiles, IconArrowsJoin, IconSearch, IconArrowMerge } from '@tabler/icons-react';

// constant
const icons = { 
  IconDatabase,
  IconSchema, 
  IconNetwork,
  IconFileText,
  IconCube,
  IconLink,
  IconFiles,
  IconArrowsJoin,
  IconSearch,
  IconArrowMerge
};

// ==============================|| KNOWLEDGE GRAPH MENU ITEMS ||============================== //

const knowledgeGraph = {
  id: 'knowledge-graph',
  title: '', // Empty title to avoid showing group name
  type: 'group',
  children: [
    {
      id: 'workspaces',
      title: 'Workspaces',
      type: 'item',
      url: '/knowledge-graph/workspaces',
      icon: icons.IconDatabase,
      breadcrumbs: false
    },
    {
      id: 'schemas',
      title: 'Schemas',
      type: 'item',
      url: '/knowledge-graph/schemas',
      icon: icons.IconSchema,
      breadcrumbs: false
    },
    {
      id: 'graphs',
      title: 'Graphs',
      type: 'item',
      url: '/knowledge-graph/graphs',
      icon: icons.IconNetwork,
      breadcrumbs: false
    },
    {
      id: 'nodes',
      title: 'Nodes',
      type: 'item',
      url: '/knowledge-graph/nodes',
      icon: icons.IconCube,
      breadcrumbs: false
    },
    {
      id: 'triples',
      title: 'Triples',
      type: 'item',
      url: '/knowledge-graph/triples',
      icon: icons.IconArrowsJoin,
      breadcrumbs: false
    },
    {
      id: 'chunks',
      title: 'Chunks',
      type: 'item',
      url: '/knowledge-graph/chunks',
      icon: icons.IconFiles,
      breadcrumbs: false
    },
    {
      id: 'documents',
      title: 'Documents',
      type: 'item',
      url: '/knowledge-graph/documents',
      icon: icons.IconFileText,
      breadcrumbs: false
    },
    {
      id: 'queries',
      title: 'Query History',
      type: 'item',
      url: '/knowledge-graph/queries',
      icon: icons.IconSearch,
      breadcrumbs: false
    },
    {
      id: 'rules',
      title: 'Merge Rules',
      type: 'item',
      url: '/knowledge-graph/rules',
      icon: icons.IconArrowMerge,
      breadcrumbs: false
    }
  ]
};

export default knowledgeGraph;