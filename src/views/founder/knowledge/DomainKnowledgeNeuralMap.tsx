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

import type {
  DomainKnowledgeGraphResponse,
  DomainKnowledgeFounderGraphResponse
} from 'api/founder/knowledgeAPI';
import type { GraphColorMode } from './DomainKnowledgeAssessmentChatView';

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

/** Coverage: 0–100 → red → amber → green */
const coverageColorScale = d3.scaleSequential([0, 100], d3.interpolateRgbBasis(['#ef5350', '#ffa726', '#66bb6a']));

function coverageColor(score: number): string {
  return coverageColorScale(Math.max(0, Math.min(100, score)));
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
  slug?: string;
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
type GraphResponse = DomainKnowledgeGraphResponse | DomainKnowledgeFounderGraphResponse;

interface Props {
  graph: GraphResponse;
  height?: number;
  /** When set, highlights this concept and greys out others (for Q&A flow) */
  focusConceptSlug?: string | null;
  /** 'difficulty' = color by difficulty; 'coverage' = color by tested/last_score */
  colorMode?: GraphColorMode;
}

export default function DomainKnowledgeNeuralMap({
  graph,
  height = 480,
  focusConceptSlug,
  colorMode = 'difficulty'
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const buildGraph = useCallback(() => {
    if (!graph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth ?? 800;

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const nodes: GraphNode[] = graph.concepts.map(
      (c: {
        uuid: string;
        slug?: string;
        name: string;
        difficulty: string;
        description?: string;
        sub_domain?: string;
        tested?: boolean;
        last_score?: number;
      }) => ({
        id: c.uuid,
        slug: c.slug,
        label: c.name,
        difficulty: c.difficulty,
        description: c.description,
        subDomain: c.sub_domain,
        tested: c.tested,
        lastScore: c.last_score
      })
    );

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const focusUuid = focusConceptSlug ? nodes.find((n) => n.slug === focusConceptSlug)?.id : null;

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

    // Initial layout: spread nodes in a circle to avoid overlap before forces run
    const n = nodes.length;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;
    nodes.forEach((node, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      node.x = cx + radius * Math.cos(angle);
      node.y = cy + radius * Math.sin(angle);
    });

    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(140).strength((d) => d.strength * 0.6))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(42))
      .alphaDecay(0.015)
      .alphaTarget(0.001);

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

    // When no focus: all nodes greyed. When focus set: only that node colored, rest greyed.
    const isFocused = (id: string) => !!focusUuid && id === focusUuid;
    const isEdgeFocused = (d: GraphLink) => !!focusUuid && (isFocused((d.source as GraphNode).id) && isFocused((d.target as GraphNode).id));

    const nodeColor = (d: GraphNode): string => {
      const baseColor = colorMode === 'coverage'
        ? !d.tested
          ? '#9e9e9e'
          : d.lastScore != null
            ? coverageColor(d.lastScore)
            : '#9e9e9e'
        : difficultyColor(d.difficulty);
      if (focusUuid) return isFocused(d.id) ? baseColor : '#bdbdbd';
      return baseColor;
    };
    const nodeEmphasis = (id: string) => !focusUuid || isFocused(id);

    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => (isEdgeFocused(d) ? '#bbb' : '#ddd'))
      .attr('stroke-opacity', (d) => (isEdgeFocused(d) ? 1 : 0.35))
      .attr('stroke-width', (d) => Math.max(1, d.strength * 3))
      .attr('stroke-dasharray', (d) => edgeDash(d.relationship))
      .attr('marker-end', (d) => (d.relationship === 'prerequisite' ? 'url(#domain-arrowhead)' : ''));

    const node = g
      .append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 18)
      .attr('fill', (d) => nodeColor(d))
      .attr('fill-opacity', (d) => (nodeEmphasis(d.id) ? 0.85 : 0.4))
      .attr('stroke', (d) => nodeColor(d))
      .attr('stroke-width', (d) => (nodeEmphasis(d.id) ? 2 : 1))
      .attr('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke-width', 4);
        setHoveredNode(d);
      })
      .on('mouseout', function (event, d) {
        d3.select(this).attr('stroke-width', nodeEmphasis(d.id) ? 2 : 1);
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
      .attr('fill', (d) => (nodeEmphasis(d.id) ? '#444' : '#999'))
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
  }, [graph, height, focusConceptSlug, colorMode]);

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
          {colorMode === 'coverage' ? (
            <>
              <Chip label="Not tested" size="small" sx={{ bgcolor: '#9e9e9e', color: '#fff', fontWeight: 600, fontSize: 11 }} />
              <Chip label="Low" size="small" sx={{ bgcolor: '#ef5350', color: '#fff', fontWeight: 600, fontSize: 11 }} />
              <Chip label="Medium" size="small" sx={{ bgcolor: '#ffa726', color: '#fff', fontWeight: 600, fontSize: 11 }} />
              <Chip label="High" size="small" sx={{ bgcolor: '#66bb6a', color: '#fff', fontWeight: 600, fontSize: 11 }} />
            </>
          ) : (
            Object.entries(DIFFICULTY_COLORS).map(([level, color]) => (
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
            ))
          )}
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
              {colorMode === 'coverage'
                ? hoveredNode.tested
                  ? `Score: ${hoveredNode.lastScore ?? '—'}%`
                  : 'Not tested'
                : hoveredNode.difficulty}
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
