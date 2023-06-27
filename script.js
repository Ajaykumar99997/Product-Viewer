import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { LoadingBar } from './libs/LoadingBar.js';

class App {
  constructor() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

    this.loadingBar = new LoadingBar();

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10
    );
    this.camera.position.set(0, 0, 0);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    this.scene.add(ambient);

    const light = new THREE.DirectionalLight();
    light.position.set(0.2, 1, 1);
    this.scene.add(light);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.workingVec3 = new THREE.Vector3();

    this.initScene();
    this.setupXR();

    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  loadModel() {
    const self = this;
    const loader = new GLTFLoader();

    loader.load(
      '' + new URL('./assets/clock.glb', import.meta.url),

      function (gltf) {
        self.model = gltf.scene;

        self.model.scale.set(0.01, 0.01, 0.01);
        self.model.position.set(0, 0.2, -1.2);
        self.scene.add(self.model);

        const mixer = new THREE.AnimationMixer(self.model);
        const action = mixer.clipAction(gltf.animations[0]);

        action.loop = THREE.LoopOnce;
        self.action = action;

        self.mixers.push(mixer);

        self.loadingBar.visible = false;
        self.renderer.setAnimationLoop(self.render.bind(self));
      },
      // called while loading is progressing
      function (xhr) {
        self.loadingBar.progress = xhr.loaded / xhr.total;
      },
      // called when loading has errors
      function (error) {
        console.error(error.message);
      }
    );
  }

  initScene() {
    this.mixers = [];
    this.loadModel();
  }

  setupXR() {
    this.renderer.xr.enabled = true;

    const arButton = ARButton.createButton(this.renderer, {
      sessionInit: {
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body },
      },
    });

    const self = this;

    function onSelect() {
      if (!self.action.isRunning()) {
        self.action.time = 0;
        self.action.enabled = true;
        self.action.play();
      }
    }

    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('select', onSelect);
    this.scene.add(this.controller);

    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(arButton);
  }

  render(timestamp, frame) {
    const dt = this.clock.getDelta();

    this.mixers.forEach((mixer) => mixer.update(dt));

    this.renderer.render(this.scene, this.camera);
  }
}
document.addEventListener('DOMContentLoaded', function () {
  const app = new App();
  window.app = app;
});
