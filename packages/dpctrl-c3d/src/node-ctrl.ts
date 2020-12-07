import { } from "@ailhc/display-ctrl";
import { Node } from "cc";
export class NodeCtrl implements displayCtrl.ICtrl<Node> {
    key?: string;
    isLoading?: boolean;
    isLoaded?: boolean;
    isInited?: boolean;
    isAsyncShow?: boolean;
    isShowing?: boolean;
    isShowed?: boolean;
    needShow?: boolean;
    needLoad?: boolean;


    visible: boolean;

    protected node: Node;
    protected _mgr: displayCtrl.IMgr;
    constructor(dpcMgr?: displayCtrl.IMgr) {
        this._mgr = dpcMgr;
    }
    getRess?(): string[] {
        return undefined;
    }
    getNode(): Node {
        return this.node;
    }
    onInit(initData?: any): void {

    }
    onUpdate(updateData: any): void {
    }
    getFace<T = any>(): T {
        return this as any;
    }
    onDestroy(destroyRes?: boolean): void {

    }
    onShow(data?: any, endCb?: VoidFunction) {
        if (this.node) {
            this.node.active = true;
        }
        endCb && endCb();
    }

    onHide() {
        if (this.node) {
            this.node.active = false;
        }
    }
    forceHide() {
        this.node && (this.node.active = false);
        this.isShowed = false
    }
    onResize() {
    }
}