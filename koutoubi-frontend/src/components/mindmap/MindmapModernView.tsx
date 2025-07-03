'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Sparkles, Layers3, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';

interface MindmapModernViewProps {
  data: {
    root: any;
    markdown: string;
    theme: any;
  };
  onNodeClick?: (node: any) => void;
  onRegenerateClick?: () => void;
}

export default function MindmapModernView({ 
  data, 
  onNodeClick,
  onRegenerateClick 
}: MindmapModernViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data.root) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = 1400;
    const height = 900;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create SVG with gradient background
    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");
    
    // Add gradient definitions
    const defs = svg.append("defs");
    
    // Background gradient
    const bgGradient = defs.append("radialGradient")
      .attr("id", "bg-gradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    
    bgGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#f0f9ff");
    
    bgGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#e0f2fe");
    
    // Apply background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#bg-gradient)");
    
    // Create patterns for nodes
    const patterns = [
      { id: "pattern1", color1: "#3b82f6", color2: "#60a5fa" },
      { id: "pattern2", color1: "#10b981", color2: "#34d399" },
      { id: "pattern3", color1: "#f59e0b", color2: "#fbbf24" },
      { id: "pattern4", color1: "#8b5cf6", color2: "#a78bfa" },
      { id: "pattern5", color1: "#ef4444", color2: "#f87171" },
      { id: "pattern6", color1: "#06b6d4", color2: "#22d3ee" }
    ];
    
    patterns.forEach(pattern => {
      const grad = defs.append("linearGradient")
        .attr("id", pattern.id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      grad.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", pattern.color1);
      
      grad.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", pattern.color2);
    });
    
    // Add filters for modern effects
    const filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", "3");
    
    filter.append("feOffset")
      .attr("dx", "0")
      .attr("dy", "4")
      .attr("result", "offsetblur");
    
    filter.append("feFlood")
      .attr("flood-color", "#000000")
      .attr("flood-opacity", "0.15");
    
    filter.append("feComposite")
      .attr("in2", "offsetblur")
      .attr("operator", "in");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    
    // Main container with zoom
    const g = svg.append("g");
    
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoomBehavior as any);
    
    // Create hierarchy with custom layout
    const root = d3.hierarchy(data.root);
    
    // Custom radial layout with organic feel
    const angleScale = d3.scaleLinear()
      .domain([0, root.children?.length || 1])
      .range([0, 2 * Math.PI]);
    
    // Position nodes
    root.each((d: any) => {
      if (d.depth === 0) {
        // Center node
        d.x = centerX;
        d.y = centerY;
      } else if (d.depth === 1) {
        // Main branches - circular layout with variation
        const index = d.parent.children.indexOf(d);
        const angle = angleScale(index) - Math.PI / 2;
        const radius = 220 + Math.random() * 30;
        d.x = centerX + radius * Math.cos(angle);
        d.y = centerY + radius * Math.sin(angle);
      } else {
        // Sub branches - organic placement
        const parentAngle = Math.atan2(d.parent.y - centerY, d.parent.x - centerX);
        const spread = Math.PI / 4;
        const childIndex = d.parent.children.indexOf(d);
        const childCount = d.parent.children.length;
        const angleOffset = (childIndex - (childCount - 1) / 2) * (spread / childCount);
        const angle = parentAngle + angleOffset;
        const radius = 120 + Math.random() * 20;
        d.x = d.parent.x + radius * Math.cos(angle);
        d.y = d.parent.y + radius * Math.sin(angle);
      }
    });
    
    // Draw organic connections
    const link = g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Create organic curve
        const midX = (d.source.x + d.target.x) / 2 + (Math.random() - 0.5) * 30;
        const midY = (d.source.y + d.target.y) / 2 + (Math.random() - 0.5) * 30;
        
        return `M${d.source.x},${d.source.y}Q${midX},${midY} ${d.target.x},${d.target.y}`;
      })
      .style("fill", "none")
      .style("stroke", (d: any) => {
        const colors = ["#cbd5e1", "#e2e8f0", "#f1f5f9"];
        return colors[d.target.depth % colors.length];
      })
      .style("stroke-width", (d: any) => Math.max(1, 5 - d.target.depth))
      .style("stroke-opacity", 0.3)
      .style("stroke-linecap", "round");
    
    // Create node groups
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
        setSelectedNode(d);
        onNodeClick?.(d.data);
      })
      .on("mouseenter", (event, d: any) => {
        setHoveredNode(d);
      })
      .on("mouseleave", () => {
        setHoveredNode(null);
      });
    
    // Add bubble backgrounds
    node.append("rect")
      .attr("class", "node-bg")
      .attr("x", (d: any) => {
        if (d.depth === 0) return -80;
        if (d.depth === 1) return -60;
        return -50;
      })
      .attr("y", (d: any) => {
        if (d.depth === 0) return -35;
        if (d.depth === 1) return -25;
        return -20;
      })
      .attr("width", (d: any) => {
        if (d.depth === 0) return 160;
        if (d.depth === 1) return 120;
        return 100;
      })
      .attr("height", (d: any) => {
        if (d.depth === 0) return 70;
        if (d.depth === 1) return 50;
        return 40;
      })
      .attr("rx", (d: any) => {
        if (d.depth === 0) return 35;
        if (d.depth === 1) return 25;
        return 20;
      })
      .style("fill", (d: any) => {
        if (d.depth === 0) return "url(#pattern1)";
        return `url(#pattern${(d.depth % 6) + 1})`;
      })
      .style("filter", "url(#drop-shadow)")
      .style("transition", "all 0.3s ease")
      .style("stroke", "white")
      .style("stroke-width", 3);
    
    // Add text
    node.append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", "middle")
      .style("font-size", (d: any) => {
        if (d.depth === 0) return "20px";
        if (d.depth === 1) return "16px";
        return "14px";
      })
      .style("font-weight", (d: any) => d.depth <= 1 ? "700" : "500")
      .style("fill", "white")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.2)")
      .text((d: any) => {
        const text = d.data.text || d.data.name;
        return text.length > 20 ? text.substring(0, 20) + "..." : text;
      });
    
    // Add hover animations
    node.on("mouseover", function(event, d) {
      d3.select(this).select("rect")
        .transition()
        .duration(200)
        .attr("x", (d: any) => {
          if (d.depth === 0) return -85;
          if (d.depth === 1) return -65;
          return -55;
        })
        .attr("y", (d: any) => {
          if (d.depth === 0) return -38;
          if (d.depth === 1) return -28;
          return -23;
        })
        .attr("width", (d: any) => {
          if (d.depth === 0) return 170;
          if (d.depth === 1) return 130;
          return 110;
        })
        .attr("height", (d: any) => {
          if (d.depth === 0) return 76;
          if (d.depth === 1) return 56;
          return 46;
        });
    }).on("mouseout", function(event, d) {
      d3.select(this).select("rect")
        .transition()
        .duration(200)
        .attr("x", (d: any) => {
          if (d.depth === 0) return -80;
          if (d.depth === 1) return -60;
          return -50;
        })
        .attr("y", (d: any) => {
          if (d.depth === 0) return -35;
          if (d.depth === 1) return -25;
          return -20;
        })
        .attr("width", (d: any) => {
          if (d.depth === 0) return 160;
          if (d.depth === 1) return 120;
          return 100;
        })
        .attr("height", (d: any) => {
          if (d.depth === 0) return 70;
          if (d.depth === 1) return 50;
          return 40;
        });
    });
    
    // Add floating particles for modern effect
    const particles = g.append("g").attr("class", "particles");
    
    for (let i = 0; i < 20; i++) {
      particles.append("circle")
        .attr("cx", Math.random() * width)
        .attr("cy", Math.random() * height)
        .attr("r", Math.random() * 3 + 1)
        .style("fill", "#3b82f6")
        .style("opacity", 0.2)
        .transition()
        .duration(Math.random() * 20000 + 10000)
        .ease(d3.easeLinear)
        .attr("cx", Math.random() * width)
        .attr("cy", Math.random() * height)
        .on("end", function repeat() {
          d3.select(this)
            .attr("cx", Math.random() * width)
            .attr("cy", Math.random() * height)
            .transition()
            .duration(Math.random() * 20000 + 10000)
            .ease(d3.easeLinear)
            .attr("cx", Math.random() * width)
            .attr("cy", Math.random() * height)
            .on("end", repeat);
        });
    }
    
    // Initial zoom to fit
    setTimeout(() => {
      svg.transition()
        .duration(750)
        .call(
          zoomBehavior.transform as any,
          d3.zoomIdentity.translate(0, 0).scale(0.9)
        );
    }, 100);
    
  }, [data, onNodeClick]);
  
  const handleExport = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap-modern.svg';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Mindmap exported');
  };
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mindmap
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedNode && (
            <div className="mr-4 px-3 py-1 bg-blue-100 rounded-full">
              <span className="text-sm font-medium text-blue-700">
                {selectedNode.data.text}
              </span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-gray-200 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {onRegenerateClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateClick}
              className="border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Mindmap Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: 'grab' }}
        />
        
        {/* Hover tooltip */}
        {hoveredNode && (
          <div 
            className="absolute z-10 p-2 bg-white rounded-lg shadow-lg border border-gray-200 text-sm"
            style={{
              left: hoveredNode.x + 'px',
              top: (hoveredNode.y - 50) + 'px',
              transform: 'translateX(-50%)'
            }}
          >
            {hoveredNode.data.text}
            {hoveredNode.data.page && (
              <span className="text-xs text-gray-500 ml-2">
                Page {hoveredNode.data.page}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Modern Legend */}
      <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
            <span className="text-gray-600">Centre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
            <span className="text-gray-600">Concepts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-orange-500 to-orange-600" />
            <span className="text-gray-600">Détails</span>
          </div>
        </div>
      </div>
    </div>
  );
}