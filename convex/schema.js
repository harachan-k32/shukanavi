import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // ユーザーデータ（セッションIDで識別）
    userData: defineTable({
        sessionId: v.string(),
        data: v.string(), // JSON文字列で保存
        updatedAt: v.number(),
    }).index("by_session", ["sessionId"]),

    // 共有リンク
    shares: defineTable({
        shareId: v.string(),
        data: v.string(), // JSON文字列（スナップショット）
        createdAt: v.number(),
    }).index("by_shareId", ["shareId"]),
});
