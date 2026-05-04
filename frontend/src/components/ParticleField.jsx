import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleField({ className = '' }) {
  const ref = useRef(null)
  
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight
    const scene = new THREE.Scene()
    
    // Add FogExp2 for depth and physical atmosphere
    scene.fog = new THREE.FogExp2(0x0A0A0B, 0.008)

    const cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 300)
    cam.position.z = 80
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x0A0A0B, 0) // transparent, carbon base
    el.appendChild(renderer.domElement)

    // Particle cloud — subtle dust/stars in quartz/flint tones
    const N = 2500
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const sizes = new Float32Array(N)
    
    const palette = [
      [0.957, 0.957, 0.961], // quartz #F4F4F5
      [0.631, 0.631, 0.667], // slate #A1A1AA
      [0.443, 0.443, 0.478], // flint #71717A
    ]
    
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 250
      pos[i*3+1] = (Math.random() - 0.5) * 150
      pos[i*3+2] = (Math.random() - 0.5) * 200
      
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2]
      sizes[i] = Math.random() * 0.4 + 0.1
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3))
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1))
    
    // Custom shader for varying particle sizes and round shapes
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * 0.6;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    
    const pts = new THREE.Points(geo, mat)
    scene.add(pts)

    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
    const onMouse = e => { 
      mouse.targetX = (e.clientX / innerWidth - 0.5) * 12
      mouse.targetY = -(e.clientY / innerHeight - 0.5) * 12
    }
    const onResize = () => { 
      cam.aspect = el.clientWidth / el.clientHeight
      cam.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight) 
    }
    
    addEventListener('mousemove', onMouse)
    addEventListener('resize', onResize)

    let raf
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      
      // Organic drift
      pts.rotation.y = t * 0.005
      pts.rotation.x = t * 0.002
      
      // Spring physics for parallax mouse movement
      mouse.x += (mouse.targetX - mouse.x) * 0.05
      mouse.y += (mouse.targetY - mouse.y) * 0.05
      
      cam.position.x += (mouse.x - cam.position.x) * 0.02
      cam.position.y += (mouse.y - cam.position.y) * 0.02
      cam.lookAt(scene.position)
      
      renderer.render(scene, cam)
    }
    animate()
    
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('mousemove', onMouse)
      removeEventListener('resize', onResize)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])
  
  return <div ref={ref} className={`absolute inset-0 ${className}`} />
}