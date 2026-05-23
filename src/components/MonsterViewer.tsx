"use client";

import React, { type ReactNode, useState, useEffect, useRef, useCallback, Suspense, useReducer } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls, useGLTF, useAnimations,
  Environment, ContactShadows, Html, Stage,
} from "@react-three/drei";
import * as THREE from "three";
import { Play, GitBranch, Gauge, ChevronDown, RotateCcw, HelpCircle, Mouse, MoveHorizontal } from "lucide-react";

// ─── Camera help tooltip ───────────────────────────────────────────────────────
function CameraHelpButton() {
  const [visible, setVisible] = useState(false);

  const controls: { icon: React.ReactNode; label: string; desc: string }[] = [
    {
      icon: <Mouse size={13} />,
      label: "LMB",
      desc: "Orbit",
    },
    {
      icon: <Mouse size={13} />,
      label: "RMB",
      desc: "Pan",
    },
    {
      icon: <MoveHorizontal size={13} />,
      label: "Scroll",
      desc: "Zoom in / out",
    },
  ];

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button style={{ ...overlayBtn(), padding: "5px 7px" }} title="Camera controls">
        <HelpCircle size={13} />
      </button>

      {visible && (
        <div
          className="absolute z-50 rounded-xl p-3 flex flex-col gap-2"
          style={{
            top: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10,13,26,0.95)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(14px)",
            minWidth: "190px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-bright)" }}>
            Camera controls
          </div>
          {controls.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5">
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-mono font-bold shrink-0"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--accent-bright)",
                  minWidth: "52px",
                  justifyContent: "center",
                }}
              >
                {c.icon} {c.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Force environment intensity on the Three.js scene ───────────────────────
function EnvIntensity({ value }: { value: number }) {
  const { scene } = useThree();
  useEffect(() => {
    const s = scene as THREE.Scene & { environmentIntensity?: number };
    s.environmentIntensity = value;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Error boundary ───────────────────────────────────────────────────────────
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

// ─── GLB model with full animation + skeleton support ─────────────────────────
function MonsterModel({
  url,
  showSkeleton,
  selectedAnimation,
  animationSpeed,
  onAnimationsLoaded,
}: {
  url: string;
  showSkeleton: boolean;
  selectedAnimation?: string;
  animationSpeed: number;
  onAnimationsLoaded: (names: string[]) => void;
}) {
  const group    = useRef<THREE.Group | null>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names, mixer } = useAnimations(animations, group);
  const { scene: threeScene } = useThree();
  const prevNameRef = useRef<string | null>(null);

  // Debug: log material info to console to diagnose texture loading issues
  useEffect(() => {
    console.group(`[MonsterViewer] Scene: ${url}`);
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.SkinnedMesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;

        // Sample the first pixel of the base color map to see actual colors
        let mapPixel = "n/a";
        if (mat.map?.image) {
          try {
            const c = document.createElement("canvas");
            c.width = c.height = 1;
            c.getContext("2d")!.drawImage(mat.map.image as CanvasImageSource, 0, 0, 1, 1);
            const [r, g, b, a] = c.getContext("2d")!.getImageData(0, 0, 1, 1).data;
            mapPixel = `rgba(${r},${g},${b},${a})`;
          } catch { mapPixel = "cross-origin blocked"; }
        }

        console.log(`Mesh: ${obj.name} | Mat: ${mat.name}`, {
          color:           "#" + mat.color.getHexString(),
          metalness:       mat.metalness,
          roughness:       mat.roughness,
          emissive:        "#" + mat.emissive.getHexString(),
          emissiveIntensity: mat.emissiveIntensity,
          map:             mat.map ? `✅ ${(mat.map.image as HTMLImageElement)?.width}×${(mat.map.image as HTMLImageElement)?.height} colorSpace:${mat.map.colorSpace}` : "❌ null",
          mapPixel,
          mapSameAsORM:    mat.map && mat.metalnessMap ? (mat.map.source === mat.metalnessMap.source ? "⚠️ YES — ORM used as base color!" : "✅ different textures") : "n/a",
          metalnessMap:    mat.metalnessMap ? "✅" : "❌ null",
          roughnessMap:    mat.roughnessMap ? "✅" : "❌ null",
          normalMap:       mat.normalMap    ? "✅" : "❌ null",
          aoMap:           mat.aoMap        ? "✅" : "❌ null",
          emissiveMap:     mat.emissiveMap  ? "✅" : "❌ null",
          transparent:     mat.transparent,
          opacity:         mat.opacity,
        });
      });
    });
    console.groupEnd();
  }, [scene, url]);

  // Universal fix for UE5 character exports:
  // 1. frustumCulled=false → animated bones don't incorrectly cull meshes
  // 2. Opaque     (transparent:false)           → depthWrite=true,  renderOrder=0
  // 3. Cutout     (alphaTest>0)                 → depthWrite=true,  DoubleSide, renderOrder=1
  // 4. Alpha-blend (transparent:true, alphaTest=0) → depthWrite=false, DoubleSide, renderOrder=2
  // 5. Fix broken ORM: if metalness/roughness stuck at 1 without texture maps, use sane defaults
  useEffect(() => {
    // Disable frustum culling on every object in the hierarchy —
    // skinned mesh bounding boxes are computed from bind pose and become
    // wrong once the animation moves bones away from rest position.
    scene.traverse((obj) => {
      obj.frustumCulled = false;

      // Also set geometry bounding sphere to Infinity so Three.js never
      // auto-culls even if frustumCulled is reset by Stage/Bounds internally.
      if ((obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) && obj.geometry) {
        if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
        obj.geometry.boundingSphere!.radius = Infinity;
      }

      if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.SkinnedMesh)) return;

      const materials: THREE.Material[] = Array.isArray(obj.material) ? obj.material : [obj.material];

      materials.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;

        if (mat.alphaTest > 0) {
          // Already cutout (hair, lace, feathers) — keep alphaTest, force opaque mode
          mat.transparent = false;
          mat.depthWrite  = true;
          mat.side        = THREE.DoubleSide;
        } else if (mat.transparent) {
          // Convert alpha-blend → alpha-cutout to avoid sorting/depth issues
          mat.transparent = false;
          mat.alphaTest   = 0.1;
          mat.depthWrite  = true;
          mat.side        = THREE.DoubleSide;
        } else {
          // Fully opaque
          mat.transparent = false;
          mat.depthWrite  = true;
          mat.side        = THREE.FrontSide;
        }
        obj.renderOrder = 0;

        // Fix ORM values stuck at 1 when no texture map is present
        if (!mat.metalnessMap && mat.metalness >= 1) mat.metalness = 0.7;
        if (!mat.roughnessMap && mat.roughness >= 1) mat.roughness = 0.55;

        // Clamp emissive intensity (KHR_materials_emissive_strength)
        if (mat.emissiveIntensity > 1) mat.emissiveIntensity = 1;

        // Ensure base color map uses sRGB color space
        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
        if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;

        mat.needsUpdate = true;
      });
    });
  }, [scene]);

  // Report available animations once loaded
  useEffect(() => {
    onAnimationsLoaded(names);
  }, [names, onAnimationsLoaded]);

  // Play animation with crossfade
  useEffect(() => {
    if (names.length === 0) return;
    const target = selectedAnimation ?? names[0];
    const next   = actions[target];
    if (!next) return;
    const prev = prevNameRef.current;
    if (prev && prev !== target && actions[prev]) {
      actions[prev]!.fadeOut(0.4);
      next.reset().fadeIn(0.4).play();
    } else {
      next.reset().fadeIn(0.3).play();
    }
    prevNameRef.current = target;
  }, [selectedAnimation, actions, names]);

  // Animation speed — direct THREE.js mutation
  useEffect(() => {
    if (!mixer) return;
    /* eslint-disable-next-line react-hooks/immutability */
    mixer.timeScale = animationSpeed;
  }, [animationSpeed, mixer]);

  // Skeleton helper — added to the Three.js scene so it renders on top
  useEffect(() => {
    const node = group.current;
    if (!node || !showSkeleton) return;
    const helper = new THREE.SkeletonHelper(node);
    threeScene.add(helper);
    return () => { threeScene.remove(helper); helper.dispose(); };
  }, [showSkeleton, threeScene]);

  return <primitive ref={group} object={scene} dispose={null} />;
}

