import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleField({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x12100d, 42, 180)

    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 240)
    camera.position.set(0, 0, 82)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x12100d, 0)
    el.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const count = 1400
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    const palette = [
      new THREE.Color(0xeee7d6),
      new THREE.Color(0xb8ad99),
      new THREE.Color(0x8fd47a),
      new THREE.Color(0x7f7463),
    ]

    for (let i = 0; i < count; i++) {
      const layer = Math.random()
      const radius = 34 + layer * 72
      const theta = Math.random() * Math.PI * 2
      const band = (Math.random() - 0.5) * 42
      positions[i * 3] = Math.cos(theta) * radius + (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = band
      positions[i * 3 + 2] = Math.sin(theta) * radius - layer * 84

      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      sizes[i] = 0.45 + Math.random() * 1.15
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      uniforms: { opacity: { value: 0.72 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (88.0 / max(12.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float edge = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, edge * opacity);
        }
      `,
    })

    const particles = new THREE.Points(geometry, material)
    group.add(particles)

    const ringMat = new THREE.LineBasicMaterial({ color: 0x3a3429, transparent: true, opacity: 0.34 })
    const rings = new THREE.Group()
    ;[28, 48, 72].forEach((radius, idx) => {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.34, 0, Math.PI * 2, false, 0)
      const pts = curve.getPoints(128).map(p => new THREE.Vector3(p.x, p.y, -idx * 28))
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const line = new THREE.LineLoop(geo, ringMat)
      line.rotation.x = -0.18
      rings.add(line)
    })
    group.add(rings)

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMouse = e => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 10
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 8
    }

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('resize', onResize)

    let raf
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      mouse.x += (mouse.tx - mouse.x) * 0.045
      mouse.y += (mouse.ty - mouse.y) * 0.045
      camera.position.x += (mouse.x - camera.position.x) * 0.03
      camera.position.y += (mouse.y - camera.position.y) * 0.03
      camera.lookAt(0, 0, -22)

      group.rotation.y = t * 0.018
      group.rotation.x = Math.sin(t * 0.25) * 0.025
      rings.rotation.z = -t * 0.012

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      ringMat.dispose()
      rings.children.forEach(child => child.geometry.dispose())
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={ref} className={`absolute inset-0 ${className}`} />
}
