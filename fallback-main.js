// 备用主函数 - 如果原始main.js无法加载时使用
document.addEventListener('DOMContentLoaded', function() {
    // 简单场景初始化
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // 显示加载信息
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.style.color = 'white';
    info.style.fontFamily = 'Arial, sans-serif';
    info.innerHTML = '正在加载飞行模拟器...';
    container.appendChild(info);
    
    // 尝试动态加载Three.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    script.onload = function() {
        // Three.js加载成功
        info.innerHTML = 'Three.js加载成功，正在初始化场景...';
        
        try {
            // 基本场景初始化
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(renderer.domElement);
            
            // 蓝色背景
            scene.background = new THREE.Color(0x87ceeb);
            
            // 添加一个简单的平面
            const geometry = new THREE.PlaneGeometry(1000, 1000);
            const material = new THREE.MeshBasicMaterial({ color: 0x3d673c, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI / 2;
            scene.add(plane);
            
            // 简单飞机
            const airplaneGroup = new THREE.Group();
            const boxGeometry = new THREE.BoxGeometry(5, 1, 10);
            const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            airplaneGroup.add(box);
            
            const wingGeometry = new THREE.BoxGeometry(20, 0.5, 5);
            const wing = new THREE.Mesh(wingGeometry, boxMaterial);
            airplaneGroup.add(wing);
            
            airplaneGroup.position.y = 20;
            scene.add(airplaneGroup);
            
            // 设置相机位置
            camera.position.y = 30;
            camera.position.z = 30;
            camera.lookAt(airplaneGroup.position);
            
            // 简单的动画
            function animate() {
                requestAnimationFrame(animate);
                airplaneGroup.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
            
            animate();
            info.innerHTML = '备用场景加载完成。<br>如果您看到这个界面，说明原始脚本有问题。<br>请检查控制台获取详细错误信息。';
            
        } catch (e) {
            info.innerHTML = '初始化场景时发生错误: ' + e.message;
            console.error('备用场景错误:', e);
        }
    };
    
    script.onerror = function() {
        info.innerHTML = '无法加载Three.js库。请检查网络连接。';
    };
    
    document.head.appendChild(script);
}); 