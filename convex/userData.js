import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ユーザーデータ取得
export const get = query({
    args: { sessionId: v.string() },
    handler: async (ctx, args) => {
        const record = await ctx.db
            .query("userData")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .first();
        return record ? record.data : null;
    },
});

// ユーザーデータ保存
export const save = mutation({
    args: { sessionId: v.string(), data: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("userData")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                data: args.data,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("userData", {
                sessionId: args.sessionId,
                data: args.data,
                updatedAt: Date.now(),
            });
        }
    },
});
