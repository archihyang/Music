<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { 
    RotateCw,
    ZoomIn,
    ZoomOut,
    Maximize,
    Settings,
    Eye,
    Music,
    Hash,
    Circle,
    ChevronUp,
    ChevronDown
  } from 'lucide-svelte';
  
  // Props
  export let highlightedNotes: { string: number, fret: number }[] = [];
  export let scale: string = '';
  export let chord: string = '';
  export let tuning: string[] = ['E', 'A', 'D', 'G', 'B', 'E'];
  export let showFingerNumbers = true;
  export let showNoteNames = true;
  export let showIntervals = false;
  export let animate = true;
  export let cameraMode: 'perspective' | 'top' | 'side' = 'perspective';
  
  // Three.js 요소
  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let fretboard: THREE.Group;
  let markers: THREE.Group;
  let animationId: number;
  
  // 지판 설정
  const FRET_COUNT = 24;
  const STRING_COUNT = 6;
  const FRET_WIDTH = 3;
  const NECK_LENGTH = FRET_COUNT * FRET_WIDTH;
  const NECK_WIDTH = 6;
  const FRET_HEIGHT = 0.2;
  
  // 색상 테마
  const colors = {
    fretboard: 0x2C1810, // 로즈우드
    frets: 0xC0C0C0,     // 실버
    strings: 0xB87333,   // 브론즈
    inlays: 0xF5F5DC,    // 베이지
    markers: {
      root: 0xFF0000,    // 빨강
      third: 0x00FF00,   // 초록
      fifth: 0x0000FF,   // 파랑
      seventh: 0xFFFF00, // 노랑
      default: 0xFFA500  // 주황
    }
  };
  
  // 스케일 패턴
  const scalePatterns: { [key: string]: number[] } = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'pentatonic': [0, 2, 4, 7, 9],
    'blues': [0, 3, 5, 6, 7, 10],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'locrian': [0, 1, 3, 5, 6, 8, 10],
    'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic_minor': [0, 2, 3, 5, 7, 9, 11]
  };
  
  // 코드 모양
  const chordShapes: { [key: string]: { string: number, fret: number }[] } = {
    'C': [
      { string: 1, fret: 3 },
      { string: 2, fret: 3 },
      { string: 3, fret: 2 },
      { string: 4, fret: 0 },
      { string: 5, fret: 1 },
      { string: 6, fret: 0 }
    ],
    'G': [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 3, fret: 0 },
      { string: 4, fret: 0 },
      { string: 5, fret: 3 },
      { string: 6, fret: 3 }
    ],
    'Am': [
      { string: 1, fret: 0 },
      { string: 2, fret: 0 },
      { string: 3, fret: 2 },
      { string: 4, fret: 2 },
      { string: 5, fret: 1 },
      { string: 6, fret: 0 }
    ],
    'F': [
      { string: 1, fret: 1 },
      { string: 2, fret: 3 },
      { string: 3, fret: 3 },
      { string: 4, fret: 2 },
      { string: 5, fret: 1 },
      { string: 6, fret: 1 }
    ]
  };
  
  // Three.js 초기화
  function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 50, 200);
    
    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    
    if (cameraMode === 'perspective') {
      camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      camera.position.set(0, 20, 40);
    } else {
      const frustumSize = 40;
      camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
      );
      camera.position.set(0, cameraMode === 'top' ? 50 : 0, cameraMode === 'side' ? 0 : 50);
    }
    
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Helper lights
    const pointLight1 = new THREE.PointLight(0xffffff, 0.4);
    pointLight1.position.set(-10, 10, -10);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.4);
    pointLight2.position.set(10, 10, 10);
    scene.add(pointLight2);
  }
  
  // 지판 생성
  function createFretboard() {
    fretboard = new THREE.Group();
    
    // 넥 바디
    const neckGeometry = new THREE.BoxGeometry(NECK_WIDTH, 0.5, NECK_LENGTH);
    const neckMaterial = new THREE.MeshPhongMaterial({ 
      color: colors.fretboard,
      shininess: 30
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.receiveShadow = true;
    neck.castShadow = true;
    fretboard.add(neck);
    
    // 프렛
    for (let i = 0; i <= FRET_COUNT; i++) {
      const fretGeometry = new THREE.BoxGeometry(NECK_WIDTH + 0.2, FRET_HEIGHT, 0.1);
      const fretMaterial = new THREE.MeshPhongMaterial({ 
        color: colors.frets,
        metalness: 0.8,
        roughness: 0.2
      });
      const fret = new THREE.Mesh(fretGeometry, fretMaterial);
      fret.position.z = -NECK_LENGTH / 2 + i * FRET_WIDTH;
      fret.position.y = 0.25 + FRET_HEIGHT / 2;
      fret.castShadow = true;
      fretboard.add(fret);
    }
    
    // 스트링
    for (let i = 0; i < STRING_COUNT; i++) {
      const stringGeometry = new THREE.CylinderGeometry(0.03, 0.03, NECK_LENGTH);
      const stringMaterial = new THREE.MeshPhongMaterial({ 
        color: colors.strings,
        metalness: 0.9,
        roughness: 0.1
      });
      const string = new THREE.Mesh(stringGeometry, stringMaterial);
      string.rotation.x = Math.PI / 2;
      string.position.x = -NECK_WIDTH / 2 + (i + 1) * (NECK_WIDTH / (STRING_COUNT + 1));
      string.position.y = 0.5;
      string.castShadow = true;
      fretboard.add(string);
    }
    
    // 인레이 (포지션 마커)
    const inlayPositions = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    inlayPositions.forEach(fret => {
      const inlayGeometry = new THREE.CircleGeometry(0.2, 32);
      const inlayMaterial = new THREE.MeshPhongMaterial({ 
        color: colors.inlays,
        emissive: colors.inlays,
        emissiveIntensity: 0.1
      });
      
      if (fret === 12 || fret === 24) {
        // 더블 닷
        for (let i = 0; i < 2; i++) {
          const inlay = new THREE.Mesh(inlayGeometry, inlayMaterial);
          inlay.rotation.x = -Math.PI / 2;
          inlay.position.z = -NECK_LENGTH / 2 + fret * FRET_WIDTH - FRET_WIDTH / 2;
          inlay.position.x = i === 0 ? -1 : 1;
          inlay.position.y = 0.26;
          fretboard.add(inlay);
        }
      } else {
        // 싱글 닷
        const inlay = new THREE.Mesh(inlayGeometry, inlayMaterial);
        inlay.rotation.x = -Math.PI / 2;
        inlay.position.z = -NECK_LENGTH / 2 + fret * FRET_WIDTH - FRET_WIDTH / 2;
        inlay.position.y = 0.26;
        fretboard.add(inlay);
      }
    });
    
    scene.add(fretboard);
  }
  
  // 노트 마커 생성
  function createNoteMarkers() {
    // 기존 마커 제거
    if (markers) {
      scene.remove(markers);
      markers.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    }
    
    markers = new THREE.Group();
    
    // 하이라이트된 노트 표시
    highlightedNotes.forEach((note, index) => {
      const markerGeometry = new THREE.SphereGeometry(0.3, 32, 16);
      const markerMaterial = new THREE.MeshPhongMaterial({ 
        color: getMarkerColor(index),
        emissive: getMarkerColor(index),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      // 포지션 계산
      const x = -NECK_WIDTH / 2 + note.string * (NECK_WIDTH / (STRING_COUNT + 1));
      const z = -NECK_LENGTH / 2 + note.fret * FRET_WIDTH - FRET_WIDTH / 2;
      const y = 0.8;
      
      marker.position.set(x, y, z);
      marker.castShadow = true;
      
      // 애니메이션
      if (animate) {
        marker.userData.baseY = y;
        marker.userData.animationOffset = index * 0.5;
      }
      
      markers.add(marker);
      
      // 텍스트 라벨 (운지 번호 또는 노트 이름)
      if (showFingerNumbers || showNoteNames) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = showFingerNumbers ? (index + 1).toString() : getNoteNameFromPosition(note);
        ctx.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
          map: texture,
          transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(marker.position);
        sprite.position.y += 0.6;
        sprite.scale.set(0.8, 0.8, 1);
        
        markers.add(sprite);
      }
    });
    
    // 스케일 표시
    if (scale && scalePatterns[scale]) {
      displayScale(scale);
    }
    
    // 코드 표시
    if (chord && chordShapes[chord]) {
      displayChord(chord);
    }
    
    scene.add(markers);
  }
  
  // 스케일 표시
  function displayScale(scaleName: string) {
    const pattern = scalePatterns[scaleName];
    const rootNote = 0; // C를 루트로 가정
    
    // 모든 포지션에 스케일 노트 표시
    for (let string = 1; string <= STRING_COUNT; string++) {
      for (let fret = 0; fret <= FRET_COUNT; fret++) {
        const noteValue = getNoteSemitones(string, fret);
        const relativeNote = (noteValue - rootNote + 12) % 12;
        
        if (pattern.includes(relativeNote)) {
          const markerGeometry = new THREE.RingGeometry(0.25, 0.35, 32);
          const isRoot = relativeNote === 0;
          const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: isRoot ? colors.markers.root : colors.markers.default,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
          });
          
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.rotation.x = -Math.PI / 2;
          
          const x = -NECK_WIDTH / 2 + string * (NECK_WIDTH / (STRING_COUNT + 1));
          const z = -NECK_LENGTH / 2 + fret * FRET_WIDTH - FRET_WIDTH / 2;
          const y = 0.27;
          
          marker.position.set(x, y, z);
          markers.add(marker);
          
          // 인터벌 표시
          if (showIntervals) {
            const intervalNames = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;
            
            ctx.fillStyle = isRoot ? 'red' : 'black';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(intervalNames[relativeNote], 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
              map: texture,
              transparent: true,
              opacity: 0.8
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(marker.position);
            sprite.position.y += 0.3;
            sprite.scale.set(0.5, 0.5, 1);
            
            markers.add(sprite);
          }
        }
      }
    }
  }
  
  // 코드 표시
  function displayChord(chordName: string) {
    const shape = chordShapes[chordName];
    
    shape.forEach((position, index) => {
      const markerGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32);
      const markerMaterial = new THREE.MeshPhongMaterial({ 
        color: colors.markers.root,
        emissive: colors.markers.root,
        emissiveIntensity: 0.5
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      const x = -NECK_WIDTH / 2 + position.string * (NECK_WIDTH / (STRING_COUNT + 1));
      const z = -NECK_LENGTH / 2 + position.fret * FRET_WIDTH - FRET_WIDTH / 2;
      const y = 0.6;
      
      marker.position.set(x, y, z);
      marker.castShadow = true;
      
      markers.add(marker);
      
      // 손가락 번호
      if (showFingerNumbers) {
        const fingerNumbers = getChordFingering(chordName);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fingerNumbers[index].toString(), 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
          map: texture,
          transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(marker.position);
        sprite.position.y += 0.4;
        sprite.scale.set(0.6, 0.6, 1);
        
        markers.add(sprite);
      }
    });
  }
  
  // 애니메이션 루프
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    controls.update();
    
    // 마커 애니메이션
    if (animate && markers) {
      markers.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.baseY) {
          const time = Date.now() * 0.001;
          const offset = child.userData.animationOffset || 0;
          child.position.y = child.userData.baseY + Math.sin(time + offset) * 0.1;
        }
      });
    }
    
    // 지판 회전 (선택적)
    if (fretboard && animate) {
      fretboard.rotation.y = Math.sin(Date.now() * 0.0001) * 0.02;
    }
    
    renderer.render(scene, camera);
  }
  
  // 헬퍼 함수들
  function getMarkerColor(index: number): number {
    const colorArray = [
      colors.markers.root,
      colors.markers.third,
      colors.markers.fifth,
      colors.markers.seventh,
      colors.markers.default
    ];
    return colorArray[index % colorArray.length];
  }
  
  function getNoteSemitones(string: number, fret: number): number {
    // 표준 튜닝 기준 (E A D G B E)
    const openStringNotes = [4, 9, 14, 19, 23, 28]; // E2, A2, D3, G3, B3, E4
    return openStringNotes[string - 1] + fret;
  }
  
  function getNoteNameFromPosition(position: { string: number, fret: number }): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const semitones = getNoteSemitones(position.string, position.fret);
    return noteNames[semitones % 12];
  }
  
  function getChordFingering(chordName: string): number[] {
    const fingerings: { [key: string]: number[] } = {
      'C': [3, 3, 2, 0, 1, 0],
      'G': [3, 2, 0, 0, 3, 3],
      'Am': [0, 0, 2, 2, 1, 0],
      'F': [1, 3, 3, 2, 1, 1]
    };
    return fingerings[chordName] || [];
  }
  
  // 윈도우 리사이즈 핸들러
  function handleResize() {
    if (!camera || !renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    } else {
      const aspect = width / height;
      const frustumSize = 40;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.updateProjectionMatrix();
    }
    
    renderer.setSize(width, height);
  }
  
  // 카메라 뷰 변경
  function setCameraView(view: string) {
    if (!camera) return;
    
    switch (view) {
      case 'top':
        camera.position.set(0, 50, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'side':
        camera.position.set(50, 10, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'perspective':
      default:
        camera.position.set(0, 20, 40);
        camera.lookAt(0, 0, 0);
        break;
    }
    
    controls.update();
  }
  
  // 스크린샷 캡처
  function captureScreenshot() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `fretboard_${Date.now()}.png`;
    link.click();
  }
  
  onMount(() => {
    initThreeJS();
    createFretboard();
    createNoteMarkers();
    animate();
    
    window.addEventListener('resize', handleResize);
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    window.removeEventListener('resize', handleResize);
    
    // Three.js 정리
    if (renderer) {
      renderer.dispose();
    }
    
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  });
  
  // 반응형 업데이트
  $: if (scene) {
    createNoteMarkers();
  }
</script>

<div class="interactive-3d-fretboard">
  <!-- 헤더 컨트롤 -->
  <div class="fretboard-controls">
    <div class="control-group">
      <h3 class="control-title">
        <Music size={20} />
        3D 지판 시각화
      </h3>
    </div>
    
    <div class="control-group">
      <!-- 뷰 컨트롤 -->
      <div class="view-controls">
        <button 
          class="btn btn-sm"
          class:btn-primary={cameraMode === 'perspective'}
          on:click={() => setCameraView('perspective')}
          title="원근 뷰"
        >
          <Eye size={16} />
        </button>
        <button 
          class="btn btn-sm"
          class:btn-primary={cameraMode === 'top'}
          on:click={() => setCameraView('top')}
          title="위에서 보기"
        >
          <ChevronUp size={16} />
        </button>
        <button 
          class="btn btn-sm"
          class:btn-primary={cameraMode === 'side'}
          on:click={() => setCameraView('side')}
          title="옆에서 보기"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      
      <!-- 표시 옵션 -->
      <div class="display-options">
        <label class="option-label">
          <input type="checkbox" bind:checked={showNoteNames} class="checkbox checkbox-sm">
          <span>노트</span>
        </label>
        <label class="option-label">
          <input type="checkbox" bind:checked={showFingerNumbers} class="checkbox checkbox-sm">
          <span>운지</span>
        </label>
        <label class="option-label">
          <input type="checkbox" bind:checked={showIntervals} class="checkbox checkbox-sm">
          <span>인터벌</span>
        </label>
        <label class="option-label">
          <input type="checkbox" bind:checked={animate} class="checkbox checkbox-sm">
          <span>애니메이션</span>
        </label>
      </div>
      
      <!-- 액션 버튼 -->
      <div class="action-buttons">
        <button class="btn btn-sm btn-ghost" on:click={captureScreenshot}>
          📷
        </button>
        <button class="btn btn-sm btn-ghost">
          <Settings size={16} />
        </button>
      </div>
    </div>
  </div>
  
  <!-- 3D 뷰포트 -->
  <div bind:this={container} class="viewport-container"></div>
  
  <!-- 스케일/코드 선택기 -->
  <div class="selector-panel">
    <div class="selector-group">
      <label>스케일</label>
      <select bind:value={scale} class="select select-sm select-bordered">
        <option value="">없음</option>
        <option value="major">메이저</option>
        <option value="minor">마이너</option>
        <option value="pentatonic">펜타토닉</option>
        <option value="blues">블루스</option>
        <option value="dorian">도리안</option>
        <option value="mixolydian">믹솔리디안</option>
        <option value="lydian">리디안</option>
        <option value="phrygian">프리지안</option>
        <option value="locrian">로크리안</option>
        <option value="harmonic_minor">하모닉 마이너</option>
        <option value="melodic_minor">멜로딕 마이너</option>
      </select>
    </div>
    
    <div class="selector-group">
      <label>코드</label>
      <select bind:value={chord} class="select select-sm select-bordered">
        <option value="">없음</option>
        <option value="C">C</option>
        <option value="G">G</option>
        <option value="Am">Am</option>
        <option value="F">F</option>
      </select>
    </div>
    
    <div class="selector-group">
      <label>튜닝</label>
      <select class="select select-sm select-bordered">
        <option>Standard (EADGBE)</option>
        <option>Drop D</option>
        <option>Open G</option>
        <option>DADGAD</option>
      </select>
    </div>
  </div>
  
  <!-- 정보 패널 -->
  <div class="info-panel">
    <div class="info-item">
      <span class="info-label">하이라이트:</span>
      <span class="info-value">{highlightedNotes.length} 노트</span>
    </div>
    <div class="info-item">
      <span class="info-label">프렛:</span>
      <span class="info-value">0-{FRET_COUNT}</span>
    </div>
    <div class="info-item">
      <span class="info-label">현:</span>
      <span class="info-value">{STRING_COUNT}</span>
    </div>
  </div>
</div>

<style>
  .interactive-3d-fretboard {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .fretboard-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .control-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .control-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
  
  .view-controls {
    display: flex;
    gap: 4px;
  }
  
  .display-options {
    display: flex;
    gap: 16px;
    padding: 0 12px;
    border-left: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
  }
  
  .option-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .action-buttons {
    display: flex;
    gap: 4px;
  }
  
  .viewport-container {
    width: 100%;
    height: 500px;
    background: linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%);
  }
  
  .selector-panel {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
  }
  
  .selector-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .selector-group label {
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }
  
  .info-panel {
    display: flex;
    gap: 24px;
    padding: 12px 16px;
    background: white;
    border-top: 1px solid #e0e0e0;
    font-size: 13px;
  }
  
  .info-item {
    display: flex;
    gap: 6px;
  }
  
  .info-label {
    color: #666;
  }
  
  .info-value {
    font-weight: 500;
    color: #333;
  }
  
  /* 반응형 */
  @media (max-width: 768px) {
    .fretboard-controls {
      flex-direction: column;
      gap: 12px;
    }
    
    .control-group {
      width: 100%;
      justify-content: center;
    }
    
    .display-options {
      border: none;
      padding: 0;
    }
    
    .selector-panel {
      flex-direction: column;
    }
    
    .viewport-container {
      height: 400px;
    }
  }
  
  /* 다크 모드 */
  :global(.dark) .interactive-3d-fretboard {
    background: #2d2d2d;
  }
  
  :global(.dark) .fretboard-controls,
  :global(.dark) .selector-panel {
    background: #1a1a1a;
    border-color: #444;
  }
  
  :global(.dark) .info-panel {
    background: #2d2d2d;
    border-color: #444;
  }
  
  :global(.dark) .control-title,
  :global(.dark) .info-value {
    color: #e0e0e0;
  }
  
  :global(.dark) .viewport-container {
    background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
  }
</style>