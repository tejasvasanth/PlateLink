import { useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, GestureResponderEvent, PanResponder, Platform, StyleSheet, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber/native'
import { Asset } from 'expo-asset'

// 3D ring of images that slowly spins
function CarouselRing({ textures }: { textures: any[] }) {
  const groupRef = useRef<any>(null)
  const radius = 3 // world units, tuned for camera z=8

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })

  return (
    // @ts-ignore native fiber types
    <group ref={groupRef}>
      {textures.map((tex, i) => {
        const angle = (i / textures.length) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          // @ts-ignore
          <mesh key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            {/* @ts-ignore */}
            <planeGeometry args={[1.6, 1.6]} />
            {/* @ts-ignore */}
            <meshBasicMaterial map={tex} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

export default function AnalyticsScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView | null>(null)
  const [dragRotation, setDragRotation] = useState(0)
  const dragRef = useRef({ rot: 0 })

  // Resolve camera facing safely across SDK versions/platforms (native only)
  const cameraFacing = Platform.OS !== 'web' ? ('back' as const) : undefined

  // Drag gesture to control rotation
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_evt: GestureResponderEvent, gestureState) => {
          const deltaX = gestureState.dx
          dragRef.current.rot = deltaX * 0.003
          setDragRotation(dragRef.current.rot)
        },
        onPanResponderRelease: () => setDragRotation(0),
      }),
    []
  )

  useEffect(() => {
    if (!permission) return
    if (!permission.granted) {
      requestPermission()
    }
  }, [permission])

  // Solid color texture as a safe fallback if images fail to load
  function makeSolidTexture(hex: string) {
    const color = new THREE.Color(hex)
    const data = new Uint8Array([
      Math.round(color.r * 255),
      Math.round(color.g * 255),
      Math.round(color.b * 255),
      255,
    ])
    const tex = new THREE.DataTexture(data, 1, 1)
    tex.needsUpdate = true
    return tex
  }

  // Load textures from local assets (SVG). If not supported on platform, fall back to solid colors
  const textures: any[] = useMemo(() => {
    try {
      const files = [
        Asset.fromModule(require('../../assets/food/apple.svg')),
        Asset.fromModule(require('../../assets/food/banana.svg')),
        Asset.fromModule(require('../../assets/food/tomato.svg')),
        Asset.fromModule(require('../../assets/food/pear.svg')),
        Asset.fromModule(require('../../assets/food/mango.svg')),
      ]
      files.forEach((a) => a.downloadAsync?.())

      const loader = new THREE.TextureLoader()
      const texs: any[] = []
      for (const a of files) {
        if (a.localUri) {
          texs.push(loader.load(a.localUri))
        } else if (a.uri) {
          texs.push(loader.load(a.uri))
        }
      }
      if (texs.length > 0) return texs
    } catch (e) {
      // ignore and fallback
    }
    return [
      makeSolidTexture('#e74c3c'),
      makeSolidTexture('#f1c40f'),
      makeSolidTexture('#2ecc71'),
      makeSolidTexture('#3498db'),
      makeSolidTexture('#9b59b6'),
    ]
  }, [])

  if (Platform.OS === 'web') {
    // Web fallback: show the carousel on a black background (no camera)
    return (
      <View style={styles.center} {...panResponder.panHandlers}>
        {/* @ts-ignore */}
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          {/* @ts-ignore */}
          <ambientLight />
          {/* @ts-ignore */}
          <pointLight position={[10, 10, 10]} />
          {/* @ts-ignore */}
          <group rotation={[0, dragRotation, 0]}>
            <CarouselRing textures={textures} />
          </group>
        </Canvas>
      </View>
    )
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Live camera background */}
      <CameraView ref={(r) => { cameraRef.current = r }} style={StyleSheet.absoluteFill} facing={cameraFacing} />

      {/* 3D overlay */}
      {/* @ts-ignore */}
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        {/* @ts-ignore */}
        <ambientLight />
        {/* @ts-ignore */}
        <pointLight position={[10, 10, 10]} />
        {/* @ts-ignore */}
        <group rotation={[0, dragRotation, 0]}>
          <CarouselRing textures={textures} />
        </group>
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  webPlaceholder: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
})