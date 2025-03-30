import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 添加在文件起始位置，import之后
console.log('加载3D飞行模拟器...');

// 错误处理函数
function handleErrors() {
  window.addEventListener('error', function(event) {
    console.error('捕获到错误:', event.message);
    document.body.innerHTML += `<div style="position:fixed; bottom:10px; right:10px; background:red; color:white; padding:10px; z-index:1000">
      错误: ${event.message}
    </div>`;
  });
}

// 调用错误处理函数
handleErrors();

// 场景设置
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 淡蓝色背景

// 启用调试信息
console.log('初始化3D场景...');

// 修改相机设置
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 15000);
camera.position.set(0, 50, 100); // 调整相机初始位置
camera.lookAt(0, 0, 0);

// 渲染器设置
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true, // 启用透明背景
  powerPreference: "high-performance" // 要求高性能
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

console.log('渲染器初始化完成');

// 天空设置
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

// 太阳位置
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(90 - 45); // 调整太阳高度
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);

// 添加光源
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8); // 降低光照强度
sunLight.position.set(sun.x * 100, sun.y * 100, sun.z * 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // 降低环境光强度
scene.add(ambientLight);

// 创建地形
const terrainSize = 10000;
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 100, 100);
// 修改地形材质，使用更显眼的颜色
const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a8f3c, // 更鲜艳的绿色
    side: THREE.DoubleSide,
    flatShading: true,
    metalness: 0.1,
    roughness: 0.8,
    emissive: 0x072c10, // 添加一些自发光
    emissiveIntensity: 0.2
});

// 随机地形高度 - 增加高度变化使其更明显
const vertices = terrainGeometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
    if (i % 3 === 1) { // 只修改y坐标
        vertices[i] = Math.random() * 400 - 100; // 增加高度变化范围
    }
}
terrainGeometry.computeVertexNormals();

