"use client";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function EntityLinkerGraph({
  linkedAccounts,
}: {
  linkedAccounts: any[];
}) {
  const nodes = linkedAccounts.map((acc, idx) => ({
    id: acc.account_id.toString(),
    data: { label: `Acc ${acc.account_id} (${acc.bank})` },
    position: { x: 250 * idx, y: 100 },
    style: {
      background: acc.is_mule ? "#7f1d1d" : "#1f2937",
      color: "white",
      padding: 10,
      borderRadius: 8,
    },
  }));
  const edges = linkedAccounts.slice(1).map((acc, idx) => ({
    id: `e-${idx}`,
    source: linkedAccounts[0].account_id.toString(),
    target: acc.account_id.toString(),
    animated: true,
  }));

  return (
    <div style={{ height: 300 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
