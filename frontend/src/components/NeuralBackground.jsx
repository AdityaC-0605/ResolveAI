import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * NeuralBackground — An animated Three.js neural network for the dashboard hero.
 * 60 nodes with dynamic edges, bloom-like additive blending, and mouse parallax.
 */
export default function NeuralBackground({ className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // ── Scene setup ───────────────────────────────────────────────────────────
    const W = el.clientWidth, H = el.clientHeight
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
    camera.position.set(0, 0, 14)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const NODE_COUNT  = 55
    const CONNECT_DIST = 4.5
    const nodeData = []

    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f0b5 })
    const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8)

    const accentColors = [0x00f0b5, 0x7c3aed, 0xff2d6b, 0x00c4ff]

    for (let i = 0; i < NODE_COUNT; i++) {
      const spread = 9
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
      )
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.004,
      )
      const colorIdx = Math.floor(Math.random() * accentColors.length)
      const mat = new THREE.MeshBasicMaterial({ color: accentColors[colorIdx] })
      const mesh = new THREE.Mesh(nodeGeo, mat)
      mesh.position.copy(pos)
      scene.add(mesh)
      nodeData.push({ mesh, pos, vel, phase: Math.random() * Math.PI * 2, colorIdx })
    }

    // ── Edges (LineSegments) ──────────────────────────────────────────────────
    const edgePositions  = []
    const edgeColors     = []

    // Build initial edges
    function rebuildEdges() {
      edgePositions.length = 0
      edgeColors.length    = 0
      const colorsMap = [
        new THREE.Color(0x00f0b5),
        new THREE.Color(0x7c3aed),
        new THREE.Color(0xff2d6b),
        new THREE.Color(0x00c4ff),
      ]
      for (let i = 0; i < nodeData.length; i++) {
        for (let j = i + 1; j < nodeData.length; j++) {
          const dist = nodeData[i].pos.distanceTo(nodeData[j].pos)
          if (dist < CONNECT_DIST) {
            const alpha = 1 - dist / CONNECT_DIST
            edgePositions.push(...nodeData[i].pos.toArray(), ...nodeData[j].pos.toArray())
            const c = colorsMap[nodeData[i].colorIdx]
            edgeColors.push(c.r * alpha, c.g * alpha, c.b * alpha)
            edgeColors.push(c.r * alpha, c.g * alpha, c.b * alpha)
          }
        }
      }
    }

    rebuildEdges()

    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))
    edgeGeo.setAttribute('color',    new THREE.Float32BufferAttribute(edgeColors, 3))
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 })
    const edges   = new THREE.LineSegments(edgeGeo, edgeMat)
    scene.add(edges)

    // ── Particles (data flow along edges) ─────────────────────────────────────
    const PARTICLE_COUNT = 80
    const pPositions = new Float32Array(PARTICLE_COUNT * 3)
    const particleData = Array.from({ length: PARTICLE_COUNT }, () => {
      const i = Math.floor(Math.random() * nodeData.length)
      const j = Math.floor(Math.random() * nodeData.length)
      return { from: i, to: j !== i ? j : (i + 1) % nodeData.length, t: Math.random() }
    })
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0b5, size: 0.08, transparent: true, opacity: 0.8,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ── Mouse ─────────────────────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Animation Loop ────────────────────────────────────────────────────────
    let frame = 0
    let raf
    const clock = new THREE.Clock()

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      frame++

      // Camera parallax
      camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.02
      camera.position.y += (-mouse.y * 1.0 - camera.position.y) * 0.02
      camera.lookAt(scene.position)

      // Move nodes
      nodeData.forEach((n) => {
        n.pos.add(n.vel)
        // Soft boundary bounce
        ;['x', 'y', 'z'].forEach((ax) => {
          const bound = ax === 'x' ? 9 : 4.5
          if (Math.abs(n.pos[ax]) > bound) n.vel[ax] *= -1
        })
        // Subtle pulse scale
        const scale = 1 + 0.4 * Math.sin(t * 1.5 + n.phase)
        n.mesh.scale.setScalar(scale)
        n.mesh.position.copy(n.pos)
      })

      // Rebuild edges every 3 frames (performance)
      if (frame % 3 === 0) {
        rebuildEdges()
        edgeGeo.attributes.position.array.set(edgePositions)
        edgeGeo.attributes.position.needsUpdate = true
        edgeGeo.attributes.color.array.set(edgeColors)
        edgeGeo.attributes.color.needsUpdate = true
        edgeGeo.setDrawRange(0, edgePositions.length / 3)
      }

      // Animate particles along edges
      particleData.forEach((p, i) => {
        p.t += 0.008
        if (p.t >= 1) {
          p.t = 0
          p.from = p.to
          p.to   = Math.floor(Math.random() * nodeData.length)
        }
        const pos = nodeData[p.from].pos.clone().lerp(nodeData[p.to].pos, p.t)
        pPositions[i * 3]     = pos.x
        pPositions[i * 3 + 1] = pos.y
        pPositions[i * 3 + 2] = pos.z
      })
      particleGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className={`w-full h-full ${className}`} />
}