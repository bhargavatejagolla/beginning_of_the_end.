'use client';
import { useEffect, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

export default function Network() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/graph`)
      .then(res => res.json())
      .then(data => {
        // Arrange nodes in a circle for better initial visualization if random is too messy
        const centerX = 400;
        const centerY = 300;
        const radius = 250;
        const numNodes = data.nodes.length;

        const flowNodes = data.nodes.map((n: any, i: number) => {
          const angle = (i / numNodes) * 2 * Math.PI;
          const isRisky = n.risk > 0.7;
          return {
            id: n.id.toString(),
            data: { label: `${n.bank} - ${n.id}` },
            position: { 
              x: centerX + radius * Math.cos(angle), 
              y: centerY + radius * Math.sin(angle) 
            },
            style: { 
              background: isRisky ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
              color: isRisky ? '#fca5a5' : '#e2e8f0',
              border: isRisky ? '1px solid rgba(220, 38, 38, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '10px',
              boxShadow: isRisky ? '0 0 15px rgba(220, 38, 38, 0.3)' : 'none',
              width: 150,
              fontSize: '12px',
              fontWeight: '500'
            }
          };
        });
        
        const flowEdges = data.edges.map((e: any, idx: number) => {
          const isLoop = e.is_loop === true;
          return {
            id: `e-${idx}`,
            source: e.source.toString(),
            target: e.target.toString(),
            label: `₹${e.amount.toLocaleString()}`,
            animated: true,
            style: { 
              stroke: isLoop ? '#db2777' : 'rgba(59, 130, 246, 0.5)', 
              strokeWidth: isLoop ? 3.5 : 2,
              filter: isLoop ? 'drop-shadow(0 0 8px rgba(219, 39, 119, 0.8))' : 'none'
            },
            labelStyle: { fill: isLoop ? '#f472b6' : '#94a3b8', fontSize: 10, fontWeight: 700 },
            labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
            labelBgPadding: [4, 4],
            labelBgBorderRadius: 4,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isLoop ? '#db2777' : 'rgba(59, 130, 246, 0.5)',
            },
          };
        });
        
        setNodes(flowNodes);
        setEdges(flowEdges);
      });
  }, []);

  return (
    <div className="flex flex-col h-screen p-6 animate-in fade-in duration-500">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Global Entity Graph</h1>
          <p className="text-gray-400 text-sm mt-1">Mapping financial relationships and cyclic money laundering rings across the network.</p>
        </div>
        <div className="px-3.5 py-1.5 glass-panel border-pink-500/30 rounded-xl text-xs text-pink-400 font-mono flex items-center space-x-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
          <span>HEURISTIC LAYER DETECTION ACTIVE</span>
        </div>
      </div>
      <div className="flex-1 glass-panel rounded-xl overflow-hidden border border-white/10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none z-0" />
        <ReactFlow nodes={nodes} edges={edges} fitView className="bg-transparent" minZoom={0.2}>
          <Background color="rgba(255,255,255,0.05)" gap={20} size={1} />
          <Controls className="bg-gray-900 border-gray-700 fill-white" />
        </ReactFlow>
        <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm border border-white/10 p-3 rounded-lg text-xs space-y-2 pointer-events-none">
          <div className="font-bold text-gray-300 border-b border-white/10 pb-1 mb-2">Legend</div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-white/5 border border-white/20"></div>
            <span className="text-gray-400">Standard Account</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50 shadow-[0_0_5px_rgba(220,38,38,0.5)]"></div>
            <span className="text-red-400">High Risk Account</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-3 h-[2px] bg-blue-500/50"></div>
            <span className="text-gray-400">Transaction Flow</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-3 h-[3px] bg-pink-500 shadow-[0_0_5px_rgba(219,39,119,0.8)]"></div>
            <span className="text-pink-400 font-bold">Circular Layering Loop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
