export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`.foo { flex: 1 1; }`);
};
