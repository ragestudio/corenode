export default ({ indexJS }) => {
    expect(indexJS).toContain(`default.a.createElement("div"`);
};
