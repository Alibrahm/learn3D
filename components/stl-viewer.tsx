"use client"

import { useRef, useEffect, useState, Suspense, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Grid } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import type { Mesh, BufferGeometry } from "three"
import { Button } from "@/components/ui/button" // Assuming this is from shadcn/ui
import { RotateCcw, Move3D, ZoomIn, ZoomOut } from "lucide-react"
import * as THREE from "three"
import { Vector3 } from "three"

// Props for the model component, including a callback to pass data up
interface STLModelProps {
  url: string;
  onInitialViewComputed: (position: Vector3) => void;
}

// Props for the main viewer component
interface STLViewerProps {
  modelUrl: string | null;
}

/**
 * Renders the STL model and handles its loading and initial camera positioning.
 * It now communicates the ideal initial camera position back to its parent.
 */
function STLModel({ url, onInitialViewComputed }: STLModelProps) {
  const meshRef = useRef<Mesh>(null);
  const { camera, controls } = useThree();
  const [isRotating, setIsRotating] = useState(false);
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

  // Effect for loading and parsing the STL file
  useEffect(() => {
    if (!url) {
      setGeometry(null);
      return;
    }

    const loader = new STLLoader();
    const fileLoader = new THREE.FileLoader();
    fileLoader.setResponseType('arraybuffer');

    fileLoader.load(
      url,
      (fileBuffer) => {
        // Robust parsing logic to handle both binary and ASCII STL files
        try {
          const loadedGeometry = loader.parse(fileBuffer as ArrayBuffer);
          setGeometry(loadedGeometry);
          console.log("Successfully parsed with standard method.");
        } catch (error) {
          console.warn("Standard STL parsing failed, attempting fallback.", error);
          try {
            const decoder = new TextDecoder('utf-8');
            const beginning = decoder.decode((fileBuffer as ArrayBuffer).slice(0, 5)).toLowerCase();
            if (beginning === 'solid') {
              console.log("Detected ASCII file, re-parsing as text.");
              const fileText = decoder.decode(fileBuffer as ArrayBuffer);
              const asciiGeometry = (loader as any).parseASCII(fileText);
              setGeometry(asciiGeometry);
            } else {
              throw new Error("File does not appear to be a valid ASCII STL, and binary parsing failed.");
            }
          } catch (fallbackError) {
            console.error("STL parsing fallback also failed:", fallbackError);
            setGeometry(null);
          }
        }
      },
      (progress) => {
        console.log("Loading progress:", (progress.loaded / progress.total) * 100 + "%");
      },
      (error) => {
        console.error("Error loading STL file from server:", error);
        setGeometry(null);
      }
    );
  }, [url]);

  // Effect for positioning the camera once the model's geometry is ready
  useEffect(() => {
    if (geometry) {
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();

      if (geometry.boundingBox) {
        const center = new Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        const size = new Vector3();
        geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Calculate the ideal camera position to frame the model
        const distance = maxDim * 2;
        const initialPosition = new Vector3(distance, distance, distance);
        
        // Set the initial camera position
        camera.position.copy(initialPosition);
        
        // Pass the calculated position up to the parent for the reset button
        onInitialViewComputed(initialPosition);
        
        if (controls) {
          //@ts-ignore
          controls.target.set(0, 0, 0);
          //@ts-ignore
          controls.update();
        } else {
          camera.lookAt(0, 0, 0);
        }
        camera.updateProjectionMatrix();
      }
    }
  }, [geometry, camera, controls, onInitialViewComputed]);

  // Animation frame loop for auto-rotation
  useFrame(() => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (!geometry) {
    return null; // Suspense will handle the loading state
  }

  return (
    <mesh ref={meshRef} geometry={geometry} onClick={() => setIsRotating(!isRotating)} castShadow receiveShadow>
      <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Fallback component while the model is loading
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
        <p className="text-sm">Loading 3D model...</p>
      </div>
    </div>
  );
}

// Fallback component if there's an error loading the model
function ErrorFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-red-500">
        <Move3D className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Error Loading Model</p>
        <p className="text-sm">Please check your STL file and try again.</p>
      </div>
    </div>
  );
}

/**
 * The main STL viewer component that orchestrates the scene, controls, and UI.
 */
export function STLViewer({ modelUrl }: STLViewerProps) {
  //@ts-ignore
  const controlsRef = useRef<any>();
  const [error, setError] = useState(false);
  // State to hold the calculated initial camera position for the current model
  const [initialCameraPosition, setInitialCameraPosition] = useState(new Vector3(5, 5, 5));

  // A memoized callback to receive the initial position from the child component
  const handleInitialViewComputed = useCallback((position: Vector3) => {
    setInitialCameraPosition(position);
  }, []);

  // Smarter reset function that uses the calculated initial position
  const resetView = () => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      // Use the dynamically calculated initial position
      controls.object.position.copy(initialCameraPosition);
      controls.object.zoom = 1;
      controls.object.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  const zoom = (factor: number) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.object.zoom *= factor;
      controls.object.updateProjectionMatrix();
      controls.update();
    }
  };

  if (error) {
    return (
      <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
        <ErrorFallback />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden shadow-inner">
      {modelUrl ? (
        <>
          <Canvas
            shadows
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            camera={{ fov: 50, near: 0.1, far: 2000 }} // Increased far plane for large models
            onError={() => setError(true)}
          >
            <ambientLight intensity={0.7} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1.5}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />

            <Suspense fallback={<LoadingFallback />}>
              <STLModel url={modelUrl} onInitialViewComputed={handleInitialViewComputed} />
            </Suspense>

            <Grid
              infiniteGrid
              position={[0, -2, 0]}
              cellSize={0.6}
              cellThickness={0.6}
              cellColor="#6b7280"
              sectionSize={3}
              sectionThickness={1.5}
              sectionColor="#374151"
              fadeDistance={50}
              fadeStrength={1.5}
            />

            <Environment preset="studio" />
            
            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              dampingFactor={0.05}
              minDistance={0.1} // Allow closer zoom
              maxDistance={1000} // Allow zooming further out
            />
          </Canvas>

          {/* Control Panel */}
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200">
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={resetView} className="bg-white text-gray-700 hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => zoom(1.2)} className="bg-white text-gray-700 hover:bg-gray-50">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => zoom(1 / 1.2)} className="bg-white text-gray-700 hover:bg-gray-50">
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs md:max-w-md w-full border border-gray-200">
            <h4 className="font-semibold text-sm mb-2 text-center">Controls</h4>
            <ul className="text-xs text-gray-600 space-y-1 text-center">
              <li><b>Rotate:</b> Left-click + Drag</li>
              <li><b>Pan:</b> Right-click + Drag</li>
              <li><b>Zoom:</b> Scroll wheel</li>
              <li><b>Toggle Auto-Rotate:</b> Click on model</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Move3D className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Model Loaded</p>
            <p className="text-sm">Please provide a model URL to begin.</p>
          </div>
        </div>
      )}
    </div>
  );
}
