

var navigator = {
  userAgent: "wx",
  platform: "Mobile"
};
function ImageData() { }

function extend(child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) child[key] = parent[key]
  }
  function ctor() {
    this.constructor = child
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
  child.__super__ = parent.prototype;
  return child
}

var hasProp = {}.hasOwnProperty;
// var indexOf = [].indexOf ||
//   function (item) {
//     for (var i = 0,
//       l = this.length; i < l; i++) {
//       if (i in this && this[i] === item) return i
//     }
//     return - 1
//   };
// var slice = [].slice;

var EventEmitter = require("event.js");

var GIF = function (superClass) {
  var defaults, frameDefaults;
  extend(GIF, superClass);
  defaults = {
    workerScript: "workers/gif.worker.js",
    workers: 1,
    repeat: 0,
    background: "#fff",
    quality: 1,
    width: null,
    height: null,
    transparent: null,
    debug: false,
    dither: false
  };
  frameDefaults = {
    delay: 500,
    copy: false
  };
  function GIF(options) {
    var base, key, value;
    this.running = false;
    this.options = {};
    this.frames = [];
    this.freeWorkers = [];
    this.activeWorkers = [];
    this.setOptions(options);
    for (key in defaults) {
      value = defaults[key];
      if ((base = this.options)[key] == null) {
        base[key] = value
      }
    }
  }
  GIF.prototype.setOption = function (key, value) {
    this.options[key] = value;
    if (this._canvas != null && (key === "width" || key === "height")) {
      return this._canvas[key] = value
    }
  };
  GIF.prototype.setOptions = function (options) {
    var key, results, value;
    results = [];
    for (key in options) {
      if (!hasProp.call(options, key)) continue;
      value = options[key];
      results.push(this.setOption(key, value))
    }
    return results
  };
  GIF.prototype.addFrame = function (image, options) {
    var frame, key;
    if (options == null) {
      options = {}
    }
    frame = {};
    frame.transparent = this.options.transparent;
    for (key in frameDefaults) {
      frame[key] = options[key] || frameDefaults[key]
    }
    if (this.options.width == null) {
      this.setOption("width", image.width)
    }
    if (this.options.height == null) {
      this.setOption("height", image.height)
    }
    if (typeof ImageData !== "undefined" && ImageData !== null && image instanceof ImageData) {
      frame.data = image.data
    } else if (typeof CanvasRenderingContext2D !== "undefined" && CanvasRenderingContext2D !== null && image instanceof CanvasRenderingContext2D || typeof WebGLRenderingContext !== "undefined" && WebGLRenderingContext !== null && image instanceof WebGLRenderingContext) {
      if (options.copy) {
        frame.data = this.getContextData(image)
      } else {
        frame.context = image
      }
    } else if (image.childNodes != null) {
      if (options.copy) {
        frame.data = this.getImageData(image)
      } else {
        frame.image = image
      }
    } else {
      throw new Error("Invalid image")
    }
    return this.frames.push(frame)
  };
  GIF.prototype.render = function () {
    var i, j, numWorkers, ref;
    if (this.running) {
      throw new Error("Already running")
    }
    if (this.options.width == null || this.options.height == null) {
      throw new Error("Width and height must be set prior to rendering")
    }
    this.running = true;
    this.nextFrame = 0;
    this.finishedFrames = 0;
    this.imageParts = function () {
      var j, ref, results;
      results = [];
      for (i = j = 0, ref = this.frames.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        results.push(null)
      }
      return results
    }.call(this);
    numWorkers = this.spawnWorkers();
  };
  GIF.prototype.abort = function () {
    var worker;
    while (true) {
      worker = this.activeWorkers.shift();
      if (worker == null) {
        break
      }
      worker.terminate()
    }
    this.running = false;
    return this.emit("abort")
  };
  GIF.prototype.destory = function () {
    var worker;
    while (true) {
      worker = this.activeWorkers.shift();
      if (worker == null) {
        break
      }
      worker.terminate()
    }
    while (true) {
      worker = this.freeWorkers.shift();
      if (worker == null) {
        break
      }
      worker.terminate()
    }
    this.running = false;
    return this.emit("abort")
  };
  GIF.prototype.spawnWorkers = function () {
    var j, numWorkers, ref, results;
    numWorkers = Math.min(this.options.workers, this.frames.length); (function () {
      results = [];
      for (var j = ref = this.freeWorkers.length; ref <= numWorkers ? j < numWorkers : j > numWorkers; ref <= numWorkers ? j++ : j--) {
        results.push(j)
      }
      return results
    }).apply(this).forEach(function (_this) {
      //console.log("apply(this).forEach(function (_this) {", _this);
      return function (i) {
        var worker;
        //console.log("spawning worker " + i + " _this=", _this);
        worker = wx.createWorker(_this.options.workerScript);
        var _that = _this;
        worker.onMessage(function (event) {
          //console.log("worker.onMessage(function (msg) {", event.data, "_that=", _that);
          if (event.data == "init") {
            //console.log("gif.js init start. _that=", _that, "_that.options=", _that.options, "_that.options.globalPalette", _that.options.globalPalette);
            if (_that.options.globalPalette === true) {
              _that.renderNextFrame()
            } else {
              for (i = j = 0, ref = numWorkers; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
                _that.renderNextFrame()
              }
            }
            //console.log("gif.js init start>>1");
            _that.emit("start");
            //console.log("gif.js init start>>2");
            _that.emit("progress", 0);
            //console.log("gif.js init start>>3");
            return;
          }
          //console.log("gif.js before return frameFinished>00", event.data, "_this=", _this);
          _that.activeWorkers.splice(_that.activeWorkers.indexOf(worker), 1);
          //console.log("gif.js before return frameFinished>01");
          _that.freeWorkers.push(worker);
          //console.log("gif.js before return frameFinished>02");
          return _that.frameFinished(event.data)
        });
        return _this.freeWorkers.push(worker)
      }
    }(this));
    return numWorkers
  };
  GIF.prototype.frameFinished = function (frame) {
    //console.log("gif.js GIF.prototype.frameFinished>01");
    var i, j, ref;
    //console.log("gif.js GIF.prototype.frameFinished>02");
    //console.log("frame " + frame.index + " finished - " + this.activeWorkers.length + " active");
    //console.log("gif.js GIF.prototype.frameFinished>03");
    this.finishedFrames++;
    this.emit("progress", this.finishedFrames / this.frames.length);
    this.imageParts[frame.index] = frame;
    //console.log("gif.js GIF.prototype.frameFinished>04");
    if (this.options.globalPalette === true) {
      this.options.globalPalette = frame.globalPalette;
      //console.log("global palette analyzed");
      if (this.frames.length > 2) {
        for (i = j = 1, ref = this.freeWorkers.length; 1 <= ref ? j < ref : j > ref; i = 1 <= ref ? ++j : --j) {
          this.renderNextFrame()
        }
      }
    }
    if (this.imageParts.indexOf(null) >= 0) {
      return this.renderNextFrame()
    } else {
      return this.finishRendering()
    }
    //console.log("gif.js frameFinished OK.");
  };
  GIF.prototype.finishRendering = function () {
    var data, frame, i, image, j, k, l, len, len1, len2, len3, offset, page, ref, ref1, ref2;
    len = 0;
    ref = this.imageParts;
    for (j = 0, len1 = ref.length; j < len1; j++) {
      frame = ref[j];
      len += (frame.data.length - 1) * frame.pageSize + frame.cursor
    }
    len += frame.pageSize - frame.cursor;
    //console.log("rendering finished - filesize " + Math.round(len / 1e3) + "kb");
    data = new Uint8Array(len);
    offset = 0;
    ref1 = this.imageParts;
    for (k = 0, len2 = ref1.length; k < len2; k++) {
      frame = ref1[k];
      ref2 = frame.data;
      for (i = l = 0, len3 = ref2.length; l < len3; i = ++l) {
        page = ref2[i];
        var arr = Object.keys(page).map(function (key) { return page[key]; });
        data.set(arr, offset);
        if (i === frame.data.length - 1) {
          offset += frame.cursor
        } else {
          offset += frame.pageSize
        }
      }
    }
    // image = new Blob([data], {
    //   type: "image/gif"
    // });
    return this.emit("finished", data)
  };
  GIF.prototype.renderNextFrame = function () {
    var frame, task, worker;
    if (this.freeWorkers.length === 0) {
      throw new Error("No free workers")
    }
    if (this.nextFrame >= this.frames.length) {
      return
    }
    frame = this.frames[this.nextFrame++];
    worker = this.freeWorkers.shift();
    task = this.getTask(frame);
    //console.log("starting frame " + (task.index + 1) + " of " + this.frames.length);
    this.activeWorkers.push(worker);
    return worker.postMessage({data:task})
  };
  GIF.prototype.getContextData = function (ctx) {
    return ctx.getImageData(0, 0, this.options.width, this.options.height).data
  };
  GIF.prototype.getImageData = function (image) {
    var ctx;
    if (this._canvas == null) {
      this._canvas = document.createElement("canvas");
      this._canvas.width = this.options.width;
      this._canvas.height = this.options.height
    }
    ctx = this._canvas.getContext("2d");
    ctx.setFill = this.options.background;
    ctx.fillRect(0, 0, this.options.width, this.options.height);
    ctx.drawImage(image, 0, 0);
    return this.getContextData(ctx)
  };
  GIF.prototype.getTask = function (frame) {
    var index, task;
    index = this.frames.indexOf(frame);
    task = {
      index: index,
      last: index === this.frames.length - 1,
      delay: frame.delay,
      transparent: frame.transparent,
      width: this.options.width,
      height: this.options.height,
      quality: this.options.quality,
      dither: this.options.dither,
      globalPalette: this.options.globalPalette,
      repeat: this.options.repeat,
      canTransfer: false
    };
    if (frame.data != null) {
      task.data = frame.data
    } else if (frame.context != null) {
      task.data = this.getContextData(frame.context)
    } else if (frame.image != null) {
      task.data = this.getImageData(frame.image)
    } else {
      throw new Error("Invalid frame")
    }
    return task
  };
  return GIF
}(EventEmitter);
module.exports.GIF = GIF;
module.exports.ImageData = ImageData;
