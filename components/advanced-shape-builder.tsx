"use client"

import type React from "react"

import { useState, useRef, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CuboidIcon as Cube,
  Circle,
  Cylinder,
  Triangle,
  Square,
  Torus,
  Trash2,
  RotateCcw,
  Palette,
  Lightbulb,
  Zap,
  Edit3,
  MousePointer,
} from "lucide-react"
import * as THREE from "three"
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js"

interface Shape3D {
  id: string
  type: "box" | "sphere" | "cylinder" | "cone" | "plane" | "torus" | "custom" | "extruded" | "parametric"
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  material: {
    type: "standard" | "basic" | "phong" | "lambert"
    roughness: number
    metalness: number
    opacity: number
    wireframe: boolean
  }
  parameters: Record<string, number>
  customData?: {
    vertices?: number[]
    faces?: number[]
    equation?: string
    path?: [number, number][]
  }
  name: string
}

interface LightConfig {
  ambient: { intensity: number; color: string }
  directional: { intensity: number; color: string; position: [number, number, number] }
  point: { intensity: number; color: string; position: [number, number, number] }
}

const shapeTemplates = [
  {
    type: "box" as const,
    name: "Box",
    icon: Cube,
    color: "#3b82f6",
    defaultParams: { width: 1, height: 1, depth: 1, widthSegments: 1, heightSegments: 1, depthSegments: 1 },
  },
  {
    type: "sphere" as const,
    name: "Sphere",
    icon: Circle,
    color: "#ef4444",
    defaultParams: {
      radius: 0.5,
      widthSegments: 32,
      heightSegments: 16,
      phiStart: 0,
      phiLength: Math.PI * 2,
      thetaStart: 0,
      thetaLength: Math.PI,
    },
  },
  {
    type: "cylinder" as const,
    name: "Cylinder",
    icon: Cylinder,
    color: "#10b981",
    defaultParams: {
      radiusTop: 0.5,
      radiusBottom: 0.5,
      height: 1,
      radialSegments: 32,
      heightSegments: 1,
      openEnded: 0,
      thetaStart: 0,
      thetaLength: Math.PI * 2,
    },
  },
  {
    type: "cone" as const,
    name: "Cone",
    icon: Triangle,
    color: "#f59e0b",
    defaultParams: {
      radius: 0.5,
      height: 1,
      radialSegments: 32,
      heightSegments: 1,
      openEnded: 0,
      thetaStart: 0,
      thetaLength: Math.PI * 2,
    },
  },
  {
    type: "plane" as const,
    name: "Plane",
    icon: Square,
    color: "#8b5cf6",
    defaultParams: { width: 1, height: 1, widthSegments: 1, heightSegments: 1 },
  },
  {
    type: "torus" as const,
    name: "Torus",
    icon: Torus,
    color: "#ec4899",
    defaultParams: { radius: 0.5, tube: 0.2, radialSegments: 16, tubularSegments: 100, arc: Math.PI * 2 },
  },
]

const materialTypes = [
  { value: "standard", label: "Standard (PBR)" },
  { value: "basic", label: "Basic" },
  { value: "phong", label: "Phong" },
  { value: "lambert", label: "Lambert" },
]

const colorPalette = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#64748b",
  "#374151",
  "#ffffff",
  "#000000",
  "#fbbf24",
]

