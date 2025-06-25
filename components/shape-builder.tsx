"use client"

import { useState, useRef, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CuboidIcon as Cube, Circle, Triangle, Cylinder, Trash2, Save, Eye, Move3D, RotateCcw } from "lucide-react"
import type * as THREE from "three"

interface Shape3D {
  id: string
  type: "cube" | "sphere" | "cylinder" | "cone" | "pyramid"
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  name: string
}

interface ShapeBuilderProps {
  onSaveProject: (shapes: Shape3D[], name: string) => void
}

const shapeTemplates = [
  { type: "cube" as const, name: "Cube", icon: Cube, color: "#3b82f6" },
  { type: "sphere" as const, name: "Sphere", icon: Circle, color: "#ef4444" },
  { type: "cylinder" as const, name: "Cylinder", icon: Cylinder, color: "#10b981" },
  { type: "cone" as const, name: "Cone", icon: Triangle, color: "#f59e0b" },
  { type: "pyramid" as const, name: "Pyramid", icon: Triangle, color: "#8b5cf6" },
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
      meshRef.current.rotation.y += 0.01
    }
  })

  if (!shape) return null

  const getGeometry = () => {
    switch (shape.type) {
      case "cube":
        return <boxGeometry args={[1, 1, 1]} />
      case "sphere":
        return <sphereGeometry args={[0.5, 32, 32]} />
      case "cylinder":
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
      case "cone":
        return <coneGeometry args={[0.5, 1, 32]} />
      case "pyramid":
        return <coneGeometry args={[0.5, 1, 4]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={shape.position || [0, 0, 0]}
      rotation={shape.rotation || [0, 0, 0]}
      scale={shape.scale || [1, 1, 1]}
      onClick={onSelect}
      castShadow
      receiveShadow
    >
      {getGeometry()}
      <meshStandardMaterial
        color={shape.color || "#3b82f6"}
        roughness={0.3}
        metalness={0.1}
        emissive={isSelected ? shape.color || "#3b82f6" : "#000000"}
        emissiveIntensity={isSelected ? 0.1 : 0}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[getGeometry().args as any]} />
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  )
}

function Scene({
  shapes,
  selectedShapeId,
  onShapeSelect,
}: {
  shapes: Shape3D[]
  selectedShapeId: string | null
  onShapeSelect: (id: string) => void
}) {
  const safeShapes = shapes || []

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />

      {safeShapes.map((shape) => {
        if (!shape || !shape.id) return null
        return (
          <Shape3DComponent
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeId === shape.id}
            onSelect={() => onShapeSelect(shape.id)}
          />
        )
      })}

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

