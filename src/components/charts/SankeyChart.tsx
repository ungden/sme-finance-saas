"use client";

import React, { useMemo } from "react";
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from "d3-sankey";

interface SankeyDataNode {
    name: string;
    color: string;
}

interface SankeyDataLink {
    source: number;
    target: number;
    value: number;
    color?: string;
}

interface SankeyChartProps {
    nodes: SankeyDataNode[];
    links: SankeyDataLink[];
    width?: number;
    height?: number;
    formatValue?: (val: number) => string;
}

interface SNode extends SankeyDataNode {
    index?: number;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
}

interface SLink {
    source: SNode;
    target: SNode;
    value: number;
    width?: number;
    y0?: number;
    y1?: number;
    color?: string;
}

export default function SankeyChart({
    nodes,
    links,
    width = 700,
    height = 350,
    formatValue = (v) => v.toLocaleString("vi-VN"),
}: SankeyChartProps) {
    const { sankeyNodes, sankeyLinks } = useMemo(() => {
        if (nodes.length === 0 || links.length === 0 || links.every(l => l.value === 0)) {
            return { sankeyNodes: [], sankeyLinks: [] };
        }

        const validLinks = links.filter(l => l.value > 0);
        if (validLinks.length === 0) {
            return { sankeyNodes: [], sankeyLinks: [] };
        }

        const sankeyGenerator = sankey<SankeyDataNode, SankeyDataLink>()
            .nodeId((d: SankeyNode<SankeyDataNode, SankeyDataLink>) => d.index as unknown as string)
            .nodeWidth(20)
            .nodePadding(16)
            .extent([[1, 1], [width - 1, height - 6]]);

        const graph = sankeyGenerator({
            nodes: nodes.map((d, i) => ({ ...d, index: i })),
            links: validLinks.map(d => ({ ...d })),
        });

        return {
            sankeyNodes: graph.nodes as SNode[],
            sankeyLinks: graph.links as unknown as SLink[],
        };
    }, [nodes, links, width, height]);

    if (sankeyNodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                Nhập doanh thu để xem biểu đồ dòng tiền
            </div>
        );
    }

    const linkPath = sankeyLinkHorizontal();

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Links */}
            {sankeyLinks.map((link, i) => {
                const color = link.color || link.source.color || "#94a3b8";
                return (
                    <g key={`link-${i}`}>
                        <path
                            d={linkPath(link as unknown as SankeyLink<SankeyDataNode, SankeyDataLink>) || ""}
                            fill="none"
                            stroke={color}
                            strokeOpacity={0.35}
                            strokeWidth={Math.max(1, link.width || 1)}
                        />
                    </g>
                );
            })}

            {/* Nodes */}
            {sankeyNodes.map((node, i) => {
                const x0 = node.x0 || 0;
                const y0 = node.y0 || 0;
                const x1 = node.x1 || 0;
                const y1 = node.y1 || 0;
                const nodeHeight = y1 - y0;
                const isLeft = x0 < width / 2;

                return (
                    <g key={`node-${i}`}>
                        <rect
                            x={x0}
                            y={y0}
                            width={x1 - x0}
                            height={Math.max(1, nodeHeight)}
                            fill={node.color}
                            rx={3}
                            opacity={0.9}
                        />
                        <text
                            x={isLeft ? x0 - 6 : x1 + 6}
                            y={y0 + nodeHeight / 2}
                            dy="0.35em"
                            textAnchor={isLeft ? "end" : "start"}
                            fontSize={11}
                            fontWeight={600}
                            fill="#334155"
                        >
                            {node.name}
                        </text>
                        <text
                            x={isLeft ? x0 - 6 : x1 + 6}
                            y={y0 + nodeHeight / 2 + 14}
                            dy="0.35em"
                            textAnchor={isLeft ? "end" : "start"}
                            fontSize={10}
                            fill="#64748b"
                        >
                            {formatValue(
                                (isLeft
                                    ? sankeyLinks.filter(l => l.source.index === node.index).reduce((s, l) => s + l.value, 0)
                                    : sankeyLinks.filter(l => l.target.index === node.index).reduce((s, l) => s + l.value, 0)
                                ) || 0
                            )}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