const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// 创建更精致的飞机模型
function createDetailedAirplane() {
  // 创建飞机组
  const airplaneGroup = new THREE.Group();
  
  // 创建机身 - 使用参数化曲面
  const fuselageLength = 10;
  const fuselageRadius = 1;
  
  // 机身主体 - 使用更复杂的几何体
  const fuselageGeometry = new THREE.CapsuleGeometry(fuselageRadius, fuselageLength - 2*fuselageRadius, 20, 20);
  const fuselageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf0f0f0,
    metalness: 0.2,
    roughness: 0.4
  });
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
  fuselage.rotation.z = Math.PI / 2; // 调整方向
  airplaneGroup.add(fuselage);
  
  // 机身前部 - 机头
  const noseGeometry = new THREE.ConeGeometry(fuselageRadius, 2, 20);
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.3
  });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.rotation.z = -Math.PI / 2; // 调整方向
  nose.position.set(fuselageLength/2, 0, 0);
  airplaneGroup.add(nose);
  
  // 驾驶舱
  const cockpitGeometry = new THREE.SphereGeometry(fuselageRadius * 0.9, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const cockpitMaterial = new THREE.MeshStandardMaterial({
    color: 0x87ceeb,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7
  });
  const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
  cockpit.position.set(fuselageLength/6, fuselageRadius * 0.8, 0);
  airplaneGroup.add(cockpit);
  
  // 主翼
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(6, -0.8);
  wingShape.lineTo(7, -1);
  wingShape.lineTo(7, -1.2);
  wingShape.lineTo(6, -1.4);
  wingShape.lineTo(0, -1);
  wingShape.lineTo(0, 0);
  
  const wingExtrudeSettings = {
    steps: 1,
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 3
  };
  
  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2060a0,
    metalness: 0.2,
    roughness: 0.4
  });
  
  // 左翼
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(0, 0, 0.1);
  airplaneGroup.add(leftWing);
  
  // 右翼
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(0, 0, -0.1 - wingExtrudeSettings.depth);
  rightWing.rotation.y = Math.PI; // 翻转
  rightWing.scale.z = -1; // 镜像
  airplaneGroup.add(rightWing);
  
  // 水平尾翼
  const tailWingGeometry = new THREE.BoxGeometry(1.5, 0.2, 4);
  const tailWingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2060a0,
    metalness: 0.2,
    roughness: 0.4
  });
  const tailWing = new THREE.Mesh(tailWingGeometry, tailWingMaterial);
  tailWing.position.set(-fuselageLength/2, 0.8, 0);
  airplaneGroup.add(tailWing);
  
  // 垂直尾翼
  const verticalTailShape = new THREE.Shape();
  verticalTailShape.moveTo(0, 0);
  verticalTailShape.lineTo(-1.5, 0);
  verticalTailShape.lineTo(-1, 1.5);
  verticalTailShape.lineTo(0, 2);
  verticalTailShape.lineTo(0, 0);
  
  const verticalTailGeometry = new THREE.ExtrudeGeometry(verticalTailShape, {
    steps: 1,
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  });
  const verticalTailMaterial = new THREE.MeshStandardMaterial({
    color: 0x2060a0,
    metalness: 0.2,
    roughness: 0.4
  });
  const verticalTail = new THREE.Mesh(verticalTailGeometry, verticalTailMaterial);
  verticalTail.rotation.y = Math.PI / 2;
  verticalTail.position.set(-fuselageLength/2, 0.9, 0.05);
  airplaneGroup.add(verticalTail);
  
  // 引擎/螺旋桨
  const engineGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1, 12);
  const engineMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // 左引擎
  const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
  leftEngine.rotation.z = Math.PI / 2;
  leftEngine.position.set(1, -0.9, 2);
  airplaneGroup.add(leftEngine);
  
  // 右引擎
  const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
  rightEngine.rotation.z = Math.PI / 2;
  rightEngine.position.set(1, -0.9, -2);
  airplaneGroup.add(rightEngine);
  
  // 螺旋桨
  const propellerGeometry = new THREE.BoxGeometry(0.1, 0.2, 3);
  const propellerMaterial = new THREE.MeshStandardMaterial({
    color: 0x777777,
    metalness: 0.5,
    roughness: 0.2
  });
  
  // 左螺旋桨
  const leftPropeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
  leftPropeller.position.set(1.6, -0.9, 2);
  leftPropeller.rotation.x = Math.random() * Math.PI;
  airplaneGroup.add(leftPropeller);
  
  // 右螺旋桨
  const rightPropeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
  rightPropeller.position.set(1.6, -0.9, -2);
  rightPropeller.rotation.x = Math.random() * Math.PI;
  airplaneGroup.add(rightPropeller);
  
  // 起落架
  const gearLegGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
  const gearLegMaterial = new THREE.MeshStandardMaterial({
    color: 0x777777,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // 主起落架腿
  const mainGearPositions = [
    {x: 0, z: 1.5},
    {x: 0, z: -1.5}
  ];
  
  mainGearPositions.forEach(pos => {
    const legMesh = new THREE.Mesh(gearLegGeometry, gearLegMaterial);
    legMesh.position.set(pos.x, -1.5, pos.z);
    airplaneGroup.add(legMesh);
    
    // 轮子
    const wheelGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.3,
      roughness: 0.8
    });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(pos.x, -2.2, pos.z);
    airplaneGroup.add(wheel);
  });
  
  // 前起落架
  const frontLeg = new THREE.Mesh(gearLegGeometry, gearLegMaterial);
  frontLeg.position.set(fuselageLength/2 - 1, -1.2, 0);
  frontLeg.scale.y = 0.7;
  airplaneGroup.add(frontLeg);
  
  // 前轮
  const frontWheelGeometry = new THREE.TorusGeometry(0.2, 0.08, 8, 16);
  const frontWheel = new THREE.Mesh(frontWheelGeometry, new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.3,
    roughness: 0.8
  }));
  frontWheel.rotation.x = Math.PI / 2;
  frontWheel.position.set(fuselageLength/2 - 1, -1.7, 0);
  airplaneGroup.add(frontWheel);
  
  // 调整飞机整体方向
  airplaneGroup.rotation.y = Math.PI; // 调整飞机朝向
  
  // 添加飞机动画
  const animatePropellers = () => {
    leftPropeller.rotation.x += 0.3;
    rightPropeller.rotation.x += 0.3;
  };
  
  return { group: airplaneGroup, animate: animatePropellers };
}

// 使用新的飞机创建函数
let airplane = createDetailedAirplane();
const airplaneGroup = airplane.group;
scene.add(airplaneGroup);

// 飞行控制
const speed = {
    forward: 0,
    rotation: 0,
    ascent: 0,
    tilt: 0,
    maxSpeed: 2,
    acceleration: 0.01,
    deceleration: 0.005
};

// 初始位置高度
airplaneGroup.position.y = 200; // 降低初始高度

// 键盘控制
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
});

// 窗口调整大小
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 获取信息显示元素
const infoElement = document.getElementById('info');

