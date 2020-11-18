export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`.b___`);
    expect(indexCSS).toContain(`color: #333;`);
    expect(indexCSS).toContain(`.a {`);
};
