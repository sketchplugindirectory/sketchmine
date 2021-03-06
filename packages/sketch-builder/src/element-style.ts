import { ITraversedDomElement } from '@sketchmine/dom-agent';
import {
  Border,
  createBorder,
  IBounding,
  Rectangle,
  resolveBorder,
  ShapeGroup,
  SketchRectangle,
  SketchShapeGroup,
  SketchShapePath,
  Style,
} from '@sketchmine/sketch-file-format';
import { StyleDeclaration } from '@sketchmine/helpers';

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

    const background = new ShapeGroup(this.frame);
    background.name = 'Background';
    background.addRotation(this.styles.transform);
    background.clippingMask = true;
    background.style = this.createStyles().generateObject();
    const rectangle = new Rectangle(this.frame, borderRadius.map(b => parseInt(b, 10)));
    rectangle.name = 'Background Shape';

    background.layers.push(rectangle.generateObject());
    layers.push(background.generateObject());

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
