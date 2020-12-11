declare global {
    namespace broadcast {
        interface IMsgKey {
            onListenerOn?: "onListenerOn",
        }
        interface IMsgValueType {
            onListenerOn?: string
        }

        type ResultCallBack = (data?: any, callBack?: any) => void
        type Listener<T = any> = (value: T, callBack?: ResultCallBack, ...args) => void
        /**
         * 将索引类型转换为任意类型的索引类型
         */
        type ToAnyIndexKey<IndexKey, AnyType> = IndexKey extends keyof AnyType ? IndexKey : keyof AnyType;
        interface IListenerHandler<keyType extends keyof any = any, ListenerValueTypeMapType = any> {
            key: keyType
            listener: Listener<ListenerValueTypeMapType[ToAnyIndexKey<keyType, ListenerValueTypeMapType>]>,
            context?: any,
            args?: any[],
            once?: boolean
        }
        interface IBroadcaster {
            key: string,
            handlers?: IListenerHandler[]
            value?: any,
            callback?: ResultCallBack,
            persistence?: boolean
        }
    }
}
export { }