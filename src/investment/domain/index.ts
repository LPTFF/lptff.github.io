/**
 * Domain Model barrel——Investment OS Core 的统一类型出口。
 *
 * Adapter 把来源数据转换成这些标准化事实；Sensor/Sync/Ledger/Engines/Pages 只消费这些类型。
 */
export * from "./types";
