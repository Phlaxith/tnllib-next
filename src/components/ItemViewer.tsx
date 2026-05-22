"use client";

import { type ReactElement } from "react";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment, ContactShadows, Html, Float } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

function WeaponModel({ url }: { url: string }) {
  const group = useRef<THREE.Group | null>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);
  useEffect(() => {
    const anim = actions[names[0]];
    anim?.reset().fadeIn(0.3).play();
    return () => { anim?.fadeOut(0.3); };
  }, [actions, names]);
  return <primitive ref={group} object={scene} dispose={null} />;
}

// Static shape map — defined outside the component to avoid recreation on every render
const SWORD_SHAPES: Record<string, ReactElement> = {
  bow: (
    <group rotation={[0, 0, Math.PI / 8]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.04, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#8b6914" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.4, 4]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 1.8, 6]} />
        <meshStandardMaterial color="#6b4f2a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.92, 0.1]}>
        <coneGeometry args={[0.05, 0.18, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  ),
  staff: (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 2.2, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#5b7cf6" emissive="#5b7cf6" emissiveIntensity={0.6} roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.1} metalness={0.7} wireframe />
      </mesh>
    </group>
  ),
  wand: (
    <group rotation={[0, 0, -Math.PI / 6]}>
      <mesh>
        <cylinderGeometry args={[0.025, 0.045, 1.5, 8]} />
        <meshStandardMaterial color="#3a2010" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <octahedronGeometry args={[0.12]} />
        <meshStandardMaterial color="#f5c842" emissive="#f5c842" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  ),
  orb: (
    <group>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#5b7cf6" emissive="#5b7cf6" emissiveIntensity={0.5} roughness={0.0} metalness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#7a96ff" roughness={0.1} metalness={0.8} wireframe />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.55, Math.sin(i * Math.PI / 2) * 0.55, 0]}>
          <sphereGeometry args={[0.06]} />
          <meshStandardMaterial color="#f5c842" emissive="#f5c842" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  ),
};

const DEFAULT_SWORD = (
  <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
    <group rotation={[0, 0, Math.PI / 8]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.08, 1.4, 0.02]} />
        <meshStandardMaterial color="#d4d8e8" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, 1.25, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.04, 0.22, 4]} />
        <meshStandardMaterial color="#d4d8e8" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.55, 0.07, 0.06]} />
        <meshStandardMaterial color="#f5c842" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.7, 8]} />
        <meshStandardMaterial color="#4a2e0a" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.98, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#f5c842" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  </Float>
);

function SwordPlaceholder({ weaponType = "sword" }: { weaponType?: string }) {
  if (SWORD_SHAPES[weaponType]) {
    return <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>{SWORD_SHAPES[weaponType]}</Float>;
  }
  return DEFAULT_SWORD;
}

interface ItemViewerProps {
  modelUrl?: string;
  weaponType?: string;
  height?: number;
}

export default function ItemViewer({ modelUrl, weaponType = "sword", height = 320 }: ItemViewerProps) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ height, borderColor: "var(--border)", background: "radial-gradient(ellipse at center, #1a1f35 0%, #0d0f1a 100%)" }}>
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 40 }} shadows gl={{ antialias: true }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <pointLight position={[-3, 2, -2]} intensity={0.8} color="#5b7cf6" />
        <pointLight position={[3, -1, 2]} intensity={0.4} color="#f5c842" />

        <Suspense fallback={<Html center><div className="text-xs" style={{ color: "var(--text-secondary)" }}>Chargement…</div></Html>}>
          {modelUrl
            ? <WeaponModel url={modelUrl} />
            : <SwordPlaceholder weaponType={weaponType} />
          }
          <ContactShadows position={[0, -1.2, 0]} opacity={0.3} scale={4} blur={2} />
          <Environment preset="night" />
        </Suspense>

        <OrbitControls autoRotate autoRotateSpeed={2} enablePan={false} minDistance={1.5} maxDistance={6} />
      </Canvas>
    </div>
  );
}
