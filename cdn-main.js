// 使用CDN直接加载Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Sky } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

// 场景设置
console.log("正在初始化场景...");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建简单的地面
const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x3d673c, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// 创建简单飞机
const airplaneGroup = new THREE.Group();
scene.add(airplaneGroup);

const fuselageGeometry = new THREE.BoxGeometry(2, 2, 10);
const fuselageMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });
const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
airplaneGroup.add(fuselage);

const wingGeometry = new THREE.BoxGeometry(15, 0.5, 3);
const wing = new THREE.Mesh(wingGeometry, fuselageMaterial);
wing.position.y = 0.5;
airplaneGroup.add(wing);

// 设置相机位置
camera.position.set(0, 15, 30);
camera.lookAt(airplaneGroup.position);

// 简单键盘控制
const keys = {};
document.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

// 飞行控制
const speed = {
  forward: 0,
  rotation: 0,
  maxSpeed: 1
};

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  // 飞机旋转
  if (keys['a']) {
    airplaneGroup.rotation.y += 0.02;
  } else if (keys['d']) {
    airplaneGroup.rotation.y -= 0.02;
  }
  
  // 飞机前进
  if (keys['w']) {
    speed.forward = speed.maxSpeed;
  } else if (keys['s']) {
    speed.forward = -speed.maxSpeed / 2;
  } else {
    speed.forward = 0;
  }
  
  // 移动飞机
  if (speed.forward !== 0) {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(airplaneGroup.quaternion);
    airplaneGroup.position.add(direction.multiplyScalar(speed.forward));
  }
  
  // 更新信息显示
  document.getElementById('info').innerHTML = `3D飞行模拟器<br>位置: x=${Math.round(airplaneGroup.position.x)}, y=${Math.round(airplaneGroup.position.y)}, z=${Math.round(airplaneGroup.position.z)}`;
  
  // 更新相机位置
  const cameraOffset = new THREE.Vector3(0, 10, 30);
  cameraOffset.applyQuaternion(airplaneGroup.quaternion);
  camera.position.copy(airplaneGroup.position).add(cameraOffset);
  camera.lookAt(airplaneGroup.position);
  
  renderer.render(scene, camera);
}

document.getElementById('loading').style.display = 'none';
animate();
console.log("场景初始化完成");