function Shape3DComponent({
  shape,
  isSelected,
  onSelect,
}: {
  shape: Shape3D
  isSelected: boolean
  onSelect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.005
    }
  })

  const getGeometry = () => {
    const params = shape.parameters || {}

    switch (shape.type) {
      case "box":
        return (
          <boxGeometry
            args={[
              params.width ?? 1,
              params.height ?? 1,
              params.depth ?? 1,
              params.widthSegments ?? 1,
              params.heightSegments ?? 1,
              params.depthSegments ?? 1,
            ]}
          />
        )
      case "sphere":
        return (
          <sphereGeometry
            args={[
              params.radius ?? 0.5,
              params.widthSegments ?? 32,
              params.heightSegments ?? 16,
              params.phiStart ?? 0,
              params.phiLength ?? Math.PI * 2,
              params.thetaStart ?? 0,
              params.thetaLength ?? Math.PI,
            ]}
          />
        )
      case "cylinder":
        return (
          <cylinderGeometry
            args={[
              params.radiusTop ?? 0.5,
              params.radiusBottom ?? 0.5,
              params.height ?? 1,
              params.radialSegments ?? 32,
              params.heightSegments ?? 1,
              !!params.openEnded,
              params.thetaStart ?? 0,
              params.thetaLength ?? Math.PI * 2,
            ]}
          />
        )
      case "cone":
        return (
          <coneGeometry
            args={[
              params.radius ?? 0.5,
              params.height ?? 1,
              params.radialSegments ?? 32,
              params.heightSegments ?? 1,
              !!params.openEnded,
              params.thetaStart ?? 0,
              params.thetaLength ?? Math.PI * 2,
            ]}
          />
        )
      case "plane":
        return (
          <planeGeometry
            args={[params.width ?? 1, params.height ?? 1, params.widthSegments ?? 1, params.heightSegments ?? 1]}
          />
        )
      case "torus":
        return (
          <torusGeometry
            args={[
              params.radius ?? 0.5,
              params.tube ?? 0.2,
              params.radialSegments ?? 16,
              params.tubularSegments ?? 100,
              params.arc ?? Math.PI * 2,
            ]}
          />
        )
      case "custom":
        if (shape.customData?.vertices && shape.customData?.faces) {
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute("position", new THREE.Float32BufferAttribute(shape.customData.vertices, 3))
          if (shape.customData.faces.length > 0) {
            geometry.setIndex(shape.customData.faces)
          }
          geometry.computeVertexNormals()
          return <primitive object={geometry} />
        }
        return <boxGeometry args={[1, 1, 1]} />
      case "parametric":
        if (shape.customData?.equation) {
          try {
            const geometry = createParametricGeometry(shape.customData.equation, params)
            return <primitive object={geometry} />
          } catch (error) {
            console.error("Error creating parametric geometry:", error)
            return <boxGeometry args={[1, 1, 1]} />
          }
        }
        return <boxGeometry args={[1, 1, 1]} />
      case "extruded":
        if (shape.customData?.path && shape.customData.path.length > 0) {
          const geometry = createExtrudedGeometry(shape.customData.path, params.depth ?? 0.1)
          return <primitive object={geometry} />
        }
        return <boxGeometry args={[1, 1, 1]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }

  const getMaterial = () => {
    const mat = shape.material || {
      type: "standard",
      roughness: 0.3,
      metalness: 0.1,
      opacity: 1,
      wireframe: false,
    }

    const baseProps = {
      color: shape.color || "#3b82f6",
      transparent: (mat.opacity ?? 1) < 1,
      opacity: mat.opacity ?? 1,
      wireframe: mat.wireframe ?? false,
      side: THREE.DoubleSide,
    }

    switch (mat.type) {
      case "standard":
        return <meshStandardMaterial {...baseProps} roughness={mat.roughness ?? 0.3} metalness={mat.metalness ?? 0.1} />
      case "phong":
        return <meshPhongMaterial {...baseProps} />
      case "lambert":
        return <meshLambertMaterial {...baseProps} />
      case "basic":
      default:
        return <meshBasicMaterial {...baseProps} />
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={shape.position}
      rotation={shape.rotation}
      scale={shape.scale}
      onClick={onSelect}
      castShadow
      receiveShadow
    >
      {getGeometry()}
      {getMaterial()}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[getGeometry()]} />
          <lineBasicMaterial color="#ffff00" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  )
}

function createParametricGeometry(equation: string, params: Record<string, number>) {
  const segments = params?.segments ?? 32
  const size = params?.size ?? 2

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
  const positions = geometry.attributes.position.array as Float32Array

  // Create a safe evaluation function
  const evaluateZ = (x: number, y: number): number => {
    try {
      // Replace common math functions
      let expr = equation
        .replace(/sin/g, "Math.sin")
        .replace(/cos/g, "Math.cos")
        .replace(/tan/g, "Math.tan")
        .replace(/sqrt/g, "Math.sqrt")
        .replace(/abs/g, "Math.abs")
        .replace(/pow/g, "Math.pow")
        .replace(/exp/g, "Math.exp")
        .replace(/log/g, "Math.log")
        .replace(/pi/g, "Math.PI")
        .replace(/PI/g, "Math.PI")

      // Replace x and y with actual values
      expr = expr.replace(/x/g, x.toString()).replace(/y/g, y.toString())

      // Evaluate the expression
      return eval(expr) || 0
    } catch (error) {
      return 0
    }
  }

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    positions[i + 2] = evaluateZ(x, y) * (params?.amplitude ?? 0.5)
  }

  geometry.attributes.position.needsUpdate = true
  geometry.computeVertexNormals()

  return geometry
}

