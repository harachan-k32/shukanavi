import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 共有リンク生成
export const create = mutation({
    args: { data: v.string() },
    handler: async (ctx, args) => {
        // ランダムな共有IDを生成（8文字）
        const shareId =
            Math.random().toString(36).substring(2, 6) +
            Date.now().toString(36).substring(-4);

        await ctx.db.insert("shares", {
            shareId,
            data: args.data,
            createdAt: Date.now(),
        });

        return shareId;
    },
});

// 共有データ取得
export const get = query({
    args: { shareId: v.string() },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("shares")
            .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
            .first();
        return record ? record.data : null;
    },
});
