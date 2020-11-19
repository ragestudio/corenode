export default (api) => {
    api.addHTMLHeadScripts(() => [
        {
            content: `//! umi version: ${process.env.UMI_VERSION}`,
        },
    ]);
    api.addEntryCode(() => `
    window.g_umi = {
      version: '${process.env.UMI_VERSION}',
    };
  `);
};
