// @ts-nocheck — d3 has no bundled type declarations in this project
/**
 * NeuralMap — Force-directed concept graph using d3-force
 *
 * Nodes = concepts (size → time_spent proxy via total_reviews,
 *                   color → mastery 🔴→🟡→🟢→💎,
 *                   pulse → overdue / due)
 * Edges = concept_links (solid: prerequisite, dashed: related, dotted: contrasts)
 * Clustered by module (implicit via layout).
 * Hover → tooltip, click → navigate to concept deep-dive.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';

// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

import type { MemoryMatrixResponse } from 'api/founder/knowledgeAPI';

// ============================================================================
// Color helpers
// ============================================================================
const MASTERY_COLORS: Record<string, string> = {
  new: '#ef5350',       // red
  learning: '#ffa726',  // amber
  mastered: '#66bb6a',  // green
  graduated: '#42a5f5'  // diamond blue
};

function masteryColor(state: string): string {
  return MASTERY_COLORS[state] ?? '#9e9e9e';
}

function retentionOpacity(retention: number): number {
  return 0.4 + retention * 0.6; // 0.4..1.0
}

// Edge style by relationship type
function edgeDash(rel: string): string {
  if (rel === 'prerequisite' || rel === 'builds_on') return '';    // solid
  if (rel === 'related') return '6,3';                              // dashed
  return '2,4';                                                     // dotted (contrasts)
}

// ============================================================================
// Types for d3
// ============================================================================
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  mastery: string;
  retention: number;
  totalReviews: number;
  isOverdue: boolean;
  conceptText?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationship: string;
  strength: number;
}

// ============================================================================
// Component
// ============================================================================
interface Props {
  courseUUID: string;
  matrix: MemoryMatrixResponse | null;
}

export default function NeuralMap({ courseUUID, matrix }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const buildGraph = useCallback(() => {
    if (!matrix || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth ?? 800;
    const height = 500;

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    // Build nodes
    const nodes: GraphNode[] = matrix.concepts.map((c: any) => ({
      id: c.uuid,
      label: c.item_title,
      mastery: c.mastery_state,
      retention: c.retention,
      totalReviews: c.total_reviews ?? 0,
      isOverdue: c.next_review_at ? new Date(c.next_review_at) < new Date() : false,
      conceptText: c.concept_text
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Build links (only those where both ends exist)
    const links: GraphLink[] = matrix.relationships
      .filter((r: any) => nodeMap.has(r.from_item_uuid) && nodeMap.has(r.to_item_uuid))
      .map((r: any) => ({
        source: r.from_item_uuid,
        target: r.to_item_uuid,
        relationship: r.relationship,
        strength: r.strength
      }));

    // Simulation
    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(100).strength((d) => d.strength * 0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => nodeRadius(d) + 4));

    // Zoom
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => g.attr('transform', event.transform)) as any
    );

    // Arrow markers
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#bbb')
      .attr('stroke-width', (d) => Math.max(1, d.strength * 3))
      .attr('stroke-dasharray', (d) => edgeDash(d.relationship))
      .attr('marker-end', (d) => (d.relationship === 'prerequisite' ? 'url(#arrowhead)' : ''));

    // Draw nodes
    const node = g
      .append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => nodeRadius(d))
      .attr('fill', (d) => masteryColor(d.mastery))
      .attr('fill-opacity', (d) => retentionOpacity(d.retention))
      .attr('stroke', (d) => (d.isOverdue ? '#ff1744' : masteryColor(d.mastery)))
      .attr('stroke-width', (d) => (d.isOverdue ? 3 : 1.5))
      .attr('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke-width', 4);
        setHoveredNode(d);
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-width', (d: any) => (d.isOverdue ? 3 : 1.5));
        setHoveredNode(null);
      })
      .on('click', (_, d) => {
        navigate(`/memory/concept/${d.id}`);
      })
      .call(drag(sim) as any);

    // Pulse animation for overdue nodes
    node
      .filter((d) => d.isOverdue)
      .append('animate')
      .attr('attributeName', 'stroke-opacity')
      .attr('values', '1;0.3;1')
      .attr('dur', '1.5s')
      .attr('repeatCount', 'indefinite');

    // Labels
    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => truncate(d.label, 18))
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => nodeRadius(d) + 14)
      .attr('fill', '#555')
      .attr('pointer-events', 'none');

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
      label.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
    });

    return () => sim.stop();
  }, [matrix, navigate]);

  useEffect(() => {
    const cleanup = buildGraph();
    const handleResize = () => buildGraph();
    window.addEventListener('resize', handleResize);
    return () => {
      cleanup?.();
      window.removeEventListener('resize', handleResize);
    };
  }, [buildGraph]);

  // No data yet
  if (!matrix) {
    return <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />;
  }

  if (matrix.concepts.length === 0) {
    return (
      <Alert severity="info">
        No concepts found for this course yet. Complete some lessons to build your neural map.
      </Alert>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0, position: 'relative', '&:last-child': { pb: 0 } }}>
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1, p: 1.5, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
          {Object.entries(MASTERY_COLORS).map(([state, color]) => (
            <Chip
              key={state}
              label={state}
              size="small"
              sx={{
                bgcolor: color,
                color: '#fff',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'capitalize'
              }}
            />
          ))}
          <Chip
            label="overdue = pulsing border"
            size="small"
            variant="outlined"
            sx={{ borderColor: '#ff1744', color: '#ff1744', fontSize: 11 }}
          />
        </Box>

        {/* Hovered tooltip */}
        {hoveredNode && (
          <Box
            sx={{
              position: 'absolute',
              top: 56,
              right: 16,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 1.5,
              maxWidth: 260,
              zIndex: 10,
              boxShadow: 2
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {hoveredNode.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {hoveredNode.mastery} · {Math.round(hoveredNode.retention * 100)}% retention
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {hoveredNode.totalReviews} reviews{hoveredNode.isOverdue ? ' · OVERDUE' : ''}
            </Typography>
            {hoveredNode.conceptText && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {truncate(hoveredNode.conceptText, 120)}
              </Typography>
            )}
          </Box>
        )}

        <svg ref={svgRef} style={{ width: '100%', minHeight: 500 }} />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function nodeRadius(d: GraphNode): number {
  return Math.max(8, Math.min(24, 6 + d.totalReviews * 1.5));
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

function drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
  return d3
    .drag<SVGCircleElement, GraphNode>()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