// 动画循环
function animate() {
    try {
        requestAnimationFrame(animate);
        
        // 添加螺旋桨动画
        if (airplane && airplane.animate) {
            airplane.animate();
        }
        
        // 添加云动画
        animateClouds();
        
        // 添加水面波动效果
        if (waterSystem) {
            // 简单的正弦波动
            const time = Date.now() * 0.001;
            waterSystem.position.y = -50 + Math.sin(time) * 2;
        }
        
        // 控制飞机
        if (keys['w'] || keys['arrowup']) {
            speed.forward += speed.acceleration;
        } else if (keys['s'] || keys['arrowdown']) {
            speed.forward -= speed.acceleration;
        } else {
            if (speed.forward > 0) {
                speed.forward -= speed.deceleration;
            } else if (speed.forward < 0) {
                speed.forward += speed.deceleration;
            }
            if (Math.abs(speed.forward) < speed.deceleration) {
                speed.forward = 0;
            }
        }
        
        // 限制速度
        speed.forward = Math.max(-speed.maxSpeed / 2, Math.min(speed.maxSpeed, speed.forward));
        
        // 空格键加速
        if (keys[' ']) {
            speed.forward = speed.maxSpeed;
        }
        
        // 左右转向
        if (keys['a']) {
            speed.rotation = 0.02;
            airplaneGroup.rotation.z = Math.min(airplaneGroup.rotation.z + 0.01, 0.3); // 倾斜效果
        } else if (keys['d']) {
            speed.rotation = -0.02;
            airplaneGroup.rotation.z = Math.max(airplaneGroup.rotation.z - 0.01, -0.3); // 倾斜效果
        } else {
            speed.rotation = 0;
            // 恢复倾斜
            if (airplaneGroup.rotation.z > 0.01) {
                airplaneGroup.rotation.z -= 0.01;
            } else if (airplaneGroup.rotation.z < -0.01) {
                airplaneGroup.rotation.z += 0.01;
            } else {
                airplaneGroup.rotation.z = 0;
            }
        }
        
        // 上升/下降
        if (keys['arrowup']) {
            speed.ascent = 0.5;
            airplaneGroup.rotation.x = Math.min(airplaneGroup.rotation.x + 0.01, 0.2);
        } else if (keys['arrowdown']) {
            speed.ascent = -0.5;
            airplaneGroup.rotation.x = Math.max(airplaneGroup.rotation.x - 0.01, -0.2);
        } else {
            speed.ascent = 0;
            // 恢复平衡
            if (airplaneGroup.rotation.x > 0.01) {
                airplaneGroup.rotation.x -= 0.01;
            } else if (airplaneGroup.rotation.x < -0.01) {
                airplaneGroup.rotation.x += 0.01;
            } else {
                airplaneGroup.rotation.x = 0;
            }
        }
        
        // Q/E 左倾/右倾
        if (keys['q']) {
            speed.tilt = 0.02;
        } else if (keys['e']) {
            speed.tilt = -0.02;
        } else {
            speed.tilt = 0;
        }
        
        // 应用旋转和移动
        airplaneGroup.rotation.y += speed.rotation;
        airplaneGroup.rotation.z += speed.tilt;
        
        // 前进方向
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(airplaneGroup.quaternion);
        
        // 移动飞机
        airplaneGroup.position.add(direction.multiplyScalar(speed.forward));
        airplaneGroup.position.y += speed.ascent;
        
        // 确保飞机不会低于地面
        if (airplaneGroup.position.y < 50) {
            airplaneGroup.position.y = 50;
        }
        
        // 更新信息显示
        infoElement.innerHTML = `3D飞行模拟器<br>
                               位置: x=${Math.round(airplaneGroup.position.x)}, 
                               y=${Math.round(airplaneGroup.position.y)}, 
                               z=${Math.round(airplaneGroup.position.z)}<br>
                               速度: ${speed.forward.toFixed(2)}`;
        
        // 更新相机位置 - 让相机跟随飞机，调整位置
        const cameraOffset = new THREE.Vector3(0, 8, 30); // 调整相机距离和高度
        cameraOffset.applyQuaternion(airplaneGroup.quaternion);
        camera.position.copy(airplaneGroup.position).add(cameraOffset);
        
        // 计算飞机前方的目标点
        const lookAtOffset = new THREE.Vector3(0, 0, -20); // 减小前方距离
        lookAtOffset.applyQuaternion(airplaneGroup.quaternion);
        camera.lookAt(airplaneGroup.position.clone().add(lookAtOffset));
        
        renderer.render(scene, camera);
    } catch (error) {
        console.error('动画循环中发生错误:', error);
        document.body.innerHTML += `<div style="position:fixed; top:10px; left:10px; background:red; color:white; padding:10px; z-index:1000">
          动画错误: ${error.message}
        </div>`;
    }
}

