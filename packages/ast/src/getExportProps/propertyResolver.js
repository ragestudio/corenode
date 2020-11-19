import { t } from '@nodecorejs/utils';
const StringResolver = {
    is(src) {
        return t.isStringLiteral(src);
    },
    get(src) {
        return src.value;
    },
};
const NumberResolver = {
    is(src) {
        return t.isNumericLiteral(src);
    },
    get(src) {
        return src.value;
    },
};
const BooleanResolver = {
    is(src) {
        return t.isBooleanLiteral(src);
    },
    get(src) {
        return src.value;
    },
};
const NullResolver = {
    is(src) {
        return t.isNullLiteral(src);
    },
    get(src) {
        return null;
    },
};
const UndefinedResolver = {
    is(src) {
        return t.isIdentifier(src) && src.name === 'undefined';
    },
    get(src) {
        return undefined;
    },
};
const ObjectLiteralResolver = {
    is(src) {
        return t.isObjectExpression(src);
    },
    get(src) {
        return findObjectLiteralProperties(src);
    },
};
const ObjectResolver = {
    is(src) {
        return t.isObjectExpression(src);
    },
    get(src) {
        return findObjectMembers(src);
    },
};
const ClassResolver = {
    is(src) {
        return t.isClass(src);
    },
    get(src) {
        return findClassStaticProperty(src);
    },
};
const ArrayLiteralResolver = {
    is(src) {
        return t.isArrayExpression(src);
    },
    get(src) {
        return findArrayLiteralElements(src);
    },
};
const ArrayResolver = {
    is(src) {
        return t.isArrayExpression(src);
    },
    get(src) {
        return findArrayElements(src);
    },
};
const FunctionResolver = {
    is(src) {
        return t.isFunctionExpression(src);
    },
    get(src) {
        return function () { };
    },
};
const ArrowFunctionResolver = {
    is(src) {
        return t.isArrowFunctionExpression(src);
    },
    get(src) {
        return () => { };
    },
};
export const LITERAL_NODE_RESOLVERS = [
    StringResolver,
    NumberResolver,
    BooleanResolver,
    NullResolver,
    UndefinedResolver,
    ObjectLiteralResolver,
    ArrayLiteralResolver,
];
export const NODE_RESOLVERS = [
    StringResolver,
    NumberResolver,
    BooleanResolver,
    NullResolver,
    UndefinedResolver,
    ObjectResolver,
    ArrayResolver,
    ClassResolver,
    FunctionResolver,
    ArrowFunctionResolver,
];
export function findObjectLiteralProperties(node) {
    const target = {};
    node.properties.forEach((p) => {
        if (t.isObjectProperty(p) && t.isIdentifier(p.key)) {
            const resolver = LITERAL_NODE_RESOLVERS.find((resolver) => resolver.is(p.value));
            if (resolver) {
                target[p.key.name] = resolver.get(p.value);
            }
        }
    });
    return target;
}
export function findObjectMembers(node) {
    const target = {};
    node.properties.forEach((p) => {
        if (t.isObjectMember(p) && t.isIdentifier(p.key)) {
            if (t.isObjectMethod(p)) {
                target[p.key.name] = () => { };
            }
            else {
                const resolver = NODE_RESOLVERS.find((resolver) => resolver.is(p.value));
                if (resolver) {
                    target[p.key.name] = resolver.get(p.value);
                }
            }
        }
    });
    return target;
}
export function findClassStaticProperty(node) {
    function isStaticNode(p) {
        return 'static' in p && p.static === true;
    }
    let body = node.body;
    if (!t.isClassBody(body))
        return;
    const target = {};
    body.body.forEach((p) => {
        if (isStaticNode(p) && t.isIdentifier(p.key)) {
            if (t.isMethod(p) || t.isTSDeclareMethod(p)) {
                target[p.key.name] = () => { };
            }
            else {
                const resolver = NODE_RESOLVERS.find((resolver) => resolver.is(p.value));
                if (resolver) {
                    target[p.key.name] = resolver.get(p.value);
                }
            }
        }
    });
    return target;
}
export function findArrayLiteralElements(node) {
    const target = [];
    node.elements.forEach((p) => {
        const resolver = LITERAL_NODE_RESOLVERS.find((resolver) => resolver.is(p));
        if (resolver) {
            target.push(resolver.get(p));
        }
    });
    return target;
}
export function findArrayElements(node) {
    const target = [];
    node.elements.forEach((p) => {
        const resolver = NODE_RESOLVERS.find((resolver) => resolver.is(p));
        if (resolver) {
            target.push(resolver.get(p));
        }
    });
    return target;
}
