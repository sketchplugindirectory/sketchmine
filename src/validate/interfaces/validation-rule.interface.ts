import { ValidationError } from '../error/validation-error';
import { SketchStyle, SketchFrame, SketchObjectTypes, SketchBase, SketchAttribute } from '@sketch-draw/interfaces';

export type ValidationFunction = (homework: IValidationContext[], currentTask: number) => (ValidationError | boolean)[];

export interface IValidationRule {
  name: string;
  selector: SketchObjectTypes[];
  validation: ValidationFunction;
  description?: string;
  ignoreArtboards?: string[];
  includePages?: string[];
  env?: string[];
  options?: { [key: string]: any };
}

export interface IValidationContext {
  _class: string;
  do_objectID: string;
  name: string;
  parents: IValidationContextParents;
  style?: SketchStyle;
  frame?: SketchFrame;
  ruleOptions: { [key: string]: any };
}

export interface IValidationContextParents {
  page: string;
  artboard: string;
  symbolMaster: string;
}

export enum ValidationRequirements {
  AttributedString = 'attributedString',
  DocumentReference = 'document.json',
  Frame = 'frame',
  LayerSize = 'layersize',
  Style = 'style',
}
