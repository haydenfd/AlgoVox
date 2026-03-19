"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const require$$1 = require("path");
const require$$0 = require("fs");
const require$$1$1 = require("os");
const require$$3 = require("crypto");
const require$$0$2 = require("child_process");
const require$$0$1 = require("stream");
const require$$1$2 = require("util");
const require$$0$5 = require("events");
const require$$1$3 = require("https");
const require$$2 = require("http");
const require$$3$1 = require("net");
const require$$4$1 = require("tls");
const require$$7 = require("url");
const require$$0$3 = require("zlib");
const require$$0$4 = require("buffer");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var main = { exports: {} };
const version$1 = "17.3.1";
const require$$4 = {
  version: version$1
};
const fs = require$$0;
const path = require$$1;
const os = require$$1$1;
const crypto$1 = require$$3;
const packageJson = require$$4;
const version = packageJson.version;
const TIPS = [
  "🔐 encrypt with Dotenvx: https://dotenvx.com",
  "🔐 prevent committing .env to code: https://dotenvx.com/precommit",
  "🔐 prevent building .env in docker: https://dotenvx.com/prebuild",
  "🤖 agentic secret storage: https://dotenvx.com/as2",
  "⚡️ secrets for agents: https://dotenvx.com/as2",
  "🛡️ auth for agents: https://vestauth.com",
  "🛠️  run anywhere with `dotenvx run -- yourcommand`",
  "⚙️  specify custom .env file path with { path: '/custom/path/.env' }",
  "⚙️  enable debug logging with { debug: true }",
  "⚙️  override existing env vars with { override: true }",
  "⚙️  suppress all logs with { quiet: true }",
  "⚙️  write to custom object with { processEnv: myObject }",
  "⚙️  load multiple .env files with { path: ['.env.local', '.env'] }"
];
function _getRandomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}
function parseBoolean(value) {
  if (typeof value === "string") {
    return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
  }
  return Boolean(value);
}
function supportsAnsi() {
  return process.stdout.isTTY;
}
function dim(text) {
  return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
}
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function parse$2(src) {
  const obj = {};
  let lines = src.toString();
  lines = lines.replace(/\r\n?/mg, "\n");
  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];
    let value = match[2] || "";
    value = value.trim();
    const maybeQuote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, "\n");
      value = value.replace(/\\r/g, "\r");
    }
    obj[key] = value;
  }
  return obj;
}
function _parseVault(options) {
  options = options || {};
  const vaultPath = _vaultPath(options);
  options.path = vaultPath;
  const result = DotenvModule.configDotenv(options);
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
    err.code = "MISSING_DATA";
    throw err;
  }
  const keys = _dotenvKey(options).split(",");
  const length = keys.length;
  let decrypted;
  for (let i = 0; i < length; i++) {
    try {
      const key = keys[i].trim();
      const attrs = _instructions(result, key);
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
      break;
    } catch (error) {
      if (i + 1 >= length) {
        throw error;
      }
    }
  }
  return DotenvModule.parse(decrypted);
}
function _warn(message) {
  console.error(`[dotenv@${version}][WARN] ${message}`);
}
function _debug(message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}
function _log(message) {
  console.log(`[dotenv@${version}] ${message}`);
}
function _dotenvKey(options) {
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY;
  }
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY;
  }
  return "";
}
function _instructions(result, dotenvKey) {
  let uri;
  try {
    uri = new URL(dotenvKey);
  } catch (error) {
    if (error.code === "ERR_INVALID_URL") {
      const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    throw error;
  }
  const key = uri.password;
  if (!key) {
    const err = new Error("INVALID_DOTENV_KEY: Missing key part");
    err.code = "INVALID_DOTENV_KEY";
    throw err;
  }
  const environment = uri.searchParams.get("environment");
  if (!environment) {
    const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
    err.code = "INVALID_DOTENV_KEY";
    throw err;
  }
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
  const ciphertext = result.parsed[environmentKey];
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
    err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
    throw err;
  }
  return { ciphertext, key };
}
function _vaultPath(options) {
  let possibleVaultPath = null;
  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
  }
  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath;
  }
  return null;
}
function _resolveHome(envPath) {
  return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function _configVault(options) {
  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
  if (debug || !quiet) {
    _log("Loading env from encrypted .env.vault");
  }
  const parsed = DotenvModule._parseVault(options);
  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }
  DotenvModule.populate(processEnv, parsed, options);
  return { parsed };
}
function configDotenv(options) {
  const dotenvPath = path.resolve(process.cwd(), ".env");
  let encoding = "utf8";
  let processEnv = process.env;
  if (options && options.processEnv != null) {
    processEnv = options.processEnv;
  }
  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
  if (options && options.encoding) {
    encoding = options.encoding;
  } else {
    if (debug) {
      _debug("No encoding is specified. UTF-8 is used by default");
    }
  }
  let optionPaths = [dotenvPath];
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)];
    } else {
      optionPaths = [];
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath));
      }
    }
  }
  let lastError;
  const parsedAll = {};
  for (const path2 of optionPaths) {
    try {
      const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
      DotenvModule.populate(parsedAll, parsed, options);
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path2} ${e.message}`);
      }
      lastError = e;
    }
  }
  const populated = DotenvModule.populate(processEnv, parsedAll, options);
  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length;
    const shortPaths = [];
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath);
        shortPaths.push(relative);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${filePath} ${e.message}`);
        }
        lastError = e;
      }
    }
    _log(`injecting env (${keysCount}) from ${shortPaths.join(",")} ${dim(`-- tip: ${_getRandomTip()}`)}`);
  }
  if (lastError) {
    return { parsed: parsedAll, error: lastError };
  } else {
    return { parsed: parsedAll };
  }
}
function config(options) {
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options);
  }
  const vaultPath = _vaultPath(options);
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
    return DotenvModule.configDotenv(options);
  }
  return DotenvModule._configVault(options);
}
function decrypt(encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), "hex");
  let ciphertext = Buffer.from(encrypted, "base64");
  const nonce = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(-16);
  ciphertext = ciphertext.subarray(12, -16);
  try {
    const aesgcm = crypto$1.createDecipheriv("aes-256-gcm", key, nonce);
    aesgcm.setAuthTag(authTag);
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
  } catch (error) {
    const isRange = error instanceof RangeError;
    const invalidKeyLength = error.message === "Invalid key length";
    const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
    if (isRange || invalidKeyLength) {
      const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    } else if (decryptionFailed) {
      const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      err.code = "DECRYPTION_FAILED";
      throw err;
    } else {
      throw error;
    }
  }
}
function populate(processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);
  const populated = {};
  if (typeof parsed !== "object") {
    const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    err.code = "OBJECT_REQUIRED";
    throw err;
  }
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key];
        populated[key] = parsed[key];
      }
      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`);
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`);
        }
      }
    } else {
      processEnv[key] = parsed[key];
      populated[key] = parsed[key];
    }
  }
  return populated;
}
const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse: parse$2,
  populate
};
main.exports.configDotenv = DotenvModule.configDotenv;
main.exports._configVault = DotenvModule._configVault;
main.exports._parseVault = DotenvModule._parseVault;
main.exports.config = DotenvModule.config;
main.exports.decrypt = DotenvModule.decrypt;
main.exports.parse = DotenvModule.parse;
main.exports.populate = DotenvModule.populate;
main.exports = DotenvModule;
var mainExports = main.exports;
const dotenv = /* @__PURE__ */ getDefaultExportFromCjs(mainExports);
var Transform = require$$0$1.Transform;
var util = require$$1$2;
function IsSilence$1(options) {
  var that = this;
  if (options && options.debug) {
    that.debug = options.debug;
    delete options.debug;
  }
  Transform.call(that, options);
  var consecSilenceCount = 0;
  var numSilenceFramesExitThresh = 0;
  that.getNumSilenceFramesExitThresh = function getNumSilenceFramesExitThresh() {
    return numSilenceFramesExitThresh;
  };
  that.getConsecSilenceCount = function getConsecSilenceCount() {
    return consecSilenceCount;
  };
  that.setNumSilenceFramesExitThresh = function setNumSilenceFramesExitThresh(numFrames) {
    numSilenceFramesExitThresh = numFrames;
    return;
  };
  that.incrConsecSilenceCount = function incrConsecSilenceCount() {
    consecSilenceCount++;
    return consecSilenceCount;
  };
  that.resetConsecSilenceCount = function resetConsecSilenceCount() {
    consecSilenceCount = 0;
    return;
  };
}
util.inherits(IsSilence$1, Transform);
IsSilence$1.prototype._transform = function(chunk, encoding, callback) {
  var i;
  var speechSample;
  var silenceLength = 0;
  var self2 = this;
  var debug = self2.debug;
  var consecutiveSilence = self2.getConsecSilenceCount();
  var numSilenceFramesExitThresh = self2.getNumSilenceFramesExitThresh();
  var incrementConsecSilence = self2.incrConsecSilenceCount;
  var resetConsecSilence = self2.resetConsecSilenceCount;
  if (numSilenceFramesExitThresh) {
    for (i = 0; i < chunk.length; i = i + 2) {
      if (chunk[i + 1] > 128) {
        speechSample = (chunk[i + 1] - 256) * 256;
      } else {
        speechSample = chunk[i + 1] * 256;
      }
      speechSample += chunk[i];
      if (Math.abs(speechSample) > 2e3) {
        if (debug) {
          console.log("Found speech block");
        }
        resetConsecSilence();
        break;
      } else {
        silenceLength++;
      }
    }
    if (silenceLength == chunk.length / 2) {
      consecutiveSilence = incrementConsecSilence();
      if (debug) {
        console.log("Found silence block: %d of %d", consecutiveSilence, numSilenceFramesExitThresh);
      }
      if (consecutiveSilence === numSilenceFramesExitThresh) {
        self2.emit("silence");
      }
    }
  }
  this.push(chunk);
  callback();
};
var silenceTransform = IsSilence$1;
var spawn = require$$0$2.spawn;
var isMac = require$$1$1.type() == "Darwin";
var isWindows = require$$1$1.type().indexOf("Windows") > -1;
var IsSilence = silenceTransform;
var PassThrough = require$$0$1.PassThrough;
var mic$1 = function mic(options) {
  options = options || {};
  var that = {};
  var endian = options.endian || "little";
  var bitwidth = options.bitwidth || "16";
  var encoding = options.encoding || "signed-integer";
  var rate = options.rate || "16000";
  var channels = options.channels || "1";
  var device = options.device || "plughw:1,0";
  var exitOnSilence = options.exitOnSilence || 0;
  var fileType = options.fileType || "raw";
  var debug = options.debug || false;
  var format2, formatEndian, formatEncoding;
  var audioProcess = null;
  var infoStream = new PassThrough();
  var audioStream = new IsSilence({ debug });
  var audioProcessOptions = {
    stdio: ["ignore", "pipe", "ignore"]
  };
  if (debug) {
    audioProcessOptions.stdio[2] = "pipe";
  }
  if (endian === "big") {
    formatEndian = "BE";
  } else {
    formatEndian = "LE";
  }
  if (encoding === "unsigned-integer") {
    formatEncoding = "U";
  } else {
    formatEncoding = "S";
  }
  format2 = formatEncoding + bitwidth + "_" + formatEndian;
  audioStream.setNumSilenceFramesExitThresh(parseInt(exitOnSilence, 10));
  that.start = function start() {
    if (audioProcess === null) {
      if (isWindows) {
        audioProcess = spawn(
          "sox",
          [
            "-b",
            bitwidth,
            "--endian",
            endian,
            "-c",
            channels,
            "-r",
            rate,
            "-e",
            encoding,
            "-t",
            "waveaudio",
            "default",
            "-p"
          ],
          audioProcessOptions
        );
      } else if (isMac) {
        audioProcess = spawn("rec", [
          "-b",
          bitwidth,
          "--endian",
          endian,
          "-c",
          channels,
          "-r",
          rate,
          "-e",
          encoding,
          "-t",
          fileType,
          "-"
        ], audioProcessOptions);
      } else {
        audioProcess = spawn("arecord", [
          "-c",
          channels,
          "-r",
          rate,
          "-f",
          format2,
          "-D",
          device
        ], audioProcessOptions);
      }
      audioProcess.on("exit", function(code, sig) {
        if (code != null && sig === null) {
          audioStream.emit("audioProcessExitComplete");
          if (debug) console.log("recording audioProcess has exited with code = %d", code);
        }
      });
      audioProcess.stdout.pipe(audioStream);
      if (debug) {
        audioProcess.stderr.pipe(infoStream);
      }
      audioStream.emit("startComplete");
    } else {
      if (debug) {
        throw new Error("Duplicate calls to start(): Microphone already started!");
      }
    }
  };
  that.stop = function stop() {
    if (audioProcess != null) {
      audioProcess.kill("SIGTERM");
      audioProcess = null;
      audioStream.emit("stopComplete");
      if (debug) console.log("Microhphone stopped");
    }
  };
  that.pause = function pause() {
    if (audioProcess != null) {
      audioProcess.kill("SIGSTOP");
      audioStream.pause();
      audioStream.emit("pauseComplete");
      if (debug) console.log("Microphone paused");
    }
  };
  that.resume = function resume2() {
    if (audioProcess != null) {
      audioProcess.kill("SIGCONT");
      audioStream.resume();
      audioStream.emit("resumeComplete");
      if (debug) console.log("Microphone resumed");
    }
  };
  that.getAudioStream = function getAudioStream() {
    return audioStream;
  };
  if (debug) {
    infoStream.on("data", function(data) {
      console.log("Received Info: " + data);
    });
    infoStream.on("error", function(error) {
      console.log("Error in Info Stream: " + error);
    });
  }
  return that;
};
var mic_1 = mic$1;
var mic2 = mic_1;
const Mic = /* @__PURE__ */ getDefaultExportFromCjs(mic2);
function createMicInstance(onData) {
  const micInstance = Mic({
    rate: "16000",
    channels: "1",
    encoding: "signed-integer",
    bitwidth: "16"
  });
  const micStream = micInstance.getAudioStream();
  micStream.on("data", (chunk) => {
    onData(chunk);
  });
  micStream.on("error", (err) => {
    console.error("[Mic] Error:", err);
  });
  return micInstance;
}
const toJson = (value, replacer, space) => {
  return JSON.stringify(value, replacer, space);
};
function fromJson(text, reviver) {
  return JSON.parse(text, reviver);
}
class DeepgramError extends Error {
  constructor({ message, statusCode, body, rawResponse }) {
    super(buildMessage({ message, statusCode, body }));
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.body = body;
    this.rawResponse = rawResponse;
  }
}
function buildMessage({ message, statusCode, body }) {
  const lines = [];
  if (message != null) {
    lines.push(message);
  }
  if (statusCode != null) {
    lines.push(`Status code: ${statusCode.toString()}`);
  }
  if (body != null) {
    lines.push(`Body: ${toJson(body, void 0, 2)}`);
  }
  return lines.join("\n");
}
class DeepgramTimeoutError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
  }
}
class BadRequestError extends DeepgramError {
  constructor(body, rawResponse) {
    super({
      message: "BadRequestError",
      statusCode: 400,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
  }
}
class NoOpAuthProvider {
  getAuthRequest() {
    return Promise.resolve({ headers: {} });
  }
}
var __awaiter$F = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const EndpointSupplier = {
  get: (supplier, arg) => __awaiter$F(void 0, void 0, void 0, function* () {
    if (typeof supplier === "function") {
      return supplier(arg);
    } else {
      return supplier;
    }
  })
};
const LogLevel = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error"
};
const logLevelMap = {
  [LogLevel.Debug]: 1,
  [LogLevel.Info]: 2,
  [LogLevel.Warn]: 3,
  [LogLevel.Error]: 4
};
class ConsoleLogger {
  debug(message, ...args) {
    console.debug(message, ...args);
  }
  info(message, ...args) {
    console.info(message, ...args);
  }
  warn(message, ...args) {
    console.warn(message, ...args);
  }
  error(message, ...args) {
    console.error(message, ...args);
  }
}
class Logger {
  /**
   * Creates a new logger instance.
   * @param config - Logger configuration
   */
  constructor(config2) {
    this.level = logLevelMap[config2.level];
    this.logger = config2.logger;
    this.silent = config2.silent;
  }
  /**
   * Checks if a log level should be output based on configuration.
   * @param level - The log level to check
   * @returns True if the level should be logged
   */
  shouldLog(level) {
    return !this.silent && this.level <= logLevelMap[level];
  }
  /**
   * Checks if debug logging is enabled.
   * @returns True if debug logs should be output
   */
  isDebug() {
    return this.shouldLog(LogLevel.Debug);
  }
  /**
   * Logs a debug message if debug logging is enabled.
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  debug(message, ...args) {
    if (this.isDebug()) {
      this.logger.debug(message, ...args);
    }
  }
  /**
   * Checks if info logging is enabled.
   * @returns True if info logs should be output
   */
  isInfo() {
    return this.shouldLog(LogLevel.Info);
  }
  /**
   * Logs an info message if info logging is enabled.
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  info(message, ...args) {
    if (this.isInfo()) {
      this.logger.info(message, ...args);
    }
  }
  /**
   * Checks if warning logging is enabled.
   * @returns True if warning logs should be output
   */
  isWarn() {
    return this.shouldLog(LogLevel.Warn);
  }
  /**
   * Logs a warning message if warning logging is enabled.
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  warn(message, ...args) {
    if (this.isWarn()) {
      this.logger.warn(message, ...args);
    }
  }
  /**
   * Checks if error logging is enabled.
   * @returns True if error logs should be output
   */
  isError() {
    return this.shouldLog(LogLevel.Error);
  }
  /**
   * Logs an error message if error logging is enabled.
   * @param message - The message to log
   * @param args - Additional arguments to log
   */
  error(message, ...args) {
    if (this.isError()) {
      this.logger.error(message, ...args);
    }
  }
}
function createLogger(config2) {
  var _a, _b, _c;
  if (config2 == null) {
    return defaultLogger;
  }
  if (config2 instanceof Logger) {
    return config2;
  }
  config2 = config2 !== null && config2 !== void 0 ? config2 : {};
  (_a = config2.level) !== null && _a !== void 0 ? _a : config2.level = LogLevel.Info;
  (_b = config2.logger) !== null && _b !== void 0 ? _b : config2.logger = new ConsoleLogger();
  (_c = config2.silent) !== null && _c !== void 0 ? _c : config2.silent = true;
  return new Logger(config2);
}
const defaultLogger = new Logger({
  level: LogLevel.Info,
  logger: new ConsoleLogger(),
  silent: true
});
const defaultQsOptions = {
  arrayFormat: "indices",
  encode: true
};
function encodeValue(value, shouldEncode) {
  if (value === void 0) {
    return "";
  }
  if (value === null) {
    return "";
  }
  const stringValue = String(value);
  return shouldEncode ? encodeURIComponent(stringValue) : stringValue;
}
function stringifyObject(obj, prefix = "", options) {
  const parts = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value === void 0) {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (item === void 0) {
          continue;
        }
        if (typeof item === "object" && !Array.isArray(item) && item !== null) {
          const arrayKey = options.arrayFormat === "indices" ? `${fullKey}[${i}]` : fullKey;
          parts.push(...stringifyObject(item, arrayKey, options));
        } else {
          const arrayKey = options.arrayFormat === "indices" ? `${fullKey}[${i}]` : fullKey;
          const encodedKey = options.encode ? encodeURIComponent(arrayKey) : arrayKey;
          parts.push(`${encodedKey}=${encodeValue(item, options.encode)}`);
        }
      }
    } else if (typeof value === "object" && value !== null) {
      if (Object.keys(value).length === 0) {
        continue;
      }
      parts.push(...stringifyObject(value, fullKey, options));
    } else {
      const encodedKey = options.encode ? encodeURIComponent(fullKey) : fullKey;
      parts.push(`${encodedKey}=${encodeValue(value, options.encode)}`);
    }
  }
  return parts;
}
function toQueryString(obj, options) {
  if (obj == null || typeof obj !== "object") {
    return "";
  }
  const parts = stringifyObject(obj, "", Object.assign(Object.assign({}, defaultQsOptions), options));
  return parts.join("&");
}
function createRequestUrl(baseUrl, queryParameters) {
  const queryString = toQueryString(queryParameters, { arrayFormat: "repeat" });
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
function getBinaryResponse(response) {
  const binaryResponse = {
    get bodyUsed() {
      return response.bodyUsed;
    },
    stream: () => response.body,
    arrayBuffer: response.arrayBuffer.bind(response),
    blob: response.blob.bind(response)
  };
  if ("bytes" in response && typeof response.bytes === "function") {
    binaryResponse.bytes = response.bytes.bind(response);
  }
  return binaryResponse;
}
var __awaiter$E = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function getResponseBody(response, responseType) {
  return __awaiter$E(this, void 0, void 0, function* () {
    switch (responseType) {
      case "binary-response":
        return getBinaryResponse(response);
      case "blob":
        return yield response.blob();
      case "arrayBuffer":
        return yield response.arrayBuffer();
      case "sse":
        if (response.body == null) {
          return {
            ok: false,
            error: {
              reason: "body-is-null",
              statusCode: response.status
            }
          };
        }
        return response.body;
      case "streaming":
        if (response.body == null) {
          return {
            ok: false,
            error: {
              reason: "body-is-null",
              statusCode: response.status
            }
          };
        }
        return response.body;
      case "text":
        return yield response.text();
    }
    const text = yield response.text();
    if (text.length > 0) {
      try {
        const responseBody = fromJson(text);
        return responseBody;
      } catch (_err) {
        return {
          ok: false,
          error: {
            reason: "non-json",
            statusCode: response.status,
            rawBody: text
          }
        };
      }
    }
    return void 0;
  });
}
var __awaiter$D = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function getErrorResponseBody(response) {
  return __awaiter$D(this, void 0, void 0, function* () {
    var _a, _b, _c;
    let contentType = (_a = response.headers.get("Content-Type")) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (contentType == null || contentType.length === 0) {
      return getResponseBody(response);
    }
    if (contentType.indexOf(";") !== -1) {
      contentType = (_c = (_b = contentType.split(";")[0]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
    }
    switch (contentType) {
      case "application/hal+json":
      case "application/json":
      case "application/ld+json":
      case "application/problem+json":
      case "application/vnd.api+json":
      case "text/json": {
        const text = yield response.text();
        return text.length > 0 ? fromJson(text) : void 0;
      }
      default:
        if (contentType.startsWith("application/vnd.") && contentType.endsWith("+json")) {
          const text = yield response.text();
          return text.length > 0 ? fromJson(text) : void 0;
        }
        return yield response.text();
    }
  });
}
var __awaiter$C = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function getFetchFn() {
  return __awaiter$C(this, void 0, void 0, function* () {
    return fetch;
  });
}
var __awaiter$B = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function getRequestBody(_a) {
  return __awaiter$B(this, arguments, void 0, function* ({ body, type }) {
    if (type === "form") {
      return toQueryString(body, { arrayFormat: "repeat", encode: true });
    }
    if (type.includes("json")) {
      return toJson(body);
    } else {
      return body;
    }
  });
}
let Headers;
if (typeof globalThis.Headers !== "undefined") {
  Headers = globalThis.Headers;
} else {
  Headers = class Headers2 {
    constructor(init) {
      this.headers = /* @__PURE__ */ new Map();
      if (init) {
        if (init instanceof Headers2) {
          init.forEach((value, key) => this.append(key, value));
        } else if (Array.isArray(init)) {
          for (const [key, value] of init) {
            if (typeof key === "string" && typeof value === "string") {
              this.append(key, value);
            } else {
              throw new TypeError("Each header entry must be a [string, string] tuple");
            }
          }
        } else {
          for (const [key, value] of Object.entries(init)) {
            if (typeof value === "string") {
              this.append(key, value);
            } else {
              throw new TypeError("Header values must be strings");
            }
          }
        }
      }
    }
    append(name, value) {
      const key = name.toLowerCase();
      const existing = this.headers.get(key) || [];
      this.headers.set(key, [...existing, value]);
    }
    delete(name) {
      const key = name.toLowerCase();
      this.headers.delete(key);
    }
    get(name) {
      const key = name.toLowerCase();
      const values = this.headers.get(key);
      return values ? values.join(", ") : null;
    }
    has(name) {
      const key = name.toLowerCase();
      return this.headers.has(key);
    }
    set(name, value) {
      const key = name.toLowerCase();
      this.headers.set(key, [value]);
    }
    forEach(callbackfn, thisArg) {
      const boundCallback = thisArg ? callbackfn.bind(thisArg) : callbackfn;
      this.headers.forEach((values, key) => boundCallback(values.join(", "), key, this));
    }
    getSetCookie() {
      return this.headers.get("set-cookie") || [];
    }
    *entries() {
      for (const [key, values] of this.headers.entries()) {
        yield [key, values.join(", ")];
      }
    }
    *keys() {
      yield* this.headers.keys();
    }
    *values() {
      for (const values of this.headers.values()) {
        yield values.join(", ");
      }
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  };
}
const TIMEOUT = "timeout";
function getTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const abortId = setTimeout(() => controller.abort(TIMEOUT), timeoutMs);
  return { signal: controller.signal, abortId };
}
function anySignal(...args) {
  const signals = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal === null || signal === void 0 ? void 0 : signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal === null || signal === void 0 ? void 0 : signal.reason), {
      signal: controller.signal
    });
  }
  return controller.signal;
}
var __awaiter$A = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let _cacheNoStoreSupported;
function isCacheNoStoreSupported() {
  if (_cacheNoStoreSupported != null) {
    return _cacheNoStoreSupported;
  }
  try {
    new Request("http://localhost", { cache: "no-store" });
    _cacheNoStoreSupported = true;
  } catch (_a) {
    _cacheNoStoreSupported = false;
  }
  return _cacheNoStoreSupported;
}
const makeRequest = (fetchFn, url, method, headers, requestBody, timeoutMs, abortSignal, withCredentials, duplex, disableCache) => __awaiter$A(void 0, void 0, void 0, function* () {
  const signals = [];
  let timeoutAbortId;
  if (timeoutMs != null) {
    const { signal, abortId } = getTimeoutSignal(timeoutMs);
    timeoutAbortId = abortId;
    signals.push(signal);
  }
  if (abortSignal != null) {
    signals.push(abortSignal);
  }
  const newSignals = anySignal(signals);
  const response = yield fetchFn(url, Object.assign({
    method,
    headers,
    body: requestBody,
    signal: newSignals,
    credentials: withCredentials ? "include" : void 0,
    // @ts-ignore
    duplex
  }, disableCache && isCacheNoStoreSupported() ? { cache: "no-store" } : {}));
  if (timeoutAbortId != null) {
    clearTimeout(timeoutAbortId);
  }
  return response;
});
const abortRawResponse = {
  headers: new Headers(),
  redirected: false,
  status: 499,
  statusText: "Client Closed Request",
  type: "error",
  url: ""
};
const unknownRawResponse = {
  headers: new Headers(),
  redirected: false,
  status: 0,
  statusText: "Unknown Error",
  type: "error",
  url: ""
};
function toRawResponse(response) {
  return {
    headers: response.headers,
    redirected: response.redirected,
    status: response.status,
    statusText: response.statusText,
    type: response.type,
    url: response.url
  };
}
var __awaiter$z = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const INITIAL_RETRY_DELAY = 1e3;
const MAX_RETRY_DELAY = 6e4;
const DEFAULT_MAX_RETRIES = 2;
const JITTER_FACTOR = 0.2;
function addPositiveJitter(delay) {
  const jitterMultiplier = 1 + Math.random() * JITTER_FACTOR;
  return delay * jitterMultiplier;
}
function addSymmetricJitter(delay) {
  const jitterMultiplier = 1 + (Math.random() - 0.5) * JITTER_FACTOR;
  return delay * jitterMultiplier;
}
function getRetryDelayFromHeaders(response, retryAttempt) {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const retryAfterSeconds = parseInt(retryAfter, 10);
    if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1e3, MAX_RETRY_DELAY);
    }
    const retryAfterDate = new Date(retryAfter);
    if (!Number.isNaN(retryAfterDate.getTime())) {
      const delay = retryAfterDate.getTime() - Date.now();
      if (delay > 0) {
        return Math.min(Math.max(delay, 0), MAX_RETRY_DELAY);
      }
    }
  }
  const rateLimitReset = response.headers.get("X-RateLimit-Reset");
  if (rateLimitReset) {
    const resetTime = parseInt(rateLimitReset, 10);
    if (!Number.isNaN(resetTime)) {
      const delay = resetTime * 1e3 - Date.now();
      if (delay > 0) {
        return addPositiveJitter(Math.min(delay, MAX_RETRY_DELAY));
      }
    }
  }
  return addSymmetricJitter(Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt), MAX_RETRY_DELAY));
}
function requestWithRetries(requestFn_1) {
  return __awaiter$z(this, arguments, void 0, function* (requestFn, maxRetries = DEFAULT_MAX_RETRIES) {
    let response = yield requestFn();
    for (let i = 0; i < maxRetries; ++i) {
      if ([408, 429].includes(response.status) || response.status >= 500) {
        const delay = getRetryDelayFromHeaders(response, i);
        yield new Promise((resolve) => setTimeout(resolve, delay));
        response = yield requestFn();
      } else {
        break;
      }
    }
    return response;
  });
}
var __awaiter$y = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const SENSITIVE_HEADERS = /* @__PURE__ */ new Set([
  "authorization",
  "www-authenticate",
  "x-api-key",
  "api-key",
  "apikey",
  "x-api-token",
  "x-auth-token",
  "auth-token",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "proxy-authenticate",
  "x-csrf-token",
  "x-xsrf-token",
  "x-session-token",
  "x-access-token"
]);
function redactHeaders(headers) {
  const filtered = {};
  for (const [key, value] of headers instanceof Headers ? headers.entries() : Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      filtered[key] = "[REDACTED]";
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}
const SENSITIVE_QUERY_PARAMS = /* @__PURE__ */ new Set([
  "api_key",
  "api-key",
  "apikey",
  "token",
  "access_token",
  "access-token",
  "auth_token",
  "auth-token",
  "password",
  "passwd",
  "secret",
  "api_secret",
  "api-secret",
  "apisecret",
  "key",
  "session",
  "session_id",
  "session-id"
]);
function redactQueryParameters(queryParameters) {
  if (queryParameters == null) {
    return queryParameters;
  }
  const redacted = {};
  for (const [key, value] of Object.entries(queryParameters)) {
    if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}
function redactUrl(url) {
  const protocolIndex = url.indexOf("://");
  if (protocolIndex === -1)
    return url;
  const afterProtocol = protocolIndex + 3;
  const pathStart = url.indexOf("/", afterProtocol);
  let queryStart = url.indexOf("?", afterProtocol);
  let fragmentStart = url.indexOf("#", afterProtocol);
  const firstDelimiter = Math.min(pathStart === -1 ? url.length : pathStart, queryStart === -1 ? url.length : queryStart, fragmentStart === -1 ? url.length : fragmentStart);
  let atIndex = -1;
  for (let i = afterProtocol; i < firstDelimiter; i++) {
    if (url[i] === "@") {
      atIndex = i;
    }
  }
  if (atIndex !== -1) {
    url = `${url.slice(0, afterProtocol)}[REDACTED]@${url.slice(atIndex + 1)}`;
  }
  queryStart = url.indexOf("?");
  if (queryStart === -1)
    return url;
  fragmentStart = url.indexOf("#", queryStart);
  const queryEnd = fragmentStart !== -1 ? fragmentStart : url.length;
  const queryString = url.slice(queryStart + 1, queryEnd);
  if (queryString.length === 0)
    return url;
  const lower = queryString.toLowerCase();
  const hasSensitive = lower.includes("token") || lower.includes("key") || lower.includes("password") || lower.includes("passwd") || lower.includes("secret") || lower.includes("session") || lower.includes("auth");
  if (!hasSensitive) {
    return url;
  }
  const redactedParams = [];
  const params = queryString.split("&");
  for (const param of params) {
    const equalIndex = param.indexOf("=");
    if (equalIndex === -1) {
      redactedParams.push(param);
      continue;
    }
    const key = param.slice(0, equalIndex);
    let shouldRedact = SENSITIVE_QUERY_PARAMS.has(key.toLowerCase());
    if (!shouldRedact && key.includes("%")) {
      try {
        const decodedKey = decodeURIComponent(key);
        shouldRedact = SENSITIVE_QUERY_PARAMS.has(decodedKey.toLowerCase());
      } catch (_a) {
      }
    }
    redactedParams.push(shouldRedact ? `${key}=[REDACTED]` : param);
  }
  return url.slice(0, queryStart + 1) + redactedParams.join("&") + url.slice(queryEnd);
}
function getHeaders(args) {
  return __awaiter$y(this, void 0, void 0, function* () {
    var _a;
    const newHeaders = new Headers();
    newHeaders.set("Accept", args.responseType === "json" ? "application/json" : args.responseType === "text" ? "text/plain" : args.responseType === "sse" ? "text/event-stream" : "*/*");
    if (args.body !== void 0 && args.contentType != null) {
      newHeaders.set("Content-Type", args.contentType);
    }
    if (args.headers == null) {
      return newHeaders;
    }
    for (const [key, value] of Object.entries(args.headers)) {
      const result = yield EndpointSupplier.get(value, { endpointMetadata: (_a = args.endpointMetadata) !== null && _a !== void 0 ? _a : {} });
      if (typeof result === "string") {
        newHeaders.set(key, result);
        continue;
      }
      if (result == null) {
        continue;
      }
      newHeaders.set(key, `${result}`);
    }
    return newHeaders;
  });
}
function fetcherImpl(args) {
  return __awaiter$y(this, void 0, void 0, function* () {
    var _a, _b, _c;
    const url = createRequestUrl(args.url, args.queryParameters);
    const requestBody = yield getRequestBody({
      body: args.body,
      type: (_a = args.requestType) !== null && _a !== void 0 ? _a : "other"
    });
    const fetchFn = (_b = args.fetchFn) !== null && _b !== void 0 ? _b : yield getFetchFn();
    const headers = yield getHeaders(args);
    const logger = createLogger(args.logging);
    if (logger.isDebug()) {
      const metadata = {
        method: args.method,
        url: redactUrl(url),
        headers: redactHeaders(headers),
        queryParameters: redactQueryParameters(args.queryParameters),
        hasBody: requestBody != null
      };
      logger.debug("Making HTTP request", metadata);
    }
    try {
      const response = yield requestWithRetries(() => __awaiter$y(this, void 0, void 0, function* () {
        return makeRequest(fetchFn, url, args.method, headers, requestBody, args.timeoutMs, args.abortSignal, args.withCredentials, args.duplex, args.responseType === "streaming" || args.responseType === "sse");
      }), args.maxRetries);
      if (response.status >= 200 && response.status < 400) {
        if (logger.isDebug()) {
          const metadata = {
            method: args.method,
            url: redactUrl(url),
            statusCode: response.status,
            responseHeaders: redactHeaders(response.headers)
          };
          logger.debug("HTTP request succeeded", metadata);
        }
        const body = yield getResponseBody(response, args.responseType);
        return {
          ok: true,
          body,
          headers: response.headers,
          rawResponse: toRawResponse(response)
        };
      } else {
        if (logger.isError()) {
          const metadata = {
            method: args.method,
            url: redactUrl(url),
            statusCode: response.status,
            responseHeaders: redactHeaders(Object.fromEntries(response.headers.entries()))
          };
          logger.error("HTTP request failed with error status", metadata);
        }
        return {
          ok: false,
          error: {
            reason: "status-code",
            statusCode: response.status,
            body: yield getErrorResponseBody(response)
          },
          rawResponse: toRawResponse(response)
        };
      }
    } catch (error) {
      if ((_c = args.abortSignal) === null || _c === void 0 ? void 0 : _c.aborted) {
        if (logger.isError()) {
          const metadata = {
            method: args.method,
            url: redactUrl(url)
          };
          logger.error("HTTP request was aborted", metadata);
        }
        return {
          ok: false,
          error: {
            reason: "unknown",
            errorMessage: "The user aborted a request"
          },
          rawResponse: abortRawResponse
        };
      } else if (error instanceof Error && error.name === "AbortError") {
        if (logger.isError()) {
          const metadata = {
            method: args.method,
            url: redactUrl(url),
            timeoutMs: args.timeoutMs
          };
          logger.error("HTTP request timed out", metadata);
        }
        return {
          ok: false,
          error: {
            reason: "timeout"
          },
          rawResponse: abortRawResponse
        };
      } else if (error instanceof Error) {
        if (logger.isError()) {
          const metadata = {
            method: args.method,
            url: redactUrl(url),
            errorMessage: error.message
          };
          logger.error("HTTP request failed with error", metadata);
        }
        return {
          ok: false,
          error: {
            reason: "unknown",
            errorMessage: error.message
          },
          rawResponse: unknownRawResponse
        };
      }
      if (logger.isError()) {
        const metadata = {
          method: args.method,
          url: redactUrl(url),
          error: toJson(error)
        };
        logger.error("HTTP request failed with unknown error", metadata);
      }
      return {
        ok: false,
        error: {
          reason: "unknown",
          errorMessage: toJson(error)
        },
        rawResponse: unknownRawResponse
      };
    }
  });
}
const fetcher = fetcherImpl;
var __awaiter$x = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class HttpResponsePromise extends Promise {
  constructor(promise) {
    super((resolve) => {
      resolve(void 0);
    });
    this.innerPromise = promise;
  }
  /**
   * Creates an `HttpResponsePromise` from a function that returns a promise.
   *
   * @param fn - A function that returns a promise resolving to a `WithRawResponse` object.
   * @param args - Arguments to pass to the function.
   * @returns An `HttpResponsePromise` instance.
   */
  static fromFunction(fn, ...args) {
    return new HttpResponsePromise(fn(...args));
  }
  /**
   * Creates a function that returns an `HttpResponsePromise` from a function that returns a promise.
   *
   * @param fn - A function that returns a promise resolving to a `WithRawResponse` object.
   * @returns A function that returns an `HttpResponsePromise` instance.
   */
  static interceptFunction(fn) {
    return (...args) => {
      return HttpResponsePromise.fromPromise(fn(...args));
    };
  }
  /**
   * Creates an `HttpResponsePromise` from an existing promise.
   *
   * @param promise - A promise resolving to a `WithRawResponse` object.
   * @returns An `HttpResponsePromise` instance.
   */
  static fromPromise(promise) {
    return new HttpResponsePromise(promise);
  }
  /**
   * Creates an `HttpResponsePromise` from an executor function.
   *
   * @param executor - A function that takes resolve and reject callbacks to create a promise.
   * @returns An `HttpResponsePromise` instance.
   */
  static fromExecutor(executor) {
    const promise = new Promise(executor);
    return new HttpResponsePromise(promise);
  }
  /**
   * Creates an `HttpResponsePromise` from a resolved result.
   *
   * @param result - A `WithRawResponse` object to resolve immediately.
   * @returns An `HttpResponsePromise` instance.
   */
  static fromResult(result) {
    const promise = Promise.resolve(result);
    return new HttpResponsePromise(promise);
  }
  unwrap() {
    if (!this.unwrappedPromise) {
      this.unwrappedPromise = this.innerPromise.then(({ data }) => data);
    }
    return this.unwrappedPromise;
  }
  /** @inheritdoc */
  then(onfulfilled, onrejected) {
    return this.unwrap().then(onfulfilled, onrejected);
  }
  /** @inheritdoc */
  catch(onrejected) {
    return this.unwrap().catch(onrejected);
  }
  /** @inheritdoc */
  finally(onfinally) {
    return this.unwrap().finally(onfinally);
  }
  /**
   * Retrieves the data and raw response.
   *
   * @returns A promise resolving to a `WithRawResponse` object.
   */
  withRawResponse() {
    return __awaiter$x(this, void 0, void 0, function* () {
      return yield this.innerPromise;
    });
  }
}
var __awaiter$w = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const Supplier = {
  get: (supplier) => __awaiter$w(void 0, void 0, void 0, function* () {
    if (typeof supplier === "function") {
      return supplier();
    } else {
      return supplier;
    }
  })
};
var __awaiter$v = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function toBinaryUploadRequest(file) {
  return __awaiter$v(this, void 0, void 0, function* () {
    const { data, filename, contentLength, contentType } = yield getFileWithMetadata(file);
    const request = {
      body: data,
      headers: {}
    };
    if (filename) {
      request.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }
    if (contentType) {
      request.headers["Content-Type"] = contentType;
    }
    if (contentLength != null) {
      request.headers["Content-Length"] = contentLength.toString();
    }
    return request;
  });
}
function getFileWithMetadata(file_1) {
  return __awaiter$v(this, arguments, void 0, function* (file, { noSniffFileSize } = {}) {
    var _a, _b, _c, _d, _e;
    if (isFileLike(file)) {
      return getFileWithMetadata({
        data: file
      }, { noSniffFileSize });
    }
    if ("path" in file) {
      const fs2 = yield import("fs");
      if (!fs2 || !fs2.createReadStream) {
        throw new Error("File path uploads are not supported in this environment.");
      }
      const data = fs2.createReadStream(file.path);
      const contentLength = (_a = file.contentLength) !== null && _a !== void 0 ? _a : noSniffFileSize === true ? void 0 : yield tryGetFileSizeFromPath(file.path);
      const filename = (_b = file.filename) !== null && _b !== void 0 ? _b : getNameFromPath(file.path);
      return {
        data,
        filename,
        contentType: file.contentType,
        contentLength
      };
    }
    if ("data" in file) {
      const data = file.data;
      const contentLength = (_c = file.contentLength) !== null && _c !== void 0 ? _c : yield tryGetContentLengthFromFileLike(data, {
        noSniffFileSize
      });
      const filename = (_d = file.filename) !== null && _d !== void 0 ? _d : tryGetNameFromFileLike(data);
      return {
        data,
        filename,
        contentType: (_e = file.contentType) !== null && _e !== void 0 ? _e : tryGetContentTypeFromFileLike(data),
        contentLength
      };
    }
    throw new Error(`Invalid FileUpload of type ${typeof file}: ${JSON.stringify(file)}`);
  });
}
function isFileLike(value) {
  return isBuffer(value) || isArrayBufferView(value) || isArrayBuffer(value) || isUint8Array(value) || isBlob$3(value) || isFile(value) || isStreamLike(value) || isReadableStream(value);
}
function tryGetFileSizeFromPath(path2) {
  return __awaiter$v(this, void 0, void 0, function* () {
    try {
      const fs2 = yield import("fs");
      if (!fs2 || !fs2.promises || !fs2.promises.stat) {
        return void 0;
      }
      const fileStat = yield fs2.promises.stat(path2);
      return fileStat.size;
    } catch (_fallbackError) {
      return void 0;
    }
  });
}
function tryGetNameFromFileLike(data) {
  if (isNamedValue(data)) {
    return data.name;
  }
  if (isPathedValue(data)) {
    return getNameFromPath(data.path.toString());
  }
  return void 0;
}
function tryGetContentLengthFromFileLike(data_1) {
  return __awaiter$v(this, arguments, void 0, function* (data, { noSniffFileSize } = {}) {
    if (isBuffer(data)) {
      return data.length;
    }
    if (isArrayBufferView(data)) {
      return data.byteLength;
    }
    if (isArrayBuffer(data)) {
      return data.byteLength;
    }
    if (isBlob$3(data)) {
      return data.size;
    }
    if (isFile(data)) {
      return data.size;
    }
    if (noSniffFileSize === true) {
      return void 0;
    }
    if (isPathedValue(data)) {
      return yield tryGetFileSizeFromPath(data.path.toString());
    }
    return void 0;
  });
}
function tryGetContentTypeFromFileLike(data) {
  if (isBlob$3(data)) {
    return data.type;
  }
  if (isFile(data)) {
    return data.type;
  }
  return void 0;
}
function getNameFromPath(path2) {
  const lastForwardSlash = path2.lastIndexOf("/");
  const lastBackSlash = path2.lastIndexOf("\\");
  const lastSlashIndex = Math.max(lastForwardSlash, lastBackSlash);
  return lastSlashIndex >= 0 ? path2.substring(lastSlashIndex + 1) : path2;
}
function isNamedValue(value) {
  return typeof value === "object" && value != null && "name" in value;
}
function isPathedValue(value) {
  return typeof value === "object" && value != null && "path" in value;
}
function isStreamLike(value) {
  return typeof value === "object" && value != null && ("read" in value || "pipe" in value);
}
function isReadableStream(value) {
  return typeof value === "object" && value != null && "getReader" in value;
}
function isBuffer(value) {
  return typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(value);
}
function isArrayBufferView(value) {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
}
function isArrayBuffer(value) {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}
function isUint8Array(value) {
  return typeof Uint8Array !== "undefined" && value instanceof Uint8Array;
}
function isBlob$3(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}
function isFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}
const RUNTIME = evaluateRuntime();
function evaluateRuntime() {
  var _a, _b, _c, _d, _e;
  const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
  if (isBrowser) {
    return {
      type: "browser",
      version: window.navigator.userAgent
    };
  }
  const isCloudflare = typeof globalThis !== "undefined" && ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.navigator) === null || _a === void 0 ? void 0 : _a.userAgent) === "Cloudflare-Workers";
  if (isCloudflare) {
    return {
      type: "workerd"
    };
  }
  const isEdgeRuntime = typeof EdgeRuntime === "string";
  if (isEdgeRuntime) {
    return {
      type: "edge-runtime"
    };
  }
  const isWebWorker = typeof self === "object" && typeof (self === null || self === void 0 ? void 0 : self.importScripts) === "function" && (((_b = self.constructor) === null || _b === void 0 ? void 0 : _b.name) === "DedicatedWorkerGlobalScope" || ((_c = self.constructor) === null || _c === void 0 ? void 0 : _c.name) === "ServiceWorkerGlobalScope" || ((_d = self.constructor) === null || _d === void 0 ? void 0 : _d.name) === "SharedWorkerGlobalScope");
  if (isWebWorker) {
    return {
      type: "web-worker"
    };
  }
  const isDeno = typeof Deno !== "undefined" && typeof Deno.version !== "undefined" && typeof Deno.version.deno !== "undefined";
  if (isDeno) {
    return {
      type: "deno",
      version: Deno.version.deno
    };
  }
  const isBun = typeof Bun !== "undefined" && typeof Bun.version !== "undefined";
  if (isBun) {
    return {
      type: "bun",
      version: Bun.version
    };
  }
  const isReactNative = typeof navigator !== "undefined" && (navigator === null || navigator === void 0 ? void 0 : navigator.product) === "ReactNative";
  if (isReactNative) {
    return {
      type: "react-native"
    };
  }
  const _process = typeof process !== "undefined" ? process : void 0;
  const isNode = typeof _process !== "undefined" && typeof ((_e = _process.versions) === null || _e === void 0 ? void 0 : _e.node) === "string";
  if (isNode) {
    return {
      type: "node",
      version: _process.versions.node,
      parsedVersion: Number(_process.versions.node.split(".")[0])
    };
  }
  return {
    type: "unknown"
  };
}
function encodePathParam(param) {
  if (param === null) {
    return "null";
  }
  const typeofParam = typeof param;
  switch (typeofParam) {
    case "undefined":
      return "undefined";
    case "string":
    case "number":
    case "boolean":
      break;
    default:
      param = String(param);
      break;
  }
  return encodeURIComponent(param);
}
function join(base, ...segments) {
  if (!base) {
    return "";
  }
  if (segments.length === 0) {
    return base;
  }
  if (base.includes("://")) {
    let url;
    try {
      url = new URL(base);
    } catch (_a) {
      return joinPath(base, ...segments);
    }
    const lastSegment = segments[segments.length - 1];
    const shouldPreserveTrailingSlash = lastSegment === null || lastSegment === void 0 ? void 0 : lastSegment.endsWith("/");
    for (const segment of segments) {
      const cleanSegment = trimSlashes(segment);
      if (cleanSegment) {
        url.pathname = joinPathSegments(url.pathname, cleanSegment);
      }
    }
    if (shouldPreserveTrailingSlash && !url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    return url.toString();
  }
  return joinPath(base, ...segments);
}
function joinPath(base, ...segments) {
  if (segments.length === 0) {
    return base;
  }
  let result = base;
  const lastSegment = segments[segments.length - 1];
  const shouldPreserveTrailingSlash = lastSegment === null || lastSegment === void 0 ? void 0 : lastSegment.endsWith("/");
  for (const segment of segments) {
    const cleanSegment = trimSlashes(segment);
    if (cleanSegment) {
      result = joinPathSegments(result, cleanSegment);
    }
  }
  if (shouldPreserveTrailingSlash && !result.endsWith("/")) {
    result += "/";
  }
  return result;
}
function joinPathSegments(left, right) {
  if (left.endsWith("/")) {
    return left + right;
  }
  return `${left}/${right}`;
}
function trimSlashes(str) {
  if (!str)
    return str;
  let start = 0;
  let end = str.length;
  if (str.startsWith("/"))
    start = 1;
  if (str.endsWith("/"))
    end = str.length - 1;
  return start === 0 && end === str.length ? str : str.slice(start, end);
}
var bufferUtil$1 = { exports: {} };
const BINARY_TYPES$2 = ["nodebuffer", "arraybuffer", "fragments"];
const hasBlob$1 = typeof Blob !== "undefined";
if (hasBlob$1) BINARY_TYPES$2.push("blob");
var constants = {
  BINARY_TYPES: BINARY_TYPES$2,
  CLOSE_TIMEOUT: 3e4,
  EMPTY_BUFFER: Buffer.alloc(0),
  GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
  hasBlob: hasBlob$1,
  kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
  kListener: Symbol("kListener"),
  kStatusCode: Symbol("status-code"),
  kWebSocket: Symbol("websocket"),
  NOOP: () => {
  }
};
var bufferutil = { exports: {} };
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var nodeGypBuild$1 = { exports: {} };
var nodeGypBuild;
var hasRequiredNodeGypBuild$1;
function requireNodeGypBuild$1() {
  if (hasRequiredNodeGypBuild$1) return nodeGypBuild;
  hasRequiredNodeGypBuild$1 = 1;
  var fs2 = require$$0;
  var path2 = require$$1;
  var os2 = require$$1$1;
  var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
  var vars = process.config && process.config.variables || {};
  var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
  var abi = process.versions.modules;
  var runtime = isElectron() ? "electron" : isNwjs() ? "node-webkit" : "node";
  var arch = process.env.npm_config_arch || os2.arch();
  var platform = process.env.npm_config_platform || os2.platform();
  var libc = process.env.LIBC || (isAlpine(platform) ? "musl" : "glibc");
  var armv = process.env.ARM_VERSION || (arch === "arm64" ? "8" : vars.arm_version) || "";
  var uv = (process.versions.uv || "").split(".")[0];
  nodeGypBuild = load;
  function load(dir) {
    return runtimeRequire(load.resolve(dir));
  }
  load.resolve = load.path = function(dir) {
    dir = path2.resolve(dir || ".");
    try {
      var name = runtimeRequire(path2.join(dir, "package.json")).name.toUpperCase().replace(/-/g, "_");
      if (process.env[name + "_PREBUILD"]) dir = process.env[name + "_PREBUILD"];
    } catch (err) {
    }
    if (!prebuildsOnly) {
      var release = getFirst(path2.join(dir, "build/Release"), matchBuild);
      if (release) return release;
      var debug = getFirst(path2.join(dir, "build/Debug"), matchBuild);
      if (debug) return debug;
    }
    var prebuild = resolve(dir);
    if (prebuild) return prebuild;
    var nearby = resolve(path2.dirname(process.execPath));
    if (nearby) return nearby;
    var target = [
      "platform=" + platform,
      "arch=" + arch,
      "runtime=" + runtime,
      "abi=" + abi,
      "uv=" + uv,
      armv ? "armv=" + armv : "",
      "libc=" + libc,
      "node=" + process.versions.node,
      process.versions.electron ? "electron=" + process.versions.electron : "",
      typeof __webpack_require__ === "function" ? "webpack=true" : ""
      // eslint-disable-line
    ].filter(Boolean).join(" ");
    throw new Error("No native build was found for " + target + "\n    loaded from: " + dir + "\n");
    function resolve(dir2) {
      var tuples = readdirSync(path2.join(dir2, "prebuilds")).map(parseTuple);
      var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
      if (!tuple) return;
      var prebuilds = path2.join(dir2, "prebuilds", tuple.name);
      var parsed = readdirSync(prebuilds).map(parseTags);
      var candidates = parsed.filter(matchTags(runtime, abi));
      var winner = candidates.sort(compareTags(runtime))[0];
      if (winner) return path2.join(prebuilds, winner.file);
    }
  };
  function readdirSync(dir) {
    try {
      return fs2.readdirSync(dir);
    } catch (err) {
      return [];
    }
  }
  function getFirst(dir, filter) {
    var files = readdirSync(dir).filter(filter);
    return files[0] && path2.join(dir, files[0]);
  }
  function matchBuild(name) {
    return /\.node$/.test(name);
  }
  function parseTuple(name) {
    var arr = name.split("-");
    if (arr.length !== 2) return;
    var platform2 = arr[0];
    var architectures = arr[1].split("+");
    if (!platform2) return;
    if (!architectures.length) return;
    if (!architectures.every(Boolean)) return;
    return { name, platform: platform2, architectures };
  }
  function matchTuple(platform2, arch2) {
    return function(tuple) {
      if (tuple == null) return false;
      if (tuple.platform !== platform2) return false;
      return tuple.architectures.includes(arch2);
    };
  }
  function compareTuples(a, b) {
    return a.architectures.length - b.architectures.length;
  }
  function parseTags(file) {
    var arr = file.split(".");
    var extension2 = arr.pop();
    var tags = { file, specificity: 0 };
    if (extension2 !== "node") return;
    for (var i = 0; i < arr.length; i++) {
      var tag = arr[i];
      if (tag === "node" || tag === "electron" || tag === "node-webkit") {
        tags.runtime = tag;
      } else if (tag === "napi") {
        tags.napi = true;
      } else if (tag.slice(0, 3) === "abi") {
        tags.abi = tag.slice(3);
      } else if (tag.slice(0, 2) === "uv") {
        tags.uv = tag.slice(2);
      } else if (tag.slice(0, 4) === "armv") {
        tags.armv = tag.slice(4);
      } else if (tag === "glibc" || tag === "musl") {
        tags.libc = tag;
      } else {
        continue;
      }
      tags.specificity++;
    }
    return tags;
  }
  function matchTags(runtime2, abi2) {
    return function(tags) {
      if (tags == null) return false;
      if (tags.runtime && tags.runtime !== runtime2 && !runtimeAgnostic(tags)) return false;
      if (tags.abi && tags.abi !== abi2 && !tags.napi) return false;
      if (tags.uv && tags.uv !== uv) return false;
      if (tags.armv && tags.armv !== armv) return false;
      if (tags.libc && tags.libc !== libc) return false;
      return true;
    };
  }
  function runtimeAgnostic(tags) {
    return tags.runtime === "node" && tags.napi;
  }
  function compareTags(runtime2) {
    return function(a, b) {
      if (a.runtime !== b.runtime) {
        return a.runtime === runtime2 ? -1 : 1;
      } else if (a.abi !== b.abi) {
        return a.abi ? -1 : 1;
      } else if (a.specificity !== b.specificity) {
        return a.specificity > b.specificity ? -1 : 1;
      } else {
        return 0;
      }
    };
  }
  function isNwjs() {
    return !!(process.versions && process.versions.nw);
  }
  function isElectron() {
    if (process.versions && process.versions.electron) return true;
    if (process.env.ELECTRON_RUN_AS_NODE) return true;
    return typeof window !== "undefined" && window.process && window.process.type === "renderer";
  }
  function isAlpine(platform2) {
    return platform2 === "linux" && fs2.existsSync("/etc/alpine-release");
  }
  load.parseTags = parseTags;
  load.matchTags = matchTags;
  load.compareTags = compareTags;
  load.parseTuple = parseTuple;
  load.matchTuple = matchTuple;
  load.compareTuples = compareTuples;
  return nodeGypBuild;
}
var hasRequiredNodeGypBuild;
function requireNodeGypBuild() {
  if (hasRequiredNodeGypBuild) return nodeGypBuild$1.exports;
  hasRequiredNodeGypBuild = 1;
  const runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
  if (typeof runtimeRequire.addon === "function") {
    nodeGypBuild$1.exports = runtimeRequire.addon.bind(runtimeRequire);
  } else {
    nodeGypBuild$1.exports = requireNodeGypBuild$1();
  }
  return nodeGypBuild$1.exports;
}
var fallback$1;
var hasRequiredFallback$1;
function requireFallback$1() {
  if (hasRequiredFallback$1) return fallback$1;
  hasRequiredFallback$1 = 1;
  const mask2 = (source, mask3, output, offset, length) => {
    for (var i = 0; i < length; i++) {
      output[offset + i] = source[i] ^ mask3[i & 3];
    }
  };
  const unmask2 = (buffer, mask3) => {
    const length = buffer.length;
    for (var i = 0; i < length; i++) {
      buffer[i] ^= mask3[i & 3];
    }
  };
  fallback$1 = { mask: mask2, unmask: unmask2 };
  return fallback$1;
}
var hasRequiredBufferutil;
function requireBufferutil() {
  if (hasRequiredBufferutil) return bufferutil.exports;
  hasRequiredBufferutil = 1;
  try {
    bufferutil.exports = requireNodeGypBuild()(__dirname);
  } catch (e) {
    bufferutil.exports = requireFallback$1();
  }
  return bufferutil.exports;
}
var unmask$1;
var mask;
const { EMPTY_BUFFER: EMPTY_BUFFER$3 } = constants;
const FastBuffer$2 = Buffer[Symbol.species];
function concat$1(list, totalLength) {
  if (list.length === 0) return EMPTY_BUFFER$3;
  if (list.length === 1) return list[0];
  const target = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (let i = 0; i < list.length; i++) {
    const buf = list[i];
    target.set(buf, offset);
    offset += buf.length;
  }
  if (offset < totalLength) {
    return new FastBuffer$2(target.buffer, target.byteOffset, offset);
  }
  return target;
}
function _mask(source, mask2, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask2[i & 3];
  }
}
function _unmask(buffer, mask2) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] ^= mask2[i & 3];
  }
}
function toArrayBuffer$1(buf) {
  if (buf.length === buf.buffer.byteLength) {
    return buf.buffer;
  }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
}
function toBuffer$2(data) {
  toBuffer$2.readOnly = true;
  if (Buffer.isBuffer(data)) return data;
  let buf;
  if (data instanceof ArrayBuffer) {
    buf = new FastBuffer$2(data);
  } else if (ArrayBuffer.isView(data)) {
    buf = new FastBuffer$2(data.buffer, data.byteOffset, data.byteLength);
  } else {
    buf = Buffer.from(data);
    toBuffer$2.readOnly = false;
  }
  return buf;
}
bufferUtil$1.exports = {
  concat: concat$1,
  mask: _mask,
  toArrayBuffer: toArrayBuffer$1,
  toBuffer: toBuffer$2,
  unmask: _unmask
};
if (!process.env.WS_NO_BUFFER_UTIL) {
  try {
    const bufferUtil2 = requireBufferutil();
    mask = bufferUtil$1.exports.mask = function(source, mask2, output, offset, length) {
      if (length < 48) _mask(source, mask2, output, offset, length);
      else bufferUtil2.mask(source, mask2, output, offset, length);
    };
    unmask$1 = bufferUtil$1.exports.unmask = function(buffer, mask2) {
      if (buffer.length < 32) _unmask(buffer, mask2);
      else bufferUtil2.unmask(buffer, mask2);
    };
  } catch (e) {
  }
}
var bufferUtilExports = bufferUtil$1.exports;
const kDone = Symbol("kDone");
const kRun = Symbol("kRun");
let Limiter$1 = class Limiter {
  /**
   * Creates a new `Limiter`.
   *
   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
   *     to run concurrently
   */
  constructor(concurrency) {
    this[kDone] = () => {
      this.pending--;
      this[kRun]();
    };
    this.concurrency = concurrency || Infinity;
    this.jobs = [];
    this.pending = 0;
  }
  /**
   * Adds a job to the queue.
   *
   * @param {Function} job The job to run
   * @public
   */
  add(job) {
    this.jobs.push(job);
    this[kRun]();
  }
  /**
   * Removes a job from the queue and runs it if possible.
   *
   * @private
   */
  [kRun]() {
    if (this.pending === this.concurrency) return;
    if (this.jobs.length) {
      const job = this.jobs.shift();
      this.pending++;
      job(this[kDone]);
    }
  }
};
var limiter = Limiter$1;
const zlib = require$$0$3;
const bufferUtil = bufferUtilExports;
const Limiter2 = limiter;
const { kStatusCode: kStatusCode$2 } = constants;
const FastBuffer$1 = Buffer[Symbol.species];
const TRAILER = Buffer.from([0, 0, 255, 255]);
const kPerMessageDeflate = Symbol("permessage-deflate");
const kTotalLength = Symbol("total-length");
const kCallback = Symbol("callback");
const kBuffers = Symbol("buffers");
const kError$1 = Symbol("error");
let zlibLimiter;
let PerMessageDeflate$3 = class PerMessageDeflate {
  /**
   * Creates a PerMessageDeflate instance.
   *
   * @param {Object} [options] Configuration options
   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
   *     for, or request, a custom client window size
   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
   *     acknowledge disabling of client context takeover
   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
   *     calls to zlib
   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
   *     use of a custom server window size
   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
   *     disabling of server context takeover
   * @param {Number} [options.threshold=1024] Size (in bytes) below which
   *     messages should not be compressed if context takeover is disabled
   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
   *     deflate
   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
   *     inflate
   * @param {Boolean} [isServer=false] Create the instance in either server or
   *     client mode
   * @param {Number} [maxPayload=0] The maximum allowed message length
   */
  constructor(options, isServer, maxPayload) {
    this._maxPayload = maxPayload | 0;
    this._options = options || {};
    this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
    this._isServer = !!isServer;
    this._deflate = null;
    this._inflate = null;
    this.params = null;
    if (!zlibLimiter) {
      const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
      zlibLimiter = new Limiter2(concurrency);
    }
  }
  /**
   * @type {String}
   */
  static get extensionName() {
    return "permessage-deflate";
  }
  /**
   * Create an extension negotiation offer.
   *
   * @return {Object} Extension parameters
   * @public
   */
  offer() {
    const params = {};
    if (this._options.serverNoContextTakeover) {
      params.server_no_context_takeover = true;
    }
    if (this._options.clientNoContextTakeover) {
      params.client_no_context_takeover = true;
    }
    if (this._options.serverMaxWindowBits) {
      params.server_max_window_bits = this._options.serverMaxWindowBits;
    }
    if (this._options.clientMaxWindowBits) {
      params.client_max_window_bits = this._options.clientMaxWindowBits;
    } else if (this._options.clientMaxWindowBits == null) {
      params.client_max_window_bits = true;
    }
    return params;
  }
  /**
   * Accept an extension negotiation offer/response.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Object} Accepted configuration
   * @public
   */
  accept(configurations) {
    configurations = this.normalizeParams(configurations);
    this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
    return this.params;
  }
  /**
   * Releases all resources used by the extension.
   *
   * @public
   */
  cleanup() {
    if (this._inflate) {
      this._inflate.close();
      this._inflate = null;
    }
    if (this._deflate) {
      const callback = this._deflate[kCallback];
      this._deflate.close();
      this._deflate = null;
      if (callback) {
        callback(
          new Error(
            "The deflate stream was closed while data was being processed"
          )
        );
      }
    }
  }
  /**
   *  Accept an extension negotiation offer.
   *
   * @param {Array} offers The extension negotiation offers
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsServer(offers) {
    const opts = this._options;
    const accepted = offers.find((params) => {
      if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
        return false;
      }
      return true;
    });
    if (!accepted) {
      throw new Error("None of the extension offers can be accepted");
    }
    if (opts.serverNoContextTakeover) {
      accepted.server_no_context_takeover = true;
    }
    if (opts.clientNoContextTakeover) {
      accepted.client_no_context_takeover = true;
    }
    if (typeof opts.serverMaxWindowBits === "number") {
      accepted.server_max_window_bits = opts.serverMaxWindowBits;
    }
    if (typeof opts.clientMaxWindowBits === "number") {
      accepted.client_max_window_bits = opts.clientMaxWindowBits;
    } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
      delete accepted.client_max_window_bits;
    }
    return accepted;
  }
  /**
   * Accept the extension negotiation response.
   *
   * @param {Array} response The extension negotiation response
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsClient(response) {
    const params = response[0];
    if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
      throw new Error('Unexpected parameter "client_no_context_takeover"');
    }
    if (!params.client_max_window_bits) {
      if (typeof this._options.clientMaxWindowBits === "number") {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      }
    } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
      throw new Error(
        'Unexpected or invalid parameter "client_max_window_bits"'
      );
    }
    return params;
  }
  /**
   * Normalize parameters.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Array} The offers/response with normalized parameters
   * @private
   */
  normalizeParams(configurations) {
    configurations.forEach((params) => {
      Object.keys(params).forEach((key) => {
        let value = params[key];
        if (value.length > 1) {
          throw new Error(`Parameter "${key}" must have only a single value`);
        }
        value = value[0];
        if (key === "client_max_window_bits") {
          if (value !== true) {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
            value = num;
          } else if (!this._isServer) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else if (key === "server_max_window_bits") {
          const num = +value;
          if (!Number.isInteger(num) || num < 8 || num > 15) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
          value = num;
        } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
          if (value !== true) {
            throw new TypeError(
              `Invalid value for parameter "${key}": ${value}`
            );
          }
        } else {
          throw new Error(`Unknown parameter "${key}"`);
        }
        params[key] = value;
      });
    });
    return configurations;
  }
  /**
   * Decompress data. Concurrency limited.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  decompress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._decompress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  /**
   * Compress data. Concurrency limited.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  compress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._compress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  /**
   * Decompress data.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _decompress(data, fin, callback) {
    const endpoint = this._isServer ? "client" : "server";
    if (!this._inflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._inflate = zlib.createInflateRaw({
        ...this._options.zlibInflateOptions,
        windowBits
      });
      this._inflate[kPerMessageDeflate] = this;
      this._inflate[kTotalLength] = 0;
      this._inflate[kBuffers] = [];
      this._inflate.on("error", inflateOnError);
      this._inflate.on("data", inflateOnData);
    }
    this._inflate[kCallback] = callback;
    this._inflate.write(data);
    if (fin) this._inflate.write(TRAILER);
    this._inflate.flush(() => {
      const err = this._inflate[kError$1];
      if (err) {
        this._inflate.close();
        this._inflate = null;
        callback(err);
        return;
      }
      const data2 = bufferUtil.concat(
        this._inflate[kBuffers],
        this._inflate[kTotalLength]
      );
      if (this._inflate._readableState.endEmitted) {
        this._inflate.close();
        this._inflate = null;
      } else {
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];
        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.reset();
        }
      }
      callback(null, data2);
    });
  }
  /**
   * Compress data.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _compress(data, fin, callback) {
    const endpoint = this._isServer ? "server" : "client";
    if (!this._deflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._deflate = zlib.createDeflateRaw({
        ...this._options.zlibDeflateOptions,
        windowBits
      });
      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];
      this._deflate.on("data", deflateOnData);
    }
    this._deflate[kCallback] = callback;
    this._deflate.write(data);
    this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
      if (!this._deflate) {
        return;
      }
      let data2 = bufferUtil.concat(
        this._deflate[kBuffers],
        this._deflate[kTotalLength]
      );
      if (fin) {
        data2 = new FastBuffer$1(data2.buffer, data2.byteOffset, data2.length - 4);
      }
      this._deflate[kCallback] = null;
      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];
      if (fin && this.params[`${endpoint}_no_context_takeover`]) {
        this._deflate.reset();
      }
      callback(null, data2);
    });
  }
};
var permessageDeflate = PerMessageDeflate$3;
function deflateOnData(chunk) {
  this[kBuffers].push(chunk);
  this[kTotalLength] += chunk.length;
}
function inflateOnData(chunk) {
  this[kTotalLength] += chunk.length;
  if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
    this[kBuffers].push(chunk);
    return;
  }
  this[kError$1] = new RangeError("Max payload size exceeded");
  this[kError$1].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
  this[kError$1][kStatusCode$2] = 1009;
  this.removeListener("data", inflateOnData);
  this.reset();
}
function inflateOnError(err) {
  this[kPerMessageDeflate]._inflate = null;
  if (this[kError$1]) {
    this[kCallback](this[kError$1]);
    return;
  }
  err[kStatusCode$2] = 1007;
  this[kCallback](err);
}
var validation = { exports: {} };
var utf8Validate = { exports: {} };
var fallback;
var hasRequiredFallback;
function requireFallback() {
  if (hasRequiredFallback) return fallback;
  hasRequiredFallback = 1;
  function isValidUTF82(buf) {
    const len = buf.length;
    let i = 0;
    while (i < len) {
      if ((buf[i] & 128) === 0) {
        i++;
      } else if ((buf[i] & 224) === 192) {
        if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
          return false;
        }
        i += 2;
      } else if ((buf[i] & 240) === 224) {
        if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // overlong
        buf[i] === 237 && (buf[i + 1] & 224) === 160) {
          return false;
        }
        i += 3;
      } else if ((buf[i] & 248) === 240) {
        if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // overlong
        buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
          return false;
        }
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  }
  fallback = isValidUTF82;
  return fallback;
}
var hasRequiredUtf8Validate;
function requireUtf8Validate() {
  if (hasRequiredUtf8Validate) return utf8Validate.exports;
  hasRequiredUtf8Validate = 1;
  try {
    utf8Validate.exports = requireNodeGypBuild()(__dirname);
  } catch (e) {
    utf8Validate.exports = requireFallback();
  }
  return utf8Validate.exports;
}
var isValidUTF8_1;
const { isUtf8 } = require$$0$4;
const { hasBlob } = constants;
const tokenChars$2 = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 0 - 15
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 16 - 31
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  0,
  // 32 - 47
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  // 48 - 63
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 64 - 79
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  1,
  1,
  // 80 - 95
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 96 - 111
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  0,
  1,
  0
  // 112 - 127
];
function isValidStatusCode$2(code) {
  return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
}
function _isValidUTF8(buf) {
  const len = buf.length;
  let i = 0;
  while (i < len) {
    if ((buf[i] & 128) === 0) {
      i++;
    } else if ((buf[i] & 224) === 192) {
      if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
        return false;
      }
      i += 2;
    } else if ((buf[i] & 240) === 224) {
      if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
      buf[i] === 237 && (buf[i + 1] & 224) === 160) {
        return false;
      }
      i += 3;
    } else if ((buf[i] & 248) === 240) {
      if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
      buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
        return false;
      }
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}
function isBlob$2(value) {
  return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
}
validation.exports = {
  isBlob: isBlob$2,
  isValidStatusCode: isValidStatusCode$2,
  isValidUTF8: _isValidUTF8,
  tokenChars: tokenChars$2
};
if (isUtf8) {
  isValidUTF8_1 = validation.exports.isValidUTF8 = function(buf) {
    return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
  };
} else if (!process.env.WS_NO_UTF_8_VALIDATE) {
  try {
    const isValidUTF82 = requireUtf8Validate();
    isValidUTF8_1 = validation.exports.isValidUTF8 = function(buf) {
      return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF82(buf);
    };
  } catch (e) {
  }
}
var validationExports = validation.exports;
const { Writable } = require$$0$1;
const PerMessageDeflate$2 = permessageDeflate;
const {
  BINARY_TYPES: BINARY_TYPES$1,
  EMPTY_BUFFER: EMPTY_BUFFER$2,
  kStatusCode: kStatusCode$1,
  kWebSocket: kWebSocket$3
} = constants;
const { concat, toArrayBuffer, unmask } = bufferUtilExports;
const { isValidStatusCode: isValidStatusCode$1, isValidUTF8 } = validationExports;
const FastBuffer = Buffer[Symbol.species];
const GET_INFO = 0;
const GET_PAYLOAD_LENGTH_16 = 1;
const GET_PAYLOAD_LENGTH_64 = 2;
const GET_MASK = 3;
const GET_DATA = 4;
const INFLATING = 5;
const DEFER_EVENT = 6;
let Receiver$1 = class Receiver extends Writable {
  /**
   * Creates a Receiver instance.
   *
   * @param {Object} [options] Options object
   * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {String} [options.binaryType=nodebuffer] The type for binary data
   * @param {Object} [options.extensions] An object containing the negotiated
   *     extensions
   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
   *     client or server mode
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   */
  constructor(options = {}) {
    super();
    this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
    this._binaryType = options.binaryType || BINARY_TYPES$1[0];
    this._extensions = options.extensions || {};
    this._isServer = !!options.isServer;
    this._maxPayload = options.maxPayload | 0;
    this._skipUTF8Validation = !!options.skipUTF8Validation;
    this[kWebSocket$3] = void 0;
    this._bufferedBytes = 0;
    this._buffers = [];
    this._compressed = false;
    this._payloadLength = 0;
    this._mask = void 0;
    this._fragmented = 0;
    this._masked = false;
    this._fin = false;
    this._opcode = 0;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._fragments = [];
    this._errored = false;
    this._loop = false;
    this._state = GET_INFO;
  }
  /**
   * Implements `Writable.prototype._write()`.
   *
   * @param {Buffer} chunk The chunk of data to write
   * @param {String} encoding The character encoding of `chunk`
   * @param {Function} cb Callback
   * @private
   */
  _write(chunk, encoding, cb) {
    if (this._opcode === 8 && this._state == GET_INFO) return cb();
    this._bufferedBytes += chunk.length;
    this._buffers.push(chunk);
    this.startLoop(cb);
  }
  /**
   * Consumes `n` bytes from the buffered data.
   *
   * @param {Number} n The number of bytes to consume
   * @return {Buffer} The consumed bytes
   * @private
   */
  consume(n) {
    this._bufferedBytes -= n;
    if (n === this._buffers[0].length) return this._buffers.shift();
    if (n < this._buffers[0].length) {
      const buf = this._buffers[0];
      this._buffers[0] = new FastBuffer(
        buf.buffer,
        buf.byteOffset + n,
        buf.length - n
      );
      return new FastBuffer(buf.buffer, buf.byteOffset, n);
    }
    const dst = Buffer.allocUnsafe(n);
    do {
      const buf = this._buffers[0];
      const offset = dst.length - n;
      if (n >= buf.length) {
        dst.set(this._buffers.shift(), offset);
      } else {
        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
        this._buffers[0] = new FastBuffer(
          buf.buffer,
          buf.byteOffset + n,
          buf.length - n
        );
      }
      n -= buf.length;
    } while (n > 0);
    return dst;
  }
  /**
   * Starts the parsing loop.
   *
   * @param {Function} cb Callback
   * @private
   */
  startLoop(cb) {
    this._loop = true;
    do {
      switch (this._state) {
        case GET_INFO:
          this.getInfo(cb);
          break;
        case GET_PAYLOAD_LENGTH_16:
          this.getPayloadLength16(cb);
          break;
        case GET_PAYLOAD_LENGTH_64:
          this.getPayloadLength64(cb);
          break;
        case GET_MASK:
          this.getMask();
          break;
        case GET_DATA:
          this.getData(cb);
          break;
        case INFLATING:
        case DEFER_EVENT:
          this._loop = false;
          return;
      }
    } while (this._loop);
    if (!this._errored) cb();
  }
  /**
   * Reads the first two bytes of a frame.
   *
   * @param {Function} cb Callback
   * @private
   */
  getInfo(cb) {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    const buf = this.consume(2);
    if ((buf[0] & 48) !== 0) {
      const error = this.createError(
        RangeError,
        "RSV2 and RSV3 must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_RSV_2_3"
      );
      cb(error);
      return;
    }
    const compressed = (buf[0] & 64) === 64;
    if (compressed && !this._extensions[PerMessageDeflate$2.extensionName]) {
      const error = this.createError(
        RangeError,
        "RSV1 must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_RSV_1"
      );
      cb(error);
      return;
    }
    this._fin = (buf[0] & 128) === 128;
    this._opcode = buf[0] & 15;
    this._payloadLength = buf[1] & 127;
    if (this._opcode === 0) {
      if (compressed) {
        const error = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error);
        return;
      }
      if (!this._fragmented) {
        const error = this.createError(
          RangeError,
          "invalid opcode 0",
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error);
        return;
      }
      this._opcode = this._fragmented;
    } else if (this._opcode === 1 || this._opcode === 2) {
      if (this._fragmented) {
        const error = this.createError(
          RangeError,
          `invalid opcode ${this._opcode}`,
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error);
        return;
      }
      this._compressed = compressed;
    } else if (this._opcode > 7 && this._opcode < 11) {
      if (!this._fin) {
        const error = this.createError(
          RangeError,
          "FIN must be set",
          true,
          1002,
          "WS_ERR_EXPECTED_FIN"
        );
        cb(error);
        return;
      }
      if (compressed) {
        const error = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error);
        return;
      }
      if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
        const error = this.createError(
          RangeError,
          `invalid payload length ${this._payloadLength}`,
          true,
          1002,
          "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
        );
        cb(error);
        return;
      }
    } else {
      const error = this.createError(
        RangeError,
        `invalid opcode ${this._opcode}`,
        true,
        1002,
        "WS_ERR_INVALID_OPCODE"
      );
      cb(error);
      return;
    }
    if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
    this._masked = (buf[1] & 128) === 128;
    if (this._isServer) {
      if (!this._masked) {
        const error = this.createError(
          RangeError,
          "MASK must be set",
          true,
          1002,
          "WS_ERR_EXPECTED_MASK"
        );
        cb(error);
        return;
      }
    } else if (this._masked) {
      const error = this.createError(
        RangeError,
        "MASK must be clear",
        true,
        1002,
        "WS_ERR_UNEXPECTED_MASK"
      );
      cb(error);
      return;
    }
    if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
    else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
    else this.haveLength(cb);
  }
  /**
   * Gets extended payload length (7+16).
   *
   * @param {Function} cb Callback
   * @private
   */
  getPayloadLength16(cb) {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    this._payloadLength = this.consume(2).readUInt16BE(0);
    this.haveLength(cb);
  }
  /**
   * Gets extended payload length (7+64).
   *
   * @param {Function} cb Callback
   * @private
   */
  getPayloadLength64(cb) {
    if (this._bufferedBytes < 8) {
      this._loop = false;
      return;
    }
    const buf = this.consume(8);
    const num = buf.readUInt32BE(0);
    if (num > Math.pow(2, 53 - 32) - 1) {
      const error = this.createError(
        RangeError,
        "Unsupported WebSocket frame: payload length > 2^53 - 1",
        false,
        1009,
        "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
      );
      cb(error);
      return;
    }
    this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
    this.haveLength(cb);
  }
  /**
   * Payload length has been read.
   *
   * @param {Function} cb Callback
   * @private
   */
  haveLength(cb) {
    if (this._payloadLength && this._opcode < 8) {
      this._totalPayloadLength += this._payloadLength;
      if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
        const error = this.createError(
          RangeError,
          "Max payload size exceeded",
          false,
          1009,
          "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
        );
        cb(error);
        return;
      }
    }
    if (this._masked) this._state = GET_MASK;
    else this._state = GET_DATA;
  }
  /**
   * Reads mask bytes.
   *
   * @private
   */
  getMask() {
    if (this._bufferedBytes < 4) {
      this._loop = false;
      return;
    }
    this._mask = this.consume(4);
    this._state = GET_DATA;
  }
  /**
   * Reads data bytes.
   *
   * @param {Function} cb Callback
   * @private
   */
  getData(cb) {
    let data = EMPTY_BUFFER$2;
    if (this._payloadLength) {
      if (this._bufferedBytes < this._payloadLength) {
        this._loop = false;
        return;
      }
      data = this.consume(this._payloadLength);
      if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
        unmask(data, this._mask);
      }
    }
    if (this._opcode > 7) {
      this.controlMessage(data, cb);
      return;
    }
    if (this._compressed) {
      this._state = INFLATING;
      this.decompress(data, cb);
      return;
    }
    if (data.length) {
      this._messageLength = this._totalPayloadLength;
      this._fragments.push(data);
    }
    this.dataMessage(cb);
  }
  /**
   * Decompresses data.
   *
   * @param {Buffer} data Compressed data
   * @param {Function} cb Callback
   * @private
   */
  decompress(data, cb) {
    const perMessageDeflate = this._extensions[PerMessageDeflate$2.extensionName];
    perMessageDeflate.decompress(data, this._fin, (err, buf) => {
      if (err) return cb(err);
      if (buf.length) {
        this._messageLength += buf.length;
        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
          const error = this.createError(
            RangeError,
            "Max payload size exceeded",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
          );
          cb(error);
          return;
        }
        this._fragments.push(buf);
      }
      this.dataMessage(cb);
      if (this._state === GET_INFO) this.startLoop(cb);
    });
  }
  /**
   * Handles a data message.
   *
   * @param {Function} cb Callback
   * @private
   */
  dataMessage(cb) {
    if (!this._fin) {
      this._state = GET_INFO;
      return;
    }
    const messageLength = this._messageLength;
    const fragments = this._fragments;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._fragmented = 0;
    this._fragments = [];
    if (this._opcode === 2) {
      let data;
      if (this._binaryType === "nodebuffer") {
        data = concat(fragments, messageLength);
      } else if (this._binaryType === "arraybuffer") {
        data = toArrayBuffer(concat(fragments, messageLength));
      } else if (this._binaryType === "blob") {
        data = new Blob(fragments);
      } else {
        data = fragments;
      }
      if (this._allowSynchronousEvents) {
        this.emit("message", data, true);
        this._state = GET_INFO;
      } else {
        this._state = DEFER_EVENT;
        setImmediate(() => {
          this.emit("message", data, true);
          this._state = GET_INFO;
          this.startLoop(cb);
        });
      }
    } else {
      const buf = concat(fragments, messageLength);
      if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
        const error = this.createError(
          Error,
          "invalid UTF-8 sequence",
          true,
          1007,
          "WS_ERR_INVALID_UTF8"
        );
        cb(error);
        return;
      }
      if (this._state === INFLATING || this._allowSynchronousEvents) {
        this.emit("message", buf, false);
        this._state = GET_INFO;
      } else {
        this._state = DEFER_EVENT;
        setImmediate(() => {
          this.emit("message", buf, false);
          this._state = GET_INFO;
          this.startLoop(cb);
        });
      }
    }
  }
  /**
   * Handles a control message.
   *
   * @param {Buffer} data Data to handle
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  controlMessage(data, cb) {
    if (this._opcode === 8) {
      if (data.length === 0) {
        this._loop = false;
        this.emit("conclude", 1005, EMPTY_BUFFER$2);
        this.end();
      } else {
        const code = data.readUInt16BE(0);
        if (!isValidStatusCode$1(code)) {
          const error = this.createError(
            RangeError,
            `invalid status code ${code}`,
            true,
            1002,
            "WS_ERR_INVALID_CLOSE_CODE"
          );
          cb(error);
          return;
        }
        const buf = new FastBuffer(
          data.buffer,
          data.byteOffset + 2,
          data.length - 2
        );
        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
          const error = this.createError(
            Error,
            "invalid UTF-8 sequence",
            true,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
          cb(error);
          return;
        }
        this._loop = false;
        this.emit("conclude", code, buf);
        this.end();
      }
      this._state = GET_INFO;
      return;
    }
    if (this._allowSynchronousEvents) {
      this.emit(this._opcode === 9 ? "ping" : "pong", data);
      this._state = GET_INFO;
    } else {
      this._state = DEFER_EVENT;
      setImmediate(() => {
        this.emit(this._opcode === 9 ? "ping" : "pong", data);
        this._state = GET_INFO;
        this.startLoop(cb);
      });
    }
  }
  /**
   * Builds an error object.
   *
   * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
   * @param {String} message The error message
   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
   *     `message`
   * @param {Number} statusCode The status code
   * @param {String} errorCode The exposed error code
   * @return {(Error|RangeError)} The error
   * @private
   */
  createError(ErrorCtor, message, prefix, statusCode, errorCode) {
    this._loop = false;
    this._errored = true;
    const err = new ErrorCtor(
      prefix ? `Invalid WebSocket frame: ${message}` : message
    );
    Error.captureStackTrace(err, this.createError);
    err.code = errorCode;
    err[kStatusCode$1] = statusCode;
    return err;
  }
};
var receiver = Receiver$1;
const { Duplex: Duplex$3 } = require$$0$1;
const { randomFillSync } = require$$3;
const PerMessageDeflate$1 = permessageDeflate;
const { EMPTY_BUFFER: EMPTY_BUFFER$1, kWebSocket: kWebSocket$2, NOOP: NOOP$1 } = constants;
const { isBlob: isBlob$1, isValidStatusCode } = validationExports;
const { mask: applyMask, toBuffer: toBuffer$1 } = bufferUtilExports;
const kByteLength = Symbol("kByteLength");
const maskBuffer = Buffer.alloc(4);
const RANDOM_POOL_SIZE = 8 * 1024;
let randomPool;
let randomPoolPointer = RANDOM_POOL_SIZE;
const DEFAULT = 0;
const DEFLATING = 1;
const GET_BLOB_DATA = 2;
let Sender$1 = class Sender {
  /**
   * Creates a Sender instance.
   *
   * @param {Duplex} socket The connection socket
   * @param {Object} [extensions] An object containing the negotiated extensions
   * @param {Function} [generateMask] The function used to generate the masking
   *     key
   */
  constructor(socket, extensions, generateMask) {
    this._extensions = extensions || {};
    if (generateMask) {
      this._generateMask = generateMask;
      this._maskBuffer = Buffer.alloc(4);
    }
    this._socket = socket;
    this._firstFragment = true;
    this._compress = false;
    this._bufferedBytes = 0;
    this._queue = [];
    this._state = DEFAULT;
    this.onerror = NOOP$1;
    this[kWebSocket$2] = void 0;
  }
  /**
   * Frames a piece of data according to the HyBi WebSocket protocol.
   *
   * @param {(Buffer|String)} data The data to frame
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @return {(Buffer|String)[]} The framed data
   * @public
   */
  static frame(data, options) {
    let mask2;
    let merge = false;
    let offset = 2;
    let skipMasking = false;
    if (options.mask) {
      mask2 = options.maskBuffer || maskBuffer;
      if (options.generateMask) {
        options.generateMask(mask2);
      } else {
        if (randomPoolPointer === RANDOM_POOL_SIZE) {
          if (randomPool === void 0) {
            randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
          }
          randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
          randomPoolPointer = 0;
        }
        mask2[0] = randomPool[randomPoolPointer++];
        mask2[1] = randomPool[randomPoolPointer++];
        mask2[2] = randomPool[randomPoolPointer++];
        mask2[3] = randomPool[randomPoolPointer++];
      }
      skipMasking = (mask2[0] | mask2[1] | mask2[2] | mask2[3]) === 0;
      offset = 6;
    }
    let dataLength;
    if (typeof data === "string") {
      if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
        dataLength = options[kByteLength];
      } else {
        data = Buffer.from(data);
        dataLength = data.length;
      }
    } else {
      dataLength = data.length;
      merge = options.mask && options.readOnly && !skipMasking;
    }
    let payloadLength = dataLength;
    if (dataLength >= 65536) {
      offset += 8;
      payloadLength = 127;
    } else if (dataLength > 125) {
      offset += 2;
      payloadLength = 126;
    }
    const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
    target[0] = options.fin ? options.opcode | 128 : options.opcode;
    if (options.rsv1) target[0] |= 64;
    target[1] = payloadLength;
    if (payloadLength === 126) {
      target.writeUInt16BE(dataLength, 2);
    } else if (payloadLength === 127) {
      target[2] = target[3] = 0;
      target.writeUIntBE(dataLength, 4, 6);
    }
    if (!options.mask) return [target, data];
    target[1] |= 128;
    target[offset - 4] = mask2[0];
    target[offset - 3] = mask2[1];
    target[offset - 2] = mask2[2];
    target[offset - 1] = mask2[3];
    if (skipMasking) return [target, data];
    if (merge) {
      applyMask(data, mask2, target, offset, dataLength);
      return [target];
    }
    applyMask(data, mask2, data, 0, dataLength);
    return [target, data];
  }
  /**
   * Sends a close message to the other peer.
   *
   * @param {Number} [code] The status code component of the body
   * @param {(String|Buffer)} [data] The message component of the body
   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
   * @param {Function} [cb] Callback
   * @public
   */
  close(code, data, mask2, cb) {
    let buf;
    if (code === void 0) {
      buf = EMPTY_BUFFER$1;
    } else if (typeof code !== "number" || !isValidStatusCode(code)) {
      throw new TypeError("First argument must be a valid error code number");
    } else if (data === void 0 || !data.length) {
      buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(code, 0);
    } else {
      const length = Buffer.byteLength(data);
      if (length > 123) {
        throw new RangeError("The message must not be greater than 123 bytes");
      }
      buf = Buffer.allocUnsafe(2 + length);
      buf.writeUInt16BE(code, 0);
      if (typeof data === "string") {
        buf.write(data, 2);
      } else {
        buf.set(data, 2);
      }
    }
    const options = {
      [kByteLength]: buf.length,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 8,
      readOnly: false,
      rsv1: false
    };
    if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, buf, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(buf, options), cb);
    }
  }
  /**
   * Sends a ping message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  ping(data, mask2, cb) {
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$1(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }
    if (byteLength > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    const options = {
      [kByteLength]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 9,
      readOnly,
      rsv1: false
    };
    if (isBlob$1(data)) {
      if (this._state !== DEFAULT) {
        this.enqueue([this.getBlobData, data, false, options, cb]);
      } else {
        this.getBlobData(data, false, options, cb);
      }
    } else if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(data, options), cb);
    }
  }
  /**
   * Sends a pong message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  pong(data, mask2, cb) {
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$1(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }
    if (byteLength > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    const options = {
      [kByteLength]: byteLength,
      fin: true,
      generateMask: this._generateMask,
      mask: mask2,
      maskBuffer: this._maskBuffer,
      opcode: 10,
      readOnly,
      rsv1: false
    };
    if (isBlob$1(data)) {
      if (this._state !== DEFAULT) {
        this.enqueue([this.getBlobData, data, false, options, cb]);
      } else {
        this.getBlobData(data, false, options, cb);
      }
    } else if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, data, false, options, cb]);
    } else {
      this.sendFrame(Sender.frame(data, options), cb);
    }
  }
  /**
   * Sends a data message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
   *     or text
   * @param {Boolean} [options.compress=false] Specifies whether or not to
   *     compress `data`
   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Function} [cb] Callback
   * @public
   */
  send(data, options, cb) {
    const perMessageDeflate = this._extensions[PerMessageDeflate$1.extensionName];
    let opcode = options.binary ? 2 : 1;
    let rsv1 = options.compress;
    let byteLength;
    let readOnly;
    if (typeof data === "string") {
      byteLength = Buffer.byteLength(data);
      readOnly = false;
    } else if (isBlob$1(data)) {
      byteLength = data.size;
      readOnly = false;
    } else {
      data = toBuffer$1(data);
      byteLength = data.length;
      readOnly = toBuffer$1.readOnly;
    }
    if (this._firstFragment) {
      this._firstFragment = false;
      if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
        rsv1 = byteLength >= perMessageDeflate._threshold;
      }
      this._compress = rsv1;
    } else {
      rsv1 = false;
      opcode = 0;
    }
    if (options.fin) this._firstFragment = true;
    const opts = {
      [kByteLength]: byteLength,
      fin: options.fin,
      generateMask: this._generateMask,
      mask: options.mask,
      maskBuffer: this._maskBuffer,
      opcode,
      readOnly,
      rsv1
    };
    if (isBlob$1(data)) {
      if (this._state !== DEFAULT) {
        this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
      } else {
        this.getBlobData(data, this._compress, opts, cb);
      }
    } else if (this._state !== DEFAULT) {
      this.enqueue([this.dispatch, data, this._compress, opts, cb]);
    } else {
      this.dispatch(data, this._compress, opts, cb);
    }
  }
  /**
   * Gets the contents of a blob as binary data.
   *
   * @param {Blob} blob The blob
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     the data
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  getBlobData(blob, compress, options, cb) {
    this._bufferedBytes += options[kByteLength];
    this._state = GET_BLOB_DATA;
    blob.arrayBuffer().then((arrayBuffer) => {
      if (this._socket.destroyed) {
        const err = new Error(
          "The socket was closed while the blob was being read"
        );
        process.nextTick(callCallbacks, this, err, cb);
        return;
      }
      this._bufferedBytes -= options[kByteLength];
      const data = toBuffer$1(arrayBuffer);
      if (!compress) {
        this._state = DEFAULT;
        this.sendFrame(Sender.frame(data, options), cb);
        this.dequeue();
      } else {
        this.dispatch(data, compress, options, cb);
      }
    }).catch((err) => {
      process.nextTick(onError, this, err, cb);
    });
  }
  /**
   * Dispatches a message.
   *
   * @param {(Buffer|String)} data The message to send
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     `data`
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  dispatch(data, compress, options, cb) {
    if (!compress) {
      this.sendFrame(Sender.frame(data, options), cb);
      return;
    }
    const perMessageDeflate = this._extensions[PerMessageDeflate$1.extensionName];
    this._bufferedBytes += options[kByteLength];
    this._state = DEFLATING;
    perMessageDeflate.compress(data, options.fin, (_, buf) => {
      if (this._socket.destroyed) {
        const err = new Error(
          "The socket was closed while data was being compressed"
        );
        callCallbacks(this, err, cb);
        return;
      }
      this._bufferedBytes -= options[kByteLength];
      this._state = DEFAULT;
      options.readOnly = false;
      this.sendFrame(Sender.frame(buf, options), cb);
      this.dequeue();
    });
  }
  /**
   * Executes queued send operations.
   *
   * @private
   */
  dequeue() {
    while (this._state === DEFAULT && this._queue.length) {
      const params = this._queue.shift();
      this._bufferedBytes -= params[3][kByteLength];
      Reflect.apply(params[0], this, params.slice(1));
    }
  }
  /**
   * Enqueues a send operation.
   *
   * @param {Array} params Send operation parameters.
   * @private
   */
  enqueue(params) {
    this._bufferedBytes += params[3][kByteLength];
    this._queue.push(params);
  }
  /**
   * Sends a frame.
   *
   * @param {(Buffer | String)[]} list The frame to send
   * @param {Function} [cb] Callback
   * @private
   */
  sendFrame(list, cb) {
    if (list.length === 2) {
      this._socket.cork();
      this._socket.write(list[0]);
      this._socket.write(list[1], cb);
      this._socket.uncork();
    } else {
      this._socket.write(list[0], cb);
    }
  }
};
var sender = Sender$1;
function callCallbacks(sender2, err, cb) {
  if (typeof cb === "function") cb(err);
  for (let i = 0; i < sender2._queue.length; i++) {
    const params = sender2._queue[i];
    const callback = params[params.length - 1];
    if (typeof callback === "function") callback(err);
  }
}
function onError(sender2, err, cb) {
  callCallbacks(sender2, err, cb);
  sender2.onerror(err);
}
const { kForOnEventAttribute: kForOnEventAttribute$1, kListener: kListener$1 } = constants;
const kCode = Symbol("kCode");
const kData = Symbol("kData");
const kError = Symbol("kError");
const kMessage = Symbol("kMessage");
const kReason = Symbol("kReason");
const kTarget = Symbol("kTarget");
const kType = Symbol("kType");
const kWasClean = Symbol("kWasClean");
let Event$1 = class Event {
  /**
   * Create a new `Event`.
   *
   * @param {String} type The name of the event
   * @throws {TypeError} If the `type` argument is not specified
   */
  constructor(type) {
    this[kTarget] = null;
    this[kType] = type;
  }
  /**
   * @type {*}
   */
  get target() {
    return this[kTarget];
  }
  /**
   * @type {String}
   */
  get type() {
    return this[kType];
  }
};
Object.defineProperty(Event$1.prototype, "target", { enumerable: true });
Object.defineProperty(Event$1.prototype, "type", { enumerable: true });
let CloseEvent$1 = class CloseEvent extends Event$1 {
  /**
   * Create a new `CloseEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {Number} [options.code=0] The status code explaining why the
   *     connection was closed
   * @param {String} [options.reason=''] A human-readable string explaining why
   *     the connection was closed
   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
   *     connection was cleanly closed
   */
  constructor(type, options = {}) {
    super(type);
    this[kCode] = options.code === void 0 ? 0 : options.code;
    this[kReason] = options.reason === void 0 ? "" : options.reason;
    this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
  }
  /**
   * @type {Number}
   */
  get code() {
    return this[kCode];
  }
  /**
   * @type {String}
   */
  get reason() {
    return this[kReason];
  }
  /**
   * @type {Boolean}
   */
  get wasClean() {
    return this[kWasClean];
  }
};
Object.defineProperty(CloseEvent$1.prototype, "code", { enumerable: true });
Object.defineProperty(CloseEvent$1.prototype, "reason", { enumerable: true });
Object.defineProperty(CloseEvent$1.prototype, "wasClean", { enumerable: true });
let ErrorEvent$1 = class ErrorEvent extends Event$1 {
  /**
   * Create a new `ErrorEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.error=null] The error that generated this event
   * @param {String} [options.message=''] The error message
   */
  constructor(type, options = {}) {
    super(type);
    this[kError] = options.error === void 0 ? null : options.error;
    this[kMessage] = options.message === void 0 ? "" : options.message;
  }
  /**
   * @type {*}
   */
  get error() {
    return this[kError];
  }
  /**
   * @type {String}
   */
  get message() {
    return this[kMessage];
  }
};
Object.defineProperty(ErrorEvent$1.prototype, "error", { enumerable: true });
Object.defineProperty(ErrorEvent$1.prototype, "message", { enumerable: true });
class MessageEvent extends Event$1 {
  /**
   * Create a new `MessageEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.data=null] The message content
   */
  constructor(type, options = {}) {
    super(type);
    this[kData] = options.data === void 0 ? null : options.data;
  }
  /**
   * @type {*}
   */
  get data() {
    return this[kData];
  }
}
Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
const EventTarget = {
  /**
   * Register an event listener.
   *
   * @param {String} type A string representing the event type to listen for
   * @param {(Function|Object)} handler The listener to add
   * @param {Object} [options] An options object specifies characteristics about
   *     the event listener
   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
   *     listener should be invoked at most once after being added. If `true`,
   *     the listener would be automatically removed when invoked.
   * @public
   */
  addEventListener(type, handler, options = {}) {
    for (const listener of this.listeners(type)) {
      if (!options[kForOnEventAttribute$1] && listener[kListener$1] === handler && !listener[kForOnEventAttribute$1]) {
        return;
      }
    }
    let wrapper;
    if (type === "message") {
      wrapper = function onMessage(data, isBinary) {
        const event = new MessageEvent("message", {
          data: isBinary ? data : data.toString()
        });
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === "close") {
      wrapper = function onClose(code, message) {
        const event = new CloseEvent$1("close", {
          code,
          reason: message.toString(),
          wasClean: this._closeFrameReceived && this._closeFrameSent
        });
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === "error") {
      wrapper = function onError2(error) {
        const event = new ErrorEvent$1("error", {
          error,
          message: error.message
        });
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else if (type === "open") {
      wrapper = function onOpen() {
        const event = new Event$1("open");
        event[kTarget] = this;
        callListener(handler, this, event);
      };
    } else {
      return;
    }
    wrapper[kForOnEventAttribute$1] = !!options[kForOnEventAttribute$1];
    wrapper[kListener$1] = handler;
    if (options.once) {
      this.once(type, wrapper);
    } else {
      this.on(type, wrapper);
    }
  },
  /**
   * Remove an event listener.
   *
   * @param {String} type A string representing the event type to remove
   * @param {(Function|Object)} handler The listener to remove
   * @public
   */
  removeEventListener(type, handler) {
    for (const listener of this.listeners(type)) {
      if (listener[kListener$1] === handler && !listener[kForOnEventAttribute$1]) {
        this.removeListener(type, listener);
        break;
      }
    }
  }
};
var eventTarget = {
  EventTarget
};
function callListener(listener, thisArg, event) {
  if (typeof listener === "object" && listener.handleEvent) {
    listener.handleEvent.call(listener, event);
  } else {
    listener.call(thisArg, event);
  }
}
const { tokenChars: tokenChars$1 } = validationExports;
function push(dest, name, elem) {
  if (dest[name] === void 0) dest[name] = [elem];
  else dest[name].push(elem);
}
function parse$1(header) {
  const offers = /* @__PURE__ */ Object.create(null);
  let params = /* @__PURE__ */ Object.create(null);
  let mustUnescape = false;
  let isEscaping = false;
  let inQuotes = false;
  let extensionName;
  let paramName;
  let start = -1;
  let code = -1;
  let end = -1;
  let i = 0;
  for (; i < header.length; i++) {
    code = header.charCodeAt(i);
    if (extensionName === void 0) {
      if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        const name = header.slice(start, end);
        if (code === 44) {
          push(offers, name, params);
          params = /* @__PURE__ */ Object.create(null);
        } else {
          extensionName = name;
        }
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else if (paramName === void 0) {
      if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (code === 32 || code === 9) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        push(params, header.slice(start, end), true);
        if (code === 44) {
          push(offers, extensionName, params);
          params = /* @__PURE__ */ Object.create(null);
          extensionName = void 0;
        }
        start = end = -1;
      } else if (code === 61 && start !== -1 && end === -1) {
        paramName = header.slice(start, i);
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else {
      if (isEscaping) {
        if (tokenChars$1[code] !== 1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (start === -1) start = i;
        else if (!mustUnescape) mustUnescape = true;
        isEscaping = false;
      } else if (inQuotes) {
        if (tokenChars$1[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 34 && start !== -1) {
          inQuotes = false;
          end = i;
        } else if (code === 92) {
          isEscaping = true;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
        inQuotes = true;
      } else if (end === -1 && tokenChars$1[code] === 1) {
        if (start === -1) start = i;
      } else if (start !== -1 && (code === 32 || code === 9)) {
        if (end === -1) end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        let value = header.slice(start, end);
        if (mustUnescape) {
          value = value.replace(/\\/g, "");
          mustUnescape = false;
        }
        push(params, paramName, value);
        if (code === 44) {
          push(offers, extensionName, params);
          params = /* @__PURE__ */ Object.create(null);
          extensionName = void 0;
        }
        paramName = void 0;
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    }
  }
  if (start === -1 || inQuotes || code === 32 || code === 9) {
    throw new SyntaxError("Unexpected end of input");
  }
  if (end === -1) end = i;
  const token = header.slice(start, end);
  if (extensionName === void 0) {
    push(offers, token, params);
  } else {
    if (paramName === void 0) {
      push(params, token, true);
    } else if (mustUnescape) {
      push(params, paramName, token.replace(/\\/g, ""));
    } else {
      push(params, paramName, token);
    }
    push(offers, extensionName, params);
  }
  return offers;
}
function format$1(extensions) {
  return Object.keys(extensions).map((extension2) => {
    let configurations = extensions[extension2];
    if (!Array.isArray(configurations)) configurations = [configurations];
    return configurations.map((params) => {
      return [extension2].concat(
        Object.keys(params).map((k) => {
          let values = params[k];
          if (!Array.isArray(values)) values = [values];
          return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
        })
      ).join("; ");
    }).join(", ");
  }).join(", ");
}
var extension = { format: format$1, parse: parse$1 };
const EventEmitter = require$$0$5;
const https = require$$1$3;
const http = require$$2;
const net = require$$3$1;
const tls = require$$4$1;
const { randomBytes, createHash: createHash$1 } = require$$3;
const { Duplex: Duplex$2, Readable } = require$$0$1;
const { URL: URL$1 } = require$$7;
const PerMessageDeflate2 = permessageDeflate;
const Receiver2 = receiver;
const Sender2 = sender;
const { isBlob } = validationExports;
const {
  BINARY_TYPES,
  CLOSE_TIMEOUT: CLOSE_TIMEOUT$1,
  EMPTY_BUFFER,
  GUID: GUID$1,
  kForOnEventAttribute,
  kListener,
  kStatusCode,
  kWebSocket: kWebSocket$1,
  NOOP
} = constants;
const {
  EventTarget: { addEventListener, removeEventListener }
} = eventTarget;
const { format, parse } = extension;
const { toBuffer } = bufferUtilExports;
const kAborted = Symbol("kAborted");
const protocolVersions = [8, 13];
const readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
let WebSocket$1 = class WebSocket2 extends EventEmitter {
  /**
   * Create a new `WebSocket`.
   *
   * @param {(String|URL)} address The URL to which to connect
   * @param {(String|String[])} [protocols] The subprotocols
   * @param {Object} [options] Connection options
   */
  constructor(address, protocols, options) {
    super();
    this._binaryType = BINARY_TYPES[0];
    this._closeCode = 1006;
    this._closeFrameReceived = false;
    this._closeFrameSent = false;
    this._closeMessage = EMPTY_BUFFER;
    this._closeTimer = null;
    this._errorEmitted = false;
    this._extensions = {};
    this._paused = false;
    this._protocol = "";
    this._readyState = WebSocket2.CONNECTING;
    this._receiver = null;
    this._sender = null;
    this._socket = null;
    if (address !== null) {
      this._bufferedAmount = 0;
      this._isServer = false;
      this._redirects = 0;
      if (protocols === void 0) {
        protocols = [];
      } else if (!Array.isArray(protocols)) {
        if (typeof protocols === "object" && protocols !== null) {
          options = protocols;
          protocols = [];
        } else {
          protocols = [protocols];
        }
      }
      initAsClient(this, address, protocols, options);
    } else {
      this._autoPong = options.autoPong;
      this._closeTimeout = options.closeTimeout;
      this._isServer = true;
    }
  }
  /**
   * For historical reasons, the custom "nodebuffer" type is used by the default
   * instead of "blob".
   *
   * @type {String}
   */
  get binaryType() {
    return this._binaryType;
  }
  set binaryType(type) {
    if (!BINARY_TYPES.includes(type)) return;
    this._binaryType = type;
    if (this._receiver) this._receiver._binaryType = type;
  }
  /**
   * @type {Number}
   */
  get bufferedAmount() {
    if (!this._socket) return this._bufferedAmount;
    return this._socket._writableState.length + this._sender._bufferedBytes;
  }
  /**
   * @type {String}
   */
  get extensions() {
    return Object.keys(this._extensions).join();
  }
  /**
   * @type {Boolean}
   */
  get isPaused() {
    return this._paused;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onclose() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onerror() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onopen() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onmessage() {
    return null;
  }
  /**
   * @type {String}
   */
  get protocol() {
    return this._protocol;
  }
  /**
   * @type {Number}
   */
  get readyState() {
    return this._readyState;
  }
  /**
   * @type {String}
   */
  get url() {
    return this._url;
  }
  /**
   * Set up the socket and the internal resources.
   *
   * @param {Duplex} socket The network socket between the server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Object} options Options object
   * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
   *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
   *     multiple times in the same tick
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Number} [options.maxPayload=0] The maximum allowed message size
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @private
   */
  setSocket(socket, head, options) {
    const receiver2 = new Receiver2({
      allowSynchronousEvents: options.allowSynchronousEvents,
      binaryType: this.binaryType,
      extensions: this._extensions,
      isServer: this._isServer,
      maxPayload: options.maxPayload,
      skipUTF8Validation: options.skipUTF8Validation
    });
    const sender2 = new Sender2(socket, this._extensions, options.generateMask);
    this._receiver = receiver2;
    this._sender = sender2;
    this._socket = socket;
    receiver2[kWebSocket$1] = this;
    sender2[kWebSocket$1] = this;
    socket[kWebSocket$1] = this;
    receiver2.on("conclude", receiverOnConclude);
    receiver2.on("drain", receiverOnDrain);
    receiver2.on("error", receiverOnError);
    receiver2.on("message", receiverOnMessage);
    receiver2.on("ping", receiverOnPing);
    receiver2.on("pong", receiverOnPong);
    sender2.onerror = senderOnError;
    if (socket.setTimeout) socket.setTimeout(0);
    if (socket.setNoDelay) socket.setNoDelay();
    if (head.length > 0) socket.unshift(head);
    socket.on("close", socketOnClose);
    socket.on("data", socketOnData);
    socket.on("end", socketOnEnd);
    socket.on("error", socketOnError);
    this._readyState = WebSocket2.OPEN;
    this.emit("open");
  }
  /**
   * Emit the `'close'` event.
   *
   * @private
   */
  emitClose() {
    if (!this._socket) {
      this._readyState = WebSocket2.CLOSED;
      this.emit("close", this._closeCode, this._closeMessage);
      return;
    }
    if (this._extensions[PerMessageDeflate2.extensionName]) {
      this._extensions[PerMessageDeflate2.extensionName].cleanup();
    }
    this._receiver.removeAllListeners();
    this._readyState = WebSocket2.CLOSED;
    this.emit("close", this._closeCode, this._closeMessage);
  }
  /**
   * Start a closing handshake.
   *
   *          +----------+   +-----------+   +----------+
   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
   *    |     +----------+   +-----------+   +----------+     |
   *          +----------+   +-----------+         |
   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
   *          +----------+   +-----------+   |
   *    |           |                        |   +---+        |
   *                +------------------------+-->|fin| - - - -
   *    |         +---+                      |   +---+
   *     - - - - -|fin|<---------------------+
   *              +---+
   *
   * @param {Number} [code] Status code explaining why the connection is closing
   * @param {(String|Buffer)} [data] The reason why the connection is
   *     closing
   * @public
   */
  close(code, data) {
    if (this.readyState === WebSocket2.CLOSED) return;
    if (this.readyState === WebSocket2.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      abortHandshake(this, this._req, msg);
      return;
    }
    if (this.readyState === WebSocket2.CLOSING) {
      if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
        this._socket.end();
      }
      return;
    }
    this._readyState = WebSocket2.CLOSING;
    this._sender.close(code, data, !this._isServer, (err) => {
      if (err) return;
      this._closeFrameSent = true;
      if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
        this._socket.end();
      }
    });
    setCloseTimer(this);
  }
  /**
   * Pause the socket.
   *
   * @public
   */
  pause() {
    if (this.readyState === WebSocket2.CONNECTING || this.readyState === WebSocket2.CLOSED) {
      return;
    }
    this._paused = true;
    this._socket.pause();
  }
  /**
   * Send a ping.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the ping is sent
   * @public
   */
  ping(data, mask2, cb) {
    if (this.readyState === WebSocket2.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket2.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    if (mask2 === void 0) mask2 = !this._isServer;
    this._sender.ping(data || EMPTY_BUFFER, mask2, cb);
  }
  /**
   * Send a pong.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the pong is sent
   * @public
   */
  pong(data, mask2, cb) {
    if (this.readyState === WebSocket2.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket2.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    if (mask2 === void 0) mask2 = !this._isServer;
    this._sender.pong(data || EMPTY_BUFFER, mask2, cb);
  }
  /**
   * Resume the socket.
   *
   * @public
   */
  resume() {
    if (this.readyState === WebSocket2.CONNECTING || this.readyState === WebSocket2.CLOSED) {
      return;
    }
    this._paused = false;
    if (!this._receiver._writableState.needDrain) this._socket.resume();
  }
  /**
   * Send a data message.
   *
   * @param {*} data The message to send
   * @param {Object} [options] Options object
   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
   *     text
   * @param {Boolean} [options.compress] Specifies whether or not to compress
   *     `data`
   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when data is written out
   * @public
   */
  send(data, options, cb) {
    if (this.readyState === WebSocket2.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (typeof data === "number") data = data.toString();
    if (this.readyState !== WebSocket2.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    const opts = {
      binary: typeof data !== "string",
      mask: !this._isServer,
      compress: true,
      fin: true,
      ...options
    };
    if (!this._extensions[PerMessageDeflate2.extensionName]) {
      opts.compress = false;
    }
    this._sender.send(data || EMPTY_BUFFER, opts, cb);
  }
  /**
   * Forcibly close the connection.
   *
   * @public
   */
  terminate() {
    if (this.readyState === WebSocket2.CLOSED) return;
    if (this.readyState === WebSocket2.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      abortHandshake(this, this._req, msg);
      return;
    }
    if (this._socket) {
      this._readyState = WebSocket2.CLOSING;
      this._socket.destroy();
    }
  }
};
Object.defineProperty(WebSocket$1, "CONNECTING", {
  enumerable: true,
  value: readyStates.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket$1.prototype, "CONNECTING", {
  enumerable: true,
  value: readyStates.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket$1, "OPEN", {
  enumerable: true,
  value: readyStates.indexOf("OPEN")
});
Object.defineProperty(WebSocket$1.prototype, "OPEN", {
  enumerable: true,
  value: readyStates.indexOf("OPEN")
});
Object.defineProperty(WebSocket$1, "CLOSING", {
  enumerable: true,
  value: readyStates.indexOf("CLOSING")
});
Object.defineProperty(WebSocket$1.prototype, "CLOSING", {
  enumerable: true,
  value: readyStates.indexOf("CLOSING")
});
Object.defineProperty(WebSocket$1, "CLOSED", {
  enumerable: true,
  value: readyStates.indexOf("CLOSED")
});
Object.defineProperty(WebSocket$1.prototype, "CLOSED", {
  enumerable: true,
  value: readyStates.indexOf("CLOSED")
});
[
  "binaryType",
  "bufferedAmount",
  "extensions",
  "isPaused",
  "protocol",
  "readyState",
  "url"
].forEach((property) => {
  Object.defineProperty(WebSocket$1.prototype, property, { enumerable: true });
});
["open", "error", "close", "message"].forEach((method) => {
  Object.defineProperty(WebSocket$1.prototype, `on${method}`, {
    enumerable: true,
    get() {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) return listener[kListener];
      }
      return null;
    },
    set(handler) {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) {
          this.removeListener(method, listener);
          break;
        }
      }
      if (typeof handler !== "function") return;
      this.addEventListener(method, handler, {
        [kForOnEventAttribute]: true
      });
    }
  });
});
WebSocket$1.prototype.addEventListener = addEventListener;
WebSocket$1.prototype.removeEventListener = removeEventListener;
var websocket = WebSocket$1;
function initAsClient(websocket2, address, protocols, options) {
  const opts = {
    allowSynchronousEvents: true,
    autoPong: true,
    closeTimeout: CLOSE_TIMEOUT$1,
    protocolVersion: protocolVersions[1],
    maxPayload: 100 * 1024 * 1024,
    skipUTF8Validation: false,
    perMessageDeflate: true,
    followRedirects: false,
    maxRedirects: 10,
    ...options,
    socketPath: void 0,
    hostname: void 0,
    protocol: void 0,
    timeout: void 0,
    method: "GET",
    host: void 0,
    path: void 0,
    port: void 0
  };
  websocket2._autoPong = opts.autoPong;
  websocket2._closeTimeout = opts.closeTimeout;
  if (!protocolVersions.includes(opts.protocolVersion)) {
    throw new RangeError(
      `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
    );
  }
  let parsedUrl;
  if (address instanceof URL$1) {
    parsedUrl = address;
  } else {
    try {
      parsedUrl = new URL$1(address);
    } catch (e) {
      throw new SyntaxError(`Invalid URL: ${address}`);
    }
  }
  if (parsedUrl.protocol === "http:") {
    parsedUrl.protocol = "ws:";
  } else if (parsedUrl.protocol === "https:") {
    parsedUrl.protocol = "wss:";
  }
  websocket2._url = parsedUrl.href;
  const isSecure = parsedUrl.protocol === "wss:";
  const isIpcUrl = parsedUrl.protocol === "ws+unix:";
  let invalidUrlMessage;
  if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
    invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
  } else if (isIpcUrl && !parsedUrl.pathname) {
    invalidUrlMessage = "The URL's pathname is empty";
  } else if (parsedUrl.hash) {
    invalidUrlMessage = "The URL contains a fragment identifier";
  }
  if (invalidUrlMessage) {
    const err = new SyntaxError(invalidUrlMessage);
    if (websocket2._redirects === 0) {
      throw err;
    } else {
      emitErrorAndClose(websocket2, err);
      return;
    }
  }
  const defaultPort = isSecure ? 443 : 80;
  const key = randomBytes(16).toString("base64");
  const request = isSecure ? https.request : http.request;
  const protocolSet = /* @__PURE__ */ new Set();
  let perMessageDeflate;
  opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
  opts.defaultPort = opts.defaultPort || defaultPort;
  opts.port = parsedUrl.port || defaultPort;
  opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
  opts.headers = {
    ...opts.headers,
    "Sec-WebSocket-Version": opts.protocolVersion,
    "Sec-WebSocket-Key": key,
    Connection: "Upgrade",
    Upgrade: "websocket"
  };
  opts.path = parsedUrl.pathname + parsedUrl.search;
  opts.timeout = opts.handshakeTimeout;
  if (opts.perMessageDeflate) {
    perMessageDeflate = new PerMessageDeflate2(
      opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
      false,
      opts.maxPayload
    );
    opts.headers["Sec-WebSocket-Extensions"] = format({
      [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
    });
  }
  if (protocols.length) {
    for (const protocol of protocols) {
      if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
        throw new SyntaxError(
          "An invalid or duplicated subprotocol was specified"
        );
      }
      protocolSet.add(protocol);
    }
    opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
  }
  if (opts.origin) {
    if (opts.protocolVersion < 13) {
      opts.headers["Sec-WebSocket-Origin"] = opts.origin;
    } else {
      opts.headers.Origin = opts.origin;
    }
  }
  if (parsedUrl.username || parsedUrl.password) {
    opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
  }
  if (isIpcUrl) {
    const parts = opts.path.split(":");
    opts.socketPath = parts[0];
    opts.path = parts[1];
  }
  let req;
  if (opts.followRedirects) {
    if (websocket2._redirects === 0) {
      websocket2._originalIpc = isIpcUrl;
      websocket2._originalSecure = isSecure;
      websocket2._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
      const headers = options && options.headers;
      options = { ...options, headers: {} };
      if (headers) {
        for (const [key2, value] of Object.entries(headers)) {
          options.headers[key2.toLowerCase()] = value;
        }
      }
    } else if (websocket2.listenerCount("redirect") === 0) {
      const isSameHost = isIpcUrl ? websocket2._originalIpc ? opts.socketPath === websocket2._originalHostOrSocketPath : false : websocket2._originalIpc ? false : parsedUrl.host === websocket2._originalHostOrSocketPath;
      if (!isSameHost || websocket2._originalSecure && !isSecure) {
        delete opts.headers.authorization;
        delete opts.headers.cookie;
        if (!isSameHost) delete opts.headers.host;
        opts.auth = void 0;
      }
    }
    if (opts.auth && !options.headers.authorization) {
      options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
    }
    req = websocket2._req = request(opts);
    if (websocket2._redirects) {
      websocket2.emit("redirect", websocket2.url, req);
    }
  } else {
    req = websocket2._req = request(opts);
  }
  if (opts.timeout) {
    req.on("timeout", () => {
      abortHandshake(websocket2, req, "Opening handshake has timed out");
    });
  }
  req.on("error", (err) => {
    if (req === null || req[kAborted]) return;
    req = websocket2._req = null;
    emitErrorAndClose(websocket2, err);
  });
  req.on("response", (res) => {
    const location = res.headers.location;
    const statusCode = res.statusCode;
    if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
      if (++websocket2._redirects > opts.maxRedirects) {
        abortHandshake(websocket2, req, "Maximum redirects exceeded");
        return;
      }
      req.abort();
      let addr;
      try {
        addr = new URL$1(location, address);
      } catch (e) {
        const err = new SyntaxError(`Invalid URL: ${location}`);
        emitErrorAndClose(websocket2, err);
        return;
      }
      initAsClient(websocket2, addr, protocols, options);
    } else if (!websocket2.emit("unexpected-response", req, res)) {
      abortHandshake(
        websocket2,
        req,
        `Unexpected server response: ${res.statusCode}`
      );
    }
  });
  req.on("upgrade", (res, socket, head) => {
    websocket2.emit("upgrade", res);
    if (websocket2.readyState !== WebSocket$1.CONNECTING) return;
    req = websocket2._req = null;
    const upgrade = res.headers.upgrade;
    if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
      abortHandshake(websocket2, socket, "Invalid Upgrade header");
      return;
    }
    const digest = createHash$1("sha1").update(key + GUID$1).digest("base64");
    if (res.headers["sec-websocket-accept"] !== digest) {
      abortHandshake(websocket2, socket, "Invalid Sec-WebSocket-Accept header");
      return;
    }
    const serverProt = res.headers["sec-websocket-protocol"];
    let protError;
    if (serverProt !== void 0) {
      if (!protocolSet.size) {
        protError = "Server sent a subprotocol but none was requested";
      } else if (!protocolSet.has(serverProt)) {
        protError = "Server sent an invalid subprotocol";
      }
    } else if (protocolSet.size) {
      protError = "Server sent no subprotocol";
    }
    if (protError) {
      abortHandshake(websocket2, socket, protError);
      return;
    }
    if (serverProt) websocket2._protocol = serverProt;
    const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
    if (secWebSocketExtensions !== void 0) {
      if (!perMessageDeflate) {
        const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
        abortHandshake(websocket2, socket, message);
        return;
      }
      let extensions;
      try {
        extensions = parse(secWebSocketExtensions);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake(websocket2, socket, message);
        return;
      }
      const extensionNames = Object.keys(extensions);
      if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
        const message = "Server indicated an extension that was not requested";
        abortHandshake(websocket2, socket, message);
        return;
      }
      try {
        perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake(websocket2, socket, message);
        return;
      }
      websocket2._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
    }
    websocket2.setSocket(socket, head, {
      allowSynchronousEvents: opts.allowSynchronousEvents,
      generateMask: opts.generateMask,
      maxPayload: opts.maxPayload,
      skipUTF8Validation: opts.skipUTF8Validation
    });
  });
  if (opts.finishRequest) {
    opts.finishRequest(req, websocket2);
  } else {
    req.end();
  }
}
function emitErrorAndClose(websocket2, err) {
  websocket2._readyState = WebSocket$1.CLOSING;
  websocket2._errorEmitted = true;
  websocket2.emit("error", err);
  websocket2.emitClose();
}
function netConnect(options) {
  options.path = options.socketPath;
  return net.connect(options);
}
function tlsConnect(options) {
  options.path = void 0;
  if (!options.servername && options.servername !== "") {
    options.servername = net.isIP(options.host) ? "" : options.host;
  }
  return tls.connect(options);
}
function abortHandshake(websocket2, stream, message) {
  websocket2._readyState = WebSocket$1.CLOSING;
  const err = new Error(message);
  Error.captureStackTrace(err, abortHandshake);
  if (stream.setHeader) {
    stream[kAborted] = true;
    stream.abort();
    if (stream.socket && !stream.socket.destroyed) {
      stream.socket.destroy();
    }
    process.nextTick(emitErrorAndClose, websocket2, err);
  } else {
    stream.destroy(err);
    stream.once("error", websocket2.emit.bind(websocket2, "error"));
    stream.once("close", websocket2.emitClose.bind(websocket2));
  }
}
function sendAfterClose(websocket2, data, cb) {
  if (data) {
    const length = isBlob(data) ? data.size : toBuffer(data).length;
    if (websocket2._socket) websocket2._sender._bufferedBytes += length;
    else websocket2._bufferedAmount += length;
  }
  if (cb) {
    const err = new Error(
      `WebSocket is not open: readyState ${websocket2.readyState} (${readyStates[websocket2.readyState]})`
    );
    process.nextTick(cb, err);
  }
}
function receiverOnConclude(code, reason) {
  const websocket2 = this[kWebSocket$1];
  websocket2._closeFrameReceived = true;
  websocket2._closeMessage = reason;
  websocket2._closeCode = code;
  if (websocket2._socket[kWebSocket$1] === void 0) return;
  websocket2._socket.removeListener("data", socketOnData);
  process.nextTick(resume, websocket2._socket);
  if (code === 1005) websocket2.close();
  else websocket2.close(code, reason);
}
function receiverOnDrain() {
  const websocket2 = this[kWebSocket$1];
  if (!websocket2.isPaused) websocket2._socket.resume();
}
function receiverOnError(err) {
  const websocket2 = this[kWebSocket$1];
  if (websocket2._socket[kWebSocket$1] !== void 0) {
    websocket2._socket.removeListener("data", socketOnData);
    process.nextTick(resume, websocket2._socket);
    websocket2.close(err[kStatusCode]);
  }
  if (!websocket2._errorEmitted) {
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
  }
}
function receiverOnFinish() {
  this[kWebSocket$1].emitClose();
}
function receiverOnMessage(data, isBinary) {
  this[kWebSocket$1].emit("message", data, isBinary);
}
function receiverOnPing(data) {
  const websocket2 = this[kWebSocket$1];
  if (websocket2._autoPong) websocket2.pong(data, !this._isServer, NOOP);
  websocket2.emit("ping", data);
}
function receiverOnPong(data) {
  this[kWebSocket$1].emit("pong", data);
}
function resume(stream) {
  stream.resume();
}
function senderOnError(err) {
  const websocket2 = this[kWebSocket$1];
  if (websocket2.readyState === WebSocket$1.CLOSED) return;
  if (websocket2.readyState === WebSocket$1.OPEN) {
    websocket2._readyState = WebSocket$1.CLOSING;
    setCloseTimer(websocket2);
  }
  this._socket.end();
  if (!websocket2._errorEmitted) {
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
  }
}
function setCloseTimer(websocket2) {
  websocket2._closeTimer = setTimeout(
    websocket2._socket.destroy.bind(websocket2._socket),
    websocket2._closeTimeout
  );
}
function socketOnClose() {
  const websocket2 = this[kWebSocket$1];
  this.removeListener("close", socketOnClose);
  this.removeListener("data", socketOnData);
  this.removeListener("end", socketOnEnd);
  websocket2._readyState = WebSocket$1.CLOSING;
  if (!this._readableState.endEmitted && !websocket2._closeFrameReceived && !websocket2._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
    const chunk = this.read(this._readableState.length);
    websocket2._receiver.write(chunk);
  }
  websocket2._receiver.end();
  this[kWebSocket$1] = void 0;
  clearTimeout(websocket2._closeTimer);
  if (websocket2._receiver._writableState.finished || websocket2._receiver._writableState.errorEmitted) {
    websocket2.emitClose();
  } else {
    websocket2._receiver.on("error", receiverOnFinish);
    websocket2._receiver.on("finish", receiverOnFinish);
  }
}
function socketOnData(chunk) {
  if (!this[kWebSocket$1]._receiver.write(chunk)) {
    this.pause();
  }
}
function socketOnEnd() {
  const websocket2 = this[kWebSocket$1];
  websocket2._readyState = WebSocket$1.CLOSING;
  websocket2._receiver.end();
  this.end();
}
function socketOnError() {
  const websocket2 = this[kWebSocket$1];
  this.removeListener("error", socketOnError);
  this.on("error", NOOP);
  if (websocket2) {
    websocket2._readyState = WebSocket$1.CLOSING;
    this.destroy();
  }
}
const NodeWebSocket$1 = /* @__PURE__ */ getDefaultExportFromCjs(websocket);
const { Duplex: Duplex$1 } = require$$0$1;
const { tokenChars } = validationExports;
const { Duplex } = require$$0$1;
const { createHash } = require$$3;
const { CLOSE_TIMEOUT, GUID, kWebSocket } = constants;
class Event2 {
  constructor(type, target) {
    this.target = target;
    this.type = type;
  }
}
class ErrorEvent2 extends Event2 {
  constructor(error, target) {
    super("error", target);
    this.message = error.message;
    this.error = error;
  }
}
class CloseEvent2 extends Event2 {
  constructor(code = 1e3, reason = "", target) {
    super("close", target);
    this.wasClean = true;
    this.code = code;
    this.reason = reason;
  }
}
const getGlobalWebSocket = () => {
  if (typeof WebSocket !== "undefined") {
    return WebSocket;
  } else if (RUNTIME.type === "node") {
    return NodeWebSocket$1;
  }
  return void 0;
};
const isWebSocket = (w) => typeof w !== "undefined" && !!w && w.CLOSING === 2;
const DEFAULT_OPTIONS = {
  maxReconnectionDelay: 1e4,
  minReconnectionDelay: 1e3 + Math.random() * 4e3,
  minUptime: 5e3,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4e3,
  maxRetries: Infinity,
  maxEnqueuedMessages: Infinity,
  startClosed: false,
  debug: false
};
class ReconnectingWebSocket {
  constructor({ url, protocols, options, headers, queryParameters, abortSignal }) {
    this._listeners = {
      error: [],
      message: [],
      open: [],
      close: []
    };
    this._retryCount = -1;
    this._shouldReconnect = true;
    this._connectLock = false;
    this._binaryType = "blob";
    this._closeCalled = false;
    this._messageQueue = [];
    this.CONNECTING = ReconnectingWebSocket.CONNECTING;
    this.OPEN = ReconnectingWebSocket.OPEN;
    this.CLOSING = ReconnectingWebSocket.CLOSING;
    this.CLOSED = ReconnectingWebSocket.CLOSED;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.onopen = null;
    this._handleAbort = () => {
      if (this._closeCalled) {
        return;
      }
      this._debug("abort signal fired");
      this._shouldReconnect = false;
      this._closeCalled = true;
      this._clearTimeouts();
      if (this._ws) {
        this._removeListeners();
        try {
          this._ws.close(1e3, "aborted");
          this._handleClose(new CloseEvent2(1e3, "aborted", this));
        } catch (_error) {
        }
      }
    };
    this._handleOpen = (event) => {
      this._debug("open event");
      const { minUptime = DEFAULT_OPTIONS.minUptime } = this._options;
      clearTimeout(this._connectTimeout);
      this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime);
      this._ws.binaryType = this._binaryType;
      this._messageQueue.forEach((message) => {
        var _a;
        return (_a = this._ws) === null || _a === void 0 ? void 0 : _a.send(message);
      });
      this._messageQueue = [];
      if (this.onopen) {
        this.onopen(event);
      }
      this._listeners.open.forEach((listener) => this._callEventListener(event, listener));
    };
    this._handleMessage = (event) => {
      this._debug("message event");
      if (this.onmessage) {
        this.onmessage(event);
      }
      this._listeners.message.forEach((listener) => this._callEventListener(event, listener));
    };
    this._handleError = (event) => {
      this._debug("error event", event.message);
      this._disconnect(void 0, event.message === "TIMEOUT" ? "timeout" : void 0);
      if (this.onerror) {
        this.onerror(event);
      }
      this._debug("exec error listeners");
      this._listeners.error.forEach((listener) => this._callEventListener(event, listener));
      this._connect();
    };
    this._handleClose = (event) => {
      this._debug("close event");
      this._clearTimeouts();
      if (event.code === 1e3) {
        this._shouldReconnect = false;
      }
      if (this._shouldReconnect) {
        this._connect();
      }
      if (this.onclose) {
        this.onclose(event);
      }
      this._listeners.close.forEach((listener) => this._callEventListener(event, listener));
    };
    this._url = url;
    this._protocols = protocols;
    this._options = options !== null && options !== void 0 ? options : DEFAULT_OPTIONS;
    this._headers = headers;
    this._queryParameters = queryParameters;
    this._abortSignal = abortSignal;
    if (this._abortSignal) {
      this._abortSignal.addEventListener("abort", this._handleAbort, { once: true });
    }
    if (this._options.startClosed) {
      this._shouldReconnect = false;
    }
    this._connect();
  }
  get binaryType() {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }
  set binaryType(value) {
    this._binaryType = value;
    if (this._ws) {
      this._ws.binaryType = value;
    }
  }
  /**
   * Returns the number or connection retries
   */
  get retryCount() {
    return Math.max(this._retryCount, 0);
  }
  /**
   * The number of bytes of data that have been queued using calls to send() but not yet
   * transmitted to the network. This value resets to zero once all queued data has been sent.
   * This value does not reset to zero when the connection is closed; if you keep calling send(),
   * this will continue to climb. Read only
   */
  get bufferedAmount() {
    const bytes = this._messageQueue.reduce((acc, message) => {
      if (typeof message === "string") {
        acc += message.length;
      } else if (message instanceof Blob) {
        acc += message.size;
      } else {
        acc += message.byteLength;
      }
      return acc;
    }, 0);
    return bytes + (this._ws ? this._ws.bufferedAmount : 0);
  }
  /**
   * The extensions selected by the server. This is currently only the empty string or a list of
   * extensions as negotiated by the connection
   */
  get extensions() {
    return this._ws ? this._ws.extensions : "";
  }
  /**
   * A string indicating the name of the sub-protocol the server selected;
   * this will be one of the strings specified in the protocols parameter when creating the
   * WebSocket object
   */
  get protocol() {
    return this._ws ? this._ws.protocol : "";
  }
  /**
   * The current state of the connection; this is one of the Ready state constants
   */
  get readyState() {
    if (this._ws) {
      return this._ws.readyState;
    }
    return this._options.startClosed ? ReconnectingWebSocket.CLOSED : ReconnectingWebSocket.CONNECTING;
  }
  /**
   * The URL as resolved by the constructor
   */
  get url() {
    return this._ws ? this._ws.url : "";
  }
  /**
   * Closes the WebSocket connection or connection attempt, if any. If the connection is already
   * CLOSED, this method does nothing
   */
  close(code = 1e3, reason) {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === this.CLOSED) {
      this._debug("close: already closed");
      return;
    }
    this._ws.close(code, reason);
  }
  /**
   * Closes the WebSocket connection or connection attempt and connects again.
   * Resets retry counter;
   */
  reconnect(code, reason) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === this.CLOSED) {
      this._connect();
    } else {
      this._disconnect(code, reason);
      this._connect();
    }
  }
  /**
   * Enqueue specified data to be transmitted to the server over the WebSocket connection
   */
  send(data) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug("send", data);
      this._ws.send(data);
    } else {
      const { maxEnqueuedMessages = DEFAULT_OPTIONS.maxEnqueuedMessages } = this._options;
      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug("enqueue", data);
        this._messageQueue.push(data);
      }
    }
  }
  /**
   * Register an event handler of a specific event type
   */
  addEventListener(type, listener) {
    if (this._listeners[type]) {
      this._listeners[type].push(listener);
    }
  }
  dispatchEvent(event) {
    const listeners = this._listeners[event.type];
    if (listeners) {
      for (const listener of listeners) {
        this._callEventListener(event, listener);
      }
    }
    return true;
  }
  /**
   * Removes an event listener
   */
  removeEventListener(type, listener) {
    if (this._listeners[type]) {
      this._listeners[type] = this._listeners[type].filter(
        // @ts-ignore
        (l) => l !== listener
      );
    }
  }
  _debug(...args) {
    if (this._options.debug) {
      console.log.apply(console, ["RWS>", ...args]);
    }
  }
  _getNextDelay() {
    const { reconnectionDelayGrowFactor = DEFAULT_OPTIONS.reconnectionDelayGrowFactor, minReconnectionDelay = DEFAULT_OPTIONS.minReconnectionDelay, maxReconnectionDelay = DEFAULT_OPTIONS.maxReconnectionDelay } = this._options;
    let delay = 0;
    if (this._retryCount > 0) {
      delay = minReconnectionDelay * Math.pow(reconnectionDelayGrowFactor, this._retryCount - 1);
      if (delay > maxReconnectionDelay) {
        delay = maxReconnectionDelay;
      }
    }
    this._debug("next delay", delay);
    return delay;
  }
  _wait() {
    return new Promise((resolve) => {
      setTimeout(resolve, this._getNextDelay());
    });
  }
  _getNextUrl(urlProvider) {
    if (typeof urlProvider === "string") {
      return Promise.resolve(urlProvider);
    }
    if (typeof urlProvider === "function") {
      const url = urlProvider();
      if (typeof url === "string") {
        return Promise.resolve(url);
      }
      if (url.then) {
        return url;
      }
    }
    throw Error("Invalid URL");
  }
  _connect() {
    var _a;
    if (this._connectLock || !this._shouldReconnect) {
      return;
    }
    if ((_a = this._abortSignal) === null || _a === void 0 ? void 0 : _a.aborted) {
      this._debug("connect aborted");
      return;
    }
    this._connectLock = true;
    const { maxRetries = DEFAULT_OPTIONS.maxRetries, connectionTimeout = DEFAULT_OPTIONS.connectionTimeout, WebSocket: WebSocket3 = getGlobalWebSocket() } = this._options;
    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      return;
    }
    this._retryCount++;
    this._debug("connect", this._retryCount);
    this._removeListeners();
    if (!isWebSocket(WebSocket3)) {
      throw Error("No valid WebSocket class provided");
    }
    this._wait().then(() => this._getNextUrl(this._url)).then((url) => {
      var _a2;
      if (this._closeCalled || ((_a2 = this._abortSignal) === null || _a2 === void 0 ? void 0 : _a2.aborted)) {
        this._connectLock = false;
        return;
      }
      const options = {};
      if (this._headers) {
        options.headers = this._headers;
      }
      if (this._queryParameters && Object.keys(this._queryParameters).length > 0) {
        const queryString = toQueryString(this._queryParameters, { arrayFormat: "repeat" });
        if (queryString) {
          url = `${url}?${queryString}`;
        }
      }
      this._ws = new WebSocket3(url, this._protocols, options);
      this._ws.binaryType = this._binaryType;
      this._connectLock = false;
      this._addListeners();
      this._connectTimeout = setTimeout(() => this._handleTimeout(), connectionTimeout);
    });
  }
  _handleTimeout() {
    this._debug("timeout event");
    this._handleError(new ErrorEvent2(Error("TIMEOUT"), this));
  }
  _disconnect(code = 1e3, reason) {
    this._clearTimeouts();
    if (!this._ws) {
      return;
    }
    this._removeListeners();
    try {
      this._ws.close(code, reason);
      this._handleClose(new CloseEvent2(code, reason, this));
    } catch (_error) {
    }
  }
  _acceptOpen() {
    this._debug("accept open");
    this._retryCount = 0;
  }
  _callEventListener(event, listener) {
    if ("handleEvent" in listener) {
      listener.handleEvent(event);
    } else {
      listener(event);
    }
  }
  _removeListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("removeListeners");
    this._ws.removeEventListener("open", this._handleOpen);
    this._ws.removeEventListener("close", this._handleClose);
    this._ws.removeEventListener("message", this._handleMessage);
    this._ws.removeEventListener("error", this._handleError);
  }
  _addListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("addListeners");
    this._ws.addEventListener("open", this._handleOpen);
    this._ws.addEventListener("close", this._handleClose);
    this._ws.addEventListener("message", this._handleMessage);
    this._ws.addEventListener("error", this._handleError);
  }
  _clearTimeouts() {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
}
ReconnectingWebSocket.CONNECTING = 0;
ReconnectingWebSocket.OPEN = 1;
ReconnectingWebSocket.CLOSING = 2;
ReconnectingWebSocket.CLOSED = 3;
var __awaiter$u = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const PARAM_KEY = "apiKey";
const ENV_HEADER_KEY = "DEEPGRAM_API_KEY";
const HEADER_NAME = "Authorization";
class HeaderAuthProvider {
  constructor(options) {
    this.options = options;
  }
  static canCreate(options) {
    var _a;
    return (options === null || options === void 0 ? void 0 : options[PARAM_KEY]) != null || ((_a = process.env) === null || _a === void 0 ? void 0 : _a[ENV_HEADER_KEY]) != null;
  }
  getAuthRequest() {
    return __awaiter$u(this, arguments, void 0, function* ({ endpointMetadata } = {}) {
      var _a, _b;
      const headerValue = (_a = yield Supplier.get(this.options[PARAM_KEY])) !== null && _a !== void 0 ? _a : (_b = process.env) === null || _b === void 0 ? void 0 : _b[ENV_HEADER_KEY];
      if (headerValue == null) {
        throw new DeepgramError({
          message: HeaderAuthProvider.AUTH_CONFIG_ERROR_MESSAGE
        });
      }
      return {
        headers: { [HEADER_NAME]: headerValue }
      };
    });
  }
}
(function(HeaderAuthProvider2) {
  HeaderAuthProvider2.AUTH_SCHEME = "ApiKeyAuth";
  HeaderAuthProvider2.AUTH_CONFIG_ERROR_MESSAGE = `Please provide '${PARAM_KEY}' when initializing the client, or set the '${ENV_HEADER_KEY}' environment variable`;
  function createInstance(options) {
    return new HeaderAuthProvider2(options);
  }
  HeaderAuthProvider2.createInstance = createInstance;
})(HeaderAuthProvider || (HeaderAuthProvider = {}));
function mergeHeaders(...headersArray) {
  const result = {};
  for (const [key, value] of headersArray.filter((headers) => headers != null).flatMap((headers) => Object.entries(headers))) {
    const insensitiveKey = key.toLowerCase();
    if (value != null) {
      result[insensitiveKey] = value;
    } else if (insensitiveKey in result) {
      delete result[insensitiveKey];
    }
  }
  return result;
}
function mergeOnlyDefinedHeaders(...headersArray) {
  const result = {};
  for (const [key, value] of headersArray.filter((headers) => headers != null).flatMap((headers) => Object.entries(headers))) {
    const insensitiveKey = key.toLowerCase();
    if (value != null) {
      result[insensitiveKey] = value;
    }
  }
  return result;
}
function normalizeClientOptions(options) {
  const headers = mergeHeaders({
    "X-Fern-Language": "JavaScript",
    "X-Fern-SDK-Name": "@deepgram/sdk",
    "X-Fern-SDK-Version": "4.11.4",
    "User-Agent": "@deepgram/sdk/4.11.4",
    "X-Fern-Runtime": RUNTIME.type,
    "X-Fern-Runtime-Version": RUNTIME.version
  }, options === null || options === void 0 ? void 0 : options.headers);
  return Object.assign(Object.assign({}, options), { logging: createLogger(options === null || options === void 0 ? void 0 : options.logging), headers });
}
function normalizeClientOptionsWithAuth(options) {
  var _a;
  const normalized = normalizeClientOptions(options);
  const normalizedWithNoOpAuthProvider = withNoOpAuthProvider(normalized);
  (_a = normalized.authProvider) !== null && _a !== void 0 ? _a : normalized.authProvider = new HeaderAuthProvider(normalizedWithNoOpAuthProvider);
  return normalized;
}
function withNoOpAuthProvider(options) {
  return Object.assign(Object.assign({}, options), { authProvider: new NoOpAuthProvider() });
}
const DeepgramEnvironment = {
  Production: {
    base: "https://api.deepgram.com",
    agent: "wss://agent.deepgram.com",
    production: "wss://api.deepgram.com"
  }
};
function handleNonStatusCodeError(error, rawResponse, method, path2) {
  switch (error.reason) {
    case "non-json":
      throw new DeepgramError({
        statusCode: error.statusCode,
        body: error.rawBody,
        rawResponse
      });
    case "body-is-null":
      throw new DeepgramError({
        statusCode: error.statusCode,
        rawResponse
      });
    case "timeout":
      throw new DeepgramTimeoutError(`Timeout exceeded when calling ${method} ${path2}.`);
    case "unknown":
      throw new DeepgramError({
        message: error.errorMessage,
        rawResponse
      });
    default:
      throw new DeepgramError({
        message: "Unknown error",
        rawResponse
      });
  }
}
var __awaiter$t = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let ModelsClient$2 = class ModelsClient {
  constructor(options = {}) {
    this._options = normalizeClientOptions(options);
  }
  /**
   * Retrieves the available think models that can be used for AI agent processing
   *
   * @param {ModelsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.agent.v1.settings.think.models.list()
   */
  list(requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(requestOptions));
  }
  __list(requestOptions) {
    return __awaiter$t(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _headers = mergeHeaders((_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/agent/settings/think/models"),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/agent/settings/think/models");
    });
  }
};
class ThinkClient {
  constructor(options = {}) {
    this._options = normalizeClientOptions(options);
  }
  get models() {
    var _a;
    return (_a = this._models) !== null && _a !== void 0 ? _a : this._models = new ModelsClient$2(this._options);
  }
}
class SettingsClient {
  constructor(options = {}) {
    this._options = normalizeClientOptions(options);
  }
  get think() {
    var _a;
    return (_a = this._think) !== null && _a !== void 0 ? _a : this._think = new ThinkClient(this._options);
  }
}
var __awaiter$s = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let V1Socket$2 = class V1Socket {
  constructor(args) {
    this.eventHandlers = {};
    this.handleOpen = () => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).open) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    this.handleMessage = (event) => {
      var _a, _b;
      const data = fromJson(event.data);
      (_b = (_a = this.eventHandlers).message) === null || _b === void 0 ? void 0 : _b.call(_a, data);
    };
    this.handleClose = (event) => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).close) === null || _b === void 0 ? void 0 : _b.call(_a, event);
    };
    this.handleError = (event) => {
      var _a, _b;
      const message = event.message;
      (_b = (_a = this.eventHandlers).error) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(message));
    };
    this.socket = args.socket;
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }
  /** The current state of the connection; this is one of the readyState constants. */
  get readyState() {
    return this.socket.readyState;
  }
  /**
   * @param event - The event to attach to.
   * @param callback - The callback to run when the event is triggered.
   * Usage:
   * ```typescript
   * this.on('open', () => {
   *     console.log('The websocket is open');
   * });
   * ```
   */
  on(event, callback) {
    this.eventHandlers[event] = callback;
  }
  sendSettings(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendUpdateSpeak(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendUpdateThink(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendInjectUserMessage(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendInjectAgentMessage(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendFunctionCallResponse(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendKeepAlive(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendUpdatePrompt(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendMedia(message) {
    this.assertSocketIsOpen();
    this.sendBinary(message);
  }
  /** Connect to the websocket and register event handlers. */
  connect() {
    this.socket.reconnect();
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
    return this;
  }
  /** Close the websocket and unregister event handlers. */
  close() {
    this.socket.close();
    this.handleClose({ code: 1e3 });
    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("error", this.handleError);
  }
  /** Returns a promise that resolves when the websocket is open. */
  waitForOpen() {
    return __awaiter$s(this, void 0, void 0, function* () {
      if (this.socket.readyState === ReconnectingWebSocket.OPEN) {
        return this.socket;
      }
      return new Promise((resolve, reject) => {
        this.socket.addEventListener("open", () => {
          resolve(this.socket);
        });
        this.socket.addEventListener("error", (event) => {
          reject(event);
        });
      });
    });
  }
  /** Asserts that the websocket is open. */
  assertSocketIsOpen() {
    if (!this.socket) {
      throw new Error("Socket is not connected.");
    }
    if (this.socket.readyState !== ReconnectingWebSocket.OPEN) {
      throw new Error("Socket is not open.");
    }
  }
  /** Send a binary payload to the websocket. */
  sendBinary(payload) {
    this.socket.send(payload);
  }
  /** Send a JSON payload to the websocket. */
  sendJson(payload) {
    const jsonPayload = toJson(payload);
    this.socket.send(jsonPayload);
  }
};
var __awaiter$r = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let V1Client$6 = class V1Client {
  constructor(options = {}) {
    this._options = normalizeClientOptions(options);
  }
  get settings() {
    var _a;
    return (_a = this._settings) !== null && _a !== void 0 ? _a : this._settings = new SettingsClient(this._options);
  }
  connect(args) {
    return __awaiter$r(this, void 0, void 0, function* () {
      var _a, _b;
      const { queryParams, headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const _headers = mergeHeaders(mergeOnlyDefinedHeaders({ Authorization: args.Authorization }), headers);
      const socket = new ReconnectingWebSocket({
        url: join((_a = yield Supplier.get(this._options.baseUrl)) !== null && _a !== void 0 ? _a : ((_b = yield Supplier.get(this._options.environment)) !== null && _b !== void 0 ? _b : DeepgramEnvironment.Production).agent, "/v1/agent/converse"),
        protocols: [],
        queryParameters: queryParams !== null && queryParams !== void 0 ? queryParams : {},
        headers: _headers,
        options: {
          debug: debug !== null && debug !== void 0 ? debug : false,
          maxRetries: reconnectAttempts !== null && reconnectAttempts !== void 0 ? reconnectAttempts : 30,
          connectionTimeout: connectionTimeoutInSeconds != null ? connectionTimeoutInSeconds * 1e3 : void 0
        },
        abortSignal
      });
      return new V1Socket$2({ socket });
    });
  }
};
class AgentClient {
  constructor(options = {}) {
    this._options = normalizeClientOptions(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client$6(this._options);
  }
}
var __awaiter$q = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class TokensClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Generates a temporary JSON Web Token (JWT) with a 30-second (by default) TTL and usage::write permission for core voice APIs, requiring an API key with Member or higher authorization. Tokens created with this endpoint will not work with the Manage APIs.
   *
   * @param {Deepgram.auth.v1.GrantV1Request} request
   * @param {TokensClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.auth.v1.tokens.grant()
   */
  grant(request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__grant(request, requestOptions));
  }
  __grant() {
    return __awaiter$q(this, arguments, void 0, function* (request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/auth/grant"),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        requestType: "json",
        body: request,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/auth/grant");
    });
  }
}
let V1Client$5 = class V1Client2 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get tokens() {
    var _a;
    return (_a = this._tokens) !== null && _a !== void 0 ? _a : this._tokens = new TokensClient(this._options);
  }
};
class AuthClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client$5(this._options);
  }
}
var __awaiter$p = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __rest$2 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
};
class MediaClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Transcribe audio and video using Deepgram's speech-to-text REST API
   *
   * @param {Deepgram.listen.v1.ListenV1RequestUrl} request
   * @param {MediaClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.listen.v1.media.transcribeUrl({
   *         callback: "callback",
   *         callback_method: "POST",
   *         extra: "extra",
   *         sentiment: true,
   *         summarize: "v2",
   *         tag: "tag",
   *         topics: true,
   *         custom_topic: "custom_topic",
   *         custom_topic_mode: "extended",
   *         intents: true,
   *         custom_intent: "custom_intent",
   *         custom_intent_mode: "extended",
   *         detect_entities: true,
   *         detect_language: true,
   *         diarize: true,
   *         dictation: true,
   *         encoding: "linear16",
   *         filler_words: true,
   *         keywords: "keywords",
   *         language: "language",
   *         measurements: true,
   *         model: "nova-3",
   *         multichannel: true,
   *         numerals: true,
   *         paragraphs: true,
   *         profanity_filter: true,
   *         punctuate: true,
   *         redact: "redact",
   *         replace: "replace",
   *         search: "search",
   *         smart_format: true,
   *         utterances: true,
   *         utt_split: 1.1,
   *         version: "latest",
   *         mip_opt_out: true,
   *         url: "https://dpgr.am/spacewalk.wav"
   *     })
   */
  transcribeUrl(request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__transcribeUrl(request, requestOptions));
  }
  __transcribeUrl(request, requestOptions) {
    return __awaiter$p(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { callback, callback_method: callbackMethod, extra, sentiment, summarize, tag, topics, custom_topic: customTopic, custom_topic_mode: customTopicMode, intents, custom_intent: customIntent, custom_intent_mode: customIntentMode, detect_entities: detectEntities, detect_language: detectLanguage, diarize, dictation, encoding, filler_words: fillerWords, keyterm, keywords, language, measurements, model, multichannel, numerals, paragraphs, profanity_filter: profanityFilter, punctuate, redact, replace, search, smart_format: smartFormat, utterances, utt_split: uttSplit, version: version2, mip_opt_out: mipOptOut } = request, _body = __rest$2(request, ["callback", "callback_method", "extra", "sentiment", "summarize", "tag", "topics", "custom_topic", "custom_topic_mode", "intents", "custom_intent", "custom_intent_mode", "detect_entities", "detect_language", "diarize", "dictation", "encoding", "filler_words", "keyterm", "keywords", "language", "measurements", "model", "multichannel", "numerals", "paragraphs", "profanity_filter", "punctuate", "redact", "replace", "search", "smart_format", "utterances", "utt_split", "version", "mip_opt_out"]);
      const _queryParams = {
        callback,
        callback_method: callbackMethod != null ? callbackMethod : void 0,
        extra,
        sentiment,
        summarize: summarize != null ? summarize : void 0,
        tag,
        topics,
        custom_topic: customTopic,
        custom_topic_mode: customTopicMode != null ? customTopicMode : void 0,
        intents,
        custom_intent: customIntent,
        custom_intent_mode: customIntentMode != null ? customIntentMode : void 0,
        detect_entities: detectEntities,
        detect_language: detectLanguage,
        diarize,
        dictation,
        encoding: encoding != null ? encoding : void 0,
        filler_words: fillerWords,
        keyterm,
        keywords,
        language,
        measurements,
        model: model != null ? model : void 0,
        multichannel,
        numerals,
        paragraphs,
        profanity_filter: profanityFilter,
        punctuate,
        redact,
        replace,
        search,
        smart_format: smartFormat,
        utterances,
        utt_split: uttSplit,
        version: version2 != null ? version2 : void 0,
        mip_opt_out: mipOptOut
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/listen"),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        requestType: "json",
        body: _body,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/listen");
    });
  }
  /**
   * Transcribe audio and video using Deepgram's speech-to-text REST API
   *
   * @param {core.file.Uploadable} uploadable
   * @param {Deepgram.listen.v1.MediaTranscribeRequestOctetStream} request
   * @param {MediaClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     import { createReadStream } from "fs";
   *     await client.listen.v1.media.transcribeFile(createReadStream("path/to/file"), {})
   */
  transcribeFile(uploadable, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__transcribeFile(uploadable, request, requestOptions));
  }
  __transcribeFile(uploadable, request, requestOptions) {
    return __awaiter$p(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _queryParams = {
        callback: request.callback,
        callback_method: request.callback_method != null ? request.callback_method : void 0,
        extra: request.extra,
        sentiment: request.sentiment,
        summarize: request.summarize != null ? request.summarize : void 0,
        tag: request.tag,
        topics: request.topics,
        custom_topic: request.custom_topic,
        custom_topic_mode: request.custom_topic_mode != null ? request.custom_topic_mode : void 0,
        intents: request.intents,
        custom_intent: request.custom_intent,
        custom_intent_mode: request.custom_intent_mode != null ? request.custom_intent_mode : void 0,
        detect_entities: request.detect_entities,
        detect_language: request.detect_language,
        diarize: request.diarize,
        dictation: request.dictation,
        encoding: request.encoding != null ? request.encoding : void 0,
        filler_words: request.filler_words,
        keyterm: request.keyterm,
        keywords: request.keywords,
        language: request.language,
        measurements: request.measurements,
        model: request.model != null ? request.model : void 0,
        multichannel: request.multichannel,
        numerals: request.numerals,
        paragraphs: request.paragraphs,
        profanity_filter: request.profanity_filter,
        punctuate: request.punctuate,
        redact: request.redact,
        replace: request.replace,
        search: request.search,
        smart_format: request.smart_format,
        utterances: request.utterances,
        utt_split: request.utt_split,
        version: request.version != null ? request.version : void 0,
        mip_opt_out: request.mip_opt_out
      };
      const _binaryUploadRequest = yield toBinaryUploadRequest(uploadable);
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, _binaryUploadRequest.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/listen"),
        method: "POST",
        headers: _headers,
        contentType: "application/octet-stream",
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        requestType: "bytes",
        duplex: "half",
        body: _binaryUploadRequest.body,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/listen");
    });
  }
}
var __awaiter$o = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let V1Socket$1 = class V1Socket2 {
  constructor(args) {
    this.eventHandlers = {};
    this.handleOpen = () => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).open) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    this.handleMessage = (event) => {
      var _a, _b;
      const data = fromJson(event.data);
      (_b = (_a = this.eventHandlers).message) === null || _b === void 0 ? void 0 : _b.call(_a, data);
    };
    this.handleClose = (event) => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).close) === null || _b === void 0 ? void 0 : _b.call(_a, event);
    };
    this.handleError = (event) => {
      var _a, _b;
      const message = event.message;
      (_b = (_a = this.eventHandlers).error) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(message));
    };
    this.socket = args.socket;
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }
  /** The current state of the connection; this is one of the readyState constants. */
  get readyState() {
    return this.socket.readyState;
  }
  /**
   * @param event - The event to attach to.
   * @param callback - The callback to run when the event is triggered.
   * Usage:
   * ```typescript
   * this.on('open', () => {
   *     console.log('The websocket is open');
   * });
   * ```
   */
  on(event, callback) {
    this.eventHandlers[event] = callback;
  }
  sendMedia(message) {
    this.assertSocketIsOpen();
    this.sendBinary(message);
  }
  sendFinalize(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendCloseStream(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendKeepAlive(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  /** Connect to the websocket and register event handlers. */
  connect() {
    this.socket.reconnect();
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
    return this;
  }
  /** Close the websocket and unregister event handlers. */
  close() {
    this.socket.close();
    this.handleClose({ code: 1e3 });
    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("error", this.handleError);
  }
  /** Returns a promise that resolves when the websocket is open. */
  waitForOpen() {
    return __awaiter$o(this, void 0, void 0, function* () {
      if (this.socket.readyState === ReconnectingWebSocket.OPEN) {
        return this.socket;
      }
      return new Promise((resolve, reject) => {
        this.socket.addEventListener("open", () => {
          resolve(this.socket);
        });
        this.socket.addEventListener("error", (event) => {
          reject(event);
        });
      });
    });
  }
  /** Asserts that the websocket is open. */
  assertSocketIsOpen() {
    if (!this.socket) {
      throw new Error("Socket is not connected.");
    }
    if (this.socket.readyState !== ReconnectingWebSocket.OPEN) {
      throw new Error("Socket is not open.");
    }
  }
  /** Send a binary payload to the websocket. */
  sendBinary(payload) {
    this.socket.send(payload);
  }
  /** Send a JSON payload to the websocket. */
  sendJson(payload) {
    const jsonPayload = toJson(payload);
    this.socket.send(jsonPayload);
  }
};
var __awaiter$n = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let V1Client$4 = class V1Client3 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get media() {
    var _a;
    return (_a = this._media) !== null && _a !== void 0 ? _a : this._media = new MediaClient(this._options);
  }
  connect(args) {
    return __awaiter$n(this, void 0, void 0, function* () {
      var _a, _b;
      const { callback, callback_method: callbackMethod, channels, detect_entities: detectEntities, diarize, dictation, encoding, endpointing, extra, interim_results: interimResults, keyterm, keywords, language, mip_opt_out: mipOptOut, model, multichannel, numerals, profanity_filter: profanityFilter, punctuate, redact, replace, sample_rate: sampleRate, search, smart_format: smartFormat, tag, utterance_end_ms: utteranceEndMs, vad_events: vadEvents, version: version2, queryParams, headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const _queryParams = {
        callback: callback != null ? typeof callback === "string" ? callback : toJson(callback) : void 0,
        callback_method: callbackMethod != null ? callbackMethod : void 0,
        channels: channels != null ? typeof channels === "string" ? channels : toJson(channels) : void 0,
        detect_entities: detectEntities != null ? detectEntities : void 0,
        diarize: diarize != null ? diarize : void 0,
        dictation: dictation != null ? dictation : void 0,
        encoding: encoding != null ? encoding : void 0,
        endpointing: endpointing != null ? typeof endpointing === "string" ? endpointing : toJson(endpointing) : void 0,
        extra: extra != null ? typeof extra === "string" ? extra : toJson(extra) : void 0,
        interim_results: interimResults != null ? interimResults : void 0,
        keyterm: keyterm != null ? typeof keyterm === "string" ? keyterm : toJson(keyterm) : void 0,
        keywords: keywords != null ? typeof keywords === "string" ? keywords : toJson(keywords) : void 0,
        language: language != null ? typeof language === "string" ? language : toJson(language) : void 0,
        mip_opt_out: mipOptOut != null ? typeof mipOptOut === "string" ? mipOptOut : toJson(mipOptOut) : void 0,
        model,
        multichannel: multichannel != null ? multichannel : void 0,
        numerals: numerals != null ? numerals : void 0,
        profanity_filter: profanityFilter != null ? profanityFilter : void 0,
        punctuate: punctuate != null ? punctuate : void 0,
        redact: redact != null ? redact : void 0,
        replace: replace != null ? typeof replace === "string" ? replace : toJson(replace) : void 0,
        sample_rate: sampleRate != null ? typeof sampleRate === "string" ? sampleRate : toJson(sampleRate) : void 0,
        search: search != null ? typeof search === "string" ? search : toJson(search) : void 0,
        smart_format: smartFormat != null ? smartFormat : void 0,
        tag: tag != null ? typeof tag === "string" ? tag : toJson(tag) : void 0,
        utterance_end_ms: utteranceEndMs != null ? typeof utteranceEndMs === "string" ? utteranceEndMs : toJson(utteranceEndMs) : void 0,
        vad_events: vadEvents != null ? vadEvents : void 0,
        version: version2 != null ? typeof version2 === "string" ? version2 : toJson(version2) : void 0
      };
      const _headers = mergeHeaders(mergeOnlyDefinedHeaders({ Authorization: args.Authorization }), headers);
      const socket = new ReconnectingWebSocket({
        url: join((_a = yield Supplier.get(this._options.baseUrl)) !== null && _a !== void 0 ? _a : ((_b = yield Supplier.get(this._options.environment)) !== null && _b !== void 0 ? _b : DeepgramEnvironment.Production).production, "/v1/listen"),
        protocols: [],
        queryParameters: Object.assign(Object.assign({}, _queryParams), queryParams),
        headers: _headers,
        options: {
          debug: debug !== null && debug !== void 0 ? debug : false,
          maxRetries: reconnectAttempts !== null && reconnectAttempts !== void 0 ? reconnectAttempts : 30,
          connectionTimeout: connectionTimeoutInSeconds != null ? connectionTimeoutInSeconds * 1e3 : void 0
        },
        abortSignal
      });
      return new V1Socket$1({ socket });
    });
  }
};
var __awaiter$m = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class V2Socket {
  constructor(args) {
    this.eventHandlers = {};
    this.handleOpen = () => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).open) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    this.handleMessage = (event) => {
      var _a, _b;
      const data = fromJson(event.data);
      (_b = (_a = this.eventHandlers).message) === null || _b === void 0 ? void 0 : _b.call(_a, data);
    };
    this.handleClose = (event) => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).close) === null || _b === void 0 ? void 0 : _b.call(_a, event);
    };
    this.handleError = (event) => {
      var _a, _b;
      const message = event.message;
      (_b = (_a = this.eventHandlers).error) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(message));
    };
    this.socket = args.socket;
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }
  /** The current state of the connection; this is one of the readyState constants. */
  get readyState() {
    return this.socket.readyState;
  }
  /**
   * @param event - The event to attach to.
   * @param callback - The callback to run when the event is triggered.
   * Usage:
   * ```typescript
   * this.on('open', () => {
   *     console.log('The websocket is open');
   * });
   * ```
   */
  on(event, callback) {
    this.eventHandlers[event] = callback;
  }
  sendMedia(message) {
    this.assertSocketIsOpen();
    this.sendBinary(message);
  }
  sendCloseStream(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendListenV2Configure(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  /** Connect to the websocket and register event handlers. */
  connect() {
    this.socket.reconnect();
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
    return this;
  }
  /** Close the websocket and unregister event handlers. */
  close() {
    this.socket.close();
    this.handleClose({ code: 1e3 });
    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("error", this.handleError);
  }
  /** Returns a promise that resolves when the websocket is open. */
  waitForOpen() {
    return __awaiter$m(this, void 0, void 0, function* () {
      if (this.socket.readyState === ReconnectingWebSocket.OPEN) {
        return this.socket;
      }
      return new Promise((resolve, reject) => {
        this.socket.addEventListener("open", () => {
          resolve(this.socket);
        });
        this.socket.addEventListener("error", (event) => {
          reject(event);
        });
      });
    });
  }
  /** Asserts that the websocket is open. */
  assertSocketIsOpen() {
    if (!this.socket) {
      throw new Error("Socket is not connected.");
    }
    if (this.socket.readyState !== ReconnectingWebSocket.OPEN) {
      throw new Error("Socket is not open.");
    }
  }
  /** Send a binary payload to the websocket. */
  sendBinary(payload) {
    this.socket.send(payload);
  }
  /** Send a JSON payload to the websocket. */
  sendJson(payload) {
    const jsonPayload = toJson(payload);
    this.socket.send(jsonPayload);
  }
}
var __awaiter$l = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class V2Client {
  constructor(options = {}) {
    this._options = normalizeClientOptions(options);
  }
  connect(args) {
    return __awaiter$l(this, void 0, void 0, function* () {
      var _a, _b;
      const { model, encoding, sample_rate: sampleRate, eager_eot_threshold: eagerEotThreshold, eot_threshold: eotThreshold, eot_timeout_ms: eotTimeoutMs, keyterm, mip_opt_out: mipOptOut, tag, queryParams, headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const _queryParams = {
        model,
        encoding: encoding != null ? encoding : void 0,
        sample_rate: sampleRate != null ? typeof sampleRate === "string" ? sampleRate : toJson(sampleRate) : void 0,
        eager_eot_threshold: eagerEotThreshold != null ? typeof eagerEotThreshold === "string" ? eagerEotThreshold : toJson(eagerEotThreshold) : void 0,
        eot_threshold: eotThreshold != null ? typeof eotThreshold === "string" ? eotThreshold : toJson(eotThreshold) : void 0,
        eot_timeout_ms: eotTimeoutMs != null ? typeof eotTimeoutMs === "string" ? eotTimeoutMs : toJson(eotTimeoutMs) : void 0,
        keyterm: keyterm != null ? typeof keyterm === "string" ? keyterm : toJson(keyterm) : void 0,
        mip_opt_out: mipOptOut != null ? typeof mipOptOut === "string" ? mipOptOut : toJson(mipOptOut) : void 0,
        tag: tag != null ? typeof tag === "string" ? tag : toJson(tag) : void 0
      };
      const _headers = mergeHeaders(mergeOnlyDefinedHeaders({ Authorization: args.Authorization }), headers);
      const socket = new ReconnectingWebSocket({
        url: join((_a = yield Supplier.get(this._options.baseUrl)) !== null && _a !== void 0 ? _a : ((_b = yield Supplier.get(this._options.environment)) !== null && _b !== void 0 ? _b : DeepgramEnvironment.Production).production, "/v2/listen"),
        protocols: [],
        queryParameters: Object.assign(Object.assign({}, _queryParams), queryParams),
        headers: _headers,
        options: {
          debug: debug !== null && debug !== void 0 ? debug : false,
          maxRetries: reconnectAttempts !== null && reconnectAttempts !== void 0 ? reconnectAttempts : 30,
          connectionTimeout: connectionTimeoutInSeconds != null ? connectionTimeoutInSeconds * 1e3 : void 0
        },
        abortSignal
      });
      return new V2Socket({ socket });
    });
  }
}
class ListenClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client$4(this._options);
  }
  get v2() {
    var _a;
    return (_a = this._v2) !== null && _a !== void 0 ? _a : this._v2 = new V2Client(this._options);
  }
}
var __awaiter$k = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let ModelsClient$1 = class ModelsClient2 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Returns metadata on all the latest public models. To retrieve custom models, use Get Project Models.
   *
   * @param {Deepgram.manage.v1.ModelsListRequest} request
   * @param {ModelsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.models.list({
   *         include_outdated: true
   *     })
   */
  list(request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(request, requestOptions));
  }
  __list() {
    return __awaiter$k(this, arguments, void 0, function* (request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { include_outdated: includeOutdated } = request;
      const _queryParams = {
        include_outdated: includeOutdated
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/models"),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/models");
    });
  }
  /**
   * Returns metadata for a specific public model
   *
   * @param {string} model_id - The specific UUID of the model
   * @param {ModelsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.models.get("af6e9977-99f6-4d8f-b6f5-dfdf6fb6e291")
   */
  get(model_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(model_id, requestOptions));
  }
  __get(model_id, requestOptions) {
    return __awaiter$k(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/models/${encodePathParam(model_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/models/{model_id}");
    });
  }
};
var __awaiter$j = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class BalancesClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Generates a list of outstanding balances for the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {BalancesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.billing.balances.list("123456-7890-1234-5678-901234")
   */
  list(project_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, requestOptions));
  }
  __list(project_id, requestOptions) {
    return __awaiter$j(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/balances`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/balances");
    });
  }
  /**
   * Retrieves details about the specified balance
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} balance_id - The unique identifier of the balance
   * @param {BalancesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.billing.balances.get("123456-7890-1234-5678-901234", "123456-7890-1234-5678-901234")
   */
  get(project_id, balance_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, balance_id, requestOptions));
  }
  __get(project_id, balance_id, requestOptions) {
    return __awaiter$j(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/balances/${encodePathParam(balance_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/balances/{balance_id}");
    });
  }
}
var __awaiter$i = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let BreakdownClient$1 = class BreakdownClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Retrieves the billing summary for a specific project, with various filter options or by grouping options.
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.billing.BreakdownListRequest} request
   * @param {BreakdownClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.billing.breakdown.list("123456-7890-1234-5678-901234", {
   *         start: "start",
   *         end: "end",
   *         accessor: "12345678-1234-1234-1234-123456789012",
   *         deployment: "hosted",
   *         tag: "tag1",
   *         line_item: "streaming::nova-3"
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$i(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { start, end, accessor, deployment, tag, line_item: lineItem, grouping } = request;
      const _queryParams = {
        start,
        end,
        accessor,
        deployment: deployment != null ? deployment : void 0,
        tag,
        line_item: lineItem,
        grouping: Array.isArray(grouping) ? grouping.map((item) => item) : grouping != null ? grouping : void 0
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/billing/breakdown`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/billing/breakdown");
    });
  }
};
var __awaiter$h = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
let FieldsClient$1 = class FieldsClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Lists the accessors, deployment types, tags, and line items used for billing data in the specified time period. Use this endpoint if you want to filter your results from the Billing Breakdown endpoint and want to know what filters are available.
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.billing.FieldsListRequest} request
   * @param {FieldsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.billing.fields.list("123456-7890-1234-5678-901234", {
   *         start: "start",
   *         end: "end"
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$h(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { start, end } = request;
      const _queryParams = {
        start,
        end
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/billing/fields`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/billing/fields");
    });
  }
};
var __awaiter$g = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class PurchasesClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Returns the original purchased amount on an order transaction
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.billing.PurchasesListRequest} request
   * @param {PurchasesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.billing.purchases.list("123456-7890-1234-5678-901234", {
   *         limit: 1.1
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$g(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { limit } = request;
      const _queryParams = {
        limit
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/purchases`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/purchases");
    });
  }
}
class BillingClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get balances() {
    var _a;
    return (_a = this._balances) !== null && _a !== void 0 ? _a : this._balances = new BalancesClient(this._options);
  }
  get breakdown() {
    var _a;
    return (_a = this._breakdown) !== null && _a !== void 0 ? _a : this._breakdown = new BreakdownClient$1(this._options);
  }
  get fields() {
    var _a;
    return (_a = this._fields) !== null && _a !== void 0 ? _a : this._fields = new FieldsClient$1(this._options);
  }
  get purchases() {
    var _a;
    return (_a = this._purchases) !== null && _a !== void 0 ? _a : this._purchases = new PurchasesClient(this._options);
  }
}
var __awaiter$f = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class KeysClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Retrieves all API keys associated with the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.KeysListRequest} request
   * @param {KeysClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.keys.list("123456-7890-1234-5678-901234", {
   *         status: "active"
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$f(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { status } = request;
      const _queryParams = {
        status: status != null ? status : void 0
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/keys`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/keys");
    });
  }
  /**
   * Creates a new API key with specified settings for the project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.CreateKeyV1RequestOne} request
   * @param {KeysClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.keys.create("project_id", {
   *         "key": "value"
   *     })
   */
  create(project_id, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__create(project_id, request, requestOptions));
  }
  __create(project_id, request, requestOptions) {
    return __awaiter$f(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/keys`),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        requestType: "json",
        body: request,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/projects/{project_id}/keys");
    });
  }
  /**
   * Retrieves information about a specified API key
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} key_id - The unique identifier of the API key
   * @param {KeysClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.keys.get("123456-7890-1234-5678-901234", "123456789012345678901234")
   */
  get(project_id, key_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, key_id, requestOptions));
  }
  __get(project_id, key_id, requestOptions) {
    return __awaiter$f(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/keys/${encodePathParam(key_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/keys/{key_id}");
    });
  }
  /**
   * Deletes an API key for a specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} key_id - The unique identifier of the API key
   * @param {KeysClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.keys.delete("123456-7890-1234-5678-901234", "123456789012345678901234")
   */
  delete(project_id, key_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(project_id, key_id, requestOptions));
  }
  __delete(project_id, key_id, requestOptions) {
    return __awaiter$f(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/keys/${encodePathParam(key_id)}`),
        method: "DELETE",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/v1/projects/{project_id}/keys/{key_id}");
    });
  }
}
var __awaiter$e = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class InvitesClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Generates a list of invites for a specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {InvitesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.invites.list("123456-7890-1234-5678-901234")
   */
  list(project_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, requestOptions));
  }
  __list(project_id, requestOptions) {
    return __awaiter$e(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/invites`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/invites");
    });
  }
  /**
   * Generates an invite for a specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.members.CreateProjectInviteV1Request} request
   * @param {InvitesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.invites.create("123456-7890-1234-5678-901234", {
   *         email: "email",
   *         scope: "scope"
   *     })
   */
  create(project_id, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__create(project_id, request, requestOptions));
  }
  __create(project_id, request, requestOptions) {
    return __awaiter$e(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/invites`),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        requestType: "json",
        body: request,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/projects/{project_id}/invites");
    });
  }
  /**
   * Deletes an invite for a specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} email - The email address of the member
   * @param {InvitesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.invites.delete("123456-7890-1234-5678-901234", "john.doe@example.com")
   */
  delete(project_id, email, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(project_id, email, requestOptions));
  }
  __delete(project_id, email, requestOptions) {
    return __awaiter$e(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/invites/${encodePathParam(email)}`),
        method: "DELETE",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/v1/projects/{project_id}/invites/{email}");
    });
  }
}
var __awaiter$d = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class ScopesClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Retrieves a list of scopes for a specific member
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} member_id - The unique identifier of the Member
   * @param {ScopesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.scopes.list("123456-7890-1234-5678-901234", "123456789012345678901234")
   */
  list(project_id, member_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, member_id, requestOptions));
  }
  __list(project_id, member_id, requestOptions) {
    return __awaiter$d(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/members/${encodePathParam(member_id)}/scopes`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/members/{member_id}/scopes");
    });
  }
  /**
   * Updates the scopes for a specific member
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} member_id - The unique identifier of the Member
   * @param {Deepgram.manage.v1.projects.members.UpdateProjectMemberScopesV1Request} request
   * @param {ScopesClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.scopes.update("123456-7890-1234-5678-901234", "123456789012345678901234", {
   *         scope: "admin"
   *     })
   */
  update(project_id, member_id, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__update(project_id, member_id, request, requestOptions));
  }
  __update(project_id, member_id, request, requestOptions) {
    return __awaiter$d(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/members/${encodePathParam(member_id)}/scopes`),
        method: "PUT",
        headers: _headers,
        contentType: "application/json",
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        requestType: "json",
        body: request,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "PUT", "/v1/projects/{project_id}/members/{member_id}/scopes");
    });
  }
}
var __awaiter$c = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class MembersClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get invites() {
    var _a;
    return (_a = this._invites) !== null && _a !== void 0 ? _a : this._invites = new InvitesClient(this._options);
  }
  get scopes() {
    var _a;
    return (_a = this._scopes) !== null && _a !== void 0 ? _a : this._scopes = new ScopesClient(this._options);
  }
  /**
   * Retrieves a list of members for a given project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {MembersClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.list("123456-7890-1234-5678-901234")
   */
  list(project_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, requestOptions));
  }
  __list(project_id, requestOptions) {
    return __awaiter$c(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/members`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/members");
    });
  }
  /**
   * Removes a member from the project using their unique member ID
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} member_id - The unique identifier of the Member
   * @param {MembersClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.members.delete("123456-7890-1234-5678-901234", "123456789012345678901234")
   */
  delete(project_id, member_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(project_id, member_id, requestOptions));
  }
  __delete(project_id, member_id, requestOptions) {
    return __awaiter$c(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/members/${encodePathParam(member_id)}`),
        method: "DELETE",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/v1/projects/{project_id}/members/{member_id}");
    });
  }
}
var __awaiter$b = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class ModelsClient3 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Returns metadata on all the latest models that a specific project has access to, including non-public models
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.ModelsListRequest} request
   * @param {ModelsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.models.list("123456-7890-1234-5678-901234", {
   *         include_outdated: true
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$b(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { include_outdated: includeOutdated } = request;
      const _queryParams = {
        include_outdated: includeOutdated
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/models`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/models");
    });
  }
  /**
   * Returns metadata for a specific model
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} model_id - The specific UUID of the model
   * @param {ModelsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.models.get("123456-7890-1234-5678-901234", "af6e9977-99f6-4d8f-b6f5-dfdf6fb6e291")
   */
  get(project_id, model_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, model_id, requestOptions));
  }
  __get(project_id, model_id, requestOptions) {
    return __awaiter$b(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/models/${encodePathParam(model_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/models/{model_id}");
    });
  }
}
var __awaiter$a = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class RequestsClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Generates a list of requests for a specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.RequestsListRequest} request
   * @param {RequestsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.requests.list("123456-7890-1234-5678-901234", {
   *         start: "2024-01-15T09:30:00Z",
   *         end: "2024-01-15T09:30:00Z",
   *         limit: 1.1,
   *         page: 1.1,
   *         accessor: "12345678-1234-1234-1234-123456789012",
   *         request_id: "12345678-1234-1234-1234-123456789012",
   *         deployment: "hosted",
   *         endpoint: "listen",
   *         method: "sync",
   *         status: "succeeded"
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$a(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { start, end, limit, page, accessor, request_id: requestId, deployment, endpoint, method, status } = request;
      const _queryParams = {
        start: start != null ? start : void 0,
        end: end != null ? end : void 0,
        limit,
        page,
        accessor,
        request_id: requestId,
        deployment: deployment != null ? deployment : void 0,
        endpoint: endpoint != null ? endpoint : void 0,
        method: method != null ? method : void 0,
        status: status != null ? status : void 0
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/requests`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/requests");
    });
  }
  /**
   * Retrieves a specific request for a specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} request_id - The unique identifier of the request
   * @param {RequestsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.requests.get("123456-7890-1234-5678-901234", "123456-7890-1234-5678-901234")
   */
  get(project_id, request_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, request_id, requestOptions));
  }
  __get(project_id, request_id, requestOptions) {
    return __awaiter$a(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/requests/${encodePathParam(request_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/requests/{request_id}");
    });
  }
}
var __awaiter$9 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class BreakdownClient2 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Retrieves the usage breakdown for a specific project, with various filter options by API feature or by groupings. Setting a feature (e.g. diarize) to true includes requests that used that feature, while false excludes requests that used it. Multiple true filters are combined with OR logic, while false filters use AND logic.
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.usage.BreakdownGetRequest} request
   * @param {BreakdownClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.usage.breakdown.get("123456-7890-1234-5678-901234", {
   *         start: "start",
   *         end: "end",
   *         grouping: "accessor",
   *         accessor: "12345678-1234-1234-1234-123456789012",
   *         alternatives: true,
   *         callback_method: true,
   *         callback: true,
   *         channels: true,
   *         custom_intent_mode: true,
   *         custom_intent: true,
   *         custom_topic_mode: true,
   *         custom_topic: true,
   *         deployment: "hosted",
   *         detect_entities: true,
   *         detect_language: true,
   *         diarize: true,
   *         dictation: true,
   *         encoding: true,
   *         endpoint: "listen",
   *         extra: true,
   *         filler_words: true,
   *         intents: true,
   *         keyterm: true,
   *         keywords: true,
   *         language: true,
   *         measurements: true,
   *         method: "sync",
   *         model: "6f548761-c9c0-429a-9315-11a1d28499c8",
   *         multichannel: true,
   *         numerals: true,
   *         paragraphs: true,
   *         profanity_filter: true,
   *         punctuate: true,
   *         redact: true,
   *         replace: true,
   *         sample_rate: true,
   *         search: true,
   *         sentiment: true,
   *         smart_format: true,
   *         summarize: true,
   *         tag: "tag1",
   *         topics: true,
   *         utt_split: true,
   *         utterances: true,
   *         version: true
   *     })
   */
  get(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, request, requestOptions));
  }
  __get(project_id_1) {
    return __awaiter$9(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { start, end, grouping, accessor, alternatives, callback_method: callbackMethod, callback, channels, custom_intent_mode: customIntentMode, custom_intent: customIntent, custom_topic_mode: customTopicMode, custom_topic: customTopic, deployment, detect_entities: detectEntities, detect_language: detectLanguage, diarize, dictation, encoding, endpoint, extra, filler_words: fillerWords, intents, keyterm, keywords, language, measurements, method, model, multichannel, numerals, paragraphs, profanity_filter: profanityFilter, punctuate, redact, replace, sample_rate: sampleRate, search, sentiment, smart_format: smartFormat, summarize, tag, topics, utt_split: uttSplit, utterances, version: version2 } = request;
      const _queryParams = {
        start,
        end,
        grouping: grouping != null ? grouping : void 0,
        accessor,
        alternatives,
        callback_method: callbackMethod,
        callback,
        channels,
        custom_intent_mode: customIntentMode,
        custom_intent: customIntent,
        custom_topic_mode: customTopicMode,
        custom_topic: customTopic,
        deployment: deployment != null ? deployment : void 0,
        detect_entities: detectEntities,
        detect_language: detectLanguage,
        diarize,
        dictation,
        encoding,
        endpoint: endpoint != null ? endpoint : void 0,
        extra,
        filler_words: fillerWords,
        intents,
        keyterm,
        keywords,
        language,
        measurements,
        method: method != null ? method : void 0,
        model,
        multichannel,
        numerals,
        paragraphs,
        profanity_filter: profanityFilter,
        punctuate,
        redact,
        replace,
        sample_rate: sampleRate,
        search,
        sentiment,
        smart_format: smartFormat,
        summarize,
        tag,
        topics,
        utt_split: uttSplit,
        utterances,
        version: version2
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/usage/breakdown`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/usage/breakdown");
    });
  }
}
var __awaiter$8 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class FieldsClient2 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Lists the features, models, tags, languages, and processing method used for requests in the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.usage.FieldsListRequest} request
   * @param {FieldsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.usage.fields.list("123456-7890-1234-5678-901234", {
   *         start: "start",
   *         end: "end"
   *     })
   */
  list(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, request, requestOptions));
  }
  __list(project_id_1) {
    return __awaiter$8(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { start, end } = request;
      const _queryParams = {
        start,
        end
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/usage/fields`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/usage/fields");
    });
  }
}
var __awaiter$7 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class UsageClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get breakdown() {
    var _a;
    return (_a = this._breakdown) !== null && _a !== void 0 ? _a : this._breakdown = new BreakdownClient2(this._options);
  }
  get fields() {
    var _a;
    return (_a = this._fields) !== null && _a !== void 0 ? _a : this._fields = new FieldsClient2(this._options);
  }
  /**
   * @deprecated
   *
   * Retrieves the usage for a specific project. Use Get Project Usage Breakdown for a more comprehensive usage summary.
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.projects.UsageGetRequest} request
   * @param {UsageClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.usage.get("123456-7890-1234-5678-901234", {
   *         start: "start",
   *         end: "end",
   *         accessor: "12345678-1234-1234-1234-123456789012",
   *         alternatives: true,
   *         callback_method: true,
   *         callback: true,
   *         channels: true,
   *         custom_intent_mode: true,
   *         custom_intent: true,
   *         custom_topic_mode: true,
   *         custom_topic: true,
   *         deployment: "hosted",
   *         detect_entities: true,
   *         detect_language: true,
   *         diarize: true,
   *         dictation: true,
   *         encoding: true,
   *         endpoint: "listen",
   *         extra: true,
   *         filler_words: true,
   *         intents: true,
   *         keyterm: true,
   *         keywords: true,
   *         language: true,
   *         measurements: true,
   *         method: "sync",
   *         model: "6f548761-c9c0-429a-9315-11a1d28499c8",
   *         multichannel: true,
   *         numerals: true,
   *         paragraphs: true,
   *         profanity_filter: true,
   *         punctuate: true,
   *         redact: true,
   *         replace: true,
   *         sample_rate: true,
   *         search: true,
   *         sentiment: true,
   *         smart_format: true,
   *         summarize: true,
   *         tag: "tag1",
   *         topics: true,
   *         utt_split: true,
   *         utterances: true,
   *         version: true
   *     })
   */
  get(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, request, requestOptions));
  }
  __get(project_id_1) {
    return __awaiter$7(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { start, end, accessor, alternatives, callback_method: callbackMethod, callback, channels, custom_intent_mode: customIntentMode, custom_intent: customIntent, custom_topic_mode: customTopicMode, custom_topic: customTopic, deployment, detect_entities: detectEntities, detect_language: detectLanguage, diarize, dictation, encoding, endpoint, extra, filler_words: fillerWords, intents, keyterm, keywords, language, measurements, method, model, multichannel, numerals, paragraphs, profanity_filter: profanityFilter, punctuate, redact, replace, sample_rate: sampleRate, search, sentiment, smart_format: smartFormat, summarize, tag, topics, utt_split: uttSplit, utterances, version: version2 } = request;
      const _queryParams = {
        start,
        end,
        accessor,
        alternatives,
        callback_method: callbackMethod,
        callback,
        channels,
        custom_intent_mode: customIntentMode,
        custom_intent: customIntent,
        custom_topic_mode: customTopicMode,
        custom_topic: customTopic,
        deployment: deployment != null ? deployment : void 0,
        detect_entities: detectEntities,
        detect_language: detectLanguage,
        diarize,
        dictation,
        encoding,
        endpoint: endpoint != null ? endpoint : void 0,
        extra,
        filler_words: fillerWords,
        intents,
        keyterm,
        keywords,
        language,
        measurements,
        method: method != null ? method : void 0,
        model,
        multichannel,
        numerals,
        paragraphs,
        profanity_filter: profanityFilter,
        punctuate,
        redact,
        replace,
        sample_rate: sampleRate,
        search,
        sentiment,
        smart_format: smartFormat,
        summarize,
        tag,
        topics,
        utt_split: uttSplit,
        utterances,
        version: version2
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/usage`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/usage");
    });
  }
}
var __awaiter$6 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class ProjectsClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get keys() {
    var _a;
    return (_a = this._keys) !== null && _a !== void 0 ? _a : this._keys = new KeysClient(this._options);
  }
  get members() {
    var _a;
    return (_a = this._members) !== null && _a !== void 0 ? _a : this._members = new MembersClient(this._options);
  }
  get models() {
    var _a;
    return (_a = this._models) !== null && _a !== void 0 ? _a : this._models = new ModelsClient3(this._options);
  }
  get requests() {
    var _a;
    return (_a = this._requests) !== null && _a !== void 0 ? _a : this._requests = new RequestsClient(this._options);
  }
  get usage() {
    var _a;
    return (_a = this._usage) !== null && _a !== void 0 ? _a : this._usage = new UsageClient(this._options);
  }
  get billing() {
    var _a;
    return (_a = this._billing) !== null && _a !== void 0 ? _a : this._billing = new BillingClient(this._options);
  }
  /**
   * Retrieves basic information about the projects associated with the API key
   *
   * @param {ProjectsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.list()
   */
  list(requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(requestOptions));
  }
  __list(requestOptions) {
    return __awaiter$6(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/projects"),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects");
    });
  }
  /**
   * Retrieves information about the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.ProjectsGetRequest} request
   * @param {ProjectsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.get("123456-7890-1234-5678-901234", {
   *         limit: 1.1,
   *         page: 1.1
   *     })
   */
  get(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, request, requestOptions));
  }
  __get(project_id_1) {
    return __awaiter$6(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { limit, page } = request;
      const _queryParams = {
        limit,
        page
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}");
    });
  }
  /**
   * Deletes the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {ProjectsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.delete("123456-7890-1234-5678-901234")
   */
  delete(project_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(project_id, requestOptions));
  }
  __delete(project_id, requestOptions) {
    return __awaiter$6(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}`),
        method: "DELETE",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/v1/projects/{project_id}");
    });
  }
  /**
   * Updates the name or other properties of an existing project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.manage.v1.UpdateProjectV1Request} request
   * @param {ProjectsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.update("123456-7890-1234-5678-901234")
   */
  update(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__update(project_id, request, requestOptions));
  }
  __update(project_id_1) {
    return __awaiter$6(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}`),
        method: "PATCH",
        headers: _headers,
        contentType: "application/json",
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        requestType: "json",
        body: request,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "PATCH", "/v1/projects/{project_id}");
    });
  }
  /**
   * Removes the authenticated account from the specific project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {ProjectsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.manage.v1.projects.leave("123456-7890-1234-5678-901234")
   */
  leave(project_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__leave(project_id, requestOptions));
  }
  __leave(project_id, requestOptions) {
    return __awaiter$6(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/leave`),
        method: "DELETE",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/v1/projects/{project_id}/leave");
    });
  }
}
let V1Client$3 = class V1Client4 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get models() {
    var _a;
    return (_a = this._models) !== null && _a !== void 0 ? _a : this._models = new ModelsClient$1(this._options);
  }
  get projects() {
    var _a;
    return (_a = this._projects) !== null && _a !== void 0 ? _a : this._projects = new ProjectsClient(this._options);
  }
};
class ManageClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client$3(this._options);
  }
}
var __awaiter$5 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class TextClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Analyze text content using Deepgrams text analysis API
   *
   * @param {Deepgram.read.v1.TextAnalyzeRequest} request
   * @param {TextClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.read.v1.text.analyze({
   *         callback: "callback",
   *         callback_method: "POST",
   *         sentiment: true,
   *         summarize: "v2",
   *         tag: "tag",
   *         topics: true,
   *         custom_topic: "custom_topic",
   *         custom_topic_mode: "extended",
   *         intents: true,
   *         custom_intent: "custom_intent",
   *         custom_intent_mode: "extended",
   *         language: "language",
   *         body: {
   *             url: "url"
   *         }
   *     })
   */
  analyze(request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__analyze(request, requestOptions));
  }
  __analyze(request, requestOptions) {
    return __awaiter$5(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { callback, callback_method: callbackMethod, sentiment, summarize, tag, topics, custom_topic: customTopic, custom_topic_mode: customTopicMode, intents, custom_intent: customIntent, custom_intent_mode: customIntentMode, language, body: _body } = request;
      const _queryParams = {
        callback,
        callback_method: callbackMethod != null ? callbackMethod : void 0,
        sentiment,
        summarize: summarize != null ? summarize : void 0,
        tag,
        topics,
        custom_topic: customTopic,
        custom_topic_mode: customTopicMode != null ? customTopicMode : void 0,
        intents,
        custom_intent: customIntent,
        custom_intent_mode: customIntentMode != null ? customIntentMode : void 0,
        language
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/read"),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        requestType: "json",
        body: _body,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/read");
    });
  }
}
let V1Client$2 = class V1Client5 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get text() {
    var _a;
    return (_a = this._text) !== null && _a !== void 0 ? _a : this._text = new TextClient(this._options);
  }
};
class ReadClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client$2(this._options);
  }
}
var __awaiter$4 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __rest$1 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
};
class DistributionCredentialsClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Lists sets of distribution credentials for the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {DistributionCredentialsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.selfHosted.v1.distributionCredentials.list("123456-7890-1234-5678-901234")
   */
  list(project_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(project_id, requestOptions));
  }
  __list(project_id, requestOptions) {
    return __awaiter$4(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/self-hosted/distribution/credentials`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/self-hosted/distribution/credentials");
    });
  }
  /**
   * Creates a set of distribution credentials for the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {Deepgram.selfHosted.v1.CreateProjectDistributionCredentialsV1Request} request
   * @param {DistributionCredentialsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.selfHosted.v1.distributionCredentials.create("123456-7890-1234-5678-901234", {
   *         provider: "quay"
   *     })
   */
  create(project_id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__create(project_id, request, requestOptions));
  }
  __create(project_id_1) {
    return __awaiter$4(this, arguments, void 0, function* (project_id, request = {}, requestOptions) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { scopes, provider } = request, _body = __rest$1(request, ["scopes", "provider"]);
      const _queryParams = {
        scopes: Array.isArray(scopes) ? scopes.map((item) => item) : scopes != null ? scopes : void 0,
        provider: provider != null ? provider : void 0
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/self-hosted/distribution/credentials`),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        requestType: "json",
        body: _body,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/projects/{project_id}/self-hosted/distribution/credentials");
    });
  }
  /**
   * Returns a set of distribution credentials for the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} distribution_credentials_id - The UUID of the distribution credentials
   * @param {DistributionCredentialsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.selfHosted.v1.distributionCredentials.get("123456-7890-1234-5678-901234", "8b36cfd0-472f-4a21-833f-2d6343c3a2f3")
   */
  get(project_id, distribution_credentials_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(project_id, distribution_credentials_id, requestOptions));
  }
  __get(project_id, distribution_credentials_id, requestOptions) {
    return __awaiter$4(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/self-hosted/distribution/credentials/${encodePathParam(distribution_credentials_id)}`),
        method: "GET",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/v1/projects/{project_id}/self-hosted/distribution/credentials/{distribution_credentials_id}");
    });
  }
  /**
   * Deletes a set of distribution credentials for the specified project
   *
   * @param {string} project_id - The unique identifier of the project
   * @param {string} distribution_credentials_id - The UUID of the distribution credentials
   * @param {DistributionCredentialsClient.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Deepgram.BadRequestError}
   *
   * @example
   *     await client.selfHosted.v1.distributionCredentials.delete("123456-7890-1234-5678-901234", "8b36cfd0-472f-4a21-833f-2d6343c3a2f3")
   */
  delete(project_id, distribution_credentials_id, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(project_id, distribution_credentials_id, requestOptions));
  }
  __delete(project_id, distribution_credentials_id, requestOptions) {
    return __awaiter$4(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, `v1/projects/${encodePathParam(project_id)}/self-hosted/distribution/credentials/${encodePathParam(distribution_credentials_id)}`),
        method: "DELETE",
        headers: _headers,
        queryParameters: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams,
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return {
          data: _response.body,
          rawResponse: _response.rawResponse
        };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/v1/projects/{project_id}/self-hosted/distribution/credentials/{distribution_credentials_id}");
    });
  }
}
let V1Client$1 = class V1Client6 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get distributionCredentials() {
    var _a;
    return (_a = this._distributionCredentials) !== null && _a !== void 0 ? _a : this._distributionCredentials = new DistributionCredentialsClient(this._options);
  }
};
class SelfHostedClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client$1(this._options);
  }
}
var __awaiter$3 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
};
class AudioClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  /**
   * Convert text into natural-sounding speech using Deepgram's TTS REST API
   *
   * @throws {@link Deepgram.BadRequestError}
   */
  generate(request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__generate(request, requestOptions));
  }
  __generate(request, requestOptions) {
    return __awaiter$3(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      const { callback, callback_method: callbackMethod, mip_opt_out: mipOptOut, tag, bit_rate: bitRate, container, encoding, model, sample_rate: sampleRate } = request, _body = __rest(request, ["callback", "callback_method", "mip_opt_out", "tag", "bit_rate", "container", "encoding", "model", "sample_rate"]);
      const _queryParams = {
        callback,
        callback_method: callbackMethod != null ? callbackMethod : void 0,
        mip_opt_out: mipOptOut,
        tag,
        bit_rate: bitRate,
        container: container != null ? container : void 0,
        encoding: encoding != null ? encoding : void 0,
        model: model != null ? model : void 0,
        sample_rate: sampleRate
      };
      const _authRequest = yield this._options.authProvider.getAuthRequest();
      const _headers = mergeHeaders(_authRequest.headers, (_a = this._options) === null || _a === void 0 ? void 0 : _a.headers, requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.headers);
      const _response = yield ((_b = this._options.fetcher) !== null && _b !== void 0 ? _b : fetcher)({
        url: join((_c = yield Supplier.get(this._options.baseUrl)) !== null && _c !== void 0 ? _c : ((_d = yield Supplier.get(this._options.environment)) !== null && _d !== void 0 ? _d : DeepgramEnvironment.Production).base, "v1/speak"),
        method: "POST",
        headers: _headers,
        contentType: "application/json",
        queryParameters: Object.assign(Object.assign({}, _queryParams), requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.queryParams),
        requestType: "json",
        body: _body,
        responseType: "binary-response",
        timeoutMs: ((_g = (_e = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeoutInSeconds) !== null && _e !== void 0 ? _e : (_f = this._options) === null || _f === void 0 ? void 0 : _f.timeoutInSeconds) !== null && _g !== void 0 ? _g : 60) * 1e3,
        maxRetries: (_h = requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.maxRetries) !== null && _h !== void 0 ? _h : (_j = this._options) === null || _j === void 0 ? void 0 : _j.maxRetries,
        abortSignal: requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.abortSignal,
        fetchFn: (_k = this._options) === null || _k === void 0 ? void 0 : _k.fetch,
        logging: this._options.logging
      });
      if (_response.ok) {
        return { data: _response.body, rawResponse: _response.rawResponse };
      }
      if (_response.error.reason === "status-code") {
        switch (_response.error.statusCode) {
          case 400:
            throw new BadRequestError(_response.error.body, _response.rawResponse);
          default:
            throw new DeepgramError({
              statusCode: _response.error.statusCode,
              body: _response.error.body,
              rawResponse: _response.rawResponse
            });
        }
      }
      return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/v1/speak");
    });
  }
}
var __awaiter$2 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class V1Socket3 {
  constructor(args) {
    this.eventHandlers = {};
    this.handleOpen = () => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).open) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    this.handleMessage = (event) => {
      var _a, _b;
      const data = fromJson(event.data);
      (_b = (_a = this.eventHandlers).message) === null || _b === void 0 ? void 0 : _b.call(_a, data);
    };
    this.handleClose = (event) => {
      var _a, _b;
      (_b = (_a = this.eventHandlers).close) === null || _b === void 0 ? void 0 : _b.call(_a, event);
    };
    this.handleError = (event) => {
      var _a, _b;
      const message = event.message;
      (_b = (_a = this.eventHandlers).error) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(message));
    };
    this.socket = args.socket;
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }
  /** The current state of the connection; this is one of the readyState constants. */
  get readyState() {
    return this.socket.readyState;
  }
  /**
   * @param event - The event to attach to.
   * @param callback - The callback to run when the event is triggered.
   * Usage:
   * ```typescript
   * this.on('open', () => {
   *     console.log('The websocket is open');
   * });
   * ```
   */
  on(event, callback) {
    this.eventHandlers[event] = callback;
  }
  sendText(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendFlush(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendClear(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  sendClose(message) {
    this.assertSocketIsOpen();
    this.sendJson(message);
  }
  /** Connect to the websocket and register event handlers. */
  connect() {
    this.socket.reconnect();
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
    return this;
  }
  /** Close the websocket and unregister event handlers. */
  close() {
    this.socket.close();
    this.handleClose({ code: 1e3 });
    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("error", this.handleError);
  }
  /** Returns a promise that resolves when the websocket is open. */
  waitForOpen() {
    return __awaiter$2(this, void 0, void 0, function* () {
      if (this.socket.readyState === ReconnectingWebSocket.OPEN) {
        return this.socket;
      }
      return new Promise((resolve, reject) => {
        this.socket.addEventListener("open", () => {
          resolve(this.socket);
        });
        this.socket.addEventListener("error", (event) => {
          reject(event);
        });
      });
    });
  }
  /** Asserts that the websocket is open. */
  assertSocketIsOpen() {
    if (!this.socket) {
      throw new Error("Socket is not connected.");
    }
    if (this.socket.readyState !== ReconnectingWebSocket.OPEN) {
      throw new Error("Socket is not open.");
    }
  }
  /** Send a binary payload to the websocket. */
  sendBinary(payload) {
    this.socket.send(payload);
  }
  /** Send a JSON payload to the websocket. */
  sendJson(payload) {
    const jsonPayload = toJson(payload);
    this.socket.send(jsonPayload);
  }
}
var __awaiter$1 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
class V1Client7 {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get audio() {
    var _a;
    return (_a = this._audio) !== null && _a !== void 0 ? _a : this._audio = new AudioClient(this._options);
  }
  connect(args) {
    return __awaiter$1(this, void 0, void 0, function* () {
      var _a, _b;
      const { encoding, mip_opt_out: mipOptOut, model, sample_rate: sampleRate, queryParams, headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const _queryParams = {
        encoding: encoding != null ? encoding : void 0,
        mip_opt_out: mipOptOut != null ? typeof mipOptOut === "string" ? mipOptOut : toJson(mipOptOut) : void 0,
        model: model != null ? model : void 0,
        sample_rate: sampleRate != null ? sampleRate : void 0
      };
      const _headers = mergeHeaders(mergeOnlyDefinedHeaders({ Authorization: args.Authorization }), headers);
      const socket = new ReconnectingWebSocket({
        url: join((_a = yield Supplier.get(this._options.baseUrl)) !== null && _a !== void 0 ? _a : ((_b = yield Supplier.get(this._options.environment)) !== null && _b !== void 0 ? _b : DeepgramEnvironment.Production).production, "/v1/speak"),
        protocols: [],
        queryParameters: Object.assign(Object.assign({}, _queryParams), queryParams),
        headers: _headers,
        options: {
          debug: debug !== null && debug !== void 0 ? debug : false,
          maxRetries: reconnectAttempts !== null && reconnectAttempts !== void 0 ? reconnectAttempts : 30,
          connectionTimeout: connectionTimeoutInSeconds != null ? connectionTimeoutInSeconds * 1e3 : void 0
        },
        abortSignal
      });
      return new V1Socket3({ socket });
    });
  }
}
class SpeakClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get v1() {
    var _a;
    return (_a = this._v1) !== null && _a !== void 0 ? _a : this._v1 = new V1Client7(this._options);
  }
}
class DeepgramClient {
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get agent() {
    var _a;
    return (_a = this._agent) !== null && _a !== void 0 ? _a : this._agent = new AgentClient(this._options);
  }
  get auth() {
    var _a;
    return (_a = this._auth) !== null && _a !== void 0 ? _a : this._auth = new AuthClient(this._options);
  }
  get listen() {
    var _a;
    return (_a = this._listen) !== null && _a !== void 0 ? _a : this._listen = new ListenClient(this._options);
  }
  get manage() {
    var _a;
    return (_a = this._manage) !== null && _a !== void 0 ? _a : this._manage = new ManageClient(this._options);
  }
  get read() {
    var _a;
    return (_a = this._read) !== null && _a !== void 0 ? _a : this._read = new ReadClient(this._options);
  }
  get selfHosted() {
    var _a;
    return (_a = this._selfHosted) !== null && _a !== void 0 ? _a : this._selfHosted = new SelfHostedClient(this._options);
  }
  get speak() {
    var _a;
    return (_a = this._speak) !== null && _a !== void 0 ? _a : this._speak = new SpeakClient(this._options);
  }
}
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const DEFAULT_CONNECTION_TIMEOUT_MS = 1e4;
const WEBSOCKET_OPTION_KEYS = /* @__PURE__ */ new Set([
  "Authorization",
  "headers",
  "debug",
  "reconnectAttempts",
  "connectionTimeoutInSeconds",
  "abortSignal",
  "queryParams"
]);
let NodeWebSocket;
let _wsInitialized = false;
function loadNodeWebSocket() {
  return __awaiter(this, void 0, void 0, function* () {
    var _a;
    if (_wsInitialized)
      return;
    _wsInitialized = true;
    try {
      if (typeof require !== "undefined") {
        let ws = require("ws");
        NodeWebSocket = ws.WebSocket || ws.default || ws;
      } else if (typeof process !== "undefined" && ((_a = process.versions) === null || _a === void 0 ? void 0 : _a.node)) {
        const dynamicImport = new Function("specifier", "return import(specifier)");
        const ws = yield dynamicImport("ws");
        NodeWebSocket = ws.WebSocket || ws.default || ws;
      }
    } catch (_b) {
      NodeWebSocket = void 0;
    }
  });
}
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (RUNTIME.type === "node") {
    try {
      const nodeCrypto = require("crypto");
      return nodeCrypto.randomUUID();
    } catch (_a) {
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
class ApiKeyAuthProviderWrapper {
  constructor(originalProvider) {
    this.originalProvider = originalProvider;
  }
  getAuthRequest(arg) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b;
      const authRequest = yield this.originalProvider.getAuthRequest(arg);
      const authHeader = ((_a = authRequest.headers) === null || _a === void 0 ? void 0 : _a.Authorization) || ((_b = authRequest.headers) === null || _b === void 0 ? void 0 : _b.authorization);
      if (authHeader && typeof authHeader === "string") {
        if (!authHeader.startsWith("Bearer ") && !authHeader.startsWith("Token ") && !authHeader.startsWith("token ")) {
          return {
            headers: Object.assign(Object.assign({}, authRequest.headers), { Authorization: `Token ${authHeader}` })
          };
        }
      }
      return authRequest;
    });
  }
}
class AccessTokenAuthProviderWrapper {
  constructor(originalProvider, accessToken) {
    this.originalProvider = originalProvider;
    this.accessToken = accessToken;
  }
  getAuthRequest(arg) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b;
      const accessToken = (_a = yield Supplier.get(this.accessToken)) !== null && _a !== void 0 ? _a : (_b = process.env) === null || _b === void 0 ? void 0 : _b.DEEPGRAM_ACCESS_TOKEN;
      if (accessToken != null) {
        return {
          headers: { Authorization: `Bearer ${accessToken}` }
        };
      }
      return this.originalProvider.getAuthRequest(arg);
    });
  }
}
class CustomDeepgramClient extends DeepgramClient {
  constructor(options = {}) {
    const sessionId = generateUUID();
    const optionsWithSessionId = Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign({}, options.headers), { "x-deepgram-session-id": sessionId }) });
    super(optionsWithSessionId);
    this._sessionId = sessionId;
    this._options.authProvider = new ApiKeyAuthProviderWrapper(this._options.authProvider);
    if (options.accessToken != null) {
      this._options.authProvider = new AccessTokenAuthProviderWrapper(this._options.authProvider, options.accessToken);
    }
  }
  /**
   * Get the session ID that was generated for this client instance.
   */
  get sessionId() {
    return this._sessionId;
  }
  /**
   * Override the agent getter to return a wrapped client that ensures
   * the custom websocket implementation is used.
   */
  get agent() {
    if (!this._customAgent) {
      this._customAgent = new WrappedAgentClient(this._options);
    }
    return this._customAgent;
  }
  /**
   * Override the listen getter to return a wrapped client that ensures
   * the custom websocket implementation is used.
   */
  get listen() {
    if (!this._customListen) {
      this._customListen = new WrappedListenClient(this._options);
    }
    return this._customListen;
  }
  /**
   * Override the speak getter to return a wrapped client that ensures
   * the custom websocket implementation is used.
   */
  get speak() {
    if (!this._customSpeak) {
      this._customSpeak = new WrappedSpeakClient(this._options);
    }
    return this._customSpeak;
  }
}
class WrappedAgentClient extends AgentClient {
  get v1() {
    return new WrappedAgentV1Client(this._options);
  }
}
class WrappedListenClient extends ListenClient {
  get v1() {
    return new WrappedListenV1Client(this._options);
  }
  get v2() {
    return new WrappedListenV2Client(this._options);
  }
}
class WrappedSpeakClient extends SpeakClient {
  get v1() {
    return new WrappedSpeakV1Client(this._options);
  }
}
function resolveHeaders(headers) {
  return __awaiter(this, void 0, void 0, function* () {
    const resolved = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value == null) {
        continue;
      }
      const resolvedValue = yield Supplier.get(value);
      if (resolvedValue != null) {
        resolved[key] = resolvedValue;
      }
    }
    return resolved;
  });
}
function buildQueryParams(args) {
  const result = {};
  for (const [key, value] of Object.entries(args)) {
    if (!WEBSOCKET_OPTION_KEYS.has(key) && value != null) {
      result[key] = value;
    }
  }
  if (args.queryParams != null && typeof args.queryParams === "object") {
    Object.assign(result, args.queryParams);
  }
  return result;
}
function getWebSocketOptions(headers) {
  const options = {};
  const isBrowser = RUNTIME.type === "browser" || RUNTIME.type === "web-worker";
  const sessionIdHeader = headers["x-deepgram-session-id"] || headers["X-Deepgram-Session-Id"];
  if (RUNTIME.type === "node" && NodeWebSocket) {
    options.WebSocket = NodeWebSocket;
    options.headers = headers;
  } else if (isBrowser) {
    const authHeader = headers.Authorization || headers.authorization;
    const browserHeaders = Object.assign({}, headers);
    delete browserHeaders.Authorization;
    delete browserHeaders.authorization;
    delete browserHeaders["x-deepgram-session-id"];
    delete browserHeaders["X-Deepgram-Session-Id"];
    options.headers = browserHeaders;
    const protocols = [];
    if (authHeader && typeof authHeader === "string") {
      if (authHeader.startsWith("Token ")) {
        const apiKey = authHeader.substring(6);
        protocols.push("token", apiKey);
      } else if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        protocols.push("bearer", token);
      } else {
        protocols.push(authHeader);
      }
    }
    if (sessionIdHeader && typeof sessionIdHeader === "string") {
      protocols.push("x-deepgram-session-id", sessionIdHeader);
    }
    if (protocols.length > 0) {
      options.protocols = protocols;
    }
  } else {
    options.headers = headers;
  }
  return options;
}
function setupBinaryHandling(socket, eventHandlers) {
  var _a;
  const binaryAwareHandler = (event) => {
    var _a2, _b, _c;
    if (typeof event.data === "string") {
      try {
        const data = fromJson(event.data);
        (_a2 = eventHandlers.message) === null || _a2 === void 0 ? void 0 : _a2.call(eventHandlers, data);
      } catch (error) {
        (_b = eventHandlers.message) === null || _b === void 0 ? void 0 : _b.call(eventHandlers, event.data);
      }
    } else {
      (_c = eventHandlers.message) === null || _c === void 0 ? void 0 : _c.call(eventHandlers, event.data);
    }
  };
  const socketAny = socket;
  if ((_a = socketAny._listeners) === null || _a === void 0 ? void 0 : _a.message) {
    socketAny._listeners.message.forEach((listener) => {
      socket.removeEventListener("message", listener);
    });
  }
  socket.addEventListener("message", binaryAwareHandler);
  return binaryAwareHandler;
}
function preventDuplicateEventListeners(socket, handlers) {
  if (handlers.handleOpen) {
    socket.removeEventListener("open", handlers.handleOpen);
  }
  if (handlers.handleMessage) {
    socket.removeEventListener("message", handlers.handleMessage);
  }
  if (handlers.handleClose) {
    socket.removeEventListener("close", handlers.handleClose);
  }
  if (handlers.handleError) {
    socket.removeEventListener("error", handlers.handleError);
  }
}
function resetSocketConnectionState(socket) {
  if (socket.readyState === socket.CLOSED) {
    socket._connectLock = false;
    socket._shouldReconnect = true;
  }
}
function createWebSocketConnection(_a) {
  return __awaiter(this, arguments, void 0, function* ({ options, urlPath, environmentKey, queryParams, headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal }) {
    var _b, _c, _d, _e, _f, _g;
    yield loadNodeWebSocket();
    const authRequest = yield (_b = options.authProvider) === null || _b === void 0 ? void 0 : _b.getAuthRequest();
    const mergedHeaders = mergeHeaders((_c = options.headers) !== null && _c !== void 0 ? _c : {}, (_d = authRequest === null || authRequest === void 0 ? void 0 : authRequest.headers) !== null && _d !== void 0 ? _d : {}, headers);
    const _headers = yield resolveHeaders(mergedHeaders);
    const wsOptions = getWebSocketOptions(_headers);
    const baseUrl = (_e = yield Supplier.get(options.baseUrl)) !== null && _e !== void 0 ? _e : ((_f = yield Supplier.get(options.environment)) !== null && _f !== void 0 ? _f : DeepgramEnvironment.Production)[environmentKey];
    return new ReconnectingWebSocket({
      url: join(baseUrl, urlPath),
      protocols: (_g = wsOptions.protocols) !== null && _g !== void 0 ? _g : [],
      queryParameters: queryParams,
      headers: wsOptions.headers,
      options: {
        WebSocket: wsOptions.WebSocket,
        debug: debug !== null && debug !== void 0 ? debug : false,
        maxRetries: reconnectAttempts !== null && reconnectAttempts !== void 0 ? reconnectAttempts : 30,
        startClosed: true,
        connectionTimeout: connectionTimeoutInSeconds != null ? connectionTimeoutInSeconds * 1e3 : DEFAULT_CONNECTION_TIMEOUT_MS
      },
      abortSignal
    });
  });
}
class WrappedAgentV1Client extends V1Client$6 {
  connect() {
    return __awaiter(this, arguments, void 0, function* (args = {}) {
      const { headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const socket = yield createWebSocketConnection({
        options: this._options,
        urlPath: "/v1/agent/converse",
        environmentKey: "agent",
        queryParams: buildQueryParams(args),
        headers,
        debug,
        reconnectAttempts,
        connectionTimeoutInSeconds,
        abortSignal
      });
      return new WrappedAgentV1Socket({ socket });
    });
  }
  /**
   * Creates a WebSocket connection object without actually connecting.
   * This is an alias for connect() with clearer naming - the returned socket
   * is not connected until you call socket.connect().
   *
   * Usage:
   * ```typescript
   * const socket = await client.agent.v1.createConnection();
   * socket.on('open', () => console.log('Connected!'));
   * socket.on('message', (msg) => console.log('Message:', msg));
   * socket.connect(); // Actually initiates the connection
   * ```
   */
  createConnection() {
    return __awaiter(this, arguments, void 0, function* (args = {}) {
      return this.connect(args);
    });
  }
}
class WrappedAgentV1Socket extends V1Socket$2 {
  constructor(args) {
    super(args);
    this.setupBinaryHandling();
  }
  setupBinaryHandling() {
    this.binaryAwareHandler = setupBinaryHandling(this.socket, this.eventHandlers);
  }
  connect() {
    const socketAny = this;
    preventDuplicateEventListeners(this.socket, {
      handleOpen: socketAny.handleOpen,
      handleMessage: socketAny.handleMessage,
      handleClose: socketAny.handleClose,
      handleError: socketAny.handleError
    });
    resetSocketConnectionState(this.socket);
    super.connect();
    this.setupBinaryHandling();
    return this;
  }
}
class WrappedListenV1Client extends V1Client$4 {
  connect(args) {
    return __awaiter(this, void 0, void 0, function* () {
      const { headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const socket = yield createWebSocketConnection({
        options: this._options,
        urlPath: "/v1/listen",
        environmentKey: "production",
        queryParams: buildQueryParams(args),
        headers,
        debug,
        reconnectAttempts,
        connectionTimeoutInSeconds,
        abortSignal
      });
      return new WrappedListenV1Socket({ socket });
    });
  }
  /**
   * Creates a WebSocket connection object without actually connecting.
   * This is an alias for connect() with clearer naming - the returned socket
   * is not connected until you call socket.connect().
   *
   * Usage:
   * ```typescript
   * const socket = await client.listen.v1.createConnection({ model: 'nova-3' });
   * socket.on('open', () => console.log('Connected!'));
   * socket.on('message', (msg) => console.log('Transcript:', msg));
   * socket.connect(); // Actually initiates the connection
   * ```
   */
  createConnection(args) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.connect(args);
    });
  }
}
class WrappedListenV1Socket extends V1Socket$1 {
  constructor(args) {
    super(args);
    this.setupBinaryHandling();
  }
  setupBinaryHandling() {
    this.binaryAwareHandler = setupBinaryHandling(this.socket, this.eventHandlers);
  }
  connect() {
    const socketAny = this;
    preventDuplicateEventListeners(this.socket, {
      handleOpen: socketAny.handleOpen,
      handleMessage: socketAny.handleMessage,
      handleClose: socketAny.handleClose,
      handleError: socketAny.handleError
    });
    resetSocketConnectionState(this.socket);
    super.connect();
    this.setupBinaryHandling();
    return this;
  }
}
class WrappedListenV2Client extends V2Client {
  connect(args) {
    return __awaiter(this, void 0, void 0, function* () {
      const { headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const socket = yield createWebSocketConnection({
        options: this._options,
        urlPath: "/v2/listen",
        environmentKey: "production",
        queryParams: buildQueryParams(args),
        headers,
        debug,
        reconnectAttempts,
        connectionTimeoutInSeconds,
        abortSignal
      });
      return new WrappedListenV2Socket({ socket });
    });
  }
  /**
   * Creates a WebSocket connection object without actually connecting.
   * This is an alias for connect() with clearer naming - the returned socket
   * is not connected until you call socket.connect().
   *
   * Usage:
   * ```typescript
   * const socket = await client.listen.v2.createConnection({ model: 'flux-general-en' });
   * socket.on('open', () => console.log('Connected!'));
   * socket.on('message', (msg) => console.log('Transcript:', msg));
   * socket.connect(); // Actually initiates the connection
   * ```
   */
  createConnection(args) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.connect(args);
    });
  }
}
class WrappedListenV2Socket extends V2Socket {
  constructor(args) {
    super(args);
    this.setupBinaryHandling();
  }
  setupBinaryHandling() {
    this.binaryAwareHandler = setupBinaryHandling(this.socket, this.eventHandlers);
  }
  connect() {
    const socketAny = this;
    preventDuplicateEventListeners(this.socket, {
      handleOpen: socketAny.handleOpen,
      handleMessage: socketAny.handleMessage,
      handleClose: socketAny.handleClose,
      handleError: socketAny.handleError
    });
    resetSocketConnectionState(this.socket);
    super.connect();
    this.setupBinaryHandling();
    return this;
  }
  /**
   * Send a WebSocket ping frame to keep the connection alive.
   *
   * In Node.js, this uses the native WebSocket ping() method from the 'ws' library.
   * In browsers, WebSocket ping/pong is handled automatically by the browser and
   * cannot be manually triggered, so this method will throw an error.
   *
   * @param data Optional data to send with the ping (Node.js only)
   * @throws Error if not in Node.js environment or WebSocket is not connected
   */
  ping(data) {
    const ws = this.socket._ws;
    if (!ws) {
      throw new Error("WebSocket is not connected. Call connect() and waitForOpen() first.");
    }
    if (ws.readyState !== ws.OPEN) {
      throw new Error("WebSocket is not in OPEN state.");
    }
    if (RUNTIME.type === "node" && typeof ws.ping === "function") {
      ws.ping(data);
    } else {
      throw new Error("WebSocket ping is not supported in browser environments. Browser WebSocket connections handle ping/pong automatically. If you need keepalive in the browser, consider sending periodic audio data or using a timer.");
    }
  }
}
class WrappedSpeakV1Client extends V1Client7 {
  connect(args) {
    return __awaiter(this, void 0, void 0, function* () {
      const { headers, debug, reconnectAttempts, connectionTimeoutInSeconds, abortSignal } = args;
      const socket = yield createWebSocketConnection({
        options: this._options,
        urlPath: "/v1/speak",
        environmentKey: "production",
        queryParams: buildQueryParams(args),
        headers,
        debug,
        reconnectAttempts,
        connectionTimeoutInSeconds,
        abortSignal
      });
      return new WrappedSpeakV1Socket({ socket });
    });
  }
  /**
   * Creates a WebSocket connection object without actually connecting.
   * This is an alias for connect() with clearer naming - the returned socket
   * is not connected until you call socket.connect().
   *
   * Usage:
   * ```typescript
   * const socket = await client.speak.v1.createConnection({ model: 'aura-asteria-en' });
   * socket.on('open', () => console.log('Connected!'));
   * socket.on('message', (audioData) => console.log('Audio received'));
   * socket.connect(); // Actually initiates the connection
   * ```
   */
  createConnection(args) {
    return __awaiter(this, void 0, void 0, function* () {
      return this.connect(args);
    });
  }
}
class WrappedSpeakV1Socket extends V1Socket3 {
  constructor(args) {
    super(args);
    const socketAny = this;
    if (socketAny.handleMessage) {
      this.socket.removeEventListener("message", socketAny.handleMessage);
    }
    this.setupBinaryHandling();
  }
  setupBinaryHandling() {
    this.binaryAwareHandler = setupBinaryHandling(this.socket, this.eventHandlers);
  }
  connect() {
    const socketAny = this;
    preventDuplicateEventListeners(this.socket, {
      handleOpen: socketAny.handleOpen,
      handleMessage: socketAny.handleMessage,
      handleClose: socketAny.handleClose,
      handleError: socketAny.handleError
    });
    resetSocketConnectionState(this.socket);
    super.connect();
    this.setupBinaryHandling();
    return this;
  }
}
async function createDeepgramConnection(apiKey, callbacks) {
  console.log("[Deepgram] Creating new connection...");
  const deepgram = new CustomDeepgramClient({ apiKey });
  const connection = await deepgram.listen.v1.connect({
    model: "nova-2",
    language: "en",
    encoding: "linear16",
    sample_rate: 16e3,
    channels: 1,
    interim_results: true,
    endpointing: 300,
    utterance_end_ms: 1e3
  });
  let lastFinalTranscript = "";
  let utteranceProcessed = false;
  connection.on("open", () => {
    console.log("[Deepgram] Connection opened");
  });
  connection.on("message", async (data) => {
    var _a, _b, _c;
    console.log("[Deepgram] Raw event:", JSON.stringify(data, null, 2));
    if (data.type === "Results") {
      const transcript = (_c = (_b = (_a = data.channel) == null ? void 0 : _a.alternatives) == null ? void 0 : _b[0]) == null ? void 0 : _c.transcript;
      if (!(transcript == null ? void 0 : transcript.trim())) return;
      if (data.is_final) {
        lastFinalTranscript += (lastFinalTranscript ? " " : "") + transcript;
        lastFinalTranscript = lastFinalTranscript.trim();
        console.log("[Deepgram] is_final accumulated:", lastFinalTranscript);
      }
      if (data.speech_final) {
        console.log("[Deepgram] speech_final - full transcript:", lastFinalTranscript);
        if (!utteranceProcessed && lastFinalTranscript.trim()) {
          utteranceProcessed = true;
          callbacks.onSpeechFinal(lastFinalTranscript);
          lastFinalTranscript = "";
        }
      } else if (!data.is_final) {
        console.log("[Deepgram] interim:", transcript);
        callbacks.onTranscriptInterim(transcript);
      }
    }
    if (data.type === "UtteranceEnd") {
      if (!utteranceProcessed && lastFinalTranscript.trim()) {
        console.log("[Deepgram] UtteranceEnd — final transcript:", lastFinalTranscript);
        utteranceProcessed = true;
        callbacks.onUtteranceEnd(lastFinalTranscript);
        lastFinalTranscript = "";
      }
      utteranceProcessed = false;
    }
  });
  connection.on("error", (err) => {
    console.error("[Deepgram] Error:", err);
    callbacks.onError(err);
  });
  connection.on("close", () => {
    console.log("[Deepgram] Connection closed");
    callbacks.onClose();
  });
  connection.connect();
  await connection.waitForOpen();
  console.log("[Deepgram] Connection established and ready");
  return connection;
}
dotenv.config();
let mainWindow = null;
let activeMic = null;
let activeConnection = null;
let aiSpeaking = false;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: require$$1.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(require$$1.join(__dirname, "../dist/index.html"));
  }
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
function reopenMic() {
  if (activeMic) {
    activeMic.stop();
    activeMic = null;
  }
  activeMic = createMicInstance((chunk) => {
    if (!aiSpeaking && activeConnection) {
      activeConnection.sendMedia(chunk);
    }
  });
  activeMic.start();
  console.log("[Mic] Reopened and streaming to Deepgram");
}
async function simulateAITurn(userTranscript) {
  console.log("[AI] Starting simulated turn for:", userTranscript);
  aiSpeaking = true;
  mainWindow == null ? void 0 : mainWindow.webContents.send("agent-thinking");
  await new Promise((resolve) => setTimeout(resolve, 6e3));
  const simulatedResponse = "Simulated AI response";
  console.log("[AI] Sending simulated response:", simulatedResponse);
  mainWindow == null ? void 0 : mainWindow.webContents.send("agent-response", simulatedResponse);
  aiSpeaking = false;
  console.log("[AI] Turn complete, mic ungated");
}
async function startDeepgramConnection() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error("[Main] DEEPGRAM_API_KEY not set");
    throw new Error("DEEPGRAM_API_KEY not set");
  }
  const connection = await createDeepgramConnection(apiKey, {
    onOpen: () => {
    },
    onTranscriptInterim: (text) => {
      mainWindow == null ? void 0 : mainWindow.webContents.send("transcript-interim", text);
    },
    onTranscriptFinal: (_text) => {
    },
    onSpeechFinal: async (text) => {
      mainWindow == null ? void 0 : mainWindow.webContents.send("transcript-final", text);
      await simulateAITurn(text);
    },
    onUtteranceEnd: async (_text) => {
      console.log("[Main] UtteranceEnd ignored");
    },
    onError: (err) => {
      console.error("[Main] Deepgram error:", err);
    },
    onClose: () => {
      console.log("[Main] Deepgram closed");
      const wasActive = activeConnection !== null;
      activeMic == null ? void 0 : activeMic.stop();
      activeMic = null;
      activeConnection = null;
      if (wasActive) {
        console.log("[Main] Notifying frontend of connection loss");
        mainWindow == null ? void 0 : mainWindow.webContents.send("connection-closed");
      }
    }
  });
  return connection;
}
electron.ipcMain.handle("start-listening", async () => {
  if (activeConnection) {
    console.log("[Main] Already listening, ignoring");
    return;
  }
  console.log("[Main] start-listening called");
  activeConnection = await startDeepgramConnection();
  reopenMic();
  console.log("[Main] Listening started");
});
electron.ipcMain.handle("stop-listening", () => {
  console.log("[Main] stop-listening called");
  activeMic == null ? void 0 : activeMic.stop();
  if (activeConnection) {
    try {
      activeConnection.close();
    } catch (err) {
      console.error("[Main] Error closing connection:", err);
    }
  }
  activeMic = null;
  activeConnection = null;
  console.log("[Main] Stopped");
});
electron.ipcMain.handle("playback-done", async () => {
  console.log("[Main] playback-done called (TTS not wired up yet)");
});