// ─── Placeholder monster (no GLB) ─────────────────────────────────────────────
function PlaceholderMonster() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#2a3060" roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0.15, 1.65, 0.31]}>
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial color="#5b7cf6" emissive="#5b7cf6" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.15, 1.65, 0.31]}>
        <sphereGeometry args={[0.07]} />
        <meshStandardMaterial color="#5b7cf6" emissive="#5b7cf6" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.2, 2.05, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.08, 0.4, 6]} />
        <meshStandardMaterial color="#f5c842" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.2, 2.05, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.08, 0.4, 6]} />
        <meshStandardMaterial color="#f5c842" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.6, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-0.6, 0.8, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#3d4a8a" roughness={0.3} metalness={0.6} />
      </mesh>
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

// ─── Camera rig: OrbitControls + reset ────────────────────────────────────────
function CameraRig({ resetTick }: { resetTick: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (resetTick > 0) controlsRef.current?.reset();
  }, [resetTick]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      panSpeed={0.8}
      minDistance={0.1}
      maxDistance={40}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI * 0.88}
    />
  );
}

// ─── Environment presets ───────────────────────────────────────────────────────
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

// ─── Animation/skeleton state reducer ────────────────────────────────────────
type AnimState = {
  animations:   string[];
  currentAnim:  string | undefined;
  showSkeleton: boolean;
  showPanel:    boolean;
};
type AnimAction =
  | { type: "reset";       animationName?: string }
  | { type: "loaded";      names: string[] }
  | { type: "play";        name: string }
  | { type: "skeleton" }
  | { type: "panel" }
  | { type: "closePanel" };

