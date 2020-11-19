export default ({ indexJS }) => {
    expect(indexJS).toContain(`JSON.parse("{\\"foo\\":\\"react\\"}");`);
};
