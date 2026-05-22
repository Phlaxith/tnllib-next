"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useAnimations, Environment, ContactShadows, Html } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

function MonsterModel({ url, animationName }: { url: string; animationName?: string }) {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    const anim = animationName ? actions[animationName] : actions[names[0]];
    anim?.reset().fadeIn(0.3).play();
    return () => { anim?.fadeOut(0.3); };
  }, [actions, names, animationName]);

  return <primitive ref={group} object={scene} dispose={null} />;
}

function PlaceholderMonster() {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#2a3060" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.15, 1.65, 0.31]}>
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial color="#5b7cf6" emissive="#5b7cf6" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.15, 1.65, 0.31]}>
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial color="#5b7cf6" emissive="#5b7cf6" emissiveIntensity={2} />
      </mesh>
      {/* Horns */}
      <mesh position={[0.2, 2.05, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.08, 0.4, 6]} />
        <meshStandardMaterial color="#f5c842" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.2, 2.05, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.4, 6]} />
        <meshStandardMaterial color="#f5c842" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arms */}
      <mesh position={[0.6, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-0.6, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Legs */}
      <mesh position={[0.22, -0.05, 0]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#2a3060" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[-0.22, -0.05, 0]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#2a3060" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

interface MonsterViewerProps {
  modelUrl?: string;
  animationName?: string;
  height?: number;
}

export default function MonsterViewer({ modelUrl, animationName, height = 360 }: MonsterViewerProps) {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ height, borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
        <pointLight position={[-3, 3, -3]} intensity={0.5} color="#5b7cf6" />

        <Suspense fallback={
          <Html center>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Chargement…</div>
          </Html>
        }>
          {modelUrl ? (
            <MonsterModel url={modelUrl} animationName={animationName} />
          ) : (
            <PlaceholderMonster />
          )}
          <ContactShadows position={[0, -0.4, 0]} opacity={0.4} scale={4} blur={2} far={3} />
          <Environment preset="night" />
        </Suspense>

        <OrbitControls
          autoRotate
          autoRotateSpeed={1.5}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}

