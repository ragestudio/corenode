export default ({ indexJS }) => {
    expect(indexJS).toContain(`module.exports = React;`);
};