// 修改初始化函数
function init() {
  console.log('初始化3D飞行模拟器...');
  
  // 改进光照效果
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);
  
  // 启用阴影
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // 去除调试网格，使用在真实环境中
  // const gridHelper = new THREE.GridHelper(2000, 20, 0xff0000, 0x444444);
  // scene.add(gridHelper);
  
  // 添加雾效增加氛围感
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.00025);
  
  // 移除冗余的调试标记物，保留世界坐标系
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);
  
  // 调整飞机初始位置，放在更有趣的位置
  airplaneGroup.position.set(500, 300, 500);
  
  // 增强视觉效果 - 调整场景色调
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  console.log('初始化完成，场景已准备就绪');
}

// 在页面加载完成后调用初始化函数
window.addEventListener('load', init);

// 添加云层系统
function createClouds() {
  const clouds = new THREE.Group();
  
  // 创建单个云
  function createCloud(x, y, z, scale = 1) {
    const cloud = new THREE.Group();
    const geometryBase = new THREE.SphereGeometry(5, 7, 7);
    const materialBase = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      roughness: 1,
      metalness: 0
    });
    
    // 创建云的各个部分
    const positions = [
      { x: 0, y: 0, z: 0, scale: 1 },
      { x: 4, y: -2, z: 2, scale: 0.7 },
      { x: -4, y: -1, z: -2, scale: 0.8 },
      { x: 2, y: 0, z: -3, scale: 0.6 },
      { x: -6, y: 0, z: 1, scale: 0.7 },
      { x: 3, y: 1, z: 4, scale: 0.5 },
      { x: -4, y: 0, z: 5, scale: 0.6 }
    ];
    
    positions.forEach(pos => {
      const cloudPart = new THREE.Mesh(geometryBase, materialBase);
      cloudPart.position.set(pos.x, pos.y, pos.z);
      cloudPart.scale.set(pos.scale, pos.scale, pos.scale);
      cloud.add(cloudPart);
    });
    
    // 设置云的位置和缩放
    cloud.position.set(x, y, z);
    cloud.scale.set(scale, scale, scale);
    
    // 添加随机运动
    cloud.userData = {
      speed: Math.random() * 0.05 + 0.02,
      rotationSpeed: Math.random() * 0.001 - 0.0005
    };
    
    return cloud;
  }
  
  // 创建多个云
  const cloudCount = 40;
  for (let i = 0; i < cloudCount; i++) {
    const x = Math.random() * 8000 - 4000;
    const y = Math.random() * 200 + 500;
    const z = Math.random() * 8000 - 4000;
    const scale = Math.random() * 15 + 5;
    
    const cloud = createCloud(x, y, z, scale);
    clouds.add(cloud);
  }
  
  return clouds;
}

// 创建云层并添加到场景
const cloudSystem = createClouds();
scene.add(cloudSystem);

// 云层动画函数
function animateClouds() {
  if (cloudSystem) {
    cloudSystem.children.forEach(cloud => {
      cloud.position.x += cloud.userData.speed;
      cloud.rotation.y += cloud.userData.rotationSpeed;
      
      // 如果云移出场景边界，将其重置到另一侧
      if (cloud.position.x > 5000) {
        cloud.position.x = -5000;
      }
    });
  }
}

