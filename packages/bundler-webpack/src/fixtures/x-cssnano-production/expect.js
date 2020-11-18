export default ({ indexCSS }) => {
    expect(indexCSS).toContain(`.a{color:red}.a{color:green;background:#00f}`);
};
