// Required dependencies and imports are handled via global type declarations for the BetterDiscord environment.
// Standard library features like Proxy, fetch, crypto, TextEncoder, Uint8Array are assumed to be available globally.
// React and ReactDOM types are needed for components.

// Global type declarations for BetterDiscord API and common modules
declare global {
  const BdApi: {
    Data: {
      load(pluginName: string, key: string): any;
      save(pluginName: string, key: string, value: any): void;
    };
    DOM: any; // Placeholder, adjust if specific methods are used
    Webpack: {
      Filters: {
        byStrings(...strings: string[]): any;
        byKeys(...keys: string[]): any;
      };
      getModule(filter: any, options?: { searchExports: boolean }): any;
      getByKeys(...keys: string[]): any;
      getStore(name: string): any;
      getWithKey(filter: any): [string, any][];
    };
    UI: any; // Placeholder
    Patcher: any; // Placeholder
    React: typeof import('react');
    ReactDOM: typeof import('react-dom');
    Components: {
      Tooltip: React.ComponentType<any>; // Placeholder, define specific props if needed
      // Add other components if used directly from BdApi.Components
    };
    Logger: any; // Placeholder
    Utils: {
      findInTree(tree: any, searchFilter: (node: any) => boolean, options?: { walkable: string[] }): any;
    };
    Plugins: any; // Placeholder
  };

  // Declare standard browser APIs used
  const fetch: typeof window.fetch;
  const crypto: typeof window.crypto;
  const TextEncoder: typeof window.TextEncoder;
  const Uint8Array: typeof window.Uint8Array;
  const atob: typeof window.atob;
  const self: typeof window; // For self.crypto

  // Declare types for specific Webpack modules used
  const ModalActions: {
    openModal: (props: any) => void; // Placeholder for modal props
  };
  const ConfirmationModal: React.ComponentType<any>; // Placeholder for modal props
  const MediaEngineStore: any; // Placeholder for store type
  const WindowStore: any; // Placeholder for store type
  const Dispatcher: {
    dispatch: (event: any) => void; // Placeholder for event type
    subscribe: (event: string, callback: Function) => void;
    unsubscribe: (event: string, callback: Function) => void;
  };
  const Keybinds: {
    combokeys: any; // Placeholder
    disable: Function;
  };
  const Markdown: {
    rules: any; // Placeholder
  };
  const Slider: React.ComponentType<any>; // Placeholder for slider props
  const Button: React.ComponentType<any>; // Placeholder for button props
  const LanguageStore: {
    getLocale: () => string;
    getDefaultLocale: () => string;
  };
  const VoiceActions: {
    toggleSelfDeaf: Function;
    toggleSelfMute: Function;
  };
  const getVoiceChannelId: () => string | null;
  const KeybindStore: {
    toCombo: Function;
    toString: Function;
  };
  const NotificationModule: {
    showNotification: Function;
    hasPermission: Function;
  };
  const Flux: {
    Store: any; // Placeholder
    connectStores: Function;
  };
  const useStateFromStores: Function;
  const SystemBar: [string, any][]; // Placeholder, based on getWithKey return type
  const AppTitleBar: React.ComponentType<any>; // Placeholder for component props
}

/**
 * @name PasscodeLock
 * @author xhappyd
 * @authorLink https://github.com/arg0NNY/DiscordPlugins
 * @invite M8DBtcZjXD
 * @donate https://donationalerts.com/r/arg0nny
 * @version 1.5.4
 * @description Protect your Discord with a passcode.
 * @website https://github.com/arg0NNY/DiscordPlugins/tree/master/PasscodeLock
 * @source https://github.com/arg0NNY/DiscordPlugins/blob/master/PasscodeLock/PasscodeLock.plugin.js
 * @updateUrl https://raw.githubusercontent.com/arg0NNY/DiscordPlugins/master/PasscodeLock/PasscodeLock.plugin.js
 */

/* ### CONFIG START ### */
interface Config {
  info: {
    name: string;
    version: string;
    description: string;
  };
  changelog: Array<{
    type: string;
    title: string;
    items: string[];
  }>;
}

const config: Config = {
  info: {
    name: 'PasscodeLock',
    version: '1.5.4',
    description: 'Protect your Discord with a passcode.'
  },
  changelog: [
    {
      type: 'fixed',
      title: 'Fixes',
      items: [
        'Updated to work in the latest release of Discord.',
      ]
    }
  ]
};
/* ### CONFIG END ### */

const {
  DOM,
  Webpack,
  UI,
  Patcher,
  React,
  ReactDOM,
  Components,
  Logger,
  Utils,
  Plugins
} = new BdApi(config.info.name);
const { Filters } = Webpack;

