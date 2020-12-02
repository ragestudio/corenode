import { IApi } from '../../../../nodecorejs/src/node_modules/@nodecorejs/types';

export default (api: IApi) => {
  api.addHTMLHeadScripts(() => [
    {
      content: `//! nodecore version: ${process.env.UMI_VERSION}`,
    },
  ]);

  api.addEntryCode(
    () => `
    window.g_nodecore = {
      version: '${process.env.UMI_VERSION}',
    };
  `,
  );
};
