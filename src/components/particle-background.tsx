"use client"

import { useEffect, useState } from "react"
import { Particles, ParticlesProvider } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import type { Engine, ISourceOptions } from "@tsparticles/engine"

const OPTIONS: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: "transparent" },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true, width: 800, height: 800 } },
    color: { value: "#ffffff" },
    opacity: { value: { min: 0.15, max: 0.25 } },
    size: { value: 0.8 },
    links: { enable: false },
    move: {
      enable: true,
      speed: 0.3,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
  },
  detectRetina: true,
}

// Must be a stable reference across renders — ParticlesProvider throws if
// this callback's identity changes after the first mount.
async function initEngine(engine: Engine) {
  await loadSlim(engine)
}

function ParticleCanvas() {
  return (
    <Particles id="hero-particles" className="absolute inset-0 -z-10" options={OPTIONS} />
  )
}

export function ParticleBackground() {
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  if (reducedMotion) return null

  return (
    <ParticlesProvider init={initEngine}>
      <ParticleCanvas />
    </ParticlesProvider>
  )
}
