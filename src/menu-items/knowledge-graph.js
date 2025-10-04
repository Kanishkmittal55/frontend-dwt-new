// assets
import { IconDatabase } from '@tabler/icons-react';

// constant
const icons = { 
  IconDatabase
};

// ==============================|| KNOWLEDGE GRAPH MENU ITEMS ||============================== //

const knowledgeGraph = {
  id: 'knowledge-graph',
  title: '', 
  type: 'group',
  children: [
    {
      id: 'workspaces',
      title: 'Workspaces',
      type: 'item',
      url: '/knowledge-graph/workspaces',
      icon: icons.IconDatabase,
      breadcrumbs: false
    }
  ]
};

export default knowledgeGraph;