// 创建山脉
function createMountains() {
  const mountains = new THREE.Group();
  
  // 山峰生成函数
  function createMountain(x, z, height, radius) {
    const segments = 32;
    const mountainGeometry = new THREE.ConeGeometry(radius, height, segments);
    
    // 创建带有纹理的材质
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    
    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
    
    // 将顶点随机偏移以创建更自然的形状
    const vertices = mountainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // 不修改顶点和底部中心
      if (vertices[i + 1] !== height && vertices[i + 1] !== 0) {
        vertices[i] += (Math.random() - 0.5) * radius * 0.2;
        vertices[i + 2] += (Math.random() - 0.5) * radius * 0.2;
      }
    }
    mountainGeometry.computeVertexNormals();
    
    // 添加雪顶 - 在山顶添加一个小的白色圆锥
    if (height > 300) {
      const snowCapGeometry = new THREE.ConeGeometry(radius * 0.5, height * 0.2, segments);
      const snowMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8
      });
      const snowCap = new THREE.Mesh(snowCapGeometry, snowMaterial);
      snowCap.position.y = height * 0.4;
      mountain.add(snowCap);
    }
    
    mountain.position.set(x, 0, z);
    return mountain;
  }
  
  // 创建多座山
  const mountainRanges = [
    { centerX: -2000, centerZ: -3000, count: 8, heightRange: [200, 600], radiusRange: [200, 400] },
    { centerX: 2000, centerZ: -2000, count: 6, heightRange: [300, 800], radiusRange: [250, 450] },
    { centerX: -3000, centerZ: 2000, count: 10, heightRange: [250, 700], radiusRange: [200, 500] }
  ];
  
  mountainRanges.forEach(range => {
    for (let i = 0; i < range.count; i++) {
      const angle = (i / range.count) * Math.PI * 2;
      const distance = Math.random() * 800 + 200;
      const x = range.centerX + Math.cos(angle) * distance;
      const z = range.centerZ + Math.sin(angle) * distance;
      
      const height = Math.random() * (range.heightRange[1] - range.heightRange[0]) + range.heightRange[0];
      const radius = Math.random() * (range.radiusRange[1] - range.radiusRange[0]) + range.radiusRange[0];
      
      const mountain = createMountain(x, z, height, radius);
      mountains.add(mountain);
    }
  });
  
  return mountains;
}

// 创建山脉并添加到场景
const mountainSystem = createMountains();
scene.add(mountainSystem);

// 创建水面
function createWater() {
  const waterSize = 10000;
  const waterGeometry = new THREE.PlaneGeometry(waterSize, waterSize, 1, 1);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x0077be,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8
  });
  
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -50; // 水面比地面稍低
  
  return water;
}

// 创建城市建筑群
function createCityscape() {
  const city = new THREE.Group();
  
  // 创建一座建筑
  function createBuilding(x, z, width, height, depth) {
    const buildingGroup = new THREE.Group();
    
    // 建筑主体
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    
    // 随机选择建筑材质颜色
    const colors = [0x888888, 0x777777, 0x999999, 0x666666, 0xaaaaaa];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.7
    });
    
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = height / 2;
    buildingGroup.add(building);
    
    // 添加窗户
    const windowSize = Math.min(width, depth) * 0.15;
    const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x88ccff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    
    // 在每个面上随机添加窗户
    const faces = [
      { axis: 'x', value: width / 2, rotation: [0, Math.PI / 2, 0] },
      { axis: 'x', value: -width / 2, rotation: [0, -Math.PI / 2, 0] },
      { axis: 'z', value: depth / 2, rotation: [0, 0, 0] },
      { axis: 'z', value: -depth / 2, rotation: [0, Math.PI, 0] }
    ];
    
    faces.forEach(face => {
      const windowsPerRow = Math.floor(width / (windowSize * 1.5));
      const windowsPerColumn = Math.floor(height / (windowSize * 1.5));
      
      for (let row = 0; row < windowsPerRow; row++) {
        for (let col = 0; col < windowsPerColumn; col++) {
          // 随机决定是否放置窗户
          if (Math.random() > 0.3) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            let xPos = 0, yPos = 0, zPos = 0;
            
            if (face.axis === 'x') {
              xPos = face.value + 0.01 * Math.sign(face.value); // 稍微偏移以避免z-fighting
              yPos = (col + 0.5) * (height / windowsPerColumn) - height / 2 + height / windowsPerColumn / 2;
              zPos = (row + 0.5) * (depth / windowsPerRow) - depth / 2 + depth / windowsPerRow / 2;
            } else {
              xPos = (row + 0.5) * (width / windowsPerRow) - width / 2 + width / windowsPerRow / 2;
              yPos = (col + 0.5) * (height / windowsPerColumn) - height / 2 + height / windowsPerColumn / 2;
              zPos = face.value + 0.01 * Math.sign(face.value); // 稍微偏移
            }
            
            window.position.set(xPos, yPos, zPos);
            window.rotation.set(...face.rotation);
            buildingGroup.add(window);
          }
        }
      }
    });
    
    // 可能添加屋顶装饰
    if (Math.random() > 0.5) {
      const roofGeometry = new THREE.BoxGeometry(width * 0.5, height * 0.1, depth * 0.5);
      const roof = new THREE.Mesh(roofGeometry, buildingMaterial);
      roof.position.y = height + height * 0.05;
      buildingGroup.add(roof);
    }
    
    buildingGroup.position.set(x, 0, z);
    return buildingGroup;
  }
  
  // 创建城市区域
  const cityLocations = [
    { centerX: 1500, centerZ: 1500, size: 1000 },
    { centerX: -1500, centerZ: -1200, size: 800 }
  ];
  
  cityLocations.forEach(location => {
    const { centerX, centerZ, size } = location;
    const buildingCount = Math.floor(size / 100);
    
    // 创建网格状的城市布局
    const gridSize = Math.sqrt(buildingCount);
    const spacing = size / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // 添加随机偏移量
        const offsetX = (Math.random() - 0.5) * spacing * 0.5;
        const offsetZ = (Math.random() - 0.5) * spacing * 0.5;
        
        const x = centerX + (i - gridSize / 2) * spacing + offsetX;
        const z = centerZ + (j - gridSize / 2) * spacing + offsetZ;
        
        // 随机建筑尺寸
        const width = Math.random() * 40 + 30;
        const height = Math.random() * 100 + 40;
        const depth = Math.random() * 40 + 30;
        
        // 建筑密度控制，20%的概率不放置建筑
        if (Math.random() > 0.2) {
          const building = createBuilding(x, z, width, height, depth);
          city.add(building);
        }
      }
    }
  });
  
  return city;
}

