import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const PLATFORM_COLORS = {
  origin: '#00ff41',
  youtube: '#ff0000',
  twitter: '#1da1f2',
  tiktok: '#ff0050',
  web: '#607d8b',
}

export default function ContentSpreadMap({ data, width = '100%', height = 400 }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!data || !svgRef.current) return

    const container = containerRef.current
    const w = container.offsetWidth
    const h = height

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg.attr('width', w).attr('height', h)

    // Zoom
    const g = svg.append('g')
    svg.call(
      d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#607d8b')

    // Simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id((d) => d.id).distance(80).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius((d) => d.size + 10))

    // Edges
    const link = g.append('g').selectAll('line')
      .data(data.edges)
      .enter().append('line')
      .attr('stroke', (d) => d.confidence >= 0.85 ? 'rgba(255,23,68,0.6)' : 'rgba(255,171,0,0.4)')
      .attr('stroke-width', (d) => Math.max(1, d.confidence * 3))
      .attr('marker-end', 'url(#arrowhead)')

    // Animated dashes on edges
    link.attr('stroke-dasharray', '6 3')
      .attr('stroke-dashoffset', 0)

    // Animate dashes flowing outward
    function animateDashes() {
      link.transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', -18)
        .on('end', () => {
          link.attr('stroke-dashoffset', 0)
          animateDashes()
        })
    }
    animateDashes()

    // Nodes
    const node = g.append('g').selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .call(
        d3.drag()
          .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // Node circles
    node.append('circle')
      .attr('r', (d) => d.size || 10)
      .attr('fill', (d) => PLATFORM_COLORS[d.platform] || '#607d8b')
      .attr('opacity', 0.85)
      .style('filter', (d) => d.platform === 'origin' ? 'drop-shadow(0 0 8px #00ff41)' : 'none')

    // Node labels
    node.append('text')
      .attr('dy', (d) => -(d.size || 10) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#607d8b')
      .attr('font-family', '"Share Tech Mono", monospace')
      .attr('font-size', 9)
      .text((d) => d.label || d.platform)

    // Tooltip
    node.append('title')
      .text((d) => `${d.label || d.platform}\nViolations: ${d.count || 1}\nFirst detected: ${d.date || 'unknown'}`)

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => simulation.stop()
  }, [data, height])

  const DEMO_DATA = {
    nodes: [
      { id: 'origin', platform: 'origin', label: 'ORIGINAL', size: 20, count: 1 },
      { id: 'yt1', platform: 'youtube', label: 'YouTube #1', size: 12, count: 3 },
      { id: 'yt2', platform: 'youtube', label: 'YouTube #2', size: 10, count: 1 },
      { id: 'tt1', platform: 'tiktok', label: 'TikTok #1', size: 14, count: 5 },
      { id: 'tw1', platform: 'twitter', label: 'Twitter #1', size: 11, count: 2 },
      { id: 'tw2', platform: 'twitter', label: 'Twitter #2', size: 9, count: 1 },
      { id: 'web1', platform: 'web', label: 'Web #1', size: 8, count: 1 },
    ],
    edges: [
      { source: 'origin', target: 'yt1', confidence: 0.94 },
      { source: 'origin', target: 'tt1', confidence: 0.91 },
      { source: 'yt1', target: 'yt2', confidence: 0.78 },
      { source: 'yt1', target: 'tw1', confidence: 0.83 },
      { source: 'tt1', target: 'tw2', confidence: 0.72 },
      { source: 'tw1', target: 'web1', confidence: 0.65 },
    ],
  }

  const graphData = data || DEMO_DATA

  return (
    <div ref={containerRef} style={{ width, position: 'relative', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)' }}>
      <svg ref={svgRef} style={{ display: 'block' }} />
    </div>
  )
}