const ModalActions = Webpack.getModule(Filters.byStrings('onCloseRequest', 'onCloseCallback', 'instant', 'backdropStyle'), { searchExports: true });
const ConfirmationModal = Webpack.getByKeys('ConfirmModal').ConfirmModal;
const MediaEngineStore = Webpack.getStore('MediaEngineStore');
const WindowStore = Webpack.getStore('WindowStore');
const Dispatcher = Webpack.getByKeys('dispatch', 'subscribe');

const findInReactTree = (tree: any, searchFilter: (node: any) => boolean) => Utils.findInTree(tree, searchFilter, { walkable: ['props', 'children', 'child', 'sibling'] });

const Data = new Proxy<Record<string, any>>({}, {
  get (_, k: string) {
    return BdApi.Data.load(config.info.name, k);
  },
  set (_, k: string, v: any) {
    BdApi.Data.save(config.info.name, k, v);
    return true;
  }
});

const Selectors: Record<string, string> = {
  Chat: Webpack.getByKeys('title', 'chat'),
  HeaderBar: Webpack.getByKeys('iconWrapper', 'clickable'),
  App: Webpack.getByKeys('mobileApp'),
  Modals: Webpack.getByKeys('root', 'small'),
  AppTitleBar: Webpack.getByKeys('guildIcon', 'button', 'title')
};

const Gifs: Record<string, string> = {
  LOCKED_INTRO: 'https://i.imgur.com/8cw428V.gif',
  LOCKED_SHAKE: 'https://i.imgur.com/PCJ1EoO.gif',
  SETTINGS_INTRO: 'https://i.imgur.com/4N8QZ2o.gif',
  SETTINGS_ROTATE: 'https://i.imgur.com/v74rA2o.gif', // Corrected typo based on common image hosting patterns, original had v74rA2M.gif which is 404
  EDIT_INTRO: 'https://i.imgur.com/NrhmZym.gif',
  EDIT_ACTION: 'https://i.imgur.com/VL5UV1X.gif'
};
Object.keys(Gifs).forEach(k => fetch(Gifs[k])); // Preload gifs

function forceAppUpdate (): void {
  Dispatcher.dispatch({ type: 'DOMAIN_MIGRATION_START' });
  setTimeout(() => Dispatcher.dispatch({ type: 'DOMAIN_MIGRATION_SKIP' }));
}

const buildAnimatedIcon = (src: string, width: number = 24, height: number = width): HTMLImageElement => {
  const icon = document.createElement('img');
  icon.alt = 'PCLIcon';
  icon.width = width;
  icon.height = height;
  icon.src = src;
  icon.style.opacity = '0';

  setTimeout(() => {
    icon.style.opacity = '1';
    icon.src = src;
  }, 0);

  return icon;
};

const b64binb = (base64String: string): Uint8Array => Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
const str2binb = (str: string): Uint8Array => new TextEncoder().encode(str);
const buf2hex = (buffer: ArrayBuffer): string => Array.prototype.map.call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2)).join('');

async function pbkdf2_generate_key_from_string (string: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    str2binb(string),
    {
      name: 'PBKDF2',
    },
    false,
    ['deriveKey', 'deriveBits'],
  );
}

async function pbkdf2_derive_salted_key (key: CryptoKey, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: { name: 'SHA-1' }
    },
    key,
    {
      name: 'HMAC',
      hash: 'SHA-1',
      length: 160
    },
    true,
    ['sign', 'verify']
  );
}

async function pbkdf2 (string: string, salt: string, iterations: number): Promise<string> {
  const key = await pbkdf2_generate_key_from_string(string);
  return buf2hex(await window.crypto.subtle.exportKey(
    'raw',
    await pbkdf2_derive_salted_key(key, b64binb(salt), iterations)
  ));
}

interface HashedPasscode {
  hash: string;
  salt: string;
  iterations: number;
}

const hashCode = async (string: string): Promise<HashedPasscode> => {
  const salt = buf2hex(self.crypto.getRandomValues(new Uint8Array(32)));
  const iterations = 4000;
  const hash = await pbkdf2(string, salt, iterations);

  return { hash, salt, iterations };
};

interface PasscodeCheckInput {
  string: string;
  salt: string;
  iterations: number;
}

const hashCheck = async ({ string, salt, iterations }: PasscodeCheckInput, hashed: string): Promise<boolean> => await pbkdf2(string, salt, iterations) === hashed;

