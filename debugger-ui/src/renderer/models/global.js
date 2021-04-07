export default {
  namespace: 'global',
  state: {

  },
  effects: {},
  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload, }
    },
  },
};
