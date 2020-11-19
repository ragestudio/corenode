import React from 'react';
import { __RouterContext as RouterContext } from '@nodecorejs/runtime';
export default function Route(props) {
    return (<RouterContext.Consumer>
      {(context) => {
        const { location } = context;
        const match = props.computedMatch;
        const newProps = { ...context, location, match };
        let { render } = props;
        return (<RouterContext.Provider value={newProps}>
            {newProps.match
            ? render({
                ...props.layoutProps,
                ...newProps,
            })
            : null}
          </RouterContext.Provider>);
    }}
    </RouterContext.Consumer>);
}
