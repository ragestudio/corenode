export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`.a { display: -ms-flexbox; display: flex; }`);
};
