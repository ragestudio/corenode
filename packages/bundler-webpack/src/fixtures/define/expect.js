export default ({ indexJS }) => {
    expect(indexJS).toContain(`console.log("1");`);
    expect(indexJS).toContain(`console.log("2");`);
    expect(indexJS).toContain(`console.log("3");`);
    expect(indexJS).toContain(`console.log("test");`);
};
