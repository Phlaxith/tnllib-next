"use client";

import React, { type ReactElement, type ReactNode, useState, Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls, useGLTF, useAnimations,
  Environment, ContactShadows, Html, Float,
  Stage,
} from "@react-three/drei";
import * as THREE from "three";

// ─── Error boundary for GLB loading failures ───────────────────────────────
class GLBErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── Actual GLB model ──────────────────────────────────────────────────────
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

// ─── Static placeholder shapes ──────────────────────────────────────────────
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

// ─── Environment presets ──────────────────────────────────────────────────
type EnvPreset =
  | "studio" | "apartment" | "city" | "dawn"
  | "forest" | "lobby"     | "night"| "park"
  | "sunset" | "warehouse";

const ENV_PRESETS: { id: EnvPreset; label: string; icon: string }[] = [
  { id: "studio",    label: "Studio",    icon: "💡" },
  { id: "apartment", label: "Apt",       icon: "🏠" },
  { id: "city",      label: "City",      icon: "🌆" },
  { id: "dawn",      label: "Dawn",      icon: "🌅" },
  { id: "forest",    label: "Forest",    icon: "🌲" },
  { id: "lobby",     label: "Lobby",     icon: "🏛️" },
  { id: "night",     label: "Night",     icon: "🌙" },
  { id: "park",      label: "Park",      icon: "🌳" },
  { id: "sunset",    label: "Sunset",    icon: "🌇" },
  { id: "warehouse", label: "Warehouse", icon: "🏭" },
];

/** Gradient CSS de fond par environnement — donne un contexte visuel au modèle */
const ENV_BG: Record<EnvPreset, string> = {
  studio:    "radial-gradient(ellipse at 40% 30%, #dde2f0 0%, #b8c0d8 100%)",
  apartment: "radial-gradient(ellipse at 40% 20%, #f0e4ce 0%, #d4b88a 100%)",
  city:      "radial-gradient(ellipse at 50% 10%, #3a4466 0%, #1a2040 100%)",
  dawn:      "radial-gradient(ellipse at 50% 0%,  #ffb347 0%, #6b3080 100%)",
  forest:    "radial-gradient(ellipse at 40% 20%, #3a6b30 0%, #1c3a18 100%)",
  lobby:     "radial-gradient(ellipse at 40% 20%, #e0d0b0 0%, #b89a70 100%)",
  night:     "radial-gradient(ellipse at 50% 40%, #1e2444 0%, #0a0d1a 100%)",
  park:      "radial-gradient(ellipse at 40% 10%, #7ab89a 0%, #3a6050 100%)",
  sunset:    "radial-gradient(ellipse at 50% 0%,  #ff7040 0%, #28103c 100%)",
  warehouse: "radial-gradient(ellipse at 40% 20%, #7a6e62 0%, #3e3630 100%)",
};

// ─── Public API ────────────────────────────────────────────────────────────
interface ItemViewerProps {
  modelUrl?: string;
  weaponType?: string;
  /** CSS height value: number (px) or string like "100%" */
  height?: number | string;
  /** Initial environment preset */
  defaultEnv?: EnvPreset;
}

export default function ItemViewer({
  modelUrl,
  weaponType = "sword",
  height = 320,
  defaultEnv = "studio",
}: ItemViewerProps) {
  const h = typeof height === "number" ? `${height}px` : height;
  const [env, setEnv] = useState<EnvPreset>(defaultEnv);
  const [showEnvPicker, setShowEnvPicker] = useState(false);

  const loadingFallback = (
    <Html center>
      <div className="text-xs animate-pulse" style={{ color: "var(--text-secondary)" }}>Chargement…</div>
    </Html>
  );

  const errorFallback = (
    <Html center>
      <div className="text-xs text-center px-4" style={{ color: "var(--red)" }}>
        ⚠️ Impossible de charger le modèle.<br />
        <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
          Vérifiez que le fichier .glb est valide.
        </span>
      </div>
    </Html>
  );

  const currentPreset = ENV_PRESETS.find((p) => p.id === env)!;

  return (
    <div
      className="rounded-xl overflow-hidden border w-full relative"
      style={{
        height: h,
        borderColor: "var(--border)",
        background: ENV_BG[env],
        transition: "background 0.5s ease",
      }}
    >
      {/* ── Environment picker overlay ── */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
        {/* Toggle button */}
        <button
          onClick={() => setShowEnvPicker((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background:  "var(--bg-secondary)",
            border:      "1px solid var(--border)",
            color:       "var(--text-secondary)",
            backdropFilter: "blur(8px)",
          }}
          title="Changer l'environnement"
        >
          <span>{currentPreset.icon}</span>
          <span>{currentPreset.label}</span>
          <span style={{ opacity: 0.5, fontSize: "0.6rem" }}>{showEnvPicker ? "▲" : "▼"}</span>
        </button>

        {/* Dropdown */}
        {showEnvPicker && (
          <div
            className="flex flex-col gap-0.5 rounded-xl p-1.5"
            style={{
              background:   "var(--bg-secondary)",
              border:       "1px solid var(--border)",
              backdropFilter: "blur(12px)",
              minWidth:     "130px",
            }}
          >
            {ENV_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => { setEnv(preset.id); setShowEnvPicker(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left"
                style={{
                  background: env === preset.id ? "var(--accent-glow)" : "transparent",
                  color:      env === preset.id ? "var(--accent-bright)" : "var(--text-secondary)",
                  fontWeight: env === preset.id ? 600 : 400,
                }}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Three.js Canvas ── */}
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 40 }}
        shadows
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
        style={{ background: "transparent" }}
      >
        {/* Neutral studio-quality lighting for Blender PBR materials */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 8, 5]}   intensity={2.5} castShadow />
        <directionalLight position={[-4, 3, -3]}  intensity={1.0} color="#eef2ff" />
        <directionalLight position={[0, -2, 4]}   intensity={0.5} color="#fff8f0" />

        <Suspense fallback={loadingFallback}>
          {modelUrl ? (
            <GLBErrorBoundary fallback={errorFallback}>
              <Stage
                intensity={0.6}
                environment={env}
                adjustCamera={1.2}
                shadows={{ type: "contact", opacity: 0.3, blur: 2 }}
              >
                <WeaponModel url={modelUrl} />
              </Stage>
            </GLBErrorBoundary>
          ) : (
            <>
              <SwordPlaceholder weaponType={weaponType} />
              <ContactShadows position={[0, -1.2, 0]} opacity={0.3} scale={4} blur={2} />
              <Environment preset={env} />
            </>
          )}
        </Suspense>

        <OrbitControls
          autoRotate={!modelUrl}
          autoRotateSpeed={2}
          enablePan={false}
          minDistance={1.0}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
}
