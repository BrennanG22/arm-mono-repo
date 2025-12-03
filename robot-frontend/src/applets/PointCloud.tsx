import { Canvas, } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";


export interface PointCloudProps {
  points: [number, number, number][];
  currentPoint?: [number, number, number];
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

function Box() {
  return (
    <mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 0, 1)]} />
        <lineBasicMaterial color="blue" />
      </lineSegments>
    </mesh>
  );
}

export default function PointCloud({ points, currentPoint }: PointCloudProps) {
  return (
    <Canvas camera={{ position: [4, 4, 4], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      <OrbitControls makeDefault />

      <gridHelper args={[10, 10]} position={[0, -0.01, 0]} />
      <axesHelper args={[5]} />

      <Points points={points} />
      <mesh position={[1, 0, 1]}>
        <Box />
      </mesh>


      {currentPoint && <CurrentPoint point={currentPoint} />}
    </Canvas>
  );
}