import * as path from 'path';
import chalk from 'chalk';
import * as puppeteer from 'puppeteer';
import { Sketch } from '@sketch-draw/sketch';
import { Drawer } from './drawer';
import { ITraversedElement, TraversedLibrary, TraversedPage } from '../dom-traverser/traversed-dom';
import { exec } from 'child_process';
import { SketchGenerator } from './sketch-generator';
import { readFile, Logger } from '@utils';
import { sketchGeneratorApi } from './sketch-generator-api';
import { AssetHelper } from '../dom-traverser/asset-helper';
import { DomVisitor } from '../dom-traverser/dom-visitor';
import { DomTraverser } from '../dom-traverser/dom-traverser';

const log = new Logger();
const config = require(`${process.cwd()}/config/app.json`);
const TRAVERSER = path.join(process.cwd(), config.sketchGenerator.traverser);

export class ElementFetcher {
  // private _assetHsandler: AssetHandler = new AssetHandler();
  private _result: (TraversedPage | TraversedLibrary)[] = [];
  constructor(public conf: SketchGenerator.Config) { }

  async generateSketchFile(): Promise<number> {
    const drawer = new Drawer();
    const sketch = new Sketch(this.conf.outFile);
    const pages = [];
    let symbolsMaster = drawer.drawSymbols({ symbols: [] } as any);

    if (
      this._result.length === 1 &&
      this._result[0] !== undefined &&
      this._result[0].type === 'library'
    ) {
      symbolsMaster = drawer.drawSymbols(this._result[0] as TraversedLibrary);
    } else if (this._result.length > 0) {
      // TODO: implement function to write pages;
    }

    // TODO: add asset handler
    // if (this.hasAssets()) {
    //   sketch.prepareFolders();
    //   await this.downloadAssets();
    // }
    await sketch.write([symbolsMaster, ...pages]);
    sketch.cleanup();

    if (process.env.SKETCH === 'open-close') {
      exec(`open ${this.conf.outFile}`);
    }
    return Promise.resolve(0);
  }

  /**
   * Checks if there are assets in the symbols
   * @returns boolean
   */
  // private hasAssets(): boolean {
  //   return this._result.some(res => res.some(symbol => Object.keys(symbol.assets).length > 0));
  // }

  /**
   * Download all Assets for all pages to the folder
   */
  // private async downloadAssets() {
  //   this._assetHandler.clean();
  //   if (process.env.DEBUG) {
  //     console.log(chalk`\n📷\t{blueBright Downloading images}:`);
  //   }
  //   const assets = this._symbols.map(symbol => this._assetHandler.download(symbol.assets));
  //   await Promise.all(assets);
  // }

  async getPage(browser: puppeteer.Browser, url: string): Promise<TraversedPage | TraversedLibrary> {
    const traverser = await readFile(TRAVERSER);
    let result: any;

    if (this.conf.library) {
      result = await sketchGeneratorApi(browser, url, this.conf.rootElement, traverser);
    } else {
      const page = await browser.newPage();
      await page.evaluateOnNewDocument(traverser);
      await page.evaluateOnNewDocument(
        (rootElement: string) => {
          const images = new AssetHelper();
          window.page = {
            type: 'page',
            pageUrl: window.location.pathname.substr(1),
            pageTitle: document.title,
            assets: images.assets,
            element: null,
          };
          const hostElement = document.querySelector(rootElement) as HTMLElement;
          const visitor = new DomVisitor(hostElement);
          const traverser = new DomTraverser();
          window.page.element = traverser.traverse(hostElement, visitor);
        },
        this.conf.rootElement);

      await page.goto(url, { waitUntil: 'networkidle2' });
      result = await page.evaluate(() => window.page) as ITraversedElement[];
    }
    return Promise.resolve(result);
  }

  async collectElements() {
    const options = process.env.DOCKER ?  {
      /**
       * shared memory space 64MB. Cause chrome to crash when rendiring large pages
       * @example https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#tips
       */
      // ...this.conf.chrome,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
      executablePath: '/usr/bin/chromium-browser',
    } : {
      // ...this.conf.chrome,
      headless: false,
      devtools: true,
    };

    // options.
    // const options: puppeteer.LaunchOptions = Object.assign(
    //   process.env.DEBUG ? { headless: false, devtools: true } : {},
    //   {
    //     ...this.conf.chrome,
    //     args: ['--disable-dev-shm-usage', '--no-sandbox', '--headless', '--disable-gpu'],
    //     executablePath: '/usr/bin/chromium-browser',
    //   },
    // );
    const browser = await puppeteer.launch(options);
    const confPages = this.conf.pages || [''];

    for (let i = 0, max = confPages.length; i < max; i += 1) {
      const page = confPages[i];

      const url = new URL(page, `${this.conf.host.protocol}://${this.conf.host.name}:${this.conf.host.port}`);
      log.debug(chalk`🛬\t{cyanBright Fetching Page}: ${url.href}`);
      this._result.push(await this.getPage(browser, url.href));
    }

    await browser.close();
  }
}
