export default ({ indexJS, files }) => {
    expect(indexJS).toContain(`console.log('a');`);
    expect(indexJS).toContain(`console.log('b');`);
};
