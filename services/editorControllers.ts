
import { fabric } from 'fabric';
import saveAs from 'file-saver';

export class LayerManager {
    canvas: fabric.Canvas;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    getObjectId(obj: fabric.Object): string {
        if (obj.id) return obj.id;
        const newId = `layer_${Date.now()}_${Math.random()}`;
        obj.id = newId;
        return newId;
    }

    getAllLayers() {
        return this.canvas.getObjects().map((obj) => ({
            id: this.getObjectId(obj),
            name: obj.name || `Layer ${this.canvas.getObjects().indexOf(obj) + 1}`,
            type: obj.type,
            visible: obj.visible,
            locked: !obj.selectable,
            opacity: (obj.opacity ?? 1) * 100,
            blendMode: obj.globalCompositeOperation || 'source-over',
            thumbnail: obj.toDataURL({ format: 'png', quality: 0.1, multiplier: 0.1 }),
            zIndex: this.canvas.getObjects().indexOf(obj),
        }));
    }

    findLayer(layerId: string) {
        return this.canvas.getObjects().find(obj => this.getObjectId(obj) === layerId);
    }
    
    selectLayer(layerId: string) {
        const obj = this.findLayer(layerId);
        if (obj) {
            this.canvas.setActiveObject(obj);
            this.canvas.renderAll();
        }
    }

    toggleVisibility(layerId: string) {
        const obj = this.findLayer(layerId);
        if (obj) {
            obj.set('visible', !obj.visible);
            this.canvas.renderAll();
        }
    }
    
    toggleLock(layerId: string) {
        const obj = this.findLayer(layerId);
        if (obj) {
            const isLocked = !obj.selectable;
            obj.set({
                selectable: isLocked,
                evented: isLocked,
            });
            this.canvas.renderAll();
        }
    }

    renameLayer(layerId: string, newName: string) {
        const obj = this.findLayer(layerId);
        if (obj) {
            obj.set('name', newName);
        }
    }

    deleteLayer(layerId: string) {
        const obj = this.findLayer(layerId);
        if (obj) {
            this.canvas.remove(obj);
            this.canvas.discardActiveObject();
            this.canvas.renderAll();
        }
    }

    duplicateLayer(layerId: string) {
        const obj = this.findLayer(layerId);
        if (obj) {
            obj.clone((cloned: fabric.Object) => {
                cloned.set({
                    left: obj.left! + 10,
                    top: obj.top! + 10,
                    name: `${obj.name} copy`
                });
                delete cloned.id; // get new id
                this.canvas.add(cloned);
                this.canvas.setActiveObject(cloned);
                this.canvas.renderAll();
            });
        }
    }
}

export class TransformController {
    canvas: fabric.Canvas;
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }
    flipHorizontal(object?: fabric.Object) {
        const target = object || this.canvas.getActiveObject();
        if (target) {
            target.set('flipX', !target.flipX);
            this.canvas.renderAll();
        }
    }
    flipVertical(object?: fabric.Object) {
        const target = object || this.canvas.getActiveObject();
        if (target) {
            target.set('flipY', !target.flipY);
            this.canvas.renderAll();
        }
    }
    resetTransform(object?: fabric.Object) {
        const target = object || this.canvas.getActiveObject();
        if (target) {
            target.set({ scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false });
            this.canvas.renderAll();
        }
    }
    alignObjects(objects: fabric.Object[] | null, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
        const selection = objects || this.canvas.getActiveObjects();
        if (!selection || selection.length < 2) return;
        const group = new fabric.Group(selection);
        selection.forEach(obj => {
            switch(alignment) {
                case 'left': obj.set({ left: group.left }); break;
                case 'center': obj.set({ left: group.left! + (group.width!/2) - (obj.getScaledWidth()/2) }); break;
                case 'right': obj.set({ left: group.left! + group.width! - obj.getScaledWidth() }); break;
                case 'top': obj.set({ top: group.top }); break;
                case 'middle': obj.set({ top: group.top! + (group.height!/2) - (obj.getScaledHeight()/2) }); break;
                case 'bottom': obj.set({ top: group.top! + group.height! - obj.getScaledHeight() }); break;
            }
        });
        this.canvas.renderAll();
    }
}

export class ColorAdjustmentController {
    canvas: fabric.Canvas;
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }
    
    applyAdjustments(object: fabric.Image, {hue, saturation, brightness, contrast}: {hue:number, saturation:number, brightness:number, contrast:number}) {
        object.filters = [];
        if (hue !== 0) object.filters.push(new fabric.Image.filters.HueRotation({ rotation: hue / 180 }));
        if (saturation !== 0) object.filters.push(new fabric.Image.filters.Saturation({ saturation }));
        if (brightness !== 0) object.filters.push(new fabric.Image.filters.Brightness({ brightness }));
        if (contrast !== 0) object.filters.push(new fabric.Image.filters.Contrast({ contrast }));
        object.applyFilters();
        this.canvas.renderAll();
    }
    
    grayscale(object: fabric.Image) {
        object.filters = [new fabric.Image.filters.Grayscale()];
        object.applyFilters();
        this.canvas.renderAll();
    }

    sepia(object: fabric.Image) {
        object.filters = [new fabric.Image.filters.Sepia()];
        object.applyFilters();
        this.canvas.renderAll();
    }
    
    invert(object: fabric.Image) {
        object.filters = [new fabric.Image.filters.Invert()];
        object.applyFilters();
        this.canvas.renderAll();
    }

    vintageEffect(object: fabric.Image) {
        object.filters = [
            new fabric.Image.filters.Sepia(),
            new fabric.Image.filters.Brightness({ brightness: -0.1 }),
            new fabric.Image.filters.Contrast({ contrast: 0.1 })
        ];
        object.applyFilters();
        this.canvas.renderAll();
    }

    clearFilters(object: fabric.Image) {
        object.filters = [];
        object.applyFilters();
        this.canvas.renderAll();
    }
}

export class TextController {
    canvas: fabric.Canvas;
    availableFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'];

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    addText(content = 'Your Text') {
        const text = new fabric.IText(content, {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2,
            fontFamily: 'Arial',
            fontSize: 48,
            fill: '#ffffff',
            originX: 'center',
            originY: 'center',
        });
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        this.canvas.renderAll();
    }

    isText(object: fabric.Object | null): object is fabric.IText {
        return !!object && (object.type === 'i-text' || object.type === 'text');
    }
}

export class ClippingMaskController {
    canvas: fabric.Canvas;
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }
}

export class ExportController {
    canvas: fabric.Canvas;
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }
    exportPNG(options: {multiplier?: number, filename: string} = {filename: 'export.png'}) {
        const dataURL = this.canvas.toDataURL({ format: 'png', quality: 1, multiplier: options.multiplier || 1 });
        saveAs(dataURL, options.filename);
    }
    exportSVG(filename = 'export.svg') {
        const svgData = this.canvas.toSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        saveAs(blob, filename);
    }
    exportJSON(filename = 'project.json') {
        const json = JSON.stringify(this.canvas.toJSON(['id', 'name']));
        const blob = new Blob([json], { type: 'application/json' });
        saveAs(blob, filename);
    }
}
