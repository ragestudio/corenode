import React from 'react';
import { __RouterContext as RouterContext, matchPath } from '@nodecorejs/runtime';
export default function Switch(props) {
    return (<RouterContext.Consumer>
      {(context) => {
        const { children, ...extraProps } = props;
        const { location } = context;
        let element, match = null;
        React.Children.forEach(children, (child) => {
            if (match === null && React.isValidElement(child)) {
                element = child;
                const path = child.props.path || child.props.from;
                match = path
                    ? matchPath(location.pathname, { ...child.props, path })
                    : context.match;
            }
        });
        return match
            ? React.cloneElement(element, {
                location,
                computedMatch: match,
                layoutProps: extraProps,
            })
            : null;
    }}
    </RouterContext.Consumer>);
}
