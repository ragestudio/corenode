export default ({ indexJS }) => {
    expect(indexJS).toContain(`var a = 'react';`);
};
