var BaseObjPool = /** @class */ (function () {
    function BaseObjPool() {
    }
    Object.defineProperty(BaseObjPool.prototype, "poolObjs", {
        get: function () {
            return this._poolObjs;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseObjPool.prototype, "sign", {
        get: function () {
            return this._sign;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseObjPool.prototype, "size", {
        get: function () {
            var poolObjs = this._poolObjs;
            return poolObjs ? poolObjs.length : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseObjPool.prototype, "usedCount", {
        get: function () {
            return this._usedObjMap ? this._usedObjMap.size : 0;
        },
        enumerable: false,
        configurable: true
    });
    BaseObjPool.prototype.initByFunc = function (sign, createFunc) {
        if (!this._sign) {
            this._sign = sign;
            this._poolObjs = [];
            this._usedObjMap = new Map();
            this._createFunc = createFunc;
        }
        else {
            this._loghasInit();
        }
        return this;
    };
    BaseObjPool.prototype.initByClass = function (sign, clas) {
        if (!this._sign) {
            this._sign = sign;
            this._poolObjs = [];
            this._usedObjMap = new Map();
            this._createFunc = function () {
                return new clas();
            };
        }
        else {
            this._loghasInit();
        }
        return this;
    };
    BaseObjPool.prototype.setObjHandler = function (objHandler) {
        this._objHandler = objHandler;
    };
    BaseObjPool.prototype.preCreate = function (num) {
        if (!this._sign) {
            this._logNotInit();
            return;
        }
        var poolObjs = this._poolObjs;
        var obj;
        var handler = this._objHandler;
        for (var i = 0; i < num; i++) {
            obj = this._createFunc();
            if (obj && obj.onCreate) {
                obj.onCreate(this);
            }
            else if (handler && handler.onCreate) {
                handler.onCreate(obj);
            }
            obj.poolSign = this._sign;
            obj.isInPool = true;
            poolObjs.push(obj);
        }
    };
    BaseObjPool.prototype.clear = function () {
        var poolObjs = this.poolObjs;
        if (poolObjs) {
            var poolObj = void 0;
            for (var i = 0; i < poolObjs.length; i++) {
                poolObj = poolObjs[i];
                this.kill(poolObj);
            }
            poolObjs.length = 0;
        }
    };
    BaseObjPool.prototype.kill = function (obj) {
        if (this._usedObjMap.has(obj)) {
            var handler_1 = this._objHandler;
            if (obj.onFree) {
                obj.onFree();
            }
            else if (handler_1 && handler_1.onFree) {
                handler_1.onFree(obj);
            }
            this._usedObjMap.delete(obj);
        }
        var handler = this._objHandler;
        if (obj && obj.onKill) {
            obj.onKill();
        }
        else if (handler && handler.onKill) {
            handler.onKill(obj);
        }
    };
    BaseObjPool.prototype.free = function (obj) {
        if (!this._sign) {
            this._logNotInit();
            return;
        }
        if (!obj.isInPool) {
            var handler = this._objHandler;
            if (obj.onFree) {
                obj.onFree();
            }
            else if (handler && handler.onFree) {
                handler.onFree(obj);
            }
            this._poolObjs.push(obj);
            this._usedObjMap.delete(obj);
        }
        else {
            console.warn("pool :" + this._sign + " obj is in pool");
        }
    };
    BaseObjPool.prototype.freeAll = function () {
        var _this = this;
        this._usedObjMap.forEach(function (value) {
            _this.free(value);
        });
        this._usedObjMap.clear();
    };
    BaseObjPool.prototype.get = function (onGetData) {
        if (!this._sign) {
            this._logNotInit();
            return;
        }
        var obj;
        if (this.poolObjs.length) {
            obj = this._poolObjs.pop();
        }
        else {
            obj = this._createFunc();
            obj.onCreate && obj.onCreate(this);
            obj.poolSign = this._sign;
        }
        this._usedObjMap.set(obj, obj);
        obj.isInPool = false;
        var handler = this._objHandler;
        if (obj.onGet) {
            obj.onGet(onGetData);
        }
        else if (handler && handler.onGet) {
            handler.onGet(obj, onGetData);
        }
        return obj;
    };
    BaseObjPool.prototype.getMore = function (onGetData, num) {
        if (num === void 0) { num = 1; }
        var objs = [];
        if (!isNaN(num) && num > 1) {
            for (var i = 0; i < num; i++) {
                objs.push(this.get(onGetData));
            }
        }
        else {
            objs.push(this.get(onGetData));
        }
        return objs;
    };
    BaseObjPool.prototype._loghasInit = function () {
        console.warn("\u5BF9\u8C61\u6C60" + this._sign + "\u5DF2\u7ECF\u521D\u59CB\u5316");
    };
    BaseObjPool.prototype._logNotInit = function () {
        console.error("\u5BF9\u8C61\u6C60\u8FD8\u6CA1\u521D\u59CB\u5316");
    };
    return BaseObjPool;
}());

var logType = {
    poolIsNull: "对象池不存在",
    poolExit: "对象池已存在",
    signIsNull: "sign is null",
};
var ObjPoolMgr = /** @class */ (function () {
    function ObjPoolMgr() {
        this._poolDic = {};
    }
    ObjPoolMgr.prototype.setObjPoolHandler = function (sign, objHandler) {
        var pool = this._poolDic[sign];
        if (pool) {
            pool.setObjHandler(objHandler);
        }
    };
    ObjPoolMgr.prototype.createByClass = function (sign, cls) {
        if (this.hasPool(sign)) {
            this._log("" + logType.poolExit + sign);
            return;
        }
        if (sign && sign.trim() !== "") {
            var pool = new BaseObjPool();
            pool.initByClass(sign, cls);
            this._poolDic[sign] = pool;
        }
        else {
            this._log("" + logType.signIsNull);
        }
    };
    ObjPoolMgr.prototype.createByFunc = function (sign, createFunc) {
        if (this.hasPool(sign)) {
            this._log("" + logType.poolExit + sign);
            return;
        }
        if (sign && sign.trim() !== "") {
            var pool = new BaseObjPool();
            pool.initByFunc(sign, createFunc);
            this._poolDic[sign] = pool;
        }
        else {
            this._log("" + logType.signIsNull);
        }
    };
    ObjPoolMgr.prototype.hasPool = function (sign) {
        return !!this._poolDic[sign];
    };
    ObjPoolMgr.prototype.getPool = function (sign) {
        return this._poolDic[sign];
    };
    ObjPoolMgr.prototype.clearPool = function (sign) {
        var pool = this._poolDic[sign];
        if (pool) {
            pool.clear();
        }
    };
    ObjPoolMgr.prototype.destroyPool = function (sign) {
        var poolDic = this._poolDic;
        var pool = poolDic[sign];
        if (pool) {
            pool.clear();
            poolDic[sign] = undefined;
        }
        else {
            this._log("" + logType.poolIsNull + sign);
        }
    };
    ObjPoolMgr.prototype.preCreate = function (sign, preCreateCount) {
        var pool = this._poolDic[sign];
        if (pool) {
            pool.preCreate(preCreateCount);
        }
        else {
            this._log("" + logType.poolIsNull + sign);
        }
    };
    ObjPoolMgr.prototype.get = function (sign, onGetData) {
        var pool = this._poolDic[sign];
        return pool ? pool.get(onGetData) : undefined;
    };
    ObjPoolMgr.prototype.getMore = function (sign, onGetData, num) {
        var pool = this._poolDic[sign];
        return pool ? pool.getMore(onGetData, num) : undefined;
    };
    ObjPoolMgr.prototype.getPoolObjsBySign = function (sign) {
        var pool = this._poolDic[sign];
        return pool ? pool.poolObjs : undefined;
    };
    ObjPoolMgr.prototype.free = function (obj) {
        var pool = this._poolDic[obj.poolSign];
        if (pool) {
            pool.free(obj);
        }
    };
    ObjPoolMgr.prototype.freeAll = function (sign) {
        var pool = this._poolDic[sign];
        if (pool) {
            pool.freeAll();
        }
    };
    ObjPoolMgr.prototype.kill = function (obj) {
        var pool = this._poolDic[obj.poolSign];
        if (pool) {
            pool.kill(obj);
        }
    };
    ObjPoolMgr.prototype._log = function (msg, level) {
        if (level === void 0) { level = 1; }
        var tagStr = "[对象池管理器]";
        switch (level) {
            case 0:
                console.log(tagStr + msg);
                break;
            case 1:
                console.warn(tagStr + msg);
            case 2:
                console.error(tagStr + msg);
            default:
                console.log(tagStr + msg);
                break;
        }
    };
    return ObjPoolMgr;
}());

export { BaseObjPool, ObjPoolMgr };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubWpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvb2JqLXBvb2wudHMiLCIuLi8uLi8uLi9zcmMvb2JqLXBvb2wtbWdyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBCYXNlT2JqUG9vbDxUIGV4dGVuZHMgb2JqUG9vbC5JT2JqID0gYW55LCBvbkdldERhdGFUeXBlID0gYW55PiBpbXBsZW1lbnRzIG9ialBvb2wuSVBvb2w8VCwgb25HZXREYXRhVHlwZT4ge1xuXG4gICAgcHJpdmF0ZSBfcG9vbE9ianM6IG9ialBvb2wuSU9ialtdO1xuICAgIHByaXZhdGUgX3VzZWRPYmpNYXA6IE1hcDxvYmpQb29sLklPYmosIG9ialBvb2wuSU9iaj47XG4gICAgcHVibGljIGdldCBwb29sT2JqcygpOiBvYmpQb29sLklPYmpbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb29sT2JqcztcbiAgICB9XG4gICAgcHJpdmF0ZSBfc2lnbjogc3RyaW5nO1xuICAgIHB1YmxpYyBnZXQgc2lnbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2lnbjtcbiAgICB9XG4gICAgcHJpdmF0ZSBfY3JlYXRlRnVuYzogKC4uLmFyZ3MpID0+IFQ7XG4gICAgcHJvdGVjdGVkIF9vYmpIYW5kbGVyOiBvYmpQb29sLklPYmpIYW5kbGVyO1xuICAgIHB1YmxpYyBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgICAgICBjb25zdCBwb29sT2JqcyA9IHRoaXMuX3Bvb2xPYmpzO1xuICAgICAgICByZXR1cm4gcG9vbE9ianMgPyBwb29sT2Jqcy5sZW5ndGggOiAwO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IHVzZWRDb3VudCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5fdXNlZE9iak1hcCA/IHRoaXMuX3VzZWRPYmpNYXAuc2l6ZSA6IDA7XG4gICAgfVxuICAgIHB1YmxpYyBpbml0QnlGdW5jKHNpZ246IHN0cmluZywgY3JlYXRlRnVuYzogKCkgPT4gVCk6IG9ialBvb2wuSVBvb2w8VCwgb25HZXREYXRhVHlwZT4ge1xuICAgICAgICBpZiAoIXRoaXMuX3NpZ24pIHtcbiAgICAgICAgICAgIHRoaXMuX3NpZ24gPSBzaWduO1xuICAgICAgICAgICAgdGhpcy5fcG9vbE9ianMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3VzZWRPYmpNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVGdW5jID0gY3JlYXRlRnVuYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ2hhc0luaXQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgIH1cbiAgICBwdWJsaWMgaW5pdEJ5Q2xhc3Moc2lnbjogc3RyaW5nLFxuICAgICAgICBjbGFzOiBvYmpQb29sLkNsYXM8VD4pOiBvYmpQb29sLklQb29sPFQsIG9uR2V0RGF0YVR5cGU+IHtcbiAgICAgICAgaWYgKCF0aGlzLl9zaWduKSB7XG4gICAgICAgICAgICB0aGlzLl9zaWduID0gc2lnbjtcbiAgICAgICAgICAgIHRoaXMuX3Bvb2xPYmpzID0gW107XG4gICAgICAgICAgICB0aGlzLl91c2VkT2JqTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlRnVuYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGNsYXMoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9sb2doYXNJbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHB1YmxpYyBzZXRPYmpIYW5kbGVyKG9iakhhbmRsZXI6IG9ialBvb2wuSU9iakhhbmRsZXI8b25HZXREYXRhVHlwZT4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fb2JqSGFuZGxlciA9IG9iakhhbmRsZXI7XG4gICAgfVxuXG4gICAgcHVibGljIHByZUNyZWF0ZShudW06IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuX3NpZ24pIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZ05vdEluaXQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwb29sT2JqcyA9IHRoaXMuX3Bvb2xPYmpzO1xuICAgICAgICBsZXQgb2JqOiBvYmpQb29sLklPYmo7XG4gICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9vYmpIYW5kbGVyO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICBvYmogPSB0aGlzLl9jcmVhdGVGdW5jKCk7XG4gICAgICAgICAgICBpZiAob2JqICYmIG9iai5vbkNyZWF0ZSkge1xuICAgICAgICAgICAgICAgIG9iai5vbkNyZWF0ZSh0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLm9uQ3JlYXRlKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5vbkNyZWF0ZShvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqLnBvb2xTaWduID0gdGhpcy5fc2lnbjtcbiAgICAgICAgICAgIG9iai5pc0luUG9vbCA9IHRydWU7XG4gICAgICAgICAgICBwb29sT2Jqcy5wdXNoKG9iaik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBwb29sT2JqcyA9IHRoaXMucG9vbE9ianM7XG4gICAgICAgIGlmIChwb29sT2Jqcykge1xuICAgICAgICAgICAgbGV0IHBvb2xPYmo6IG9ialBvb2wuSU9iajtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9vbE9ianMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwb29sT2JqID0gcG9vbE9ianNbaV07XG4gICAgICAgICAgICAgICAgdGhpcy5raWxsKHBvb2xPYmogYXMgYW55KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvb2xPYmpzLmxlbmd0aCA9IDA7XG4gICAgICAgIH1cblxuXG4gICAgfVxuICAgIHB1YmxpYyBraWxsKG9iajogVCBleHRlbmRzIG9ialBvb2wuSU9iaiA/IFQgOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX3VzZWRPYmpNYXAuaGFzKG9iaikpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9vYmpIYW5kbGVyO1xuICAgICAgICAgICAgaWYgKG9iai5vbkZyZWUpIHtcbiAgICAgICAgICAgICAgICBvYmoub25GcmVlKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5vbkZyZWUpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLm9uRnJlZShvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdXNlZE9iak1hcC5kZWxldGUob2JqKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5fb2JqSGFuZGxlcjtcbiAgICAgICAgaWYgKG9iaiAmJiBvYmoub25LaWxsKSB7XG4gICAgICAgICAgICBvYmoub25LaWxsKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLm9uS2lsbCkge1xuICAgICAgICAgICAgaGFuZGxlci5vbktpbGwob2JqKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdWJsaWMgZnJlZShvYmo6IFQgZXh0ZW5kcyBvYmpQb29sLklPYmogPyBUIDogYW55KTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5fc2lnbikge1xuICAgICAgICAgICAgdGhpcy5fbG9nTm90SW5pdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb2JqLmlzSW5Qb29sKSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5fb2JqSGFuZGxlcjtcblxuICAgICAgICAgICAgaWYgKG9iai5vbkZyZWUpIHtcbiAgICAgICAgICAgICAgICBvYmoub25GcmVlKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5vbkZyZWUpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLm9uRnJlZShvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcG9vbE9ianMucHVzaChvYmopO1xuICAgICAgICAgICAgdGhpcy5fdXNlZE9iak1hcC5kZWxldGUob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgcG9vbCA6JHt0aGlzLl9zaWdufSBvYmogaXMgaW4gcG9vbGApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBmcmVlQWxsKCkge1xuICAgICAgICB0aGlzLl91c2VkT2JqTWFwLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmZyZWUodmFsdWUgYXMgYW55KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3VzZWRPYmpNYXAuY2xlYXIoKTtcbiAgICB9XG4gICAgcHVibGljIGdldChvbkdldERhdGE/OiBvbkdldERhdGFUeXBlKTogVCB7XG4gICAgICAgIGlmICghdGhpcy5fc2lnbikge1xuICAgICAgICAgICAgdGhpcy5fbG9nTm90SW5pdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG9iajogb2JqUG9vbC5JT2JqO1xuICAgICAgICBpZiAodGhpcy5wb29sT2Jqcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG9iaiA9IHRoaXMuX3Bvb2xPYmpzLnBvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2JqID0gdGhpcy5fY3JlYXRlRnVuYygpO1xuICAgICAgICAgICAgb2JqLm9uQ3JlYXRlICYmIG9iai5vbkNyZWF0ZSh0aGlzKTtcbiAgICAgICAgICAgIG9iai5wb29sU2lnbiA9IHRoaXMuX3NpZ247XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdXNlZE9iak1hcC5zZXQob2JqLCBvYmopO1xuICAgICAgICBvYmouaXNJblBvb2wgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMuX29iakhhbmRsZXI7XG4gICAgICAgIGlmIChvYmoub25HZXQpIHtcbiAgICAgICAgICAgIG9iai5vbkdldChvbkdldERhdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKGhhbmRsZXIgJiYgaGFuZGxlci5vbkdldCkge1xuICAgICAgICAgICAgaGFuZGxlci5vbkdldChvYmosIG9uR2V0RGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9iaiBhcyBUO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0TW9yZShvbkdldERhdGE/OiBvbkdldERhdGFUeXBlLCBudW06IG51bWJlciA9IDEpOiBUW10ge1xuICAgICAgICBjb25zdCBvYmpzID0gW107XG4gICAgICAgIGlmICghaXNOYU4obnVtKSAmJiBudW0gPiAxKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb2Jqcy5wdXNoKHRoaXMuZ2V0KG9uR2V0RGF0YSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Jqcy5wdXNoKHRoaXMuZ2V0KG9uR2V0RGF0YSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmpzIGFzIGFueTtcbiAgICB9XG4gICAgcHJpdmF0ZSBfbG9naGFzSW5pdCgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGDlr7nosaHmsaAke3RoaXMuX3NpZ2595bey57uP5Yid5aeL5YyWYCk7XG4gICAgfVxuICAgIHByaXZhdGUgX2xvZ05vdEluaXQoKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYOWvueixoeaxoOi/mOayoeWIneWni+WMlmApO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBCYXNlT2JqUG9vbCB9IGZyb20gXCIuL29iai1wb29sXCI7XG5jb25zdCBsb2dUeXBlID0ge1xuICAgIHBvb2xJc051bGw6IFwi5a+56LGh5rGg5LiN5a2Y5ZyoXCIsXG4gICAgcG9vbEV4aXQ6IFwi5a+56LGh5rGg5bey5a2Y5ZyoXCIsXG4gICAgc2lnbklzTnVsbDogXCJzaWduIGlzIG51bGxcIixcbn07XG5leHBvcnQgY2xhc3MgT2JqUG9vbE1ncjxTaWduVHlwZSA9IGFueSwgR2V0RGF0YVR5cGUgPSBhbnk+IGltcGxlbWVudHMgb2JqUG9vbC5JUG9vbE1ncjxTaWduVHlwZSwgR2V0RGF0YVR5cGU+IHtcblxuICAgIHByaXZhdGUgX3Bvb2xEaWM6IHsgW2tleSBpbiBrZXlvZiBTaWduVHlwZV06IEJhc2VPYmpQb29sPGFueT4gfSA9IHt9IGFzIGFueTtcbiAgICBwdWJsaWMgc2V0T2JqUG9vbEhhbmRsZXI8a2V5VHlwZSBleHRlbmRzIGtleW9mIFNpZ25UeXBlID0gYW55PihzaWduOiBrZXlUeXBlLCBvYmpIYW5kbGVyOiBvYmpQb29sLklPYmpIYW5kbGVyKSB7XG4gICAgICAgIGNvbnN0IHBvb2wgPSB0aGlzLl9wb29sRGljW3NpZ25dO1xuICAgICAgICBpZiAocG9vbCkge1xuICAgICAgICAgICAgcG9vbC5zZXRPYmpIYW5kbGVyKG9iakhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBjcmVhdGVCeUNsYXNzKHNpZ246IGtleW9mIFNpZ25UeXBlLCBjbHM6IGFueSk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5oYXNQb29sKHNpZ24pKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2coYCR7bG9nVHlwZS5wb29sRXhpdH0ke3NpZ259YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNpZ24gJiYgKHNpZ24gYXMgc3RyaW5nKS50cmltKCkgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSBuZXcgQmFzZU9ialBvb2woKTtcbiAgICAgICAgICAgIHBvb2wuaW5pdEJ5Q2xhc3Moc2lnbiBhcyBzdHJpbmcsIGNscyk7XG4gICAgICAgICAgICB0aGlzLl9wb29sRGljW3NpZ25dID0gcG9vbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZyhgJHtsb2dUeXBlLnNpZ25Jc051bGx9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGNyZWF0ZUJ5RnVuYzxUID0gYW55PihzaWduOiBrZXlvZiBTaWduVHlwZSwgY3JlYXRlRnVuYzogKCkgPT4gVCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5oYXNQb29sKHNpZ24pKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2coYCR7bG9nVHlwZS5wb29sRXhpdH0ke3NpZ259YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNpZ24gJiYgKHNpZ24gYXMgc3RyaW5nKS50cmltKCkgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSBuZXcgQmFzZU9ialBvb2woKTtcbiAgICAgICAgICAgIHBvb2wuaW5pdEJ5RnVuYyhzaWduIGFzIHN0cmluZywgY3JlYXRlRnVuYyk7XG4gICAgICAgICAgICB0aGlzLl9wb29sRGljW3NpZ25dID0gcG9vbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZyhgJHtsb2dUeXBlLnNpZ25Jc051bGx9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGhhc1Bvb2woc2lnbjoga2V5b2YgU2lnblR5cGUpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5fcG9vbERpY1tzaWduXTtcbiAgICB9XG4gICAgcHVibGljIGdldFBvb2w8VCA9IGFueT4oc2lnbjoga2V5b2YgU2lnblR5cGUpOiBvYmpQb29sLklQb29sPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Bvb2xEaWNbc2lnbl0gYXMgYW55O1xuICAgIH1cbiAgICBwdWJsaWMgY2xlYXJQb29sKHNpZ246IGtleW9mIFNpZ25UeXBlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBvb2wgPSB0aGlzLl9wb29sRGljW3NpZ25dO1xuICAgICAgICBpZiAocG9vbCkge1xuICAgICAgICAgICAgcG9vbC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBkZXN0cm95UG9vbChzaWduOiBrZXlvZiBTaWduVHlwZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBwb29sRGljID0gdGhpcy5fcG9vbERpYztcbiAgICAgICAgY29uc3QgcG9vbCA9IHBvb2xEaWNbc2lnbl07XG4gICAgICAgIGlmIChwb29sKSB7XG4gICAgICAgICAgICBwb29sLmNsZWFyKCk7XG4gICAgICAgICAgICBwb29sRGljW3NpZ25dID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fbG9nKGAke2xvZ1R5cGUucG9vbElzTnVsbH0ke3NpZ259YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIHByZUNyZWF0ZShzaWduOiBrZXlvZiBTaWduVHlwZSwgcHJlQ3JlYXRlQ291bnQ6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBwb29sID0gdGhpcy5fcG9vbERpY1tzaWduXTtcbiAgICAgICAgaWYgKHBvb2wpIHtcbiAgICAgICAgICAgIHBvb2wucHJlQ3JlYXRlKHByZUNyZWF0ZUNvdW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2xvZyhgJHtsb2dUeXBlLnBvb2xJc051bGx9JHtzaWdufWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBnZXQ8VCA9IGFueSwga2V5VHlwZSBleHRlbmRzIGtleW9mIFNpZ25UeXBlID0gYW55PihcbiAgICAgICAgc2lnbjoga2V5VHlwZSxcbiAgICAgICAgb25HZXREYXRhPzogR2V0RGF0YVR5cGVbb2JqUG9vbC5Ub0FueUluZGV4S2V5PGtleVR5cGUsIEdldERhdGFUeXBlPl1cbiAgICApOiBUIHtcbiAgICAgICAgY29uc3QgcG9vbCA9IHRoaXMuX3Bvb2xEaWNbc2lnbl07XG4gICAgICAgIHJldHVybiBwb29sID8gcG9vbC5nZXQob25HZXREYXRhKSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcHVibGljIGdldE1vcmU8VCwga2V5VHlwZSBleHRlbmRzIGtleW9mIFNpZ25UeXBlID0gYW55PihcbiAgICAgICAgc2lnbjoga2V5VHlwZSxcbiAgICAgICAgb25HZXREYXRhPzogR2V0RGF0YVR5cGVbb2JqUG9vbC5Ub0FueUluZGV4S2V5PGtleVR5cGUsIEdldERhdGFUeXBlPl0sXG4gICAgICAgIG51bT86IG51bWJlcik6IFQgZXh0ZW5kcyBvYmpQb29sLklPYmogPyBUW10gOiBvYmpQb29sLklPYmpbXSB7XG4gICAgICAgIGNvbnN0IHBvb2wgPSB0aGlzLl9wb29sRGljW3NpZ25dO1xuICAgICAgICByZXR1cm4gcG9vbCA/IHBvb2wuZ2V0TW9yZShvbkdldERhdGEsIG51bSkgYXMgYW55IDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0UG9vbE9ianNCeVNpZ248VCBleHRlbmRzIG9ialBvb2wuSU9iaj4oc2lnbjoga2V5b2YgU2lnblR5cGUpOiBUIGV4dGVuZHMgb2JqUG9vbC5JT2JqID8gVFtdIDogb2JqUG9vbC5JT2JqW10ge1xuICAgICAgICBjb25zdCBwb29sID0gdGhpcy5fcG9vbERpY1tzaWduXTtcblxuICAgICAgICByZXR1cm4gcG9vbCA/IHBvb2wucG9vbE9ianMgYXMgYW55IDogdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHB1YmxpYyBmcmVlKG9iajogb2JqUG9vbC5JT2JqKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBvb2wgPSB0aGlzLl9wb29sRGljW29iai5wb29sU2lnbiBhcyBrZXlvZiBTaWduVHlwZV07XG4gICAgICAgIGlmIChwb29sKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHBvb2wuZnJlZShvYmopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBmcmVlQWxsKHNpZ246IGtleW9mIFNpZ25UeXBlKSB7XG4gICAgICAgIGNvbnN0IHBvb2wgPSB0aGlzLl9wb29sRGljW3NpZ25dO1xuICAgICAgICBpZiAocG9vbCkge1xuICAgICAgICAgICAgcG9vbC5mcmVlQWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGtpbGwob2JqOiBvYmpQb29sLklPYmopOiB2b2lkIHtcbiAgICAgICAgY29uc3QgcG9vbCA9IHRoaXMuX3Bvb2xEaWNbb2JqLnBvb2xTaWduIGFzIGtleW9mIFNpZ25UeXBlXTtcbiAgICAgICAgaWYgKHBvb2wpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcG9vbC5raWxsKG9iaik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBfbG9nKG1zZzogc3RyaW5nLCBsZXZlbDogbnVtYmVyID0gMSkge1xuICAgICAgICBjb25zdCB0YWdTdHIgPSBcIlvlr7nosaHmsaDnrqHnkIblmahdXCI7XG4gICAgICAgIHN3aXRjaCAobGV2ZWwpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0YWdTdHIgKyBtc2cpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybih0YWdTdHIgKyBtc2cpO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGFnU3RyICsgbXNnKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGFnU3RyICsgbXNnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxufSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0lBQUE7S0FzS0M7SUFsS0csc0JBQVcsaUNBQVE7YUFBbkI7WUFDSSxPQUFPLElBQUksQ0FBQyxTQUFTLENB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
