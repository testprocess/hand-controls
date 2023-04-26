import { HandLandmarker, FilesetResolver } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@latest";


class HandDetect {
    constructor() {
        this.webcamRunning = false
        this.video = document.getElementById("webcam");
        this.scale = 1
        this.angleZ = 0
        this.angleY = 0

        this.lastVideoTime = -1;

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

    async getDistance(a, b) {
        return Math.sqrt(((b.x - a.x)**2) + ((b.y - a.y)**2) + ((b.z - a.z)**2))
    }

    async getAngle(a, b, targetXCoord, targetYCoord) {
        return Math.atan2(a[targetYCoord] - b[targetYCoord], a[targetXCoord] - b[targetXCoord]) * 180 / Math.PI;
    }

    async getLandmarks() {

        if (this.lastVideoTime == -1) {
            await this.handLandmarker.setOptions({ runningMode: "VIDEO" });
        }

        const detections = this.handLandmarker.detectForVideo(this.video, this.lastVideoTime);
        this.lastVideoTime = this.video.currentTime;

        if (detections.landmarks.length == 2) {
            const dist = await this.getDistance(detections.landmarks[0][12], detections.landmarks[1][12])
            const angleZ = await this.getAngle(detections.landmarks[0][9], detections.landmarks[1][9], 'x', 'y')
            const angleY1 = await this.getAngle(detections.landmarks[0][12], detections.landmarks[0][4], 'y', 'z')
            const angleY2 = await this.getAngle(detections.landmarks[1][12], detections.landmarks[1][4], 'y', 'z')

            this.scale = dist + 1
            this.angleZ = - angleZ * (Math.PI / 180)
            this.angleY = - ((angleY1 + angleY2) / 2) * (Math.PI / 180)
        }

        window.requestAnimationFrame(this.getLandmarks.bind(this));
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
        this.mesh = undefined

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

        this.addModel('/public/rocket.glb')
        this.animate();
    }

    animate() {
        requestAnimationFrame( this.animate.bind(this) );

        try {
            this.mesh.scale.set(hand.scale**3,hand.scale**3,hand.scale**3);
            this.mesh.rotation.set(hand.angleY, 0, hand.angleZ)
        } catch (error) {
            
        }

        this.renderer.render( this.scene, this.camera );
    }

    addModel(path) {
        const loader = new THREE.GLTFLoader();
    
        loader.load(path, ( gltf ) => {
                this.mesh = gltf.scene
                this.mesh.receiveShadow = true;
                this.scene.add( this.mesh );
            },
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            function ( error ) {
                console.log( 'An error happened' );
            }
        );
    }

    addCube() {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.cube = new THREE.Mesh( geometry, material );
        this.scene.add( this.cube );
    }
}

const hand = new HandDetect()
const screen = new Screen()
