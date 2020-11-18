export default ({ indexJS }) => {
    expect(indexJS).toContain(`console.log(a)`);
};