function animReducer(state: AnimState, action: AnimAction): AnimState {
  switch (action.type) {
    case "reset":      return { animations: [], currentAnim: action.animationName, showSkeleton: false, showPanel: false };
    case "loaded":     return { ...state, animations: action.names, currentAnim: state.currentAnim ?? action.names[0], showPanel: action.names.length > 0 };
    case "play":       return { ...state, currentAnim: action.name };
    case "skeleton":   return { ...state, showSkeleton: !state.showSkeleton };
    case "panel":      return { ...state, showPanel: !state.showPanel };
    case "closePanel": return { ...state, showPanel: false };
  }
}

// ─── Overlay button style helper ──────────────────────────────────────────────
const overlayBtn = (active = false): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: "4px",
  padding: "5px 10px", borderRadius: "8px",
  fontSize: "0.7rem", fontWeight: 500, cursor: "pointer",
  border:      `1px solid ${active ? "var(--accent)"      : "var(--border)"}`,
  background:   active ? "var(--accent-glow)"              : "var(--bg-secondary)",
  color:        active ? "var(--accent-bright)"            : "var(--text-secondary)",
  backdropFilter: "blur(8px)",
  transition: "all 0.15s",
});

// ─── Public API ────────────────────────────────────────────────────────────────
interface MonsterViewerProps {
  modelUrl?: string;
  animationName?: string;
  height?: number | string;
  defaultEnv?: EnvPreset;
}

