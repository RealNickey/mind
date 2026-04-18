"use client";

import React, { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import SpriteText from "three-spritetext";

type KnowledgeGraphNode = {
  id: string;
  title?: string;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
};

type KnowledgeGraphLink = {
  source: string;
  target: string;
};

type ForceGraphHandle = {
  cameraPosition: (
    position: { x: number; y: number; z: number },
    lookAt?: KnowledgeGraphNode,
    ms?: number
  ) => void;
};

type ForceGraphProps = {
  graphData: {
    nodes: KnowledgeGraphNode[];
    links: KnowledgeGraphLink[];
  };
  nodeThreeObject: (node: KnowledgeGraphNode) => THREE.Object3D;
  nodeLabel: (node: KnowledgeGraphNode) => string;
  linkWidth: number;
  linkColor: (link: KnowledgeGraphLink) => string;
  linkDirectionalParticles: number;
  linkDirectionalParticleWidth: number;
  linkDirectionalParticleSpeed: number;
  linkDirectionalParticleColor: (link: KnowledgeGraphLink) => string;
  onNodeClick: (node: KnowledgeGraphNode) => void;
  enableNodeDrag: boolean;
  showNavInfo: boolean;
  backgroundColor: string;
};

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false }) as unknown as React.ComponentType<ForceGraphProps & { ref?: React.Ref<ForceGraphHandle> }>;

interface KnowledgeGraphProps {
  nodes: KnowledgeGraphNode[];
  links: KnowledgeGraphLink[];
  onNodeClick?: (node: KnowledgeGraphNode) => void;
}

export function KnowledgeGraph({ nodes, links, onNodeClick }: KnowledgeGraphProps) {
  const fgRef = useRef<ForceGraphHandle | null>(null);

  const handleNodeClick = useCallback((node: KnowledgeGraphNode) => {
    if (fgRef.current) {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const z = node.z ?? 0;
      const distance = 80;
      const nodeDistance = Math.hypot(x, y, z) || 1;
      const distRatio = 1 + distance / nodeDistance;

      fgRef.current.cameraPosition(
        { x: x * distRatio, y: y * distRatio, z: z * distRatio },
        node,
        2000
      );
    }
    if (onNodeClick) onNodeClick(node);
  }, [onNodeClick]);

  const paintNode = useCallback((node: KnowledgeGraphNode) => {
    const group = new THREE.Group();

    const geometry = new THREE.SphereGeometry(node.val || 2, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: node.color || "#8b5cf6",
      transparent: true,
      opacity: 0.8,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    if (node.title) {
      const sprite = new SpriteText(node.title.length > 25 ? node.title.slice(0, 25) + "..." : node.title);
      sprite.color = "rgba(255, 255, 255, 0.9)";
      sprite.textHeight = 3;
      sprite.position.set(0, -(node.val || 2) - 4, 0);
      group.add(sprite);
    }

    const auraGeom = new THREE.SphereGeometry((node.val || 2) * 1.5, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: node.color || "#8b5cf6",
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });
    const aura = new THREE.Mesh(auraGeom, auraMat);
    group.add(aura);

    return group;
  }, []);

  return (
    <div className="absolute inset-0 cursor-crosshair">
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeThreeObject={paintNode}
        nodeLabel={() => ""}
        linkWidth={1}
        linkColor={() => "rgba(255,255,255,0.08)"}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => "rgba(255,255,255,0.6)"}
        onNodeClick={handleNodeClick}
        enableNodeDrag={true}
        showNavInfo={false}
        backgroundColor="#09090b"
      />
      <div className="absolute bottom-6 left-6 text-xs text-zinc-500 font-mono flex flex-col gap-1 pointer-events-none">
        <div>nodes: {nodes.length}</div>
        <div>edges: {links.length}</div>
        <div>engine: webgl / force-3d</div>
      </div>
    </div>
  );
}
