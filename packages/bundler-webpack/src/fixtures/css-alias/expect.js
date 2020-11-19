export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`.foo {`);
    expect(indexCSS).toContain(`.bar {`);
    expect(indexCSS).toContain(`.b {`);
};
