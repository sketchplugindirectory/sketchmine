import { generateVariantName } from './generate-variant-name';
import { AMP } from '../meta-information';

type Porperty = AMP.VariantMethod | AMP.VariantProperty;

describe('[angular-meta-parser] › utils › generate variant name', () => {

  test('generate name for button primary', () => {
    const variants: Porperty[] =  [{ type: 'property', key: 'variant', value: '"primary"' }];
    const name = generateVariantName('DtButton', variants);
    expect(name).toMatch('button/primary/default');
  });

  test('generate name for button primary with color main but properties are alphabetically sorted', () => {
    const variants: Porperty[] =  [
      { type: 'property', key: 'variant', value: '"primary"' },
      { type: 'property', key: 'color', value: '"main"' },
    ];
    const name = generateVariantName('DtButton', variants);
    expect(name).toMatch('button/main/primary/default');
  });

  test('generate name for button primary with color main and disabled', () => {
    const variants: Porperty[] =  [
      { type: 'property', key: 'variant', value: '\"primary\"' },
      { type: 'property', key: 'color', value: '\"main\"' },
      { type: 'property', key: 'disabled', value: 'true' },
    ];
    const name = generateVariantName('DtButton', variants);
    expect(name).toMatch('button/main/primary/disabled');
  });

  test('generate name for button with attribute disabled, but put disabled always at last', () => {
    const variants: Porperty[] =  [
      { type: 'property', key: 'disabled', value: 'true' },
      { type: 'property', key: 'variant', value: '\"primary\"' },
      { type: 'property', key: 'color', value: '\"main\"' },
    ];
    const name = generateVariantName('DtButton', variants);
    expect(name).toMatch('button/main/primary/disabled');
  });

  test('handle undefined as value', () => {
    const variants: Porperty[] =  [
      { type: 'property', key: 'severity', value: 'undefined' },
    ];
    expect(() => generateVariantName('DtAlert', variants))
      .toThrowError('Value have to be defined for name generation!');
  });

  test('handle boolean values like required', () => {
    const variants: Porperty[] =  [
      { type: 'property', key: 'required', value: 'true' },
    ];
    const name = generateVariantName('DtInlineEditor', variants);
    expect(name).toMatch('inline-editor/required/default');
  });

  test('handle only action item', () => {
    const variants: Porperty[] =  [
      { type: 'property', key: 'disabled', value: 'true' },
    ];
    const name = generateVariantName('DtButton', variants);
    expect(name).toMatch('button/disabled');
  });
});