export default function MonsterViewer({
  modelUrl,
  animationName,
  height = 360,
  defaultEnv = "studio",
}: MonsterViewerProps) {
  const h = typeof height === "number" ? `${height}px` : height;

  // ── Env
  const [env,           setEnv]           = useState<EnvPreset>(defaultEnv);
  const [showEnvPicker, setShowEnvPicker] = useState(false);

  // ── Animation / skeleton (single reducer = React Compiler-safe, no cascade)
  const [anim, dispatchAnim] = useReducer(animReducer, {
    animations:   [],
    currentAnim:  animationName,
    showSkeleton: false,
    showPanel:    false,
  });

  // ── Speed (independent, not reset on monster change)
  const [animSpeed, setAnimSpeed] = useState(1);

  // ── Camera reset tick
  const [cameraResetTick, setCameraResetTick] = useState(0);

  // Reset on monster change — single dispatch, no cascading renders
  useEffect(() => {
    dispatchAnim({ type: "reset", animationName });
  }, [modelUrl, animationName]);

  // Stable callback — auto-opens panel when clips are found
  const handleAnimsLoaded = useCallback((names: string[]) => {
    dispatchAnim({ type: "loaded", names });
  }, []);

  const currentPreset = ENV_PRESETS.find((p) => p.id === env)!;
  const hasModel = Boolean(modelUrl);
  const hasAnims = anim.animations.length > 0;

  const loadingFallback = (
    <Html center>
      <div className="text-xs animate-pulse" style={{ color: "var(--text-secondary)" }}>Loading…</div>
    </Html>
  );
  const errorFallback = (
    <>
      <PlaceholderMonster />
      <ContactShadows position={[0, -0.4, 0]} opacity={0.4} scale={4} blur={2} far={3} />
      <Environment preset={env} />
    </>
  );

  return (
    <div
      className="rounded-xl overflow-hidden border w-full relative"
      style={{
        height:      h,
        borderColor: "var(--border)",
        background:  anim.showSkeleton ? "#0a0d1a" : ENV_BG[env],
        transition:  "background 0.5s ease",
      }}
    >
      {/* ── Top-left: skeleton + camera reset + help ── */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap" style={{ maxWidth: "calc(100% - 160px)" }}>
        {hasModel && (
          <button onClick={() => dispatchAnim({ type: "skeleton" })} style={overlayBtn(anim.showSkeleton)} title="Toggle skeleton">
            <GitBranch size={13} /> Skeleton
          </button>
        )}

        <button onClick={() => setCameraResetTick((n) => n + 1)} style={overlayBtn()} title="Reset camera">
          <RotateCcw size={13} />
        </button>
        <CameraHelpButton />
      </div>

      {/* ── Top-right: env picker ── */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
        <button onClick={() => setShowEnvPicker((v) => !v)} style={overlayBtn()} title="Change environment">
          <span>{currentPreset.icon}</span>
          <span>{currentPreset.label}</span>
          <span style={{ opacity: 0.5, fontSize: "0.6rem" }}>{showEnvPicker ? "▲" : "▼"}</span>
        </button>
        {showEnvPicker && (
          <div className="flex flex-col gap-0.5 rounded-xl p-1.5"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", backdropFilter: "blur(12px)", minWidth: "130px" }}>
            {ENV_PRESETS.map((preset) => (
              <button key={preset.id} onClick={() => { setEnv(preset.id); setShowEnvPicker(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left"
                style={{
                  background: env === preset.id ? "var(--accent-glow)" : "transparent",
                  color:      env === preset.id ? "var(--accent-bright)" : "var(--text-secondary)",
                  fontWeight: env === preset.id ? 600 : 400,
                }}>
                <span>{preset.icon}</span><span>{preset.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Three.js Canvas ── */}
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
        style={{ background: "transparent" }}
      >
        {/* Force env intensity — Stage overrides scene prop so we need this component */}
        <EnvIntensity value={0.15} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff8f0" castShadow />
        <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#f0f4ff" />

        <Suspense fallback={loadingFallback}>
          {hasModel ? (
            <GLBErrorBoundary key={modelUrl} fallback={errorFallback}>
              <Stage
                intensity={0.3}
                environment={env}
                adjustCamera={1.2}
                shadows={false}
              >
                <MonsterModel
                  url={modelUrl!}
                  showSkeleton={anim.showSkeleton}
                  selectedAnimation={anim.currentAnim}
                  animationSpeed={animSpeed}
                  onAnimationsLoaded={handleAnimsLoaded}
                />
              </Stage>
              {/* Shadow fixe à Y=0 (pieds des modèles de jeu) —
                  indépendant de Stage pour ne pas bouger avec l'animation */}
              <ContactShadows
                position={[0, -0.01, 0]}
                opacity={0.5}
                scale={10}
                blur={3}
                far={6}
              />
            </GLBErrorBoundary>
          ) : (
            <>
              <PlaceholderMonster />
              <ContactShadows position={[0, -0.4, 0]} opacity={0.4} scale={4} blur={2} far={3} />
              <Environment preset={env} />
            </>
          )}
        </Suspense>

        <CameraRig resetTick={cameraResetTick} />
      </Canvas>

      {/* ── Animation panel (bottom overlay) ── */}
      {hasModel && anim.showPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-10"
          style={{ background: "rgba(10,13,26,0.88)", borderTop: "1px solid var(--border)", backdropFilter: "blur(12px)", padding: "10px 12px 12px" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent-bright)" }}>
              <Play size={12} /> Animations
            </div>
            <div className="flex items-center gap-2">
              <Gauge size={12} style={{ color: "var(--text-muted)" }} />
              <input type="range" min={0.1} max={2} step={0.05} value={animSpeed}
                onChange={(e) => setAnimSpeed(Number(e.target.value))}
                style={{ width: "80px", accentColor: "var(--accent)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--accent-bright)", minWidth: "30px" }}>
                {animSpeed.toFixed(2)}×
              </span>
              <button onClick={() => setAnimSpeed(1)} className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }} title="Reset speed">
                ↺
              </button>
              <button onClick={() => dispatchAnim({ type: "closePanel" })} style={{ color: "var(--text-muted)", lineHeight: 1 }} title="Close">
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
          {/* Clips */}
          <div className="flex flex-wrap gap-1">
            {anim.animations.map((name: string) => {
              const isActive = anim.currentAnim === name;
              return (
                <button key={name} onClick={() => dispatchAnim({ type: "play", name })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  title={name}
                  style={{
                    background: isActive ? "var(--accent-glow)" : "var(--bg-card)",
                    border:     `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    color:      isActive ? "var(--accent-bright)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                  }}>
                  {isActive && <Play size={9} />}
                  <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom-left: anim toggle + current anim badge ── */}
      {!anim.showPanel && (
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
        {hasModel && hasAnims && (
          <button onClick={() => dispatchAnim({ type: "panel" })} style={overlayBtn(anim.showPanel)} title="Animations panel">
            <Play size={13} />
            {anim.animations.length} anim{anim.animations.length > 1 ? "s" : ""}
          </button>
        )}
        {hasModel && hasAnims && !anim.showPanel && anim.currentAnim && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{ background: "rgba(10,13,26,0.7)", border: "1px solid var(--border)", color: "var(--text-muted)", backdropFilter: "blur(6px)" }}>
            <Play size={9} style={{ color: "var(--accent)" }} />
            <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {anim.currentAnim}
            </span>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

