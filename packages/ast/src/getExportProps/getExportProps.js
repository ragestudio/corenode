import { t, traverse } from '@nodecorejs/utils';
import { parse } from '../utils/parse';
import { NODE_RESOLVERS, findArrayElements, findObjectMembers, } from './propertyResolver';
export function getExportProps(code) {
    const ast = parse(code);
    let props = undefined;
    traverse.default(ast, {
        Program: {
            enter(path) {
                const node = path.node;
                const defaultExport = findExportDefault(node);
                if (!defaultExport)
                    return;
                if (t.isIdentifier(defaultExport)) {
                    const { name } = defaultExport;
                    props = findAssignmentExpressionProps({
                        programNode: node,
                        name,
                    });
                }
                else if (t.isObjectExpression(defaultExport)) {
                    props = findObjectMembers(defaultExport);
                }
                else if (t.isArrayExpression(defaultExport)) {
                    props = findArrayElements(defaultExport);
                }
                else {
                    const resolver = NODE_RESOLVERS.find((resolver) => resolver.is(defaultExport));
                    if (resolver) {
                        props = resolver.get(defaultExport);
                    }
                }
            },
        },
    });
    return props;
}
function findExportDefault(programNode) {
    for (const n of programNode.body) {
        if (t.isExportDefaultDeclaration(n)) {
            return n.declaration;
        }
    }
    return null;
}
function findAssignmentExpressionProps(opts) {
    const props = {};
    for (const n of opts.programNode.body) {
        let node = n;
        if (t.isExpressionStatement(node)) {
            node = node.expression;
        }
        if (t.isAssignmentExpression(node) &&
            t.isMemberExpression(node.left) &&
            t.isIdentifier(node.left.object) &&
            node.left.object.name === opts.name) {
            const resolver = NODE_RESOLVERS.find((resolver) => resolver.is(t.isAssignmentExpression(node) && node.right));
            if (resolver) {
                props[node.left.property.name] = resolver.get(node.right);
            }
        }
    }
    return props;
}
