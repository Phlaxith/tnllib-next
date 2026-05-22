"use client";

import { useId } from "react";

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

export default function SliderField({ label, value, min, max, step = 1, onChange }: SliderFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: "var(--bg-secondary)", color: "var(--accent-bright)", minWidth: "52px", textAlign: "right" }}
        >
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
