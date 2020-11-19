export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`.b___`);
    expect(indexCSS).toContain(`.a { color: red; }`);
};
