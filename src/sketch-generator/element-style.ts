import { ITraversedDomElement } from '../dom-traverser/traversed-dom';
import { StyleDeclaration } from '../dom-traverser/dom-visitor';
import { IBounding, SketchRectangle, SketchShapeGroup, SketchShapePath } from './sketch-draw/interfaces';
import { resolveBorder, Border } from './sketch-draw/helpers';
import { Rectangle } from './sketch-draw/models/rectangle';
import { Style } from './sketch-draw/models/style';
import { createBorder } from './sketch-draw/helpers/create-border';

export type ElementStyleObjects = SketchShapePath | SketchRectangle | SketchShapeGroup;

export class ElementStyle {

  styles: StyleDeclaration;
  border: Border | (Border | null)[] | null;
  constructor(element: ITraversedDomElement, public frame: IBounding) {
    this.styles = element.styles;
    this.border = resolveBorder(this.styles);
  }

  createElementStyle(): ElementStyleObjects[] {
    const layers = [];
    const borderRadius = [
      this.styles.borderTopLeftRadius,
      this.styles.borderTopRightRadius,
      this.styles.borderBottomRightRadius,
      this.styles.borderBottomLeftRadius,
    ];

    const rectangle = new Rectangle(this.frame, borderRadius.map(b => parseInt(b, 10)));
    rectangle.name = 'Background';
    rectangle.addRotation(this.styles.transform);
    rectangle.style = this.createStyles().generateObject();

    layers.push(rectangle.generateObject());

    if (this.border && Array.isArray(this.border)) {
      // create manual borders with lines
      layers.push(...createBorder(this.styles, this.frame));
    }

    return layers;
  }

  private createStyles(): Style {
    const style = new Style();
    if (!this.styles) {  return; }

    if (this.border && !Array.isArray(this.border)) {
      style.addBorder(this.border.color, this.border.width);
    }
    if (this.styles.backgroundColor) {
      style.addFill(this.styles.backgroundColor);
    }
    if (this.styles.opacity) {
      style.opacity = parseInt(this.styles.opacity, 10);
    }

    return style;
  }
}
