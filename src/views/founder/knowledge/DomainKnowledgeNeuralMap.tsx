// @ts-nocheck — d3 has no bundled type declarations in this project
/**
 * DomainKnowledgeNeuralMap — Force-directed graph for domain knowledge taxonomies
 *
 * Nodes = concepts (color by difficulty: beginner=green, intermediate=amber, advanced=red)
 * Edges = prerequisite, builds_on, related
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';

// MUI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';

import type { DomainKnowledgeGraphResponse } from 'api/founder/knowledgeAPI';

// ============================================================================
// Color helpers — difficulty drives node color
// ============================================================================
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#66bb6a',      // green
  intermediate: '#ffa726',   // amber
  advanced: '#ef5350'       // red
};

function difficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty?.toLowerCase()] ?? '#9e9e9e';
}

function edgeDash(rel: string): string {
  if (rel === 'prerequisite' || rel === 'builds_on') return '';
  if (rel === 'related') return '6,3';
  return '2,4';
}

// ============================================================================
// Types for d3
// ============================================================================
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  difficulty: string;
  description?: string;
  subDomain?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationship: string;
  strength: number;
}

// ============================================================================
// Component
// ============================================================================
interface Props {
  graph: DomainKnowledgeGraphResponse;
  height?: number;
}

export default function DomainKnowledgeNeuralMap({ graph, height = 480 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const buildGraph = useCallback(() => {
    if (!graph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth ?? 800;

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const nodes: GraphNode[] = graph.concepts.map((c: { uuid: string; name: string; difficulty: string; description?: string; sub_domain?: string }) => ({
      id: c.uuid,
      label: c.name,
      difficulty: c.difficulty,
      description: c.description,
      subDomain: c.sub_domain
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: GraphLink[] = graph.relationships
      .filter((r: { from_concept_uuid: string; to_concept_uuid: string }) =>
        nodeMap.has(r.from_concept_uuid) && nodeMap.has(r.to_concept_uuid)
      )
      .map((r: { from_concept_uuid: string; to_concept_uuid: string; relationship: string; strength: number }) => ({
        source: r.from_concept_uuid,
        target: r.to_concept_uuid,
        relationship: r.relationship,
        strength: r.strength
      }));

    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120).strength((d) => d.strength * 0.5))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(28));

    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => g.attr('transform', event.transform)) as any
    );

    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'domain-arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#888');

    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#bbb')
      .attr('stroke-width', (d) => Math.max(1, d.strength * 3))
      .attr('stroke-dasharray', (d) => edgeDash(d.relationship))
      .attr('marker-end', (d) => (d.relationship === 'prerequisite' ? 'url(#domain-arrowhead)' : ''));

    const node = g
      .append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 18)
      .attr('fill', (d) => difficultyColor(d.difficulty))
      .attr('fill-opacity', 0.85)
      .attr('stroke', (d) => difficultyColor(d.difficulty))
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke-width', 4);
        setHoveredNode(d);
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-width', 2);
        setHoveredNode(null);
      })
      .call(drag(sim) as any);

    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => truncate(d.label, 16))
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .attr('dy', 24)
      .attr('fill', '#444')
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
  }, [graph, height]);

  useEffect(() => {
    const cleanup = buildGraph();
    const handleResize = () => buildGraph();
    window.addEventListener('resize', handleResize);
    return () => {
      cleanup?.();
      window.removeEventListener('resize', handleResize);
    };
  }, [buildGraph]);

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <CardContent sx={{ p: 0, position: 'relative', '&:last-child': { pb: 0 } }}>
        <Box sx={{ display: 'flex', gap: 1, p: 1.5, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
          {Object.entries(DIFFICULTY_COLORS).map(([level, color]) => (
            <Chip
              key={level}
              label={level}
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
        </Box>

        {hoveredNode && (
          <Box
            sx={{
              position: 'absolute',
              top: 52,
              right: 16,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 1.5,
              maxWidth: 260,
              zIndex: 10,
              boxShadow: 3
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {hoveredNode.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {hoveredNode.difficulty}
              {hoveredNode.subDomain && ` · ${hoveredNode.subDomain}`}
            </Typography>
            {hoveredNode.description && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {truncate(hoveredNode.description, 100)}
              </Typography>
            )}
          </Box>
        )}

        <svg ref={svgRef} style={{ width: '100%', minHeight: height }} />
      </CardContent>
    </Card>
  );
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
