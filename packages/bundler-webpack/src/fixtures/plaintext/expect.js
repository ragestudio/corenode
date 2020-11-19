export default ({ indexJS }) => {
    expect(indexJS).toContain(`# foo`);
    expect(indexJS).toContain(`# bar`);
};
