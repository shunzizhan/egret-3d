module egret3d {

    /**
    * @private
    * @class egret3d.ShaderGenerator
    * @classdesc
    * Shader 生成器
    */
    export class ShaderGenerator {


        private static _indexParameters: any = {};

        //根据shader的命名创建对应shader和program
        public static createProgram(defdata: IMaterialDefines, _vsShaderSourceName: string, _fsShaderSourceName: string): Program3D {
            //vsShader
            let vsSource: string = ShaderGenerator.generateShaderSource(defdata, _vsShaderSourceName);
            let vsShader: Shader = ShaderGenerator.createShader(vsSource, ShaderType.VertexShader, defdata.toName() + _vsShaderSourceName);
            //fsShader
            let fsSource: string = ShaderGenerator.generateShaderSource(defdata, _fsShaderSourceName);
            let fsShader: Shader = ShaderGenerator.createShader(vsSource, ShaderType.FragmentShader, defdata.toName() + _fsShaderSourceName);
            //program
            let program: Program3D = ShaderGenerator.createProgramLogic(vsShader, fsShader);

            //清除shader
            vsShader.dispose();
            fsShader.dispose();

            return program;
        }

        //创建shader
        private static createShader(_source: string, _type: number, _name: string): Shader {
            let shader: WebGLShader = Context3DProxy.gl.createShader(_type);

            Context3DProxy.gl.shaderSource(shader, _source);
            Context3DProxy.gl.compileShader(shader);

            let tmpShader: Shader = new Shader(shader);
            tmpShader.name = _name;

            return tmpShader;
        }

        //创建Program
        private static createProgramLogic(vsShader: Shader, fsShader: Shader): Program3D {
            let shaderProgram = Context3DProxy.gl.createProgram();
            Context3DProxy.gl.attachShader(shaderProgram, vsShader.shader);
            Context3DProxy.gl.attachShader(shaderProgram, fsShader.shader);
            Context3DProxy.gl.linkProgram(shaderProgram);

            //debug模式下启用
            if (Egret3DEngine.instance.debug) {
                let p = Context3DProxy.gl.getProgramParameter(shaderProgram, Context3DProxy.gl.LINK_STATUS);
                if (!p) {
                    console.log("vsShader error" + Context3DProxy.gl.getShaderInfoLog(vsShader.shader));
                    console.log("fsShader error" + Context3DProxy.gl.getShaderInfoLog(fsShader.shader));
                    console.log("program error" + Context3DProxy.gl.getProgramInfoLog(shaderProgram));
                }
            }
            /////
            let program: Program3D = new Program3D(shaderProgram);
            program.name = vsShader.name + fsShader.name;
            
            //放入仓中
            ShaderCache.addProgram(program);

            return program;
        }

        //生成shader源码
        private static generateShaderSource(defdata: IMaterialDefines, _ShaderSourceName: string): string {
            let keys = defdata.keys();
            let len = keys.length;
            let defStr = "";
            for (let i: number = 0; i < len; i++) {
                if (defdata[keys[i]] == true) {
                    defStr += "#define " + keys[i] + "\n";
                }
            }
            let source: string = "";
            ShaderGenerator._processIncludes(ShaderStore.lib[_ShaderSourceName], (rel) => {
                //处理完成后shader代码
                defStr += rel;
                source = defStr
            });
            return source;
        }

        ///#include 替换
        private static _processIncludes(sourceCode: string, callback: (data: any) => void): void {
            let regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
            let match = regex.exec(sourceCode);

            let returnValue = new String(sourceCode);

            while (match != null) {
                let includeFile = match[1];

                if (ShaderStore.lib[includeFile]) {
                    // Substitution
                    let includeContent = ShaderStore.lib[includeFile];
                    if (match[2]) {
                        let splits = match[3].split(",");

                        for (let index = 0; index < splits.length; index += 2) {
                            let source = new RegExp(splits[index], "g");
                            let dest = splits[index + 1];

                            includeContent = includeContent.replace(source, dest);
                        }
                    }

                    if (match[4]) {
                        let indexString = match[5];
                        if (indexString.indexOf("..") !== -1) {
                            let indexSplits = indexString.split("..");
                            let minIndex = parseInt(indexSplits[0]);
                            let maxIndex = parseInt(indexSplits[1]);
                            let sourceIncludeContent = includeContent.slice(0);
                            includeContent = "";
                            if (isNaN(maxIndex)) {
                                maxIndex = ShaderGenerator._indexParameters[indexSplits[1]];
                            }

                            for (let i = minIndex; i <= maxIndex; i++) {
                                includeContent += sourceIncludeContent.replace(/\{X\}/g, i.toString()) + "\n";
                            }
                        } else {
                            includeContent = includeContent.replace(/\{X\}/g, indexString);
                        }
                    }

                    // Replace
                    returnValue = returnValue.replace(match[0], includeContent);
                }

                match = regex.exec(sourceCode);
            }

            callback(returnValue);
        }
    }
}