/**
 * @description refactor MessengerJS in es6
 * @author zifeng huang
 * @version 0.8.0
 * @license release under MIT license
*/

/**
 *     __  ___
 *    /  |/  /___   _____ _____ ___   ____   ____ _ ___   _____
 *   / /|_/ // _ \ / ___// ___// _ \ / __ \ / __ `// _ \ / ___/
 *  / /  / //  __/(__  )(__  )/  __// / / // /_/ //  __// /
 * /_/  /_/ \___//____//____/ \___//_/ /_/ \__, / \___//_/
 *                                        /____/
 *
 * @description MessengerJS, a common cross-document communicate solution.
 * @author biqing kwok
 * @version 2.0
 * @license release under MIT license
 */


// 消息前缀, 建议使用自己的项目名, 避免多项目之间的冲突
// !注意 消息前缀应使用字符串类型
const defaultPrefix = '[PROJECT_NAME]';
const supportPostMessage = 'postMessage' in window;

class Target {
  constructor(target, name, prefix) {
    let errMsg = '';
    if (arguments.length < 2) {
      errMsg = 'target error - target and name are both required';
    } else if (typeof target !== 'object') {
      errMsg = 'target error - target itself must be window object';
    } else if (typeof name !== 'string') {
      errMsg = 'target error - target name must be string type';
    }
    if (errMsg) {
      throw new Error(errMsg);
    }
    this.target = target;
    this.name = name;
    this.prefix = prefix;
  }
  // 往 target 发送消息, 出于安全考虑, 发送消息会带上前缀
  send(msg) {
    // IE8+ 以及现代浏览器支持
    this.target.postMessage(`${this.prefix}|${this.name}__Messenger__${msg}`, '*');
  }
}

if (!supportPostMessage) {
  // 兼容IE 6/7
  Target.prototype.send = function send(msg) {
    const targetFunc = window.navigator[this.prefix + this.name];
    if (typeof targetFunc === 'function') {
      targetFunc(this.prefix + msg, window);
    } else {
      throw new Error('target callback function is not defined');
    }
  };
}

export default class Messenger {
  constructor(messengerName, projectName = defaultPrefix) {
    this.targets = {};
    this.name = messengerName;
    this.listenFunc = [];
    this.prefix = projectName;
    this.initListen();
  }
  // 添加一个消息对象
  addTarget(target, name) {
    const targetObj = new Target(target, name, this.prefix);
    this.targets[name] = targetObj;
  }
  // 初始化消息监听
  initListen() {
    const self = this;
    const generalCallback = function generalCallback(msg) {
      let msgStr;
      if (typeof msg === 'object' && msg.data) {
        msgStr = msg.data;
      } else {
        msgStr = msg;
      }
      const msgPairs = msgStr.split('__Messenger__');
      const msgs = msgPairs[1];
      const pairs = msgPairs[0].split('|');
      const prefix = pairs[0];
      const name = pairs[1];
      for (let i = 0; i < self.listenFunc.length; i++) {
        if (prefix + name === self.prefix + self.name) {
          self.listenFunc[i](msgs);
        }
      }
    };
    if (supportPostMessage) {
      if ('addEventListener' in document) {
        window.addEventListener('message', generalCallback, false);
      } else if ('attachEvent' in document) {
        window.attachEvent('onmessage', generalCallback);
      }
    } else {
      // 兼容IE 6/7
      window.navigator[this.prefix + this.name] = generalCallback;
    }
  }
  // 监听消息
  listen(callback) {
    let i = 0;
    const len = this.listenFunc.length;
    let cbIsExist = false;
    for (; i < len; i++) {
      if (this.listenFunc[i] === callback) {
        cbIsExist = true;
        break;
      }
    }
    if (!cbIsExist) {
      this.listenFunc.push(callback);
    }
  }
  // 注销监听
  clear() {
    this.listenFunc = [];
  }
  // 广播消息
  send(msg) {
    const { targets } = this;
    Object.keys(targets).forEach((target) => {
      targets[target].send(msg);
    });
  }
}

