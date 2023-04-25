import { HandLandmarker, FilesetResolver } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.1.0-alpha-11";


class HandDetect {
    constructor() {
        this.webcamRunning = false
        this.video = document.getElementById("webcam");

        this.init()
    }

    async init() {
        await this.estimate()
        await this.enableCam()
    }

    async estimate() {
        this.vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(
            this.vision,
            {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task"
            },
            numHands: 2
        });
    }

    async getLandmarks() {
        await this.handLandmarker.setOptions({ runningMode: "VIDEO" });

        let lastVideoTime = -1;
        const detections = this.handLandmarker.detectForVideo(this.video, lastVideoTime);
        console.log(detections.landmarks)
        lastVideoTime = this.video.currentTime;
    
        requestAnimationFrame(this.getLandmarks.bind(this));
    }

    async enableCam() {      
        navigator.mediaDevices.getUserMedia({
            video: true
        }).then((stream) => {
            this.video.srcObject = stream;
            this.video.addEventListener("loadeddata", this.getLandmarks.bind(this));
        });
    }
    
}

class Screen {
    constructor() {
        this.scene = undefined
        this.camera = undefined
        this.renderer = undefined
        this.controls = undefined

        this.init()

    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xa0a0a0 );
        this.scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );
    
        const clock = new THREE.Clock();
    
        this.camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 100 );
        this.camera.position.set( 0, 1, 9 );
        this.scene.add(this.camera);
    
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.querySelector("#app").appendChild( this.renderer.domElement );
        
        const dirLight = new THREE.DirectionalLight( 0xf7e5df );
        dirLight.position.set( 3, 1000, 2500 );
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 2;
        dirLight.shadow.camera.bottom = - 2;
        dirLight.shadow.camera.left = - 2;
        dirLight.shadow.camera.right = 2;
        dirLight.shadow.camera.near = 0.06;
        dirLight.shadow.camera.far = 4000;
        this.scene.add(dirLight);
        
        const hemiLight = new THREE.HemisphereLight( 0x707070, 0x444444 );
        hemiLight.position.set( 0, 120, 0 );
        this.scene.add(hemiLight);
    }
}

new Screen()
new HandDetect()