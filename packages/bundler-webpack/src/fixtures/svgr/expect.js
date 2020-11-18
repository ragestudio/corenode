export default ({ indexJS }) => {
    expect(indexJS).toContain(`__webpack_require__.p + "static/logo.`);
};