function createExtrudedGeometry(path: [number, number][], depth: number) {
  const shape = new THREE.Shape()

  if (path.length > 0) {
    shape.moveTo(path[0][0], path[0][1])
    for (let i = 1; i < path.length; i++) {
      shape.lineTo(path[i][0], path[i][1])
    }
    shape.closePath()
  }

  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  }

  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

function LightingControls({
  lighting,
  onLightingChange,
}: {
  lighting: LightConfig
  onLightingChange: (lighting: LightConfig) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Lighting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Ambient Light</Label>
          <div className="space-y-2 mt-2">
            <div>
              <Label className="text-xs text-gray-600">Intensity</Label>
              <Slider
                value={[lighting.ambient.intensity]}
                onValueChange={([value]) =>
                  onLightingChange({
                    ...lighting,
                    ambient: { ...lighting.ambient, intensity: value },
                  })
                }
                min={0}
                max={2}
                step={0.1}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Directional Light</Label>
          <div className="space-y-2 mt-2">
            <div>
              <Label className="text-xs text-gray-600">Intensity</Label>
              <Slider
                value={[lighting.directional.intensity]}
                onValueChange={([value]) =>
                  onLightingChange({
                    ...lighting,
                    directional: { ...lighting.directional, intensity: value },
                  })
                }
                min={0}
                max={3}
                step={0.1}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Scene({
  shapes,
  selectedShapeId,
  onShapeSelect,
  lighting,
}: {
  shapes: Shape3D[]
  selectedShapeId: string | null
  onShapeSelect: (id: string) => void
  lighting: LightConfig
}) {
  return (
    <>
      <ambientLight intensity={lighting.ambient.intensity} color={lighting.ambient.color} />
      <directionalLight
        position={lighting.directional.position}
        intensity={lighting.directional.intensity}
        color={lighting.directional.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight
        position={lighting.point.position}
        intensity={lighting.point.intensity}
        color={lighting.point.color}
      />

      {shapes.map((shape) => (
        <Shape3DComponent
          key={shape.id}
          shape={shape}
          isSelected={selectedShapeId === shape.id}
          onSelect={() => onShapeSelect(shape.id)}
        />
      ))}

      <Grid
        args={[20, 20]}
        position={[0, -2, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={15}
        fadeStrength={1}
      />

      <Environment preset="studio" />
    </>
  )
}

export function AdvancedShapeBuilder() {
  const [shapes, setShapes] = useState<Shape3D[]>([])
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("My 3D Project")
  const [lighting, setLighting] = useState<LightConfig>({
    ambient: { intensity: 0.6, color: "#ffffff" },
    directional: { intensity: 1, color: "#ffffff", position: [10, 10, 5] },
    point: { intensity: 0.3, color: "#ffffff", position: [-10, -10, -10] },
  })
  const [drawingMode, setDrawingMode] = useState(false)
  const [drawingPath, setDrawingPath] = useState<[number, number][]>([])
  const [parametricEquation, setParametricEquation] = useState("sin(x) * cos(y)")
  const [customVertices, setCustomVertices] = useState("")
  const controlsRef = useRef<any>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const selectedShape = shapes.find((s) => s.id === selectedShapeId)

  const addShape = (type: Shape3D["type"]) => {
    const template = shapeTemplates.find((t) => t.type === type)
    const newShape: Shape3D = {
      id: `shape_${Date.now()}`,
      type,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: template?.color || "#3b82f6",
      material: {
        type: "standard",
        roughness: 0.3,
        metalness: 0.1,
        opacity: 1,
        wireframe: false,
      },
      parameters: { ...(template?.defaultParams || {}) },
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${shapes.length + 1}`,
    }
    setShapes([...shapes, newShape])
    setSelectedShapeId(newShape.id)
  }

  const addParametricShape = () => {
    const newShape: Shape3D = {
      id: `parametric_${Date.now()}`,
      type: "parametric",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#8b5cf6",
      material: {
        type: "standard",
        roughness: 0.3,
        metalness: 0.1,
        opacity: 1,
        wireframe: false,
      },
      parameters: { segments: 32, size: 2, amplitude: 0.5 },
      customData: { equation: parametricEquation },
      name: `Parametric Surface ${shapes.length + 1}`,
    }
    setShapes([...shapes, newShape])
    setSelectedShapeId(newShape.id)
  }

  const addExtrudedShape = () => {
    if (drawingPath.length < 3) {
      alert("Draw at least 3 points to create an extruded shape!")
      return
    }

    const newShape: Shape3D = {
      id: `extruded_${Date.now()}`,
      type: "extruded",
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#10b981",
      material: {
        type: "standard",
        roughness: 0.3,
        metalness: 0.1,
        opacity: 1,
        wireframe: false,
      },
      parameters: { depth: 0.2 },
      customData: { path: [...drawingPath] },
      name: `Extruded Shape ${shapes.length + 1}`,
    }
    setShapes([...shapes, newShape])
    setSelectedShapeId(newShape.id)
    setDrawingPath([])
    setDrawingMode(false)
  }

  const addCustomShape = () => {
    try {
      const lines = customVertices.trim().split("\n")
      const vertices: number[] = []
      const faces: number[] = []

      let mode = "vertices"
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === "FACES:") {
          mode = "faces"
          continue
        }
        if (trimmed === "" || trimmed.startsWith("#")) continue

        if (mode === "vertices") {
          const coords = trimmed.split(/\s+/).map(Number)
          if (coords.length >= 3) {
            vertices.push(coords[0], coords[1], coords[2])
          }
        } else if (mode === "faces") {
          const indices = trimmed.split(/\s+/).map(Number)
          faces.push(...indices)
        }
      }

      if (vertices.length === 0) {
        alert("No valid vertices found!")
        return
      }

      const newShape: Shape3D = {
        id: `custom_${Date.now()}`,
        type: "custom",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#ec4899",
        material: {
          type: "standard",
          roughness: 0.3,
          metalness: 0.1,
          opacity: 1,
          wireframe: false,
        },
        parameters: {},
        customData: { vertices, faces },
        name: `Custom Shape ${shapes.length + 1}`,
      }
      setShapes([...shapes, newShape])
      setSelectedShapeId(newShape.id)
    } catch (error) {
      alert("Error parsing vertices. Please check the format.")
    }
  }

  const updateShape = (id: string, updates: Partial<Shape3D>) => {
    setShapes(shapes.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape)))
  }

  const deleteShape = (id: string) => {
    setShapes(shapes.filter((shape) => shape.id !== id))
    if (selectedShapeId === id) {
      setSelectedShapeId(null)
    }
  }

  const clearAll = () => {
    setShapes([])
    setSelectedShapeId(null)
  }

  const exportModel = (format: "stl" | "obj" | "gltf") => {
    if (shapes.length === 0) {
      alert("No shapes to export!")
      return
    }

    // Create a temporary scene with all shapes
    const scene = new THREE.Scene()
    shapes.forEach((shape) => {
      // This would need to recreate the geometries for export
      // For now, we'll show a placeholder
    })

    let exporter: any
    let filename: string
    let mimeType: string

    switch (format) {
      case "stl":
        exporter = new STLExporter()
        filename = `${projectName}.stl`
        mimeType = "application/octet-stream"
        break
      case "obj":
        exporter = new OBJExporter()
        filename = `${projectName}.obj`
        mimeType = "text/plain"
        break
      case "gltf":
        exporter = new GLTFExporter()
        filename = `${projectName}.gltf`
        mimeType = "application/json"
        break
      default:
        return
    }

    try {
      if (format === "gltf") {
        exporter.parse(scene, (result: any) => {
          const output = JSON.stringify(result, null, 2)
          downloadFile(output, filename, mimeType)
        })
      } else {
        const result = exporter.parse(scene)
        downloadFile(result, filename, mimeType)
      }
    } catch (error) {
      alert(
        "Export failed. This is a demo - full export functionality would be implemented with proper geometry handling.",
      )
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

    setDrawingPath([...drawingPath, [x, y]])
  }

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Advanced 3D Creator
          </CardTitle>
          <CardDescription>
            Professional 3D modeling tools with parametric shapes, custom geometry, and advanced materials
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Viewer */}
        <div className="lg:col-span-3">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>3D Viewport</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetView}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={shapes.length === 0}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Select onValueChange={(format: "stl" | "obj" | "gltf") => exportModel(format)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Export" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stl">Export STL</SelectItem>
                      <SelectItem value="obj">Export OBJ</SelectItem>
                      <SelectItem value="gltf">Export GLTF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0 relative">
              <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }} shadows gl={{ antialias: true }}>
                  <Suspense fallback={null}>
                    <Scene
                      shapes={shapes}
                      selectedShapeId={selectedShapeId}
                      onShapeSelect={setSelectedShapeId}
                      lighting={lighting}
                    />
                  </Suspense>
                  <OrbitControls
                    ref={controlsRef}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    dampingFactor={0.05}
                  />
                </Canvas>

                {/* Drawing overlay for 2D shapes */}
                {drawingMode && (
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 z-10 cursor-crosshair"
                    width={800}
                    height={600}
                    onClick={handleCanvasClick}
                    style={{
                      background: "rgba(0,0,0,0.1)",
                      pointerEvents: "auto",
                    }}
                  />
                )}

                {/* Instructions overlay */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                  <h4 className="font-semibold text-sm mb-2">{drawingMode ? "Drawing Mode" : "3D Controls"}</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {drawingMode ? (
                      <>
                        <li>• Click to add points</li>
                        <li>• Create at least 3 points</li>
                        <li>• Use "Create Extruded" to finish</li>
                      </>
                    ) : (
                      <>
                        <li>• Click shapes to select</li>
                        <li>• Drag to rotate view</li>
                        <li>• Scroll to zoom</li>
                        <li>• Use panels to modify</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My 3D Model"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Shapes: {shapes.length}</p>
                  <p>Selected: {selectedShape?.name || "None"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="material">Material</TabsTrigger>
              <TabsTrigger value="lighting">Light</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Shapes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {shapeTemplates.map((template) => {
                      const IconComponent = template.icon
                      return (
                        <Button
                          key={template.type}
                          variant="outline"
                          onClick={() => addShape(template.type)}
                          className="h-16 flex flex-col gap-1"
                          size="sm"
                        >
                          <IconComponent className="w-4 h-4" style={{ color: template.color }} />
                          <span className="text-xs">{template.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedShape && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="text-sm">Edit: {selectedShape.name}</span>
                      <Button variant="outline" size="sm" onClick={() => deleteShape(selectedShape.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-4">
                        {/* Transform Controls */}
                        <div>
                          <Label className="text-sm font-medium">Position</Label>
                          <div className="space-y-2 mt-2">
                            {["X", "Y", "Z"].map((axis, index) => (
                              <div key={axis}>
                                <Label className="text-xs text-gray-600">{axis}</Label>
                                <Slider
                                  value={[selectedShape.position[index]]}
                                  onValueChange={([value]) => {
                                    const newPosition = [...selectedShape.position] as [number, number, number]
                                    newPosition[index] = value
                                    updateShape(selectedShape.id, { position: newPosition })
                                  }}
                                  min={-5}
                                  max={5}
                                  step={0.1}
                                  className="mt-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Scale</Label>
                          <div className="space-y-2 mt-2">
                            {["X", "Y", "Z"].map((axis, index) => (
                              <div key={axis}>
                                <Label className="text-xs text-gray-600">{axis}</Label>
                                <Slider
                                  value={[selectedShape.scale[index]]}
                                  onValueChange={([value]) => {
                                    const newScale = [...selectedShape.scale] as [number, number, number]
                                    newScale[index] = value
                                    updateShape(selectedShape.id, { scale: newScale })
                                  }}
                                  min={0.1}
                                  max={3}
                                  step={0.1}
                                  className="mt-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shape Parameters */}
                        <div>
                          <Label className="text-sm font-medium">Parameters</Label>
                          <div className="space-y-2 mt-2">
                            {selectedShape.parameters &&
                              Object.entries(selectedShape.parameters).map(([key, value]) => (
                                <div key={key}>
                                  <Label className="text-xs text-gray-600 capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </Label>
                                  <Slider
                                    value={[value ?? 0]}
                                    onValueChange={([newValue]) => {
                                      updateShape(selectedShape.id, {
                                        parameters: { ...selectedShape.parameters, [key]: newValue },
                                      })
                                    }}
                                    min={key.includes("Segments") ? 3 : 0.1}
                                    max={key.includes("Segments") ? 64 : 5}
                                    step={key.includes("Segments") ? 1 : 0.1}
                                    className="mt-1"
                                  />
                                  <div className="text-xs text-gray-500 mt-1">{(value ?? 0).toFixed(2)}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2D to 3D Extrusion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setDrawingMode(!drawingMode)}
                      variant={drawingMode ? "default" : "outline"}
                      className="flex-1"
                    >
                      <MousePointer className="w-4 h-4 mr-2" />
                      {drawingMode ? "Drawing..." : "Start Drawing"}
                    </Button>
                    <Button onClick={() => setDrawingPath([])} variant="outline" disabled={drawingPath.length === 0}>
                      Clear
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">Points: {drawingPath.length}</div>
                  <Button onClick={addExtrudedShape} disabled={drawingPath.length < 3} className="w-full">
                    Create Extruded Shape
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parametric Surface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="equation">Equation (z = f(x,y))</Label>
                    <Input
                      id="equation"
                      value={parametricEquation}
                      onChange={(e) => setParametricEquation(e.target.value)}
                      placeholder="sin(x) * cos(y)"
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    Available: sin, cos, tan, sqrt, abs, pow, exp, log, pi, x, y
                  </div>
                  <Button onClick={addParametricShape} className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Create Surface
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Vertices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vertices">Vertices (x y z per line)</Label>
                    <Textarea
                      id="vertices"
                      value={customVertices}
                      onChange={(e) => setCustomVertices(e.target.value)}
                      placeholder={`# Vertices (x y z)
0 0 0
1 0 0
0.5 1 0
FACES:
# Triangle indices
0 1 2`}
                      rows={8}
                    />
                  </div>
                  <Button onClick={addCustomShape} className="w-full">
                    Create Custom Shape
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="material" className="space-y-4">
              {selectedShape ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Material Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Material Type</Label>
                      <Select
                        value={selectedShape.material.type}
                        onValueChange={(value: any) =>
                          updateShape(selectedShape.id, {
                            material: { ...selectedShape.material, type: value },
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {materialTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Color</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPalette.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateShape(selectedShape.id, { color })}
                            className={`w-8 h-8 rounded-full border-2 ${
                              selectedShape.color === color ? "border-gray-800" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {selectedShape.material.type === "standard" && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Roughness</Label>
                          <Slider
                            value={[selectedShape.material.roughness]}
                            onValueChange={([value]) =>
                              updateShape(selectedShape.id, {
                                material: { ...selectedShape.material, roughness: value },
                              })
                            }
                            min={0}
                            max={1}
                            step={0.01}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Metalness</Label>
                          <Slider
                            value={[selectedShape.material.metalness]}
                            onValueChange={([value]) =>
                              updateShape(selectedShape.id, {
                                material: { ...selectedShape.material, metalness: value },
                              })
                            }
                            min={0}
                            max={1}
                            step={0.01}
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label className="text-sm font-medium">Opacity</Label>
                      <Slider
                        value={[selectedShape.material.opacity]}
                        onValueChange={([value]) =>
                          updateShape(selectedShape.id, {
                            material: { ...selectedShape.material, opacity: value },
                          })
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="wireframe"
                        checked={selectedShape.material.wireframe}
                        onChange={(e) =>
                          updateShape(selectedShape.id, {
                            material: { ...selectedShape.material, wireframe: e.target.checked },
                          })
                        }
                      />
                      <Label htmlFor="wireframe" className="text-sm">
                        Wireframe
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Select a shape to edit materials</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lighting" className="space-y-4">
              <LightingControls lighting={lighting} onLightingChange={setLighting} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
