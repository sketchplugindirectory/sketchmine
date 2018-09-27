import * as ts from 'typescript';
import * as path from 'path';
import { findNode, createExamplesMap, createSketchLibraryModule, createImportDeclaration } from './ast';
import { getSymbolName } from '@angular-meta-parser/utils';
import { writeFile, Logger } from '@utils';
import chalk from 'chalk';

const log = new Logger();
const ANGULAR_COMPONENTS = [
  'DtAlertModule',
  'DtBreadcrumbsModule',
  'DtButtonModule',
  'DtButtonGroupModule',
  'DtCardModule',
  'DtChartModule',
  'DtCheckboxModule',
  'DtContextDialogModule',
  'DtCopyToClipboardModule',
  'DtExpandablePanelModule',
  'DtExpandableSectionModule',
  'DtFormFieldModule',
  'DtIconModule',
  'DtInlineEditorModule',
  'DtInputModule',
  'DtKeyValueListModule',
  'DtLoadingDistractorModule',
  'DtPaginationModule',
  'DtProgressBarModule',
  'DtProgressCircleModule',
  'DtRadioModule',
  'DtShowMoreModule',
  'DtSwitchModule',
  'DtTableModule',
  'DtTagModule',
  'DtThemingModule',
  'DtTileModule',
];

/**
 * @class
 * @description
 * The MemoryCompiler holds all Source Files for the Variants
 * and compiles them into files and updates the imports for the modules.
 */
export class MemoryCompiler {
  private static _instance: MemoryCompiler;
  protected _examples: ts.SourceFile[] = [];
  protected _dependencies: ts.SourceFile[] = [];
  libraryModule: ts.SourceFile;
  moduleList: Map<string, string>;

  constructor() {
    if (MemoryCompiler._instance) {
      return MemoryCompiler._instance;
    }
    MemoryCompiler._instance = this;
  }

  /**
   * adds transformed examples to a list
   * @param sourceFiles SourceFile or array of SourceFiles with the examples
   */
  addSourceFiles(sourceFiles: ts.SourceFile | ts.SourceFile[]) {
    if (Array.isArray(sourceFiles)) {
      this._examples.push(...sourceFiles);
    } else {
      this._examples.push(sourceFiles);
    }
  }

  addDependency(sourceFile: ts.SourceFile) {
    this._dependencies.push(sourceFile);
  }

  generateModule() {
    this.moduleList = this.generateModuleList();
    const modules = [...this.moduleList.keys()];
    const blank = ts.createSourceFile(
      'app.module.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS,
    );
    const imports: ts.ImportDeclaration[] = [];
    this.moduleList.forEach((path, name) => {
      imports.push(createImportDeclaration([name], path));
    });

    this.libraryModule = ts.updateSourceFileNode(blank, [
      createImportDeclaration(['NgModule'], '@angular/core'),
      createImportDeclaration(['BrowserModule'], '@angular/platform-browser'),
      createImportDeclaration(['BrowserAnimationsModule'], '@angular/platform-browser/animations'),
      createImportDeclaration(['HttpClientModule'], '@angular/common/http'),
      createImportDeclaration(['PortalModule'], '@angular/cdk/portal'),
      createImportDeclaration(['FormsModule', 'ReactiveFormsModule'], '@angular/forms'),
      createImportDeclaration(['AppComponent'], './app.component'),
      createImportDeclaration(['EXAMPLES_MAP'], './examples-registry'),
      createImportDeclaration(ANGULAR_COMPONENTS, '@dynatrace/angular-components'),
      ...imports,
      createExamplesMap(this.moduleList),
      createSketchLibraryModule(modules, ANGULAR_COMPONENTS),
    ]);
  }

  private generateModuleList(): Map<string, string> {
    const modules = new Map<string, string>();
    this._examples.forEach((sf) => {
      const classDec = findNode(sf, ts.SyntaxKind.ClassDeclaration) as ts.ClassDeclaration;
      modules.set(getSymbolName(classDec), resolveImport(sf.fileName));
    });
    return modules;
  }

  /**
   * write all typescript source files to memory
   * @param angularApp path to the angular Appshell clone
   * @param writeToFileSystem if it should write the changes to fs
   */
  async printFiles(angularApp: string, writeToFileSystem = true) {
    const baseDir = path.join(angularApp, 'src', 'app');
    this.generateModule();

    const filesToBeWritten = [];

    const files = [...this._examples, ...this._dependencies, this.libraryModule];
    for (let i = 0, max = files.length; i < max; i += 1) {
      const file = files[i];
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      const resultFile = ts.createSourceFile(file.fileName, '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
      const result = printer.printNode(ts.EmitHint.Unspecified, file, resultFile);
      if (writeToFileSystem) {
        filesToBeWritten.push(writeFile(path.resolve(baseDir, file.fileName), result));
      } else {
        log.debug(chalk`Queue file for writing: {cyanBright ${path.resolve(baseDir, file.fileName)}}`);
      }
    }

    await Promise.all(filesToBeWritten);
  }
}

function resolveImport(moduleFile: string) {
  if (moduleFile.startsWith('./')) {
    return moduleFile.replace('.ts', '');
  }
  return `./${moduleFile.replace('.ts', '')}`;
}