// components/Sphere.tsx
// A single floating sphere node in the galaxy mind map.
// Handles: hover glow, click selection, double-click expansion, physics drift.

'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere as DreiSphere } from '@react-three/drei';
import * as THREE from 'three';
import type { GalaxyNode } from '@/lib/types';
import { SPHERE_COLORS } from '@/lib/types';

interface SphereProps {
  node: GalaxyNode;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  allPositions: [number, number, number][]; // for soft collision avoidance
}

/** Compute sphere radius based on depth */
function getRadius(depth: number): number {
  return Math.max(0.25, 0.6 - depth * 0.08);
}

/** Compute label font size based on depth */
function getFontSize(depth: number): number {
  return Math.max(0.08, 0.16 - depth * 0.02);
}

export default function Sphere({
  node,
  isSelected,
  isHovered,
  onHover,
  onSelect,
  onDoubleClick,
  allPositions,
}: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Animated position (starts at node.position, drifts gently)
  const currentPos = useRef(new THREE.Vector3(...node.position));
  const velocity = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 0.002,
    (Math.random() - 0.5) * 0.001,
    (Math.random() - 0.5) * 0.002
  ));
  const targetPos = useRef(new THREE.Vector3(...node.position));

  const [lastClickTime, setLastClickTime] = useState(0);

  const colors = SPHERE_COLORS[node.color];
  const radius = getRadius(node.depth);
  const isRoot = node.depth === 0;

  // ── Animation frame ──────────────────────────────────────────────────────

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Gentle drift (root stays centered)
    if (!isRoot) {
      // Add small random velocity each frame
      velocity.current.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.0005,
        (Math.random() - 0.5) * 0.0003,
        (Math.random() - 0.5) * 0.0005
      ));

      // Dampen velocity
      velocity.current.multiplyScalar(0.98);

      // Pull back toward target (spring)
      const toTarget = targetPos.current.clone().sub(currentPos.current);
      toTarget.multiplyScalar(0.01);
      velocity.current.add(toTarget);

      // Clamp max drift from target
      const maxDrift = 0.8;
      const distFromTarget = currentPos.current.distanceTo(targetPos.current);
      if (distFromTarget > maxDrift) {
        velocity.current.add(toTarget.normalize().multiplyScalar(0.01));
      }

      currentPos.current.add(velocity.current);
      groupRef.current.position.copy(currentPos.current);
    } else {
      // Root sphere: subtle pulse rotation
      groupRef.current.rotation.y += delta * 0.3;
    }

    // Glow pulse
    if (glowRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.002) * 0.06;
      glowRef.current.scale.setScalar(
        isSelected ? scale * 1.3 : isHovered ? scale * 1.15 : scale
      );
    }
  });

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Double-click detected
      onDoubleClick(node.id);
    } else {
      onSelect(node.id);
    }
    setLastClickTime(now);
  }, [lastClickTime, node.id, onSelect, onDoubleClick]);

  // ── Material properties ────────────────────────────────────────────────────

  const emissiveIntensity = isSelected ? 1.2 : isHovered ? 0.8 : isRoot ? 0.6 : 0.4;
  const opacity = node.isLoading ? 0.5 : 1;

  return (
    <group ref={groupRef} position={node.position}>
      {/* Outer glow halo */}
      <DreiSphere ref={glowRef} args={[radius * 1.6, 16, 16]}>
        <meshBasicMaterial
          color={colors.hex}
          transparent
          opacity={isSelected ? 0.12 : isHovered ? 0.08 : 0.04}
          depthWrite={false}
        />
      </DreiSphere>

      {/* Main sphere */}
      <DreiSphere
        ref={meshRef}
        args={[radius, 32, 32]}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node.id); }}
        onPointerOut={() => onHover(null)}
      >
        <meshStandardMaterial
          color={colors.hex}
          emissive={colors.emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.1}
          transparent
          opacity={opacity}
        />
      </DreiSphere>

      {/* Loading ring */}
      {node.isLoading && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.4, 0.02, 8, 64]} />
          <meshBasicMaterial color={colors.hex} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Label */}
      <Text
        position={[0, -(radius + 0.15), 0]}
        fontSize={getFontSize(node.depth)}
        color={isSelected || isHovered ? colors.hex : '#94a3b8'}
        anchorX="center"
        anchorY="top"
        maxWidth={2.5}
        textAlign="center"
        font="/fonts/SpaceMono-Regular.ttf"
        // Fallback to system font if custom font fails
        onSync={() => {}}
      >
        {node.label}
      </Text>

      {/* Selected ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.2, 0.015, 8, 64]} />
          <meshBasicMaterial color={colors.hex} transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
