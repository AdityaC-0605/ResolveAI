import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleField({ className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight
    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
    cam.position.z = 60
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // Particle cloud — acid green + cyan data-points
    const N = 1800
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const palette = [
      [0.831, 0.957, 0.235], // acid #d4f43c
      [0.180, 0.906, 0.831], // cyan #2ee8d4
      [0.608, 0.435, 1.000], // violet #9b6fff
    ]
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 160
      pos[i*3+1] = (Math.random() - 0.5) * 100
      pos[i*3+2] = (Math.random() - 0.5) * 80
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2]
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    const mat = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.55 })
    const pts = new THREE.Points(geo, mat)
    scene.add(pts)

    // Sparse connection lines between close nodes (subset for perf)
    const lineGeo = new THREE.BufferGeometry()
    const linePos = []
    for (let i = 0; i < 60; i++) {
      const a = Math.floor(Math.random() * N), b = Math.floor(Math.random() * N)
      linePos.push(pos[a*3], pos[a*3+1], pos[a*3+2], pos[b*3], pos[b*3+1], pos[b*3+2])
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
    const lineMat = new THREE.LineBasicMaterial({ color: 0xd4f43c, transparent: true, opacity: 0.06 })
    scene.add(new THREE.LineSegments(lineGeo, lineMat))

    const mouse = { x: 0, y: 0 }
    const onMouse = e => { mouse.x = (e.clientX / innerWidth - 0.5) * 8; mouse.y = -(e.clientY / innerHeight - 0.5) * 5 }
    const onResize = () => { cam.aspect = el.clientWidth / el.clientHeight; cam.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight) }
    addEventListener('mousemove', onMouse)
    addEventListener('resize', onResize)

    let raf
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      pts.rotation.y = t * 0.015
      pts.rotation.x = t * 0.007
      cam.position.x += (mouse.x - cam.position.x) * 0.03
      cam.position.y += (mouse.y - cam.position.y) * 0.03
      cam.lookAt(scene.position)
      renderer.render(scene, cam)
    }
    animate()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('mousemove', onMouse)
      removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])
  return <div ref={ref} className={`absolute inset-0 ${className}`} />
}