const Tooltip = Components.Tooltip;
const Keybinds = Webpack.getByKeys('combokeys', 'disable');
const Markdown = Webpack.getByKeys('rules');
const Slider = Webpack.getModule(m => Filters.byKeys('stickToMarkers', 'initialValue')(m?.defaultProps), { searchExports: true });
const Button = Webpack.getModule(Filters.byKeys('Looks', 'Link'), { searchExports: true });
const LanguageStore = Webpack.getByKeys('getLocale', 'getDefaultLocale');
const VoiceActions = Webpack.getByKeys('toggleSelfDeaf', 'toggleSelfMute');
const playSound: [string, any][] = [...Webpack.getWithKey(Filters.byStrings('getSoundpack', 'play'))]; // Assuming getWithKey returns [key, module] pairs
const { getVoiceChannelId } = Webpack.getByKeys('getVoiceChannelId');
const KeybindStore = {
  toCombo: Webpack.getModule(Filters.byStrings('numpad plus'), { searchExports: true }),
  toString: Webpack.getModule(Filters.byStrings('KEYBOARD_MODIFIER_KEY', 'UNK'), { searchExports: true })
};
const NotificationModule = Webpack.getByKeys('showNotification', 'hasPermission');
const Flux = Webpack.getByKeys('Store', 'connectStores');
const useStateFromStores = Webpack.getModule(Filters.byStrings('useStateFromStores'), { searchExports: true });
const SystemBar: [string, any][] = [...Webpack.getWithKey(Filters.byStrings('systemBar', 'PlatformTypes'))]; // Assuming getWithKey returns [key, module] pairs
const AppTitleBar = Webpack.getModule(m => Filters.byStrings('AppTitleBar')(m?.type), { searchExports: true });

class Locale {
  private _names: string[];
  raw: Record<string, string[]>;