export function ShapeBuilder({ onSaveProject }: ShapeBuilderProps) {
  const [shapes, setShapes] = useState<Shape3D[]>([])
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("My 3D Creation")
  const controlsRef = useRef<any>()

  const selectedShape = shapes?.find((s) => s?.id === selectedShapeId) || null

  const addShape = (type: Shape3D["type"]) => {
    try {
      const newShape: Shape3D = {
        id: `shape_${Date.now()}`,
        type,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${(shapes?.length || 0) + 1}`,
      }
      setShapes((prev) => [...(prev || []), newShape])
      setSelectedShapeId(newShape.id)
    } catch (error) {
      console.error("Error adding shape:", error)
    }
  }

  const updateShape = (id: string, updates: Partial<Shape3D>) => {
    if (!id || !updates) return

    try {
      setShapes((prev) =>
        (prev || []).map((shape) => {
          if (!shape || shape.id !== id) return shape
          return { ...shape, ...updates }
        }),
      )
    } catch (error) {
      console.error("Error updating shape:", error)
    }
  }

  const deleteShape = (id: string) => {
    if (!id) return

    try {
      setShapes((prev) => (prev || []).filter((shape) => shape?.id !== id))
      if (selectedShapeId === id) {
        setSelectedShapeId(null)
      }
    } catch (error) {
      console.error("Error deleting shape:", error)
    }
  }

  const clearAll = () => {
    try {
      setShapes([])
      setSelectedShapeId(null)
    } catch (error) {
      console.error("Error clearing shapes:", error)
    }
  }

  const saveProject = () => {
    try {
      if (!shapes || shapes.length === 0) {
        alert("Add some shapes first! 🎨")
        return
      }
      if (onSaveProject) {
        onSaveProject(shapes, projectName || "Untitled Project")
        alert(`"${projectName}" saved successfully! 🎉`)
      }
    } catch (error) {
      console.error("Error saving project:", error)
      alert("Error saving project. Please try again.")
    }
  }

  const resetView = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    } catch (error) {
      console.error("Error resetting view:", error)
    }
  }

  const quickShapeProjects = [
    {
      name: "Simple House 🏠",
      shapes: [
        {
          id: "house_base",
          type: "cube" as const,
          position: [0, -0.5, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [2, 1, 1.5] as [number, number, number],
          color: "#8b5cf6",
          name: "House Base",
        },
        {
          id: "house_roof",
          type: "pyramid" as const,
          position: [0, 0.5, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [2.2, 0.8, 1.7] as [number, number, number],
          color: "#ef4444",
          name: "Roof",
        },
      ],
    },
    {
      name: "Robot Friend 🤖",
      shapes: [
        {
          id: "robot_body",
          type: "cube" as const,
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1.5, 0.8] as [number, number, number],
          color: "#3b82f6",
          name: "Body",
        },
        {
          id: "robot_head",
          type: "cube" as const,
          position: [0, 1.2, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [0.8, 0.8, 0.8] as [number, number, number],
          color: "#10b981",
          name: "Head",
        },
        {
          id: "robot_antenna",
          type: "cylinder" as const,
          position: [0, 1.8, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [0.1, 0.5, 0.1] as [number, number, number],
          color: "#f59e0b",
          name: "Antenna",
        },
      ],
    },
    {
      name: "Ice Cream 🍦",
      shapes: [
        {
          id: "cone_base",
          type: "cone" as const,
          position: [0, -0.5, 0] as [number, number, number],
          rotation: [Math.PI, 0, 0] as [number, number, number],
          scale: [0.6, 1.2, 0.6] as [number, number, number],
          color: "#f59e0b",
          name: "Cone",
        },
        {
          id: "ice_cream",
          type: "sphere" as const,
          position: [0, 0.3, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [0.8, 0.8, 0.8] as [number, number, number],
          color: "#ec4899",
          name: "Ice Cream",
        },
      ],
    },
  ]

  const loadQuickProject = (project: (typeof quickShapeProjects)[0]) => {
    try {
      if (project && project.shapes) {
        setShapes(project.shapes)
        setProjectName(project.name || "Quick Project")
        setSelectedShapeId(null)
      }
    } catch (error) {
      console.error("Error loading quick project:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move3D className="w-5 h-5" />
            3D Shape Builder
          </CardTitle>
          <CardDescription>
            Create your own 3D objects by combining basic shapes! Click shapes to select and modify them.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Viewer */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your 3D Creation</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetView}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={(shapes?.length || 0) === 0}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button onClick={saveProject} disabled={(shapes?.length || 0) === 0}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
                {shapes && shapes.length > 0 ? (
                  <Canvas camera={{ position: [5, 5, 5], fov: 50 }} shadows gl={{ antialias: true }}>
                    <Suspense fallback={null}>
                      <Scene shapes={shapes} selectedShapeId={selectedShapeId} onShapeSelect={setSelectedShapeId} />
                    </Suspense>
                    <OrbitControls
                      ref={controlsRef}
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      dampingFactor={0.05}
                    />
                  </Canvas>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Move3D className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Start Creating!</p>
                      <p className="text-sm">Add shapes from the panel to begin building</p>
                    </div>
                  </div>
                )}

                {/* Instructions overlay */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                  <h4 className="font-semibold text-sm mb-2">Controls:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Click shapes to select them</li>
                    <li>• Drag to rotate view</li>
                    <li>• Scroll to zoom</li>
                    <li>• Use panel to modify shapes</li>
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
              <CardTitle className="text-lg">Project Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <input
                    id="project-name"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value || "Untitled Project")}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="My Amazing Creation"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Shapes: {shapes?.length || 0}</p>
                  <p>Selected: {selectedShape?.name || "None"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="add" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="add">Add</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="quick">Quick</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Shapes</CardTitle>
                  <CardDescription>Click to add basic shapes to your scene</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {shapeTemplates.map((template) => {
                      const IconComponent = template.icon
                      return (
                        <Button
                          key={template.type}
                          variant="outline"
                          onClick={() => addShape(template.type)}
                          className="h-20 flex flex-col gap-2"
                        >
                          <IconComponent className="w-6 h-6" style={{ color: template.color }} />
                          <span className="text-sm">{template.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              {selectedShape ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="text-sm">Edit: {selectedShape.name}</span>
                      <Button variant="outline" size="sm" onClick={() => deleteShape(selectedShape.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-4">
                        {/* Position Controls */}
                        <div>
                          <Label className="text-sm font-medium">Position</Label>
                          <div className="space-y-2 mt-2">
                            {["X", "Y", "Z"].map((axis, index) => (
                              <div key={axis}>
                                <Label className="text-xs text-gray-600">{axis} (Left/Right)</Label>
                                <Slider
                                  value={[selectedShape.position?.[index] || 0]}
                                  onValueChange={([value]) => {
                                    const newPosition = [...(selectedShape.position || [0, 0, 0])] as [
                                      number,
                                      number,
                                      number,
                                    ]
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
                                  value={[selectedShape.scale?.[index] || 1]}
                                  onValueChange={([value]) => {
                                    const newScale = [...(selectedShape.scale || [1, 1, 1])] as [number, number, number]
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

                        {/* Color Picker */}
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
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Click a shape in the 3D view to edit it</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="quick" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Start Projects</CardTitle>
                  <CardDescription>Load pre-made projects to get started quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quickShapeProjects.map((project) => (
                      <Button
                        key={project.name}
                        variant="outline"
                        onClick={() => loadQuickProject(project)}
                        className="w-full justify-start h-auto p-4"
                      >
                        <div className="text-left">
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-gray-600">{project.shapes?.length || 0} shapes</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Shape List */}
          {shapes && shapes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Shapes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {shapes.map((shape) => {
                      if (!shape || !shape.id) return null
                      return (
                        <div
                          key={shape.id}
                          className={`p-2 rounded border cursor-pointer transition-colors ${
                            selectedShapeId === shape.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedShapeId(shape.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: shape.color }} />
                              <span className="text-sm font-medium">{shape.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {shape.type}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
