import * as ts from 'typescript';
import { resolve } from 'path';
import { createDebug } from '@nodecorejs/libs';
const debug = createDebug('umi:dtstest');
const typeCheckFile = (files) => {
    let program = ts.createProgram(files, {});
    let diagnostic = [];
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            diagnostic = [...diagnostic, ...program.getSemanticDiagnostics(sourceFile)];
        }
    }
    debug('diagnostic: ', diagnostic);
    return diagnostic.length === 0;
};
export default ({ indexCSS, files, cwd }) => {
    expect(indexCSS).toContain(`.a___`);
    expect(indexCSS).toContain(`.test___`);
    expect(typeCheckFile([resolve(cwd, 'index.ts')])).toBe(true);
};