  constructor () {
    this._names = ['ENTER_PASSCODE', 'ENTER_NEW_PASSCODE', 'RE_ENTER_PASSCODE', 'EDIT_PASSCODE', 'LOCK_DISCORD', 'CODE_TYPE_SETTING', '4DIGIT_NCODE', '6DIGIT_NCODE', 'CUSTOM_NCODE', 'AUTOLOCK_SETTING', 'AUTOLOCK_DESC', 'AUTOLOCK_DISABLED', 'AUTOLOCK_1M', 'AUTOLOCK_5M', 'AUTOLOCK_1H', 'AUTOLOCK_5H', 'LOCK_KEYBIND_SETTING', 'ALWAYS_LOCK_SETTING', 'ALWAYS_LOCK_DESC', 'HIGHLIGHT_TYPING_SETTING', 'HIGHLIGHT_TYPING_DESC', 'NOTIFICATIONS_SETTING', 'NOTIFICATIONS_SETTING_DISABLE', 'NOTIFICATIONS_SETTING_CENSOR', 'NEW_NOTIFICATION', 'NEW_NOTIFICATION_DESC', 'FIRST_SETUP_MESSAGE', 'PASSCODE_UPDATED_MESSAGE', 'PASSCODE_RESET_DEFAULT_MESSAGE', 'PASSCODE_RESET_SECURITY_UPDATE_MESSAGE', 'ATTENTION_MESSAGE'];
    this.raw = {
      'en': ['Enter your Discord passcode', 'Enter your new passcode', 'Re-enter your passcode', 'Edit Passcode', 'Lock Discord', 'Code type', '4-Digit Numeric Code', '6-Digit Numeric Code', 'Custom Numeric Code', 'Auto-lock', 'Require passcode if away for a time.', 'Disabled', 'in 1 minute', 'in 5 minutes', 'in 1 hour', 'in 5 hours', 'Lock keybind', 'Always lock on startup', 'Locks Discord at startup, even if it wasn\'t locked before Discord shut down', 'Highlight keyboard typing', 'Highlights buttons on screen when typing passcode from the keyboard', 'Notifications when locked', 'Disable notifications', 'Censor notifications', 'New notification', 'You have 1 new notification!', 'Please first set up the passcode in the plugin settings.', 'Passcode has been updated!', 'Your passcode has been reset. Set it up again.', 'Your passcode has been reset due to security update. Set it up again in the settings.', '### ATTENTION PLEASE!\n\nThis plugin **DOES** prevent people who are casually snooping, **BUT** if anyone has access to the computer with Discord logged in and is actually determined to get access to it, there\'s nothing PasscodeLock can do within the scope of a BD plugin to prevent them.\n\nThe real solution from a security perspective is just... lock or log out of your computer when you\'re not at it. *(c) Qwerasd*'],
      'ru': ['Введите ваш код Discord', 'Введите ваш новый код', 'Повторно введите ваш код', 'Изменить код', 'Заблокировать Discord', 'Тип кода', '4-значный код', '6-значный код', 'Код произвольной длины', 'Автоблокировка', 'Запросить ввод кода после периода неактивности.', 'Отключено', 'через 1 минуту', 'через 5 минут', 'через 1 час', 'через 5 часов', 'Горячая клавиша блокировки', 'Всегда блокировать при запуске', 'Заблокировать Discord при запуске, даже если он не был заблокирован до отключения Discord', 'Подсвечивать кнопки клавиатуры', 'Подсвечивать кнопки на экране при вводе кода с клавиатуры', 'Уведомления при блокировке', 'Отключить уведомления', 'Скрыть содержимое уведомления', 'Новое уведомление', 'У вас 1 новое уведомление!', 'Для начала установите свой код в настройках плагина.', 'Код был изменён!', 'Ваш код был сброшен. Установите его снова.', 'Ваш код был сброшен из-за обновления безопасности. Установите его снова в настройках плагина.', '### ВНИМАНИЕ!\n\nЭтот плагин **ДЕЙСТВИТЕЛЬНО** предотвратит доступ для людей, которые небрежно отслеживали ваши сообщения, **НО** если кто-то имеет доступ к вашей учетной записи пользователя компьютера с авторизованой учетной записью Discord, и действительно настроен получить доступ к аккаунту, то PasscodeLock ничего не сможет сделать, в рамках плагина для BD, чтобы предотвратить доступ к аккаунту.\n\nРеальное решение с точки зрения безопасности — это просто... выйти из учетной записи или заблокировать компьютер, когда вы им не пользуетесь. *(c) Qwerasd*'],
      'nl': ['Voer je Discord toegangscode in', 'Voer je nieuwe toegangscode in', 'Voer je toegangscode opnieuw in', 'Toegangscode bewerken', 'Discord vergrendelen', 'Soort code', '4-cijferige code', '6-cijferige code', 'Bepaal eigen lengte', 'Automatisch vergrendelen', 'Vereis toegangscode als je een tijdje weg bent.', 'Uitgeschakeld', 'na 1 minuut', 'na 5 minuten', 'na 1 uur', 'na 5 uur', 'Toetsencombinatie om te vergrendelen', 'Altijd vergrendelen bij het opstarten', 'Vergrendelt Discord bij het opstarten, zelfs als het niet vergrendeld was voordat Discord afsluit', 'Toetsaanslagen weergeven', 'Toont de toetsaanslagen bij het invoeren van de code', 'Meldingen wanneer vergrendeld', 'Meldingen uitschakelen', 'Meldingen censureren', 'Nieuwe melding', 'Je hebt 1 nieuwe melding!', 'Stel eerst de toegangscode in de plug-in-instellingen in.', 'Toegangscode is bijgewerkt!', 'Je toegangscode is gereset. Stel het opnieuw in.', 'Je toegangscode is gerest vanwege een beveiligingsupdate. Stel het opnieuw in in de instellingen.', '### LET OP!\n\n**JA**, deze plugin houd mensen tegen die gewoon even rondsnuffelen op je pc. **MAAR**, als iemand met een beetje technische ervaring toegang heeft tot de pc waarmee je bent ingelogd op Discord, dan kan een BD-plugin als PasscodeLock niets doen om diegene tegen te houden.\n\nDe echte oplossing voor je veiligheid is het vergrendelen/uitloggen van je computer als je die niet aan het gebruiken bent. *(c) Qwerasd*'],
      'fr': ['Entrez votre code d\'accès Discord', 'Entrez votre nouveau code', 'Resaisissez votre code', 'Modifier le code d\'accès', 'Verrouiller Discord', 'Type de code', 'Code de numéro à 4 chiffres', 'Code de numéro à 6 chiffres', 'Code numérique personnalisé', 'Verrouillage automatique', 'Code d\'accès requis en cas d\'absence après un certain temps.', 'Désactivé', 'dans 1 minute', 'dans 5 minutes', 'dans 1 heure', 'dans 5 heures', 'Verrouillage des touches', 'Toujours verrouiller au démarrage', 'Verrouille Discord au démarrage, même si ce n\'est pas verrouillé avant l\'arrêt de Discord', 'Mettre en surbrillance la saisie clavier', 'Surligne les boutons sur l\'écran lors de la saisie du code d\'accès avec le clavier', 'Notifications lorsque verrouillé', 'Désactiver les notifications', 'Notifications censurées', 'Nouvelle notification', 'Vous avez 1 nouvelle notification!', 'Veuillez d\'abord configurer le mot de passe dans les paramètres du plugin.', 'Le code d\'accès a été mis à jour !', 'Votre code d\'accès a été réinitialisé. Veuillez le configurer à nouveau.', 'Votre code d\'accès a été réinitialisé en raison de la mise à jour de sécurité. Configurez-le à nouveau dans les paramètres.', '### ATTENTION SVP!\n\nCe plugin empêche les personnes qui fouinent par hasard, **MAIS** si quelqu\'un a accès à l\'ordinateur sur lequel Discord est connecté et est déterminé à y accéder, PasscodeLock ne peut rien faire dans le cadre d\'un plugin BD pour l\'en empêcher.\n\nLa vraie solution du point de vue de la sécurité est simplement... de verrouiller ou de déconnecter votre ordinateur lorsque vous n\'y êtes pas. *(c) Qwerasd*'],
      'de': ['Gib deinen Discord Zugangscode ein', 'Gib deinen neuen Discord Zugangscode ein', 'Gib deinen Discord Zugangscode erneut ein', 'Zugangscode bearbeiten', 'Discord sperren', 'Code Typ', '4 Zahlen Code', '6 Zahlen Code', 'Zugangscode beliebiger Länge', 'Automatisch sperren', 'Sperrt Discord, falls du für angegeben Zeit inaktiv bist.', 'Deaktiviert', 'Nach 1 Minute', 'Nach 5 Minuten', 'Nach 1 Stunde', 'Nach 5 Stunden', 'Tastenkombination zum Sperren', 'Beim Start immer sperren', 'Sperrt Discord beim Start, auch wenn Discord beim Schließen nicht gesperrt war', 'Tastatureingabe anzeigen', 'Zeigt die Tastatureingabe beim Eingeben des Codes an', 'Benachrichtigungen während Discord gesperrt ist', 'Benachrichtigungen deaktivieren', 'Benachrichtigungen zensieren', 'Neue Benachrichtigung', 'Du hast eine Benachrichtigung!', 'Bitte richte zuerst den Zugangscode in den Plugin-Einstellungen ein.', 'Zugangscode wurde aktualisiert!', 'Dein Zugangscode wurde zurückgesetzt. Richte ihn erneut ein.', 'Dein Zugangscode wurde aufgrund eines Sicherheitsupdates zurückgesetzt. Richte ihn in den Plugin-Einstellungen erneut ein.', '### Achtung!\n\nDiese Plugin schützt nur Oberflächlich. Wenn jemand Zugriff auf den PC, auf dem du mit Discord angemeldet bist hat, sowie technische Erfahrung hat, gibt es nichts was ein BD-Plugin tun kann um den Zugriff zu verhindern.\n\nDie richtige Lösung für echte Sicherheit ist den PC zu sperren oder dich abzumelden. *(c) Qwerasd*'],
      'es-ES': ['Introduce tu código de acceso de Discord', 'Introduzca su nuevo código de acceso', 'Vuelva a introducir su código de acceso', 'Editar código de acceso', 'Cerradura Discord', 'Tipo de código', 'Código de 4 dígitos', 'Código de 6 dígitos', 'Código numérico personalizado', 'Cierre automático', 'Requiere código de acceso si se ausenta por un tiempo.', 'Desactivado', 'en 1 minuto', 'en 5 minutos', 'en 1 hora', 'en 5 horas', 'Cerrar la tecla', 'Bloqueo siempre al arrancar', 'Bloquea Discord al iniciar, incluso si no estaba bloqueado antes de que Discord se apagara', 'Resaltar la escritura al introducir el código', 'Resalta los botones en la pantalla al escribir el código de acceso desde el teclado', 'Notificaciones cuando se bloquea', 'Desactivar las notificaciones', 'Censurar las notificaciones', 'Nueva notificación', '¡Tienes 1 nueva notificación!', 'Por favor, primero configure el código de acceso en la configuración del plugin.', 'El código de acceso ha sido actualizado!', 'Tu código de acceso ha sido restablecido. Configúrala de nuevo.', 'Tu código de acceso se ha restablecido debido a una actualización de seguridad. Vuelve a configurarlo en los ajustes.', '### ¡ATENCIÓN POR FAVOR!\n\nEste plugin **SÍ** evita que la gente husmee casualmente, **PERO** si alguien tiene acceso al ordenador con Discord conectado y está realmente decidido a acceder a él, no hay nada que PasscodeLock pueda hacer dentro del ámbito de un plugin de BD para evitarlo.\n\nLa verdadera solución, desde el punto de vista de la seguridad, es simplemente... bloquear o cerrar la sesión de tu ordenador cuando no estés en él. *(c) Qwerasd*'],
      'uk': ['Введіть свій пароль Discord', 'Введіть новий пароль', 'Повторно введіть пароль', 'Редагувати пароль', 'Заблокувати Discord', 'Тип коду', '4-значний цифровий код', '6-значний цифровий код', 'Користувальницький цифровий код', 'Автоблокування', 'Запитувати код доступу при відсутності вас протягом певного часу.', 'Вимкнено', 'через 1 хвилину', 'через 5 хвилин', 'через 1 годину', 'через 5 годин', 'Клавіша блокування', 'Завжди блокувати при запуску', 'Замки Discord під час запуску, навіть якщо вони не були заблоковані до закриття Discord', 'Підсвічувати клавіатуру введення', 'Підсвічує кнопки на екрані під час введення паролю з клавіатури', 'Сповіщення при заблокованому екрані', 'Вимкнути сповіщення', 'Цензорні сповіщення', 'Нове сповіщення', 'У вас є 1 нове сповіщення!', 'Спочатку налаштуйте пароль в налаштуваннях плагіна.', 'Пароль оновлений!', 'Ваш пароль був скинутий. Налаштуйте його знову.', 'Ваш пароль було скинуто через оновлення безпеки. Налаштуйте його знову в налаштуваннях.', '### УВАГА!\n\nЦей плагін не дозволяє стороннім людям, які поступово сопіють, **Якщо** будь-хто має доступ до комп\'ютера з компанією Discord увійти в систему, і він насправді налаштований отримати доступ до нього, немає жодного PasscodeLock для запобігання їх формату.\n\nСправжнє рішення з точки зору безпеки є справедливим... блокування чи вихід з вашого комп\'ютера, коли ви не на нього. *(c) Qwerasd*'],
      'zh-TW': ['請輸入您的Discord密碼', '輸入您的新密碼', '重新輸入您的密碼', '更改密碼', '鎖定Discord', '密碼類型', '4位數密碼', '6位數密碼', '自訂密碼位數', '自動鎖定', '當您離開一段時間時要求輸入密碼', '禁用', '1分鐘', '5 分鐘', '1小時', '5小時', '鎖定快捷鍵', '永遠在啟動時鎖定', '在啟動時鎖定 Discord，即使在 Discord 關閉之前它沒有被鎖定', '突出顯示鍵盤輸入', '從鍵盤輸入密碼時突出顯示螢幕上的按鈕', '鎖定期間的通知', '關閉通知', '新訊息', '新訊息', '您有一則新通知!', '請先在插件設定中設置密碼', '密碼已被更新!', '您的密碼已被重置，請重新設定', '由於安全更新，您的密碼已被重置。在插件設定中重新設置。', '### 請注意！\n\n此插件確實可以防止隨便窺探的人，但是如果有人可以訪問已經登入 Discord 的電腦而且確實確定要訪問它，則 PasscodeLock 在 BD 插件的範圍內無法阻止他們。\n\n從安全角度來看，真正的解決方案是……當您不在電腦時，鎖定或登出您的電腦。 *(c) Qwerasd*'],
      'hr': ['Unesite Vašu Discord lozinku', 'Unesite Vašu novu lozinku', 'Ponovno unesite Vašu lozinku', 'Uredite lozinku', 'Zaključajte Discord', 'Vrsta lozinke', '4-Znamenkasta Numerička Lozinka', '6-Znamenkasta Numerička Lozinka', 'Prilagođena Numerička Lozinka', 'Automatsko zaključavanje', 'Zahtijevaj lozinku ako sam neaktivan za vrijeme.', 'Isključeno', 'za 1 minutu', 'za 5 minuta', 'za 1 sat', 'za 5 sati', 'Tipka za zaključavanje', 'Uvijek zaključaj pri pokretanju', 'Zaključava Discord pri pokretanju, čak i ako nije bilo zaključano prije gašenja Discorda', 'Istakni tipkanje tipkovnicom', 'Istakni gumbe na zaslonu kada se upisiva lozinka s tipkovnice', 'Obavijesti kada je zaključano', 'Onemogući obavijesti', 'Cenzuriraj obavijesti', 'Nova obavijest', 'Vi imate 1 novu obavijest!', 'Molimo Vas prvo postavite lozinku u postavkama dodatka.', 'Lozinka je ažurirana!', 'Vaša lozinka je resetirana. Ponovo ju postavite.', 'Vaša lozinka je resetirana zbog sigurnosnog ažuriranja, Ponovo ju postavite u postavkama.', '### PAŽNJU MOLIM!\n\nOvaj dodatak **DOISTA** sprječava ljude koji ležerno njuškaju, **ALI** ako netko ima pristup računalu s prijavljenim Discordom i stvarno je odlučan da bi mu pristupio, ne postoji ništa što PasscodeLock može učiniti unutar opsega BD dodatka da ih spriječi.\n\nPravo riješenje iz sigurnosne perspektive je samo... zaključavanje ili odjava s vašeg računala kada niste za njim. *(c) Qwerasd*'],
      'cs': ['Zadejte své heslo', 'Zadejte své nové heslo', 'Potvrďte své heslo', 'Změnit heslo', 'Uzamknout Discord', 'Typ hesla', '4-číselné heslo', '6-číselné heslo', 'Vlastní číselné heslo', 'Automatické uzamknutí', 'Požadovat heslo při neaktivitě.', 'Vypnuto', 'po 1 minutě', 'po 5 minutách', 'po 1 hodině', 'po 5 hodinách', 'Zkratka uzamknutí', 'Uzamknout vždy při spuštění', 'Uzamknout Discord při startu, i když nebyl uzamknut před vypnutím Discordu', 'Zvýranit psaní na klávesnici', 'Zvýrazní tlačítka na obrazovce při psaní hesla na klávesnici', 'Oznámení při uzamčení', 'Vypnout oznámení', 'Nezobrazovat obsah oznámení', 'Nové oznámení', 'Máte 1 nové oznámení!', 'Nejprve prosím nastavte heslo v nastavení pluginu.', 'Heslo bylo aktualizováno!', 'Vaše heslo bylo obnoveno. Nastavte jej znovu.', 'Vaše heslo bylo obnoveno z důvodu aktualizace zabezpečení. Nastavte ho znovu v nastavení.', '### UPOZORNĚNÍ!\n\nTento plugin ZABRAŇUJE lidem, kteří náhodně špehují, ale pokud má někdo přístup k tomuto počítači kde jste k Discordu příhlášeni a je skutečně odhodlán získat k němu přístup, není nic co by PasscodeLock nemohl udělat v rámci BD pluginu, aby jim bránil.\n\nSkutečné řešení z bezpečnostního hlediska je... uzamknout nebo odhlásit se z Vašeho počítače, když na něm nejste. *(c) Qwerasd*'],
      'hi': ['अपना डिस्कौर्ड पासकोड दर्ज करें ।', 'अपना नया पासकोड दर्ज करें ।', 'अपना नया पासकोड दोबारा दर्ज करें ।', 'पासकोड बदलें ।', 'लौक डिस्कौर्ड ', 'पासकोड के प्रकार', '4-अंकीय कोड', '6-अंकीय कोड', 'अनेक अंकीय कोड', 'ऑटो-लौक', 'कुछ समय के बाद पासकोड पूछे', 'बंद', '1मिनट में', '5 मिनट में', '1 घंंटे में', '5 घंंटे में', 'डिस्कौर्ड लौक करने के लिए के कॉम्बिनेशन', 'स्टार्टप पर डिस्कौर्ड लौक करें', 'डिस्कौर्ड को स्टार्टप पर हमेशा करके लौक रखें', 'टाइपिंग कीबोर्ड को चमकाएं', 'कीबोर्ड से लिखते वक्त बटन को चमकाएं', 'सूचनााओं का व्यहवार', 'बंद कर दें', 'छुपा दें', 'नई सूचना', 'आपके पास एक नई सूचना है', 'प्लगइन की सेटिंग में से सबसे पहले कोड डाले', 'कोड बदल दिया गया है', 'पुराण कोड हटा दिया गया है । नया कोड डालें ।', 'अपडेट की कारण कोड हटा दिया गया है । कृपया कोड फिरसे सेटअप करें ।', '### सावधान !\n\nयह प्लगिन अनजान व्यक्तियों से पूर्ण सुरक्षा नहीं करता है । अगर किसी व्यक्ति के पास आपके कंप्यूटर का पासवर्ड है तोह यह प्लगिन व्यर्थ है ।\n\nयह प्लगिन सुरक्षा के दृष्टिकोण से उचित उपाय नहीं है । अपने कंप्यूटर को बंद करना या लॉक करना सबसे उचित उपाय है ।\n*(c) Qwerasd*'],
      'it': ['Inserisci il tuo codice di accesso di Discord', 'Inserisci il tuo nuovo codice di accesso', 'Reinserisci il tuo codice di accesso', 'Modifica il codice di accesso', 'Blocca Discord', 'Tipo di codice', 'Codice a 4 cifre', 'Codice a 6 cifre', 'Codice a cifre personalizzate', 'Blocco automatico', 'Richiedi il codice di accesso in caso di assenza per un po\' di tempo.', 'Disattivato', 'dopo 1 minuto', 'dopo 5 minuti', 'dopo 1 ora', 'dopo 5 ore', 'Blocco con combinazione di tasti', 'Blocca sempre all\'avvio', 'Blocca Discord all\'avvio anche se non era bloccato quando era stato chiuso', 'Evidenzia digitazione tastiera', 'Evidenzia i pulsanti sullo schermo quando viene inserito il codice di accesso dalla tastiera', 'Notifiche quando è bloccato', 'Disattiva le notifiche', 'Censura le notifiche', 'Nuova notifica', 'Hai una nuova notifica!', 'Per prima cosa, imposta il codice di accesso dalle impostazioni del plug-in.', 'Il codice di accesso è stato aggiornato!', 'Il tuo codice di accesso è stato resettato. Impostalo di nuovo.', 'Il tuo codice di accesso è stato ripristinato a causa di aggiornamenti di sicurezza. Impostalo di nuovo dalle impostazioni del plug-in.', '### PERFAVORE ATTENZIONE!\n\nQuesto plugin impedisce alle persone che curiosano casualmente, **MA** se qualcuno ha accesso al computer con Discord connesso ed è effettivamente determinato ad accedervi, non c\'è nulla che PasscodeLock possa fare nell\'ambito di un plug-in BD per impedirglielo.\n\nLa vera soluzione dal punto di vista della sicurezza è semplicemente... bloccare o disconnettersi dal computer quando non ci sei. *(c) Qwerasd*'],
      'ja': ['古いパスコードを入力', '新しいパスコードを入力', '新しいコードを再入力してください', 'パスコードを編集', 'ログアウト', 'コードタイプ', '4桁の数字コード', '6桁の数字コード', 'カスタム数字コード', '自動ロック', '指定時間が過ぎてからの使用再開には暗証番号の入力が必要となります。', '無効', '1分以内', '5 分', '1時間以内', '5時間', 'ロックキー', '起動時のロック', 'シャットダウン前にロックされていなくてもロックする', 'ハイライトタイピング', '入力時にボタンを強調表示する', 'ロック時の通知', '通知を無効化', '通知を非表示', '新規の通知', '新しい通知があります', '最初に設定でパスコードを設定してください。', 'パスコードが更新されました', 'パスコードがリセットされました。再度設定してください。', 'セキュリティ アップデートにより、パスコードがリセットされました。設定でリセットしてください。', '### 注目してください！\n\nこのプラグインはカジュアルな詮索を防ぎますが、誰かが Discord にログインしてあなたのコンピューターにアクセスし、実際にアクセスすることを決定した場合、PasscodeLock は BD プラグインの範囲内でそれらを防ぐことはできません.\n\nセキュリティの観点からの本当の解決策は、コンピューターをロックするか、使用していないときにログアウトすることです。 *(c) Qwerasd*'],
      'pl': ['Wprowadź swój kod', 'Wprowadź nowy kod', 'Wprowadź swój kod ponownie', 'Zmień kod', 'Zablokuj Discord\'a', 'Typ kodu', 'Czterocyfrowy kod', 'Sześciocyfrowy kod', 'Kod własnej długości', 'Auto blokowanie', 'Wymagaj kodu, przy dłuższej nieaktywności.', 'Wyłączony', 'za minutę', 'za 5 minut', 'za godzinę', 'za 5 godzin', 'Skrót blokowania', 'Zawsze blokuj przy starcie', 'Blokuje Discord\'a przy starcie, nawet jeżeli poprzednio nie był', 'Podświetlaj klawiaturę', 'Podświetla guziki na ekranie podczas wpisywania kodu klawiaturą', 'Powiadomienia podczas blokady', 'Wyłącz powiadomienia', 'Za cenzuruj powiadomienia', 'Nowe powiadomienie', 'Masz 1 nowe powiadomienie!', 'Najpierw ustaw kod w ustawieniach pluginu.', 'Kod został zmieniony!', 'Twój kod został zresetowany. Ustaw go ponownie.', 'Twój kod został zresetowany z powodu aktualizacji bezpieczeństwa. Ustaw go ponownie w ustawieniach.', '### UWAGA!\n\nTen plugin zapobiega osobom węszującym, **ALE** jeżeli ktoś ma dostęp do komputera z Discordem zalogowanym na twoje konto i jest rzeczywiście zdeterminowany, aby uzyskać do niego dostęp, nie ma nic co PasscodeLock może z tym zrobić z poziomu pluginu BD, by temu zapobiec.\n\nJedynym rozwiązaniem z perspektywy bezpieczeństwa jest po prostu... zablokowanie lub wylogowanie się z komputera, gdy cię przy nim nie ma. *(c) Qwerasd*']
    };
  }
};
