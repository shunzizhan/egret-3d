﻿module egret3d {
    export class Class_Particle extends Class_View3D {

        private plane: Mesh;
        protected view1: View3D;

        protected cameraCrl: LookAtController;
        constructor() {
            super();
            this._egret3DCanvas.addEventListener(Event3D.ENTER_FRAME, this.update, this);

            var view1: View3D = new View3D(0, 0, 1024, 768);
            this.view1 = view1;

            view1.camera3D.lookAt(new Vector3D(0, 500, -500), new Vector3D(0, 0, 0));
            view1.backColor = 0xff000000;
            this._egret3DCanvas.addView3D(view1);

            this.cameraCrl = new LookAtController(this.view1.camera3D, new Object3D());
            this.cameraCrl.distance = 1000;


            
            var planemat: TextureMaterial = new TextureMaterial();
            var loadtex1: URLLoader = new URLLoader("resource/floor/brick-diffuse.jpg");
            loadtex1.addEventListener(LoaderEvent3D.LOADER_COMPLETE, this.onLoadTexture, this);
            loadtex1["mat"] = planemat;
            //this.view1.addChild3D(new Mesh(new PlaneGeometry(1000, 1000), planemat));


            var mat: TextureMaterial = new TextureMaterial();
            var particle: ParticleEmitter = new ParticleEmitter(mat, 1000, 100, 100);

            this.view1.addChild3D(particle);
            this.obj = particle;
            particle.setEndRotXYZ(0, 360, 0);

            var loadtex: URLLoader = new URLLoader("resource/effect/vein_0025.png");
            loadtex.addEventListener(LoaderEvent3D.LOADER_COMPLETE, this.onLoadTexture, this);
            loadtex["mat"] = mat;
            particle.material.blendMode = BlendMode.ALPHA;
        }

        protected obj: Object3D;
        protected onLoadTexture(e: LoaderEvent3D) {
            e.loader["mat"].diffuseTexture = e.loader.data;
        }

        public update(e: Event3D) {
            this.cameraCrl.update();
            //this.obj.rotationY++;
        }

    }
} 