// 创建水面和城市并添加到场景
const waterSystem = createWater();
scene.add(waterSystem);

const citySystem = createCityscape();
scene.add(citySystem);

// 创建树木
function createForest() {
  const forest = new THREE.Group();
  
  // 创建一棵树
  function createTree(x, z, height = 15, trunkRadius = 1) {
    const tree = new THREE.Group();
    
    // 树干
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, height * 0.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = height * 0.25;
    tree.add(trunk);
    
    // 树冠
    const leavesGeometry = new THREE.ConeGeometry(height * 0.3, height * 0.7, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d4c20,
      roughness: 0.9,
      metalness: 0.0
    });
    
    // 添加多层树冠
    const layerCount = Math.floor(Math.random() * 2) + 2; // 2-3层
    
    for (let i = 0; i < layerCount; i++) {
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = height * 0.5 + i * height * 0.15;
      leaves.scale.set(1 - i * 0.2, 1 - i * 0.1, 1 - i * 0.2);
      tree.add(leaves);
    }
    
    tree.position.set(x, 0, z);
    return tree;
  }
  
  // 创建森林区域
  const forestAreas = [
    { centerX: -1000, centerZ: 1800, radius: 800, density: 0.5 },
    { centerX: 2200, centerZ: 800, radius: 600, density: 0.7 },
    { centerX: -2500, centerZ: -800, radius: 1000, density: 0.4 }
  ];
  
  forestAreas.forEach(area => {
    const { centerX, centerZ, radius, density } = area;
    const treeCount = Math.floor(radius * radius * density / 10000);
    
    for (let i = 0; i < treeCount; i++) {
      // 随机位置（在圆内）
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius; // 平方根使树木分布更均匀
      
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      
      // 随机树的高度和大小
      const height = Math.random() * 10 + 15;
      const trunkRadius = Math.random() * 0.5 + 0.8;
      
      const tree = createTree(x, z, height, trunkRadius);
      forest.add(tree);
    }
  });
  
  // 添加一些随机分散的树
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 10000 - 5000;
    const z = Math.random() * 10000 - 5000;
    
    // 避免与城市和森林区域重叠
    let tooClose = false;
    
    // 检查是否靠近城市
    for (const city of [{ x: 1500, z: 1500 }, { x: -1500, z: -1200 }]) {
      const distance = Math.sqrt(Math.pow(x - city.x, 2) + Math.pow(z - city.z, 2));
      if (distance < 1000) {
        tooClose = true;
        break;
      }
    }
    
    // 检查是否已在森林区域内
    for (const area of forestAreas) {
      const distance = Math.sqrt(Math.pow(x - area.centerX, 2) + Math.pow(z - area.centerZ, 2));
      if (distance < area.radius) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      const height = Math.random() * 10 + 12;
      const trunkRadius = Math.random() * 0.4 + 0.6;
      
      const tree = createTree(x, z, height, trunkRadius);
      forest.add(tree);
    }
  }
  
  return forest;
}

// 创建森林并添加到场景
const forestSystem = createForest();
scene.add(forestSystem);

animate(); 