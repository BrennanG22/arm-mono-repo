import { Canvas, useFrame, useThree, } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useState } from "react";
import React from "react";


export interface PointCloudProps {
  points: [number, number, number][];
  currentPoint?: [number, number, number];
}



function MouseXZRayPoint() {
  const { camera, gl } = useThree();

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);

  const [pos, setPos] = useState<[number, number, number] | null>(null);

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    gl.domElement.addEventListener("pointermove", onMove);
    return () => gl.domElement.removeEventListener("pointermove", onMove);
  }, [gl, mouse]);

  // Raycast each frame
  useFrame(() => {
    raycaster.setFromCamera(mouse, camera);

    const intersection = raycaster.ray.intersectPlane(plane, hitPoint);

    if (intersection) {
      setPos([intersection.x, intersection.y, intersection.z]);
    }
  });

  if (!pos) return null;

  return (
    <mesh position={pos}>
      {(-5 < pos[0]) && (pos[0] < 5) && (-5 < pos[2]) && (pos[2] < 5) && <sphereGeometry args={[0.08, 16, 16]} />}
      <meshStandardMaterial color="yellow" />
    </mesh>
  );
}


function Points({ points }: PointCloudProps) {
  const reordered = points.map(([x, y, z]) => [x, z, y]);
  const positions = new Float32Array(reordered.flat());

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial size={0.06} color="white" sizeAttenuation />
    </points>
  );
}

function CurrentPoint({ point }: { point: [number, number, number] }) {
  const [x, y, z] = point;
  return (
    <mesh position={[x, z, y]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

function BoundingBox() {
  const boxWidth = 1;
  const boxHeight = 1;
  return (
    <mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(boxWidth, 0, boxHeight)]} />
        <lineBasicMaterial color="blue" />
      </lineSegments>
      <Text color={"blue"} rotation={[3 * Math.PI / 2, 0, 0]} 
        fontSize={boxWidth /3.5} 
        position={[-boxWidth / 2 + (0.4*boxWidth), 0, -boxHeight / 2 + (0.2*boxHeight)]
      }>
        Box 1
      </Text>
    </mesh>
  );
}

export default function PointCloud({ points, currentPoint }: PointCloudProps) {
  return (
    <Canvas camera={{ position: [4, 4, 4], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      <OrbitControls enablePan={false} />

      <gridHelper args={[10, 10]} position={[0, -0.01, 0]} />
      <axesHelper args={[5]} />

      <Points points={points} />
      <mesh position={[1, 0, 1]}>
        <BoundingBox />
      </mesh>
      <mesh>

        <meshStandardMaterial color="green" />
      </mesh>
      <MouseXZRayPoint />
      {currentPoint && <CurrentPoint point={currentPoint} />}
    </Canvas>
  );
}