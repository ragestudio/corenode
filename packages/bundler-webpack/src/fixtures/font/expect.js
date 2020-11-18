export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`src: url(./static/a.`);
    expect(indexCSS).toContain(`.eot);`);
};
