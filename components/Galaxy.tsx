// components/Galaxy.tsx
// Main Three.js scene: renders all spheres + connection lines + camera controls.

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import Sphere from './Sphere';
import { useStore, addChildNodes } from '@/lib/store';
import { expandTopic } from '@/lib/ai';
import { MAX_SPHERES } from '@/lib/types';
import toast from 'react-hot-toast';

// ── Single connection line ─────────────────────────────────────────────────────

function ConnectionLine({ from, to, color }: { 
  from: [number, number, number]; 
  to: [number, number, number]; 
  color: string; 
}) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color, 
    transparent: true, 
    opacity: 0.25 
  });
  const lineObj = new THREE.Line(geometry, material);

  return <primitive object={lineObj} />;
}

// ── Connection lines between spheres ─────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  nebula:  '#38bdf8',
  plasma:  '#a78bfa',
  nova:    '#34d399',
  corona:  '#fb923c',
  pulsar:  '#f472b6',
};

function ConnectionLines({ nodes }: { nodes: Record<string, import('@/lib/types').GalaxyNode> }) {
  const lines = Object.values(nodes)
    .filter((n) => n.parentId && nodes[n.parentId])
    .map((n) => {
      const parent = nodes[n.parentId!];
      return { from: parent.position, to: n.position, color: n.color, id: n.id };
    });

  return (
    <group>
      {lines.map(({ from, to, color, id }) => (
        <ConnectionLine
          key={id}
          from={from}
          to={to}
          color={COLOR_MAP[color] ?? '#38bdf8'}
        />
      ))}
    </group>
  );
}

// ── Ambient particle field ────────────────────────────────────────────────────

function ParticleField() {
  const count = 500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
      pointsRef.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#38bdf8"
        size={0.03}
        sizeAttenuation
        opacity={0.4}
        depthWrite={false}
      />
    </Points>
  );
}

// ── Camera focus helper ────────────────────────────────────────────────────────

function CameraRig({ targetPos }: { targetPos: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!targetPos) return;
    currentTarget.current.lerp(targetPos, delta * 2);
    // We don't move the camera itself—just smooth targets handled by OrbitControls
  });

  return null;
}

// ── Scene inner ────────────────────────────────────────────────────────────────

function SceneInner() {
  const {
    nodes,
    selectedNodeId,
    hoveredNodeId,
    setSelectedNode,
    setHoveredNode,
    aiBackend,
    language,
    updateNode,
  } = useStore();

  const store = useStore();

  const handleDoubleClick = useCallback(async (nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;

    // Sphere count guard
    const total = Object.keys(nodes).length;
    if (total >= MAX_SPHERES) {
      toast.error(language === 'pt' 
        ? `Limite de ${MAX_SPHERES} esferas atingido`
        : `Sphere limit of ${MAX_SPHERES} reached`
      );
      return;
    }

    // Mark as loading
    updateNode(nodeId, { isLoading: true });

    const parentNode = node.parentId ? nodes[node.parentId] : null;
    const parentContext = parentNode?.label;

    try {
      const concepts = await expandTopic(
        node.label,
        parentContext,
        aiBackend,
        language
      );

      addChildNodes(store, nodeId, concepts);
      updateNode(nodeId, { isLoading: false });
      
      toast.success(
        language === 'pt'
          ? `${concepts.length} conceitos adicionados`
          : `${concepts.length} concepts added`
      );
    } catch (err) {
      updateNode(nodeId, { isLoading: false });
      const msg = err instanceof Error ? err.message : 'AI error';
      toast.error(msg);
    }
  }, [nodes, aiBackend, language, updateNode, store]);

  const nodeList = Object.values(nodes);
  const allPositions = nodeList.map((n) => n.position);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#38bdf8" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a78bfa" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#ffffff" />

      {/* Stars background */}
      <Stars radius={60} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />

      {/* Particle field */}
      <ParticleField />

      {/* Connection lines */}
      <ConnectionLines nodes={nodes} />

      {/* Sphere nodes */}
      {nodeList.map((node) => (
        <Sphere
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isHovered={hoveredNodeId === node.id}
          onHover={setHoveredNode}
          onSelect={setSelectedNode}
          onDoubleClick={handleDoubleClick}
          allPositions={allPositions}
        />
      ))}

      {/* Camera + Orbit Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={3}
        maxDistance={30}
        enablePan
      />
      <CameraRig targetPos={null} />
    </>
  );
}

// ── Main Galaxy component ──────────────────────────────────────────────────────

export default function Galaxy() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    >
      <SceneInner />
    </Canvas>
  );
}
