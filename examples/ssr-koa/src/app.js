import { isBrowser, setLocale } from 'nodecore';
import { setCookie, getCookie } from './utils/cookie';

export const locale = {
  getLocale() {
    let lang;
    if (isBrowser()) {
      const navigatorLang = window.navigator.language.includes('zh')
        ? 'zh-CN'
        : 'en-US';
      lang = getCookie('umi_locale') || navigatorLang || 'zh-CN';
    } else {
      lang = getCookie('umi_locale') || global._navigatorLang || 'zh-CN';
    }
    return lang;
  },
  setLocale({ lang, realReload = false, updater }) {
    if (!isBrowser()) {
      console.error('---------设置语音失败非浏览器环境--------');
      return;
    }
    if (!lang) {
      console.error('---------必须输入要切换的语言，否则无法切换--------');
      return;
    }
    localStorage.setItem('umi_locale', lang);
    setCookie('umi_locale', lang, null, 10000);
    if (realReload) {
      window.location.reload();
    }
    updater();
  },
};
